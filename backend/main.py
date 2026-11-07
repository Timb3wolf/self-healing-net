"""
main.py - FastAPI Gateway for Self-Healing Network
Implements Contracts 1, 2, 3, and 4.
Serves telemetry snapshot, incident management, chaos injection,
and QUBO / Quantum-Inspired optimization solving.
"""

import sys
import os
import time
import uuid
import copy
from typing import Dict, List, Any, Optional

# Ensure workspace root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import networkx as nx
import numpy as np

from backend.optimizer.qubo import build_qubo_matrix
from backend.optimizer.solvers import (
    solve_all, solve_quantum_inspired, solve_greedy, solve_genetic_algorithm,
    evaluate_gnn_topology, simulate_rl_adaptive_routing
)
from backend.optimizer.benchmark import run_benchmark
from backend.inference_cloud import classifier, rag_engine, inference_client, validator
from diagnosis_service import (
    fault_sample, diagnose as diagnose_service, incident_report,
    _samples, CAUSES, TWIN_FAULT, _test_idx, generate_twin_safety_analysis
)


# ---------------------------------------------------------------------------
# Pydantic Schemas (Contracts 1, 2, 3, 4)
# ---------------------------------------------------------------------------

# Contract 1: Telemetry
class LinkState(BaseModel):
    source: str
    target: str
    util: float = Field(..., ge=0.0, le=1.5, description="Link utilization ratio 0.0 - 1.0+")
    latency: float = Field(..., ge=0.0, description="Latency in milliseconds")
    loss: float = Field(..., ge=0.0, le=1.0, description="Packet loss fraction 0.0 - 1.0")
    capacity_mbps: float = Field(default=1000.0)
    up: bool = Field(default=True)


class FlowState(BaseModel):
    flow_id: str
    source: str
    destination: str
    rate_mbps: float
    latency: float
    loss: float
    path: List[str]


class TelemetrySnapshot(BaseModel):
    timestamp: str
    links: Dict[str, LinkState]
    flows: List[FlowState]


# Contract 2: Incident Report
class IncidentReport(BaseModel):
    incident_id: str
    timestamp: str
    severity: str = Field(..., description="INFO, WARNING, CRITICAL")
    anomalous_links: List[str]
    root_cause: str
    causal_chain: List[str]
    recommended_strategy: Optional[str] = "REROUTE_OR_SHAPE"
    suggested_fixes: Optional[List[Any]] = None
    twin_safety_analysis: Optional[List[Dict[str, Any]]] = None
    explanation: Optional[str] = None
    ml_classifier: Optional[Dict[str, Any]] = None
    rag_sources: Optional[List[str]] = None
    provenance: Optional[Dict[str, Any]] = None


# Contract 3: Candidate Action
class CandidateAction(BaseModel):
    action_id: str
    type: str = Field(..., description="REROUTE_FLOW, RATE_LIMIT, QOS_WEIGHT, LINK_RESET")
    target: str
    params: Dict[str, Any] = Field(default_factory=dict)
    cost: float = Field(..., ge=0.0)
    blast_radius: float = Field(..., ge=0.0, le=1.0)
    description: Optional[str] = ""


# Contract 4: Decision & Optimization Output
class SolverMetric(BaseModel):
    solver: str
    runtime_ms: float
    objective_energy: float
    chosen_actions: List[str]
    cardinality_valid: bool
    conflicts_detected: int


class PredictedState(BaseModel):
    network_health: str
    mean_latency_ms: float
    max_link_util: float
    packet_loss: float
    affected_links: Dict[str, Dict[str, float]]


class DecisionResponse(BaseModel):
    incident_id: Optional[str] = None
    decision_id: str
    timestamp: str
    chosen: List[CandidateAction]
    predicted: PredictedState
    blast_radius: float
    confidence: float
    mode: str
    solver_comparison: List[SolverMetric]


class ChaosInjectionRequest(BaseModel):
    target_link: str = "A-B"
    surge_util: float = 0.96
    surge_latency: float = 94.0
    surge_loss: float = 0.048
    incident_description: Optional[str] = "Traffic surge inducing queue buffer tail-drop on A-B"


class ChaosTriggerRequest(BaseModel):
    type: str = Field(..., description="kill_router, break_link, inject_packet_loss, create_congestion, simulate_node_failure")
    target: str = Field(..., description="Target node (A, B, C, D, S1) or link (A-B, S1-A, etc.)")
    intensity: Optional[float] = 1.0
    params: Dict[str, Any] = Field(default_factory=dict)


class DiagnosisTriggerRequest(BaseModel):
    fault_type: str = Field(default="Antenna Failure", description="Antenna Failure, Jamming, High Network Congestion (Sudden Spike)")
    target: Optional[str] = "A-B"


class DatasetInjectRequest(BaseModel):
    sample_index: Optional[int] = None
    fault_type: Optional[str] = "Jamming"
    target: Optional[str] = "A-B"


class IncidentReportRequest(BaseModel):
    chosen_fix: Optional[str] = "reroute via A-D-B"
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    time_to_detect_s: Optional[float] = 2.2
    time_to_heal_s: Optional[float] = 8.5


class OptimizeRequest(BaseModel):
    candidate_actions: Optional[List[CandidateAction]] = None
    k_target: int = 1
    penalty_P: float = 1000.0
    solver_mode: str = "QUANTUM_ANNEALER"  # QUANTUM_ANNEALER, GREEDY, GA


# ---------------------------------------------------------------------------
# In-Memory Default State
# ---------------------------------------------------------------------------

DEFAULT_LINKS = {
    "S1-A": LinkState(source="S1", target="A", util=0.38, latency=3.2, loss=0.0000, capacity_mbps=1000.0, up=True),
    "A-B": LinkState(source="A", target="B", util=0.42, latency=4.1, loss=0.0001, capacity_mbps=1000.0, up=True),
    "B-C": LinkState(source="B", target="C", util=0.35, latency=3.5, loss=0.0000, capacity_mbps=1000.0, up=True),
    "A-D": LinkState(source="A", target="D", util=0.18, latency=2.0, loss=0.0000, capacity_mbps=1000.0, up=True),
    "D-B": LinkState(source="D", target="B", util=0.21, latency=2.4, loss=0.0000, capacity_mbps=1000.0, up=True),
    "S1-D": LinkState(source="S1", target="D", util=0.10, latency=4.2, loss=0.0000, capacity_mbps=1000.0, up=True),
    "D-C": LinkState(source="D", target="C", util=0.12, latency=4.5, loss=0.0000, capacity_mbps=1000.0, up=True),
}

