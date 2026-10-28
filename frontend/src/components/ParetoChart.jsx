import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';

/**
 * ParetoChart component:
 * Scatter plot comparing Latency (X-axis) vs Blast Radius (Y-axis)
 * Highlights non-dominated Pareto front and the winning selected action.
 */
export default function ParetoChart({
  candidateActions = [],
  selectedActionIds = [],
}) {
  // Synthesize Latency vs Blast Radius data points for candidates
  const actionPoints = candidateActions.map((act) => {
    // Latency estimate based on action type and target
    let estimatedLatency = 12.0;
    if (act.type === 'REROUTE_FLOW') estimatedLatency = 14.5;
    if (act.type === 'RATE_LIMIT') estimatedLatency = 24.0;
    if (act.type === 'QOS_WEIGHT') estimatedLatency = 16.0;
    if (act.type === 'LINK_RESET') estimatedLatency = 38.0;

    const isSelected = selectedActionIds.includes(act.action_id);

    return {
      id: act.action_id,
      name: act.action_id,
      type: act.type,
      cost: act.cost,
      latency: estimatedLatency,
      blastRadius: act.blast_radius,
      isSelected,
      description: act.description,
    };
  });

  // Calculate Pareto Front (minimize latency & minimize blast radius)
  // Sort by latency ascending
  const sorted = [...actionPoints].sort((a, b) => a.latency - b.latency);
  const paretoPoints = [];
  let minBlast = Infinity;

  sorted.forEach((p) => {
    if (p.blastRadius < minBlast) {
      paretoPoints.push(p);
      minBlast = p.blastRadius;
    }
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: `1px solid ${data.isSelected ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '0.78rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <div style={{ color: data.isSelected ? '#a5b4fc' : '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
            {data.id} {data.isSelected && '★ SELECTED'}
          </div>
          <div style={{ color: '#cbd5e1' }}>Type: {data.type}</div>
          <div style={{ color: '#94a3b8' }}>Latency: {data.latency} ms</div>
          <div style={{ color: '#94a3b8' }}>Blast Radius: {data.blastRadius}</div>
          <div style={{ color: '#94a3b8' }}>Cost: {data.cost}</div>
          {data.description && (
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '4px', maxWidth: '200px' }}>
              {data.description}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 320, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
          <XAxis
            type="number"
            dataKey="latency"
            name="Latency"
            unit="ms"
            domain={[5, 45]}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Predicted Mean Latency (ms)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="blastRadius"
            name="Blast Radius"
            domain={[0, 1.0]}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Blast Radius (0-1)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Candidate Actions" data={actionPoints}>
            {actionPoints.map((entry, index) => {
              if (entry.isSelected) {
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    r={9}
                  />
                );
              }
              const isPareto = paretoPoints.some((p) => p.id === entry.id);
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isPareto ? '#06b6d4' : '#64748b'}
                  stroke={isPareto ? '#38bdf8' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={1.5}
                  r={isPareto ? 6.5 : 5}
                />
              );
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.25rem',
          fontSize: '0.72rem',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#94a3b8',
          marginTop: '-4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', border: '2px solid #fff' }} />
          <span>Optimizer Picked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
          <span>Non-Dominated Pareto Front</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748b' }} />
          <span>Dominated Candidate</span>
        </div>
      </div>
    </div>
  );
}
