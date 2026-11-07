"""
tests/test_member1_integration.py
Tests the Member 1 Qualcomm Imagine SDK & diagnosis_service integration.
"""

import sys
import os
import requests

# Ensure workspace root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from diagnosis_service import fault_sample, diagnose, incident_report

def test_member1_flow():
    print("=======================================================")
    print("TESTING MEMBER 1 QUALCOMM DIAGNOSTIC PIPELINE")
    print("=======================================================")

    # 1. Test fault_sample from real TelecomTS dataset
    print("\n[STEP 1] Generating fault samples from real TelecomTS dataset...")
    s1 = fault_sample("Antenna Failure")
    s2 = fault_sample("Jamming")
    s3 = fault_sample("High Network Congestion (Sudden Spike)")
    type1 = s1.get("anomalies", {}).get("type", s1.get("fault_type"))
    type2 = s2.get("anomalies", {}).get("type", s2.get("fault_type"))
    type3 = s3.get("anomalies", {}).get("type", s3.get("fault_type"))
    assert type1 == "Antenna Failure"
    assert type2 == "Jamming"
    assert "Congestion" in type3
    print(f"  -> Real 5G samples loaded: {type1}, {type2}, {type3}")
    print(f"  -> Real KPIs in s1: {list(s1.get('KPIs', {}).keys())[:6]}")
    print(f"  -> Real NOC ticket in s1: {s1.get('anomalies', {}).get('troubleshooting_tickets', '')[:70]}...")

    # 2. Test diagnose with Antenna Failure
    print("\n[STEP 2] Running Qualcomm AI 100 diagnosis on 'Antenna Failure'...")
    res = diagnose(s1)
    print(f"  -> twin_fault: {res['twin_fault']}")
    print(f"  -> suggested_fixes: {res['suggested_fixes']}")
    print(f"  -> decision_trail: {res['decision_trail']}")
    print(f"  -> qualcomm_latency_s: {res['qualcomm_latency_s']}s (badge)")
    assert res["twin_fault"] in ["link_down", "link_degradation", "traffic_surge"]
    assert len(res["suggested_fixes"]) > 0
    assert len(res["decision_trail"]) > 0
    assert res["qualcomm_latency_s"] >= 0

    # 3. Test incident_report
    print("\n[STEP 3] Generating incident report after twin heals...")
    stats = {
        "chosen_fix": "reroute via A-D-B",
        "before": {"latency_ms": 300, "loss_pct": 39},
        "after": {"latency_ms": 13, "loss_pct": 0},
        "time_to_detect_s": 2.2,
        "time_to_heal_s": 8.5
    }
    rep = incident_report(res, stats)
    print(f"  -> report['summary']: {rep['summary']}")
    print(f"  -> report['cause']: {rep['cause']}")
    print(f"  -> report['action']: {rep['action']}")
    print(f"  -> report['result']: {rep['result']}")
    assert "summary" in rep
    assert "cause" in rep
    assert "action" in rep
    assert "result" in rep

    # 4. Test live backend endpoints on port 8001
    print("\n[STEP 4] Testing live backend endpoints (/api/diagnosis/trigger & /api/diagnosis/report)...")
    base_url = "http://127.0.0.1:8001"
    
    # Trigger diagnosis via API
    trig_res = requests.post(
        f"{base_url}/api/diagnosis/trigger",
        json={"fault_type": "Antenna Failure", "target": "A-B"},
        timeout=30
    )
    assert trig_res.status_code == 200, f"Trigger failed: {trig_res.text}"
    trig_data = trig_res.json()
    assert trig_data["status"] == "DIAGNOSIS_SUCCESS"
    print(f"  -> API trigger OK: twin_fault={trig_data['result']['twin_fault']}, OSPF routes recalculated={len(trig_data['routing_table'])}")

    # Fetch live telemetry to verify incident is broadcasting
    tel_res = requests.get(f"{base_url}/api/telemetry/live", timeout=5)
    assert tel_res.status_code == 200
    tel_data = tel_res.json()
    assert tel_data["diagnosis_result"] is not None
    print(f"  -> Live telemetry verified: active_alert_count={tel_data['active_alert_count']}, qualcomm_latency={tel_data['diagnosis_result']['qualcomm_latency_s']}s")

    # Generate incident report via API
    rep_res = requests.post(
        f"{base_url}/api/diagnosis/report",
        json=stats,
        timeout=10
    )
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert "summary" in rep_data
    print(f"  -> API incident report OK: {rep_data['summary'][:70]}...")

    # 5. Test real dataset endpoints (/api/dataset/stats, /api/dataset/samples, /api/dataset/inject)
    print("\n[STEP 5] Testing real TelecomTS dataset endpoints...")
    stats_res = requests.get(f"{base_url}/api/dataset/stats", timeout=5)
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["total_samples"] == 2000
    assert stats_data["incident_memory_kb"] == 275
    print(f"  -> /api/dataset/stats OK: {stats_data['total_samples']} samples, {stats_data['incident_memory_kb']} cached incident vectors")

    samp_res = requests.get(f"{base_url}/api/dataset/samples?fault_type=Jamming&limit=2", timeout=5)
    assert samp_res.status_code == 200
    samp_data = samp_res.json()
    assert samp_data["count"] == 2
    assert "DL_BLER" in samp_data["samples"][0]["clean_kpis"]
    print(f"  -> /api/dataset/samples OK: fetched 2 real Jamming samples with {len(samp_data['samples'][0]['clean_kpis'])} clean KPIs")

    inj_res = requests.post(f"{base_url}/api/dataset/inject", json={"fault_type": "Jamming", "target": "A-B"}, timeout=35)
    assert inj_res.status_code == 200
    inj_data = inj_res.json()
    assert inj_data["status"] == "DIAGNOSIS_SUCCESS"
    assert inj_data["result"]["twin_fault"] in ["link_degradation", "link_down", "traffic_surge"]
    print(f"  -> /api/dataset/inject OK: injected real sample into Digital Twin (twin_fault={inj_data['result']['twin_fault']})")

    # Reset twin to nominal
    requests.post(f"{base_url}/api/reset", timeout=5)
    print("  -> Twin reset to nominal baseline.")

    print("\n=======================================================")
    print("SUCCESS: ALL MEMBER 1 INTEGRATION TESTS PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_member1_flow()