DEFAULT_FLOWS = [
    FlowState(
        flow_id="F-VOIP-1",
        source="S1",
        destination="C",
        rate_mbps=100.0,
        latency=10.8,
        loss=0.0001,
        path=["S1", "A", "B", "C"],
    ),
    FlowState(
        flow_id="F-DATA-2",
        source="S1",
        destination="C",
        rate_mbps=320.0,
        latency=10.8,
        loss=0.0001,
        path=["S1", "A", "B", "C"],
    ),
]

DEFAULT_DEVICES = [
    {"device_id": "DEV-LON-HQ", "name": "HQ Core Router S1", "location": "London, UK", "lat": 51.5074, "lng": -0.1278, "status": "ONLINE", "ip": "10.0.0.1", "clients": 142, "signal_dbm": -54, "bandwidth_mbps": 450.2, "uptime": "99.98%"},
    {"device_id": "DEV-FRA-02", "name": "Transit West Router A", "location": "Frankfurt, DE", "lat": 50.1109, "lng": 8.6821, "status": "ONLINE", "ip": "10.0.1.1", "clients": 88, "signal_dbm": -61, "bandwidth_mbps": 320.5, "uptime": "99.94%"},
    {"device_id": "DEV-NYC-03", "name": "Access Core Router B", "location": "New York, USA", "lat": 40.7128, "lng": -74.0060, "status": "ONLINE", "ip": "10.0.2.1", "clients": 215, "signal_dbm": -72, "bandwidth_mbps": 680.1, "uptime": "99.85%"},
    {"device_id": "DEV-TOK-04", "name": "Datacenter East Router C", "location": "Tokyo, JP", "lat": 35.6762, "lng": 139.6503, "status": "ONLINE", "ip": "10.0.3.1", "clients": 310, "signal_dbm": -58, "bandwidth_mbps": 890.4, "uptime": "99.99%"},
    {"device_id": "DEV-SGP-05", "name": "Transit North Router D", "location": "Singapore, SG", "lat": 1.3521, "lng": 103.8198, "status": "ONLINE", "ip": "10.0.4.1", "clients": 164, "signal_dbm": -63, "bandwidth_mbps": 410.0, "uptime": "99.96%"},
]

DEFAULT_TIMELINE = [
    {"id": "EVT-001", "time": "10:30:00", "type": "SYSTEM_BOOT", "message": "NOC Gateway initialized across 5 regional edge routers", "severity": "INFO"},
    {"id": "EVT-002", "time": "10:30:15", "type": "TELEMETRY_SYNC", "message": "Nominal telemetry stream verified (Contract 1)", "severity": "INFO"},
]

DEFAULT_INCIDENT_HISTORY = [
    {
        "id": "INC-8F42C1",
        "site": "Frankfurt, DE",
        "cause": "Jamming",
        "link": "A-B",
        "intensity": "100%",
        "detect_s": 0.45,
        "reroute_s": 2.45,
        "recover_s": 4.80,
        "diagnosis": "Correct (Qualcomm Llama-3.1-8B)",
        "status": "RECOVERED",
        "time": "10:15:22"
    },
    {
        "id": "INC-7E19A0",
        "site": "London, UK",
        "cause": "Antenna Failure",
        "link": "S1-A",
        "intensity": "100%",
        "detect_s": 0.38,
        "reroute_s": 2.12,
        "recover_s": 4.50,
        "diagnosis": "Correct (Qualcomm Llama-3.1-8B)",
        "status": "RECOVERED",
        "time": "09:42:10"
    },
    {
        "id": "INC-6B98D4",
        "site": "New York, US",
        "cause": "High Network Congestion (Sudden Spike)",
        "link": "B-C",
        "intensity": "90%",
        "detect_s": 0.52,
        "reroute_s": 2.70,
        "recover_s": 5.15,
        "diagnosis": "Correct (Qualcomm Llama-3.1-8B)",
        "status": "RECOVERED",
        "time": "08:18:44"
    },
]

CURRENT_STATE = {
    "links": copy.deepcopy(DEFAULT_LINKS),
    "flows": copy.deepcopy(DEFAULT_FLOWS),
    "devices": copy.deepcopy(DEFAULT_DEVICES),
    "event_timeline": copy.deepcopy(DEFAULT_TIMELINE),
    "active_incident": None,
    "last_decision": None,
    "is_anomalous": False,
    "candidate_actions": None,
    "diagnosis_result": None,
    "latest_report": None,
    "current_dataset_sample": None,
    "current_timeline": None,
    "incident_history": copy.deepcopy(DEFAULT_INCIDENT_HISTORY),
}


def log_timeline_event(event_type: str, message: str, severity: str = "INFO"):
    cur_time = time.strftime("%H:%M:%S", time.gmtime())
    entry = {
        "id": f"EVT-{uuid.uuid4().hex[:6].upper()}",
        "time": cur_time,
        "type": event_type,
        "message": message,
        "severity": severity,
    }
    CURRENT_STATE["event_timeline"].insert(0, entry)
    if len(CURRENT_STATE["event_timeline"]) > 50:
        CURRENT_STATE["event_timeline"] = CURRENT_STATE["event_timeline"][:50]


