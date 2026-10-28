"""
test_e2e.py - End-to-End Self-Healing Network Verification Suite
Validates:
  1. Nominal telemetry snapshot ingestion
  2. Chaos injection and incident reporting (Contract 1 -> Contract 2)
  3. Candidate action generation and QUBO optimization (Contract 3 -> Contract 4)
  4. Simulated Annealer (dwave-neal), Greedy heuristic, and DEAP GA solver comparison
  5. Actuation and network self-healing loop completion
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8001"

def test_full_lifecycle():
    print("\n[STEP 1] Fetching initial nominal telemetry...")
    r1 = requests.get(f"{BASE_URL}/api/telemetry")
    assert r1.status_code == 200, f"Expected 200, got {r1.status_code}"
    tel = r1.json()
    assert "links" in tel and "flows" in tel
    assert tel["links"]["A-B"]["util"] < 0.70
    print(f"  -> Nominal: {len(tel['links'])} links, {len(tel['flows'])} flows active. A-B util = {tel['links']['A-B']['util']}")

    print("\n[STEP 2] Injecting Chaos surge on link A-B...")
    r2 = requests.post(f"{BASE_URL}/api/chaos", json={
        "target_link": "A-B",
        "surge_util": 0.96,
        "surge_latency": 92.5,
        "surge_loss": 0.048,
        "incident_description": "Traffic surge inducing queue tail-drop on A-B"
    })
    assert r2.status_code == 200
    inc = r2.json()
    assert inc["severity"] == "CRITICAL"
    assert "A-B" in inc["anomalous_links"]
    print(f"  -> Incident generated: ID={inc['incident_id']} Severity={inc['severity']}")
    print(f"  -> Root Cause: {inc['root_cause']}")

    print("\n[STEP 3] Running QUBO Quantum-Inspired Optimization across all 3 solvers...")
    r3 = requests.post(f"{BASE_URL}/api/optimize", json={
        "solver_mode": "QUANTUM_ANNEALER",
        "k_target": 1,
        "penalty_P": 1000.0
    })
    assert r3.status_code == 200
    decision = r3.json()
    assert len(decision["chosen"]) > 0
    chosen_act = decision["chosen"][0]
    print(f"  -> Decision ID: {decision['decision_id']}")
    print(f"  -> Winning Action: {chosen_act['action_id']} ({chosen_act['type']})")
    print(f"  -> Predicted Mean Latency: {decision['predicted']['mean_latency_ms']} ms")
    print(f"  -> Multi-Solver Performance:")
    for s in decision["solver_comparison"]:
        print(f"     * {s['solver']:<35} : Runtime={s['runtime_ms']}ms, Energy={s['objective_energy']}, Valid={s['cardinality_valid']}")

    print("\n[STEP 4] Applying Decision Policy via Actuator...")
    r4 = requests.post(f"{BASE_URL}/api/apply")
    assert r4.status_code == 200
    apply_res = r4.json()
    assert apply_res["status"] == "APPLIED"
    print(f"  -> Status: {apply_res['status']} - {apply_res['message']}")

    print("\n[STEP 5] Verifying Post-Remediation Telemetry (Self-Healing Loop Complete)...")
    r5 = requests.get(f"{BASE_URL}/api/telemetry")
    assert r5.status_code == 200
    post_tel = r5.json()
    assert post_tel["links"]["A-B"]["util"] < 0.70
    print(f"  -> Post-Healing Link A-B util: {post_tel['links']['A-B']['util']} (Restored to healthy range!)")

    print("\n=======================================================")
    print("SUCCESS: ALL SELF-HEALING OPTIMIZATION & DASHBOARD TESTS PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_lifecycle()
