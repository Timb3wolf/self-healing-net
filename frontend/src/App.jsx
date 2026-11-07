import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Network,
  Cpu,
  TrendingUp,
  Globe,
  ShieldAlert,
  Database,
  RotateCcw,
  Clock,
  Flame,
  FileText,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Server
} from 'lucide-react';

// Components
import SystemStatusGauge from './components/SystemStatusGauge';
import WorldSiteMap from './components/WorldSiteMap';
import RecoveryTimelineBar from './components/RecoveryTimelineBar';
import LiveLinkKpiTable from './components/LiveLinkKpiTable';
import AiFeatureExtractionGrid from './components/AiFeatureExtractionGrid';
import TwinSafetyChecklist from './components/TwinSafetyChecklist';
import IncidentHistoryTable from './components/IncidentHistoryTable';
import NetworkGraph from './components/NetworkGraph';
import RoutingTablePanel from './components/RoutingTablePanel';
import DecisionCard from './components/DecisionCard';
import ParetoChart from './components/ParetoChart';
import DatasetExplorerPanel from './components/DatasetExplorerPanel';
import RLComparisonPanel from './components/RLComparisonPanel';
import IncidentCard from './components/IncidentCard';
import DigitalTwinHealingViewer from './components/DigitalTwinHealingViewer';
import QuboExplainerPanel from './components/QuboExplainerPanel';

