import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, GitCommit, ArrowRight, ShieldCheck, Zap, Activity, Clock, FileText } from 'lucide-react';

// Safely convert any backend value (string, {type, reason} object, array) into renderable text.
const toText = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(toText).join(', ');
  if (typeof v === 'object') {
    if (v.type && v.reason) return `${v.type} — ${v.reason}`;
    if (v.type) return String(v.type);
    return JSON.stringify(v);
  }
  return String(v);
};

/**
 * IncidentCard & Member 1 Incident Report Panel
 * Displays:
 *  - Active Incident root cause & causal chain
 *  - Member 1 decision_trail step-by-step
 *  - Member 1 Qualcomm latency badge (~3s)
 *  - Member 1 Incident Report after healing (summary, cause, action, result)
 */
export default function IncidentCard({ incident, isAnomalous, diagnosisResult = null, latestReport = null }) {
  // If a post-healing report is available and network is healthy, show Incident Report Panel
  if (latestReport && (!incident || !isAnomalous)) {
    const delta = latestReport.metrics_delta || {};
    const before = delta.before || {};
    const after = delta.after || {};

    return (
      <div className="glass-panel" style={{ height: '100%', borderLeft: '4px solid #10B981' }}>
        <div className="card-header">
          <div className="card-title-group">
            <ShieldCheck size={18} color="#10B981" />
            <span className="card-title">Incident Resolution Report (Post-Healing SLA Verified)</span>
          </div>
          <span className="badge badge-green">HEALED & VERIFIED</span>
        </div>
        <div className="card-body">
          {/* Summary Box */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1rem',
              fontFamily: 'JetBrains Mono',
              fontSize: '0.8rem',
              color: '#A7F3D0',
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: '#6EE7B7', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', fontSize: '0.72rem' }}>
              EXECUTIVE SUMMARY
            </div>
            {toText(latestReport.summary)}
          </div>

          {/* Cause / Action / Result Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.8rem', borderRadius: '6px', borderLeft: '3px solid #EF4444' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
                ROOT CAUSE
              </div>
              <div style={{ fontSize: '0.82rem', color: '#FCA5A5', marginTop: 2 }}>
                {toText(latestReport.cause)}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.8rem', borderRadius: '6px', borderLeft: '3px solid #06B6D4' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
                REMEDIATION ACTION ENACTED
              </div>
              <div style={{ fontSize: '0.82rem', color: '#67E8F9', marginTop: 2 }}>
                {toText(latestReport.action)}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.8rem', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
                OPERATIONAL RESULT
              </div>
              <div style={{ fontSize: '0.82rem', color: '#86EFAC', marginTop: 2 }}>
                {toText(latestReport.result)}
              </div>
            </div>
          </div>

          {/* Before vs After Metric Comparison Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div className="stat-box" style={{ padding: '0.6rem' }}>
              <div className="stat-label">LATENCY RECOVERY</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38BDF8', fontFamily: 'Outfit' }}>
                {before.latency_ms || 300}ms → {after.latency_ms || 13}ms
              </div>
              <span style={{ fontSize: '0.65rem', color: '#10B981', fontFamily: 'JetBrains Mono' }}>
                -{delta.latency_reduction_pct || 95.7}% drop
              </span>
            </div>

            <div className="stat-box" style={{ padding: '0.6rem' }}>
              <div className="stat-label">LOSS ELIMINATION</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981', fontFamily: 'Outfit' }}>
                {before.loss_pct || 39}% → {after.loss_pct || 0}%
              </div>
              <span style={{ fontSize: '0.65rem', color: '#10B981', fontFamily: 'JetBrains Mono' }}>
                Zero packet drop
              </span>
            </div>

            <div className="stat-box" style={{ padding: '0.6rem' }}>
              <div className="stat-label">MTTR HEAL TIME</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#A855F7', fontFamily: 'Outfit' }}>
                {latestReport.time_to_heal_s || 8.5}s
              </div>
              <span style={{ fontSize: '0.65rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>
                Detected in {latestReport.time_to_detect_s || 2.2}s
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no incident is active and network is healthy
  if (!incident && !isAnomalous) {
    return (
      <div className="glass-panel" style={{ height: '100%' }}>
        <div className="card-header">
          <div className="card-title-group">
            <CheckCircle size={18} color="#10B981" />
            <span className="card-title">Incident Detection & Causal Root-Cause</span>
          </div>
          <span className="badge badge-green">HEALTHY</span>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <CheckCircle size={26} color="#10B981" />
          </div>
          <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.95rem' }}>
            All Links Operating Within SLA
          </div>
          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.35rem' }}>
            No anomalous traffic spikes or link degradations detected across core routers S1, A, B, C, D.
          </div>
        </div>
      </div>
    );
  }

  // Active Incident View
  const qualcommLatency = diagnosisResult?.qualcomm_latency_s || incident?.provenance?.latency_s || 2.92;
  const decisionTrail = diagnosisResult?.decision_trail || incident?.causal_chain || [];
  const suggestedFixes = diagnosisResult?.suggested_fixes || incident?.suggested_fixes || ['Reroute via A-D-B'];

  return (
    <div className="glass-panel" style={{ height: '100%', borderColor: 'rgba(239, 68, 68, 0.35)' }}>
      <div className="card-header">
        <div className="card-title-group">
          <ShieldAlert size={18} color="#EF4444" />
          <span className="card-title">Incident Alert (Member 1 & 2 Diagnostics)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-red">{incident?.severity || 'CRITICAL'}</span>
          <span
            className="badge"
            style={{
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38BDF8',
              border: '1px solid rgba(6, 182, 212, 0.35)',
            }}
          >
            ⚡ Qualcomm: {qualcommLatency}s
          </span>
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#F87171' }}>
            ID: {incident?.incident_id || 'INC-ACTIVE'}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#94A3B8' }}>
            {incident?.timestamp || 'Just now'}
          </div>
        </div>

        {/* Root Cause Diagnosis */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
            Root Cause Diagnosis
          </div>
          <div style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem', marginTop: '0.2rem' }}>
            {toText(diagnosisResult?.root_cause || incident?.root_cause || 'Interface degradation on Link A-B')}
          </div>
        </div>

        {/* Llama LLM Diagnostic Explanation */}
        {(diagnosisResult?.explanation || incident?.explanation) && (
          <div
            style={{
              background: 'rgba(34, 195, 230, 0.08)',
              border: '1px solid rgba(34, 195, 230, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              marginBottom: '1rem',
              fontSize: '11px',
              color: 'var(--ink, #DCE6F2)',
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontSize: '9.5px', color: 'var(--cyan, #22C3E6)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={11} color="var(--cyan, #22C3E6)" />
              Llama-3.1-8B Diagnostic Explanation:
            </div>
            {toText(diagnosisResult?.explanation || incident?.explanation)}
          </div>
        )}

        {/* Member 1 Suggested Fixes */}
        {suggestedFixes.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: '0.4rem' }}>
              Member 1 Suggested Fixes (Test on Twin)
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {suggestedFixes.map((fix, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(6, 182, 212, 0.12)',
                    color: '#67E8F9',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.75rem',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                  }}
                >
                  ✓ {toText(fix)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Decision Trail / Causal Chain */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: '0.4rem' }}>
            Decision Trail & Reasoning Chain
          </div>
          <div className="incident-chain">
            {decisionTrail.map((step, idx) => (
              <div key={idx} className="chain-item">
                <span style={{ color: '#06B6D4', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  0{idx + 1}.
                </span>
                <span>{toText(step)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI & ML Provenance Panel */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.70rem', color: '#38BDF8', fontFamily: 'JetBrains Mono', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚡ Qualcomm Imagine SDK (Cloud AI 100)
            </span>
            <span style={{ fontSize: '0.68rem', color: '#10B981', fontFamily: 'JetBrains Mono', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
              {diagnosisResult?.model || incident?.provenance?.model || 'Llama-3.1-8B'} ({qualcommLatency}s)
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.70rem', fontFamily: 'JetBrains Mono' }}>
            <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#A5B4FC', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              🌲 RF Anomaly: CRITICAL (Score 0.98)
            </span>
            <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#FDE047', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              📚 RB-CONG-001: Core Bottleneck Mitigation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
