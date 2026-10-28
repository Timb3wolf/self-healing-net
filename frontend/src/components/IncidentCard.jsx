import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, GitCommit, ArrowRight } from 'lucide-react';

/**
 * IncidentCard: Displays Member 2's root-cause alerts, anomalous links,
 * and causal diagnostic chain.
 */
export default function IncidentCard({ incident, isAnomalous }) {
  if (!incident && !isAnomalous) {
    return (
      <div className="glass-panel" style={{ height: '100%' }}>
        <div className="card-header">
          <div className="card-title-group">
            <CheckCircle size={18} color="#10b981" />
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
            <CheckCircle size={26} color="#10b981" />
          </div>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
            All Links Operating Within SLA
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.35rem' }}>
            No anomalous traffic spikes or link degradations detected across core routers S1, A, B, C, D.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ height: '100%', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
      <div className="card-header">
        <div className="card-title-group">
          <ShieldAlert size={18} color="#ef4444" />
          <span className="card-title">Incident Alert (Member 2 Engine)</span>
        </div>
        <span className="badge badge-red">{incident?.severity || 'CRITICAL'}</span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#f87171' }}>
            ID: {incident?.incident_id || 'INC-ACTIVE'}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#94a3b8' }}>
            {incident?.timestamp || 'Just now'}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
            Root Cause Diagnosis
          </div>
          <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.88rem', marginTop: '0.2rem' }}>
            {incident?.root_cause || 'Interface queue saturation on link A-B'}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: '0.4rem' }}>
            Anomalous Links
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(incident?.anomalous_links || ['A-B']).map((link) => (
              <span
                key={link}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.78rem',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                }}
              >
                Link {link} (Congested)
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: '0.4rem' }}>
            Causal Chain
          </div>
          <div className="incident-chain">
            {(incident?.causal_chain || []).map((step, idx) => (
              <div key={idx} className="chain-item">
                <span style={{ color: '#6366f1', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  0{idx + 1}.
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
