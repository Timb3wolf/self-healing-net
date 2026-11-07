import React, { useState } from 'react';

/**
 * SiteTopologyGraph - Inspired directly by self_healing_noc.html
 * 100% SVG Vector Architecture: Zero external library crash risk, responsive,
 * featuring live link utilization, glowing nodes, and animated traffic flow particles.
 * 
 * Supports two view modes:
 *  1. 'site': Radial 5G Site Architecture (Central Core Hub + N Edge Nodes arranged in an optical ring)
 *  2. 'backbone': SDN Gateway Topology (S1 Ingress -> A Transit -> D Bypass -> B Access -> C Egress)
 */
export default function NetworkGraph({
  selectedSite = 'london',
  links = {},
  flows = [],
  isAnomalous = false,
  ghostMode = false,
  predictedLinks = {},
  activeRouting = [],
  onSelectNode = null
}) {
  const [viewMode, setViewMode] = useState('site'); // 'site' or 'backbone'
  const [hoveredNode, setHoveredNode] = useState(null);

  // Site definition parameters (insp: self_healing_noc.html)
  const SITE_CONFIGS = {
    london:    { name: 'London, UK',    n: 6, code: 'LON' },
    frankfurt: { name: 'Frankfurt, DE', n: 5, code: 'FRA' },
    newyork:   { name: 'New York, US',  n: 7, code: 'NYC' },
    singapore: { name: 'Singapore, SG', n: 5, code: 'SGP' },
    chennai:   { name: 'Chennai, IN',   n: 6, code: 'MAA' },
  };

  const currentCfg = SITE_CONFIGS[selectedSite] || SITE_CONFIGS.london;
  const numEdges = currentCfg.n;

  // Geometry for Radial 5G Site (ViewBox 640 x 420)
  const HUB_POS = { x: 320, y: 210 };
  const RADIUS_X = 185;
  const RADIUS_Y = 150;

  const edgePositions = [];
  for (let i = 1; i <= numEdges; i++) {
    const angle = -Math.PI / 2 + ((i - 1) * 2 * Math.PI) / numEdges;
    edgePositions.push({
      id: `E${i}`,
      label: `Edge ${i}`,
      name: `Site Cell E${i}`,
      x: Math.round(HUB_POS.x + RADIUS_X * Math.cos(angle)),
      y: Math.round(HUB_POS.y + RADIUS_Y * Math.sin(angle)),
    });
  }

  // Linear / Mesh SDN Core Backbone Geometry (S1, A, D, B, C)
  const BACKBONE_POSITIONS = {
    'S1': { x: 90,  y: 210, label: 'S1 Ingress', sub: 'London HQ' },
    'A':  { x: 230, y: 210, label: 'Router A',    sub: 'Transit W' },
    'D':  { x: 370, y: 80,  label: 'Transit D',   sub: 'Bypass Alt' },
    'B':  { x: 510, y: 210, label: 'Router B',    sub: 'Access Core' },
    'C':  { x: 620, y: 210, label: 'C Egress',    sub: 'Gateway' },
  };

  const getLinkColor = (util, isDown, isRerouted) => {
    if (isDown) return 'var(--bad, #F05A5A)';
    if (isRerouted) return 'var(--cyan, #22C3E6)';
    if (util >= 0.90) return 'var(--bad, #F05A5A)';
    if (util >= 0.70) return 'var(--warn, #F0A93B)';
    return 'var(--ok, #2ECC8F)';
  };

  return (
    <div style={{ position: 'relative', width: '100%', background: 'var(--panel2, #0C1524)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--line, #1F2E45)' }}>
      {/* View Switch Controls */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 6, background: 'rgba(10, 17, 29, 0.85)', padding: '3px 4px', borderRadius: 8, border: '1px solid var(--line, #1F2E45)' }}>
        <button
          onClick={() => setViewMode('site')}
          style={{
            background: viewMode === 'site' ? 'var(--cyan, #22C3E6)' : 'transparent',
            color: viewMode === 'site' ? '#0A111D' : 'var(--muted, #8597AE)',
            border: 'none',
            borderRadius: 5,
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          5G Site Topology
        </button>
        <button
          onClick={() => setViewMode('backbone')}
          style={{
            background: viewMode === 'backbone' ? 'var(--cyan, #22C3E6)' : 'transparent',
            color: viewMode === 'backbone' ? '#0A111D' : 'var(--muted, #8597AE)',
            border: 'none',
            borderRadius: 5,
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          SDN Backbone Mesh
        </button>
      </div>

      {/* SVG Topology Viewport */}
      <svg
        id="topo"
        viewBox="0 0 680 420"
        style={{ width: '100%', height: 'auto', display: 'block', minHeight: 380 }}
        role="img"
        aria-label="Interactive site topology with live traffic flows"
      >
        <defs>
          {/* Subtle grid pattern background */}
          <pattern id="nocGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(31, 46, 69, 0.35)" strokeWidth="0.8" />
          </pattern>
        </defs>

        <rect width="680" height="420" fill="url(#nocGrid)" />

        {/* =========================================================================
            MODE 1: RADIAL 5G SITE ARCHITECTURE (insp: self_healing_noc.html)
           ========================================================================= */}
        {viewMode === 'site' && (
          <g id="site-topology-layer">
            {/* Outer Perimeter Ring Links between Adjacent Edge Nodes (E1-E2, E2-E3...) */}
            {edgePositions.map((edge, i) => {
              const nextEdge = edgePositions[(i + 1) % edgePositions.length];
              const isBypassActive = isAnomalous && (i === 0 || i === 1);
              const strokeColor = isBypassActive ? 'var(--cyan, #22C3E6)' : 'rgba(93, 123, 166, 0.45)';
              return (
                <g key={`ring-${edge.id}-${nextEdge.id}`}>
                  <line
                    x1={edge.x}
                    y1={edge.y}
                    x2={nextEdge.x}
                    y2={nextEdge.y}
                    stroke={strokeColor}
                    strokeWidth="4"
                    strokeDasharray={isBypassActive ? 'none' : '3 3'}
                    strokeLinecap="round"
                  />
                  {isBypassActive && (
                    <path
                      d={`M ${edge.x} ${edge.y} L ${nextEdge.x} ${nextEdge.y}`}
                      className="trf"
                      stroke="var(--cyan, #22C3E6)"
                    />
                  )}
                </g>
              );
            })}

            {/* Radial Spoke Links connecting Core Hub to each Edge Node (H-E1, H-E2...) */}
            {edgePositions.map((edge, i) => {
              const isPrimaryDegraded = isAnomalous && i === 0; // Edge 1 degraded in fault
              const util = isPrimaryDegraded ? 0.94 : (0.35 + (i * 0.08));
              const isDown = isPrimaryDegraded && isAnomalous;
              const linkColor = getLinkColor(util, isDown, false);

              const midX = (HUB_POS.x + edge.x) / 2;
              const midY = (HUB_POS.y + edge.y) / 2;

              return (
                <g key={`spoke-${edge.id}`}>
                  {/* Spoke Line */}
                  <line
                    className="lk"
                    x1={HUB_POS.x}
                    y1={HUB_POS.y}
                    x2={edge.x}
                    y2={edge.y}
                    stroke={linkColor}
                    strokeWidth={isPrimaryDegraded ? '7' : '5'}
                    strokeDasharray={isDown ? '6 8' : 'none'}
                    opacity={isDown ? 0.85 : 0.95}
                  />

                  {/* Animated Traffic Particles flowing into Core Hub */}
                  {!isDown && (
                    <path
                      d={`M ${edge.x} ${edge.y} L ${HUB_POS.x} ${HUB_POS.y}`}
                      className="trf"
                      stroke={isAnomalous && i === 1 ? 'var(--cyan, #22C3E6)' : '#7FA6FF'}
                    />
                  )}

                  {/* Link Utilization Badge */}
                  <rect
                    x={midX - 18}
                    y={midY - 9}
                    width="36"
                    height="18"
                    rx="4"
                    fill="#0A111D"
                    stroke={linkColor}
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill="var(--ink, #DCE6F2)"
                    fontSize="10"
                    fontFamily="Barlow, sans-serif"
                    fontWeight="600"
                  >
                    {isDown ? 'DOWN' : `${Math.round(util * 100)}%`}
                  </text>
                </g>
              );
            })}

            {/* Central Core Hub Node */}
            <g
              className="nd"
              onClick={() => onSelectNode && onSelectNode('Core Hub')}
              onMouseEnter={() => setHoveredNode({ id: 'H', label: 'Core Hub (London Central)', ip: '10.0.0.1', clients: 412 })}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle
                cx={HUB_POS.x}
                cy={HUB_POS.y}
                r="30"
                fill="#0F1A2B"
                stroke="var(--cyan, #22C3E6)"
                strokeWidth="2.5"
              />
              <text x={HUB_POS.x} y={HUB_POS.y - 3} fill="#FFF" fontWeight="700" fontSize="12">
                Core
              </text>
              <text x={HUB_POS.x} y={HUB_POS.y + 11} fill="var(--muted, #8597AE)" fontSize="9">
                Hub {currentCfg.code}
              </text>
            </g>

            {/* Radial Edge Nodes */}
            {edgePositions.map((edge, i) => {
              const isDegradedNode = isAnomalous && i === 0;
              const nodeStroke = isDegradedNode ? 'var(--bad, #F05A5A)' : '#5D7BA6';

              return (
                <g
                  key={edge.id}
                  className="nd"
                  onClick={() => onSelectNode && onSelectNode(edge.id)}
                  onMouseEnter={() => setHoveredNode({ id: edge.id, label: edge.name, ip: `10.0.${i + 1}.1`, clients: 65 + i * 18 })}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    cx={edge.x}
                    cy={edge.y}
                    r="24"
                    fill="#0F1A2B"
                    stroke={nodeStroke}
                    strokeWidth="2.2"
                  />
                  <text x={edge.x} y={edge.y - 2} fill="#FFF" fontWeight="600" fontSize="11">
                    Edge {i + 1}
                  </text>
                  <text x={edge.x} y={edge.y + 10} fill="var(--muted, #8597AE)" fontSize="9">
                    5G NR
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* =========================================================================
            MODE 2: SDN CORE BACKBONE MESH (S1 -> A -> D -> B -> C)
           ========================================================================= */}
        {viewMode === 'backbone' && (
          <g id="backbone-mesh-layer">
            {/* Direct Primary Links */}
            {[
              { id: 'S1-A', src: 'S1', tgt: 'A', util: 0.38, lat: 3.2, down: false },
              { id: 'A-B',  src: 'A',  tgt: 'B', util: isAnomalous ? 0.96 : 0.42, lat: isAnomalous ? 94.0 : 4.1, down: isAnomalous },
              { id: 'B-C',  src: 'B',  tgt: 'C', util: 0.35, lat: 3.5, down: false },
              { id: 'A-D',  src: 'A',  tgt: 'D', util: isAnomalous ? 0.65 : 0.18, lat: 2.0, down: false },
              { id: 'D-B',  src: 'D',  tgt: 'B', util: isAnomalous ? 0.68 : 0.21, lat: 2.4, down: false },
            ].map((lk) => {
              const p1 = BACKBONE_POSITIONS[lk.src];
              const p2 = BACKBONE_POSITIONS[lk.tgt];
              const isFailover = isAnomalous && (lk.id === 'A-D' || lk.id === 'D-B');
              const linkColor = getLinkColor(lk.util, lk.down, isFailover);

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g key={`bb-${lk.id}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={linkColor}
                    strokeWidth={lk.id === 'A-B' ? 6 : 4.5}
                    strokeDasharray={lk.down ? '6 6' : 'none'}
                    strokeLinecap="round"
                  />

                  {/* Traffic Animation */}
                  {!lk.down && (
                    <path
                      d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                      className="trf"
                      stroke={isFailover ? 'var(--cyan, #22C3E6)' : '#7FA6FF'}
                    />
                  )}

                  {/* Badge */}
                  <rect
                    x={midX - 22}
                    y={midY - 9}
                    width="44"
                    height="18"
                    rx="4"
                    fill="#0A111D"
                    stroke={linkColor}
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill="var(--ink, #DCE6F2)"
                    fontSize="9.5"
                    fontFamily="Barlow, sans-serif"
                    fontWeight="600"
                  >
                    {lk.down ? 'DOWN' : `${Math.round(lk.util * 100)}%`}
                  </text>
                </g>
              );
            })}

            {/* Backbone Nodes (S1, A, D, B, C) */}
            {Object.entries(BACKBONE_POSITIONS).map(([nodeId, pos]) => {
              const isSevered = isAnomalous && nodeId === 'A';
              const strokeColor = nodeId === 'D' ? 'var(--cyan, #22C3E6)' : nodeId === 'S1' || nodeId === 'C' ? '#8B5CF6' : '#3B82F6';

              return (
                <g
                  key={nodeId}
                  className="nd"
                  onClick={() => onSelectNode && onSelectNode(nodeId)}
                  onMouseEnter={() => setHoveredNode({ id: nodeId, label: pos.label, ip: `10.0.${nodeId}.1`, sub: pos.sub })}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="26"
                    fill="#0F1A2B"
                    stroke={isSevered ? 'var(--bad, #F05A5A)' : strokeColor}
                    strokeWidth="2.5"
                  />
                  <text x={pos.x} y={pos.y - 2} fill="#FFF" fontWeight="600" fontSize="11">
                    {pos.label}
                  </text>
                  <text x={pos.x} y={pos.y + 10} fill="var(--muted, #8597AE)" fontSize="8.5">
                    {pos.sub}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Hovercard Tooltip */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            bottom: 42,
            right: 14,
            background: 'var(--panel, #111B2C)',
            border: '1px solid var(--line, #1F2E45)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 20
          }}
        >
          <div style={{ fontWeight: '700', color: '#FFF' }}>{hoveredNode.label}</div>
          <div style={{ color: 'var(--muted, #8597AE)', fontSize: '11px' }}>IP: {hoveredNode.ip}</div>
          {hoveredNode.clients && (
            <div style={{ color: 'var(--cyan, #22C3E6)', fontSize: '11px', marginTop: 2 }}>
              Active UEs: {hoveredNode.clients}
            </div>
          )}
        </div>
      )}

      {/* Bottom Topology Legend */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          color: 'var(--muted, #8597AE)',
          fontSize: '12px',
          padding: '8px 16px',
          background: 'var(--panel, #111B2C)',
          borderTop: '1px solid var(--line, #1F2E45)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--ok, #2ECC8F)' }} />
          Healthy (&lt;70%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--warn, #F0A93B)' }} />
          Elevated (70–90%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--bad, #F05A5A)' }} />
          Critical / Down (&gt;90%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan, #22C3E6)' }} />
          Rerouted Traffic (Failover)
        </span>
      </div>
    </div>
  );
}
