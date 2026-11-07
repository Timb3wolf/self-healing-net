import React, { useState } from 'react';
import { Globe, Radio, Wifi, Users, Server, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

/**
 * Global Device Distribution World Map Component (RMS / NOC Cybernetic Style)
 * Renders an SVG cyber world map projection with pulsating nodes for London, Frankfurt, NYC, Tokyo, and Singapore.
 */
export default function GlobalDeviceMap({ devices = [], onSelectDevice = null, selectedDeviceId = null }) {
  const [hoveredDev, setHoveredDev] = useState(null);

  // Convert lat/lng to SVG viewBox coordinates (1000 x 500 Mercator-like projection)
  const projectCoords = (lat, lng) => {
    // lng: -180 to 180 -> x: 0 to 1000
    const x = ((lng + 180) / 360) * 1000;
    // lat: -85 to 85 -> y: 500 to 0
    const y = ((85 - lat) / 170) * 500;
    return { x: Math.max(20, Math.min(980, x)), y: Math.max(20, Math.min(480, y)) };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OFFLINE':
      case 'CRITICAL':
        return '#EF4444';
      case 'DEGRADED':
      case 'WARNING':
        return '#D97706';
      default:
        return '#10B981';
    }
  };

  return (
    <div className="global-map-container" style={{ position: 'relative', width: '100%', height: '100%', minHeight: 380, overflow: 'hidden' }}>
      {/* Cyber Grid SVG Canvas */}
      <svg
        viewBox="0 0 1000 500"
        style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 45%, #0F1923 0%, #090D16 100%)' }}
      >
        <defs>
          {/* Cyber glowing filters */}
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Cyber Latitude / Longitude Matrix Grid */}
        {[100, 200, 300, 400].map((y) => (
          <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#1E293B" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.6" />
        ))}
        {[150, 300, 450, 600, 750, 900].map((x) => (
          <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.6" />
        ))}

        {/* Abstract Continent Silhouettes / Geospatial Cyber Polygons */}
        <g fill="#131F33" opacity="0.85" stroke="#1E2E4A" strokeWidth="1">
          {/* North America */}
          <path d="M 120 90 L 260 70 L 320 110 L 290 190 L 230 250 L 170 210 L 110 140 Z" />
          {/* South America */}
          <path d="M 240 270 L 320 280 L 340 370 L 270 450 L 220 370 Z" />
          {/* Europe */}
          <path d="M 450 90 L 550 80 L 570 140 L 510 190 L 440 160 Z" />
          {/* Africa */}
          <path d="M 460 200 L 570 210 L 580 320 L 520 420 L 470 320 Z" />
          {/* Asia */}
          <path d="M 580 80 L 820 90 L 880 180 L 820 270 L 680 250 L 600 170 Z" />
          {/* Australia */}
          <path d="M 770 330 L 890 320 L 880 410 L 780 410 Z" />
        </g>

        {/* Global Backbone Interconnect Lines */}
        {devices.length >= 2 && (
          <g stroke="#06B6D4" strokeWidth="1.2" opacity="0.4" strokeDasharray="3 3">
            {/* Connect London to Frankfurt, Frankfurt to NYC, London to NYC, Frankfurt to Singapore, etc */}
            {(() => {
              const lon = devices.find((d) => d.device_id.includes('LON'));
              const fra = devices.find((d) => d.device_id.includes('FRA'));
              const nyc = devices.find((d) => d.device_id.includes('NYC'));
              const tok = devices.find((d) => d.device_id.includes('TOK'));
              const sgp = devices.find((d) => d.device_id.includes('SGP'));

              const lines = [];
              if (lon && fra) lines.push({ from: lon, to: fra });
              if (fra && nyc) lines.push({ from: fra, to: nyc });
              if (fra && sgp) lines.push({ from: fra, to: sgp });
              if (sgp && tok) lines.push({ from: sgp, to: tok });
              if (tok && nyc) lines.push({ from: tok, to: nyc });

              return lines.map((link, idx) => {
                const p1 = projectCoords(link.from.lat, link.from.lng);
                const p2 = projectCoords(link.to.lat, link.to.lng);
                return (
                  <path
                    key={`backbone-${idx}`}
                    d={`M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2 - 30} ${p2.x} ${p2.y}`}
                    fill="none"
                  />
                );
              });
            })()}
          </g>
        )}

        {/* Regional Gateway Beacons / Pins */}
        {devices.map((dev) => {
          const { x, y } = projectCoords(dev.lat, dev.lng);
          const color = getStatusColor(dev.status);
          const isSelected = selectedDeviceId === dev.device_id;
          const isHovered = hoveredDev?.device_id === dev.device_id;

          return (
            <g
              key={dev.device_id}
              transform={`translate(${x}, ${y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredDev(dev)}
              onMouseLeave={() => setHoveredDev(null)}
              onClick={() => onSelectDevice && onSelectDevice(dev)}
            >
              {/* Pulse Radar Rings */}
              <circle r="16" fill="none" stroke={color} strokeWidth="1" opacity="0.3">
                <animate attributeName="r" values="8;24" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="2.4s" repeatCount="indefinite" />
              </circle>

              {/* Pin Center Glow */}
              <circle
                r={isSelected || isHovered ? "8" : "6"}
                fill={color}
                filter={dev.status === 'ONLINE' ? 'url(#glow-green)' : 'url(#glow-red)'}
              />
              <circle r="3" fill="#FFFFFF" />

              {/* City Name Label */}
              <text
                x="12"
                y="4"
                fill="#F8FAFC"
                fontSize="11"
                fontWeight="700"
                fontFamily="JetBrains Mono"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
              >
                {dev.location.split(',')[0]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Info Tooltip */}
      {hoveredDev && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(15, 25, 35, 0.95)',
            border: `1px solid ${getStatusColor(hoveredDev.status)}`,
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            fontSize: '0.78rem',
            fontFamily: 'JetBrains Mono',
            color: '#E2E8F0',
            maxWidth: 260,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontWeight: 700, color: '#FFF' }}>{hoveredDev.name}</span>
            <span
              style={{
                fontSize: '0.68rem',
                color: getStatusColor(hoveredDev.status),
                background: 'rgba(255,255,255,0.06)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {hoveredDev.status}
            </span>
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
            {hoveredDev.location} • IP {hoveredDev.ip}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={13} color="#06B6D4" />
              <span>{hoveredDev.clients} clients</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Radio size={13} color="#A855F7" />
              <span>{hoveredDev.signal_dbm} dBm</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Activity size={13} color="#10B981" />
              <span>{hoveredDev.bandwidth_mbps} Mbps</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={13} color="#F59E0B" />
              <span>{hoveredDev.uptime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.7rem',
          fontFamily: 'JetBrains Mono',
          color: '#94A3B8',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Online Gateway
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Severed / Failed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 14, height: 2, background: '#06B6D4', display: 'inline-block' }} /> Mesh Backbone
        </span>
      </div>
    </div>
  );
}