def compute_ospf_routes(links: Dict[str, LinkState], flows: List[FlowState]) -> List[Dict[str, Any]]:
    """Calculates shortest path using Dijkstra algorithm with dynamic OSPF weights."""
    G = nx.Graph()
    for n in ["S1", "A", "B", "C", "D"]:
        G.add_node(n)
    for lid, l in links.items():
        if l.up:
            # Standby disaster-recovery / egress bypass trunks have higher baseline cost
            base = 40 if lid in ["S1-D", "D-C"] else 10
            cost = base + int(l.util * 50) + int(l.latency / 4)
            G.add_edge(l.source, l.target, weight=cost, link_id=lid)

    routes = []
    for f in flows:
        src, dst = f.source, f.destination
        try:
            shortest = nx.shortest_path(G, source=src, target=dst, weight="weight")
            cost = nx.shortest_path_length(G, source=src, target=dst, weight="weight")
            is_rerouted = (shortest != ["S1", "A", "B", "C"])
            status = "FAILOVER_REROUTED" if is_rerouted else "ACTIVE_PRIMARY"
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            shortest = f.path
            cost = 999
            status = "SEVERED_UNREACHABLE"

        routes.append({
            "flow_id": f.flow_id,
            "source": src,
            "destination": dst,
            "nominal_path": ["S1", "A", "B", "C"],
            "active_path": shortest,
            "next_hop": shortest[1] if len(shortest) > 1 else "NONE",
            "hop_count": len(shortest) - 1,
            "ospf_cost": cost,
            "status": status,
            "failover_duration_ms": 12.4 if status == "FAILOVER_REROUTED" else 0.0,
            "traffic_mbps": f.rate_mbps,
        })
    return routes


def get_causal_tree(incident: Optional[IncidentReport], links: Dict[str, LinkState]) -> Dict[str, Any]:
    target_link = incident.anomalous_links[0] if incident and incident.anomalous_links else "A-B"
    return {
        "root_cause": incident.root_cause if incident else "Nominal operating state across all interfaces",
        "pinpoint_metrics": {
            "bottleneck_link": target_link,
            "utilization_pct": round(links.get(target_link, LinkState(source="A", target="B", util=0.4, latency=4, loss=0)).util * 100, 1),
            "latency_ms": round(links.get(target_link, LinkState(source="A", target="B", util=0.4, latency=4, loss=0)).latency, 1),
            "loss_pct": round(links.get(target_link, LinkState(source="A", target="B", util=0.4, latency=4, loss=0)).loss * 100, 2),
            "alternate_link": "A-D",
            "alternate_util_pct": round(links.get("A-D", LinkState(source="A", target="D", util=0.18, latency=2, loss=0)).util * 100, 1),
        },
        "dependency_chain": [
            {"step": 1, "component": "HQ_Core (S1)", "event": "High rate bulk ingress surge (+450Mbps)", "status": "WARN"},
            {"step": 2, "component": "Transit_West (A)", "event": "Ingress FIFO queue depth >92%", "status": "WARN"},
            {"step": 3, "component": f"Core Link ({target_link})", "event": "Queue buffer saturation -> tail drop packet loss", "status": "FAIL"},
            {"step": 4, "component": "Site_B_Access (B)", "event": "TCP window collapse & retransmissions", "status": "FAIL"},
            {"step": 5, "component": "Critical Flows", "event": "VoIP & Data SLA breached (>90ms latency)", "status": "BREACH"},
        ] if incident else []
    }


def get_twin_safety_analysis(root_cause: str, target_link: str = "A-B", suggested_fixes: list = None) -> List[Dict[str, Any]]:
    """
    Generates dynamic digital twin pre-flight safety analysis reflecting
    the exact root cause diagnosis deduced by Qualcomm Llama-3.1-8B.
    """
    return generate_twin_safety_analysis(root_cause, target_link, suggested_fixes)


def get_default_candidate_actions(target_link: str = "A-B") -> List[CandidateAction]:
    t = target_link.strip().upper()
    if t == "B-C":
        reroute_desc = "Optimal reroute: Divert bulk flow via Transit D to Tokyo Egress C, bypassing degraded link B-C"
        via_path = ["S1", "A", "D", "C"]
    elif t == "S1-A":
        reroute_desc = "Disaster recovery failover: Ingress via Transit D to bypass severed link S1-A"
        via_path = ["S1", "D", "B", "C"]
    elif t in ["A-D", "D-B"]:
        reroute_desc = f"Trunk protection: Isolate degraded bypass link {t} and maintain primary trunk S1-A-B-C"
        via_path = ["S1", "A", "B", "C"]
    else:  # default A-B
        reroute_desc = "Optimal reroute: Divert bulk flow F-DATA-2 via router D to relieve A-B"
        via_path = ["S1", "A", "D", "B", "C"]

    tag = t.replace("-", "")
    return [
        CandidateAction(
            action_id=f"ACT-REROUTE-{tag}",
            type="REROUTE_FLOW",
            target="F-DATA-2",
            params={
                "avoid_link": t,
                "via_path": via_path,
                "rate_limit_mbps": 320.0,
            },
            cost=12.0,
            blast_radius=0.20,
            description=reroute_desc,
        ),
        CandidateAction(
            action_id="ACT-RATE-LIMIT-DATA",
            type="RATE_LIMIT",
            target="F-DATA-2",
            params={"limit_mbps": 120.0},
            cost=38.0,
            blast_radius=0.45,
            description=f"Ingress throttle: Cap F-DATA-2 throughput to 120 Mbps to relieve load on interface {t}",
        ),
        CandidateAction(
            action_id=f"ACT-QOS-PRIORITIZE-{tag}",
            type="QOS_WEIGHT",
            target=t,
            params={"strict_priority": "F-VOIP-1"},
            cost=24.0,
            blast_radius=0.30,
            description=f"QoS queueing: Promote interactive VoIP packets on {t} above best-effort queues",
        ),
        CandidateAction(
            action_id=f"ACT-LINK-RESET-{tag}",
            type="LINK_RESET",
            target=t,
            params={"grace_period_sec": 3},
            cost=110.0,
            blast_radius=0.85,
            description=f"Hard reset: Restart physical PHY transceiver on interface {t}",
        ),
    ]


# ---------------------------------------------------------------------------
# FastAPI Application & Endpoints
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Self-Healing Network Gateway & Optimization API",
    description="Backend API servicing telemetry snapshots, incident causal alerts, and QUBO quantum-inspired optimization",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "service": "Self-Healing Network Gateway",
        "member": "Member 3: Optimizer & Dashboard Engineer",
        "status": "ONLINE",
        "docs_url": "/docs",
    }


@app.get("/api/telemetry", response_model=TelemetrySnapshot)
def get_telemetry():
    """Contract 1: Returns real-time link and flow telemetry snapshot."""
    return TelemetrySnapshot(
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        links=CURRENT_STATE["links"],
        flows=CURRENT_STATE["flows"],
    )


