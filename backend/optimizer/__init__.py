"""
Optimizer package for Self-Healing Network.
Provides QUBO matrix formulations, Quantum-inspired Simulated Annealers (dwave-neal, openjij),
DEAP Genetic Algorithm baselines, Greedy heuristics, and scalability benchmarks.
"""

from .qubo import build_qubo_matrix, QUBODefinition
from .solvers import (
    solve_quantum_inspired,
    solve_greedy,
    solve_genetic_algorithm,
    solve_all,
)

__all__ = [
    "build_qubo_matrix",
    "QUBODefinition",
    "solve_quantum_inspired",
    "solve_greedy",
    "solve_genetic_algorithm",
    "solve_all",
]
