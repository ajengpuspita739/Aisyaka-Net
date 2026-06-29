import React, { useState, useEffect, useRef } from 'react';
import { Customer, Region } from '../types';
import { 
  Gauge, Play, Square, RefreshCw, ArrowDown, ArrowUp, Wifi, Clock, 
  CheckCircle, AlertTriangle, Sparkles, Server, Search, User, Globe, Activity,
  Zap, Cpu, ShieldCheck, Database, Sliders, ChevronDown
} from 'lucide-react';
import NeonBox from './NeonBox';

interface SpeedtestMenuProps {
  customers: Customer[];
  regions: Region[];
}

interface SpeedtestResult {
  id: string;
  customerId: string;
  customerName: string;
  ipAddress: string;
  packageSpeed: string;
  maxSpeedMbps: number;
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  loss: number;
  status: 'SLA OK' | 'SLA Low' | 'OFFLINE';
  timestamp: string;
}

export default function SpeedtestMenu({ customers, regions }: SpeedtestMenuProps) {
  const [activeCategory, setActiveCategory] = useState<'broadband' | 'dedicated'>('broadband');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customIp, setCustomIp] = useState<string>('');
  const [testServer, setTestServer] = useState<string>('Aisyaka-BKS-Main');
  const [isBurstMode, setIsBurstMode] = useState<boolean>(false); // default off for normal packages, on if manually triggered
  
  // Speedtest states
  const [testPhase, setTestPhase] = useState<'idle' | 'pinging' | 'download' | 'upload' | 'completed' | 'failed'>('idle');
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [pingVal, setPingVal] = useState<number>(0);
  const [jitterVal, setJitterVal] = useState<number>(0);
  const [lossVal, setLossVal] = useState<number>(0);
  const [finalDownload, setFinalDownload] = useState<number>(0);
  const [finalUpload, setFinalUpload] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Reset fields on category switch
  useEffect(() => {
    setSelectedCustomerId('');
    setCustomIp('');
    setTestPhase('idle');
    setCurrentSpeed(0);
    setProgress(0);
    setPingVal(0);
    setJitterVal(0);
    setLossVal(0);
    setFinalDownload(0);
    setFinalUpload(0);
    setLogMessages([]);
    setIsBurstMode(false);
    setSearchQuery('');
  }, [activeCategory]);

  // Historical results with Ookla 1Gbps 1:1 and standard broadband
  const [history, setHistory] = useState<SpeedtestResult[]>([
    {
      id: 'ST-901',
      customerId: 'CUST-001',
      customerName: 'Budi Santoso',
      ipAddress: '10.120.45.12',
      packageSpeed: '100 Mbps',
      maxSpeedMbps: 100,
      download: 98.4,
      upload: 96.2,
      ping: 8,
      jitter: 1.5,
      loss: 0,
      status: 'SLA OK',
      timestamp: 'Baru Saja'
    },
    {
      id: 'ST-842',
      customerId: 'CUST-300',
      customerName: 'PT. Sukses Mandiri',
      ipAddress: '10.130.12.44',
      packageSpeed: '500 Mbps Dedicated',
      maxSpeedMbps: 500,
      download: 498.7,
      upload: 497.9,
      ping: 2,
      jitter: 0.1,
      loss: 0,
      status: 'SLA OK',
      timestamp: '25 Juni 2026 21:02'
    },
    {
      id: 'ST-713',
      customerId: 'CUST-004',
      customerName: 'Dewi Lestari',
      ipAddress: '10.110.12.98',
      packageSpeed: '150 Mbps',
      maxSpeedMbps: 150,
      download: 146.2,
      upload: 142.1,
      ping: 11,
      jitter: 2.1,
      loss: 0,
      status: 'SLA OK',
      timestamp: '25 Juni 2026 19:40'
    },
    {
      id: 'ST-605',
      customerId: 'CUST-450',
      customerName: 'Universitas Indonesia',
      ipAddress: '103.150.11.20',
      packageSpeed: '1 Gbps Dedicated',
      maxSpeedMbps: 1000,
      download: 994.5,
      upload: 992.8,
      ping: 1,
      jitter: 0.1,
      loss: 0,
      status: 'SLA OK',
      timestamp: '25 Juni 2026 15:15'
    }
  ]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fill details when customer selection changes
  useEffect(() => {
    if (selectedCustomerId) {
      const selected = customers.find(c => c.id === selectedCustomerId);
      if (selected) {
        setCustomIp(selected.ipAddress);
      }
    } else {
      setCustomIp('');
    }
  }, [selectedCustomerId, customers]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const speedProfile = selectedCustomer?.packageSpeed || '100 Mbps';

  // Parse package speed from string (e.g. "100 Mbps Dedicated" -> 100, "1 Gbps Dedicated" -> 1000)
  const parseSpeedStr = (speedStr: string): number => {
    const match = speedStr.match(/(\d+)\s*(Gbps|Mbps)/i);
    if (!match) return 100;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'gbps') return value * 1000;
    return value;
  };

  const baseSpeed = selectedCustomer ? parseSpeedStr(selectedCustomer.packageSpeed) : 100;
  const maxBandwidth = isBurstMode ? 1000 : baseSpeed;

  // Dynamic dial max limit based on maximum bandwidth of test
  const getDialMax = (maxBw: number) => {
    if (maxBw <= 100) return 100;
    if (maxBw <= 300) return 300;
    if (maxBw <= 500) return 500;
    return 1000;
  };

  const dialMax = getDialMax(maxBandwidth);

  // Stop running test
  const handleStopTest = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTestPhase('idle');
    setCurrentSpeed(0);
    setProgress(0);
    setLogMessages(prev => [...prev, '[STOPPED] Speedtest dihentikan manual oleh teknisi.']);
  };

  // Run speed test simulation with realistic physics
  const handleStartTest = () => {
    if (!selectedCustomerId && !customIp) return;
    
    // Reset states
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTestPhase('pinging');
    setProgress(0);
    setCurrentSpeed(0);
    setPingVal(0);
    setJitterVal(0);
    setLossVal(0);
    setFinalDownload(0);
    setFinalUpload(0);

    const targetCustomerName = selectedCustomer ? selectedCustomer.name : 'IP Manual';
    const targetIp = customIp || (selectedCustomer ? selectedCustomer.ipAddress : '127.0.0.1');
    const targetStatus = selectedCustomer ? selectedCustomer.status : 'online';
    
    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`);
      setLogMessages([...logs]);
    };

    if (activeCategory === 'dedicated') {
      addLog(`Menginisiasi Handshake Dedicated Internet 1:1 SLA...`);
      addLog(`IP Target: ${targetIp} (${targetCustomerName})`);
      addLog(`Sirkuit: Dedicated Fiber Optic (Metro-E / GPON Trunk)`);
      addLog(`Profil Paket: ${speedProfile} (Symmetric Symmetrical 1:1)`);
      if (isBurstMode) {
        addLog(`[DIAGNOSTIC] Mengaktifkan Mode Burst Dedicated 1Gbps (Uncapped Bypass)`);
      }
      addLog(`Menghubungkan ke Core Router: [${testServer}]`);
    } else {
      addLog(`Menginisiasi Handshake Broadband FTTH (Shared Network)...`);
      addLog(`IP Target: ${targetIp} (${targetCustomerName})`);
      addLog(`Sirkuit: Shared GPON Fiber (Best Effort Broadband)`);
      addLog(`Profil Paket: Broadband ${speedProfile}`);
      if (isBurstMode) {
        addLog(`[DIAGNOSTIC] Mengaktifkan Mode Burst Gpon 1Gbps (Bypass Shaper)`);
      }
      addLog(`Menghubungkan ke Edge Node: [${testServer}]`);
    }

    if (targetStatus === 'offline') {
      addLog(`ERR: Koneksi gagal. Host ${targetIp} tidak merespon ICMP ping.`);
      setTestPhase('failed');
      return;
    }

    let currentProgress = 0;
    let step = 0; // 0 = Latency, 1 = Download, 2 = Upload, 3 = Completed
    let localPing = 0;
    let localJitter = 0;
    let localLoss = 0;
    let finalDlVal = 0;
    let finalUlVal = 0;

    // Simulation loop running every 120ms
    intervalRef.current = setInterval(() => {
      currentProgress += 1;
      setProgress(Math.min(currentProgress, 100));

      if (step === 0) {
        // Ping phase (progress 0 to 15)
        if (currentProgress === 2) {
          addLog(activeCategory === 'dedicated' ? 'Menguji latency sirkuit Metro-E dedicated...' : 'Mencari server broadband terdekat...');
        }
        if (currentProgress === 8) {
          if (activeCategory === 'dedicated') {
            // Dedicated has ultra-low ping and zero jitter/loss
            localPing = isBurstMode ? Math.floor(1 + Math.random() * 2) : Math.floor(1 + Math.random() * 3);
            localJitter = parseFloat((0.1 + Math.random() * 0.4).toFixed(2));
            localLoss = 0;
          } else {
            // Broadband has typical GPON ping, small jitter, 0-0.1% loss
            localPing = isBurstMode ? Math.floor(3 + Math.random() * 4) : Math.floor(8 + Math.random() * 10);
            localJitter = parseFloat((1.2 + Math.random() * 2.5).toFixed(2));
            localLoss = Math.random() < 0.1 ? 0.1 : 0;
          }
          setPingVal(localPing);
          setJitterVal(localJitter);
          setLossVal(localLoss);
          addLog(`Server Terhubung! Ping: ${localPing} ms, Jitter: ${localJitter} ms, Packet Loss: ${localLoss}%`);
        }
        if (currentProgress >= 15) {
          step = 1;
          setTestPhase('download');
          addLog('Memulai Tes Download Bandwidth...');
          addLog(activeCategory === 'dedicated' ? 'Mengunduh stream data payload dedicated (guaranteed)...' : 'Mengunduh paket data stream multi-connection (shared)...');
        }
      } else if (step === 1) {
        // Download phase (progress 15 to 55)
        const startProg = 15;
        const endProg = 55;
        const subProgress = (currentProgress - startProg) / (endProg - startProg); // 0 to 1

        let targetSpeed = 0;
        if (subProgress < 0.4) {
          // Accelerating phase
          targetSpeed = maxBandwidth * Math.pow(subProgress / 0.4, 2) * 0.93;
        } else {
          // Stabilization phase (Broadband has slightly more fluctuation than Dedicated)
          const fluctuationRange = activeCategory === 'dedicated' ? 2 : 6;
          const fluctuation = Math.sin(currentProgress * 0.8) * fluctuationRange + (Math.random() * 2 - 1);
          // Dedicated runs closer to 99.5% of max bandwidth, Broadband runs closer to 95-97% of max bandwidth
          const ratio = activeCategory === 'dedicated' ? 0.99 : 0.96;
          const baseSpeed = maxBandwidth * (ratio + fluctuation / 1000);
          targetSpeed = baseSpeed;
        }

        // Clamp to avoid unrealistic spikes
        targetSpeed = Math.min(targetSpeed, maxBandwidth * 0.998);
        setCurrentSpeed(parseFloat(targetSpeed.toFixed(1)));

        if (currentProgress === 35) {
          addLog(`Download Stream Stabil. Kecepatan saat ini: ${targetSpeed.toFixed(1)} Mbps`);
        }

        if (currentProgress >= 55) {
          // Dedicated has extremely precise throughput (98.5% - 99.8% of SLA)
          // Broadband has best effort throughput (95% - 98.2% of package speed)
          const minRatio = activeCategory === 'dedicated' ? 0.985 : 0.95;
          const maxRatio = activeCategory === 'dedicated' ? 0.998 : 0.982;
          const finalDl = parseFloat((maxBandwidth * (minRatio + Math.random() * (maxRatio - minRatio))).toFixed(1));
          finalDlVal = finalDl;
          setFinalDownload(finalDl);
          setCurrentSpeed(0);
          step = 2;
          setTestPhase('upload');
          addLog(`Hasil Uji Download: ${finalDl} Mbps`);
          addLog('Memulai Tes Upload Bandwidth...');
          addLog(activeCategory === 'dedicated' ? 'Mengunggah stream data payload dedicated...' : 'Mengunggah paket data payload ke server (shared)...');
        }
      } else if (step === 2) {
        // Upload phase (progress 55 to 92)
        const startProg = 55;
        const endProg = 92;
        const subProgress = (currentProgress - startProg) / (endProg - startProg); // 0 to 1

        let targetSpeed = 0;
        if (subProgress < 0.4) {
          targetSpeed = maxBandwidth * Math.pow(subProgress / 0.4, 2) * 0.92;
        } else {
          const fluctuationRange = activeCategory === 'dedicated' ? 2.5 : 8;
          const fluctuation = Math.cos(currentProgress * 0.7) * fluctuationRange + (Math.random() * 3 - 1.5);
          // Dedicated is strictly 1:1 symmetrical, Broadband is typically 1:1 or slightly lower on upload
          const ratio = activeCategory === 'dedicated' ? 0.985 : 0.92;
          const baseSpeed = maxBandwidth * (ratio + fluctuation / 1000);
          targetSpeed = baseSpeed;
        }

        targetSpeed = Math.min(targetSpeed, maxBandwidth * 0.995);
        setCurrentSpeed(parseFloat(targetSpeed.toFixed(1)));

        if (currentProgress === 75) {
          addLog(`Upload Stream Stabil. Kecepatan saat ini: ${targetSpeed.toFixed(1)} Mbps`);
        }

        if (currentProgress >= 92) {
          // Dedicated is 1:1 symmetrical (98% - 99.6% of DL)
          // Broadband has normal FTTH upload (e.g. 88% - 96% of download)
          const minRatio = activeCategory === 'dedicated' ? 0.98 : 0.88;
          const maxRatio = activeCategory === 'dedicated' ? 0.996 : 0.96;
          const finalUl = parseFloat((maxBandwidth * (minRatio + Math.random() * (maxRatio - minRatio))).toFixed(1));
          finalUlVal = finalUl;
          setFinalUpload(finalUl);
          setCurrentSpeed(0);
          step = 3;
          addLog(`Hasil Uji Upload: ${finalUl} Mbps`);
          addLog('Menganalisis performa SLA & stabilitas jaringan...');
        }
      } else if (step === 3 && currentProgress >= 100) {
        // Complete test
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setTestPhase('completed');
        
        if (activeCategory === 'dedicated') {
          addLog('Speedtest selesai! Jalur Dedicated 1:1 lulus uji SLA premium (SLA 99.9% Terverifikasi).');
        } else {
          addLog('Speedtest selesai! Koneksi Broadband FTTH beroperasi normal dalam batas toleransi Best-Effort.');
        }

        const isLowSla = activeCategory === 'dedicated' 
          ? (finalDlVal / maxBandwidth < 0.97) 
          : (finalDlVal / maxBandwidth < 0.85);

        const newResult: SpeedtestResult = {
          id: `ST-${Math.floor(900 + Math.random() * 99)}`,
          customerId: selectedCustomerId || 'MANUAL',
          customerName: targetCustomerName,
          ipAddress: targetIp,
          packageSpeed: isBurstMode ? '1 Gbps Burst' : speedProfile,
          maxSpeedMbps: maxBandwidth,
          download: finalDlVal || 98.4,
          upload: finalUlVal || 96.2,
          ping: localPing || 2,
          jitter: localJitter || 1.5,
          loss: localLoss,
          status: isLowSla ? 'SLA Low' : 'SLA OK',
          timestamp: 'Baru Saja'
        };

        setHistory(prev => [newResult, ...prev]);
      }
    }, 120);
  };

  // Calculate needle rotation angle matching Ookla style dial scale
  const getNeedleRotationAngle = () => {
    const ratio = Math.min(currentSpeed / dialMax, 1.05);
    // Maps 0..1 to -115 to 115 degrees
    return -115 + (ratio * 230);
  };

  const filteredCustomers = customers.filter((c) => {
    const isDedicated = c.packageSpeed.toLowerCase().includes('dedicated');
    const matchesCategory = activeCategory === 'dedicated' ? isDedicated : !isDedicated;
    if (!matchesCategory) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.ipAddress.toLowerCase().includes(q) ||
        c.packageSpeed.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      
      {/* Category Selection Tabs */}
      <div className="flex border-b border-slate-900 pb-px gap-2">
        <button
          onClick={() => setActiveCategory('broadband')}
          className={`px-5 py-3 font-orbitron font-extrabold text-xs tracking-widest uppercase border-b-2 transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            activeCategory === 'broadband'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Globe className={`w-4 h-4 ${activeCategory === 'broadband' ? 'text-cyan-400' : 'text-slate-400'}`} />
          Broadband FTTH
        </button>
        <button
          onClick={() => setActiveCategory('dedicated')}
          className={`px-5 py-3 font-orbitron font-extrabold text-xs tracking-widest uppercase border-b-2 transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            activeCategory === 'dedicated'
              ? 'border-amber-500 text-amber-400 bg-amber-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Zap className={`w-4 h-4 ${activeCategory === 'dedicated' ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          Dedicated Internet (SLA 1:1)
        </button>
      </div>
      
      {/* Top Header - Symmetrical Diagnostic Banner */}
      <div className={`bg-[#0b0c16] border rounded-xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300 ${
        activeCategory === 'dedicated' ? 'border-amber-500/25' : 'border-[#1b1c35]'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse ${
            activeCategory === 'dedicated' 
              ? 'bg-amber-950/55 border-amber-500/20 text-amber-400' 
              : 'bg-cyan-950/55 border-cyan-500/20 text-cyan-400'
          }`}>
            <Zap className={`w-5 h-5 ${activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'}`} />
          </div>
          <div>
            <h2 className="font-orbitron font-extrabold text-sm sm:text-base tracking-wider text-slate-100 flex items-center gap-2 uppercase">
              {activeCategory === 'dedicated' ? 'DEDICATED 1:1 SLA SPEEDTEST ENGINE' : 'GPON BROADBAND SPEEDTEST ENGINE'}
              <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-widest font-mono ${
                activeCategory === 'dedicated'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-400/20'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-400/20'
              }`}>
                {activeCategory === 'dedicated' ? 'Corporate SLA 99.9%' : 'Best Effort FTTH'}
              </span>
            </h2>
            <p className="text-[10px] font-mono text-slate-400 uppercase mt-1">
              {activeCategory === 'dedicated' 
                ? 'Instrumen khusus pengujian bandwidth Dedicated Internet Simetris 1:1' 
                : 'Instrumen pengujian bandwidth pelanggan retail broadband GPON shared line'}
            </p>
          </div>
        </div>

        {/* Burst Mode Switch */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
          <div className="flex flex-col text-right font-mono text-[10px]">
            <span className="text-slate-400 font-bold uppercase">Gigabit Burst SLA (1:1)</span>
            <span className={`${activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'} text-[9px]`}>Uncapped 1Gbps Bandwidth</span>
          </div>
          <button
            onClick={() => {
              if (testPhase === 'idle' || testPhase === 'completed' || testPhase === 'failed') {
                setIsBurstMode(!isBurstMode);
              }
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
              isBurstMode 
                ? activeCategory === 'dedicated'
                  ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'bg-slate-800'
            }`}
            disabled={testPhase !== 'idle' && testPhase !== 'completed' && testPhase !== 'failed'}
          >
            <div
              className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                isBurstMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Setup Form & Logs (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Config Box */}
          <div className={`bg-[#0b0c16] border p-5 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] space-y-4 transition-colors duration-300 ${
            activeCategory === 'dedicated' ? 'border-amber-500/25' : 'border-[#1b1c35]'
          }`}>
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Sliders className={`w-4 h-4 ${activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'}`} />
              <span className="text-[11px] font-orbitron font-bold text-slate-100 uppercase tracking-widest">
                Konfigurasi Speedtest
              </span>
            </div>

            {/* Pencarian Pelanggan Manual */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="block text-[9px] text-slate-500 uppercase font-bold">Cari Pelanggan Manual</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama / ID / IP / Paket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={testPhase !== 'idle' && testPhase !== 'completed' && testPhase !== 'failed'}
                  className={`w-full bg-slate-950 border rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none text-[11px] font-mono transition-colors ${
                    activeCategory === 'dedicated' ? 'border-slate-800 focus:border-amber-400' : 'border-slate-800 focus:border-cyan-400'
                  }`}
                />
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Select Customer */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="block text-[9px] text-slate-500 uppercase font-bold">
                Pilih Pelanggan {activeCategory === 'dedicated' ? 'Dedicated' : 'Broadband'} ({sortedCustomers.length})
              </label>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  disabled={testPhase !== 'idle' && testPhase !== 'completed' && testPhase !== 'failed'}
                  className={`w-full bg-slate-950/90 border rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none cursor-pointer text-[11px] appearance-none transition-colors ${
                    activeCategory === 'dedicated' ? 'border-slate-800 focus:border-amber-400' : 'border-slate-800 focus:border-cyan-400'
                  }`}
                >
                  <option value="">-- PILIH PELANGGAN --</option>
                  {sortedCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id} - {c.packageSpeed})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* IP Auto-filled */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="block text-[9px] text-slate-500 uppercase font-bold">IP Address Pelanggan</label>
              <input
                type="text"
                placeholder="e.g. 10.120.45.12"
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                disabled={!!selectedCustomerId || (testPhase !== 'idle' && testPhase !== 'completed' && testPhase !== 'failed')}
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none text-[11px] font-mono transition-colors ${
                  activeCategory === 'dedicated' ? 'border-slate-800 focus:border-amber-400' : 'border-slate-800 focus:border-cyan-400'
                }`}
              />
              {selectedCustomerId && (
                <span className="text-[8px] text-slate-600 block italic uppercase">
                  // IP dipetakan otomatis dari sistem billing
                </span>
              )}
            </div>

            {/* Server selection */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="block text-[9px] text-slate-500 uppercase font-bold">Server Node Terdekat</label>
              <div className="relative">
                <select
                  value={testServer}
                  onChange={(e) => setTestServer(e.target.value)}
                  disabled={testPhase !== 'idle' && testPhase !== 'completed' && testPhase !== 'failed'}
                  className={`w-full bg-slate-950/90 border rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none cursor-pointer text-[11px] appearance-none transition-colors ${
                    activeCategory === 'dedicated' ? 'border-slate-800 focus:border-amber-400' : 'border-slate-800 focus:border-cyan-400'
                  }`}
                >
                  <option value="Aisyaka-BKS-Main">Aisyaka.Net Bekasi Core</option>
                  <option value="Aisyaka-CKR-Edge">Aisyaka.Net Cikarang Edge</option>
                  <option value="Telkom-Cyber-Sg">Cyber Singapore (Intl Transit)</option>
                  <option value="GCP-Asia-East1">Google Cloud Singapore Node</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Premium Client Specs Card */}
            {selectedCustomer && (
              <div className={`bg-slate-950/60 border p-4 rounded-lg font-mono text-[10.5px] text-slate-400 space-y-2 transition-colors ${
                activeCategory === 'dedicated' ? 'border-amber-950/40' : 'border-slate-900'
              }`}>
                <div className="text-[8px] text-slate-500 uppercase font-bold border-b border-slate-900 pb-1.5 flex items-center justify-between">
                  <span>// STATUS PARAMETER SERAT:</span>
                  <span className={activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'}>ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>ID / Nama:</span>
                  <span className="text-slate-300 font-bold">{selectedCustomer.id} / {selectedCustomer.name.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paket Dasar:</span>
                  <span className="text-slate-300 font-bold">{selectedCustomer.packageSpeed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode Speedtest:</span>
                  <span className={`${activeCategory === 'dedicated' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}`}>
                    {isBurstMode ? '1 Gbps Burst (1:1)' : `${speedProfile} (${activeCategory === 'dedicated' ? 'SLA 1:1' : 'Shared'})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Redaman (Rx):</span>
                  <span className={`font-bold ${selectedCustomer.opticalPower < -26 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedCustomer.opticalPower} dBm
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Handshake Logs */}
          <div className={`bg-[#0b0c16] border p-5 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] space-y-3 transition-colors duration-300 ${
            activeCategory === 'dedicated' ? 'border-amber-500/25' : 'border-[#1b1c35]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                // CONSOLE TRANSMISI DATA
              </span>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeCategory === 'dedicated' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </div>
            <div className={`h-44 overflow-y-auto bg-black/90 p-3.5 border border-slate-900 rounded-lg font-mono text-[9.5px] space-y-1.5 select-none scrollbar-thin scrollbar-thumb-slate-800 ${
              activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {logMessages.length === 0 ? (
                <span className="text-slate-600 block italic">// Sistem siap pengujian. Silakan klik tombol "GO" atau "Mulai" untuk transmisi.</span>
              ) : (
                logMessages.map((msg, i) => (
                  <div key={i} className={`leading-relaxed whitespace-pre-wrap text-slate-300 border-l pl-2 ${
                    activeCategory === 'dedicated' ? 'border-amber-500/20' : 'border-cyan-500/20'
                  }`}>
                    {msg}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Large Speedtest Dial & Real-Time Stats (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Ookla Stage Container */}
          <div className={`bg-[#05060b] border rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center relative min-h-[460px] shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-colors duration-300 ${
            activeCategory === 'dedicated' ? 'border-amber-500/25' : 'border-[#18192e]'
          }`}>
            
            {/* Ambient Background Grid & Radial Glow */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
              activeCategory === 'dedicated'
                ? 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_75%)]'
                : 'bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_75%)]'
            }`} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-30" />

            {/* Ookla Style Header bar inside tester */}
            <div className="w-full flex justify-between items-center mb-6 z-10 border-b border-slate-900 pb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-ping ${activeCategory === 'dedicated' ? 'bg-amber-500' : 'bg-cyan-500'}`} />
                <span className={`text-[10px] font-orbitron font-extrabold uppercase tracking-widest ${
                  activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {activeCategory === 'dedicated' ? 'OOKLA DEDICATED SLA ENGINE' : 'OOKLA BROADBAND FTTH ENGINE'}
                </span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                {testPhase === 'idle' && 'STANDBY READY'}
                {testPhase === 'pinging' && 'MEASURING LATENCY...'}
                {testPhase === 'download' && 'TESTING DOWNLOAD SPEED'}
                {testPhase === 'upload' && 'TESTING UPLOAD SPEED'}
                {testPhase === 'completed' && 'PENGUJIAN SELESAI'}
              </div>
            </div>

            {/* Top Stat Bar matching Ookla dashboard style */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-8 z-10 font-mono">
              {/* PING CARD */}
              <div className="bg-[#0d0e1b] border border-[#1b1c35] rounded-xl p-3 text-center transition-all duration-300">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">PING / JITTER</span>
                <div className="flex items-center justify-center gap-2.5 mt-2">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[8px] uppercase">Ping</span>
                    <strong className="text-base sm:text-lg text-emerald-400 font-orbitron font-black">
                      {pingVal > 0 ? `${pingVal}` : '--'}<span className="text-[10px] font-normal text-slate-500 ml-0.5">ms</span>
                    </strong>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-800" />
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[8px] uppercase">Jitter</span>
                    <strong className="text-base sm:text-lg text-emerald-400 font-orbitron font-black">
                      {jitterVal > 0 ? `${jitterVal}` : '--'}<span className="text-[10px] font-normal text-slate-500 ml-0.5">ms</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* DOWNLOAD CARD */}
              <div className={`bg-[#0d0e1b] border rounded-xl p-3 text-center transition-all duration-300 ${
                testPhase === 'download' 
                  ? activeCategory === 'dedicated'
                    ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'border-[#1b1c35]'
              }`}>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold flex items-center justify-center gap-1">
                  <ArrowDown className={`w-3 h-3 ${activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'} ${testPhase === 'download' ? 'animate-bounce' : ''}`} />
                  DOWNLOAD
                </span>
                <strong className={`text-xl sm:text-2xl font-orbitron font-black block mt-1 tracking-tighter ${
                  testPhase === 'download' 
                    ? activeCategory === 'dedicated' ? 'text-amber-400 animate-pulse' : 'text-cyan-400 animate-pulse' 
                    : finalDownload > 0 
                      ? activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400' 
                      : 'text-slate-500'
                }`}>
                  {testPhase === 'download' ? currentSpeed : (finalDownload > 0 ? finalDownload : '0.0')}
                  <span className="text-[10px] font-mono text-slate-400 font-bold ml-1 uppercase">Mbps</span>
                </strong>
              </div>

              {/* UPLOAD CARD */}
              <div className={`bg-[#0d0e1b] border rounded-xl p-3 text-center transition-all duration-300 ${
                testPhase === 'upload' ? 'border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-[#1b1c35]'
              }`}>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold flex items-center justify-center gap-1">
                  <ArrowUp className={`w-3 h-3 text-fuchsia-400 ${testPhase === 'upload' ? 'animate-bounce' : ''}`} />
                  UPLOAD
                </span>
                <strong className={`text-xl sm:text-2xl font-orbitron font-black block mt-1 tracking-tighter ${
                  testPhase === 'upload' ? 'text-fuchsia-400 animate-pulse' : finalUpload > 0 ? 'text-fuchsia-400' : 'text-slate-500'
                }`}>
                  {testPhase === 'upload' ? currentSpeed : (finalUpload > 0 ? finalUpload : '0.0')}
                  <span className="text-[10px] font-mono text-slate-400 font-bold ml-1 uppercase">Mbps</span>
                </strong>
              </div>
            </div>

            {/* Central Stage: Toggle between massive GO button and speedometer dial gauge */}
            <div className="relative w-72 h-72 flex items-center justify-center mb-6 z-10">
              
              {testPhase === 'idle' ? (
                /* OOOKLA MASSIVE PULSING "GO" BUTTON */
                <div className="relative flex items-center justify-center w-full h-full">
                  {/* Outer breathing background glow effect */}
                  <div className={`absolute inset-0 rounded-full animate-pulse ${
                    activeCategory === 'dedicated' 
                      ? 'bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_60%)]' 
                      : 'bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent_60%)]'
                  }`} />
                  
                  {/* Outer glowing orbit boundary */}
                  <div className={`absolute w-56 h-56 rounded-full border flex items-center justify-center animate-[spin_20s_linear_infinite] ${
                    activeCategory === 'dedicated' ? 'border-amber-500/20' : 'border-cyan-500/20'
                  }`}>
                    <div className={`absolute top-0 w-2.5 h-2.5 rounded-full shadow-md ${
                      activeCategory === 'dedicated' 
                        ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]' 
                        : 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                    }`} />
                    <div className="absolute bottom-0 w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
                  </div>

                  {/* The GO Button trigger */}
                  <button
                    onClick={handleStartTest}
                    disabled={!selectedCustomerId && !customIp}
                    className={`group relative w-44 h-44 rounded-full border-4 border-[#181938] bg-gradient-to-br from-[#0c0e25] to-[#141738] hover:from-[#101334] hover:to-[#1e2354] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center cursor-pointer ${
                      activeCategory === 'dedicated'
                        ? 'shadow-[0_0_40px_rgba(245,158,11,0.35),inset_0_0_20px_rgba(245,158,11,0.2)]'
                        : 'shadow-[0_0_40px_rgba(6,182,212,0.35),inset_0_0_20px_rgba(6,182,212,0.2)]'
                    }`}
                  >
                    <span className={`font-orbitron font-black text-4xl text-slate-100 tracking-widest select-none transition-colors duration-200 ${
                      activeCategory === 'dedicated' ? 'group-hover:text-amber-400' : 'group-hover:text-cyan-400'
                    }`}>
                      GO
                    </span>
                    <span className={`text-[9px] font-mono tracking-widest font-bold mt-1 uppercase select-none ${
                      activeCategory === 'dedicated' ? 'text-amber-400/80 group-hover:text-amber-300' : 'text-cyan-400/80 group-hover:text-cyan-300'
                    }`}>
                      START TEST
                    </span>
                    
                    {/* Glowing circular internal aura */}
                    <div className={`absolute inset-3 rounded-full border transition-colors duration-300 ${
                      activeCategory === 'dedicated' ? 'border-amber-500/10 group-hover:border-amber-500/30' : 'border-cyan-500/10 group-hover:border-cyan-500/30'
                    }`} />
                  </button>
                </div>
              ) : (
                /* SPEEDOMETER DIAL GAUGE STAGE */
                <div className="relative w-full h-full flex items-center justify-center">
                  
                  {/* Outer Dial Numbers & Scales */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      {/* Define radial and linear gradients */}
                      <defs>
                        <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                        <linearGradient id="fuchsiaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#d946ef" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>

                      {/* Main ticks background arc */}
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#131429"
                        strokeWidth="5"
                        strokeDasharray="360 144"
                        strokeDashoffset="75"
                        strokeLinecap="round"
                      />

                      {/* Tick Marks around the speedometer arc */}
                      {[...Array(11)].map((_, i) => {
                        const angle = -205 + (i * 23); // maps 0..10 to speedometer sweep arc
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 100 + 72 * Math.cos(rad);
                        const y1 = 100 + 72 * Math.sin(rad);
                        const x2 = 100 + 78 * Math.cos(rad);
                        const y2 = 100 + 78 * Math.sin(rad);

                        let labelText = '';
                        if (i === 0) labelText = '0';
                        else if (i === 5) labelText = String(dialMax / 2);
                        else if (i === 10) labelText = String(dialMax);

                        const tx = 100 + 58 * Math.cos(rad);
                        const ty = 100 + 58 * Math.sin(rad) + 2;

                        return (
                          <g key={i}>
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={angle <= -205 + (currentSpeed / dialMax) * 230 ? (activeCategory === 'dedicated' ? '#f59e0b' : '#06b6d4') : '#1e2042'}
                              strokeWidth={i % 5 === 0 ? "2" : "1"}
                              className="transition-all duration-150"
                            />
                            {labelText && (
                              <text
                                x={tx}
                                y={ty}
                                fill="#475569"
                                fontSize="7"
                                fontFamily="monospace"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="select-none"
                              >
                                {labelText}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Glowing progress track arc */}
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={testPhase === 'upload' ? 'url(#fuchsiaGlow)' : (activeCategory === 'dedicated' ? 'url(#amberGlow)' : 'url(#cyanGlow)')}
                        strokeWidth="6"
                        strokeDasharray="360"
                        strokeDashoffset={(() => {
                          const ratio = Math.min(currentSpeed / dialMax, 1);
                          // 360 is full circle, we use ~250 units for the speedometer arc sweep
                          return 360 - (250 * ratio);
                        })()}
                        transform="rotate(125 100 100)"
                        strokeLinecap="round"
                        className={`transition-all duration-100 ease-out ${
                          activeCategory === 'dedicated' ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                        }`}
                      />
                    </svg>
                  </div>

                  {/* Big speed numbers inside center of dial */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-4">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">
                      {testPhase === 'pinging' && 'RESOLVING...'}
                      {testPhase === 'download' && 'DOWNLOADING'}
                      {testPhase === 'upload' && 'UPLOADING'}
                      {testPhase === 'completed' && 'SLA COMPLETED'}
                    </span>
                    <span className="text-5xl font-orbitron font-black text-slate-100 tracking-tighter mt-1">
                      {currentSpeed > 0 ? currentSpeed : (testPhase === 'completed' ? finalDownload : '0.0')}
                    </span>
                    <span className={`text-[10px] font-mono font-extrabold tracking-widest mt-1 ${
                      activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      Mbps Bandwidth
                    </span>
                  </div>

                  {/* Needle Hand Dial */}
                  <div 
                    className={`absolute w-1.5 h-24 bg-gradient-to-t from-transparent ${
                      activeCategory === 'dedicated'
                        ? 'via-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                        : 'via-cyan-400 to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                    } rounded-full origin-bottom bottom-36 left-1/2 -translate-x-1/2 transition-transform duration-100`}
                    style={{ 
                      transform: `rotate(${getNeedleRotationAngle()}deg)`,
                      transformOrigin: '50% 100%'
                    }}
                  />

                  {/* Pivot Cap */}
                  <div className={`absolute w-4 h-4 rounded-full bg-slate-950 border ${
                    activeCategory === 'dedicated'
                      ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                      : 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                  } z-20`} />
                </div>
              )}
            </div>

            {/* Bottom Panel Info - ISP Name & Target Server node details */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-4 pt-4 border-t border-slate-900 font-mono text-[10.5px]">
              
              <div className="flex items-center gap-2.5 text-slate-400">
                <Wifi className={`w-4 h-4 shrink-0 ${activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'}`} />
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase font-bold">CLIENT ISP</span>
                  <span className="text-slate-200 font-bold">AISYAKA.NET INTERNET</span>
                  <span className="text-slate-500 text-[9px]">{customIp || '103.150.11.20'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400 border-l border-slate-900 pl-4">
                <Server className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase font-bold">SERVER NODE</span>
                  <span className="text-slate-200 font-bold">{testServer.replace('Aisyaka-', 'Aisyaka ')}</span>
                  <span className="text-slate-500 text-[9px]">Standard SLA Premium</span>
                </div>
              </div>

            </div>

            {/* Cancel/Stop button available while running */}
            {testPhase !== 'idle' && testPhase !== 'completed' && testPhase !== 'failed' && (
              <button
                onClick={handleStopTest}
                className="mt-6 px-4 py-1.5 bg-red-950/40 hover:bg-red-950 border border-red-500/40 hover:border-red-500 text-red-200 font-mono text-[10px] tracking-wider rounded-lg transition-all duration-150 flex items-center gap-2 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-red-400" />
                Batal Pengujian
              </button>
            )}

            {/* Test Again button available when completed or failed */}
            {(testPhase === 'completed' || testPhase === 'failed') && (
              <button
                onClick={() => {
                  setTestPhase('idle');
                  setCurrentSpeed(0);
                  setProgress(0);
                  setPingVal(0);
                  setJitterVal(0);
                  setLossVal(0);
                  setFinalDownload(0);
                  setFinalUpload(0);
                }}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/80 text-cyan-300 hover:text-cyan-200 font-orbitron font-extrabold text-xs sm:text-sm tracking-widest rounded-xl transition-all duration-200 flex items-center gap-2.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-[spin_4s_linear_infinite]" />
                TES ULANG / TEST AGAIN
              </button>
            )}
          </div>

          {/* Symmetrical 1Gbps SLA Verified Report Card */}
          {testPhase === 'completed' && (
            <NeonBox variant={activeCategory === 'dedicated' ? 'amber' : 'emerald'} className="p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <span className={`text-[11px] font-orbitron font-black uppercase tracking-widest flex items-center gap-2 ${
                  activeCategory === 'dedicated' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  <ShieldCheck className={`w-5 h-5 ${activeCategory === 'dedicated' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  {activeCategory === 'dedicated' 
                    ? 'SLA INTERNET DEDICATED LULUS (SLA 99.9% 1:1 PASSED)' 
                    : 'SLA GIGABIT SYMMETRICAL LULUS (1:1 PASSED)'}
                </span>
                <span className="text-[9px] font-mono text-slate-500">TERTANGGAL: BARU SAJA</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] font-mono text-slate-300">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan Teruji:</span>
                    <strong className="text-slate-100">{selectedCustomer ? selectedCustomer.name : 'Konfigurasi IP Manual'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IP Host Pelanggan:</span>
                    <span className={activeCategory === 'dedicated' ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>{customIp || '103.150.11.20'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Node Speedtest JKT:</span>
                    <span className="text-slate-300 font-bold">{testServer}</span>
                  </div>
                </div>

                <div className="space-y-2 md:border-l md:border-slate-800 md:pl-6">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kecepatan Download:</span>
                    <span className={`font-black font-orbitron ${activeCategory === 'dedicated' ? 'text-amber-400' : 'text-emerald-400'}`}>{finalDownload} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kecepatan Upload:</span>
                    <span className="text-fuchsia-400 font-black font-orbitron">{finalUpload} Mbps</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2">
                    <span className="text-slate-500">Symmetrical Ratio:</span>
                    <strong className={activeCategory === 'dedicated' ? 'text-amber-400 font-black' : 'text-emerald-400 font-black'}>
                      {activeCategory === 'dedicated' ? '1:1 (Dedicated Symmetric SLA 99.9%)' : '1:1 (Symmetric Broadband Fiber)'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="text-[9.5px] text-slate-400 bg-slate-950/80 border border-slate-900 p-3 rounded-lg flex items-start gap-2">
                <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${activeCategory === 'dedicated' ? 'text-amber-400' : 'text-cyan-400'}`} />
                <span>
                  <strong>Kesimpulan Analisis:</strong> {activeCategory === 'dedicated' 
                    ? `Sambungan DEDICATED pelanggan beroperasi dalam jaminan bandwidth penuh tanpa rasio pembagian (SLA 99.9% Terjamin). Symmetri rasio unggahan-unduhan mencapai 99.6% (Symmetric SLA standar premium Aisyaka.Net), dengan ping stabil ${pingVal}ms tanpa adanya packet loss (0% Loss). Infrastruktur fiber dedicated aktif penuh.`
                    : `Sambungan BROADBAND pelanggan beroperasi dalam mode Gigabit unthrottled penuh. Symmetri rasio unggahan-unduhan mencapai 99.1% (Symmetric SLA standar Ookla), dengan ping stabil ${pingVal}ms tanpa adanya packet loss (0% Loss). Serat optik dalam performa sangat prima.`
                  }
                </span>
              </div>
            </NeonBox>
          )}

          {/* Historical Results List matching Ookla Theme */}
          <div className="bg-[#0b0c16] border border-[#1b1c35] p-5 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <span className="block text-[11px] font-orbitron font-extrabold text-slate-300 uppercase tracking-widest border-b border-slate-900 pb-3 mb-4">
              RIWAYAT PENGUJIAN BARU-BARU INI
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[10.5px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 uppercase text-[9px] bg-slate-900/10">
                    <th className="py-2.5 px-3">No. Tes</th>
                    <th className="py-2.5 px-2">Nama Pelanggan</th>
                    <th className="py-2.5 px-2">IP Address</th>
                    <th className="py-2.5 px-2">Profil Paket</th>
                    <th className="py-2.5 px-2 text-right">Download</th>
                    <th className="py-2.5 px-2 text-right">Upload</th>
                    <th className="py-2.5 px-2 text-center">Ping</th>
                    <th className="py-2.5 px-3 text-center">Status SLA</th>
                    <th className="py-2.5 px-2 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-400">{h.id}</td>
                      <td className="py-3 px-2 text-slate-200">{h.customerName}</td>
                      <td className="py-3 px-2 text-cyan-400">{h.ipAddress}</td>
                      <td className="py-3 px-2 text-slate-400">{h.packageSpeed}</td>
                      <td className="py-3 px-2 text-right text-emerald-400 font-bold">{h.download} Mbps</td>
                      <td className="py-3 px-2 text-right text-fuchsia-400">{h.upload} Mbps</td>
                      <td className="py-3 px-2 text-center text-slate-300">{h.ping} ms</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[8.5px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/25">
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-slate-500">{h.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
