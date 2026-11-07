import React from 'react';

/**
 * LiveLinkKpiTable - Inspired by self_healing_noc.html
 * Displays real-time KPIs per network link:
 * Link, Status (Critical, Elevated, Healthy, Standby), Util %, Throughput, Latency, Jitter, Packet Loss.
 */
export default function LiveLinkKpiTable({ links = [], siteName = "Core London Cluster" }) {
  // If links are empty or standard edges from topology
  const defaultLinks = [
    { id: "H-E1", name: "Core–Edge 1", status: "Healthy", util: 42, thr: 588, lat: 2.1, jit: 0.18, loss: 0.0, load: 588, cap: 1400 },
    { id: "H-E2", name: "Core–Edge 2", status: "Healthy", util: 38, thr: 532, lat: 1.9, jit: 0.15, loss: 0.0, load: 532, cap: 1400 },
    { id: "H-E3", name: "Core–Edge 3", status: "Healthy", util: 45, thr: 630, lat: 2.4, jit: 0.22, loss: 0.0, load: 630, cap: 1400 },
    { id: "H-E4", name: "Core–Edge 4", status: "Healthy", util: 31, thr: 434, lat: 1.8, jit: 0.14, loss: 0.0, load: 434, cap: 1400 },
    { id: "H-E5", name: "Core–Edge 5", status: "Healthy", util: 50, thr: 700, lat: 2.8, jit: 0.25, loss: 0.0, load: 700, cap: 1400 },
    { id: "E1-E2", name: "Edge 1–Edge 2", status: "Standby", util: 12, thr: 108, lat: 3.2, jit: 0.31, loss: 0.0, load: 108, cap: 900 },
    { id: "E2-E3", name: "Edge 2–Edge 3", status: "Standby", util: 8, thr: 72, lat: 3.5, jit: 0.28, loss: 0.0, load: 72, cap: 900 },
    { id: "E3-E4", name: "Edge 3–Edge 4", status: "Standby", util: 14, thr: 126, lat: 3.1, jit: 0.34, loss: 0.0, load: 126, cap: 900 },
    { id: "E4-E5", name: "Edge 4–Edge 5", status: "Standby", util: 6, thr: 54, lat: 3.8, jit: 0.29, loss: 0.0, load: 54, cap: 900 },
  ];

  const data = (links && links.length > 0) ? links : defaultLinks;

  const getStatusColor = (status, util, loss, isDown) => {
    if (isDown || status === "Down" || status === "Critical" || util > 90 || loss > 1.0) return "var(--bad, #F05A5A)";
    if (status === "Elevated" || status === "Degraded" || util > 70) return "var(--warn, #F0A93B)";
    if (status === "Standby" || util < 15) return "var(--dim, #4B5D75)";
    return "var(--ok, #2ECC8F)";
  };

  const getRowClass = (status, util, loss, isDown) => {
    if (isDown || status === "Down" || status === "Critical" || util > 90 || loss > 1.0) return "kpi-row-bad";
    if (status === "Elevated" || status === "Degraded" || util > 70) return "kpi-row-warn";
    if (status === "Standby") return "kpi-row-idle";
    return "";
  };

  return (
    <div className="panel" style={{ background: "var(--panel, #111B2C)", border: "1px solid var(--line, #1F2E45)", borderRadius: "12px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "16px", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--ink, #DCE6F2)" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--cyan, #22C3E6)" }}></span>
          Live Link KPIs — {siteName}
        </h2>
        <span style={{ fontSize: "12px", color: "var(--muted, #8597AE)" }}>1s polling via OpenTelemetry eBPF</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line, #1F2E45)", color: "var(--muted, #8597AE)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "600" }}>Link Interface</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "600" }}>Status</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Utilisation</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Throughput</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Latency</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Jitter</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Packet Loss</th>
            </tr>
          </thead>
          <tbody>
            {data.map((l, idx) => {
              const util = l.util ?? Math.round((l.load / (l.cap || 1000)) * 100) ?? 0;
              const loss = l.loss ?? 0;
              const isDown = l.down || l.status === "Down";
              const dotColor = getStatusColor(l.status, util, loss, isDown);
              const rowClass = getRowClass(l.status, util, loss, isDown);

              return (
                <tr 
                  key={l.id || idx} 
                  className={rowClass}
                  style={{ 
                    borderBottom: "1px solid rgba(31, 46, 69, 0.6)",
                    background: rowClass === "kpi-row-bad" ? "rgba(240, 90, 90, 0.08)" : rowClass === "kpi-row-warn" ? "rgba(240, 169, 59, 0.06)" : "transparent"
                  }}
                >
                  <td style={{ padding: "8px 10px", color: "var(--ink, #DCE6F2)", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: dotColor }}></span>
                    {l.name || l.id}
                  </td>
                  <td style={{ padding: "8px 10px", color: dotColor, fontWeight: "600" }}>
                    {isDown ? "Down" : l.status || (util > 90 ? "Critical" : util > 70 ? "Elevated" : util > 15 ? "Healthy" : "Standby")}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: util > 85 ? "var(--bad, #F05A5A)" : "var(--ink, #DCE6F2)" }}>
                    {isDown ? "–" : `${util}%`}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--ink, #DCE6F2)" }}>
                    {isDown ? "0 Mbps" : `${Math.round(l.thr ?? l.load ?? 0)} Mbps`}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: l.lat > 15 ? "var(--bad, #F05A5A)" : "var(--ink, #DCE6F2)" }}>
                    {isDown ? "–" : `${Number(l.lat ?? 2.1).toFixed(1)} ms`}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--ink, #DCE6F2)" }}>
                    {isDown ? "–" : `${Number(l.jit ?? 0.2).toFixed(2)} ms`}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: loss > 0.005 ? "var(--bad, #F05A5A)" : "var(--ink, #DCE6F2)" }}>
                    {isDown ? "100%" : `${(loss * 100).toFixed(1)}%`}
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
