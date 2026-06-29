import React, { useState, useEffect, useRef } from 'react';
import { Customer, TrafficPoint, Region } from '../types';
import { Activity, ArrowDown, ArrowUp, Zap, Clock, ShieldAlert, Wifi, Play, Pause, ChevronRight, BarChart2 } from 'lucide-react';
import NeonBox from './NeonBox';

interface RealTimeTrafficProps {
  customers: Customer[];
  regions: Region[];
  initialTraffic: TrafficPoint[];
}

export default function RealTimeTraffic({
  customers,
  regions,
  initialTraffic,
}: RealTimeTrafficProps) {
  const [trafficData, setTrafficData] = useState<TrafficPoint[]>(initialTraffic);
  const [isLive, setIsLive] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<string>('AGGREGATE'); // 'AGGREGATE' or customerId
  const [selectedScale, setSelectedScale] = useState<'normal' | 'spike'>('normal');
  const [sidebarSearch, setSidebarSearch] = useState('');

  const liveInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto real-time traffic updates
  useEffect(() => {
    if (isLive) {
      liveInterval.current = setInterval(() => {
        setTrafficData((current) => {
          const lastPoint = current[current.length - 1];
          const newTime = calculateNextTime(lastPoint.time);
          
          // Generate realistic bandwidth usage based on profile selection & spikes
          let download = 0;
          let upload = 0;
          let latency = 12 + Math.floor(Math.random() * 8);
          let loss = Math.random() < 0.1 ? Number((Math.random() * 0.3).toFixed(1)) : 0.0;

          const multiplyFactor = selectedScale === 'spike' ? 2.5 : 1.0;

          if (selectedProfile === 'AGGREGATE') {
            // High aggregate bandwidth
            download = Number((450 + Math.random() * 280).toFixed(1)) * multiplyFactor;
            upload = Number((120 + Math.random() * 95).toFixed(1)) * multiplyFactor;
          } else {
            // Individual subscriber package limits
            const cust = customers.find(c => c.id === selectedProfile);
            const maxSpeed = cust ? parseInt(cust.packageSpeed) : 100;
            const utilization = cust?.status === 'gangguan' ? 0.15 : 0.4 + Math.random() * 0.4;
            
            download = Number((maxSpeed * utilization).toFixed(1)) * multiplyFactor;
            upload = Number((download * 0.35).toFixed(1));

            if (cust?.status === 'gangguan') {
              latency = 120 + Math.floor(Math.random() * 80); // Bad latency for bad signals
              loss = Number((2.5 + Math.random() * 10).toFixed(1)); // Packet drop
            }
          }

          const newPoint: TrafficPoint = {
            time: newTime,
            download: Math.min(download, 1500), // Cap max spikes
            upload: Math.min(upload, 500),
            latency,
            loss,
          };

          const sliced = current.slice(1); // maintain 12 points
          return [...sliced, newPoint];
        });
      }, 2500);
    } else {
      if (liveInterval.current) clearInterval(liveInterval.current);
    }

    return () => {
      if (liveInterval.current) clearInterval(liveInterval.current);
    };
  }, [isLive, selectedProfile, selectedScale, customers]);

  const calculateNextTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    let nextM = m + 5;
    let nextH = h;
    if (nextM >= 60) {
      nextM = 0;
      nextH = (h + 1) % 24;
    }
    return `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
  };

  const handleSimulateSpike = () => {
    setSelectedScale('spike');
    setTimeout(() => setSelectedScale('normal'), 10000); // return to normal in 10s
  };

  // SVG Chart Calculation Helpers
  const padding = 40;
  const chartHeight = 220;
  const chartWidth = 720;
  
  const getCoordinates = (points: TrafficPoint[], type: 'download' | 'upload') => {
    const maxVal = Math.max(...points.map(p => Math.max(p.download, p.upload)), 100);
    const stepX = (chartWidth - padding * 2) / (points.length - 1);
    
    return points.map((p, index) => {
      const x = padding + index * stepX;
      const val = type === 'download' ? p.download : p.upload;
      const y = chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);
      return { x, y, val, time: p.time };
    });
  };

  const dlPoints = getCoordinates(trafficData, 'download');
  const ulPoints = getCoordinates(trafficData, 'upload');

  const createSVGPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    return coords.reduce((acc, c, i) => i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`, '');
  };

  const createSVGAreaPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    const first = coords[0];
    const last = coords[coords.length - 1];
    const baseLineY = chartHeight - padding;
    return `${createSVGPath(coords)} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;
  };

  // Get active subscriber info
  const activeSubsInfo = selectedProfile === 'AGGREGATE' 
    ? { name: 'Seluruh Wilayah (Megerged)', speed: 'Total Gpon Trunk' }
    : { 
        name: customers.find(c => c.id === selectedProfile)?.name || 'N/A',
        speed: `${customers.find(c => c.id === selectedProfile)?.packageSpeed} Package`
      };

  const latestDl = trafficData[trafficData.length - 1].download;
  const latestUl = trafficData[trafficData.length - 1].upload;
  const latestLat = trafficData[trafficData.length - 1].latency;
  const latestLoss = trafficData[trafficData.length - 1].loss;

  return (
    <div className="space-y-6">
      {/* Real-time stats ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Download meter */}
        <NeonBox variant="cyan" title="LIVE DOWNLOAD SWEEP" subtitle="Real-time RX Throughput" className="p-4">
          <div className="flex justify-between items-center mt-1">
            <div>
              <p className="text-2xl md:text-3xl font-orbitron font-black text-cyan-400 neon-glow-cyan">
                {latestDl.toFixed(1)} <span className="text-xs uppercase font-mono font-normal">Mbps</span>
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                <ArrowDown className="w-3 h-3 text-cyan-400" /> Peak Download: {Math.max(...trafficData.map(p => p.download)).toFixed(1)} Mbps
              </p>
            </div>
            <Activity className="w-8 h-8 text-cyan-500 opacity-75 animate-pulse" />
          </div>
        </NeonBox>

        {/* Upload meter */}
        <NeonBox variant="fuchsia" title="LIVE UPLOAD SWEEP" subtitle="Real-time TX Throughput" className="p-4">
          <div className="flex justify-between items-center mt-1">
            <div>
              <p className="text-2xl md:text-3xl font-orbitron font-black text-fuchsia-400">
                {latestUl.toFixed(1)} <span className="text-xs uppercase font-mono font-normal">Mbps</span>
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-fuchsia-400" /> Peak Upload: {Math.max(...trafficData.map(p => p.upload)).toFixed(1)} Mbps
              </p>
            </div>
            <BarChart2 className="w-8 h-8 text-fuchsia-500 opacity-75" />
          </div>
        </NeonBox>

        {/* Ping latency */}
        <NeonBox variant={latestLat > 50 ? 'red' : 'emerald'} title="DONGLE PING RTT" subtitle="Sub-millisecond delay" className="p-4">
          <div className="flex justify-between items-center mt-1">
            <div>
              <p className={`text-2xl md:text-3xl font-orbitron font-black text-slate-100 ${latestLat > 50 ? 'text-red-400 neon-glow-red animate-pulse' : 'text-emerald-400 neon-glow-emerald'}`}>
                {latestLat} <span className="text-xs uppercase font-mono font-normal">ms</span>
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                Jitter: ±{latestLat > 50 ? '14' : '2'}ms • Fiber Normal
              </p>
            </div>
            <Zap className={`w-8 h-8 ${latestLat > 50 ? 'text-red-400' : 'text-emerald-500'}`} />
          </div>
        </NeonBox>

        {/* Packet Loss */}
        <NeonBox variant={latestLoss > 0.5 ? 'red' : 'cyan'} title="FRAME LOSS RATIO" subtitle="Disrupted TCP frames" className="p-4">
          <div className="flex justify-between items-center mt-1">
            <div>
              <p className={`text-2xl md:text-3xl font-orbitron font-black ${latestLoss > 0.5 ? 'text-red-400 neon-glow-red' : 'text-cyan-400 neon-glow-cyan'}`}>
                {latestLoss}%
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                {latestLoss > 0 ? "Loss terdeteksi! Cek redaman" : "Sempurna (0% Packet-loss)"}
              </p>
            </div>
            <ShieldAlert className={`w-8 h-8 ${latestLoss > 0.5 ? 'text-red-400' : 'text-cyan-500 opacity-60'}`} />
          </div>
        </NeonBox>
      </div>

      {/* Main Analyzer with Live SVG rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left selector col: Channels */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest text-cyan-400 neon-glow-cyan">
            PILIH JALUR KANAL DATA
          </h3>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 space-y-1 max-h-[380px] overflow-y-auto">
            {/* Trunk aggregate */}
            <button
              onClick={() => setSelectedProfile('AGGREGATE')}
              className={`w-full text-left p-2.5 font-mono text-xs flex justify-between items-center transition-all cursor-pointer ${
                selectedProfile === 'AGGREGATE'
                  ? 'bg-cyan-950/70 border-l-4 border-cyan-400 text-cyan-300'
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">Aggregate Trunk (Semua)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Individual subscribers */}
            <div className="border-t border-slate-900 my-1 pt-1">
              <div className="px-2 mb-2">
                <span className="block text-[9px] font-mono text-slate-500 uppercase mb-1 font-bold">
                  CARI PELANGGAN:
                </span>
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Cari ID / nama..."
                  className="w-full bg-slate-950/90 border border-slate-800 focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-700 px-2 py-1 text-[10px] font-mono transition-colors"
                />
              </div>

              <span className="block text-[9px] font-mono text-slate-500 px-2 uppercase mb-1.5 font-bold">
                PROFIL PELANGGAN AISYAKA.NET:
              </span>
              {(() => {
                const query = sidebarSearch.toLowerCase();
                const filtered = customers.filter(c => 
                  !query || c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query)
                );
                const sliced = filtered.slice(0, 15);
                const selectedCust = selectedProfile !== 'AGGREGATE' ? customers.find(c => c.id === selectedProfile) : null;
                
                // Ensure currently selected subscriber is always visible even if sliced
                if (selectedCust && !sliced.some(s => s.id === selectedCust.id)) {
                  if (!query || selectedCust.name.toLowerCase().includes(query) || selectedCust.id.toLowerCase().includes(query)) {
                    sliced.push(selectedCust);
                  }
                }

                if (sliced.length === 0) {
                  return <div className="text-[10px] text-slate-600 px-2 py-1 font-mono">Tidak ditemukan</div>;
                }

                return sliced.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedProfile(c.id)}
                    className={`w-full text-left p-2 font-mono text-[11px] flex justify-between items-center transition-all cursor-pointer ${
                      selectedProfile === c.id
                        ? 'bg-cyan-950/60 border-l-2 border-cyan-400 text-cyan-300'
                        : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className="font-semibold block truncate">{c.name}</span>
                      <span className="text-[9px] text-slate-500">{c.region} • {c.packageSpeed}</span>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'online' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : c.status === 'gangguan' ? 'bg-amber-500 animate-ping' : 'bg-red-500'}`} />
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Right chart col: Live Graph */}
        <div className="lg:col-span-3 space-y-4">
          <NeonBox variant="cyan" title={`ANALISIS LALU LINTAS DATA: ${activeSubsInfo.name}`} subtitle={`${activeSubsInfo.speed} Monitor Pipeline`}>
            {/* Live toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Sweep Interval: <strong>2500ms</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
                  {isLive ? 'LIVE CAPTURING ON' : 'PAUSED'}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLive(!isLive)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded text-[11px] flex items-center gap-1 text-slate-200 cursor-pointer"
                >
                  {isLive ? (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Resume
                    </>
                  )}
                </button>
                <button
                  onClick={handleSimulateSpike}
                  disabled={selectedScale === 'spike'}
                  className="px-2.5 py-1 bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-500/30 hover:border-cyan-400 rounded text-[11px] flex items-center gap-1 text-cyan-400 hover:text-white transition-all cursor-pointer disabled:opacity-40"
                >
                  <Zap className="w-3 h-3" /> {selectedScale === 'spike' ? 'TRAFFIC SPIKED!' : 'Simulasikan Trafik Tinggi'}
                </button>
              </div>
            </div>

            {/* Custom SVG Graph Container */}
            <div className="relative w-full bg-slate-950/90 border border-slate-900 p-2 overflow-hidden rounded">
              {/* Grid backgrounds */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_30px] pointer-events-none" />

              {/* Actual Responsive SVG */}
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                {/* Embedded gradients */}
                <defs>
                  <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d946ef" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#d946ef" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Draw X & Y Guide Axes */}
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {/* Y Axis Grid lines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                  const y = padding + (1 - ratio) * (chartHeight - padding * 2);
                  return (
                    <g key={i}>
                      <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(6,182,212,0.05)" strokeDasharray="4 4" />
                    </g>
                  );
                })}

                {/* Fill Area Shading first */}
                <path d={createSVGAreaPath(dlPoints)} fill="url(#dlGrad)" />
                <path d={createSVGAreaPath(ulPoints)} fill="url(#ulGrad)" />

                {/* Core Stroke Lines */}
                <path d={createSVGPath(dlPoints)} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={createSVGPath(ulPoints)} fill="none" stroke="#d946ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data Points */}
                {dlPoints.map((pt, i) => (
                  <circle
                    key={`dl-dot-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#020617"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    className="hover:r-5 transition-all duration-150 cursor-pointer"
                  >
                    <title>{`DL: ${pt.val.toFixed(1)} Mbps clock ${pt.time}`}</title>
                  </circle>
                ))}
                
                {ulPoints.map((pt, i) => (
                  <circle
                    key={`ul-dot-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="2.5"
                    fill="#020617"
                    stroke="#d946ef"
                    strokeWidth="1.5"
                  >
                    <title>{`UL: ${pt.val.toFixed(1)} Mbps clock ${pt.time}`}</title>
                  </circle>
                ))}

                {/* Time stamps text label on X-Axis */}
                {trafficData.map((pt, i) => {
                  const stepX = (chartWidth - padding * 2) / (trafficData.length - 1);
                  const x = padding + i * stepX;
                  return (
                    <text
                      key={`lbl-${i}`}
                      x={x}
                      y={chartHeight - 15}
                      fill="rgba(255,255,255,0.4)"
                      fontFamily="monospace"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {pt.time}
                    </text>
                  );
                })}
              </svg>

              {/* Chart Legend indicators overlays */}
              <div className="absolute top-4 right-4 flex items-center gap-4 bg-slate-950/80 px-2 py-1 rounded border border-white/5 font-mono text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-cyan-400 inline-block" />
                  <span className="text-slate-300">DOWNLOAD (RX)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-fuchsia-400 inline-block" />
                  <span className="text-slate-300">UPLOAD (TX)</span>
                </div>
              </div>
            </div>

            {/* Bottom help instructions */}
            <p className="text-[10px] font-mono text-slate-500 text-center mt-2">
              Sistem memantau paket data melalui OLT Port Mirroring. Riwayat diplot dalam diagram area interpolasi linear.
            </p>
          </NeonBox>
        </div>
      </div>
    </div>
  );
}
