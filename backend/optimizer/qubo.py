"""
qubo.py - Quadratic Unconstrained Binary Optimization Formulation
Formulates:
    min_x sum_i c_i * x_i + sum_{i < j} q_{ij} * x_i * x_j + P * (sum_i x_i - K)^2

Where:
    c_i = action_cost + (100 * blast_radius)
    q_{ij} = pairwise conflict penalty (+500 if actions conflict or share bottleneck resources)
    P, K = Cardinality constraint penalty ensuring ~K actions are selected
"""

from typing import List, Dict, Tuple, Any, Optional
import numpy as np


class QUBODefinition:
    def __init__(
        self,
        actions: List[Dict[str, Any]],
        Q_dict: Dict[Tuple[int, int], float],
        Q_matrix: np.ndarray,
        k_target: int,
        penalty_P: float,
        constant_offset: float,
        linear_costs: List[float],
        conflict_matrix: np.ndarray,
    ):
        self.actions = actions
        self.Q_dict = Q_dict
        self.Q_matrix = Q_matrix
        self.k_target = k_target
        self.penalty_P = penalty_P
        self.constant_offset = constant_offset
        self.linear_costs = linear_costs
        self.conflict_matrix = conflict_matrix
        self.num_vars = len(actions)

    def evaluate_energy(self, bitstring: List[int]) -> float:
        """
        Evaluate objective energy including cardinality penalty:
        E(x) = x^T Q x + constant_offset
        """
        x = np.array(bitstring, dtype=float)
        # Using upper triangular Q_matrix
        energy = float(x.T @ self.Q_matrix @ x) + self.constant_offset
        return energy

    def evaluate_raw_cost(self, bitstring: List[int]) -> float:
        """Evaluate raw operational cost without penalties."""
        return sum(c for c, bit in zip(self.linear_costs, bitstring) if bit == 1)

    def count_conflicts(self, bitstring: List[int]) -> int:
        """Count active conflicting pairs."""
        conflicts = 0
        n = len(bitstring)
        for i in range(n):
            if bitstring[i] == 1:
                for j in range(i + 1, n):
                    if bitstring[j] == 1 and self.conflict_matrix[i, j] > 0:
                        conflicts += 1
        return conflicts


def compute_conflict_penalty(act_a: Dict[str, Any], act_b: Dict[str, Any]) -> float:
    """
    Determines if two candidate actions conflict:
    - Same target flow or node with competing interventions
    - Both reroute onto the same bottleneck transit link
    - Incompatible control actions (e.g. RESET and REROUTE simultaneously on same segment)
    """
    target_a = act_a.get("target")
    target_b = act_b.get("target")
    type_a = act_a.get("type", "")
    type_b = act_b.get("type", "")

    # Exact target collision (e.g. two conflicting mitigations for same flow)
    if target_a and target_b and target_a == target_b:
        return 500.0

    # Type conflicts: LINK_RESET cannot coincide with flow reroute traversing that link
    params_a = act_a.get("params", {})
    params_b = act_b.get("params", {})

    via_a = set(params_a.get("via_path", []))
    via_b = set(params_b.get("via_path", []))

    if via_a and via_b:
        # Check if both candidate paths congest the same transit node (e.g., both dumping on router D)
        shared_transit = (via_a & via_b) - {"S1", "C"}
        if len(shared_transit) >= 1:
            return 350.0

    if type_a == "LINK_RESET" and target_a in str(params_b.get("via_path", [])):
        return 600.0
    if type_b == "LINK_RESET" and target_b in str(params_a.get("via_path", [])):
        return 600.0

    # Mutual high blast-radius dampening
    blast_a = float(act_a.get("blast_radius", 0.0))
    blast_b = float(act_b.get("blast_radius", 0.0))
    if blast_a >= 0.5 and blast_b >= 0.5:
        return 300.0

    return 0.0


def build_qubo_matrix(
    actions: List[Dict[str, Any]],
    k_target: int = 1,
    penalty_P: float = 1000.0,
    blast_radius_weight: float = 100.0,
) -> QUBODefinition:
    """
    Constructs the upper-triangular QUBO matrix Q such that minimizing
    x^T Q x yields the optimal subset of size ~ k_target with minimal cost & conflicts.

    Expansion of P * (sum_i x_i - K)^2:
        = P * ( sum_i x_i^2 + 2 sum_{i < j} x_i x_j - 2 K sum_i x_i + K^2 )
        Since x_i in {0, 1}, x_i^2 = x_i:
        = sum_i [ P * (1 - 2K) ] x_i + sum_{i < j} [ 2P ] x_i x_j + P * K^2

    Therefore:
        Q_ii = c_i + P * (1 - 2K)
        Q_ij = q_ij + 2P  (for i < j)
    """
    n = len(actions)
    Q_matrix = np.zeros((n, n), dtype=float)
    conflict_matrix = np.zeros((n, n), dtype=float)
    linear_costs: List[float] = []

    # 1. Compute linear costs c_i = cost + (100 * blast_radius)
    for i, act in enumerate(actions):
        base_cost = float(act.get("cost", 10.0))
        blast_radius = float(act.get("blast_radius", 0.1))
        c_i = base_cost + (blast_radius_weight * blast_radius)
        linear_costs.append(c_i)

        # Diagonal term: c_i + P * (1 - 2 * K)
        Q_matrix[i, i] = c_i + penalty_P * (1.0 - 2.0 * float(k_target))

    # 2. Compute off-diagonal terms: q_{ij} + 2P
    for i in range(n):
        for j in range(i + 1, n):
            q_ij = compute_conflict_penalty(actions[i], actions[j])
            conflict_matrix[i, j] = q_ij
            conflict_matrix[j, i] = q_ij
            Q_matrix[i, j] = q_ij + 2.0 * penalty_P

    # Constant offset P * K^2
    constant_offset = penalty_P * (float(k_target) ** 2)

    # Convert to dictionary representation for D-Wave Neal / OpenJij
    Q_dict: Dict[Tuple[int, int], float] = {}
    for i in range(n):
        for j in range(i, n):
            if Q_matrix[i, j] != 0:
                Q_dict[(i, j)] = float(Q_matrix[i, j])

    return QUBODefinition(
        actions=actions,
        Q_dict=Q_dict,
        Q_matrix=Q_matrix,
        k_target=k_target,
        penalty_P=penalty_P,
        constant_offset=constant_offset,
        linear_costs=linear_costs,
        conflict_matrix=conflict_matrix,
    )