export default function App() {
  // Navigation tabs: 'overview', 'sites', 'ai', 'quantum', 'dataset', 'logs'
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSite, setSelectedSite] = useState('london');

  // Live state from backend
  const [liveData, setLiveData] = useState({
    links: {},
    flows: [],
    devices: [],
    gnn_evaluation: null,
    ospf_routing: { routing_table: [] },
    rl_metrics: null,
    event_timeline: [],
    causal_tree: null,
    network_health_pct: 99.2,
    active_alert_count: 0,
    active_incident: null,
    current_timeline: null,
    incident_history: [],
    latest_report: null
  });

  const [incident, setIncident] = useState(null);
  const [decision, setDecision] = useState(null);
  const [candidateActions, setCandidateActions] = useState([]);
  const [solverMode, setSolverMode] = useState('QUANTUM_ANNEALER');
  const [ghostMode, setGhostMode] = useState(false);

  // Injection state
  const [selectedCause, setSelectedCause] = useState('Antenna Failure');
  const [targetLink, setTargetLink] = useState('A-B');
  const [intensity, setIntensity] = useState(1.0);
  const [autoHeal, setAutoHeal] = useState(true);

  // Historical mini-charts data (last 60 seconds)
  const [latencyHistory, setLatencyHistory] = useState([
    2.1, 2.3, 2.0, 2.2, 2.4, 2.1, 2.0, 2.3, 2.5, 2.2,
    2.1, 2.0, 2.2, 2.4, 2.1, 2.3, 2.0, 2.2, 2.4, 2.1
  ]);
  const [throughputHistory, setThroughputHistory] = useState([
    4120, 4150, 4180, 4100, 4220, 4190, 4250, 4210, 4280, 4300,
    4290, 4310, 4280, 4350, 4320, 4370, 4340, 4380, 4360, 4400
  ]);

  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('System nominal. Telemetry synchronized.');
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString().slice(17, 25) + ' UTC');

  // Relative API URL helper utilizing Vite proxy
  const apiUrl = (endpoint) => endpoint;

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live telemetry stream from /api/telemetry/live
  const fetchLiveTelemetry = useCallback(async () => {
    try {
      const [liveRes, incRes, actRes] = await Promise.all([
        fetch(apiUrl('/api/telemetry/live')),
        fetch(apiUrl('/api/incident')),
        fetch(apiUrl('/api/candidate-actions')),
      ]);

      if (liveRes.ok) {
        const data = await liveRes.json();
        setLiveData(data);
        if (data.active_incident && !incident) {
          setIncident(data.active_incident);
        }

        // Update latency and throughput charts
        const currentWorstLat = Math.max(...Object.values(data.links || {}).map(l => l.latency || 2.1), 2.1);
        const currentTotalThr = Object.values(data.links || {}).reduce((sum, l) => sum + (l.rate_mbps || 800), 3400);

        setLatencyHistory(prev => [...prev.slice(-30), currentWorstLat]);
        setThroughputHistory(prev => [...prev.slice(-30), currentTotalThr]);
      }
      if (incRes.ok) {
        const incData = await incRes.json();
        if (incData && incData.incident_id) {
          setIncident(incData);
        }
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setCandidateActions(actData);
      }
    } catch (err) {
      console.warn('Backend polling notice:', err);
    }
  }, [incident]);

  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 2500);
    return () => clearInterval(interval);
  }, [fetchLiveTelemetry]);

  // Handle Dynamic Chaos Trigger
  const handleChaosTrigger = async (type = 'break_link', target = 'A-B', customIntensity = 1.0) => {
    setLoading(true);
    setStatusMessage(`Injecting fault [${type}] on target [${target}]...`);
    try {
      const res = await fetch(apiUrl('/api/chaos/trigger'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target, intensity: customIntensity }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.incident) {
          setIncident(result.incident);
        }
        setDecision(null);
        setGhostMode(false);
        setStatusMessage(`ALERT: Fault [${type}] active on ${target}. OSPF failover active.`);
        fetchLiveTelemetry();
      }
    } catch (err) {
      console.error('Chaos trigger error:', err);
      setStatusMessage('Error executing fault injection.');
    } finally {
      setLoading(false);
    }
  };

  // Telecom Diagnosis Trigger (Antenna Failure, Jamming, High Network Congestion)
  const handleDiagnosisTrigger = async (faultType, target = 'A-B') => {
    setLoading(true);
    setStatusMessage(`Running Telecom Diagnosis: [${faultType}] via Qualcomm Cloud AI 100...`);
    try {
      const res = await fetch(apiUrl('/api/diagnosis/trigger'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fault_type: faultType, target }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.incident) {
          setIncident(data.incident);
        }
        setDecision(null);
        setGhostMode(false);
        setStatusMessage(`Qualcomm Diagnosis Complete (${data.result?.qualcomm_latency_s}s): Injected '${data.result?.twin_fault}' on ${target}.`);
        fetchLiveTelemetry();
      }
    } catch (err) {
      console.error('Diagnosis trigger error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Inject Real TelecomTS 5G Sample into Digital Twin
  const handleInjectDatasetSample = async (sampleIndex, faultType) => {
    setLoading(true);
    setStatusMessage(`Injecting real TelecomTS 5G sample #${sampleIndex ?? 0} (${faultType}) into Digital Twin...`);
    try {
      const res = await fetch(apiUrl('/api/dataset/inject'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample_index: sampleIndex, fault_type: faultType, target: 'A-B' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.incident) {
          setIncident(data.incident);
        }
        setDecision(null);
        setGhostMode(false);
        setStatusMessage(`Real 5G Dataset Injected: ${faultType} diagnosed by Qualcomm Cloud AI 100 (${data.result?.qualcomm_latency_s}s).`);
        fetchLiveTelemetry();
      }
    } catch (err) {
      console.error('Dataset inject error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run QUBO Solver Optimization
  const handleOptimize = async () => {
    setOptimizing(true);
    setStatusMessage(`Formulating QUBO Hamiltonian & sampling via ${solverMode}...`);
    try {
      const res = await fetch(apiUrl('/api/optimize'), {
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
        setStatusMessage(`Optimization completed in ${decData.solver_comparison?.[0]?.runtime_ms}ms. Ghost trajectory active.`);
      }
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setOptimizing(false);
    }
  };

  // Apply Healing Mitigation Action
  const handleApply = async () => {
    if (!decision) return;
    setApplying(true);
    setStatusMessage('Actuating mitigation policy to network twin via SDN controller...');
    try {
      const res = await fetch(apiUrl('/api/apply'), { method: 'POST' });
      if (res.ok) {
        const appData = await res.json();
        setIncident(null);
        setGhostMode(false);
        setStatusMessage(`Self-healing action enacted. ${appData.report?.summary || 'Network restored to nominal SLA.'}`);
        fetchLiveTelemetry();
      }
    } catch (err) {
      console.error('Apply error:', err);
    } finally {
      setApplying(false);
    }
  };

  // Reset Twin to Nominal Baseline
  const handleReset = async () => {
    setLoading(true);
    setStatusMessage('Resetting network twin and telemetry to baseline...');
    try {
      const res = await fetch(apiUrl('/api/reset'), { method: 'POST' });
      if (res.ok) {
        setIncident(null);
        setDecision(null);
        setGhostMode(false);
        setStatusMessage('Network state restored to nominal baseline.');
        fetchLiveTelemetry();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAnomalous =
    liveData.network_health_pct < 85 ||
    (incident && incident.severity === 'CRITICAL') ||
    Object.values(liveData.links || {}).some((l) => (l.util || 0) > 0.90);

  // Status pill config
  const getGlobalStatusPill = () => {
    if (loading) {
      return <span className="pill qc">Diagnosing on Qualcomm Cloud AI 100</span>;
    }
    if (ghostMode || (liveData.current_timeline?.stages?.rerouted && !liveData.current_timeline?.stages?.recovered)) {
      return <span className="pill cyan">Healing: Traffic Rerouted</span>;
    }
    if (isAnomalous) {
      return <span className="pill bad">Failing: Degradation on {incident?.anomalous_links?.[0] || 'A-B'}</span>;
    }
    if (liveData.network_health_pct < 95) {
      return <span className="pill warn">Degraded Link Latency</span>;
    }
    return <span className="pill ok">All sites healthy</span>;
  };

  // Map site names
  const siteNames = {
    london: 'London, UK (Core Cluster)',
    frankfurt: 'Frankfurt, DE (Edge Transit)',
    newyork: 'New York, US (Metropolitan Hub)',
    singapore: 'Singapore, SG (APAC Gateway)',
    chennai: 'Chennai, IN (Subsea Exchange)'
  };

  // Format link data for LiveLinkKpiTable
  const currentLinkKpis = Object.entries(liveData.links || {}).map(([key, l]) => ({
    id: key,
    name: key.replace('H', 'Core').replace('S1', 'Core').replace('-', '–'),
    status: l.up ? ((l.util || 0) > 0.90 ? 'Critical' : (l.util || 0) > 0.70 ? 'Elevated' : 'Healthy') : 'Down',
    util: Math.round((l.util || 0) * 100),
    thr: Math.round(l.rate_mbps || ((l.util || 0.4) * 1000)),
    lat: l.latency || 2.1,
    jit: Number(((l.latency || 2.1) * 0.08).toFixed(2)),
    loss: l.loss || 0.0,
    down: !l.up
  }));

  const openIncidentsCount = (liveData.incident_history || []).filter(i => i.status !== 'RECOVERED').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', background: 'var(--bg, #0A111D)', color: 'var(--ink, #DCE6F2)', fontFamily: "Barlow, system-ui, -apple-system, sans-serif" }}>
      {/* =========================================================================
          1. SLEEK BARLOW SIDEBAR (insp: self_healing_noc.html)
         ========================================================================= */}
      <nav 
        aria-label="Pages"
        style={{
          background: 'var(--side, #0D1626)',
          borderRight: '1px solid var(--line, #1F2E45)',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px 18px' }}>
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <circle cx="15" cy="15" r="13" fill="none" stroke="#22C3E6" strokeWidth="2" />
            <path d="M8 16l4 4 10-11" fill="none" stroke="#2ECC8F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <b style={{ fontFamily: '"Barlow Semi Condensed", Barlow, sans-serif', fontSize: '17px', lineHeight: '1.1', display: 'block', color: '#FFF' }}>
              Self-healing NOC
            </b>
            <span style={{ display: 'block', color: 'var(--muted, #8597AE)', fontSize: '11px', fontWeight: '400' }}>
              Simulated 5G network
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'overview' ? 'var(--panel2, #152236)' : 'transparent',
            color: activeTab === 'overview' ? 'var(--ink, #DCE6F2)' : 'var(--muted, #8597AE)',
            boxShadow: activeTab === 'overview' ? 'inset 3px 0 0 var(--cyan, #22C3E6)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'overview' ? '600' : '400'
          }}
        >
          <Activity size={16} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('sites')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'sites' ? 'var(--panel2, #152236)' : 'transparent',
            color: activeTab === 'sites' ? 'var(--ink, #DCE6F2)' : 'var(--muted, #8597AE)',
            boxShadow: activeTab === 'sites' ? 'inset 3px 0 0 var(--cyan, #22C3E6)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'sites' ? '600' : '400'
          }}
        >
          <Network size={16} />
          <span>Sites & Topology</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'ai' ? 'var(--panel2, #152236)' : 'transparent',
            color: activeTab === 'ai' ? 'var(--ink, #DCE6F2)' : 'var(--muted, #8597AE)',
            boxShadow: activeTab === 'ai' ? 'inset 3px 0 0 var(--cyan, #22C3E6)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'ai' ? '600' : '400'
          }}
        >
          <ShieldAlert size={16} />
          <span>AI Diagnosis & Twin</span>
        </button>

        <button
          onClick={() => setActiveTab('dataset')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'dataset' ? 'var(--panel2, #152236)' : 'transparent',
            color: activeTab === 'dataset' ? 'var(--ink, #DCE6F2)' : 'var(--muted, #8597AE)',
            boxShadow: activeTab === 'dataset' ? 'inset 3px 0 0 var(--cyan, #22C3E6)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'dataset' ? '600' : '400'
          }}
        >
          <Database size={16} />
          <span>Real 5G Dataset</span>
        </button>

        <button
          onClick={() => setActiveTab('quantum')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'quantum' ? 'var(--panel2, #152236)' : 'transparent',
            color: activeTab === 'quantum' ? 'var(--ink, #DCE6F2)' : 'var(--muted, #8597AE)',
            boxShadow: activeTab === 'quantum' ? 'inset 3px 0 0 var(--cyan, #22C3E6)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'quantum' ? '600' : '400'
          }}
        >
          <Cpu size={16} />
          <span>Quantum Optimizer</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'logs' ? 'var(--panel2, #152236)' : 'transparent',
            color: activeTab === 'logs' ? 'var(--ink, #DCE6F2)' : 'var(--muted, #8597AE)',
            boxShadow: activeTab === 'logs' ? 'inset 3px 0 0 var(--cyan, #22C3E6)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'logs' ? '600' : '400'
          }}
        >
          <FileText size={16} />
          <span>Incident Logs</span>
          {openIncidentsCount > 0 && (
            <span style={{ marginLeft: 'auto', background: 'var(--bad, #F05A5A)', color: '#FFF', borderRadius: '999px', fontSize: '11px', padding: '0 7px', lineHeight: '18px', fontWeight: '700' }}>
              {openIncidentsCount}
            </span>
          )}
        </button>

        <div style={{ marginTop: 'auto', color: 'var(--dim, #4B5D75)', fontSize: '11px', padding: '12px 8px', borderTop: '1px solid var(--line, #1F2E45)', lineHeight: '1.4' }}>
          <div>Hardware: Qualcomm Cloud AI 100</div>
          <div>Model: Llama-3.1-8B (Cirrascale)</div>
          <div style={{ marginTop: '4px' }}>TelecomTS 5G Replay Engine</div>
        </div>
      </nav>

      {/* =========================================================================
          2. MAIN VIEW WORKSPACE & TOP HEADER HUD
         ========================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Top Header HUD (insp: self_healing_noc.html) */}
        <header 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            padding: '12px 24px',
            borderBottom: '1px solid var(--line, #1F2E45)',
            background: 'var(--side, #0D1626)',
            position: 'sticky',
            top: 0,
            zIndex: 40
          }}
        >
          <h1 style={{ fontFamily: '"Barlow Semi Condensed", Barlow, sans-serif', fontSize: '20px', fontWeight: '600', margin: 0 }}>
            {activeTab === 'overview' && 'Overview'}
            {activeTab === 'sites' && (siteNames[selectedSite] || 'Sites & Topology')}
            {activeTab === 'ai' && 'AI Diagnosis & Digital Twin Sandbox'}
            {activeTab === 'dataset' && 'Real 5G Dataset (TelecomTS 2,000 Samples)'}
            {activeTab === 'quantum' && 'Quantum QUBO Solver & Pareto Optimization'}
            {activeTab === 'logs' && 'Incident Log History'}
          </h1>

          <span style={{ color: 'var(--muted, #8597AE)', fontSize: '13px' }}>
            {activeTab === 'sites' ? 'Site Detail' : 'Live Gateway'}
          </span>

          {getGlobalStatusPill()}

          <span className="qcbadge">
            <Radio size={14} color="var(--qc, #7B93FF)" />
            Qualcomm Cloud AI 100, Llama-3.1-8B (~2.37s)
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: '1px solid var(--line, #1F2E45)',
                color: 'var(--muted, #8597AE)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              Reset Twin
            </button>

            <span style={{ color: 'var(--muted, #8597AE)', fontVariantNumeric: 'tabular-nums', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} />
              {currentTime}
            </span>
          </div>
        </header>

        {/* Workspace Body */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          {/* =========================================================================
              VIEW 1: OVERVIEW (Master NOC Grid)
             ========================================================================= */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr) 320px', gap: '16px' }}>
              {/* Column 1: System Status Gauge & Quick Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SystemStatusGauge
                  healthPct={liveData.network_health_pct}
                  sitesHealthy={liveData.network_health_pct > 80 ? 5 : 4}
                  totalSites={5}
                  totalNodes={30}
                />

                {/* Fault Injector Panel */}
                <div className="panel" style={{ background: 'var(--panel, #111B2C)', border: '1px solid var(--line, #1F2E45)', borderRadius: '12px', padding: '16px' }}>
                  <h2 style={{ fontSize: '16px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink, #DCE6F2)' }}>
                    <Flame size={16} color="var(--bad, #F05A5A)" />
                    Inject Fault Simulation
                  </h2>

                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted, #8597AE)', marginBottom: '4px' }}>
                    Fault Type (TelecomTS Real Root Cause)
                  </label>
                  <select
                    value={selectedCause}
                    onChange={(e) => setSelectedCause(e.target.value)}
                    style={{ width: '100%', background: 'var(--panel2, #152236)', border: '1px solid var(--line, #1F2E45)', borderRadius: '6px', padding: '7px 8px', color: 'var(--ink, #DCE6F2)', fontSize: '12px', marginBottom: '10px' }}
                  >
                    <optgroup label="Radio Interference & Degradation">
                      <option value="Jamming">Jamming (External flooding)</option>
                      <option value="Co-Channel Interference (Mild)">Co-Channel Interference (Mild)</option>
                      <option value="Co-Channel Interference (Severe)">Co-Channel Interference (Severe)</option>
                      <option value="Doppler Shift (Severe)">Doppler Shift (High speed mobility)</option>
                      <option value="Faulty RF Filters (Temporal)">Faulty RF Filters (Temporal flapping)</option>
                    </optgroup>
                    <optgroup label="Physical & Optical Outages">
                      <option value="Antenna Failure">Antenna Failure (Optical/PHY down)</option>
                    </optgroup>
                    <optgroup label="Traffic & Capacity Surges">
                      <option value="High Network Congestion (Sudden Spike)">High Network Congestion (Sudden Spike)</option>
                      <option value="High Network Congestion (Gradual Buildup)">High Network Congestion (Gradual Buildup)</option>
                      <option value="Buffer Overflow (Gradual Buildup)">Buffer Overflow (Tail drop)</option>
                    </optgroup>
                    <optgroup label="Cellular Control Misconfiguration">
                      <option value="Faulty Handover Algorithm (Too Frequent)">Faulty Handover Algorithm (Flapping)</option>
                      <option value="Resource Allocation Bugs">Resource Allocation Bugs (PRB imbalance)</option>
                    </optgroup>
                    <optgroup label="Control Normal Test">
                      <option value="Normal">Normal (Control test - no false alarm)</option>
                    </optgroup>
                  </select>

                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted, #8597AE)', marginBottom: '4px' }}>
                    Target Interface
                  </label>
                  <select
                    value={targetLink}
                    onChange={(e) => setTargetLink(e.target.value)}
                    style={{ width: '100%', background: 'var(--panel2, #152236)', border: '1px solid var(--line, #1F2E45)', borderRadius: '6px', padding: '7px 8px', color: 'var(--ink, #DCE6F2)', fontSize: '12px', marginBottom: '10px' }}
                  >
                    <option value="A-B">Core–Edge 1 (A-B Primary Backbone)</option>
                    <option value="B-C">Core–Edge 2 (B-C Transit Corridor)</option>
                    <option value="S1-A">Core–Edge 3 (S1-A North Ring)</option>
                    <option value="A-D">Core–Edge 4 (A-D Bypass Link)</option>
                    <option value="D-B">Core–Edge 5 (D-B Failover Trunk)</option>
                  </select>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--muted, #8597AE)' }}>Intensity</label>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ink, #DCE6F2)' }}>{Math.round(intensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.1"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--bad, #F05A5A)', marginBottom: '12px' }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted, #8597AE)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={autoHeal}
                        onChange={(e) => setAutoHeal(e.target.checked)}
                      />
                      Auto-heal (Twin SLA)
                    </label>

                    <button
                      onClick={() => handleDiagnosisTrigger(selectedCause, targetLink)}
                      disabled={loading}
                      style={{
                        background: 'var(--bad, #F05A5A)',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Simulating...' : 'Inject Fault'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 2: Interactive World Map & Recovery Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <WorldSiteMap
                  sites={[
                    { id: 'london', name: 'London, UK', lat: 51.5, lon: -0.1, status: isAnomalous ? 'bad' : 'ok', latency: 2.1, loss: isAnomalous ? 2.4 : 0.0, nodes: 6, links: 10 },
                    { id: 'frankfurt', name: 'Frankfurt, DE', lat: 50.1, lon: 8.7, status: 'ok', latency: 3.4, loss: 0.0, nodes: 5, links: 8 },
                    { id: 'newyork', name: 'New York, US', lat: 40.7, lon: -74.0, status: 'ok', latency: 8.2, loss: 0.0, nodes: 7, links: 12 },
                    { id: 'singapore', name: 'Singapore, SG', lat: 1.35, lon: 103.8, status: 'ok', latency: 14.5, loss: 0.0, nodes: 5, links: 8 },
                    { id: 'chennai', name: 'Chennai, IN', lat: 13.1, lon: 80.3, status: 'ok', latency: 18.2, loss: 0.0, nodes: 6, links: 9 },
                  ]}
                  onSelectSite={(site) => {
                    setSelectedSite(site.id);
                    setActiveTab('sites');
                  }}
                />

                <RecoveryTimelineBar
                  timeline={liveData.current_timeline}
                  activeIncident={incident}
                  elapsedSeconds={incident ? 3.4 : 0}
                />

                {/* Sparklines row (Worst Latency + Delivered Throughput) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="panel" style={{ background: 'var(--panel, #111B2C)', border: '1px solid var(--line, #1F2E45)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink, #DCE6F2)' }}>Worst Latency, all sites</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted, #8597AE)' }}>last 60s</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: '"Barlow Semi Condensed", Barlow, sans-serif', color: 'var(--warn, #F0A93B)', margin: '4px 0' }}>
                      {latencyHistory[latencyHistory.length - 1]?.toFixed(1) || '2.1'} ms
                    </div>
                    <svg viewBox="0 0 300 60" style={{ width: '100%', height: '60px' }}>
                      <polyline
                        fill="none"
                        stroke="var(--warn, #F0A93B)"
                        strokeWidth="2"
                        points={latencyHistory.map((val, idx) => `${(idx / (latencyHistory.length - 1)) * 300},${55 - Math.min(val / 30, 1) * 45}`).join(' ')}
                      />
                    </svg>
                  </div>

                  <div className="panel" style={{ background: 'var(--panel, #111B2C)', border: '1px solid var(--line, #1F2E45)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink, #DCE6F2)' }}>Delivered Throughput</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted, #8597AE)' }}>last 60s</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: '"Barlow Semi Condensed", Barlow, sans-serif', color: 'var(--cyan, #22C3E6)', margin: '4px 0' }}>
                      {((throughputHistory[throughputHistory.length - 1] || 4200) / 1000).toFixed(2)} Gbps
                    </div>
                    <svg viewBox="0 0 300 60" style={{ width: '100%', height: '60px' }}>
                      <polyline
                        fill="none"
                        stroke="var(--cyan, #22C3E6)"
                        strokeWidth="2"
                        points={throughputHistory.map((val, idx) => `${(idx / (throughputHistory.length - 1)) * 300},${55 - Math.min(val / 6000, 1) * 45}`).join(' ')}
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Column 3: Active Alerts & Telemetry Root-Cause Chain */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="panel" style={{ background: 'var(--panel, #111B2C)', border: '1px solid var(--line, #1F2E45)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink, #DCE6F2)' }}>
                      <AlertTriangle size={16} color="var(--warn, #F0A93B)" />
                      Active Alerts
                    </h2>
                    <span style={{ fontSize: '11px', color: 'var(--muted, #8597AE)' }}>
                      {isAnomalous ? '1 Critical' : 'All clear'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {isAnomalous ? (
                      <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(240, 90, 90, 0.1)', border: '1px solid rgba(240, 90, 90, 0.3)', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--bad, #F05A5A)', fontWeight: '600' }}>
                          <span>CRITICAL: {incident?.root_cause || selectedCause}</span>
                          <span>{currentTime.slice(0, 8)}</span>
                        </div>
                        <div style={{ color: 'var(--ink, #DCE6F2)', marginTop: '2px' }}>
                          Interface {targetLink} telemetry threshold breached. Packet loss &gt; 2.4%.
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(46, 204, 143, 0.08)', border: '1px solid rgba(46, 204, 143, 0.2)', fontSize: '12px', color: 'var(--ok, #2ECC8F)' }}>
                        ✓ Zero unhandled alerts. All 5 edge sites operating within SLA boundaries.
                      </div>
                    )}

                    <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--panel2, #152236)', border: '1px solid var(--line, #1F2E45)', fontSize: '11px', color: 'var(--muted, #8597AE)' }}>
                      ℹ BGP Peerings: 12 Established (AS65001 - AS65005)
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--panel2, #152236)', border: '1px solid var(--line, #1F2E45)', fontSize: '11px', color: 'var(--muted, #8597AE)' }}>
                      ℹ Qualcomm AI 100 Heartbeat: Active (0.04% idle jitter)
                    </div>
                  </div>
                </div>

                {/* Telemetry and RCA Flow */}
                <div className="panel" style={{ background: 'var(--panel, #111B2C)', border: '1px solid var(--line, #1F2E45)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--ink, #DCE6F2)' }}>
                      Telemetry & RCA Chain
                    </h2>
                    <button
                      onClick={() => setActiveTab('ai')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--cyan, #22C3E6)', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Details →
                    </button>
                  </div>

                  {incident ? (
                    <div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', background: 'var(--panel2, #152236)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line, #1F2E45)' }}>
                          Site: London
                        </span>
                        <span style={{ fontSize: '11px', background: 'var(--panel2, #152236)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line, #1F2E45)' }}>
                          Link: {targetLink}
                        </span>
                      </div>
                      <ol className="flow">
                        <li className="done">Anomaly detected from live eBPF KPIs on {targetLink}</li>
                        <li className="done">Trained Random Forest Classifier: {incident.root_cause || selectedCause} (96.5%)</li>
                        <li className="qc">Qualcomm Cloud AI 100 Llama-3.1-8B root cause reasoning</li>
                        <li className="done">Optimal reroute: Divert flow via router D to relieve {targetLink}</li>
                      </ol>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--muted, #8597AE)', fontSize: '12px', padding: '16px 0', textAlign: 'center' }}>
                      Inject a fault from the left panel to view the live root-cause deduction chain.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Digital Twin Injection & Rectification Lifecycle Viewer */}
            <DigitalTwinHealingViewer
              activeIncident={incident}
              isAnomalous={isAnomalous}
              targetLink={targetLink}
              selectedCause={selectedCause}
              links={liveData.links || {}}
              routingTable={liveData.routing_table || liveData.ospf_routing?.routing_table || []}
              flows={liveData.flows || []}
              onSelectTarget={(tgt) => setTargetLink(tgt)}
              onSelectCause={(cause) => setSelectedCause(cause)}
              onTriggerFault={(cause, tgt) => handleDiagnosisTrigger(cause, tgt)}
              onApplyHeal={handleApply}
              onReset={handleReset}
            />

            {/* Interactive How QUBO Works Explainer & Hamiltonian Solver */}
            <QuboExplainerPanel
              targetLink={targetLink}
              selectedCause={selectedCause}
              onApplyRemediation={handleApply}
            />
          </div>
        )}

          {/* =========================================================================
              VIEW 2: SITES & TOPOLOGY (Interactive Graph, Live KPIs, Dynamic OSPF)
             ========================================================================= */}
          {activeTab === 'sites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Site selector pills */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--panel, #111B2C)', border: '1px solid var(--line, #1F2E45)', borderRadius: '10px', padding: '10px 14px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted, #8597AE)', fontWeight: '600' }}>Active Site:</span>
                {['london', 'frankfurt', 'newyork', 'singapore', 'chennai'].map((siteKey) => (
                  <button
                    key={siteKey}
                    onClick={() => setSelectedSite(siteKey)}
                    style={{
                      background: selectedSite === siteKey ? 'var(--panel2, #152236)' : 'transparent',
                      color: selectedSite === siteKey ? 'var(--cyan, #22C3E6)' : 'var(--muted, #8597AE)',
                      border: selectedSite === siteKey ? '1px solid var(--cyan, #22C3E6)' : '1px solid transparent',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {siteKey.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Topology Cytoscape Network & Live Link KPI Table */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '16px' }}>
                <div className="panel" style={{ background: 'var(--panel, #111B2C)', border: '1px solid var(--line, #1F2E45)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--ink, #DCE6F2)' }}>
                      Topology Map — {siteNames[selectedSite] || 'London'}
                    </h2>
                    <span className={`pill ${isAnomalous ? 'bad' : 'ok'}`}>
                      {isAnomalous ? 'Failing' : 'Healthy'}
                    </span>
                  </div>
                  <NetworkGraph
                    selectedSite={selectedSite}
                    links={liveData.links || {}}
                    flows={liveData.flows || []}
                    isAnomalous={isAnomalous}
                    selectedActions={decision?.chosen?.map(a => a.action_id) || []}
                    ghostMode={ghostMode}
                    predictedLinks={decision?.predicted?.affected_links || {}}
                    activeRouting={liveData.routing_table || liveData.ospf_routing?.routing_table || []}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <LiveLinkKpiTable
                    links={currentLinkKpis}
                    siteName={siteNames[selectedSite] || 'London'}
                  />

                  <RoutingTablePanel
                    routes={liveData.ospf_routing?.routing_table || []}
                    isFailover={isAnomalous}
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: AI DIAGNOSIS & DIGITAL TWIN SANDBOX (16-KPIs, z-scores, Benchmarks)
             ========================================================================= */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Feature extraction grid + Z-scores + Model Benchmarks */}
              <AiFeatureExtractionGrid
                currentSample={liveData.current_dataset_sample}
                diagnosisResult={liveData.diagnosis_result}
                activeIncident={incident}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TwinSafetyChecklist
                  fixes={incident?.twin_safety_analysis || liveData.diagnosis_result?.twin_safety_analysis || liveData.twin_safety_analysis}
                  incident={incident}
                  diagnosisResult={liveData.diagnosis_result}
                  targetLink={targetLink}
                />

                <IncidentCard
                  incident={incident}
                  isAnomalous={isAnomalous}
                  diagnosisResult={liveData.diagnosis_result}
                  latestReport={liveData.latest_report}
                  onClear={() => setIncident(null)}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: REAL 5G DATASET EXPLORER (2000 TelecomTS Samples)
             ========================================================================= */}
          {activeTab === 'dataset' && (
            <DatasetExplorerPanel
              onInjectSample={handleInjectDatasetSample}
            />
          )}

          {/* =========================================================================
              VIEW 5: QUANTUM QUBO SOLVER & OPTIMIZATION
             ========================================================================= */}
          {activeTab === 'quantum' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <QuboExplainerPanel
                targetLink={targetLink}
                selectedCause={selectedCause}
                onApplyRemediation={handleApply}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <DecisionCard
                    decision={decision}
                    onApply={handleApply}
                    isApplying={applying}
                    candidateActions={candidateActions}
                    isOptimizing={optimizing}
                    onOptimize={handleOptimize}
                  />

                  <RLComparisonPanel
                    metrics={liveData.rl_metrics}
                    activeIncident={incident}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <ParetoChart
                    candidateActions={candidateActions}
                    chosenActionIds={decision?.chosen?.map(a => a.action_id) || []}
                    onSelectAction={() => {}}
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 6: INCIDENT LOG HISTORY (TelecomTS replay + Live chaos)
             ========================================================================= */}
          {activeTab === 'logs' && (
            <IncidentHistoryTable
              incidents={liveData.incident_history || []}
              onSelectIncident={(inc) => {
                setStatusMessage(`Selected incident ${inc.id}: ${inc.cause}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
