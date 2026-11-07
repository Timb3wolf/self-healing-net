import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8001"

def test_endpoint(method, path, body=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            code = r.status
            content = r.read().decode("utf-8")
            try:
                parsed = json.loads(content)
                summary = f"Keys: {list(parsed.keys()) if isinstance(parsed, dict) else f'List len {len(parsed)}'}"
            except:
                summary = content[:60]
            print(f"PASS [{method}] {path} -> {code} ({summary})")
            return True
    except urllib.error.HTTPError as e:
        print(f"FAIL [{method}] {path} -> {e.code}: {e.read().decode('utf-8')[:100]}")
        return False
    except Exception as e:
        print(f"ERROR [{method}] {path} -> {e}")
        return False

print("=== Running End-to-End API Health & Regression Suite ===")
results = []
results.append(test_endpoint("GET", "/"))
results.append(test_endpoint("GET", "/api/telemetry"))
results.append(test_endpoint("GET", "/api/telemetry/live"))
results.append(test_endpoint("GET", "/api/incident"))
results.append(test_endpoint("GET", "/api/candidate-actions"))
results.append(test_endpoint("GET", "/api/incidents/history"))
results.append(test_endpoint("GET", "/api/dataset/stats"))
results.append(test_endpoint("GET", "/api/dataset/samples?fault_type=Jamming&limit=3"))
results.append(test_endpoint("POST", "/api/chaos/trigger", {"type": "break_link", "target": "A-B", "intensity": 1.0}))
results.append(test_endpoint("POST", "/api/optimize", {"solver_mode": "QUANTUM_ANNEALER", "k_target": 1, "penalty_P": 1000.0}))
results.append(test_endpoint("POST", "/api/apply"))
results.append(test_endpoint("POST", "/api/dataset/inject", {"sample_index": 0, "fault_type": "Jamming", "target": "A-B"}))
results.append(test_endpoint("POST", "/api/reset"))

passed = sum(results)
total = len(results)
print(f"\nSummary: {passed}/{total} endpoints PASSED ({(passed/total)*100:.1f}%)")
if passed == total:
    print("ALL BACKEND ENDPOINTS ARE 100% OPERATIONAL!")
else:
    print(f"WARNING: {total - passed} endpoints failed!")
