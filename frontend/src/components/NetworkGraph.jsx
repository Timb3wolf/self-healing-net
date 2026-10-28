import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

/**
 * NetworkGraph component visualizing routers S1, A, B, C, D
 * Dynamic edge styling based on utilization:
 *  - Green: util < 0.70
 *  - Amber: 0.70 <= util <= 0.90
 *  - Red: util > 0.90
 * Ghost overlay support: dashed secondary lines for predicted post-optimization state.
 */
export default function NetworkGraph({ links = {}, predictedLinks = {}, ghostMode = false, selectedAction = null }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  // Router layout node positions
  const NODE_POSITIONS = {
    'S1': { x: 80, y: 190 },
    'A':  { x: 230, y: 190 },
    'D':  { x: 370, y: 75 },
    'B':  { x: 510, y: 190 },
    'C':  { x: 660, y: 190 },
  };

  const getEdgeColor = (util) => {
    if (util > 0.90) return '#ef4444'; // Red
    if (util >= 0.70) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const getEdgeWidth = (util) => {
    if (util > 0.90) return 6;
    if (util >= 0.70) return 4.5;
    return 3;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Build Cytoscape elements
    const elements = [];

    // Add Nodes
    const nodes = [
      { id: 'S1', label: 'S1 (Ingress)', type: 'ingress' },
      { id: 'A',  label: 'Router A', type: 'core' },
      { id: 'D',  label: 'Transit D', type: 'transit' },
      { id: 'B',  label: 'Router B', type: 'core' },
      { id: 'C',  label: 'C (Egress)', type: 'egress' },
    ];

    nodes.forEach((n) => {
      elements.push({
        group: 'nodes',
        data: { id: n.id, label: n.label, type: n.type },
        position: NODE_POSITIONS[n.id],
      });
    });

    // Add Live Edges
    Object.entries(links).forEach(([linkId, linkData]) => {
      const util = linkData.util || 0.0;
      const latency = linkData.latency || 0.0;
      const loss = linkData.loss || 0.0;
      const isAnomalous = util > 0.90;

      elements.push({
        group: 'edges',
        data: {
          id: linkId,
          source: linkData.source,
          target: linkData.target,
          label: `${Math.round(util * 100)}% | ${latency}ms`,
          util: util,
          color: getEdgeColor(util),
          width: getEdgeWidth(util),
          lineStyle: 'solid',
          opacity: ghostMode ? 0.35 : 1.0,
          isGhost: false,
          isAnomalous: isAnomalous,
        },
      });
    });

    // Add Ghost Overlay Edges (Predicted Post-Remediation State)
    if (ghostMode && predictedLinks) {
      Object.entries(predictedLinks).forEach(([linkId, predData]) => {
        const liveLink = links[linkId];
        if (!liveLink) return;

        const predUtil = predData.util ?? liveLink.util;
        const predLatency = predData.latency ?? liveLink.latency;

        elements.push({
          group: 'edges',
          data: {
            id: `ghost-${linkId}`,
            source: liveLink.source,
            target: liveLink.target,
            label: `PRED: ${Math.round(predUtil * 100)}% (${predLatency}ms)`,
            util: predUtil,
            color: '#06b6d4',
            width: 4,
            lineStyle: 'dashed',
            opacity: 0.95,
            isGhost: true,
          },
        });
      });
    }

    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#1e293b',
              'border-width': 2.5,
              'border-color': '#6366f1',
              'label': 'data(label)',
              'color': '#f8fafc',
              'font-size': '12px',
              'font-family': 'JetBrains Mono, monospace',
              'font-weight': 600,
              'text-valign': 'bottom',
              'text-margin-y': 8,
              'width': 44,
              'height': 44,
              'shadow-blur': 12,
              'shadow-color': 'rgba(99, 102, 241, 0.4)',
              'shadow-opacity': 0.8,
            },
          },
          {
            selector: 'node[type = "transit"]',
            style: {
              'border-color': '#06b6d4',
              'shadow-color': 'rgba(6, 182, 212, 0.4)',
            },
          },
          {
            selector: 'node[type = "ingress"], node[type = "egress"]',
            style: {
              'border-color': '#a855f7',
              'shadow-color': 'rgba(168, 85, 247, 0.4)',
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 'data(width)',
              'line-color': 'data(color)',
              'target-arrow-color': 'data(color)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 1.1,
              'label': 'data(label)',
              'font-size': '10px',
              'font-family': 'JetBrains Mono, monospace',
              'font-weight': 600,
              'color': '#cbd5e1',
              'text-background-color': '#0f172a',
              'text-background-opacity': 0.85,
              'text-background-padding': '3px',
              'text-background-shape': 'roundrectangle',
              'opacity': 'data(opacity)',
              'line-style': 'data(lineStyle)',
            },
          },
          {
            selector: 'edge[lineStyle = "dashed"]',
            style: {
              'line-dash-pattern': [6, 4],
            },
          },
        ],
        layout: {
          name: 'preset',
        },
        userZoomingEnabled: false,
        userPanningEnabled: false,
        boxSelectionEnabled: false,
        autoungrabify: true,
      });
    } else {
      cyRef.current.json({ elements });
      cyRef.current.fit(null, 30);
    }

    return () => {
      // Keep instance alive or clean up on unmount
    };
  }, [links, predictedLinks, ghostMode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        id="network-cytoscape-canvas"
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#10b981' }} />
          <span>Nominal (&lt;70%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#f59e0b' }} />
          <span>Elevated (70-90%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ef4444' }} />
          <span>Critical (&gt;90%)</span>
        </div>
        {ghostMode && (
          <div className="legend-item">
            <span
              className="legend-dot"
              style={{
                background: '#06b6d4',
                border: '1px dashed #fff',
              }}
            />
            <span>Ghost Overlay (Predicted)</span>
          </div>
        )}
      </div>
    </div>
  );
}
