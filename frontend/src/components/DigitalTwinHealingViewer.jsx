import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Sparkles,
  Layers,
  Radio,
  WifiOff,
  Flame,
  ShieldAlert,
  Network,
  Cpu,
  RefreshCw,
  Sliders,
  Check,
  FastForward,
  Repeat,
  Terminal,
  Clock,
  Gauge,
  Compass,
} from 'lucide-react';

/**
 * Helper to extract comprehensive physical metrics and descriptions
 * for any telecom fault injection.
 */
function getFaultProfile(cause) {
  const c = (cause || '').toLowerCase();

  if (c.includes('antenna')) {
    return {
      key: 'antenna',
      name: 'Antenna Failure',
      sub: 'Transceiver Decoupling / RF Blackout',
      severity: 'CRITICAL',
      color: 'var(--bad, #F05A5A)',
      injectedLoss: 100.0,
      injectedLat: 999.0,
      injectedUtil: 0.0,
      badgeText: '⚡ PHY DOWN / 100% LOSS',
      symptom: 'Complete RF signal blackout. Physical PHY transceiver lost carrier frame sync.',
      aiDiagnosis: 'Qualcomm AI: Antenna array decoupled (VSWR > 4.2). Immediate transit bypass required.',
      remedyAction: 'REROUTE_FLOW + HARD_RESET',
      remedyDesc: 'OSPF dynamic Dijkstra reroute via Transit D + remote PHY transceiver power cycle.',
      nominalLat: 2.4,
      nominalLoss: 0.0,
      healedLat: 11.2,
      healedLoss: 0.0,
      quboBlast: 0.20,
    };
  }

  if (c.includes('jam') || c.includes('interference')) {
    return {
      key: 'interference',
      name: 'Co-Channel Interference / Jamming',
      sub: 'RF Noise Floor & BLER Surge',
      severity: 'CRITICAL',
      color: 'var(--warn, #F0A93B)',
      injectedLoss: 39.0,
      injectedLat: 300.0,
      injectedUtil: 48.0,
      badgeText: '⚡ SINR -8.4dB (39% LOSS)',
      symptom: 'Severe RF interference injection. SINR dropped below -8dB causing 39% packet drop.',
      aiDiagnosis: 'Qualcomm AI: Severe frequency overlap detected. Frequency carrier hopping indicated.',
      remedyAction: 'CHANNEL_HOP + REROUTE',
      remedyDesc: 'Carrier shifted to clean frequency band + bulk flow rerouted via bypass transit.',
      nominalLat: 3.1,
      nominalLoss: 0.0,
      healedLat: 8.5,
      healedLoss: 0.0,
      quboBlast: 0.18,
    };
  }

  if (c.includes('congestion') || c.includes('spike')) {
    return {
      key: 'congestion',
      name: 'High Network Congestion',
      sub: 'Microburst & Buffer Saturation',
      severity: 'HIGH',
      color: '#FF6B6B',
      injectedLoss: 4.8,
      injectedLat: 94.0,
      injectedUtil: 96.0,
      badgeText: '⚡ QUEUE OVERFLOW (96% UTIL)',
      symptom: 'Ingress traffic surge saturating interface buffer queue. Outbound tail drop active.',
      aiDiagnosis: 'Qualcomm AI: Ingress FIFO queue depth >92%. Rate limiting & load shedding required.',
      remedyAction: 'RATE_LIMIT_120M + LOAD_SHED',
      remedyDesc: 'Cap bulk traffic to 120 Mbps at S1 + shed low-priority flows to alternate transit.',
      nominalLat: 2.1,
      nominalLoss: 0.0,
      healedLat: 4.2,
      healedLoss: 0.0,
      quboBlast: 0.15,
    };
  }

  if (c.includes('handover') || c.includes('flapping')) {
    return {
      key: 'handover',
      name: 'Faulty Handover (Flapping)',
      sub: 'Route Churn & Hysteresis Collapse',
      severity: 'HIGH',
      color: '#EC4899',
      injectedLoss: 14.2,
      injectedLat: 120.0,
      injectedUtil: 74.0,
      badgeText: '⚡ ROUTE FLAPPING (14% LOSS)',
      symptom: 'Rapid route flapping between core interfaces. Excessive Dijkstra SPF churn.',
      aiDiagnosis: 'Qualcomm AI: Handover hysteresis threshold collapsed (Hys < 2dB). Pinning required.',
      remedyAction: 'DAMPEN_FLAPPING + PIN_PATH',
      remedyDesc: 'Apply exponential route flap dampening + pin critical flow to stable transit trunk.',
      nominalLat: 2.6,
      nominalLoss: 0.0,
      healedLat: 6.8,
      healedLoss: 0.0,
      quboBlast: 0.22,
    };
  }

  if (c.includes('bug') || c.includes('resource') || c.includes('prb')) {
    return {
      key: 'resource',
      name: 'Resource Allocation Bug',
      sub: 'Scheduler Thread Starvation',
      severity: 'MEDIUM',
      color: '#8B5CF6',
      injectedLoss: 8.5,
      injectedLat: 58.0,
      injectedUtil: 88.0,
      badgeText: '⚡ SCHEDULER STALL (PRB LOCK)',
      symptom: 'eBPF scheduler thread contention. Uneven PRB distribution starving high-priority queues.',
      aiDiagnosis: 'Qualcomm AI: Thread starvation on egress queue manager. Dynamic rebalancing indicated.',
      remedyAction: 'DYNAMIC_PRB_REBALANCE',
      remedyDesc: 'Rebalance resource blocks across core interfaces and equalize queue weights.',
      nominalLat: 2.2,
      nominalLoss: 0.0,
      healedLat: 5.1,
      healedLoss: 0.0,
      quboBlast: 0.14,
    };
  }

  if (c.includes('kill') || c.includes('router') || c.includes('node')) {
    return {
      key: 'kill',
      name: 'Core Router Failure',
      sub: 'Node Crash / BGP Peer Loss',
      severity: 'CRITICAL',
      color: '#DC2626',
      injectedLoss: 100.0,
      injectedLat: 999.0,
      injectedUtil: 0.0,
      badgeText: '💀 NODE FAILURE / DEAD',
      symptom: 'Router kernel panic. Complete loss of BGP peerings and interface packet forwarding.',
      aiDiagnosis: 'Qualcomm AI: Core routing engine unresponsive. Immediate topology purge and failover.',
      remedyAction: 'TOPOLOGY_PURGE + FAILOVER',
      remedyDesc: 'Purge dead node from OSPF adjacency table and divert traffic around failed router.',
      nominalLat: 2.1,
      nominalLoss: 0.0,
      healedLat: 12.5,
      healedLoss: 0.0,
      quboBlast: 0.35,
    };
  }

  // Default fallback
  return {
    key: 'degradation',
    name: cause || 'Link Degradation',
    sub: 'Telemetry SLA Anomaly',
    severity: 'CRITICAL',
    color: 'var(--bad, #F05A5A)',
    injectedLoss: 39.0,
    injectedLat: 300.0,
    injectedUtil: 96.0,
    badgeText: '⚡ 300ms LATENCY SURGE',
    symptom: 'SLA threshold breached on core interface. High latency and packet drop rate.',
    aiDiagnosis: 'Qualcomm AI: Interface telemetry anomaly. Dynamic OSPF bypass recommended.',
    remedyAction: 'REROUTE_FLOW',
    remedyDesc: 'Divert bulk flow via alternate transit corridor.',
    nominalLat: 2.1,
    nominalLoss: 0.0,
    healedLat: 11.2,
    healedLoss: 0.0,
    quboBlast: 0.20,
  };
}

