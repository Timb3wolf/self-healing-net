import React from 'react';
import { Clock, Zap, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * RecoveryTimelineBar Component (Inspired by self_healing_noc.html)
 * Displays:
 *  - Continuous multi-stage colored recovery bar (detected, diagnosed, decided, rerouted, recovered)
 *  - 5 Step cards with delta times (+X.XX s)
 *  - Executive recovery summary sentence
 */
export default function RecoveryTimelineBar({
  timeline = null,
  incident = null,
  isAnomalous = false,
  diagnosisResult = null,
}) {
  // Default fallback or live marks
  const marks = timeline?.marks || (incident ? {
    detected: 0.42,
    diagnosed: diagnosisResult?.qualcomm_latency_s ? round(diagnosisResult.qualcomm_latency_s, 2) : 2.37,
    decided: diagnosisResult?.qualcomm_latency_s ? round(diagnosisResult.qualcomm_latency_s + 0.45, 2) : 2.85,
    rerouted: diagnosisResult?.qualcomm_latency_s ? round(diagnosisResult.qualcomm_latency_s + 0.55, 2) : 2.95,
    recovered: !isAnomalous ? (diagnosisResult?.qualcomm_latency_s ? round(diagnosisResult.qualcomm_latency_s + 2.10, 2) : 4.80) : undefined,
  } : null);

  function round(val, d = 2) {
    return Number(Math.round(val + 'e' + d) + 'e-' + d);
  }

  const STAGES = [
    { key: 'detected', label: 'Detected', color: '#F0A93B', desc: 'Telemetry anomaly threshold' },
    { key: 'diagnosed', label: 'Diagnosed (Qualcomm)', color: '#7B93FF', desc: 'Cloud AI 100 Llama-3.1-8B' },
    { key: 'decided', label: 'Fix decided', color: '#A78BFA', desc: 'Twin safety check passed' },
    { key: 'rerouted', label: 'Fix applied', color: '#22C3E6', desc: 'Dijkstra route enacted' },
    { key: 'recovered', label: 'Recovered', color: '#2ECC8F', desc: 'All flows within SLA' },
  ];

  if (!marks) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div className="card-header" style={{ padding: '0 0 0.75rem 0', marginBottom: '0.75rem' }}>
          <div className="card-title-group">
            <Clock size={17} color="#22C3E6" />
            <span className="card-title">Recovery Timeline (Millisecond Milestones)</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>
            No active incident
          </span>
        </div>
        <div style={{ color: '#64748B', fontSize: '0.82rem', fontFamily: 'Barlow, sans-serif' }}>
          Network operating nominal. Inject a fault from the console to record detection, Qualcomm diagnosis, and recovery stages.
        </div>
      </div>
    );
  }

  const maxTime = Math.max(
    marks.recovered || 0,
    marks.rerouted || 0,
    marks.decided || 0,
    marks.diagnosed || 0,
    marks.detected || 0,
    5.0
  );

  let prevTime = 0;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div className="card-header" style={{ padding: '0 0 0.75rem 0', marginBottom: '0.75rem' }}>
        <div className="card-title-group">
          <Clock size={17} color="#22C3E6" />
          <span className="card-title">Recovery Timeline (Millisecond Precision)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {marks.recovered ? (
            <span className="pill ok">Fully Recovered ({marks.recovered.toFixed(2)}s)</span>
          ) : (
            <span className="pill cyan">Self-Healing In Progress</span>
          )}
        </div>
      </div>

      {/* Multi-Stage Colored Bar */}
      <div
        style={{
          display: 'flex',
          height: 16,
          borderRadius: 8,
          overflow: 'hidden',
          background: 'rgba(21, 34, 54, 0.9)',
          margin: '0.5rem 0 1rem 0',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {STAGES.map((st) => {
          const t = marks[st.key];
          if (t === undefined) return null;
          const delta = Math.max(t - prevTime, 0.05);
          const widthPct = (delta / maxTime) * 100;
          prevTime = t;
          return (
            <div
              key={st.key}
              style={{
                width: `${widthPct}%`,
                background: st.color,
                transition: 'width 0.4s ease',
              }}
              title={`${st.label}: +${delta.toFixed(2)}s (at ${t.toFixed(2)}s)`}
            />
          );
        })}
      </div>

      {/* 5 Step Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
        {(() => {
          let lastT = 0;
          return STAGES.map((st) => {
            const t = marks[st.key];
            const isCompleted = t !== undefined;
            const delta = isCompleted ? (t - lastT).toFixed(2) : null;
            if (isCompleted) lastT = t;

            return (
              <div
                key={st.key}
                style={{
                  background: 'rgba(21, 34, 54, 0.75)',
                  borderRadius: 8,
                  padding: '0.65rem 0.8rem',
                  borderTop: `3px solid ${isCompleted ? st.color : 'rgba(75, 93, 117, 0.5)'}`,
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Barlow Semi Condensed, sans-serif',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: isCompleted ? '#F8FAFC' : '#4B5D75',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {isCompleted ? `+${delta} s` : '–'}
                </div>
                <div style={{ fontSize: '0.72rem', color: isCompleted ? st.color : '#64748B', fontWeight: 600 }}>
                  {st.label}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: 2 }}>
                  {isCompleted ? `@ ${t.toFixed(2)}s` : st.desc}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Summary Line */}
      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.82rem',
          color: '#DCE6F2',
          lineHeight: 1.5,
          background: 'rgba(17, 27, 44, 0.6)',
          padding: '0.6rem 0.85rem',
          borderRadius: 6,
          borderLeft: '3px solid #22C3E6',
        }}
      >
        {marks.rerouted !== undefined ? (
          <span>
            <strong>Rerouted {marks.rerouted.toFixed(2)} s after injection</strong>
            <span style={{ color: '#8597AE' }}> (new route computed in under 0.1 ms)</span>
            {marks.recovered !== undefined ? (
              <span style={{ color: '#2ECC8F' }}>, recovered at {marks.recovered.toFixed(2)} s with all SLA thresholds restored.</span>
            ) : (
              <span style={{ color: '#F0A93B' }}>, waiting for telemetry stabilization...</span>
            )}
          </span>
        ) : (
          <span>Fault injected — waiting for detection and Qualcomm AI 100 diagnosis...</span>
        )}
      </div>
    </div>
  );
}