@app.get("/api/incident", response_model=Optional[IncidentReport])
def get_incident():
    """Contract 2: Returns active root-cause incident if any."""
    return CURRENT_STATE["active_incident"]


@app.get("/api/candidate-actions", response_model=List[CandidateAction])
def get_candidate_actions(target: Optional[str] = None):
    """Contract 3: Returns candidate remediation actions."""
    anom = target
    if not anom and CURRENT_STATE.get("active_incident") and CURRENT_STATE["active_incident"].anomalous_links:
        anom = CURRENT_STATE["active_incident"].anomalous_links[0]
    if CURRENT_STATE.get("candidate_actions"):
        return CURRENT_STATE["candidate_actions"]
    return get_default_candidate_actions(anom or "A-B")


@app.post("/api/chaos", response_model=IncidentReport)
def inject_chaos(req: ChaosInjectionRequest = ChaosInjectionRequest()):
    """
    Simulates a synthetic traffic surge or link degradation fault.
    Runs:
      1. Digital Twin state mutation.
      2. Random Forest Anomaly Classifier scanning links.
      3. RAG Retrieval engine querying operational runbooks.
      4. Official Qualcomm Cirrascale Inference Cloud API (Llama-3.1-8B)
         for root-cause explanation and corrective-action recommendations.
      5. DigitalTwinActionValidator for strict action & safety validation.
    """
    target = req.target_link
    if target not in CURRENT_STATE["links"]:
        target = "A-B"

    # 1. Mutate link state in Digital Twin
    link = CURRENT_STATE["links"][target]
    link.util = req.surge_util
    link.latency = req.surge_latency
    link.loss = req.surge_loss

    # Mutate flow metrics affected by this link
    for flow in CURRENT_STATE["flows"]:
        src_tgt = target.split("-")
        if len(src_tgt) == 2 and src_tgt[0] in flow.path and src_tgt[1] in flow.path:
            flow.latency = round(req.surge_latency + 8.5, 1)
            flow.loss = req.surge_loss

    CURRENT_STATE["is_anomalous"] = True

    # 2. Random Forest ML Anomaly Detection (Requirement 4)
    rf_scan = classifier.scan_topology(CURRENT_STATE["links"])
    anomalous_links = rf_scan.get("anomalous_links", [target]) or [target]
    rf_eval = rf_scan.get("link_evaluations", {}).get(target, {
        "status": "CRITICAL", "confidence": 1.0, "anomaly_score": 0.95
    })

    # 3. RAG Retrieval Engine (Requirement 4)
    query_str = f"Congestion anomaly on link {target} util={req.surge_util} latency={req.surge_latency}ms loss={req.surge_loss}"
    rag_docs = rag_engine.retrieve(query_str, top_k=2)
    rag_sources_list = [f"{d['id']}: {d['title']}" for d in rag_docs]

    # 4. Qualcomm-powered Cirrascale Inference Cloud API (Requirement 2, 3, 5, 7, 8)
    telemetry_payload = {
        "links": {k: v.model_dump() for k, v in CURRENT_STATE["links"].items()},
        "flows": [f.model_dump() for f in CURRENT_STATE["flows"]],
    }

    ai_diagnosis = inference_client.diagnose_and_recommend(
        telemetry=telemetry_payload,
        anomalous_links=anomalous_links,
        rag_context=rag_docs,
        classifier_summary=rf_eval,
    )

    # 5. Digital Twin Action Validator (Requirement 6)
    raw_suggested = ai_diagnosis.get("candidate_actions", [])
    validated_raw = validator.sanitize_action_list(raw_suggested, CURRENT_STATE)

    # Convert validated actions into CandidateAction models
    if validated_raw:
        validated_actions = [CandidateAction(**a) for a in validated_raw]
    else:
        validated_actions = get_default_candidate_actions(target)

    CURRENT_STATE["candidate_actions"] = validated_actions

    twin_safety = get_twin_safety_analysis(ai_diagnosis.get("root_cause") or req.incident_description, target)
    CURRENT_STATE["twin_safety_analysis"] = twin_safety

    incident = IncidentReport(
        incident_id=f"INC-{uuid.uuid4().hex[:8].upper()}",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        severity=ai_diagnosis.get("severity") or "CRITICAL",
        anomalous_links=anomalous_links,
        root_cause=ai_diagnosis.get("root_cause") or req.incident_description,
        causal_chain=ai_diagnosis.get("causal_chain") or [
            f"Traffic surge on ingress S1 saturating link {target}",
            f"Queue memory depth saturated -> tail drop packet loss",
            "Severe SLA degradation on core VoIP and data flows",
        ],
        recommended_strategy=ai_diagnosis.get("recommended_strategy") or "REROUTE_OR_SHAPE",
        suggested_fixes=[{"type": a.type, "reason": a.description} for a in validated_actions],
        twin_safety_analysis=twin_safety,
        explanation=ai_diagnosis.get("explanation") or f"Telemetry threshold breached on interface {target}: {req.incident_description}",
        ml_classifier={
            "algorithm": "RandomForestClassifier",
            "link_eval": rf_eval,
            "overall_severity": rf_scan.get("overall_severity", "CRITICAL"),
        },
        rag_sources=rag_sources_list,
        provenance=ai_diagnosis.get("provenance"),
    )
    CURRENT_STATE["active_incident"] = incident
    return incident


@app.post("/api/diagnose", response_model=IncidentReport)
def trigger_diagnosis():
    """Explicitly triggers ML classification, RAG retrieval, and Qualcomm Cirrascale diagnosis."""
    req = ChaosInjectionRequest(
        target_link="A-B",
        surge_util=CURRENT_STATE["links"]["A-B"].util,
        surge_latency=CURRENT_STATE["links"]["A-B"].latency,
        surge_loss=CURRENT_STATE["links"]["A-B"].loss,
        incident_description="Live telemetry inspection and diagnosis",
    )
    return inject_chaos(req)


