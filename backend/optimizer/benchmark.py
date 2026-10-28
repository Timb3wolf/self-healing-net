"""
benchmark.py - Scaling Test Runner across 10, 50, 200, and 500 decision variables.
Compares:
  - Quantum-Inspired Simulated Annealing (dwave-neal)
  - Greedy Heuristic Baseline
  - Genetic Algorithm Baseline (DEAP)
"""

import sys
import os
import time
import random
from typing import Dict, List, Any

# Ensure parent path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.optimizer.qubo import build_qubo_matrix
from backend.optimizer.solvers import solve_quantum_inspired, solve_greedy, solve_genetic_algorithm


def generate_synthetic_problem(num_actions: int, k_target: int = 2) -> List[Dict[str, Any]]:
    """
    Generates synthetic candidate mitigation actions for scaling tests.
    """
    actions = []
    action_types = ["REROUTE_FLOW", "RATE_LIMIT", "QOS_WEIGHT", "LINK_RESET"]
    links = [f"L{i}-{i+1}" for i in range(max(num_actions // 2, 5))]
    flows = [f"F-FLOW-{i}" for i in range(max(num_actions // 3, 5))]

    for i in range(num_actions):
        act_type = action_types[i % len(action_types)]
        cost = round(random.uniform(5.0, 95.0), 2)
        blast_radius = round(random.uniform(0.05, 0.90), 2)
        target = flows[i % len(flows)] if "FLOW" in act_type else links[i % len(links)]

        actions.append({
            "action_id": f"ACT-SYNTH-{i:04d}",
            "type": act_type,
            "target": target,
            "cost": cost,
            "blast_radius": blast_radius,
            "params": {
                "via_path": [f"N{random.randint(1, 10)}" for _ in range(3)]
            }
        })
    return actions


def run_benchmark(scale_sizes: List[int] = None) -> Dict[str, Any]:
    if scale_sizes is None:
        scale_sizes = [10, 50, 200, 500]

    results: Dict[str, Any] = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "scales": []
    }

    print("\n" + "=" * 90)
    print(f"{'QUBO / QUANTUM-INSPIRED SOLVER SCALABILITY BENCHMARK':^90}")
    print("=" * 90)
    print(f"{'Scale (Vars)':<14} | {'Solver':<32} | {'Time (ms)':<12} | {'Energy':<14} | {'Valid?':<8}")
    print("-" * 90)

    for n in scale_sizes:
        k_target = max(1, n // 20)
        actions = generate_synthetic_problem(n, k_target=k_target)

        # Build QUBO
        t0 = time.perf_counter()
        qubo_def = build_qubo_matrix(actions, k_target=k_target, penalty_P=1000.0)
        build_time_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        # 1. Quantum Annealer (Neal) - adjust reads for scale
        reads = 100 if n <= 100 else 50
        res_qa = solve_quantum_inspired(qubo_def, num_reads=reads)

        # 2. Greedy Baseline
        res_greedy = solve_greedy(qubo_def, actions, k_target=k_target)

        # 3. GA Baseline (DEAP) - adjust generations for larger scale
        gens = 30 if n <= 100 else 15
        pop = 40 if n <= 100 else 25
        res_ga = solve_genetic_algorithm(qubo_def, pop_size=pop, generations=gens)

        scale_record = {
            "num_actions": n,
            "k_target": k_target,
            "qubo_build_time_ms": build_time_ms,
            "solvers": {
                "quantum_annealer": res_qa,
                "greedy": res_greedy,
                "genetic_algorithm": res_ga,
            }
        }
        results["scales"].append(scale_record)

        for s_key, s_data in [
            ("Quantum Annealer (Neal)", res_qa),
            ("Greedy Baseline", res_greedy),
            ("Genetic Algorithm (DEAP)", res_ga),
        ]:
            valid_str = "YES" if s_data["cardinality_valid"] else "NO"
            print(
                f"{n:<14} | {s_key:<32} | {s_data['runtime_ms']:<12.2f} | "
                f"{s_data['objective_energy']:<14.2f} | {valid_str:<8}"
            )
        print("-" * 90)

    return results


if __name__ == "__main__":
    run_benchmark([10, 50, 200, 500])
