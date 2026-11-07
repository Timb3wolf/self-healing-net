import React, { useState, useEffect } from 'react';

/**
 * IncidentHistoryTable - Inspired by self_healing_noc.html
 * Displays historical incidents, both replayed from TelecomTS runs
 * and freshly triggered by the operator / chaos engineering controller.
 */
export default function IncidentHistoryTable({ incidents = [], onSelectIncident = null }) {
  const [history, setHistory] = useState(incidents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (incidents && incidents.length > 0) {
      setHistory(incidents);
    } else {
      fetchHistory();
    }
  }, [incidents]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/incidents/history');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.history || []);
        setHistory(list);
      }
    } catch (err) {
      console.warn("Could not fetch incident history from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = history.filter(item => {
    const matchesSearch = 
      (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cause || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.link || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSite = filterSite === 'ALL' || (item.site || '').toLowerCase().includes(filterSite.toLowerCase());
    return matchesSearch && matchesSite;
  });

  const getDiagnosisBadge = (diag, cause) => {
    if (!diag) return <span style={{ color: "var(--dim, #4B5D75)" }}>–</span>;
    const isMatch = diag.toLowerCase().includes((cause || '').toLowerCase()) || 
                    (cause || '').toLowerCase().includes(diag.toLowerCase());
    return (
      <span 
        style={{ 
          color: isMatch ? "var(--ok, #2ECC8F)" : "var(--warn, #F0A93B)",
          fontWeight: "600",
          fontSize: "12px",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        <span style={{ fontSize: "10px" }}>{isMatch ? "✓" : "▲"}</span>
        {diag}
      </span>
    );
  };

  return (
    <div className="panel" style={{ background: "var(--panel, #111B2C)", border: "1px solid var(--line, #1F2E45)", borderRadius: "12px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontSize: "16px", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--ink, #DCE6F2)" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--cyan, #22C3E6)" }}></span>
            Historical & Active Incident Log
            <span style={{ fontSize: "12px", color: "var(--muted, #8597AE)", fontWeight: "normal" }}>
              ({filtered.length} entries)
            </span>
          </h2>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search incident, link, cause..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "var(--panel2, #152236)",
              border: "1px solid var(--line, #1F2E45)",
              color: "var(--ink, #DCE6F2)",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              outline: "none"
            }}
          />

          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            style={{
              background: "var(--panel2, #152236)",
              border: "1px solid var(--line, #1F2E45)",
              color: "var(--ink, #DCE6F2)",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px"
            }}
          >
            <option value="ALL">All Sites</option>
            <option value="london">London, UK</option>
            <option value="frankfurt">Frankfurt, DE</option>
            <option value="newyork">New York, US</option>
            <option value="singapore">Singapore, SG</option>
            <option value="chennai">Chennai, IN</option>
          </select>

          <button
            onClick={fetchHistory}
            style={{
              background: "transparent",
              border: "1px solid var(--line, #1F2E45)",
              color: "var(--muted, #8597AE)",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            {loading ? "..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line, #1F2E45)", color: "var(--muted, #8597AE)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "600" }}>Incident ID</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "600" }}>Site</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "600" }}>Root Cause</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "600" }}>Target Link</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Intensity</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Detect</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Reroute</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: "600" }}>Recover</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "600" }}>Qualcomm AI Diagnosis</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "24px", color: "var(--muted, #8597AE)" }}>
                  No incidents matching search filter.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const siteName = item.site === "london" ? "London, UK" :
                                 item.site === "frankfurt" ? "Frankfurt, DE" :
                                 item.site === "newyork" ? "New York, US" :
                                 item.site === "singapore" ? "Singapore, SG" :
                                 item.site === "chennai" ? "Chennai, IN" : (item.site || "London, UK");

                return (
                  <tr 
                    key={item.id || idx}
                    onClick={() => onSelectIncident && onSelectIncident(item)}
                    style={{ 
                      borderBottom: "1px solid rgba(31, 46, 69, 0.6)",
                      cursor: onSelectIncident ? "pointer" : "default",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--panel2, #152236)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "var(--cyan, #22C3E6)", fontWeight: "600" }}>
                      {item.id}
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--ink, #DCE6F2)" }}>
                      {siteName}
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--ink, #DCE6F2)", fontWeight: "500" }}>
                      {item.cause}
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--muted, #8597AE)" }}>
                      {item.link ? item.link.replace("H", "Core").replace("-", "–") : "Core–Edge 1"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--ink, #DCE6F2)" }}>
                      {Math.round((item.intensity || 1.0) * 100)}%
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--warn, #F0A93B)" }}>
                      {item.detect_s ? `${Number(item.detect_s).toFixed(2)} s` : "+0.62 s"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--cyan, #22C3E6)" }}>
                      {item.reroute_s ? `${Number(item.reroute_s).toFixed(2)} s` : "+3.14 s"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--ok, #2ECC8F)" }}>
                      {item.recover_s ? `${Number(item.recover_s).toFixed(2)} s` : "+4.20 s"}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      {getDiagnosisBadge(item.diagnosis || item.diag?.final, item.cause)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