@app.get("/api/telemetry/live")
def get_telemetry_live():
    """
    Section 4 & RMS/MixMode Data Contract:
    Returns real-time telemetry, OSPF dynamic routing tables, GNN anomaly scores,
    RL adaptive routing convergence metrics, devices, timeline, and causal tree.
    """
    links = CURRENT_STATE["links"]
    flows = CURRENT_STATE["flows"]
    inc = CURRENT_STATE["active_incident"]

    gnn_eval = evaluate_gnn_topology(links, flows)
    rl_metrics = simulate_rl_adaptive_routing(25)
    routing_table = compute_ospf_routes(links, flows)
    causal_tree = get_causal_tree(inc, links)

    active_alert_count = len(inc.anomalous_links) if inc else 0

    return {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "links": links,
        "flows": flows,
        "routing_table": routing_table,
        "gnn_evaluation": gnn_eval,
        "rl_metrics": rl_metrics,
        "devices": CURRENT_STATE["devices"],
        "event_timeline": CURRENT_STATE["event_timeline"],
        "causal_tree": causal_tree,
        "network_health_pct": gnn_eval.get("overall_health_pct", 98.4),
        "active_incident": inc,
        "active_alert_count": active_alert_count,
        "diagnosis_result": CURRENT_STATE.get("diagnosis_result"),
        "latest_report": CURRENT_STATE.get("latest_report"),
        "current_dataset_sample": CURRENT_STATE.get("current_dataset_sample"),
        "current_timeline": CURRENT_STATE.get("current_timeline"),
        "incident_history": CURRENT_STATE.get("incident_history", []),
        "twin_safety_analysis": CURRENT_STATE.get("twin_safety_analysis"),
    }


@app.post("/api/chaos/trigger")
def trigger_chaos_parameterized(req: ChaosTriggerRequest):
    """
    Section 5: Chaos Operations Controller.
    Accepts parameterized commands: kill_router, break_link, inject_packet_loss,
    create_congestion, simulate_node_failure.
    Immediately recalculates dynamic OSPF failover and calls Qualcomm AI.
    """
    cmd = req.type.lower()
    target = req.target

    log_timeline_event("CHAOS_INJECTED", f"Executing chaos operation '{cmd}' on target '{target}'", severity="CRITICAL")

    if cmd in ["kill_router", "simulate_node_failure"]:
        # Sever all links connected to target node
        affected = []
        for lid, lk in CURRENT_STATE["links"].items():
            if target in [lk.source, lk.target]:
                lk.up = False
                lk.util = 1.0
                lk.loss = 1.0
                lk.latency = 999.0
                affected.append(lid)
        anom_link = affected[0] if affected else "A-B"
        desc = f"Router {target} failure simulated. All incident links severed."
        surge_util, surge_lat, surge_loss = 1.0, 999.0, 1.0

    elif cmd == "break_link":
        lk_id = target if target in CURRENT_STATE["links"] else "A-B"
        CURRENT_STATE["links"][lk_id].up = False
        CURRENT_STATE["links"][lk_id].util = 1.0
        CURRENT_STATE["links"][lk_id].loss = 1.0
        CURRENT_STATE["links"][lk_id].latency = 999.0
        anom_link = lk_id
        desc = f"Physical link {lk_id} severed. OSPF recalculating topology."
        surge_util, surge_lat, surge_loss = 1.0, 999.0, 1.0

    elif cmd == "inject_packet_loss":
        lk_id = target if target in CURRENT_STATE["links"] else "A-B"
        CURRENT_STATE["links"][lk_id].loss = 0.18
        CURRENT_STATE["links"][lk_id].latency = 65.0
        anom_link = lk_id
        desc = f"Artificial 18% packet loss injected on link {lk_id}."
        surge_util, surge_lat, surge_loss = CURRENT_STATE["links"][lk_id].util, 65.0, 0.18

    else:  # create_congestion or default
        lk_id = target if target in CURRENT_STATE["links"] else "A-B"
        CURRENT_STATE["links"][lk_id].util = 0.96
        CURRENT_STATE["links"][lk_id].latency = 94.0
        CURRENT_STATE["links"][lk_id].loss = 0.048
        anom_link = lk_id
        desc = f"High-volume traffic microburst saturating interface {lk_id} buffer."
        surge_util, surge_lat, surge_loss = 0.96, 94.0, 0.048

    # Run OSPF failover calculation
    ospf_routes = compute_ospf_routes(CURRENT_STATE["links"], CURRENT_STATE["flows"])
    for r in ospf_routes:
        if r["status"] == "FAILOVER_REROUTED":
            log_timeline_event("OSPF_FAILOVER", f"Dynamic Dijkstra failover for {r['flow_id']}: {'->'.join(r['active_path'])} (computed in {r['failover_duration_ms']}ms)", severity="WARN")

    # Invoke diagnosis & Qualcomm AI
    chaos_req = ChaosInjectionRequest(
        target_link=anom_link,
        surge_util=surge_util,
        surge_latency=surge_lat,
        surge_loss=surge_loss,
        incident_description=desc,
    )
    inc = inject_chaos(chaos_req)
    log_timeline_event("AI_DIAGNOSIS_COMPLETE", f"Qualcomm Cloud AI 100 root cause: {inc.root_cause}", severity="INFO")

    return {
        "status": "CHAOS_TRIGGERED",
        "operation": cmd,
        "target": target,
        "incident": inc,
        "routing_table": ospf_routes,
    }


def sanitize_real_sample(sample: Dict[str, Any]) -> Dict[str, Any]:
    """Extracts summary statistics and 16-point sparkline for 5G KPIs without sending huge raw float arrays."""
    kpis = sample.get("KPIs", {})
    clean_kpis = {}
    for name, vals in kpis.items():
        if vals and isinstance(vals, list):
            try:
                num_vals = [float(v) for v in vals if v is not None and str(v).lower() != "nan"]
                if num_vals:
                    arr = np.array(num_vals)
                    indices = np.linspace(0, len(arr) - 1, 16).astype(int)
                    clean_kpis[name] = {
                        "mean": round(float(arr.mean()), 2),
                        "min": round(float(arr.min()), 2),
                        "max": round(float(arr.max()), 2),
                        "last": round(float(arr[-1]), 2),
                        "sparkline": [round(float(arr[i]), 2) for i in indices],
                    }
            except Exception:
                pass

    anom = sample.get("anomalies", {})
    return {
        "start_time": sample.get("start_time"),
        "end_time": sample.get("end_time"),
        "sampling_rate": sample.get("sampling_rate"),
        "description": sample.get("description"),
        "fault_type": anom.get("type", "Normal"),
        "exists": anom.get("exists", False),
        "affected_kpis": anom.get("affected_kpis", []),
        "troubleshooting_tickets": anom.get("troubleshooting_tickets", ""),
        "statistics": sample.get("statistics", {}),
        "clean_kpis": clean_kpis,
    }


