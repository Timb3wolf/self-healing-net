import React from 'react';
import { GitCommit, ArrowRight, AlertTriangle, CheckCircle, Search, Layers, Server, Activity, ShieldCheck } from 'lucide-react';

/**
 * Visual Dependency Tree & Causal Root-Cause Analysis Panel (Section 8 & Image 0/2 style)
 * Features:
 *  - Visual node-to-node fault chain: S1 Ingress -> Router A -> Link A-B Tail-Drop -> Router B Buffer Exhaustion -> Flows Failed
 *  - Dynamic pinpoint analytics distinguishing interface congestion from hardware failure
 *  - Probable root cause summary + Qualcomm Cloud AI 100 diagnostic findings
 */
export default function CausalGraphPanel({ causalTree = null, incident = null, isAnomalous = false }) {
  const rootCause = causalTree?.root_cause || (isAnomalous
    ? 'High ingress burst rate saturating egress queue buffer on link A-B'
    : 'Nominal operating conditions across all 5 topology gateways');

  const metrics = causalTree?.pinpoint_metrics || {
    bottleneck_link: 'A-B',
    utilization_pct: isAnomalous ? 95.0 : 42.0,
    latency_ms: isAnomalous ? 92.4 : 4.1,
    loss_pct: isAnomalous ? 4.5 : 0.01,
    alternate_link: 'A-D',
    alternate_util_pct: 18.0,
  };

  const dependencyChain = causalTree?.dependency_chain?.length > 0 ? causalTree.dependency_chain : (
    isAnomalous ? [
      {
        step: 1,
        node: 'S1 (London Ingress)',
        state: 'SURGE_INGRESS',
        detail: 'Unthrottled ingress traffic burst (+450Mbps)',
        severity: 'WARNING',
      },
      {
        step: 2,
        node: 'Router A (Frankfurt)',
        state: 'QUEUE_CONGESTION',
        detail: 'Interface FIFO egress buffer reaches 98% capacity',
        severity: 'CRITICAL',
      },
      {
        step: 3,
        node: 'Link A-B (Core Backbone)',
        state: 'TAIL_DROP_LOSS',
        detail: 'Tail-drop packets exceeding 4.5% loss threshold',
        severity: 'CRITICAL',
      },
      {
        step: 4,
        node: 'Router B (New York)',
        state: 'BUFFER_BACKLOG',
        detail: 'TCP retransmissions causing cascading jitter',
        severity: 'WARNING',
      },
      {
        step: 5,
        node: 'Flows F-VOIP-1 & F-DATA-2',
        state: 'SLA_VIOLATION',
        detail: 'End-to-end latency spike to 92.4ms (SLA threshold 50ms)',
        severity: 'CRITICAL',
      },
    ] : [
      {
        step: 1,
        node: 'S1 Ingress Core',
        state: 'HEALTHY',
        detail: 'Ingress rate within allocated profile',
        severity: 'NOMINAL',
      },
      {
        step: 2,
        node: 'Router A & B Mesh',
        state: 'HEALTHY',
        detail: 'Buffer headroom > 85%, zero tail-drop',
        severity: 'NOMINAL',
      },
      {
        step: 3,
        node: 'Transit D Backup',
        state: 'STANDBY_READY',
        detail: 'OSPF hello keepalives verified',
        severity: 'NOMINAL',
      },
    ]
  );

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.35)' };
      case 'WARNING':
        return { bg: 'rgba(217, 119, 6, 0.15)', text: '#D97706', border: 'rgba(217, 119, 6, 0.35)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.35)' };
    }
  };

  return (
    <div className="causal-graph-panel glass-panel" style={{ padding: '1.25rem' }}>
      <div className="card-header" style={{ padding: '0 0 1rem 0', marginBottom: '1rem' }}>
        <div className="card-title-group">
          <Layers size={18} color="#8B5CF6" />
          <span className="card-title">Causal Dependency Tree & Root-Cause Telemetry Chain</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${isAnomalous ? 'badge-red' : 'badge-green'}`}>
            {isAnomalous ? 'ROOT-CAUSE ISOLATED' : 'ALL NODES NOMINAL'}
          </span>
        </div>
      </div>

      {/* Probable Root Cause Banner */}
      <div
        style={{
          background: isAnomalous ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${isAnomalous ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)'}`,
          borderRadius: '8px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        <Search size={18} color={isAnomalous ? '#EF4444' : '#10B981'} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
            Probable Root Cause Diagnosis
          </div>
          <div style={{ fontSize: '0.88rem', color: '#FFF', fontWeight: 600, marginTop: 2 }}>
            {rootCause}
          </div>
        </div>
      </div>

      {/* Pinpoint Analytics Comparison */}
      <div className="stat-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-box">
          <div className="stat-label">PINPOINTED BOTTLENECK</div>
          <div className="stat-value" style={{ color: isAnomalous ? '#EF4444' : '#10B981' }}>
            Link {metrics.bottleneck_link}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
            {metrics.utilization_pct}% Util • {metrics.latency_ms}ms RTT
          </span>
        </div>
        <div className="stat-box">
          <div className="stat-label">ISOLATED FAILURE TYPE</div>
          <div className="stat-value" style={{ color: isAnomalous ? '#F59E0B' : '#10B981' }}>
            {isAnomalous ? 'Queue Tail-Drop' : 'None'}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
            Loss Rate: {metrics.loss_pct}%
          </span>
        </div>
        <div className="stat-box">
          <div className="stat-label">HEALTHY DIVERSION PATH</div>
          <div className="stat-value" style={{ color: '#06B6D4' }}>
            Link {metrics.alternate_link}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
            {metrics.alternate_util_pct}% Util (Sub-optimal hop)
          </span>
        </div>
      </div>

      {/* Visual Step-by-Step Dependency Tree */}
      <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', marginBottom: '0.75rem' }}>
        FAULT PROPAGATION CHAIN (IMAGE 0 / IMAGE 2 STRUCTURE):
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {dependencyChain.map((step, idx) => {
          const badgeStyle = getSeverityBadge(step.severity);
          return (
            <div
              key={`chain-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: '#CBD5E1',
                    fontWeight: 700,
                  }}
                >
                  {step.step}
                </span>
                <div>
                  <strong style={{ color: '#FFF' }}>{step.node}</strong>
                  <span style={{ color: '#64748B', margin: '0 6px' }}>—</span>
                  <span style={{ color: '#CBD5E1' }}>{step.detail}</span>
                </div>
              </div>

              <span
                className="badge"
                style={{
                  background: badgeStyle.bg,
                  color: badgeStyle.text,
                  border: `1px solid ${badgeStyle.border}`,
                  fontSize: '0.68rem',
                }}
              >
                {step.state}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
