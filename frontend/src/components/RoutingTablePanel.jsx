import React from 'react';
import { GitBranch, Shield, ArrowRight, CornerDownRight, Zap, Clock, Activity, BarChart2 } from 'lucide-react';

/**
 * Dynamic Routing & Automatic Rerouting Panel (Section 4)
 * Displays:
 *  - Dynamic OSPF routing table (Source, Destination, Next Hop, Hop Count, OSPF Cost, Failover Duration ms, Traffic Redirected)
 *  - Failover status indicators
 *  - Metric cards: Failover Switchover Time (ms), Active Paths, Redirected Load
 */
export default function RoutingTablePanel({ routingTable = [], isAnomalous = false }) {
  const routes = routingTable.length > 0 ? routingTable : [
    {
      flow_id: 'F-VOIP-1',
      source: 'S1',
      destination: 'C',
      nominal_path: ['S1', 'A', 'B', 'C'],
      active_path: isAnomalous ? ['S1', 'A', 'D', 'B', 'C'] : ['S1', 'A', 'B', 'C'],
      next_hop: 'A',
      hop_count: isAnomalous ? 4 : 3,
      ospf_cost: isAnomalous ? 95 : 35,
      status: isAnomalous ? 'FAILOVER_REROUTED' : 'ACTIVE_NOMINAL',
      failover_duration_ms: isAnomalous ? 12.4 : 0.0,
      traffic_mbps: 100.0,
    },
    {
      flow_id: 'F-DATA-2',
      source: 'S1',
      destination: 'C',
      nominal_path: ['S1', 'A', 'B', 'C'],
      active_path: isAnomalous ? ['S1', 'A', 'D', 'B', 'C'] : ['S1', 'A', 'B', 'C'],
      next_hop: 'A',
      hop_count: isAnomalous ? 4 : 3,
      ospf_cost: isAnomalous ? 95 : 35,
      status: isAnomalous ? 'FAILOVER_REROUTED' : 'ACTIVE_NOMINAL',
      failover_duration_ms: isAnomalous ? 12.4 : 0.0,
      traffic_mbps: 320.0,
    },
  ];

  const totalRedirectedMbps = routes
    .filter((r) => r.status === 'FAILOVER_REROUTED')
    .reduce((sum, r) => sum + (r.traffic_mbps || 0), 0);

  const maxFailoverMs = Math.max(0, ...routes.map((r) => r.failover_duration_ms || 0));

  return (
    <div className="routing-table-panel glass-panel" style={{ padding: '1.25rem' }}>
      <div className="card-header" style={{ padding: '0 0 1rem 0', marginBottom: '1rem' }}>
        <div className="card-title-group">
          <GitBranch size={18} color="#06B6D4" />
          <span className="card-title">Dynamic OSPF Routing & Automatic Failover Engine</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${isAnomalous ? 'badge-blue' : 'badge-green'}`}>
            {isAnomalous ? 'DIJKSTRA FAILOVER ACTIVE' : 'OPTIMAL CONVERGED'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stat-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-box">
          <div className="stat-label">FAILOVER DURATION</div>
          <div className="stat-value" style={{ color: isAnomalous ? '#06B6D4' : '#10B981' }}>
            {maxFailoverMs > 0 ? `${maxFailoverMs} ms` : '0.0 ms'}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Dijkstra Graph Recalculation</span>
        </div>
        <div className="stat-box">
          <div className="stat-label">REDIRECTED TRAFFIC</div>
          <div className="stat-value" style={{ color: totalRedirectedMbps > 0 ? '#F59E0B' : '#E2E8F0' }}>
            {totalRedirectedMbps} Mbps
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Transit Link D (Singapore)</span>
        </div>
        <div className="stat-box">
          <div className="stat-label">OSPF METRIC COST</div>
          <div className="stat-value" style={{ color: '#A855F7' }}>
            {routes[0]?.ospf_cost || 35}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Dynamic Cost Matrix</span>
        </div>
      </div>

      {/* Routing Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="solver-table">
          <thead>
            <tr>
              <th>Flow ID</th>
              <th>Source → Dest</th>
              <th>Active Route Path</th>
              <th>Next Hop</th>
              <th>Hops</th>
              <th>OSPF Cost</th>
              <th>Failover Time</th>
              <th>Load</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => {
              const isRerouted = route.status === 'FAILOVER_REROUTED';
              return (
                <tr key={route.flow_id} style={{ background: isRerouted ? 'rgba(6, 182, 212, 0.08)' : 'transparent' }}>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#FFF' }}>
                    {route.flow_id}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#94A3B8' }}>
                    {route.source} → {route.destination}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {route.active_path.map((node, i) => (
                        <React.Fragment key={i}>
                          <span
                            style={{
                              background: node === 'D' && isRerouted ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.06)',
                              color: node === 'D' && isRerouted ? '#06B6D4' : '#E2E8F0',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            {node}
                          </span>
                          {i < route.active_path.length - 1 && (
                            <span style={{ color: '#475569', fontSize: '10px' }}>→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#CBD5E1' }}>
                    {route.next_hop}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#CBD5E1' }}>
                    {route.hop_count}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#CBD5E1' }}>
                    {route.ospf_cost}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: isRerouted ? '#06B6D4' : '#64748B' }}>
                    {route.failover_duration_ms > 0 ? `${route.failover_duration_ms}ms` : '—'}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#CBD5E1' }}>
                    {route.traffic_mbps} Mbps
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: isRerouted ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isRerouted ? '#06B6D4' : '#10B981',
                        border: `1px solid ${isRerouted ? '#06B6D466' : '#10B98166'}`,
                      }}
                    >
                      {route.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