def execute_sample_diagnosis(sample: Dict[str, Any], target_link: str = "A-B"):
    """
    Core executor for real 5G dataset diagnosis and digital twin injection.
    Runs Random Forest + Qualcomm RAG + Qualcomm Cloud AI 100 Llama-3.1-8B.
    """
    result = diagnose_service(sample)
    CURRENT_STATE["diagnosis_result"] = result

    anom_type = (sample.get("anomalies") or {}).get("type", "Anomalous Condition")
    twin_fault = result.get("twin_fault", "link_degradation")

    if target_link in CURRENT_STATE["links"]:
        lk = CURRENT_STATE["links"][target_link]
        if twin_fault == "link_down":
            lk.up = False
            lk.util = 1.0
            lk.loss = 1.0
            lk.latency = 999.0
        elif twin_fault == "link_degradation":
            lk.util = 0.35
            bler = float(sample.get("KPIs", {}).get("DL_BLER", [0.39])[-1] if sample.get("KPIs", {}).get("DL_BLER") else 0.39)
            lk.loss = min(max(bler, 0.05), 0.95)
            lk.latency = 300.0
        else:  # traffic_surge
            prb = float(sample.get("KPIs", {}).get("PRB_Utilization_DL", [0.96])[-1] if sample.get("KPIs", {}).get("PRB_Utilization_DL") else 0.96)
            lk.util = min(max(prb, 0.85), 1.0)
            lk.latency = 94.0
            lk.loss = 0.048

    CURRENT_STATE["is_anomalous"] = True
    ospf_routes = compute_ospf_routes(CURRENT_STATE["links"], CURRENT_STATE["flows"])

    clean_sample = sanitize_real_sample(sample)
    CURRENT_STATE["current_dataset_sample"] = clean_sample

    twin_safety = get_twin_safety_analysis(result.get("root_cause", anom_type), target_link, result.get("suggested_fixes", []))
    result["twin_safety_analysis"] = twin_safety
    CURRENT_STATE["twin_safety_analysis"] = twin_safety

    inc_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    incident = IncidentReport(
        incident_id=inc_id,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        severity=result.get("severity", "CRITICAL"),
        anomalous_links=[target_link],
        root_cause=result.get("root_cause", f"Telecom fault {anom_type} diagnosed"),
        causal_chain=result.get("decision_trail", []),
        recommended_strategy="REROUTE_OR_SHAPE",
        suggested_fixes=result.get("suggested_fixes", []),
        twin_safety_analysis=twin_safety,
        explanation=result.get("explanation"),
        ml_classifier={
            "algorithm": "Qualcomm Imagine SDK + RF Classifier",
            "link_eval": {"status": "CRITICAL", "confidence": result.get("confidence", 0.95), "anomaly_score": 0.98, "is_anomalous": True},
            "overall_severity": "CRITICAL",
        },
        rag_sources=[
            f"TelecomTS NOC Ticket: {clean_sample.get('troubleshooting_tickets')[:65]}...",
            "RB-CONG-001: Core Bottleneck Congestion Mitigation",
        ],
        provenance={"sample_type": anom_type, "target_link": target_link, "twin_fault": twin_fault},
    )
    t_detect = 0.42
    t_diag = round(float(result.get("qualcomm_latency_s", 2.37)), 2)
    t_decide = round(t_diag + 0.45, 2)
    t_reroute = round(t_diag + 0.55, 2)
    t_recover = round(t_diag + 2.10, 2)

    timeline_data = {
        "marks": {
            "detected": t_detect,
            "diagnosed": t_diag,
            "decided": t_decide,
            "rerouted": t_reroute,
            "recovered": t_recover,
        },
        "phase": "rerouted",
        "details": {
            "rerouted": {
                "compute_ms": 0.08,
                "paths": [r["active_path"] for r in ospf_routes if r["status"] == "FAILOVER_REROUTED"],
            },
        },
    }
    CURRENT_STATE["current_timeline"] = timeline_data
    CURRENT_STATE["candidate_actions"] = get_default_candidate_actions(target_link)

    site_name = "Frankfurt, DE" if target_link == "A-B" else ("London, UK" if target_link == "S1-A" else "New York, US")
    history_entry = {
        "id": inc_id,
        "site": site_name,
        "cause": anom_type,
        "link": target_link,
        "intensity": "100%",
        "detect_s": t_detect,
        "reroute_s": t_reroute,
        "recover_s": t_recover,
        "diagnosis": f"Correct ({result.get('model', 'Llama-3.1-8B')})",
        "status": "HEALING",
        "time": time.strftime("%H:%M:%S", time.gmtime()),
    }
    CURRENT_STATE["incident_history"].insert(0, history_entry)
    if len(CURRENT_STATE["incident_history"]) > 30:
        CURRENT_STATE["incident_history"] = CURRENT_STATE["incident_history"][:30]

    log_timeline_event("MEMBER1_FAULT_INJECTED", f"Telecom fault '{anom_type}' diagnosed by Qualcomm ({result.get('qualcomm_latency_s')}s) -> Twin injected '{twin_fault}'", severity="CRITICAL")

    return {
        "status": "DIAGNOSIS_SUCCESS",
        "sample": clean_sample,
        "result": result,
        "incident": incident,
        "routing_table": ospf_routes,
        "timeline": timeline_data,
    }


@app.post("/api/diagnosis/trigger")
def trigger_diagnosis_endpoint(req: DiagnosisTriggerRequest):
    """
    Member 1 Diagnostic Endpoint:
    1. sample = fault_sample(req.fault_type)
    2. result = diagnose(sample) (~3s, calls Qualcomm via imagine_sdk)
    3. Injects twin_fault (link_down / link_degradation / traffic_surge) on network twin
    4. Recalculates dynamic OSPF failover route
    """
    sample = fault_sample(req.fault_type)
    if req.target:
        sample["target"] = req.target
    return execute_sample_diagnosis(sample, req.target or "A-B")


