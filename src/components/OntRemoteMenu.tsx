import React, { useState, useEffect } from 'react';
import { Customer, Region } from '../types';
import { 
  Laptop, Search, Server, ShieldCheck, Cpu, RefreshCw, ChevronRight, 
  Settings, Power, AlertTriangle, CheckCircle, Wifi, Globe, Layers, 
  Terminal, ShieldAlert, ArrowRight, UserCheck, HardDrive, Network
} from 'lucide-react';
import NeonBox from './NeonBox';

const HuaweiLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`${className}`} xmlns="http://www.w3.org/2000/svg">
    <g fill="#E31815">
      <path d="M50 15 C 51.5 35, 52 50, 50 75 C 48 50, 48.5 35, 50 15 Z" />
      <path d="M50 75 C 62 55, 68 45, 75 30 C 65 40, 58 52, 50 75 Z" />
      <path d="M50 75 C 38 55, 32 45, 25 30 C 35 40, 42 52, 50 75 Z" />
      <path d="M50 75 C 68 62, 78 55, 92 48 C 78 54, 68 60, 50 75 Z" />
      <path d="M50 75 C 32 62, 22 55, 8 48 C 22 54, 32 60, 50 75 Z" />
      <path d="M50 75 C 72 70, 84 68, 98 65 C 84 66, 72 68, 50 75 Z" />
      <path d="M50 75 C 28 70, 16 68, 2 65 C 16 66, 28 68, 50 75 Z" />
    </g>
  </svg>
);

interface OntRemoteMenuProps {
  customers: Customer[];
  regions: Region[];
  onUpdateCustomers: (list: Customer[]) => void;
  preSelectedCustomerId?: string;
  onClearPreSelectedId?: () => void;
}

type MainTab = 'home' | 'status' | 'lan_security' | 'advanced_settings';

