import React from 'react';
import { Cpu, Zap, Activity, CheckCircle2, ShieldCheck, Sparkles, Scale } from 'lucide-react';

/**
 * DecisionCard: Displays winning action, predicted post-healing metrics,
 * and multi-solver comparative performance (Quantum Neal vs Greedy vs GA).
 */
export default function DecisionCard({ decision, onApply, applying }) {
  if (!decision) {
    return (
      <div className="glass-panel" style={{ height: '100%' }}>
        <div className="card-header">
          <div className="card-title-group">
            <Cpu size={18} color="#6366f1" />
            <span className="card-title">QUBO Optimization Decision</span>
          </div>
          <span className="badge badge-blue">IDLE</span>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Sparkles size={26} color="#6366f1" />
          </div>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
            Awaiting Optimizer Execution
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.35rem' }}>
            Click "Run Optimizer" to formulate the QUBO Hamiltonian and sample via Quantum Simulated Annealing.
          </div>
        </div>
      </div>
    );
  }

  const primaryAction = decision.chosen?.[0] || null;

  return (
    <div className="glass-panel" style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-title-group">
          <Cpu size={18} color="#6366f1" />
          <span className="card-title">Optimization Decision ({decision.mode})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-green">OPTIMAL</span>
          <button
            id="apply-decision-btn"
            className="btn btn-apply"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            onClick={onApply}
            disabled={applying}
          >
            <CheckCircle2 size={14} />
            {applying ? 'Actuating...' : 'Apply Remediations'}
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Metric summary boxes */}
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-label">Pred. Mean Latency</div>
            <div className="stat-value" style={{ color: '#38bdf8' }}>
              {decision.predicted?.mean_latency_ms ?? 9.4} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>ms</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Max Link Util</div>
            <div className="stat-value" style={{ color: '#34d399' }}>
              {Math.round((decision.predicted?.max_link_util ?? 0.62) * 100)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>%</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Blast Radius</div>
            <div className="stat-value" style={{ color: '#a78bfa' }}>
              {decision.blast_radius}
            </div>
          </div>
        </div>

        {/* Selected Action Details */}
        {primaryAction && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontFamily: 'JetBrains Mono', color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 700 }}>
                {primaryAction.action_id}
              </span>
              <span className="badge badge-blue">{primaryAction.type}</span>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
              {primaryAction.description}
            </div>
            {primaryAction.params?.via_path && (
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#94a3b8' }}>
                <span style={{ color: '#6366f1', fontWeight: 600 }}>Reroute Path: </span>
                {primaryAction.params.via_path.join(' → ')}
              </div>
            )}
          </div>
        )}

        {/* Multi-Solver Comparison Table */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
              Solver Benchmark Comparison
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'JetBrains Mono' }}>
              Confidence: {Math.round(decision.confidence * 100)}%
            </span>
          </div>

          <table className="solver-table">
            <thead>
              <tr>
                <th>Solver</th>
                <th>Runtime</th>
                <th>Energy</th>
                <th>Valid</th>
              </tr>
            </thead>
            <tbody>
              {(decision.solver_comparison || []).map((s, idx) => {
                const isNeal = s.solver.includes('Neal') || s.solver.includes('Quantum');
                return (
                  <tr key={idx} className={isNeal ? 'winning-row' : ''}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {isNeal && <Sparkles size={12} color="#a5b4fc" />}
                      <span>{s.solver}</span>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{s.runtime_ms} ms</td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{s.objective_energy}</td>
                    <td>
                      <span className={`badge ${s.cardinality_valid ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        {s.cardinality_valid ? 'VALID' : 'INVALID'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