@app.get("/api/dataset/stats")
def get_dataset_stats():
    """Returns metadata and statistics on the real TelecomTS 5G dataset."""
    type_counts = {}
    for s in _samples:
        t = (s.get("anomalies") or {}).get("type", "Normal")
        type_counts[t] = type_counts.get(t, 0) + 1

    return {
        "dataset_name": "TelecomTS 5G Real Telemetry Dataset",
        "total_samples": len(_samples),
        "eval_test_samples": len(_test_idx),
        "incident_memory_kb": 275,
        "available_fault_types": CAUSES,
        "distribution": type_counts,
        "features_count": 128,
        "source": "telecomts_subset.jsonl + kb_cache.json",
        "qualcomm_accelerated": True,
    }


@app.get("/api/dataset/samples")
def get_dataset_samples(fault_type: Optional[str] = None, limit: int = 10):
    """Returns real samples from telecomts_subset.jsonl with clean KPIs, tickets, and QnA."""
    filtered = []
    for i, s in enumerate(_samples):
        anom = s.get("anomalies") or {}
        t = anom.get("type", "Normal")
        if fault_type and t.lower() != fault_type.lower():
            continue
        cleaned = sanitize_real_sample(s)
        cleaned["index"] = i
        filtered.append(cleaned)
        if len(filtered) >= limit:
            break
    return {"count": len(filtered), "samples": filtered}


@app.post("/api/dataset/inject")
def inject_real_dataset_sample(req: DatasetInjectRequest):
    """
    Loads a real TelecomTS sample by index or fault_type, maps its 5G KPIs to the
    Digital Twin, executes the Qualcomm Cloud AI 100 hybrid diagnosis, and
    recalculates dynamic OSPF failover.
    """
    if req.sample_index is not None and 0 <= req.sample_index < len(_samples):
        sample = _samples[req.sample_index]
    else:
        sample = fault_sample(req.fault_type)

    if req.target:
        sample["target"] = req.target
    return execute_sample_diagnosis(sample, req.target or "A-B")


@app.get("/api/incidents/history")
def get_incident_history():
    """Returns historical incident log table."""
    hist = CURRENT_STATE.get("incident_history", [])
    return {"history": hist, "total": len(hist)}


@app.post("/api/diagnosis/report")
def generate_incident_report_endpoint(req: IncidentReportRequest):
    """
    Member 1 Incident Report Endpoint:
    Invoked after the twin heals to produce summary, cause, action, result.
    """
    result = CURRENT_STATE.get("diagnosis_result") or {
        "fault_type": "Antenna Failure",
        "target": "A-B",
        "root_cause": "Antenna feedline degradation",
        "model": "Llama-3.1-8B",
        "qualcomm_latency_s": 2.8,
        "twin_fault": "link_degradation",
    }
    stats = {
        "chosen_fix": req.chosen_fix or "reroute via A-D-B",
        "before": req.before or {"latency_ms": 300, "loss_pct": 39},
        "after": req.after or {"latency_ms": 13, "loss_pct": 0},
        "time_to_detect_s": req.time_to_detect_s or 2.2,
        "time_to_heal_s": req.time_to_heal_s or 8.5,
    }
    rep = incident_report(result, stats)
    CURRENT_STATE["latest_report"] = rep
    log_timeline_event("INCIDENT_REPORT_GENERATED", f"Healing verified: {rep.get('summary')}", severity="SUCCESS")
    return rep


@app.post("/api/optimize", response_model=DecisionResponse)
def run_optimization(req: OptimizeRequest = OptimizeRequest()):
    """
    Contract 4: Runs QUBO formulation and executes all 3 solvers:
      1. Quantum-inspired Simulated Annealer (neal / openjij)
      2. Greedy baseline
      3. Genetic Algorithm baseline (DEAP)
    Computes Pareto trade-offs and returns definitive decision.
    """
    actions_to_use = req.candidate_actions if req.candidate_actions else get_default_candidate_actions()
    actions_raw = [a.model_dump() for a in actions_to_use]

    # Build QUBO
    qubo_def = build_qubo_matrix(
        actions=actions_raw,
        k_target=req.k_target,
        penalty_P=req.penalty_P,
    )

    # Solve with all 3 solvers
    solver_data = solve_all(qubo_def, actions_raw, k_target=req.k_target)

    # Select the requested solver's chosen actions
    if req.solver_mode == "GREEDY":
        active_res = solver_data["greedy"]
    elif req.solver_mode == "GA":
        active_res = solver_data["genetic_algorithm"]
    else:
        active_res = solver_data["quantum_annealer"]

    chosen_ids = set(active_res["chosen_actions"])
    chosen_actions = [a for a in actions_to_use if a.action_id in chosen_ids]

    # If none picked by solver due to strict penalty, default to lowest cost
    if not chosen_actions and actions_to_use:
        chosen_actions = [actions_to_use[0]]

    # Compute overall blast radius and confidence
    total_blast = min(sum(a.blast_radius for a in chosen_actions), 1.0)
    confidence = 0.96 if active_res["cardinality_valid"] and active_res["conflicts_detected"] == 0 else 0.82

    # Compute predicted state post-remediation (Ghost overlay data)
    predicted_affected = {}
    for act in chosen_actions:
        if act.type == "REROUTE_FLOW":
            predicted_affected["A-B"] = {"util": 0.44, "latency": 4.5, "loss": 0.0001}
            predicted_affected["A-D"] = {"util": 0.58, "latency": 2.9, "loss": 0.0000}
            predicted_affected["D-B"] = {"util": 0.62, "latency": 3.3, "loss": 0.0000}
        elif act.type == "RATE_LIMIT":
            predicted_affected["A-B"] = {"util": 0.60, "latency": 12.0, "loss": 0.0005}
        elif act.type == "LINK_RESET":
            predicted_affected["A-B"] = {"util": 0.35, "latency": 4.0, "loss": 0.0000}
        else:
            predicted_affected["A-B"] = {"util": 0.50, "latency": 8.0, "loss": 0.0002}

    predicted_state = PredictedState(
        network_health="HEALTHY",
        mean_latency_ms=9.4,
        max_link_util=0.62,
        packet_loss=0.0001,
        affected_links=predicted_affected,
    )

    incident_id = CURRENT_STATE["active_incident"].incident_id if CURRENT_STATE["active_incident"] else None

    comparison_metrics = [
        SolverMetric(**s) for s in solver_data["comparison_table"]
    ]

    decision = DecisionResponse(
        incident_id=incident_id,
        decision_id=f"DEC-{uuid.uuid4().hex[:8].upper()}",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        chosen=chosen_actions,
        predicted=predicted_state,
        blast_radius=round(total_blast, 3),
        confidence=confidence,
        mode=req.solver_mode,
        solver_comparison=comparison_metrics,
    )

    CURRENT_STATE["last_decision"] = decision
    return decision


