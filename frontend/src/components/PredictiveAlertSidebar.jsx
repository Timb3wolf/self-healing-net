import React from 'react';
import { AlertCircle, ShieldAlert, Cpu, Activity, Clock, Zap, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * MixMode-style AI Predictive Failure Alert Sidebar (Section 3 & Image 1 style)
 * Features:
 *  - "Predictive failure alert" header
 *  - Circular/Linear Anomaly Risk Gauge (0-100%)
 *  - Risk Level indicator (Critical, High, Warning, Nominal)
 *  - ETA-to-failure metric (e.g. "Node B core offline in 42min")
 *  - Current symptoms breakdown
 *  - AI / Qualcomm Cloud AI 100 root cause provenance
 */
export default function PredictiveAlertSidebar({ gnnData = null, incident = null, isAnomalous = false }) {
  const anomalyScore = gnnData?.anomaly_score ?? (isAnomalous ? 94.2 : 14.5);
  const riskLevel = gnnData?.risk_level ?? (isAnomalous ? 'CRITICAL' : 'NOMINAL');
  const etaMinutes = gnnData?.eta_to_failure_min ?? (isAnomalous ? 42 : null);
  const symptoms = gnnData?.symptoms ?? (isAnomalous ? [
    'Queue buffer tail-drop rate > 4.5%',
    'RTT jitter variance spike +68ms on Link A-B',
    'GNN Topology Message Passing anomaly score > 90%',
    'Ingress VoIP SLA violation imminent',
  ] : [
    'BGP peer keepalives 100% nominal',
    'Interface packet drop rate < 0.01%',
    'Buffer headroom > 85%',
  ]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL':
        return '#EF4444';
      case 'HIGH':
        return '#F97316';
      case 'WARNING':
        return '#D97706';
      default:
        return '#10B981';
    }
  };

  const riskColor = getRiskColor(riskLevel);

  return (
    <div className="predictive-alert-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Alert Header Card */}
      <div
        className="glass-panel"
        style={{
          borderLeft: `4px solid ${riskColor}`,
          padding: '1.25rem',
          background: riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.65)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={20} color={riskColor} />
            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em', color: '#FFF' }}>
              PREDICTIVE FAILURE ALERT
            </span>
          </div>
          <span
            className="badge"
            style={{
              background: `${riskColor}22`,
              color: riskColor,
              border: `1px solid ${riskColor}66`,
            }}
          >
            {riskLevel}
          </span>
        </div>

        {/* Anomaly Risk Gauge Circle & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', margin: '1rem 0' }}>
          <div style={{ position: 'relative', width: 84, height: 84 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="3.5"
              />
              {/* Animated Progress circle */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={riskColor}
                strokeWidth="3.5"
                strokeDasharray={`${anomalyScore}, 100`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.15rem', color: '#FFF' }}>
                {Math.round(anomalyScore)}%
              </span>
              <span style={{ fontSize: '0.62rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', marginTop: -2 }}>
                RISK
              </span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
              GNN Topo-Anomaly Score
            </div>
            <div style={{ fontSize: '0.9rem', color: '#E2E8F0', fontWeight: 600, marginTop: 4 }}>
              {riskLevel === 'CRITICAL' ? 'Severe Topology Strain' : riskLevel === 'HIGH' ? 'Elevated Link Degrade' : 'Mesh SLA Compliant'}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
              Message passing depth: 3 hops (GCN layer)
            </div>
          </div>
        </div>

        {/* ETA To Failure Countdown Metric */}
        {etaMinutes !== null && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#FCA5A5',
              fontFamily: 'JetBrains Mono',
              fontSize: '0.8rem',
            }}
          >
            <Clock size={16} color="#EF4444" />
            <div>
              <span style={{ fontWeight: 700, color: '#FFF' }}>ETA TO FAILURE: </span>
              <span>Node B core offline in <strong style={{ color: '#EF4444' }}>{etaMinutes} min</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Current Symptoms Card */}
      <div className="glass-panel" style={{ padding: '1.15rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Activity size={16} color="#06B6D4" />
          <span style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.88rem', color: '#FFF' }}>
            Current Diagnostic Symptoms
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {symptoms.map((symptom, idx) => (
            <div
              key={`symptom-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.55rem',
                fontSize: '0.78rem',
                color: '#CBD5E1',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                borderLeft: `2px solid ${isAnomalous ? '#EF4444' : '#10B981'}`,
                lineHeight: 1.4,
              }}
            >
              {isAnomalous ? (
                <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
              ) : (
                <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
              )}
              <span>{symptom}</span>
            </div>
          ))}
        </div>

        {/* Qualcomm Cloud AI 100 Attribution Banner */}
        <div
          style={{
            marginTop: '1rem',
            padding: '0.65rem 0.8rem',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontFamily: 'JetBrains Mono',
            color: '#A5B4FC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 2 }}>
            <Zap size={13} color="#818CF8" />
            <strong style={{ color: '#FFF' }}>Qualcomm Cloud AI 100 Ultra</strong>
          </div>
          <div style={{ color: '#94A3B8' }}>
            Model: Llama-3.1-8B • Cirrascale Inference Cloud
          </div>
        </div>
      </div>
    </div>
  );
}
