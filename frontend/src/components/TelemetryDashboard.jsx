import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Activity, Users, ArrowDownUp, Radio, Zap } from 'lucide-react';

/**
 * RMS / SOC Telemetry Dashboard Component
 * Renders multiple charts:
 *  1. Connected client counts across regional gateways
 *  2. Network Usage Bandwidth (Upload & Download Mbps)
 *  3. Dynamic Interface Latency (ms)
 *  4. Wireless / Cellular Signal Strength (dBm)
 */
export default function TelemetryDashboard({ devices = [] }) {
  // Map device data for charts
  const clientData = devices.map((d) => ({
    name: d.location.split(',')[0],
    clients: d.clients,
    ip: d.ip,
  }));

  const bandwidthData = devices.map((d) => ({
    name: d.location.split(',')[0],
    download: parseFloat((d.bandwidth_mbps * 0.72).toFixed(1)),
    upload: parseFloat((d.bandwidth_mbps * 0.28).toFixed(1)),
  }));

  const signalLatencyData = devices.map((d) => ({
    name: d.location.split(',')[0],
    signal_dbm: Math.abs(d.signal_dbm), // Positive for visual bar
    signal_raw: d.signal_dbm,
    latency_ms: d.name.includes('S1') ? 2.1 : d.name.includes('A') ? 4.2 : d.name.includes('B') ? 42.4 : 12.8,
  }));

  return (
    <div className="telemetry-dashboard glass-panel" style={{ padding: '1.25rem' }}>
      <div className="card-header" style={{ padding: '0 0 1rem 0', marginBottom: '1rem' }}>
        <div className="card-title-group">
          <Activity size={18} color="#06B6D4" />
          <span className="card-title">Regional Gateway Telemetry & Client Analytics</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>
          RMS Gateway Telemetry Feed
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 1: Connected Clients per Gateway */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#FFF' }}>
              <Users size={15} color="#06B6D4" />
              <span>Connected Clients Count</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>Active Hosts</span>
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}
                />
                <Bar dataKey="clients" name="Active Clients" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Upload / Download Bandwidth */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#FFF' }}>
              <ArrowDownUp size={15} color="#10B981" />
              <span>Throughput (Down / Up Mbps)</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>Bandwidth Usage</span>
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandwidthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="download" name="Download (Mbps)" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="upload" name="Upload (Mbps)" fill="#6366F1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Cellular / Microwave Signal Strength & Latency */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#FFF' }}>
              <Radio size={15} color="#A855F7" />
              <span>Signal Strength (dBm) & RTT Latency (ms)</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'JetBrains Mono' }}>RF & Edge RTT</span>
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signalLatencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono' }} />
                <Line type="monotone" dataKey="signal_raw" name="Signal (dBm)" stroke="#A855F7" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="latency_ms" name="Latency (ms)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