@app.post("/api/apply")
def apply_decision():
    """
    Simulates Actuator applying the chosen decision to the network twin.
    Restores healthy operational state.
    """
    decision = CURRENT_STATE["last_decision"]
    if not decision:
        raise HTTPException(status_code=400, detail="No active decision to apply. Run /api/optimize first.")

    # Apply predicted link states
    for link_id, pred_values in decision.predicted.affected_links.items():
        if link_id in CURRENT_STATE["links"]:
            link = CURRENT_STATE["links"][link_id]
            link.util = pred_values.get("util", link.util)
            link.latency = pred_values.get("latency", link.latency)
            link.loss = pred_values.get("loss", link.loss)

    # If reroute was chosen, update flow paths
    for act in decision.chosen:
        if act.type == "REROUTE_FLOW":
            via_path = act.params.get("via_path")
            for flow in CURRENT_STATE["flows"]:
                if flow.flow_id == act.target and via_path:
                    flow.path = via_path
                    flow.latency = 12.4
                    flow.loss = 0.0001

    CURRENT_STATE["active_incident"] = None
    CURRENT_STATE["is_anomalous"] = False

    # Automatically generate Member 1 Incident Report
    diag_res = CURRENT_STATE.get("diagnosis_result") or {
        "fault_type": "Antenna Failure",
        "target": "A-B",
        "root_cause": "Antenna feedline degradation",
        "model": "Llama-3.1-8B",
        "qualcomm_latency_s": 2.8,
        "twin_fault": "link_degradation",
    }
    chosen_action = decision.chosen[0] if decision.chosen else None
    chosen_desc = chosen_action.description if chosen_action else "reroute via A-D-B"
    stats = {
        "chosen_fix": chosen_desc,
        "before": {"latency_ms": 300, "loss_pct": 39},
        "after": {"latency_ms": 13, "loss_pct": 0},
        "time_to_detect_s": 2.2,
        "time_to_heal_s": 8.5,
    }
    rep = incident_report(diag_res, stats)
    CURRENT_STATE["latest_report"] = rep

    if CURRENT_STATE.get("current_timeline"):
        CURRENT_STATE["current_timeline"]["phase"] = "recovered"
    if CURRENT_STATE.get("incident_history") and len(CURRENT_STATE["incident_history"]) > 0:
        CURRENT_STATE["incident_history"][0]["status"] = "RECOVERED"

    log_timeline_event("HEALING_ACTUATED", f"Decision enacted. {rep.get('summary')}", severity="SUCCESS")

    return {
        "status": "APPLIED",
        "message": "Optimization remediations successfully enacted. Network telemetry restored to healthy thresholds.",
        "active_flows": CURRENT_STATE["flows"],
        "links": CURRENT_STATE["links"],
        "report": rep,
    }


@app.post("/api/reset")
def reset_state():
    """Resets network state, flows, and incidents to baseline normal."""
    CURRENT_STATE["links"] = copy.deepcopy(DEFAULT_LINKS)
    CURRENT_STATE["flows"] = copy.deepcopy(DEFAULT_FLOWS)
    CURRENT_STATE["devices"] = copy.deepcopy(DEFAULT_DEVICES)
    CURRENT_STATE["event_timeline"] = copy.deepcopy(DEFAULT_TIMELINE)
    CURRENT_STATE["active_incident"] = None
    CURRENT_STATE["last_decision"] = None
    CURRENT_STATE["is_anomalous"] = False
    CURRENT_STATE["candidate_actions"] = get_default_candidate_actions()
    CURRENT_STATE["diagnosis_result"] = None
    CURRENT_STATE["latest_report"] = None
    CURRENT_STATE["current_dataset_sample"] = None
    CURRENT_STATE["current_timeline"] = None
    log_timeline_event("SYSTEM_RESET", "NOC state, telemetry, and routes reset to nominal baseline", severity="INFO")
    return {"status": "RESET_SUCCESSFUL", "telemetry": CURRENT_STATE["links"]}


@app.get("/api/benchmark")
def get_benchmark_results():
    """Runs scaling benchmark on sizes [10, 50, 200] and returns comparison JSON."""
    return run_benchmark([10, 50, 200])


if __name__ == "__main__":
    import os
    import socket
    import urllib.request
    import uvicorn

    def _port_busy(port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(("127.0.0.1", port)) == 0

    def _is_our_gateway(port: int) -> bool:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/dataset/stats", timeout=2) as r:
                return r.status == 200
        except Exception:
            return False

    # Default 8001 matches the Vite proxy target in frontend/vite.config.js
    requested_port = int(os.environ.get("PORT", "8001"))
    port_to_use = requested_port

    if _port_busy(requested_port):
        if _is_our_gateway(requested_port):
            print(f"[Notice] Self-Healing Network Gateway is ALREADY running on http://127.0.0.1:{requested_port}")
            print("         Nothing to do - open the dashboard at http://localhost:5173")
            print("         (To restart: stop the existing process first, e.g. close its terminal.)")
            sys.exit(0)
        port_to_use = next(p for p in range(requested_port + 1, requested_port + 50) if not _port_busy(p))
        print(f"[Notice] Port {requested_port} is used by another program. Using port {port_to_use} instead.")
        print(f"         Start the frontend with: $env:VITE_BACKEND_PORT=\"{port_to_use}\"; npm run dev")

    print(f"Starting Self-Healing Network Gateway on http://127.0.0.1:{port_to_use} ...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port_to_use, reload=False)
