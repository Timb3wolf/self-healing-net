import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Zap,
  RotateCcw,
  Activity,
  Layers,
  Network,
  Cpu,
  BarChart2,
  RefreshCw,
  GitBranch,
} from 'lucide-react';

import NetworkGraph from './components/NetworkGraph';
import ParetoChart from './components/ParetoChart';
import IncidentCard from './components/IncidentCard';
import DecisionCard from './components/DecisionCard';

export default function App() {
  const [telemetry, setTelemetry] = useState({ links: {}, flows: [] });
  const [incident, setIncident] = useState(null);
  const [decision, setDecision] = useState(null);
  const [candidateActions, setCandidateActions] = useState([]);
  
  const [solverMode, setSolverMode] = useState('QUANTUM_ANNEALER');
  const [ghostMode, setGhostMode] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('System nominal. Ready for simulation.');

  // Fetch telemetry and incident state
  const fetchData = useCallback(async () => {
    try {
      const [telRes, incRes, actRes] = await Promise.all([
        fetch('/api/telemetry'),
        fetch('/api/incident'),
        fetch('/api/candidate-actions'),
      ]);

      if (telRes.ok) {
        const telData = await telRes.json();
        setTelemetry(telData);
      }
      if (incRes.ok) {
        const incData = await incRes.json();
        setIncident(incData);
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setCandidateActions(actData);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Inject Chaos (Traffic Burst / Fault)
  const handleChaos = async () => {
    setLoading(true);
    setStatusMessage('Injecting synthetic congestion burst on link A-B...');
    try {
      const res = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_link: 'A-B',
          surge_util: 0.95,
          surge_latency: 92.4,
          surge_loss: 0.045,
          incident_description: 'Interface queue saturation on link A-B (+450Mbps micro-burst)',
        }),
      });
      if (res.ok) {
        const incData = await res.json();
        setIncident(incData);
        setDecision(null);
        setGhostMode(false);
        setStatusMessage('CRITICAL: Link A-B congested (95% util). Incident alert broadcast.');
        fetchData();
      }
    } catch (err) {
      console.error('Chaos injection error:', err);
      setStatusMessage('Error injecting chaos.');
    } finally {
      setLoading(false);
    }
  };

  // Run Optimization (QUBO + Solvers)
  const handleOptimize = async () => {
    setOptimizing(true);
    setStatusMessage(`Formulating QUBO Hamiltonian & sampling via ${solverMode}...`);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solver_mode: solverMode,
          k_target: 1,
          penalty_P: 1000.0,
        }),
      });
      if (res.ok) {
        const decData = await res.json();
        setDecision(decData);
        setGhostMode(true);
        setStatusMessage(`Optimization completed in ${decData.solver_comparison?.[0]?.runtime_ms}ms. Ghost overlay active.`);
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setStatusMessage('Error executing optimization solver.');
    } finally {
      setOptimizing(false);
    }
  };

  // Apply Healing Decision
  const handleApply = async () => {
    if (!decision) return;
    setApplying(true);
    setStatusMessage('Actuating mitigation policy to network twin...');
    try {
      const res = await fetch('/api/apply', { method: 'POST' });
      if (res.ok) {
        setIncident(null);
        setGhostMode(false);
        setStatusMessage('Self-healing action enacted. Network returned to nominal operating SLA.');
        fetchData();
      }
    } catch (err) {
      console.error('Apply error:', err);
      setStatusMessage('Error actuating decision.');
    } finally {
      setApplying(false);
    }
  };

  // Reset to Nominal Baseline
  const handleReset = async () => {
    setLoading(true);
    setStatusMessage('Resetting network twin and telemetry to baseline...');
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        setIncident(null);
        setDecision(null);
        setGhostMode(false);
        setStatusMessage('Network state reset to baseline.');
        fetchData();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedActionIds = decision?.chosen?.map((a) => a.action_id) || [];
  const predictedLinks = decision?.predicted?.affected_links || {};
  const isAnomalous = Object.values(telemetry.links).some((l) => l.util > 0.90) || !!incident;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation & Controls */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Zap size={22} color="#ffffff" />
          </div>
          <div>
            <div className="brand-title">SELF-HEALING NETWORK</div>
            <div className="brand-subtitle">Member 3: QUBO Optimizer & Telemetry Twin</div>
          </div>
        </div>

        {/* Solver Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
            ENGINE:
          </span>
          <div className="mode-switch">
            <button
              id="mode-qa-btn"
              className={`mode-btn ${solverMode === 'QUANTUM_ANNEALER' ? 'active' : ''}`}
              onClick={() => setSolverMode('QUANTUM_ANNEALER')}
            >
              Quantum (Neal)
            </button>
            <button
              id="mode-greedy-btn"
              className={`mode-btn ${solverMode === 'GREEDY' ? 'active' : ''}`}
              onClick={() => setSolverMode('GREEDY')}
            >
              Greedy
            </button>
            <button
              id="mode-ga-btn"
              className={`mode-btn ${solverMode === 'GA' ? 'active' : ''}`}
              onClick={() => setSolverMode('GA')}
            >
              GA (DEAP)
            </button>
          </div>
        </div>

        {/* Control Action Buttons */}
        <div className="header-actions">
          <button
            id="chaos-inject-btn"
            className="btn btn-chaos"
            onClick={handleChaos}
            disabled={loading || isAnomalous}
          >
            <Flame size={16} />
            <span>Chaos Spike</span>
          </button>

          <button
            id="run-optimizer-btn"
            className="btn btn-optimize"
            onClick={handleOptimize}
            disabled={optimizing}
          >
            <Cpu size={16} />
            <span>{optimizing ? 'Optimizing...' : 'Run Optimizer'}</span>
          </button>

          {decision && (
            <button
              id="ghost-toggle-btn"
              className={`btn ${ghostMode ? 'btn-secondary' : 'btn-secondary'}`}
              style={{
                borderColor: ghostMode ? '#06b6d4' : undefined,
                color: ghostMode ? '#06b6d4' : undefined,
              }}
              onClick={() => setGhostMode(!ghostMode)}
            >
              <Layers size={16} />
              <span>{ghostMode ? 'Hide Ghost' : 'Show Ghost'}</span>
            </button>
          )}

          <button
            id="reset-state-btn"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* System Status Banner */}
      <div
        style={{
          background: isAnomalous ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.08)',
          borderBottom: `1px solid ${isAnomalous ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.15)'}`,
          padding: '0.45rem 2rem',
          fontSize: '0.78rem',
          fontFamily: 'JetBrains Mono',
          color: isAnomalous ? '#fca5a5' : '#86efac',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isAnomalous ? '#ef4444' : '#10b981',
              boxShadow: `0 0 10px ${isAnomalous ? '#ef4444' : '#10b981'}`,
            }}
          />
          <span>{statusMessage}</span>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
          Active Topology: S1 ↔ A ↔ B ↔ C (Transit: D) | Auto-poll: 4s
        </div>
      </div>

      {/* Dashboard Main Grid Layout */}
      <main className="dashboard-grid">
        {/* Panel 1: Network Graph Topology */}
        <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title-group">
              <Network size={18} color="#06b6d4" />
              <span className="card-title">Live Network Digital Twin</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${isAnomalous ? 'badge-red' : 'badge-green'}`}>
                {isAnomalous ? 'ANOMALOUS' : 'NOMINAL'}
              </span>
              {ghostMode && <span className="badge badge-blue">GHOST OVERLAY</span>}
            </div>
          </div>
          <div className="card-body" style={{ flex: 1, padding: '0.75rem' }}>
            <div className="graph-container">
              <NetworkGraph
                links={telemetry.links}
                predictedLinks={predictedLinks}
                ghostMode={ghostMode}
                selectedAction={decision?.chosen?.[0]}
              />
            </div>
          </div>
        </section>

        {/* Panel 2: Incident Detection (Member 2) */}
        <section>
          <IncidentCard incident={incident} isAnomalous={isAnomalous} />
        </section>

        {/* Panel 3: Pareto Frontier (Trade-off Analysis) */}
        <section className="glass-panel">
          <div className="card-header">
            <div className="card-title-group">
              <BarChart2 size={18} color="#a855f7" />
              <span className="card-title">Pareto Trade-off Frontier (Latency vs Blast Radius)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
              Non-Dominated Mitigation Actions
            </span>
          </div>
          <div className="card-body">
            <ParetoChart
              candidateActions={candidateActions}
              selectedActionIds={selectedActionIds}
            />
          </div>
        </section>

        {/* Panel 4: Decision & Multi-Solver Benchmark Card */}
        <section>
          <DecisionCard
            decision={decision}
            onApply={handleApply}
            applying={applying}
          />
        </section>
      </main>

      {/* Active Flows Footer Telemetry Bar */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(10, 15, 29, 0.95)',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#94a3b8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
            <GitBranch size={15} color="#6366f1" />
            <span style={{ fontWeight: 600 }}>Active Ingress Flows:</span>
          </div>
          {telemetry.flows.map((f) => (
            <div
              key={f.flow_id}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{f.flow_id}</span> ({f.rate_mbps} Mbps)
              <span style={{ color: '#64748b' }}> → </span>
              <span style={{ color: f.latency > 50 ? '#f87171' : '#34d399' }}>{f.latency}ms</span>
              <span style={{ color: '#64748b' }}> [path: {f.path.join('-')}]</span>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#64748b' }}>
          Contracts: C1 Telemetry | C2 Incident | C3 Action | C4 Decision
        </div>
      </footer>
    </div>
  );
}
