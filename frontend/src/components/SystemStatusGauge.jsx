import React from 'react';
import { Activity, ShieldCheck, Server } from 'lucide-react';

/**
 * SystemStatusGauge Component (Inspired by self_healing_noc.html)
 * Displays:
 *  - Semi-circular SLA compliance gauge
 *  - Big health percentage (e.g. 98.4%)
 *  - Sites healthy count and total nodes count
 */
export default function SystemStatusGauge({
  networkHealthPct = 98.4,
  devicesCount = 5,
  nodesCount = 6,
  isAnomalous = false,
}) {
  const pct = Math.min(Math.max(networkHealthPct, 0), 100);
  const color = pct > 98 ? '#2ECC8F' : pct > 85 ? '#F0A93B' : '#F05A5A';

  // Semi-circle gauge calculation
  const angle = Math.PI * (pct / 100);
  const gx = 85 + 70 * Math.cos(Math.PI - angle);
  const gy = 88 - 70 * Math.sin(Math.PI - angle);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ padding: '0 0 0.75rem 0', marginBottom: '0.75rem' }}>
        <div className="card-title-group">
          <Activity size={18} color="#22C3E6" />
          <span className="card-title">System Status & SLA</span>
        </div>
        <span className={`pill ${pct > 98 ? 'ok' : pct > 85 ? 'warn' : 'bad'}`}>
          {pct > 98 ? 'All Sites Healthy' : pct > 85 ? 'Degraded SLA' : 'Critical Failure'}
        </span>
      </div>

      <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
        <div
          style={{
            fontFamily: 'Barlow Semi Condensed, sans-serif',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: color,
            lineHeight: 1.05,
          }}
        >
          {pct.toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.72rem', color: '#8597AE', marginTop: 2 }}>
          links operating strictly within SLA
        </div>

        {/* Semi-Circle SVG Gauge */}
        <svg width="170" height="96" viewBox="0 0 170 96" style={{ margin: '8px auto 0 auto', display: 'block' }}>
          <path
            d="M15,88 A70,70 0 0 1 155,88"
            fill="none"
            stroke="rgba(21, 34, 54, 0.9)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d={`M15,88 A70,70 0 0 1 ${gx.toFixed(1)},${gy.toFixed(1)}`}
            fill="none"
            stroke={color}
            strokeWidth="11"
            strokeLinecap="round"
            style={{ transition: 'all 0.5s ease' }}
          />
        </svg>
      </div>

      {/* Stat Row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ flex: 1, background: 'rgba(21, 34, 54, 0.75)', borderRadius: 8, padding: '0.65rem 0.85rem', border: '1px solid rgba(255,255,255,0.04)' }}>
          <b style={{ display: 'block', fontFamily: 'Barlow Semi Condensed, sans-serif', fontSize: '1.35rem', color: isAnomalous ? '#F0A93B' : '#2ECC8F' }}>
            {isAnomalous ? `${devicesCount - 1} / ${devicesCount}` : `${devicesCount} / ${devicesCount}`}
          </b>
          <span style={{ fontSize: '0.70rem', color: '#8597AE' }}>sites healthy</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(21, 34, 54, 0.75)', borderRadius: 8, padding: '0.65rem 0.85rem', border: '1px solid rgba(255,255,255,0.04)' }}>
          <b style={{ display: 'block', fontFamily: 'Barlow Semi Condensed, sans-serif', fontSize: '1.35rem', color: '#22C3E6' }}>
            {nodesCount}
          </b>
          <span style={{ fontSize: '0.70rem', color: '#8597AE' }}>nodes active</span>
        </div>
      </div>
    </div>
  );
}
