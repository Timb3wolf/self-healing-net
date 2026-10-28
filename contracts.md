# Self-Healing Network - Inter-Module Data Contracts

This document specifies the frozen API schemas and JSON contracts shared between the distributed modules:
- **Member 1:** Network Digital Twin & Telemetry Streamer
- **Member 2:** Anomaly Detection & Causal Root-Cause Engine
- **Member 3 (This Module):** QUBO / Quantum-Inspired Optimizer & Real-Time Explainability Dashboard
- **Member 4:** Verification & Automated Policy Actuator

---

## Contract 1: Telemetry Snapshot (`/api/telemetry`)
Emitted by the Network Digital Twin to describe real-time interface metrics, link health, and active end-to-end traffic flows.

```json
{
  "timestamp": "2026-10-24T16:30:00Z",
  "links": {
    "S1-A": {
      "source": "S1",
      "target": "A",
      "util": 0.45,
      "latency": 4.2,
      "loss": 0.0001,
      "capacity_mbps": 1000.0,
      "up": true
    },
    "A-B": {
      "source": "A",
      "target": "B",
      "util": 0.94,
      "latency": 88.5,
      "loss": 0.042,
      "capacity_mbps": 1000.0,
      "up": true
    },
    "B-C": {
      "source": "B",
      "target": "C",
      "util": 0.52,
      "latency": 3.8,
      "loss": 0.0002,
      "capacity_mbps": 1000.0,
      "up": true
    },
    "A-D": {
      "source": "A",
      "target": "D",
      "util": 0.22,
      "latency": 2.1,
      "loss": 0.0000,
      "capacity_mbps": 1000.0,
      "up": true
    },
    "D-B": {
      "source": "D",
      "target": "B",
      "util": 0.28,
      "latency": 2.9,
      "loss": 0.0000,
      "capacity_mbps": 1000.0,
      "up": true
    }
  },
  "flows": [
    {
      "flow_id": "F-VOIP-1",
      "source": "S1",
      "destination": "C",
      "rate_mbps": 120.0,
      "latency": 96.5,
      "loss": 0.0422,
      "path": ["S1", "A", "B", "C"]
    },
    {
      "flow_id": "F-DATA-2",
      "source": "S1",
      "destination": "C",
      "rate_mbps": 450.0,
      "latency": 96.5,
      "loss": 0.0422,
      "path": ["S1", "A", "B", "C"]
    }
  ]
}
```

---

## Contract 2: Incident Report (`/api/incident`)
Emitted by the Anomaly Detection & Causal Analysis engine (Member 2) when telemetry anomalies breach SLAs and identify root causes.

```json
{
  "incident_id": "INC-2026-1024-001",
  "timestamp": "2026-10-24T16:30:15Z",
  "severity": "CRITICAL",
  "anomalous_links": ["A-B"],
  "root_cause": "Traffic micro-burst exceeding queue buffer capacity on interface A-eth1 -> B",
  "causal_chain": [
    "S1 egress spike (+380Mbps)",
    "A-B link utilization reaches 94%",
    "Buffer tail-drop induced loss on A-B",
    "SLA degradation on flow F-VOIP-1 and F-DATA-2"
  ],
  "recommended_strategy": "REROUTE_OR_SHAPE"
}
```

---

## Contract 3: Candidate Action (`/api/candidate-actions`)
Generated mitigation actions evaluated by the QUBO / Quantum-Inspired Optimizer.

```json
{
  "action_id": "ACT-REROUTE-ADB",
  "type": "REROUTE_FLOW",
  "target": "F-DATA-2",
  "params": {
    "avoid_link": "A-B",
    "via_path": ["S1", "A", "D", "B", "C"],
    "rate_limit_mbps": 450.0
  },
  "cost": 15.0,
  "blast_radius": 0.25,
  "description": "Reroute bulk flow F-DATA-2 through transit router D to bypass congested link A-B"
}
```

Common action types:
- `REROUTE_FLOW`: Shifts designated traffic flow to alternate topological paths.
- `RATE_LIMIT`: Throttles low-priority bulk traffic at ingress point.
- `QOS_WEIGHT`: Adjusts weighted-fair-queuing priorities on congested links.
- `LINK_RESET`: Soft-resets anomalous interface transceivers.

---

## Contract 4: Decision (`/api/optimize` Response)
The definitive remediation plan output by Member 3's optimization engine.

```json
{
  "incident_id": "INC-2026-1024-001",
  "decision_id": "DEC-98213",
  "timestamp": "2026-10-24T16:30:16Z",
  "chosen": [
    {
      "action_id": "ACT-REROUTE-ADB",
      "type": "REROUTE_FLOW",
      "target": "F-DATA-2",
      "params": {
        "avoid_link": "A-B",
        "via_path": ["S1", "A", "D", "B", "C"],
        "rate_limit_mbps": 450.0
      },
      "cost": 15.0,
      "blast_radius": 0.25,
      "description": "Reroute bulk flow F-DATA-2 through transit router D"
    }
  ],
  "predicted": {
    "network_health": "HEALTHY",
    "mean_latency_ms": 9.2,
    "max_link_util": 0.65,
    "packet_loss": 0.0001,
    "affected_links": {
      "A-B": { "util": 0.49, "latency": 5.1, "loss": 0.0001 },
      "A-D": { "util": 0.67, "latency": 3.4, "loss": 0.0000 },
      "D-B": { "util": 0.73, "latency": 4.1, "loss": 0.0000 }
    }
  },
  "blast_radius": 0.25,
  "confidence": 0.96,
  "mode": "QUANTUM_ANNEALER",
  "solver_comparison": [
    {
      "solver": "Simulated Quantum Annealer (Neal)",
      "runtime_ms": 14.8,
      "objective_energy": -85.0,
      "chosen_actions": ["ACT-REROUTE-ADB"],
      "cardinality_valid": true,
      "conflicts_detected": 0
    },
    {
      "solver": "Greedy Heuristic Baseline",
      "runtime_ms": 1.2,
      "objective_energy": -72.0,
      "chosen_actions": ["ACT-REROUTE-ADB"],
      "cardinality_valid": true,
      "conflicts_detected": 0
    },
    {
      "solver": "Genetic Algorithm Baseline (DEAP)",
      "runtime_ms": 48.6,
      "objective_energy": -85.0,
      "chosen_actions": ["ACT-REROUTE-ADB"],
      "cardinality_valid": true,
      "conflicts_detected": 0
    }
  ]
}
```
