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

from backend.optimizer.qubo import build_qubo_matrix
from backend.optimizer.solvers import solve_all, solve_quantum_inspired, solve_greedy, solve_genetic_algorithm
from backend.optimizer.benchmark import run_benchmark


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


# Request models
class ChaosInjectionRequest(BaseModel):
    target_link: str = "A-B"
    surge_util: float = 0.96
    surge_latency: float = 94.0
    surge_loss: float = 0.048
    incident_description: Optional[str] = "Traffic surge inducing queue buffer tail-drop on A-B"


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

CURRENT_STATE = {
    "links": copy.deepcopy(DEFAULT_LINKS),
    "flows": copy.deepcopy(DEFAULT_FLOWS),
    "active_incident": None,
    "last_decision": None,
    "is_anomalous": False,
}


def get_default_candidate_actions() -> List[CandidateAction]:
    return [
        CandidateAction(
            action_id="ACT-REROUTE-ADB",
            type="REROUTE_FLOW",
            target="F-DATA-2",
            params={
                "avoid_link": "A-B",
                "via_path": ["S1", "A", "D", "B", "C"],
                "rate_limit_mbps": 320.0,
            },
            cost=12.0,
            blast_radius=0.20,
            description="Optimal reroute: Divert bulk flow F-DATA-2 via router D to relieve A-B",
        ),
        CandidateAction(
            action_id="ACT-RATE-LIMIT-DATA",
            type="RATE_LIMIT",
            target="F-DATA-2",
            params={"limit_mbps": 120.0},
            cost=38.0,
            blast_radius=0.45,
            description="Ingress throttle: Cap F-DATA-2 throughput to 120 Mbps at S1",
        ),
        CandidateAction(
            action_id="ACT-QOS-PRIORITIZE-VOIP",
            type="QOS_WEIGHT",
            target="A-B",
            params={"strict_priority": "F-VOIP-1"},
            cost=24.0,
            blast_radius=0.30,
            description="QoS queueing: Promote interactive VoIP packets above best-effort queues",
        ),
        CandidateAction(
            action_id="ACT-LINK-RESET-AB",
            type="LINK_RESET",
            target="A-B",
            params={"grace_period_sec": 3},
            cost=110.0,
            blast_radius=0.85,
            description="Hard reset: Restart physical PHY tranceiver on interface A-eth1",
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
def get_candidate_actions():
    """Contract 3: Returns candidate remediation actions."""
    return get_default_candidate_actions()


@app.post("/api/chaos", response_model=IncidentReport)
def inject_chaos(req: ChaosInjectionRequest = ChaosInjectionRequest()):
    """
    Simulates a synthetic traffic surge or link degradation fault.
    Mutates link state and triggers Contract 2 incident report.
    """
    target = req.target_link
    if target not in CURRENT_STATE["links"]:
        target = "A-B"

    # Mutate link state
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

    incident = IncidentReport(
        incident_id=f"INC-{uuid.uuid4().hex[:8].upper()}",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        severity="CRITICAL",
        anomalous_links=[target],
        root_cause=req.incident_description,
        causal_chain=[
            f"Traffic volume burst on ingress S1 (+450Mbps)",
            f"Bottleneck link {target} utilization peaked at {int(req.surge_util * 100)}%",
            f"Queue memory exhausted -> tail drop packet loss ({round(req.surge_loss * 100, 2)}%)",
            f"VoIP and Data flows experiencing severe SLA violation (>90ms latency)",
        ],
        recommended_strategy="REROUTE_OR_SHAPE",
    )
    CURRENT_STATE["active_incident"] = incident
    return incident


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

    return {
        "status": "APPLIED",
        "message": "Optimization remediations successfully enacted. Network telemetry restored to healthy thresholds.",
        "active_flows": CURRENT_STATE["flows"],
        "links": CURRENT_STATE["links"],
    }


@app.post("/api/reset")
def reset_state():
    """Resets network state, flows, and incidents to baseline normal."""
    CURRENT_STATE["links"] = copy.deepcopy(DEFAULT_LINKS)
    CURRENT_STATE["flows"] = copy.deepcopy(DEFAULT_FLOWS)
    CURRENT_STATE["active_incident"] = None
    CURRENT_STATE["last_decision"] = None
    CURRENT_STATE["is_anomalous"] = False
    return {"status": "RESET_SUCCESSFUL", "telemetry": CURRENT_STATE["links"]}


@app.get("/api/benchmark")
def get_benchmark_results():
    """Runs scaling benchmark on sizes [10, 50, 200] and returns comparison JSON."""
    return run_benchmark([10, 50, 200])


if __name__ == "__main__":
    import os
    import socket
    import uvicorn

    requested_port = int(os.environ.get("PORT", "8000"))
    
    # Check if requested port is already listening
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    is_busy = (s.connect_ex(("127.0.0.1", requested_port)) == 0)
    s.close()

    if is_busy:
        port_to_use = 8001
        print(f"[Notice] Port {requested_port} is already actively listening. Using port {port_to_use}.")
    else:
        port_to_use = requested_port

    print(f"Starting Self-Healing Network Gateway on http://127.0.0.1:{port_to_use} ...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port_to_use, reload=False)