export default function OntRemoteMenu({ 
  customers, 
  regions, 
  onUpdateCustomers,
  preSelectedCustomerId,
  onClearPreSelectedId
}: OntRemoteMenuProps) {
  
  // Connection panel states
  const [targetCustomerId, setTargetCustomerId] = useState<string>('');
  const [manualIp, setManualIp] = useState<string>('');
  const [connectionPhase, setConnectionPhase] = useState<'selection' | 'connecting' | 'login' | 'connected'>('selection');
  const [connectLog, setConnectLog] = useState<string[]>([]);
  const [loginUser, setLoginUser] = useState<string>('Aisyaka2024');
  const [loginPass, setLoginPass] = useState<string>('Aisyakaonline');
  const [loginError, setLoginError] = useState<string>('');
  const [isBypassing, setIsBypassing] = useState<boolean>(false);

  // Emulated ONT state values
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('status');
  const [activeSubTab, setActiveSubTab] = useState<string>('device');

  // Diagnosis progress states
  const [diagPhase, setDiagPhase] = useState<'idle' | 'running' | 'completed'>('idle');
  const [diagLogs, setDiagLogs] = useState<string[]>([]);
  const [diagProgress, setDiagProgress] = useState<number>(0);

  // Form input states (mirroring selected customer)
  const [ssidName, setSsidName] = useState<string>('Hura');
  const [wifiPassword, setWifiPassword] = useState<string>('aisyakapassword123');
  const [pppoeUser, setPppoeUser] = useState<string>('');
  const [pppoePass, setPppoePass] = useState<string>('');
  const [vlanId, setVlanId] = useState<number>(10);
  const [isWlanEnabled, setIsWlanEnabled] = useState<boolean>(true);
  const [isWanEnabled, setIsWanEnabled] = useState<boolean>(true);
  const [saveNotify, setSaveNotify] = useState<string | null>(null);

  // Load preselected customer if passed from dashboard
  useEffect(() => {
    if (preSelectedCustomerId) {
      setTargetCustomerId(preSelectedCustomerId);
      const cust = customers.find(c => c.id === preSelectedCustomerId);
      if (cust) {
        setManualIp(cust.ipAddress);
        triggerBypassFlow(cust);
      }
      if (onClearPreSelectedId) {
        setTimeout(() => {
          onClearPreSelectedId();
        }, 50);
      }
    }
  }, [preSelectedCustomerId]);

  const selectedCustomer = customers.find(c => c.id === targetCustomerId);

  // Initialize form fields when customer is loaded
  const syncFormFields = (cust: Customer) => {
    setSsidName(cust.wifiSsid || (cust.name.split(' ')[0].toUpperCase() + '_WIFI_GPON'));
    setWifiPassword(cust.wifiPassword || (cust.pppoePassword ? cust.pppoePassword + '@123' : 'aisyaka_pass123'));
    setPppoeUser(cust.pppoeUsername || `jgc-aa-${cust.id.split('-')[1].toLowerCase()}-barce`);
    setPppoePass(cust.pppoePassword || 'secretpassword');
    setVlanId(cust.vlanId || 10);
    setIsWlanEnabled(true);
    setIsWanEnabled(true);
  };

  const triggerBypassFlow = (cust: Customer | undefined) => {
    if (cust) {
      syncFormFields(cust);
    }
    setLoginUser('Aisyaka2024');
    setLoginPass('Aisyakaonline');
    setIsBypassing(true);
    setConnectionPhase('login');
    
    setTimeout(() => {
      setIsBypassing(false);
      setConnectionPhase('connected');
      setActiveMainTab('status');
      setActiveSubTab('device');
    }, 2500);
  };

  const handleInitiateHandshake = (id: string, ip: string) => {
    setConnectLog([]);
    setConnectionPhase('connecting');
    const targetIp = ip || '192.168.100.1';
    
    const logs = [
      `[NOC] Membuka socket remote connection ke host: ${targetIp}`,
      `[NOC] Mengirimkan paket ARP Request...`,
      `[ARP] MAC Address terdeteksi: 28:5f:94:ab:c0:de (HUAWEI TECHNOLOGIES CO., LTD)`,
      `[TCP] Melakukan 3-way Handshake ke port 80 (HTTP Gateway)`,
      `[HTTP] Menerima Header respon: Server: Huawei-HTTP/1.1`,
      `[NOC] Server port 80 RESPONDED! Membuka halaman administrasi login...`
    ];

    let count = 0;
    const interval = setInterval(() => {
      if (count < logs.length) {
        setConnectLog(prev => [...prev, logs[count]]);
        count++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setConnectionPhase('login');
          // Prefill login credentials
          setLoginUser('Aisyaka2024');
          setLoginPass('Aisyakaonline');
          setLoginError('');
        }, 600);
      }
    }, 250);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow any credentials to avoid any login blocks
    if (selectedCustomer) {
      syncFormFields(selectedCustomer);
    }
    setConnectionPhase('connected');
    setActiveMainTab('status');
    setActiveSubTab('device');
  };

  const handleSaveOntSettings = (type: 'wifi' | 'pppoe') => {
    if (!selectedCustomer) {
      setSaveNotify('Pengaturan diubah lokal (Modem IP Manual)');
      setTimeout(() => setSaveNotify(null), 3000);
      return;
    }

    setSaveNotify('Menyimpan konfigurasi ke Flash NVRAM Modem...');
    
    setTimeout(() => {
      // Save to parent customer state
      const updated: Customer = {
        ...selectedCustomer,
        pppoeUsername: pppoeUser,
        pppoePassword: pppoePass,
        vlanId: vlanId,
        wifiSsid: ssidName,
        wifiPassword: wifiPassword
      };
      
      // Update the customer in global lists
      const updatedList = customers.map(c => c.id === selectedCustomer.id ? updated : c);
      onUpdateCustomers(updatedList);

      setSaveNotify('SUKSES: Konfigurasi berhasil disimpan dan disinkronkan ke server OLT!');
      setTimeout(() => setSaveNotify(null), 3500);
    }, 1500);
  };

  const runOneClickDiagnosis = () => {
    setDiagPhase('running');
    setDiagProgress(0);
    setDiagLogs([]);

    const steps = [
      { prg: 15, msg: 'Memeriksa Modul Transceiver SFP Hardware... [NORMAL]' },
      { prg: 35, msg: `Menganalisis Redaman Sinyal Rx Optical... [${selectedCustomer ? selectedCustomer.opticalPower : -14.93} dBm]` },
      { prg: 55, msg: 'Verifikasi OLT Register Status (ONT Registration)... [O5 - Operation State]' },
      { prg: 75, msg: `Melakukan Handshake PPPoE dengan Tunnel Server... [Connected IP: ${manualIp}]` },
      { prg: 90, msg: 'Memeriksa status IP LAN Ports & WLAN Radio... [LAN1-LAN4 Active]' },
      { prg: 100, msg: 'Diagnosis Selesai! Semua parameter berada dalam standar operasi optimal.' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setDiagProgress(steps[currentStep].prg);
        setDiagLogs(prev => [...prev, `[DIAG] ${steps[currentStep].msg}`]);
        currentStep++;
      } else {
        clearInterval(interval);
        setDiagPhase('completed');
      }
    }, 800);
  };

  const handleLogoutOnt = () => {
    setConnectionPhase('selection');
    setTargetCustomerId('');
    setManualIp('');
  };

  return (
    <div className="ont-portal space-y-6">
      
      {/* Selection Phase */}
      {connectionPhase === 'selection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0b0c16] border border-[#1b1c35] p-5 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
              <span className="block text-[11px] font-orbitron font-extrabold text-slate-100 uppercase tracking-widest border-b border-slate-900 pb-3 mb-4">
                Pintu Masuk Gateway ONT
              </span>

              <div className="space-y-4 font-mono text-xs">
                {/* Pick a subscriber */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] text-slate-500 uppercase font-bold">Pilih Pelanggan FTTH</label>
                  <select
                    value={targetCustomerId}
                    onChange={(e) => {
                      setTargetCustomerId(e.target.value);
                      const selected = customers.find(c => c.id === e.target.value);
                      if (selected) {
                        setManualIp(selected.ipAddress);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer text-[11px]"
                  >
                    <option value="">-- PILIH SUBS / PELANGGAN --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id} - {c.ipAddress})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-600">
                  <span>ATATAU INPUT MANUAL</span>
                  <div className="h-[1px] bg-slate-900 flex-1 ml-3" />
                </div>

                {/* Manual IP input */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] text-slate-500 uppercase font-bold">IP Address ONT / Modem</label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.100.1"
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-400 text-[11px] font-mono"
                  />
                </div>

                {/* Connect button */}
                <button
                  onClick={() => handleInitiateHandshake(targetCustomerId, manualIp)}
                  disabled={!manualIp}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/80 hover:border-cyan-400 text-cyan-300 font-orbitron font-extrabold text-xs tracking-widest rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:opacity-50"
                >
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  KONEKSI REMOTE ONT
                </button>

                {/* Direct Full Access button */}
                <button
                  onClick={() => {
                    const cust = customers.find(c => c.id === targetCustomerId);
                    triggerBypassFlow(cust);
                  }}
                  disabled={!manualIp}
                  className="w-full py-3 bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/80 hover:border-emerald-400 text-emerald-300 font-orbitron font-extrabold text-xs tracking-widest rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  AKSES LANGSUNG (BYPASS)
                </button>
              </div>
            </div>

            {/* Quick Helper card */}
            <div className="bg-[#0b0c16] border border-[#1b1c35] p-5 rounded-xl font-mono text-[10px] text-slate-400 space-y-2">
              <div className="text-[8px] text-slate-500 font-bold uppercase pb-1.5 border-b border-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                DASHBOARD INTEGRASI NOC
              </div>
              <p className="leading-relaxed">
                Portal ini terintegrasi secara dinamis dengan modul router Huawei <strong className="text-slate-200 font-bold">GPON ONT EchoLife HS8545M5</strong>. 
                NOC dapat mengonfigurasi parameter krusial seperti PPPoE login, VLAN ID, dan pengaturan SSID Wifi secara langsung.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-[#05060b] border border-[#18192e] rounded-2xl p-6 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02)_0%,transparent_75%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] opacity-15" />
              
              <div className="text-center space-y-3 max-w-md z-10">
                <div className="p-4 bg-slate-950/80 rounded-full border border-slate-900 inline-block text-cyan-400/30">
                  <Server className="w-12 h-12 text-slate-600 animate-pulse" />
                </div>
                <h3 className="text-slate-400 font-orbitron font-extrabold text-sm tracking-widest uppercase">
                  Sesi Gateway Siap
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Pilih pelanggan aktif dari daftar di sebelah kiri untuk membuka emulator konfigurasi modem Huawei HS8545M5 secara real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connecting/Handshaking Terminal Phase */}
      {connectionPhase === 'connecting' && (
        <div className="max-w-xl mx-auto bg-black border border-slate-900 rounded-xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.8)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-mono text-xs text-slate-300 font-bold">SOCKET CONNECTION MANAGER</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
          </div>

          <div className="h-56 bg-slate-950 p-4 border border-slate-900 rounded-lg font-mono text-[10.5px] text-slate-300 space-y-2 overflow-y-auto leading-relaxed">
            {connectLog.map((log, index) => (
              <div key={index} className="flex items-start gap-1.5">
                <span className="text-slate-600 select-none">&gt;</span>
                <span className={log.includes('Respon') || log.includes('RESPONDED') ? 'text-emerald-400 font-bold' : log.includes('ARP') ? 'text-cyan-400' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))}
            <div className="w-2 h-4 bg-cyan-400 animate-pulse inline-block" />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] font-mono text-slate-500 animate-pulse uppercase font-bold tracking-widest">
              NEGOTIATING HANDSHAKE PORTS...
            </span>
            <button
              onClick={() => {
                const cust = customers.find(c => c.id === targetCustomerId);
                triggerBypassFlow(cust);
              }}
              className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded font-mono text-[10px] uppercase font-bold cursor-pointer transition-all"
            >
              Skip Handshake & Login &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Login Page Emulation (Huawei Style matching screenshot) */}
      {connectionPhase === 'login' && (
        <div className="w-full max-w-4xl mx-auto bg-[#0a0d16] rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
          
          {/* Browser Top Window Frame */}
          <div className="bg-[#141824] px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex gap-1.5 shrink-0">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            
            <div className="flex-1 max-w-lg bg-[#080b11] border border-slate-800 rounded-lg py-1 px-3 text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span className="text-emerald-500">https://</span>
              <span>{manualIp || '192.168.100.1'}</span>
              <span className="text-slate-600">/html/index.asp</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="font-mono text-[10px] uppercase text-emerald-400 tracking-wider">SECURE TUNNEL (GPON)</span>
            </div>
          </div>

          {/* Actual Huawei Login Page Mockup (Gradient matches user's image exactly) */}
          <div className="relative min-h-[460px] bg-gradient-to-b from-[#2e9ad8] via-[#2181be] to-[#12588e] flex flex-col justify-between overflow-hidden">
            
            {/* Top Left Model Header */}
            <div className="p-6 flex items-center justify-between text-white select-none">
              <div className="flex items-center gap-2">
                <HuaweiLogo className="w-8 h-8 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                <span className="text-xs font-semibold tracking-wider text-white/90">HS8545M5</span>
              </div>
            </div>

            {/* Central Login Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
              
              {/* Welcome text from screenshot */}
              <h2 className="text-white text-center text-lg sm:text-xl md:text-2xl font-light tracking-wide mb-8 select-none drop-shadow-sm">
                Welcome to Huawei web page for network configuration.
              </h2>

              {/* Central Login inputs */}
              <form onSubmit={handleLoginSubmit} className="w-full max-w-xs space-y-4">
                {loginError && (
                  <div className="bg-rose-500/90 border border-rose-600 text-white text-[10px] p-2 rounded text-center">
                    {loginError}
                  </div>
                )}

                {/* User Name input row */}
                <div className="flex items-center gap-2">
                  <label className="text-white text-right text-xs font-semibold w-24 pr-1 whitespace-nowrap">
                    User Name :
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isBypassing}
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="flex-1 bg-[#53a6db] border border-[#2b88c4] focus:border-black focus:ring-1 focus:ring-black rounded shadow-inner px-2 py-1 text-white text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>

                {/* Password input row */}
                <div className="flex items-center gap-2">
                  <label className="text-white text-right text-xs font-semibold w-24 pr-1 whitespace-nowrap">
                    Password :
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isBypassing}
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="flex-1 bg-[#53a6db] border border-[#2b88c4] focus:border-black focus:ring-1 focus:ring-black rounded shadow-inner px-2 py-1 text-white text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>

                {/* Log In Button */}
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={isBypassing}
                    className="px-8 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded border border-slate-300 shadow-sm cursor-pointer transition-all active:scale-[0.98] w-28 text-center"
                  >
                    Log In
                  </button>
                </div>
              </form>

              {/* Cool animated Bypass indicator */}
              {isBypassing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20 animate-fade-in">
                  <div className="bg-[#0b0c16] border border-emerald-500/50 p-6 rounded-xl shadow-[0_0_35px_rgba(16,185,129,0.35)] max-w-sm space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center mx-auto animate-pulse">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-emerald-400 font-orbitron font-extrabold text-xs tracking-wider uppercase">
                        NOC BYPASS DIOTORISASI
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        User Name: {loginUser} | Password: {loginPass}
                      </p>
                    </div>
                    
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full w-full animate-pulse" style={{ width: '100%' }} />
                    </div>
                    <span className="text-[9px] font-mono text-emerald-500 uppercase font-bold animate-pulse">
                      MENGHUBUNGKAN PORTAL REMOTE...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom green accent line from screenshot */}
            <div className="h-1 bg-[#8cc63f] w-full" />

            {/* White footer block matching screenshot */}
            <div className="bg-white py-4 flex flex-col items-center justify-center gap-1 border-t border-slate-100 select-none">
              <HuaweiLogo className="w-10 h-10 grayscale opacity-90" />
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center px-4">
                Copyright © Huawei Technologies Co., Ltd. 2009-2018. All rights reserved.
              </p>
            </div>
          </div>

          {/* Diagnostics NOC Operator Bar */}
          <div className="bg-[#0e111a] px-6 py-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <span className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
              CONSOLE UTAMA NOC AISYAKA.NET
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLogoutOnt}
                className="px-3 py-1.5 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded text-[10px] uppercase font-bold cursor-pointer transition-all font-mono"
              >
                Batalkan Koneksi
              </button>
              <button
                type="button"
                onClick={() => {
                  const cust = customers.find(c => c.id === targetCustomerId);
                  triggerBypassFlow(cust);
                }}
                className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded font-mono text-[10px] uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                AKSES BYPASS ADMIN (AISYAKA.NET)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONNECTED EMULATED ONT PORTAL PANEL */}
      {connectionPhase === 'connected' && (
        <div className="bg-white text-blue-950 rounded-xl shadow-2xl overflow-hidden font-sans border border-blue-200">
          
          {/* 1. TOP HUAWEI BLUE BANNER HEADER */}
          <div className="bg-[#3fa7eb] px-5 py-3.5 flex justify-between items-center text-white border-b border-[#2d8dce]">
            
            {/* Left Brand Area */}
            <div className="flex items-center gap-3.5 select-none">
              <div className="flex items-center justify-center bg-white/20 w-8 h-8 rounded-full">
                {/* Custom Huawei Style petals design */}
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H11V8h2c.55 0 1-.45 1-1V5h2c.9 0 1.68-.58 1.9-1.39A7.957 7.957 0 0 1 20 12c0 2.22-.9 4.22-2.1 5.39z" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide leading-tight">EchoLife HS8545M5</h1>
                <p className="text-[10px] text-white/80 font-mono">
                  IP Target: {manualIp} {selectedCustomer ? `(${selectedCustomer.name})` : ''}
                </p>
              </div>
            </div>

            {/* Right utility links */}
            <div className="flex items-center gap-4 text-xs font-semibold font-mono">
              <span className="hover:underline cursor-pointer">Fast Setting</span>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Aisyaka.Net
              </span>
              <span className="text-white/40">|</span>
              <button
                onClick={handleLogoutOnt}
                className="bg-red-600/20 hover:bg-red-600 px-2.5 py-1 rounded text-[10px] border border-red-400/40 hover:border-red-500 font-bold transition-all cursor-pointer uppercase"
              >
                Logout Sesi
              </button>
            </div>
          </div>

          {/* 2. INNER LAYOUT: LEFT ICONS, SUB-MENU, AND RIGHT CONTENT PANE */}
          <div className="flex min-h-[520px] bg-blue-50/10">
            
            {/* Leftmost Column - Core Category Icons */}
            <div className="w-16 bg-[#edf3f9] border-r border-blue-200 flex flex-col items-center py-4 gap-4 select-none shrink-0">
              
              {/* HOME ICON */}
              <button
                onClick={() => {
                  setActiveMainTab('home');
                  setActiveSubTab('home_page');
                }}
                className={`w-12 h-12 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeMainTab === 'home'
                    ? 'bg-[#3fa7eb] text-white shadow-md'
                    : 'text-blue-700 hover:bg-blue-100 hover:text-blue-950'
                }`}
                title="Home Page & Diagnosis"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">Home</span>
              </button>

              {/* STATUS MONITORING ICON (Pulse Wave) */}
              <button
                onClick={() => {
                  setActiveMainTab('status');
                  setActiveSubTab('device');
                }}
                className={`w-12 h-12 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeMainTab === 'status'
                    ? 'bg-[#3fa7eb] text-white shadow-md'
                    : 'text-blue-700 hover:bg-blue-100 hover:text-blue-950'
                }`}
                title="Status & Optical Information"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">Status</span>
              </button>

              {/* LAN/SECURITY ICON (Gear with Folder plus) */}
              <button
                onClick={() => {
                  setActiveMainTab('lan_security');
                  setActiveSubTab('layer_port');
                }}
                className={`w-12 h-12 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeMainTab === 'lan_security'
                    ? 'bg-[#3fa7eb] text-white shadow-md'
                    : 'text-blue-700 hover:bg-blue-100 hover:text-blue-950'
                }`}
                title="LAN & Security"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">LAN</span>
              </button>

              {/* CONFIG GEAR ICON (Advanced Settings) */}
              <button
                onClick={() => {
                  setActiveMainTab('advanced_settings');
                  setActiveSubTab('wlan_basic');
                }}
                className={`w-12 h-12 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeMainTab === 'advanced_settings'
                    ? 'bg-[#3fa7eb] text-white shadow-md'
                    : 'text-blue-700 hover:bg-blue-100 hover:text-blue-950'
                }`}
                title="Advanced Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">Setting</span>
              </button>
            </div>

            {/* Middle Column - Submenu Navigation options */}
            <div className="w-48 bg-blue-50/40 border-r border-blue-200 flex flex-col py-3 text-xs select-none shrink-0 font-medium">
              <span className="px-4 py-1.5 text-[9px] text-blue-700/75 font-bold tracking-wider uppercase border-b border-blue-100 mb-2">
                Menu Navigasi
              </span>

              {/* Render dynamic submenus depending on main category */}
              {activeMainTab === 'home' && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveSubTab('home_page')}
                    className={`w-full text-left px-4 py-2 border-l-4 ${
                      activeSubTab === 'home_page' ? 'border-[#3fa7eb] bg-white text-[#3fa7eb] font-bold' : 'border-transparent text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    Home Page
                  </button>
                  <button
                    onClick={() => setActiveSubTab('one_click_diag')}
                    className={`w-full text-left px-4 py-2 border-l-4 ${
                      activeSubTab === 'one_click_diag' ? 'border-[#3fa7eb] bg-white text-[#3fa7eb] font-bold' : 'border-transparent text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    One-Click Diagnosis
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    System Information
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    Advanced
                  </button>
                </div>
              )}

              {activeMainTab === 'status' && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveSubTab('device')}
                    className={`w-full text-left px-4 py-2 border-l-4 ${
                      activeSubTab === 'device' ? 'border-[#3fa7eb] bg-white text-[#3fa7eb] font-bold' : 'border-transparent text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    Device Information
                  </button>
                  <button
                    onClick={() => setActiveSubTab('wan')}
                    className={`w-full text-left px-4 py-2 border-l-4 ${
                      activeSubTab === 'wan' ? 'border-[#3fa7eb] bg-white text-[#3fa7eb] font-bold' : 'border-transparent text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    WAN Information
                  </button>
                  <button
                    onClick={() => setActiveSubTab('optical')}
                    className={`w-full text-left px-4 py-2 border-l-4 ${
                      activeSubTab === 'optical' ? 'border-[#3fa7eb] bg-white text-[#3fa7eb] font-bold' : 'border-transparent text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    Optical Information
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    Service Provisioni...
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    VoIP
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    Eth Port
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    WLAN
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    Home Network
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    Cloud Platform Sta...
                  </button>
                </div>
              )}

              {activeMainTab === 'lan_security' && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveSubTab('layer_port')}
                    className={`w-full text-left px-4 py-2 border-l-4 ${
                      activeSubTab === 'layer_port' ? 'border-[#3fa7eb] bg-white text-[#3fa7eb] font-bold' : 'border-transparent text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    Layer 2/3 Port
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    LAN Host
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    DHCP Server
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    DHCP Static IP
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    DHCPv6 Server
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    Port Locating
                  </button>
                </div>
              )}

              {activeMainTab === 'advanced_settings' && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveSubTab('wan_pppoe')}
                    className={`w-full text-left px-4 py-2 border-l-4 ${
                      activeSubTab === 'wan_pppoe' ? 'border-[#3fa7eb] bg-white text-[#3fa7eb] font-bold' : 'border-transparent text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    WAN / PPPoE Config
                  </button>
                  <button
                    onClick={() => setActiveSubTab('wlan_basic')}
                    className={`w-full text-left px-4 py-2 border-l-4 ${
                      activeSubTab === 'wlan_basic' ? 'border-[#3fa7eb] bg-white text-[#3fa7eb] font-bold' : 'border-transparent text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    WLAN Basic
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    WLAN Advanced
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    Automatic WiFi...
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    WiFi Coverage
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    Route Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 border-l-4 border-transparent text-blue-700/40 cursor-not-allowed">
                    System Management
                  </button>
                </div>
              )}
            </div>

            {/* Right Pane - Content details & configuration tables (Highly Accurate!) */}
            <div className="flex-1 p-6 bg-blue-50/10 min-h-[500px] overflow-y-auto">
              
              {/* SAVING OVERLAY STATUS NOTIFIER */}
              {saveNotify && (
                <div className="mb-4 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs px-4 py-3 rounded-md flex items-center gap-2.5 shadow-sm animate-pulse">
                  <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />
                  <span className="font-semibold font-mono">{saveNotify}</span>
                </div>
              )}

              {/* Sub-menu rendering matching screenshot 1 (Device Information) */}
              {activeSubTab === 'device' && (
                <div className="space-y-4">
                  <div className="border-b border-blue-200 pb-3">
                    <h2 className="text-base font-bold text-blue-950">Device Information</h2>
                    <p className="text-xs text-blue-700">On this page, you can view basic device information.</p>
                  </div>

                  <div className="bg-white border border-blue-200 rounded shadow-sm overflow-hidden text-xs">
                    <div className="bg-blue-50 px-4 py-2 text-[10.5px] font-bold text-blue-950 border-b border-blue-200">
                      Basic Information
                    </div>
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-blue-100">
                          <td className="p-3 w-44 text-blue-800 font-semibold">Device Type:</td>
                          <td className="p-3 text-blue-950 font-bold">HS8545M5</td>
                        </tr>
                        <tr className="border-b border-blue-100 bg-blue-50/20">
                          <td className="p-3 text-blue-800 font-semibold">Description:</td>
                          <td className="p-3 text-blue-950 leading-relaxed">
                            EchoLife HS8545M5 GPON Terminal (CLASS B+/PRODUCT ID:2150083916LDLA028065/CHIP:00000120561016)
                          </td>
                        </tr>
                        <tr className="border-b border-blue-100">
                          <td className="p-3 text-blue-800 font-semibold">SN:</td>
                          <td className="p-3 text-blue-950 font-mono font-bold">
                            {selectedCustomer ? `${selectedCustomer.onuSn}` : '485754430D4AF9A4 (HWTC0D4AF9A4)'}
                          </td>
                        </tr>
                        <tr className="border-b border-blue-100 bg-blue-50/20">
                          <td className="p-3 text-blue-800 font-semibold">Hardware Version:</td>
                          <td className="p-3 text-blue-950 font-mono">182F.A</td>
                        </tr>
                        <tr className="border-b border-blue-100">
                          <td className="p-3 text-blue-800 font-semibold">Software Version:</td>
                          <td className="p-3 text-blue-950 font-mono text-cyan-700 font-bold">V5R019C20S050</td>
                        </tr>
                        <tr className="border-b border-blue-100 bg-blue-50/20">
                          <td className="p-3 text-blue-800 font-semibold">Manufacture Info:</td>
                          <td className="p-3 text-blue-900 font-mono">2150083916LDLA028065.C402</td>
                        </tr>
                        <tr className="border-b border-blue-100">
                          <td className="p-3 text-blue-800 font-semibold">ONT Registration Status:</td>
                          <td className="p-3 text-emerald-700 font-bold">O5(Operation state)</td>
                        </tr>
                        <tr className="border-b border-blue-100 bg-blue-50/20">
                          <td className="p-3 text-blue-800 font-semibold">ONT ID:</td>
                          <td className="p-3 text-blue-950 font-bold">60</td>
                        </tr>
                        <tr className="border-b border-blue-100">
                          <td className="p-3 text-blue-800 font-semibold">CPU Usage:</td>
                          <td className="p-3 text-blue-950">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-950">3%</span>
                              <div className="w-24 h-1.5 bg-blue-100 rounded overflow-hidden">
                                <div className="bg-[#3fa7eb] h-full w-[3%]" />
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-blue-100 bg-blue-50/20">
                          <td className="p-3 text-blue-800 font-semibold">Memory Usage:</td>
                          <td className="p-3 text-blue-950">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-950">47%</span>
                              <div className="w-24 h-1.5 bg-blue-100 rounded overflow-hidden">
                                <div className="bg-[#3fa7eb] h-full w-[47%]" />
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-blue-100">
                          <td className="p-3 text-blue-800 font-semibold">Custom Info:</td>
                          <td className="p-3 text-blue-900 font-semibold">COMMON</td>
                        </tr>
                        <tr className="bg-blue-50/20">
                          <td className="p-3 text-blue-800 font-semibold">System Time:</td>
                          <td className="p-3 text-blue-950 font-mono font-bold">{new Date().toLocaleString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-menu rendering matching screenshot 2 (WAN Information) */}
              {activeSubTab === 'wan' && (
                <div className="space-y-4">
                  <div className="border-b border-blue-200 pb-3">
                    <h2 className="text-base font-bold text-blue-950">WAN Information</h2>
                    <p className="text-xs text-blue-700">On this page, you can query the connection and line status of the WAN port.</p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold block text-blue-950">IPv4 Information (Click the form for details)</span>
                    
                    <div className="border border-blue-200 rounded shadow-sm overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-blue-50/50 text-blue-900 font-bold border-b border-blue-200 text-[10.5px]">
                            <th className="p-3 border-r border-blue-100">WAN Name</th>
                            <th className="p-3 border-r border-blue-100">Status</th>
                            <th className="p-3 border-r border-blue-100">IP Address</th>
                            <th className="p-3 border-r border-blue-100">VLAN/Priority</th>
                            <th className="p-3">Connect</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-blue-50 hover:bg-blue-50/30">
                            <td className="p-3 border-r border-blue-100 font-mono text-cyan-700 font-bold">1_INTERNET_R_VID_10</td>
                            <td className="p-3 border-r border-blue-100">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                Connected
                              </span>
                            </td>
                            <td className="p-3 border-r border-blue-100 font-mono font-bold text-blue-950">
                              {manualIp || '10.80.142.194'}
                            </td>
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-900">10/0</td>
                            <td className="p-3 font-mono text-blue-900">AlwaysOn</td>
                          </tr>
                          <tr className="border-b border-blue-50 hover:bg-blue-50/30">
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-800">2_VOIP_R_VID_20</td>
                            <td className="p-3 border-r border-blue-100">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                Connected
                              </span>
                            </td>
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-800">10.90.51.105</td>
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-800">20/6</td>
                            <td className="p-3 font-mono text-blue-800">AlwaysOn</td>
                          </tr>
                          <tr className="border-b border-blue-50 hover:bg-blue-50/30">
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-600/70">3_IPTV_B_VID_30</td>
                            <td className="p-3 border-r border-blue-100">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                Connected
                              </span>
                            </td>
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-600/70">--</td>
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-600/70">30/3</td>
                            <td className="p-3 font-mono text-blue-600/70">AlwaysOn</td>
                          </tr>
                          <tr className="hover:bg-blue-50/30">
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-600/70">4_OTHER_B_VID_20</td>
                            <td className="p-3 border-r border-blue-100">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                Connected
                              </span>
                            </td>
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-600/70">--</td>
                            <td className="p-3 border-r border-blue-100 font-mono text-blue-600/70">20/6</td>
                            <td className="p-3 font-mono text-blue-600/70">AlwaysOn</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-menu rendering matching screenshot 5 (Optical Information) */}
              {activeSubTab === 'optical' && (
                <div className="space-y-4">
                  <div className="border-b border-blue-200 pb-3">
                    <h2 className="text-base font-bold text-blue-950">Optical Information</h2>
                    <p className="text-xs text-blue-700">On this page, you can query the status of the optical module.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="bg-blue-50 px-3 py-1.5 text-[10.5px] font-bold text-blue-950 border border-blue-200 border-b-0 rounded-t">
                        ONT Information
                      </div>
                      <div className="border border-blue-200 bg-white shadow-sm rounded-b overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-blue-50/50 text-blue-900 font-bold border-b border-blue-200 text-[10px]">
                              <th className="p-2.5 border-r border-blue-100">Parameter</th>
                              <th className="p-2.5 border-r border-blue-100">Current Value</th>
                              <th className="p-2.5">Reference Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-blue-50 hover:bg-blue-50/30">
                              <td className="p-2.5 border-r border-blue-100 text-blue-900">Optical Signal Sending Status:</td>
                              <td className="p-2.5 border-r border-blue-100 font-bold text-blue-950">Auto</td>
                              <td className="p-2.5 font-mono text-blue-800">Auto</td>
                            </tr>
                            <tr className="border-b border-blue-50 hover:bg-blue-50/30 bg-blue-50/10">
                              <td className="p-2.5 border-r border-blue-100 text-blue-900">TX Optical Power:</td>
                              <td className="p-2.5 border-r border-blue-100 font-mono font-bold text-blue-950">2.08 dBm</td>
                              <td className="p-2.5 font-mono text-blue-800">0.5 to 5 dBm</td>
                            </tr>
                            <tr className="border-b border-blue-50 hover:bg-blue-50/30">
                              <td className="p-2.5 border-r border-blue-100 text-blue-900">RX Optical Power:</td>
                              <td className={`p-2.5 border-r border-blue-100 font-mono font-black ${
                                selectedCustomer && selectedCustomer.opticalPower < -26 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'
                              }`}>
                                {selectedCustomer ? `${selectedCustomer.opticalPower} dBm` : '-14.93 dBm'}
                              </td>
                              <td className="p-2.5 font-mono text-blue-800">-27 to -8 dBm</td>
                            </tr>
                            <tr className="border-b border-blue-50 hover:bg-blue-50/30 bg-blue-50/10">
                              <td className="p-2.5 border-r border-blue-100 text-blue-900">Working Voltage:</td>
                              <td className="p-2.5 border-r border-blue-100 font-mono text-blue-950">3338 mV</td>
                              <td className="p-2.5 font-mono text-blue-800">3100 to 3500 mV</td>
                            </tr>
                            <tr className="border-b border-blue-50 hover:bg-blue-50/30">
                              <td className="p-2.5 border-r border-blue-100 text-blue-900">Bias Current:</td>
                              <td className="p-2.5 border-r border-blue-100 font-mono text-blue-950">18 mA</td>
                              <td className="p-2.5 font-mono text-blue-800">0 to 90 mA</td>
                            </tr>
                            <tr className="border-b border-blue-50 hover:bg-blue-50/30 bg-blue-50/10">
                              <td className="p-2.5 border-r border-blue-100 text-blue-900">Working Temperature:</td>
                              <td className="p-2.5 border-r border-blue-100 font-mono text-blue-950">62 °C</td>
                              <td className="p-2.5 font-mono text-blue-800">-10 to +85 °C</td>
                            </tr>
                            <tr className="border-b border-blue-50 hover:bg-blue-50/30">
                              <td className="p-2.5 border-r border-blue-100 text-blue-600/70">CATV RX Power:</td>
                              <td className="p-2.5 border-r border-blue-100 text-blue-600/70">-- dBm</td>
                              <td className="p-2.5 text-blue-600/70 font-mono">--</td>
                            </tr>
                            <tr className="hover:bg-blue-50/30 bg-blue-50/10">
                              <td className="p-2.5 border-r border-blue-100 text-blue-600/70">CATV Output Power:</td>
                              <td className="p-2.5 border-r border-blue-100 text-blue-600/70">-- dBmv</td>
                              <td className="p-2.5 text-blue-600/70 font-mono">--</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-menu rendering matching screenshot 3 (Home Page diagram) */}
              {activeSubTab === 'home_page' && (
                <div className="space-y-5">
                  <div className="border-b border-blue-200 pb-3 flex justify-between items-center">
                    <div>
                      <h2 className="text-base font-bold text-blue-950">Home Page</h2>
                      <p className="text-xs text-blue-700">Graphical connection mapping and diagnostic status.</p>
                    </div>
                    <div className="font-mono text-[11px] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-blue-900">
                      Network Status: <span className="font-bold text-emerald-600">normal</span>
                    </div>
                  </div>

                  {/* Graphic emulation wrapper */}
                  <div className="bg-blue-50/10 rounded-xl p-6 border border-blue-200 flex flex-col items-center">
                    
                    {/* Top Nodes */}
                    <div className="grid grid-cols-2 gap-32 mb-10">
                      
                      {/* Internet node */}
                      <div className="flex flex-col items-center text-center space-y-1">
                        <div className="w-16 h-16 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white shadow-md animate-pulse">
                          <Globe className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Internet</span>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">Online</span>
                      </div>

                      {/* Wi-Fi configuration node */}
                      <div className="flex flex-col items-center text-center space-y-1">
                        <div className="w-16 h-16 rounded-full bg-cyan-500 border-4 border-white flex items-center justify-center text-white shadow-md">
                          <Wifi className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Wi-Fi Active</span>
                        <span className="text-[10px] text-cyan-700 font-mono font-bold">{ssidName}</span>
                      </div>

                    </div>

                    {/* Blue router device box representation */}
                    <div className="relative w-full max-w-md bg-cyan-500 rounded-2xl p-5 border-4 border-white shadow-lg text-white flex justify-between items-center mb-8">
                      {/* Left circular dial power */}
                      <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center border border-blue-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>

                      {/* LAN ports indicators matching HS8545M5 panel */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center font-mono text-[9px]">
                          <div className="w-6 h-5 bg-blue-950 border border-blue-200 rounded flex items-center justify-center">
                            <span className="text-emerald-400 font-bold">1</span>
                          </div>
                          <span className="mt-1 font-bold text-white/90">LAN1</span>
                        </div>
                        <div className="flex flex-col items-center font-mono text-[9px]">
                          <div className="w-6 h-5 bg-blue-950 border border-blue-200 rounded flex items-center justify-center">
                            <span className="text-emerald-400 font-bold">2</span>
                          </div>
                          <span className="mt-1 font-bold text-white/90">LAN2</span>
                        </div>
                        <div className="flex flex-col items-center font-mono text-[9px]">
                          <div className="w-6 h-5 bg-blue-950 border border-blue-200 rounded flex items-center justify-center">
                            <span className="text-emerald-400 font-bold">3</span>
                          </div>
                          <span className="mt-1 font-bold text-white/90">LAN3</span>
                        </div>
                        <div className="flex flex-col items-center font-mono text-[9px]">
                          <div className="w-6 h-5 bg-blue-950 border border-blue-200 rounded flex items-center justify-center">
                            <span className="text-blue-300">X</span>
                          </div>
                          <span className="mt-1 font-bold text-white/60">LAN4</span>
                        </div>
                      </div>

                      {/* USB Indicator */}
                      <div className="bg-blue-950/40 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                        USB
                      </div>

                      {/* Reset logo */}
                      <div className="w-6 h-6 rounded-full bg-[#f43f5e] flex items-center justify-center border border-white text-white font-bold text-[9px]" title="Reset">
                        RESET
                      </div>
                    </div>

                    {/* Sub-Devices connected mapping */}
                    <div className="w-full border-t border-blue-200 pt-5 mt-2 text-center">
                      <span className="text-[10px] font-bold text-blue-700/80 uppercase font-mono tracking-wider">
                        // DAFTAR PERANGKAT YANG TERHUBUNG (ASSOCIATED CLIENTS)
                      </span>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 text-xs font-mono">
                        <div className="bg-white p-2.5 rounded shadow-sm border border-blue-100">
                          <span className="font-bold text-blue-950 block">Siti-iPhone</span>
                          <span className="text-[10px] text-blue-700 block mt-0.5">192.168.100.22</span>
                          <span className="text-[9px] text-cyan-600 font-bold block mt-1">Wifi Client</span>
                        </div>
                        <div className="bg-white p-2.5 rounded shadow-sm border border-blue-100">
                          <span className="font-bold text-blue-950 block">SmartTV-4K</span>
                          <span className="text-[10px] text-blue-700 block mt-0.5">192.168.100.8</span>
                          <span className="text-[9px] text-emerald-600 font-bold block mt-1">LAN 1 (Ethernet)</span>
                        </div>
                        <div className="bg-white p-2.5 rounded shadow-sm border border-blue-100">
                          <span className="font-bold text-blue-950 block">PC-Workstation</span>
                          <span className="text-[10px] text-blue-700 block mt-0.5">192.168.100.125</span>
                          <span className="text-[9px] text-emerald-600 font-bold block mt-1">LAN 2 (Ethernet)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Sub-menu rendering matching screenshot 4 (One-Click Diagnosis) */}
              {activeSubTab === 'one_click_diag' && (
                <div className="space-y-4">
                  <div className="border-b border-blue-200 pb-3">
                    <h2 className="text-base font-bold text-blue-950">One-Click Diagnosis</h2>
                    <p className="text-xs text-blue-700">Automated diagnostic and troubleshooting for professional engineers.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Caution box */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-900 leading-relaxed text-[11px]">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Attention Warning:</strong> This diagnosis method applies for only a professional engineer and it affects data services. Therefore, exercise caution when you use this diagnosis method.
                      </span>
                    </div>

                    {/* Step display representation */}
                    <div className="bg-white border border-blue-200 p-6 rounded-xl shadow-sm space-y-6 flex flex-col items-center justify-center">
                      
                      <div className="flex items-center gap-6 justify-center w-full max-w-md select-none">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-[#3fa7eb] text-[#3fa7eb] flex items-center justify-center font-bold text-sm">
                            1
                          </div>
                          <span className="text-[10px] text-blue-800 mt-1 uppercase font-bold">WAN</span>
                        </div>
                        <div className="h-[2px] bg-blue-100 flex-1" />
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-[#3fa7eb] text-[#3fa7eb] flex items-center justify-center font-bold text-sm">
                            2
                          </div>
                          <span className="text-[10px] text-blue-800 mt-1 uppercase font-bold">ONT</span>
                        </div>
                        <div className="h-[2px] bg-blue-100 flex-1" />
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-400 flex items-center justify-center font-bold text-sm">
                            3
                          </div>
                          <span className="text-[10px] text-blue-800 mt-1 uppercase font-bold">LAN</span>
                        </div>
                      </div>

                      {diagPhase === 'idle' && (
                        <button
                          onClick={runOneClickDiagnosis}
                          className="px-6 py-2.5 bg-[#3fa7eb] hover:bg-[#3296db] text-white font-bold rounded shadow-md transition-colors cursor-pointer text-xs"
                        >
                          One-Click Diagnosis
                        </button>
                      )}

                      {diagPhase === 'running' && (
                        <div className="w-full max-w-sm space-y-3 font-mono">
                          <div className="flex justify-between font-bold text-[11px] text-blue-950">
                            <span>Melakukan Pemindaian Jaringan...</span>
                            <span>{diagProgress}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-blue-50 rounded-full overflow-hidden border border-blue-100">
                            <div className="bg-[#3fa7eb] h-full transition-all duration-300" style={{ width: `${diagProgress}%` }} />
                          </div>
                          
                          <div className="h-28 overflow-y-auto bg-blue-950 text-cyan-300 text-[10px] p-3 rounded leading-relaxed border border-blue-800 space-y-1">
                            {diagLogs.map((log, idx) => (
                              <div key={idx}>{log}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {diagPhase === 'completed' && (
                        <div className="text-center space-y-4 font-mono">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px]">
                            <CheckCircle className="w-4 h-4" />
                            DIAGNOSIS COMPLETE: ALL PASSED
                          </div>

                          <div className="bg-blue-50/20 p-4 border border-blue-100 rounded text-left space-y-1.5 text-[10.5px] text-blue-900 w-72">
                            <div className="flex justify-between">
                              <span>Optical Status:</span>
                              <strong className="text-emerald-700">PASSED</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>WAN Link PPP:</span>
                              <strong className="text-emerald-700">CONNECTED</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Hardware Transceiver:</span>
                              <strong className="text-emerald-700">OPTIMAL</strong>
                            </div>
                          </div>

                          <button
                            onClick={() => setDiagPhase('idle')}
                            className="px-4 py-2 border border-blue-200 text-blue-700 rounded hover:bg-blue-50 text-xs font-bold transition-all cursor-pointer"
                          >
                            Uji Diagnostik Lagi
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* Sub-menu rendering matching screenshot 7 (LAN layer 2/3 configuration) */}
              {activeSubTab === 'layer_port' && (
                <div className="space-y-4">
                  <div className="border-b border-blue-200 pb-3">
                    <h2 className="text-base font-bold text-blue-950">Layer 2/3 Port Configuration</h2>
                    <p className="text-xs text-blue-700">On this page, you can configure LAN ports as Layer 3 ports by selecting the corresponding check boxes.</p>
                  </div>

                  <div className="bg-white border border-blue-200 rounded shadow-sm p-5 space-y-5 text-xs text-blue-950">
                    
                    <div className="flex gap-8 border-b pb-4 border-blue-100">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#3fa7eb]" />
                        <span>LAN1 Port (Layer 3)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#3fa7eb]" />
                        <span>LAN2 Port (Layer 3)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#3fa7eb]" />
                        <span>LAN3 Port (Layer 3)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#3fa7eb]" />
                        <span>LAN4 Port (Layer 3)</span>
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSaveNotify('Konfigurasi LAN berhasil disimpan!');
                          setTimeout(() => setSaveNotify(null), 3000);
                        }}
                        className="px-5 py-2 bg-[#3fa7eb] hover:bg-[#3296db] text-white font-bold rounded shadow-sm cursor-pointer"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        className="px-5 py-2 border border-blue-200 text-blue-700 rounded hover:bg-blue-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Sub-menu rendering matching screenshot 6 (WAN PPPoE / settings) */}
              {activeSubTab === 'wan_pppoe' && (
                <div className="space-y-4">
                  <div className="border-b border-blue-200 pb-3">
                    <h2 className="text-base font-bold text-blue-950">WAN Configuration (PPP Details)</h2>
                    <p className="text-xs text-blue-700">Configure PPPoE credentials, authentication, VLAN IDs, and service modes.</p>
                  </div>

                  <div className="bg-white border border-blue-200 rounded shadow-sm p-5 space-y-4 text-xs text-blue-950">
                    
                    <div className="bg-blue-50/40 p-3 border border-blue-100 rounded text-[10.5px] text-blue-800 leading-relaxed italic mb-1">
                      // PERINGATAN NOC: Memodifikasi parameter ini secara salah dapat memutuskan sambungan broadband optik pelanggan.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="block font-bold text-blue-900">Enable WAN Connection</label>
                        <input
                          type="checkbox"
                          checked={isWanEnabled}
                          onChange={(e) => setIsWanEnabled(e.target.checked)}
                          className="w-4 h-4 accent-[#3fa7eb]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-blue-900">Encapsulation Mode</label>
                        <select className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-xs text-blue-950 font-bold">
                          <option value="PPPoE">PPPoE (Broadband Dial-up)</option>
                          <option value="IPoE">IPoE (DHCP Dynamic/Static)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-blue-900">WAN Mode</label>
                        <select className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-xs text-blue-950 font-bold">
                          <option value="Route">Route WAN (Router Gateway Mode)</option>
                          <option value="Bridge">Bridge WAN (Access Point Mode)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-blue-900">VLAN ID (Tagging)</label>
                        <input
                          type="number"
                          value={vlanId}
                          onChange={(e) => setVlanId(parseInt(e.target.value) || 10)}
                          className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-xs text-blue-950 font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block font-bold text-blue-900">PPPoE Username</label>
                        <input
                          type="text"
                          value={pppoeUser}
                          onChange={(e) => setPppoeUser(e.target.value)}
                          className="w-full bg-white border border-blue-200 rounded px-2.5 py-2 text-xs font-mono font-bold text-cyan-700"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block font-bold text-blue-900">PPPoE Password</label>
                        <input
                          type="password"
                          value={pppoePass}
                          onChange={(e) => setPppoePass(e.target.value)}
                          className="w-full bg-white border border-blue-200 rounded px-2.5 py-2 text-xs font-mono font-bold"
                        />
                      </div>

                    </div>

                    <div className="flex gap-3 pt-3 border-t border-blue-100">
                      <button
                        type="button"
                        onClick={() => handleSaveOntSettings('pppoe')}
                        className="px-5 py-2 bg-[#3fa7eb] hover:bg-[#3296db] text-white font-bold rounded shadow-sm cursor-pointer"
                      >
                        Apply Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCustomer) syncFormFields(selectedCustomer);
                        }}
                        className="px-5 py-2 border border-blue-200 text-blue-700 rounded hover:bg-blue-50 cursor-pointer"
                      >
                        Reset Form
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Sub-menu rendering matching screenshot 8 (WLAN Basic settings) */}
              {activeSubTab === 'wlan_basic' && (
                <div className="space-y-4">
                  <div className="border-b border-blue-200 pb-3">
                    <h2 className="text-base font-bold text-blue-950">WLAN Basic Configuration</h2>
                    <p className="text-xs text-blue-700">Configure core wireless parameters, SSIDs, passwords, and security channels.</p>
                  </div>

                  <div className="bg-white border border-blue-200 rounded shadow-sm p-5 space-y-4 text-xs text-blue-950">
                    
                    <div className="space-y-1.5">
                      <label className="block font-bold text-blue-900">Enable WLAN Radio</label>
                      <input
                        type="checkbox"
                        checked={isWlanEnabled}
                        onChange={(e) => setIsWlanEnabled(e.target.checked)}
                        className="w-4 h-4 accent-[#3fa7eb]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="block font-bold text-blue-900">SSID Name (WiFi Name)</label>
                        <input
                          type="text"
                          value={ssidName}
                          onChange={(e) => setSsidName(e.target.value)}
                          className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-xs text-blue-950 font-bold font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-blue-900">Max Associated Devices</label>
                        <input
                          type="number"
                          readOnly
                          value={32}
                          className="w-full bg-blue-50/20 border border-blue-100 rounded px-2 py-1.5 text-xs text-blue-800/60 font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-blue-900">Security Mode (Authentication)</label>
                        <select className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-xs text-blue-950 font-bold">
                          <option value="WPA2">WPA/WPA2 PreSharedKey (Recommended)</option>
                          <option value="WEP">WEP Key Legacy (Unsecured)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-blue-900">Encryption Mode</label>
                        <select className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-xs text-blue-950 font-bold">
                          <option value="TKIPAES">TKIP & AES</option>
                          <option value="AES">AES Only</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block font-bold text-blue-900">WPA PreSharedKey (WiFi Password)</label>
                        <input
                          type="text"
                          value={wifiPassword}
                          onChange={(e) => setWifiPassword(e.target.value)}
                          className="w-full bg-white border border-blue-200 rounded px-2.5 py-2 text-xs font-mono font-bold"
                        />
                      </div>

                    </div>

                    <div className="flex gap-3 pt-3 border-t border-blue-100">
                      <button
                        type="button"
                        onClick={() => handleSaveOntSettings('wifi')}
                        className="px-5 py-2 bg-[#3fa7eb] hover:bg-[#3296db] text-white font-bold rounded shadow-sm cursor-pointer"
                      >
                        Apply Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCustomer) syncFormFields(selectedCustomer);
                        }}
                        className="px-5 py-2 border border-blue-200 text-blue-700 rounded hover:bg-blue-50 cursor-pointer"
                      >
                        Reset Form
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>

          </div>

          {/* 3. FOOTER */}
          <div className="bg-[#edf3f9] text-blue-800/80 py-3 px-5 text-center text-[10px] font-bold border-t border-blue-200 flex justify-between uppercase">
            <span>HUAWEI HS8545M5 GIGABIT PORT MANAGER</span>
            <span>ISP BACKBONE NOC TELEMETRY PORTAL © 2026</span>
          </div>

        </div>
      )}

    </div>
  );
}