/**
 * Normalizes user-selected target string to canonical interface
 */
function normalizeTarget(target) {
  if (!target) return 'A-B';
  const t = String(target).toUpperCase();
  if (t.includes('B-C') || t.includes('EDGE 2')) return 'B-C';
  if (t.includes('S1-A') || t.includes('EDGE 3')) return 'S1-A';
  if (t.includes('A-D') || t.includes('EDGE 4')) return 'A-D';
  if (t.includes('D-B') || t.includes('EDGE 5')) return 'D-B';
  if (t.includes('A-B') || t.includes('EDGE 1')) return 'A-B';
  return t;
}

const TOTAL_SIM_TIME = 7.0; // Total duration in seconds for 1 full simulation run

/**
 * DigitalTwinHealingViewer:
 * A comprehensive Simulation Run Engine visualizing real-time fault injection,
 * physical telemetry degradation, Qualcomm AI 100 reasoning, QUBO Hamiltonian minimization,
 * and OSPF Dijkstra self-healing failover.
 */
export default function DigitalTwinHealingViewer({
  activeIncident = null,
  isAnomalous = false,
  targetLink = 'A-B',
  selectedCause = 'Co-Channel Interference (Severe)',
  links = {},
  routingTable = [],
  flows = [],
  onSelectTarget = null,
  onSelectCause = null,
  onTriggerFault = null,
  onApplyHeal = null,
  onReset = null,
}) {
  // View mode: 'backbone' (S1-A-D-B-C) or 'site' (Core Hub + 6 Edge Cells)
  const [viewMode, setViewMode] = useState('backbone');

  // Active target and cause states (local state synchronized with parent)
  const [currentTarget, setCurrentTarget] = useState(normalizeTarget(targetLink));
  const [currentCause, setCurrentCause] = useState(selectedCause);

  useEffect(() => {
    if (activeIncident?.anomalous_links?.[0]) {
      setCurrentTarget(normalizeTarget(activeIncident.anomalous_links[0]));
    } else if (targetLink) {
      setCurrentTarget(normalizeTarget(targetLink));
    }
  }, [targetLink, activeIncident]);

  useEffect(() => {
    if (activeIncident?.root_cause) {
      setCurrentCause(activeIncident.root_cause);
    } else if (selectedCause) {
      setCurrentCause(selectedCause);
    }
  }, [selectedCause, activeIncident]);

  const profile = getFaultProfile(currentCause);

  // Simulation Run States
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simTime, setSimTime] = useState(0.0); // 0.0 to 7.0 seconds
  const [simSpeed, setSimSpeed] = useState(1.0); // 0.5x, 1x, 2x
  const [loopMode, setLoopMode] = useState(false); // auto-repeat simulation run
  const [showLogs, setShowLogs] = useState(true);

  // Derive current stage directly from simulation time
  // 0.0s - 1.4s : nominal
  // 1.4s - 3.0s : injected
  // 3.0s - 4.6s : diagnosing
  // 4.6s - 6.0s : qubo_solving
  // 6.0s - 7.0s : healed
  const getStageFromTime = (t) => {
    if (t < 1.4) return 'nominal';
    if (t < 3.0) return 'injected';
    if (t < 4.6) return 'diagnosing';
    if (t < 6.0) return 'qubo_solving';
    return 'healed';
  };

  const stage = getStageFromTime(simTime);

  // Sync external anomalies if simulation is idle
  useEffect(() => {
    if (!isSimulating) {
      if (isAnomalous) {
        setSimTime(1.8); // jump to injected stage
      } else if (!activeIncident && simTime !== 0.0 && simTime < 6.0) {
        setSimTime(0.0);
      }
    }
  }, [isAnomalous, activeIncident]);

  // Main Simulation Run Clock Tick (50ms interval)
  useEffect(() => {
    let interval;
    if (isSimulating && !isPaused) {
      interval = setInterval(() => {
        setSimTime((prev) => {
          const delta = 0.05 * simSpeed;
          const next = prev + delta;

          // Trigger Heal action when entering stage 5
          if (prev < 6.0 && next >= 6.0) {
            if (onApplyHeal) onApplyHeal();
          }

          if (next >= TOTAL_SIM_TIME) {
            if (loopMode) {
              return 0.0; // restart simulation run
            } else {
              setIsSimulating(false);
              return TOTAL_SIM_TIME;
            }
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isSimulating, isPaused, simSpeed, loopMode, onApplyHeal]);

  // Simulation control actions
  const startSimulation = () => {
    setSimTime(0.0);
    setIsSimulating(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (!isSimulating) {
      setIsSimulating(true);
      setIsPaused(false);
    } else {
      setIsPaused((p) => !p);
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setIsPaused(false);
    setSimTime(0.0);
    if (onReset) onReset();
  };

  const jumpToStage = (targetStage) => {
    setIsPaused(true);
    switch (targetStage) {
      case 'nominal':
        setSimTime(0.0);
        break;
      case 'injected':
        setSimTime(1.8);
        break;
      case 'diagnosing':
        setSimTime(3.4);
        break;
      case 'qubo_solving':
        setSimTime(4.8);
        break;
      case 'healed':
        setSimTime(6.4);
        if (onApplyHeal) onApplyHeal();
        break;
      default:
        break;
    }
  };

  // Dynamic path computation based on the target link and stage
  const getPathForTarget = () => {
    const isDegraded = stage === 'injected' || stage === 'diagnosing';
    const isHealed = stage === 'healed' || stage === 'qubo_solving';

    switch (currentTarget) {
      case 'B-C':
        if (isDegraded) return 'S1 → A → B ⚡ C';
        if (isHealed) return 'S1 → A → [D] → C';
        return 'S1 → A → B → C';
      case 'S1-A':
        if (isDegraded) return 'S1 ⚡ A → B → C';
        if (isHealed) return 'S1 → [D] → B → C';
        return 'S1 → A → B → C';
      case 'A-D':
        if (isDegraded) return 'S1 → A [⚡ D] B → C';
        if (isHealed) return 'S1 → A → B → C';
        return 'S1 → A → B → C';
      case 'D-B':
        if (isDegraded) return 'S1 → A [D ⚡] B → C';
        if (isHealed) return 'S1 → A → B → C';
        return 'S1 → A → B → C';
      default: // 'A-B'
        if (isDegraded) return 'S1 → A ⚡ B → C';
        if (isHealed) return 'S1 → A → [D] → B → C';
        return 'S1 → A → B → C';
    }
  };

  const getBypassDescription = () => {
    switch (currentTarget) {
      case 'B-C':
        return 'Via Transit Node D directly to Tokyo Egress C';
      case 'S1-A':
        return 'Via Disaster Recovery Transit D to Router B';
      case 'A-D':
      case 'D-B':
        return 'Primary trunk S1-A-B-C safeguarded with strict QoS';
      default:
        return 'Via Singapore Transit Node D to Router B';
    }
  };

  // Metrics based on stage and active fault profile
  const getMetrics = () => {
    switch (stage) {
      case 'injected':
        return {
          latency: profile.injectedLat,
          loss: profile.injectedLoss,
          util: profile.injectedUtil,
          status: 'FAULT ACTIVE',
          path: getPathForTarget(),
          healthy: false,
        };
      case 'diagnosing':
        return {
          latency: profile.injectedLat * 0.95,
          loss: profile.injectedLoss * 0.92,
          util: profile.injectedUtil,
          status: 'QUALCOMM AI EVAL',
          path: getPathForTarget(),
          healthy: false,
        };
      case 'qubo_solving':
        return {
          latency: 45.0,
          loss: 2.0,
          util: 65,
          status: 'OSPF CONVERGING',
          path: getPathForTarget(),
          healthy: false,
        };
      case 'healed':
        return {
          latency: profile.healedLat,
          loss: profile.healedLoss,
          util: 52,
          status: 'RECTIFIED (SLA MET)',
          path: getPathForTarget(),
          healthy: true,
        };
      default:
        return {
          latency: profile.nominalLat,
          loss: profile.nominalLoss,
          util: 38,
          status: 'NOMINAL',
          path: 'S1 → A → B → C',
          healthy: true,
        };
    }
  };

  const m = getMetrics();
  const isFaultStage = stage === 'injected' || stage === 'diagnosing';
  const isBypassActive = stage === 'healed' || stage === 'qubo_solving';
  const progressPercent = Math.min(100, Math.round((simTime / TOTAL_SIM_TIME) * 100));

  // Dynamic Hamiltonian energy descent for stage 4
  const getHamiltonianEnergy = () => {
    if (stage === 'nominal') return 0.0;
    if (stage === 'injected' || stage === 'diagnosing') return 1080.0;
    if (stage === 'qubo_solving') {
      const qProgress = Math.max(0, Math.min(1, (simTime - 4.6) / 1.4));
      return Math.round(1080.0 - qProgress * (1080.0 - 32.0));
    }
    return 32.0; // Ground state minimum
  };

  // Live simulation event logs
  const getSimLogs = () => {
    const logs = [];
    logs.push({
      time: 'T+00:00.00',
      tag: 'NOMINAL',
      type: 'ok',
      msg: `Baseline telemetry verified across interfaces. Contract SLA: ${profile.nominalLat}ms latency, 0.0% loss.`,
    });
    if (simTime >= 1.4) {
      logs.push({
        time: 'T+00:01.40',
        tag: 'CHAOS_INJECT',
        type: 'bad',
        msg: `Fault '${profile.name}' triggered on ${currentTarget}. Loss surged to ${profile.injectedLoss}%, latency ${profile.injectedLat}ms.`,
      });
    }
    if (simTime >= 3.0) {
      logs.push({
        time: 'T+00:03.00',
        tag: 'QUALCOMM_AI',
        type: 'ai',
        msg: `Qualcomm Cloud AI 100 (Llama-3.1-8B) deduced root cause in 2.45s -> ${profile.aiDiagnosis}`,
      });
    }
    if (simTime >= 4.6) {
      logs.push({
        time: 'T+00:04.60',
        tag: 'QUBO_SOLVER',
        type: 'qubo',
        msg: `Formulated Ising Hamiltonian matrix. Ground state energy minimized to H(x)=32.0. Selected action: ${profile.remedyAction}`,
      });
    }
    if (simTime >= 6.0) {
      logs.push({
        time: 'T+00:06.00',
        tag: 'RECTIFIED',
        type: 'ok',
        msg: `Dynamic Dijkstra failover active via ${m.path}. SLA recovered to 100% (Latency: ${profile.healedLat}ms, Loss: 0.0%).`,
      });
    }
    return logs;
  };

  // Handle changing target from inline selector
  const handleTargetChange = (tgt) => {
    setCurrentTarget(tgt);
    if (onSelectTarget) onSelectTarget(tgt);
  };

  // Handle changing cause from inline selector
  const handleCauseChange = (cause) => {
    setCurrentCause(cause);
    if (onSelectCause) onSelectCause(cause);
  };

  return (
    <div
      className="panel"
      style={{
        background: 'var(--panel, #111B2C)',
        border: '1px solid var(--line, #1F2E45)',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
        boxShadow: isSimulating ? '0 0 25px rgba(34, 195, 230, 0.08)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Simulation Header and Master Control Console */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--line, #1F2E45)',
          paddingBottom: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isSimulating && !isPaused ? 'var(--cyan, #22C3E6)' : 'var(--muted, #8597AE)',
                boxShadow: isSimulating && !isPaused ? '0 0 10px var(--cyan, #22C3E6)' : 'none',
              }}
            />
            <h2
              style={{
                fontSize: '16px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--ink, #DCE6F2)',
              }}
            >
              <Sparkles size={17} color="var(--cyan, #22C3E6)" />
              Digital Twin Simulation Run: {profile.name}
            </h2>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted, #8597AE)', marginTop: '3px' }}>
            Live twin state mutation on interface{' '}
            <strong style={{ color: 'var(--cyan, #22C3E6)' }}>{currentTarget}</strong> &bull; Qualcomm AI analysis &bull; QUBO self-healing failover
          </div>
        </div>

        {/* Master Simulation Run Buttons & Clock */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Digital Simulation Clock */}
          <div
            style={{
              background: '#070D17',
              border: '1px solid var(--line, #1F2E45)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: 'var(--cyan, #22C3E6)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={12} />
            <span>T+{simTime.toFixed(2)}s</span>
          </div>

          {/* View Mode Toggle: Backbone vs 5G Site */}
          <div
            style={{
              display: 'flex',
              background: 'var(--panel2, #152236)',
              border: '1px solid var(--line, #1F2E45)',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('backbone')}
              style={{
                background: viewMode === 'backbone' ? 'var(--cyan, #22C3E6)' : 'transparent',
                color: viewMode === 'backbone' ? '#0A111D' : 'var(--muted, #8597AE)',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Backbone
            </button>
            <button
              onClick={() => setViewMode('site')}
              style={{
                background: viewMode === 'site' ? 'var(--cyan, #22C3E6)' : 'transparent',
                color: viewMode === 'site' ? '#0A111D' : 'var(--muted, #8597AE)',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              5G Site
            </button>
          </div>

          {/* Simulation Speed Selector */}
          <div
            style={{
              display: 'flex',
              background: 'var(--panel2, #152236)',
              border: '1px solid var(--line, #1F2E45)',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            {[0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                style={{
                  background: simSpeed === spd ? 'rgba(34, 195, 230, 0.2)' : 'transparent',
                  color: simSpeed === spd ? 'var(--cyan, #22C3E6)' : 'var(--muted, #8597AE)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 6px',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Auto Loop Toggle */}
          <button
            onClick={() => setLoopMode(!loopMode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: loopMode ? 'rgba(46, 204, 143, 0.15)' : 'var(--panel2, #152236)',
              border: `1px solid ${loopMode ? 'var(--ok, #2ECC8F)' : 'var(--line, #1F2E45)'}`,
              color: loopMode ? 'var(--ok, #2ECC8F)' : 'var(--muted, #8597AE)',
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
            title="Auto-repeat simulation run continuously"
          >
            <Repeat size={12} />
            Loop
          </button>

          {/* Start / Pause Simulation Run Button */}
          <button
            onClick={togglePause}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isSimulating && !isPaused ? 'rgba(240, 169, 59, 0.2)' : 'linear-gradient(135deg, #22C3E6, #1E90FF)',
              border: `1px solid ${isSimulating && !isPaused ? 'var(--warn, #F0A93B)' : '#22C3E6'}`,
              color: isSimulating && !isPaused ? 'var(--warn, #F0A93B)' : '#0A111D',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: isSimulating && !isPaused ? 'none' : '0 0 12px rgba(34, 195, 230, 0.4)',
            }}
          >
            {isSimulating && !isPaused ? (
              <>
                <Pause size={13} />
                Pause
              </>
            ) : (
              <>
                <Play size={13} fill="#0A111D" />
                {simTime > 0 && simTime < TOTAL_SIM_TIME ? 'Resume Run' : 'Start Simulation Run'}
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={resetSimulation}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: '1px solid var(--line, #1F2E45)',
              color: 'var(--muted, #8597AE)',
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={11} />
            Reset
          </button>
        </div>
      </div>

      {/* Interactive Simulation Timeline Progress Scrubber Track */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: 'var(--muted, #8597AE)', marginBottom: '5px' }}>
          <span>SIMULATION RUN TIMELINE TRACK</span>
          <span>{progressPercent}% Complete ({simTime.toFixed(2)}s / {TOTAL_SIM_TIME}s)</span>
        </div>

        {/* Scrubber Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            setSimTime(Math.min(TOTAL_SIM_TIME, Math.max(0, clickPos * TOTAL_SIM_TIME)));
          }}
          style={{
            position: 'relative',
            height: '8px',
            background: 'var(--panel2, #152236)',
            borderRadius: '4px',
            cursor: 'pointer',
            overflow: 'visible',
            border: '1px solid var(--line, #1F2E45)',
          }}
        >
          {/* Active fill */}
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--ok, #2ECC8F), var(--cyan, #22C3E6), #8B5CF6)',
              borderRadius: '4px',
              transition: 'width 0.05s linear',
            }}
          />

          {/* Scrubber Handle */}
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              left: `calc(${progressPercent}% - 7px)`,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'var(--cyan, #22C3E6)',
              boxShadow: '0 0 8px #22C3E6',
              border: '2px solid #080E18',
              pointerEvents: 'none',
              transition: 'left 0.05s linear',
            }}
          />

          {/* Milestone markers on timeline */}
          {[
            { t: 0.0, label: 'Nominal' },
            { t: 1.4, label: 'Injected' },
            { t: 3.0, label: 'Qualcomm AI' },
            { t: 4.6, label: 'QUBO' },
            { t: 6.0, label: 'Rectified' },
          ].map((mkr) => {
            const pct = (mkr.t / TOTAL_SIM_TIME) * 100;
            return (
              <div
                key={mkr.label}
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: `${pct}%`,
                  transform: 'translateX(-50%)',
                  fontSize: '9px',
                  color: simTime >= mkr.t ? 'var(--cyan, #22C3E6)' : 'var(--dim, #4B5D75)',
                  whiteSpace: 'nowrap',
                }}
              >
                {mkr.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Link & Fault Profile Quick Selector Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--panel2, #152236)',
          border: '1px solid var(--line, #1F2E45)',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '12px',
          marginTop: '18px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted, #8597AE)', fontWeight: '600' }}>
            Injected Target:
          </span>
          {['A-B', 'B-C', 'S1-A', 'A-D', 'D-B'].map((tgt) => (
            <button
              key={tgt}
              onClick={() => handleTargetChange(tgt)}
              style={{
                background: currentTarget === tgt ? 'var(--cyan, #22C3E6)' : 'rgba(15, 23, 42, 0.6)',
                color: currentTarget === tgt ? '#0A111D' : 'var(--ink, #DCE6F2)',
                border: `1px solid ${currentTarget === tgt ? 'var(--cyan, #22C3E6)' : 'var(--line, #1F2E45)'}`,
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: currentTarget === tgt ? '700' : '500',
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {tgt}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted, #8597AE)', fontWeight: '600' }}>
            Fault Profile:
          </span>
          <select
            value={currentCause}
            onChange={(e) => handleCauseChange(e.target.value)}
            style={{
              background: '#080E18',
              color: profile.color,
              border: `1px solid ${profile.color}55`,
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <option value="Co-Channel Interference (Severe)">Co-Channel Interference (300ms / 39%)</option>
            <option value="Antenna Failure">Antenna Failure (PHY Down / 100% Loss)</option>
            <option value="High Network Congestion (Sudden Spike)">Congestion (PRB 96% / Buffer Overflow)</option>
            <option value="Faulty Handover Algorithm (Too Frequent)">Handover Flapping (Route Churn)</option>
            <option value="Resource Allocation Bugs">Resource Allocation Bug (Thread Lock)</option>
            <option value="Simulate Node Failure">Core Router Crash (BGP Peer Loss)</option>
          </select>

          {onTriggerFault && (
            <button
              onClick={() => {
                onTriggerFault(currentCause, currentTarget);
                startSimulation();
              }}
              style={{
                background: 'var(--bad, #F05A5A)',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Simulate Fault
            </button>
          )}
        </div>
      </div>

      {/* 5-Stage Stepper Ribbon (Clickable to jump to milestone) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '14px' }}>
        {[
          { key: 'nominal', label: '1. Nominal', sub: 'Baseline SLA', t: 0.0 },
          { key: 'injected', label: '2. Injected', sub: `${currentTarget}: ${profile.name}`, t: 1.8 },
          { key: 'diagnosing', label: '3. Diagnosed', sub: 'Qualcomm AI 100', t: 3.4 },
          { key: 'qubo_solving', label: '4. QUBO Solved', sub: 'Energy Minimized', t: 4.8 },
          { key: 'healed', label: '5. Rectified', sub: 'Bypass Restored', t: 6.4 },
        ].map((s) => {
          const isActive = stage === s.key;
          const isPassed =
            (stage === 'injected' && s.key === 'nominal') ||
            (stage === 'diagnosing' && ['nominal', 'injected'].includes(s.key)) ||
            (stage === 'qubo_solving' && ['nominal', 'injected', 'diagnosing'].includes(s.key)) ||
            (stage === 'healed' && s.key !== 'healed');

          let borderColor = 'var(--line, #1F2E45)';
          let bgColor = 'var(--panel2, #152236)';
          let textColor = 'var(--muted, #8597AE)';

          if (isActive) {
            borderColor = s.key === 'injected' ? profile.color : 'var(--cyan, #22C3E6)';
            bgColor = s.key === 'injected' ? 'rgba(240, 90, 90, 0.15)' : 'rgba(34, 195, 230, 0.15)';
            textColor = s.key === 'injected' ? profile.color : '#FFF';
          } else if (isPassed) {
            borderColor = 'rgba(46, 204, 143, 0.4)';
            textColor = 'var(--ok, #2ECC8F)';
          }

          return (
            <button
              key={s.key}
              onClick={() => jumpToStage(s.key)}
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '6px 8px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{s.label}</span>
                {isActive && isSimulating && !isPaused && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: textColor, display: 'inline-block' }} />
                )}
              </div>
              <div
                style={{
                  fontSize: '9.5px',
                  color: 'var(--muted, #8597AE)',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Visual Twin Pipeline: Dynamic Topology Overlay */}
      <div
        style={{
          background: '#080E18',
          border: '1px solid var(--line, #1F2E45)',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '14px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--muted, #8597AE)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Digital Twin {viewMode === 'backbone' ? 'SDN Backbone Topology' : '5G Radio Site Architecture'}
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '3px',
                background: 'rgba(34, 195, 230, 0.12)',
                color: 'var(--cyan, #22C3E6)',
                border: '1px solid rgba(34, 195, 230, 0.3)',
                fontFamily: 'monospace',
              }}
            >
              Target: {currentTarget}
            </span>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '4px',
              color: m.healthy ? 'var(--ok, #2ECC8F)' : profile.color,
              background: m.healthy ? 'rgba(46, 204, 143, 0.12)' : 'rgba(240, 90, 90, 0.12)',
              border: `1px solid ${m.healthy ? 'var(--ok, #2ECC8F)' : profile.color}40`,
            }}
          >
            {m.status}
          </span>
        </div>

        {/* =====================================================================
            VIEWPORT A: SDN BACKBONE MESH (S1, A, D, B, C)
           ===================================================================== */}
        {viewMode === 'backbone' && (
          <svg viewBox="0 0 640 170" style={{ width: '100%', height: '150px', display: 'block' }}>
            <defs>
              <linearGradient id="bypassGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22C3E6" />
                <stop offset="100%" stopColor="#7B93FF" />
              </linearGradient>
            </defs>

            {/* Base Grid Pattern */}
            <pattern id="twinGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="rgba(31, 46, 69, 0.4)" />
            </pattern>
            <rect width="640" height="170" fill="url(#twinGrid)" />

            {/* --- Standby Disaster Recovery Links (S1-D and D-C) --- */}
            {/* S1 -> D */}
            <line
              x1="65"
              y1="95"
              x2="325"
              y2="30"
              stroke={
                currentTarget === 'S1-A' && isBypassActive
                  ? 'var(--cyan, #22C3E6)'
                  : 'rgba(75, 93, 117, 0.25)'
              }
              strokeWidth={currentTarget === 'S1-A' && isBypassActive ? '5' : '1.5'}
              strokeDasharray={currentTarget === 'S1-A' && isBypassActive ? 'none' : '3 3'}
            />
            {currentTarget === 'S1-A' && isBypassActive && (
              <path d="M 65 95 L 325 30" className="trf" stroke="var(--cyan, #22C3E6)" />
            )}

            {/* D -> C */}
            <line
              x1="325"
              y1="30"
              x2="575"
              y2="95"
              stroke={
                currentTarget === 'B-C' && isBypassActive
                  ? 'var(--cyan, #22C3E6)'
                  : 'rgba(75, 93, 117, 0.25)'
              }
              strokeWidth={currentTarget === 'B-C' && isBypassActive ? '5' : '1.5'}
              strokeDasharray={currentTarget === 'B-C' && isBypassActive ? 'none' : '3 3'}
            />
            {currentTarget === 'B-C' && isBypassActive && (
              <path d="M 325 30 L 575 95" className="trf" stroke="var(--cyan, #22C3E6)" />
            )}

            {/* --- LINK 1: S1 -> A --- */}
            <line
              x1="65"
              y1="95"
              x2="195"
              y2="95"
              stroke={
                currentTarget === 'S1-A' && isFaultStage
                  ? profile.color
                  : currentTarget === 'S1-A' && isBypassActive
                  ? 'rgba(75, 93, 117, 0.4)'
                  : 'var(--ok, #2ECC8F)'
              }
              strokeWidth={currentTarget === 'S1-A' && isFaultStage ? '6' : '4'}
              strokeDasharray={
                currentTarget === 'S1-A' && isFaultStage
                  ? '6 6'
                  : currentTarget === 'S1-A' && isBypassActive
                  ? '4 4'
                  : 'none'
              }
            />
            {(!isFaultStage || currentTarget !== 'S1-A') && !isBypassActive && (
              <path d="M 65 95 L 195 95" className="trf" stroke="#7FA6FF" />
            )}
            {currentTarget !== 'S1-A' && isBypassActive && (
              <path d="M 65 95 L 195 95" className="trf" stroke="var(--cyan, #22C3E6)" />
            )}

            {/* --- LINK 2: A -> B (Primary Backbone Link) --- */}
            <line
              x1="195"
              y1="95"
              x2="465"
              y2="95"
              stroke={
                currentTarget === 'A-B' && isFaultStage
                  ? profile.color
                  : currentTarget === 'A-B' && isBypassActive
                  ? 'rgba(75, 93, 117, 0.4)'
                  : 'var(--ok, #2ECC8F)'
              }
              strokeWidth={currentTarget === 'A-B' && isFaultStage ? '6' : '4'}
              strokeDasharray={
                currentTarget === 'A-B' && isFaultStage
                  ? '6 6'
                  : currentTarget === 'A-B' && isBypassActive
                  ? '4 4'
                  : 'none'
              }
            />
            {stage === 'nominal' && <path d="M 195 95 L 465 95" className="trf" stroke="#7FA6FF" />}

            {/* --- LINK 3: B -> C (Egress Link) --- */}
            <line
              x1="465"
              y1="95"
              x2="575"
              y2="95"
              stroke={
                currentTarget === 'B-C' && isFaultStage
                  ? profile.color
                  : currentTarget === 'B-C' && isBypassActive
                  ? 'rgba(75, 93, 117, 0.4)'
                  : 'var(--ok, #2ECC8F)'
              }
              strokeWidth={currentTarget === 'B-C' && isFaultStage ? '6' : '4'}
              strokeDasharray={
                currentTarget === 'B-C' && isFaultStage
                  ? '6 6'
                  : currentTarget === 'B-C' && isBypassActive
                  ? '4 4'
                  : 'none'
              }
            />
            {(!isFaultStage || currentTarget !== 'B-C') && currentTarget !== 'B-C' && isBypassActive && (
              <path d="M 465 95 L 575 95" className="trf" stroke="var(--cyan, #22C3E6)" />
            )}
            {stage === 'nominal' && <path d="M 465 95 L 575 95" className="trf" stroke="#7FA6FF" />}

            {/* --- BYPASS LINKS: A -> D and D -> B --- */}
            <line
              x1="195"
              y1="95"
              x2="325"
              y2="30"
              stroke={
                currentTarget === 'A-D' && isFaultStage
                  ? profile.color
                  : (currentTarget === 'A-B' || currentTarget === 'B-C') && isBypassActive
                  ? 'var(--cyan, #22C3E6)'
                  : 'rgba(75, 93, 117, 0.35)'
              }
              strokeWidth={(currentTarget === 'A-B' || currentTarget === 'B-C') && isBypassActive ? '5' : '2'}
              strokeDasharray={stage === 'nominal' ? '3 3' : 'none'}
            />
            <line
              x1="325"
              y1="30"
              x2="465"
              y2="95"
              stroke={
                currentTarget === 'D-B' && isFaultStage
                  ? profile.color
                  : (currentTarget === 'A-B' || currentTarget === 'S1-A') && isBypassActive
                  ? 'var(--cyan, #22C3E6)'
                  : 'rgba(75, 93, 117, 0.35)'
              }
              strokeWidth={(currentTarget === 'A-B' || currentTarget === 'S1-A') && isBypassActive ? '5' : '2'}
              strokeDasharray={stage === 'nominal' ? '3 3' : 'none'}
            />

            {/* Flow particles when Bypass is active for A-B */}
            {currentTarget === 'A-B' && isBypassActive && (
              <>
                <path d="M 195 95 L 325 30" className="trf" stroke="var(--cyan, #22C3E6)" />
                <path d="M 325 30 L 465 95" className="trf" stroke="var(--cyan, #22C3E6)" />
              </>
            )}

            {/* Flow particles when Bypass is active for B-C */}
            {currentTarget === 'B-C' && isBypassActive && (
              <path d="M 195 95 L 325 30" className="trf" stroke="var(--cyan, #22C3E6)" />
            )}

            {/* Flow particles when Bypass is active for S1-A */}
            {currentTarget === 'S1-A' && isBypassActive && (
              <path d="M 325 30 L 465 95" className="trf" stroke="var(--cyan, #22C3E6)" />
            )}

            {/* --- Fault Badge Placed on the SPECIFIC target link --- */}
            {isFaultStage && (
              <g>
                {currentTarget === 'A-B' && (
                  <g>
                    <rect x="260" y="83" width="140" height="24" rx="4" fill="#0A111D" stroke={profile.color} strokeWidth="1.5" />
                    <text x="330" y="99" textAnchor="middle" fill={profile.color} fontSize="10.5" fontWeight="700">
                      {profile.badgeText}
                    </text>
                  </g>
                )}
                {currentTarget === 'B-C' && (
                  <g>
                    <rect x="475" y="83" width="95" height="24" rx="4" fill="#0A111D" stroke={profile.color} strokeWidth="1.5" />
                    <text x="522" y="99" textAnchor="middle" fill={profile.color} fontSize="10" fontWeight="700">
                      {profile.badgeText}
                    </text>
                  </g>
                )}
                {currentTarget === 'S1-A' && (
                  <g>
                    <rect x="85" y="83" width="95" height="24" rx="4" fill="#0A111D" stroke={profile.color} strokeWidth="1.5" />
                    <text x="132" y="99" textAnchor="middle" fill={profile.color} fontSize="10" fontWeight="700">
                      {profile.badgeText}
                    </text>
                  </g>
                )}
                {currentTarget === 'A-D' && (
                  <g>
                    <rect x="200" y="48" width="115" height="24" rx="4" fill="#0A111D" stroke={profile.color} strokeWidth="1.5" />
                    <text x="257" y="64" textAnchor="middle" fill={profile.color} fontSize="9.5" fontWeight="700">
                      {profile.badgeText}
                    </text>
                  </g>
                )}
                {currentTarget === 'D-B' && (
                  <g>
                    <rect x="350" y="48" width="115" height="24" rx="4" fill="#0A111D" stroke={profile.color} strokeWidth="1.5" />
                    <text x="407" y="64" textAnchor="middle" fill={profile.color} fontSize="9.5" fontWeight="700">
                      {profile.badgeText}
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* --- Rectified Bypass Badge when Healed --- */}
            {stage === 'healed' && (
              <g>
                <rect x="260" y="10" width="130" height="20" rx="4" fill="#0A111D" stroke="var(--cyan, #22C3E6)" strokeWidth="1" />
                <text x="325" y="24" textAnchor="middle" fill="var(--cyan, #22C3E6)" fontSize="9.5" fontWeight="700">
                  ✓ BYPASS RESTORED ({profile.healedLat}ms)
                </text>
              </g>
            )}

            {/* --- Nodes (S1, A, D, B, C) --- */}
            {[
              {
                id: 'S1',
                x: 65,
                y: 95,
                label: 'S1 Ingress',
                col: '#8B5CF6',
                isFault: currentTarget === 'S1-A' && isFaultStage,
              },
              {
                id: 'A',
                x: 195,
                y: 95,
                label: 'Router A',
                col: (currentTarget === 'A-B' || currentTarget === 'S1-A' || currentTarget === 'A-D') && isFaultStage ? profile.color : '#3B82F6',
                isFault: currentTarget === 'A-B' && isFaultStage,
              },
              {
                id: 'D',
                x: 325,
                y: 30,
                label: 'Transit D',
                col: 'var(--cyan, #22C3E6)',
                isFault: (currentTarget === 'A-D' || currentTarget === 'D-B') && isFaultStage,
              },
              {
                id: 'B',
                x: 465,
                y: 95,
                label: 'Router B',
                col: (currentTarget === 'B-C' || currentTarget === 'D-B') && isFaultStage ? profile.color : '#3B82F6',
                isFault: currentTarget === 'B-C' && isFaultStage,
              },
              {
                id: 'C',
                x: 575,
                y: 95,
                label: 'C Egress',
                col: '#8B5CF6',
                isFault: false,
              },
            ].map((node) => (
              <g key={node.id}>
                {node.isFault && (
                  <circle cx={node.x} cy={node.y} r="25" fill="none" stroke={profile.color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8">
                    <animate attributeName="r" values="22;30;22" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={node.x} cy={node.y} r="18" fill="#0F1A2B" stroke={node.col} strokeWidth="2.5" />
                <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="700">
                  {node.id}
                </text>
                <text x={node.x} y={node.y + 28} textAnchor="middle" fill="var(--muted, #8597AE)" fontSize="9" fontWeight="500">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        )}

        {/* =====================================================================
            VIEWPORT B: 5G CELL SITE ARCHITECTURE (Hub + 6 Edge Cells)
           ===================================================================== */}
        {viewMode === 'site' && (
          <svg viewBox="0 0 640 180" style={{ width: '100%', height: '160px', display: 'block' }}>
            <pattern id="twinGrid2" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="rgba(31, 46, 69, 0.4)" />
            </pattern>
            <rect width="640" height="180" fill="url(#twinGrid2)" />

            {(() => {
              const cx = 320;
              const cy = 90;
              const rx = 180;
              const ry = 65;
              const edgeCells = [
                { id: 'E1', label: 'Cell E1 (North)', angle: -Math.PI / 2 },
                { id: 'E2', label: 'Cell E2 (NE)',    angle: -Math.PI / 6 },
                { id: 'E3', label: 'Cell E3 (SE)',    angle: Math.PI / 6 },
                { id: 'E4', label: 'Cell E4 (South)', angle: Math.PI / 2 },
                { id: 'E5', label: 'Cell E5 (SW)',    angle: (5 * Math.PI) / 6 },
                { id: 'E6', label: 'Cell E6 (NW)',    angle: (-5 * Math.PI) / 6 },
              ].map((c) => ({
                ...c,
                x: Math.round(cx + rx * Math.cos(c.angle)),
                y: Math.round(cy + ry * Math.sin(c.angle)),
              }));

              const targetEdgeIndex =
                currentTarget === 'A-B' ? 0 :
                currentTarget === 'B-C' ? 1 :
                currentTarget === 'S1-A' ? 4 :
                currentTarget === 'A-D' ? 5 : 2;

              return (
                <g>
                  {/* Outer optical perimeter ring between adjacent cells */}
                  {edgeCells.map((cell, i) => {
                    const nextCell = edgeCells[(i + 1) % edgeCells.length];
                    const isRingBypass = isBypassActive && (i === targetEdgeIndex || (i + 1) % edgeCells.length === targetEdgeIndex);
                    return (
                      <g key={`ring-${cell.id}`}>
                        <line
                          x1={cell.x}
                          y1={cell.y}
                          x2={nextCell.x}
                          y2={nextCell.y}
                          stroke={isRingBypass ? 'var(--cyan, #22C3E6)' : 'rgba(75, 93, 117, 0.35)'}
                          strokeWidth={isRingBypass ? '4' : '1.5'}
                          strokeDasharray={isRingBypass ? 'none' : '3 3'}
                        />
                        {isRingBypass && (
                          <path d={`M ${cell.x} ${cell.y} L ${nextCell.x} ${nextCell.y}`} className="trf" stroke="var(--cyan, #22C3E6)" />
                        )}
                      </g>
                    );
                  })}

                  {/* Radial spokes connecting Core Hub to Edge Cells */}
                  {edgeCells.map((cell, i) => {
                    const isTargetSpoke = i === targetEdgeIndex;
                    const spokeStroke =
                      isTargetSpoke && isFaultStage
                        ? profile.color
                        : isTargetSpoke && isBypassActive
                        ? 'rgba(75, 93, 117, 0.35)'
                        : 'var(--ok, #2ECC8F)';

                    return (
                      <g key={`spoke-${cell.id}`}>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={cell.x}
                          y2={cell.y}
                          stroke={spokeStroke}
                          strokeWidth={isTargetSpoke && isFaultStage ? '5' : '3'}
                          strokeDasharray={isTargetSpoke && isFaultStage ? '6 6' : 'none'}
                        />
                        {!isFaultStage && !isTargetSpoke && (
                          <path d={`M ${cx} ${cy} L ${cell.x} ${cell.y}`} className="trf" stroke="#7FA6FF" />
                        )}
                      </g>
                    );
                  })}

                  {/* Central Core Hub */}
                  <circle cx={cx} cy={cy} r="20" fill="#0B1321" stroke="#3B82F6" strokeWidth="3" />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="#FFF" fontSize="9.5" fontWeight="700">
                    HUB
                  </text>
                  <text x={cx} y={cy + 27} textAnchor="middle" fill="var(--cyan, #22C3E6)" fontSize="8.5" fontWeight="600">
                    5G Core
                  </text>

                  {/* Edge Cells */}
                  {edgeCells.map((cell, i) => {
                    const isTarget = i === targetEdgeIndex;
                    return (
                      <g key={cell.id}>
                        <circle
                          cx={cell.x}
                          cy={cell.y}
                          r="14"
                          fill="#0F1A2B"
                          stroke={isTarget && isFaultStage ? profile.color : isTarget && isBypassActive ? 'var(--cyan, #22C3E6)' : '#8B5CF6'}
                          strokeWidth="2.5"
                        />
                        <text x={cell.x} y={cell.y + 3.5} textAnchor="middle" fill="#FFF" fontSize="8.5" fontWeight="700">
                          {cell.id}
                        </text>
                      </g>
                    );
                  })}

                  {/* Fault badge on target cell spoke */}
                  {isFaultStage && (
                    <g>
                      <rect
                        x={cx - 75}
                        y={cy - 48}
                        width="150"
                        height="22"
                        rx="4"
                        fill="#0A111D"
                        stroke={profile.color}
                        strokeWidth="1.2"
                      />
                      <text x={cx} y={cy - 33} textAnchor="middle" fill={profile.color} fontSize="9.5" fontWeight="700">
                        {profile.badgeText}
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}
          </svg>
        )}

        {/* Real-Time Live Quantum Hamiltonian Annealing Meter during Stage 4 */}
        {stage === 'qubo_solving' && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              background: 'rgba(34, 195, 230, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(34, 195, 230, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ink, #DCE6F2)' }}>
              <Zap size={14} color="var(--cyan, #22C3E6)" />
              <span>
                <strong>QUBO Quantum Annealing:</strong> Minimizing Hamiltonian H(x) = &sum; c_i x_i + &sum; q_ij x_i x_j + P(&sum; x_i - 1)&sup2;
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--muted, #8597AE)' }}>Energy H(x):</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--cyan, #22C3E6)' }}>
                {getHamiltonianEnergy().toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* RCA & Diagnostics Chain Insight */}
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: 'var(--panel2, #152236)',
            borderRadius: '6px',
            border: '1px solid var(--line, #1F2E45)',
            fontSize: '11px',
            color: 'var(--ink, #DCE6F2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={14} color="var(--cyan, #22C3E6)" />
            <span>
              <strong>Qualcomm Cloud AI 100 Insight:</strong> {profile.aiDiagnosis}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--muted, #8597AE)', whiteSpace: 'nowrap' }}>
            Llama-3.1-8B &bull; 2.45s latency
          </span>
        </div>

        {/* Real-time Streaming Simulation Mission Log / Terminal */}
        <div style={{ marginTop: '10px' }}>
          <div
            onClick={() => setShowLogs(!showLogs)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '10.5px',
              fontWeight: '600',
              color: 'var(--muted, #8597AE)',
              padding: '2px 4px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Terminal size={12} color="var(--cyan, #22C3E6)" />
              SIMULATION TELEMETRY STREAM LOG ({getSimLogs().length} Events)
            </span>
            <span style={{ fontSize: '9.5px', color: 'var(--cyan, #22C3E6)' }}>
              {showLogs ? '▲ Collapse' : '▼ Expand Stream'}
            </span>
          </div>

          {showLogs && (
            <div
              style={{
                marginTop: '6px',
                background: '#050912',
                border: '1px solid var(--line, #1F2E45)',
                borderRadius: '6px',
                padding: '8px 10px',
                maxHeight: '110px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {getSimLogs().map((entry, idx) => {
                let badgeColor = 'var(--muted, #8597AE)';
                if (entry.type === 'ok') badgeColor = 'var(--ok, #2ECC8F)';
                if (entry.type === 'bad') badgeColor = 'var(--bad, #F05A5A)';
                if (entry.type === 'ai') badgeColor = 'var(--cyan, #22C3E6)';
                if (entry.type === 'qubo') badgeColor = '#A78BFA';

                return (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--dim, #4B5D75)', whiteSpace: 'nowrap' }}>{entry.time}</span>
                    <span
                      style={{
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: `${badgeColor}15`,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}40`,
                        fontSize: '9px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.tag}
                    </span>
                    <span style={{ color: 'var(--ink, #DCE6F2)' }}>{entry.msg}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Before vs After Rectification KPI Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <div style={{ background: 'var(--panel2, #152236)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line, #1F2E45)' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted, #8597AE)', textTransform: 'uppercase' }}>Latency</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: m.latency > 50 ? profile.color : 'var(--ok, #2ECC8F)', marginTop: '2px' }}>
            {m.latency.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>ms</span>
          </div>
          <div style={{ fontSize: '9.5px', color: m.latency <= 15 ? 'var(--ok, #2ECC8F)' : 'var(--dim, #4B5D75)' }}>
            {stage === 'healed' ? '↓ 96.3% SLA met' : `Nominal: <${profile.nominalLat + 10}ms`}
          </div>
        </div>

        <div style={{ background: 'var(--panel2, #152236)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line, #1F2E45)' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted, #8597AE)', textTransform: 'uppercase' }}>Packet Loss</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: m.loss > 0.5 ? profile.color : 'var(--ok, #2ECC8F)', marginTop: '2px' }}>
            {m.loss.toFixed(1)}%
          </div>
          <div style={{ fontSize: '9.5px', color: m.loss === 0 ? 'var(--ok, #2ECC8F)' : profile.color }}>
            {stage === 'healed' ? '0 dropped pkts' : isFaultStage ? profile.symptom.slice(0, 24) + '...' : 'Zero loss'}
          </div>
        </div>

        <div style={{ background: 'var(--panel2, #152236)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line, #1F2E45)' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted, #8597AE)', textTransform: 'uppercase' }}>Active Flow Path</div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: stage === 'healed' ? 'var(--cyan, #22C3E6)' : 'var(--ink, #DCE6F2)',
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {m.path}
          </div>
          <div style={{ fontSize: '9.5px', color: 'var(--muted, #8597AE)', marginTop: '2px' }}>
            {stage === 'healed' ? getBypassDescription() : 'Primary Trunk'}
          </div>
        </div>

        <div style={{ background: 'var(--panel2, #152236)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line, #1F2E45)' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted, #8597AE)', textTransform: 'uppercase' }}>SDN Control Action</div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--cyan, #22C3E6)', marginTop: '4px' }}>
            {stage === 'healed' ? profile.remedyAction : stage === 'qubo_solving' ? 'SOLVING QUBO' : stage === 'diagnosing' ? 'QUALCOMM RCA' : isFaultStage ? 'FAULT ACTIVE' : 'NOMINAL'}
          </div>
          <div style={{ fontSize: '9.5px', color: 'var(--dim, #4B5D75)', marginTop: '2px' }}>
            Blast Radius: {profile.quboBlast.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
