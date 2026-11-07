"""
qualcomm_llm.py - one shared wrapper for the Qualcomm AI Playground (Imagine SDK).
Everyone on the team imports this file.

Needs: IMAGINE_API_KEY and IMAGINE_ENDPOINT_URL environment variables.
Optional: QC_MODEL (default Llama-3.1-8B).
If the key is missing or a call fails, every function returns a fallback,
so the demo never crashes.
"""
import ast, json, os, time, re

# Auto-load .env if not already set
if not os.environ.get("IMAGINE_API_KEY"):
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"').strip("'")
                    if k not in os.environ or not os.environ[k]:
                        os.environ[k] = v

if not os.environ.get("IMAGINE_API_KEY") and os.environ.get("INFERENCE_CLOUD_API_KEY"):
    os.environ["IMAGINE_API_KEY"] = os.environ["INFERENCE_CLOUD_API_KEY"]
if not os.environ.get("IMAGINE_API_ENDPOINT") and os.environ.get("INFERENCE_CLOUD_ENDPOINT"):
    os.environ["IMAGINE_API_ENDPOINT"] = os.environ["INFERENCE_CLOUD_ENDPOINT"]
    os.environ["IMAGINE_ENDPOINT_URL"] = os.environ["INFERENCE_CLOUD_ENDPOINT"]

MODEL = os.environ.get("QC_MODEL", "Llama-3.1-8B")
CALL_LOG = []                     # (kind, seconds) for every Qualcomm call -> shown in the demo

try:
    from imagine import ChatMessage, ImagineClient
    _endpoint = os.environ.get("IMAGINE_API_ENDPOINT") or os.environ.get("IMAGINE_ENDPOINT_URL")
    if os.environ.get("IMAGINE_API_KEY") and _endpoint:
        try:
            _client = ImagineClient(endpoint=_endpoint, timeout=60, max_retries=1)
        except TypeError:
            _client = ImagineClient(endpoint=_endpoint)
    else:
        _client = None
except Exception as e:            # SDK not installed or bad config
    print(f"[qualcomm_llm] SDK unavailable ({e}); running in fallback mode")
    _client = None

ONLINE = _client is not None
if not ONLINE:
    print("[qualcomm_llm] No IMAGINE_API_KEY set -> FALLBACK MODE (no Qualcomm calls)")


def ask(system, user, max_tokens=1200):
    """Plain chat call. Returns text, or None on failure."""
    if not ONLINE:
        return None
    msgs = [ChatMessage(role="system", content=system), ChatMessage(role="user", content=user)]
    t0 = time.time()
    try:
        r = None
        for kw in ({"max_tokens": max_tokens, "temperature": 0.1},
                   {}):
            try:
                r = _client.chat(messages=msgs, model=MODEL, **kw)
                break
            except Exception as e:           # this SDK/server doesn't accept one of the settings
                last_err = e
        if r is None:
            raise last_err
        dt = time.time() - t0
        CALL_LOG.append(("chat", dt))
        print(f"  [Qualcomm Cloud AI 100 · {MODEL} · {dt:.2f}s]")
        return r.first_content
    except Exception as e:
        print(f"  [Qualcomm chat failed: {e}]")
        return None


def _parse(text):
    """Pull a JSON object out of an LLM answer, tolerating code fences and minor issues."""
    t = text.replace("```json", "").replace("```", "").strip()
    start = t.find("{")
    if start < 0:
        raise ValueError("no '{' in answer")
    depth, end = 0, None                     # find the matching closing brace
    for i, ch in enumerate(t[start:], start):
        depth += ch == "{"
        depth -= ch == "}"
        if depth == 0:
            end = i
            break
    if end is None:
        raise ValueError("answer was cut off (no closing brace)")
    body = t[start:end + 1]
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        body2 = re.sub(r",\s*([}\]])", r"\1", body)          # trailing commas
        try:
            return json.loads(body2)
        except json.JSONDecodeError:
            return ast.literal_eval(body2.replace("true", "True").replace("false", "False")
                                         .replace("null", "None"))


def ask_json(system, user, fallback, max_tokens=1200):
    """Chat call that must return JSON. Retries once, then returns `fallback`."""
    for attempt in range(2):
        text = ask(system, user, max_tokens)
        if text is None:
            break
        try:
            return _parse(text), True
        except Exception as e:
            print(f"  [could not parse Qualcomm answer: {e}] first 200 chars: {text[:200]!r}")
            with open("qc_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\n===== parse error: {e}\n{text}\n")
    return fallback, False


def embed(texts, batch=16):
    """Qualcomm embeddings. Returns list of vectors, or None on failure."""
    if not ONLINE:
        return None
    out = []
    t0 = time.time()
    try:
        for i in range(0, len(texts), batch):
            r = _client.embeddings(texts[i:i + batch])
            out.extend(d.embedding for d in r.data)
        dt = time.time() - t0
        CALL_LOG.append(("embeddings", dt))
        print(f"  [Qualcomm embeddings · {len(texts)} texts · {dt:.2f}s]")
        return out
    except Exception as e:
        print(f"  [Qualcomm embeddings failed: {e}]")
        return None

FIELDS = ["ROOT_CAUSE", "CONFIDENCE", "EVIDENCE", "AFFECTED_KPIS", "FIXES", "EXPLANATION"]


def parse_lines(text):
    """Parse 'KEY: value' lines (no JSON - JSON answers get captured as tool calls by this server)."""
    vals, cur = {}, None
    for raw in text.replace("**", "").splitlines():
        line = raw.strip().lstrip("-* ").strip()
        key = line.split(":", 1)[0].strip().upper().replace(" ", "_") if ":" in line else None
        if key in FIELDS:
            cur = key
            vals[cur] = line.split(":", 1)[1].strip()
        elif cur and line:
            vals[cur] += " " + line                          # wrapped continuation line
    if not vals.get("ROOT_CAUSE"):
        raise ValueError("no ROOT_CAUSE line in answer")
    try:
        conf = float(re.findall(r"[0-9.]+", vals.get("CONFIDENCE", "0"))[0])
        conf = conf / 100 if conf > 1 else conf
    except Exception:
        conf = 0.0
    fixes = []
    for part in re.split(r";", vals.get("FIXES", "")):
        part = part.strip()
        if not part:
            continue
        m = re.match(r"([a-zA-Z_]+)\s*[-:–]\s*(.*)", part)
        fixes.append({"type": (m.group(1) if m else part).strip().lower(),
                      "reason": (m.group(2) if m else "").strip()})
    split = lambda v, sep: [x.strip() for x in v.split(sep) if x.strip()]
    return {"root_cause": vals["ROOT_CAUSE"].strip().strip(".\"'"),
            "confidence": conf,
            "evidence": split(vals.get("EVIDENCE", ""), "|"),
            "affected_kpis": split(vals.get("AFFECTED_KPIS", ""), ","),
            "suggested_fixes": fixes,
            "explanation": vals.get("EXPLANATION", "").strip()}


def ask_lines(system, user, fallback, max_tokens=800):
    """Chat call answered in 'KEY: value' lines -> dict. Retries once, then returns `fallback`."""
    for _ in range(2):
        text = ask(system, user, max_tokens)
        if not text:
            print("  [Qualcomm returned empty text]")
            continue
        try:
            return parse_lines(text), True
        except Exception as e:
            print(f"  [could not parse Qualcomm answer: {e}] first 200 chars: {text[:200]!r}")
            with open("qc_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\n===== parse error: {e}\n{text}\n")
    return fallback, False
