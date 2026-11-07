import React, { useState } from 'react';
import { Flame, ShieldAlert, WifiOff, Activity, Skull, Zap, AlertTriangle, Clock, RefreshCw, Send, Radio } from 'lucide-react';

/**
 * Chaos Operations Controller & Historical Timeline Component (Section 5)
 * Buttons:
 *  - Member 1: Antenna Failure, Jamming, High Network Congestion
 *  - Chaos Ops: Kill Router, Break Link, Inject Packet Loss, Create Congestion, Simulate Node Failure
 * Timeline:
 *  - Historical chronological tracking feed: [HH:MM:SS] chaos injected -> detection -> OSPF failover recovery
 */
export default function ChaosController({ onTriggerChaos, onTriggerDiagnosis = null, loading = false, timeline = [] }) {
  const [selectedTarget, setSelectedTarget] = useState('A-B');
  const [selectedRouter, setSelectedRouter] = useState('site_B');
  const [intensity, setIntensity] = useState(1.0);

  const handleAction = (type, target) => {
    if (onTriggerChaos) {
      onTriggerChaos({ type, target, intensity: parseFloat(intensity) });
    }
  };

  return (
    <div className="chaos-controller" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Chaos Actions Console */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div className="card-header" style={{ padding: '0 0 1rem 0', marginBottom: '1rem' }}>
          <div className="card-title-group">
            <Flame size={18} color="#EF4444" />
            <span className="card-title">NOC Chaos Engineering & Fault Injection Console</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>
            Chaos Operations API
          </span>
        </div>

        {/* Target and Parameter Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
              TARGET INTERFACE LINK
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--border-subtle)',
                color: '#F8FAFC',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.8rem',
              }}
            >
              <option value="A-B">Link A-B (Frankfurt ↔ New York Backbone)</option>
              <option value="S1-A">Link S1-A (London HQ Ingress ↔ Frankfurt)</option>
              <option value="A-D">Link A-D (Frankfurt ↔ Singapore Transit)</option>
              <option value="D-B">Link D-B (Singapore Transit ↔ New York)</option>
              <option value="B-C">Link B-C (New York ↔ Tokyo Egress)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
              TARGET CORE ROUTER
            </label>
            <select
              value={selectedRouter}
              onChange={(e) => setSelectedRouter(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--border-subtle)',
                color: '#F8FAFC',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.8rem',
              }}
            >
              <option value="site_B">Router B (New York Access Core)</option>
              <option value="site_A">Router A (Frankfurt Transit West)</option>
              <option value="site_D">Transit D (Singapore Mesh Transit)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
              <span>FAULT INTENSITY</span>
              <span style={{ color: '#EF4444', fontWeight: 600 }}>{Math.round(intensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.1"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              style={{ width: '100%', accentColor: '#EF4444', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Member 1: Telecom Diagnostic Fault Triggers (Qualcomm Imagine SDK) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontFamily: 'JetBrains Mono', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚡ MEMBER 1 TELECOM FAULT INJECTION (~3s Qualcomm Inference)
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>
              diagnosis_service.py • Llama-3.1-8B
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
            <button
              className="btn"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(8, 145, 178, 0.35))',
                border: '1px solid #06B6D4',
                color: '#67E8F9',
                justifyContent: 'center',
              }}
              onClick={() => onTriggerDiagnosis ? onTriggerDiagnosis("Antenna Failure", selectedTarget) : handleAction('break_link', selectedTarget)}
              disabled={loading}
            >
              <Radio size={16} color="#06B6D4" />
              <span>Antenna Failure (300ms / 39%)</span>
            </button>

            <button
              className="btn"
              style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.35))',
                border: '1px solid #EAB308',
                color: '#FDE047',
                justifyContent: 'center',
              }}
              onClick={() => onTriggerDiagnosis ? onTriggerDiagnosis("Jamming", selectedTarget) : handleAction('inject_packet_loss', selectedTarget)}
              disabled={loading}
            >
              <WifiOff size={16} color="#EAB308" />
              <span>Jamming (Carrier Drop)</span>
            </button>

            <button
              className="btn"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.35))',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                justifyContent: 'center',
              }}
              onClick={() => onTriggerDiagnosis ? onTriggerDiagnosis("High Network Congestion (Sudden Spike)", selectedTarget) : handleAction('create_congestion', selectedTarget)}
              disabled={loading}
            >
              <Flame size={16} color="#EF4444" />
              <span>Congestion (Sudden Spike)</span>
            </button>
          </div>
        </div>

        {/* 5 Operational Chaos Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35))',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
            }}
            onClick={() => handleAction('kill_router', selectedRouter)}
            disabled={loading}
          >
            <Skull size={15} color="#EF4444" />
            <span>Kill Router</span>
          </button>

          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(194, 65, 12, 0.35))',
              border: '1px solid #F97316',
              color: '#FDBA74',
            }}
            onClick={() => handleAction('break_link', selectedTarget)}
            disabled={loading}
          >
            <WifiOff size={15} color="#F97316" />
            <span>Break Link</span>
          </button>

          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.25), rgba(180, 83, 9, 0.35))',
              border: '1px solid #D97706',
              color: '#FDE68A',
            }}
            onClick={() => handleAction('inject_packet_loss', selectedTarget)}
            disabled={loading}
          >
            <AlertTriangle size={15} color="#D97706" />
            <span>Inject Packet Loss</span>
          </button>

          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(126, 34, 206, 0.35))',
              border: '1px solid #A855F7',
              color: '#E9D5FF',
            }}
            onClick={() => handleAction('create_congestion', selectedTarget)}
            disabled={loading}
          >
            <Activity size={15} color="#A855F7" />
            <span>Create Congestion</span>
          </button>

          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(190, 24, 93, 0.35))',
              border: '1px solid #EC4899',
              color: '#FBCFE8',
            }}
            onClick={() => handleAction('simulate_node_failure', selectedRouter)}
            disabled={loading}
          >
            <Zap size={15} color="#EC4899" />
            <span>Simulate Node Failure</span>
          </button>
        </div>
      </div>

      {/* Historical Tracking Timeline Feed */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div className="card-header" style={{ padding: '0 0 1rem 0', marginBottom: '1rem' }}>
          <div className="card-title-group">
            <Clock size={18} color="#A855F7" />
            <span className="card-title">Event Execution Timeline & Incident Audit Feed</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>
            Live Stream
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 220, overflowY: 'auto' }}>
          {timeline.length > 0 ? (
            timeline.slice().reverse().map((evt) => {
              const isError = evt.severity === 'CRITICAL' || evt.severity === 'ERROR';
              const isWarning = evt.severity === 'WARNING';
              const isSuccess = evt.severity === 'SUCCESS' || evt.type?.includes('FAILOVER');

              const accentColor = isError ? '#EF4444' : isWarning ? '#D97706' : isSuccess ? '#10B981' : '#6366F1';

              return (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderLeft: `3px solid ${accentColor}`,
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontFamily: 'JetBrains Mono',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: '#64748B' }}>[{evt.time}]</span>
                    <span style={{ color: accentColor, fontWeight: 700 }}>{evt.type}:</span>
                    <span style={{ color: '#E2E8F0' }}>{evt.message}</span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: `${accentColor}18`,
                      color: accentColor,
                      fontSize: '0.65rem',
                    }}
                  >
                    {evt.severity}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
              No chaos events recorded yet. Trigger a fault above to observe live audit logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
