import React, { useState, useEffect } from 'react';
import { Database, Radio, Flame, WifiOff, Cpu, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, RefreshCw, BarChart2, FileText, Zap } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DatasetExplorerPanel({
  currentSample = null,
  onInjectSample = null,
  loading = false,
  diagnosisResult = null,
}) {
  const [stats, setStats] = useState(null);
  const [samples, setSamples] = useState([]);
  const [selectedFault, setSelectedFault] = useState('Jamming');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(null);
  const [fetchingSamples, setFetchingSamples] = useState(false);

  // Fetch dataset stats
  useEffect(() => {
    fetch('/api/dataset/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load dataset stats:', err));
  }, []);

  // Fetch samples when selected fault changes
  useEffect(() => {
    setFetchingSamples(true);
    fetch(`/api/dataset/samples?fault_type=${encodeURIComponent(selectedFault)}&limit=6`)
      .then((res) => res.json())
      .then((data) => {
        setSamples(data.samples || []);
        if (data.samples && data.samples.length > 0) {
          setSelectedSampleIndex(data.samples[0].index);
        }
      })
      .catch((err) => console.error('Failed to load samples:', err))
      .finally(() => setFetchingSamples(false));
  }, [selectedFault]);

  const handleInject = (sampleIdx, faultType) => {
    if (onInjectSample) {
      onInjectSample(sampleIdx, faultType);
    }
  };

  const activeSample = currentSample || (samples.find((s) => s.index === selectedSampleIndex) || samples[0]);

  // Format sparkline data for recharts
  const getChartData = (sparkline) => {
    if (!sparkline || !Array.isArray(sparkline)) return [];
    return sparkline.map((val, i) => ({ time: `T${i + 1}`, value: val }));
  };

  return (
    <div className="dataset-explorer" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Real Dataset Connected Status */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #38BDF8' }}>
              <Database size={20} color="#38BDF8" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.04em' }}>
                REAL 5G TELECOTS DATASET HUB
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>
                telecomts_subset.jsonl • kb_cache.json • rca_model.joblib
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#6EE7B7', padding: '0.3rem 0.65rem', borderRadius: '4px', fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              2,000 REAL SAMPLES CONNECTED
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38BDF8', color: '#7DD3FC', padding: '0.3rem 0.65rem', borderRadius: '4px', fontFamily: 'JetBrains Mono' }}>
              275 EMBEDDED INCIDENTS
            </span>
          </div>
        </div>

        {/* Dataset Stats Row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>TOTAL TELEMETRY SAMPLES</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'JetBrains Mono', marginTop: 2 }}>{stats.total_samples?.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>HELD-OUT EVALUATION TEST SET</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38BDF8', fontFamily: 'JetBrains Mono', marginTop: 2 }}>{stats.eval_test_samples?.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>QUALCOMM EMBEDDINGS MEMORY</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#A78BFA', fontFamily: 'JetBrains Mono', marginTop: 2 }}>{stats.incident_memory_kb} Vectors</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>RCA MODEL ACCELERATION</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34D399', fontFamily: 'JetBrains Mono', marginTop: 2 }}>Cloud AI 100 Ultra</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Dataset Sample Browser & Live 5G Telemetry Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr', gap: '1.25rem' }}>
        {/* Left: Real Sample Selector & Catalog */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={15} color="#38BDF8" /> Real 5G TelecomTS Anomaly Selector
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>
              Select & Inject
            </span>
          </div>

          {/* Fault Category Filters */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              { id: 'Jamming', label: '📻 Jamming', color: '#EAB308' },
              { id: 'Antenna Failure', label: '📡 Antenna Failure', color: '#06B6D4' },
              { id: 'High Network Congestion (Sudden Spike)', label: '⚡ Congestion Spike', color: '#EF4444' },
              { id: 'Co-Channel Interference (Severe)', label: '📶 Interference', color: '#F97316' },
              { id: 'Faulty Handover Algorithm (Too Frequent)', label: '🔄 Handover Bug', color: '#A855F7' },
              { id: 'Doppler Shift (Severe)', label: '🚗 Doppler Shift', color: '#EC4899' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFault(f.id)}
                style={{
                  background: selectedFault === f.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${selectedFault === f.id ? '#38BDF8' : 'rgba(255,255,255,0.08)'}`,
                  color: selectedFault === f.id ? '#38BDF8' : '#94A3B8',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '5px',
                  fontSize: '0.72rem',
                  fontFamily: 'JetBrains Mono',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sample Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {fetchingSamples ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
                Loading real samples from telecomts_subset.jsonl...
              </div>
            ) : samples.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
                No samples matching category.
              </div>
            ) : (
              samples.map((s) => {
                const isSelected = selectedSampleIndex === s.index;
                return (
                  <div
                    key={s.index}
                    onClick={() => setSelectedSampleIndex(s.index)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${isSelected ? '#38BDF8' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '6px',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'JetBrains Mono' }}>
                        Sample #{s.index} • {s.fault_type}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInject(s.index, s.fault_type);
                        }}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(14, 165, 233, 0.5))',
                          border: '1px solid #38BDF8',
                          color: '#FFFFFF',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontFamily: 'JetBrains Mono',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Zap size={11} color="#38BDF8" /> Inject to Twin
                      </button>
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', marginBottom: '0.4rem', lineHeight: '1.3' }}>
                      Affected KPIs: <span style={{ color: '#E2E8F0' }}>{s.affected_kpis?.slice(0, 4).join(', ') || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.68rem', fontFamily: 'JetBrains Mono', color: '#64748B' }}>
                      <span>DL_BLER: <strong style={{ color: '#F8FAFC' }}>{s.clean_kpis?.DL_BLER?.mean !== undefined ? `${(s.clean_kpis.DL_BLER.mean * 100).toFixed(1)}%` : '0%'}</strong></span>
                      <span>RSRP: <strong style={{ color: '#F8FAFC' }}>{s.clean_kpis?.RSRP?.mean !== undefined ? `${s.clean_kpis.RSRP.mean} dBm` : '-73 dBm'}</strong></span>
                      <span>PRB Util: <strong style={{ color: '#F8FAFC' }}>{s.clean_kpis?.PRB_Utilization_DL?.mean !== undefined ? `${(s.clean_kpis.PRB_Utilization_DL.mean * 100).toFixed(0)}%` : '42%'}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Real 5G Telemetry & NOC Engineer Troubleshooting Ticket */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart2 size={16} color="#10B981" /> Live 5G KPI Telemetry & NOC Ticket
            </span>
            {diagnosisResult?.qualcomm_latency_s && (
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                ⚡ Qualcomm AI: {diagnosisResult.qualcomm_latency_s}s
              </span>
            )}
          </div>

          {activeSample ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Real KPI Metrics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>DL_BLER (Loss)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#EF4444', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
                    {activeSample.clean_kpis?.DL_BLER?.mean !== undefined ? `${(activeSample.clean_kpis.DL_BLER.mean * 100).toFixed(1)}%` : '0.0%'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>Max: {activeSample.clean_kpis?.DL_BLER?.max !== undefined ? `${(activeSample.clean_kpis.DL_BLER.max * 100).toFixed(0)}%` : '0%'}</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>RSRP (Power)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38BDF8', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
                    {activeSample.clean_kpis?.RSRP?.mean !== undefined ? `${activeSample.clean_kpis.RSRP.mean} dBm` : '-73 dBm'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>Min: {activeSample.clean_kpis?.RSRP?.min || '-75'} dBm</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>UL_SNR (Signal/Noise)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10B981', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
                    {activeSample.clean_kpis?.UL_SNR?.mean !== undefined ? `${activeSample.clean_kpis.UL_SNR.mean} dB` : '24 dB'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>Max: {activeSample.clean_kpis?.UL_SNR?.max || '28'} dB</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>PRB UTILIZATION</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F59E0B', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
                    {activeSample.clean_kpis?.PRB_Utilization_DL?.mean !== undefined ? `${(activeSample.clean_kpis.PRB_Utilization_DL.mean * 100).toFixed(0)}%` : '42%'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>Queue Depth</div>
                </div>
              </div>

              {/* Real 5G Sparkline Charts */}
              {activeSample.clean_kpis?.DL_BLER?.sparkline && (
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>DL_BLER Block Error Waveform (128-point Sampling Window)</span>
                    <span style={{ color: '#EF4444' }}>Radio Layer Anomaly</span>
                  </div>
                  <div style={{ width: '100%', height: 110 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getChartData(activeSample.clean_kpis.DL_BLER.sparkline)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 9, fill: '#64748B' }} />
                        <YAxis stroke="#64748B" tick={{ fontSize: 9, fill: '#64748B' }} />
                        <Tooltip contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '4px', fontSize: '0.7rem' }} />
                        <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} dot={{ r: 2, fill: '#EF4444' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Real Telecom NOC Troubleshooting Ticket */}
              {activeSample.troubleshooting_tickets && (
                <div style={{ background: 'rgba(15, 23, 42, 0.75)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginBottom: '0.4rem', fontFamily: 'JetBrains Mono' }}>
                    <FileText size={14} color="#38BDF8" /> TelecomTS Expert NOC Troubleshooting Ticket
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#E2E8F0', lineHeight: '1.5', fontFamily: 'Inter, sans-serif', maxHeight: '110px', overflowY: 'auto' }}>
                    {activeSample.troubleshooting_tickets.replace(/\*\*/g, '')}
                  </div>
                </div>
              )}

              {/* Action Button: Trigger Qualcomm AI 100 on This Sample */}
              <button
                className="btn btn-primary"
                onClick={() => handleInject(activeSample.index, activeSample.fault_type)}
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', fontSize: '0.85rem' }}
              >
                <Cpu size={16} />
                <span>
                  {loading ? 'Diagnosing via Qualcomm Cloud AI 100 Ultra...' : `Run Qualcomm Diagnosis on Sample #${activeSample.index || 0} (${activeSample.fault_type})`}
                </span>
              </button>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>
              Select a sample to inspect real telemetry and NOC tickets.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
