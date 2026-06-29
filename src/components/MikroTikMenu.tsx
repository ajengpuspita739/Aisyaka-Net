import React, { useState, useEffect, useRef } from 'react';
import { Customer, Region } from '../types';
import { 
  Cpu, Server, Database, Terminal, Shield, RefreshCw, Sliders, Play, Check, 
  Trash2, Plus, Edit2, Search, HelpCircle, Save, Wifi, Ban, UserCheck, Activity,
  Lock, LockOpen, Info
} from 'lucide-react';
import NeonBox from './NeonBox';

interface MikroTikMenuProps {
  customers: Customer[];
  regions: Region[];
  onUpdateCustomer: (updated: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
}

interface MikrotikRouter {
  id: string;
  name: string;
  model: string;
  rosVersion: string;
  ipAddress: string;
  region: Region;
  cpuCores: number;
  cpuLoad: number;
  ramTotal: number; // in MB
  ramFree: number;  // in MB
  diskTotal: number; // in MB
  diskFree: number;  // in MB
  uptime: string;
  status: 'online' | 'rebooting' | 'error';
}

// PPPoE Secret locally managed
interface PppoeSecret {
  name: string;
  password: string;
  service: string;
  profile: string;
  vlanId: number;
  rateLimit: string; // e.g. "50M/50M"
  comment: string;
}

// IP Pool standard
interface IpPool {
  name: string;
  ranges: string;
  vlan: number;
}

export default function MikroTikMenu({
  customers,
  regions,
  onUpdateCustomer,
  onDeleteCustomer,
}: MikroTikMenuProps) {
  // 1. Initial State for Router lists
  const [routers, setRouters] = useState<MikrotikRouter[]>([
    {
      id: 'MT-CCR-01',
      name: 'CCR-CKR-SUKATANI-01',
      model: 'MikroTik CCR2116-12G-4S+',
      rosVersion: 'RouterOS v7.14.3 (stable)',
      ipAddress: '10.10.10.1',
      region: 'CIKARANG Desa Sukatani',
      cpuCores: 16,
      cpuLoad: 12,
      ramTotal: 16384,
      ramFree: 13950,
      diskTotal: 128,
      diskFree: 112,
      uptime: '47d 18h 32m',
      status: 'online',
    },
    {
      id: 'MT-CCR-02',
      name: 'CCR-BKS-JATIMAKMUR-01',
      model: 'MikroTik CCR2004-16G-2S+',
      rosVersion: 'RouterOS v7.12.1 (stable)',
      ipAddress: '10.10.10.2',
      region: 'BEKASI wilayah Jatimakmur',
      cpuCores: 4,
      cpuLoad: 45,
      ramTotal: 4096,
      ramFree: 2210,
      diskTotal: 128,
      diskFree: 96,
      uptime: '14d 06h 11m',
      status: 'online',
    },
    {
      id: 'MT-CCR-03',
      name: 'CCR-BKS-JATIASIH-01',
      model: 'MikroTik CCR1009-7G-1C-1S+',
      rosVersion: 'RouterOS v6.49.10 (long-term)',
      ipAddress: '10.10.10.3',
      region: 'BEKASI wilayah Jatiasih',
      cpuCores: 9,
      cpuLoad: 18,
      ramTotal: 2048,
      ramFree: 1480,
      diskTotal: 128,
      diskFree: 104,
      uptime: '119d 22h 45m',
      status: 'online',
    },
    {
      id: 'MT-CCR-04',
      name: 'CCR-BKS-DEWISARTIKA-01',
      model: 'MikroTik CCR1036-12G-4S',
      rosVersion: 'RouterOS v7.14.3 (stable)',
      ipAddress: '10.10.10.4',
      region: 'BEKASI wilayah Dewi sartika',
      cpuCores: 36,
      cpuLoad: 8,
      ramTotal: 4096,
      ramFree: 3120,
      diskTotal: 1024,
      diskFree: 910,
      uptime: '280d 04h 15m',
      status: 'online',
    },
    {
      id: 'MT-CCR-05',
      name: 'CCR-CKR-CIBARUSAH-01',
      model: 'MikroTik CCR1036-8G-2S+',
      rosVersion: 'RouterOS v7.14.1 (stable)',
      ipAddress: '10.10.10.5',
      region: 'CIKARANG Desa Cibarusah',
      cpuCores: 36,
      cpuLoad: 25,
      ramTotal: 4096,
      ramFree: 2890,
      diskTotal: 1024,
      diskFree: 885,
      uptime: '3d 11h 22m',
      status: 'online',
    },
    {
      id: 'MT-CCR-06',
      name: 'CCR-CKR-JATIBARU-01',
      model: 'MikroTik RB4011iGS+RM',
      rosVersion: 'RouterOS v7.15 (stable)',
      ipAddress: '10.10.10.6',
      region: 'CIKARANG Desa Jatibaru',
      cpuCores: 4,
      cpuLoad: 38,
      ramTotal: 1024,
      ramFree: 540,
      diskTotal: 512,
      diskFree: 412,
      uptime: '92d 19h 08m',
      status: 'online',
    },
  ]);

  const [selectedRouterId, setSelectedRouterId] = useState<string>('MT-CCR-01');
  const [activeRouterTab, setActiveRouterTab] = useState<'status' | 'secrets' | 'active' | 'firewall' | 'terminal'>('status');

  // Interactive configurations lists state
  const selectedRouter = routers.find(r => r.id === selectedRouterId) || routers[0];

  // Fluctuating metric simulation timers
  useEffect(() => {
    const timer = setInterval(() => {
      setRouters(prev => prev.map(r => {
        if (r.status === 'rebooting') return r;
        const loadChange = Math.floor(Math.random() * 7) - 3;
        const newLoad = Math.max(3, Math.min(95, r.cpuLoad + loadChange));
        const freeRamChange = Math.floor(Math.random() * 21) - 10;
        const newFreeRam = Math.max(100, Math.min(r.ramTotal - 200, r.ramFree + freeRamChange));
        return {
          ...r,
          cpuLoad: newLoad,
          ramFree: newFreeRam
        };
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Search, filtration & selection
  const [secretSearch, setSecretSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const secretsPerPage = 10;

  // Selected secret for detailed editing form
  const [editingSecretUser, setEditingSecretUser] = useState<string | null>(null);
  const [editingSecretPass, setEditingSecretPass] = useState('');
  const [editingSecretSpeed, setEditingSecretSpeed] = useState('50M/50M');
  const [editingSecretVlan, setEditingSecretVlan] = useState(200);
  const [editingSecretProfile, setEditingSecretProfile] = useState('Profile_3HighSpeed_Broadband');
  const [editingSecretStatus, setEditingSecretStatus] = useState<'connected' | 'disconnected'>('connected');

  // Non-blocking iframe safe deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Alert & process notification systems
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Secret creation model
  const [showAddSecretModal, setShowAddSecretModal] = useState(false);
  const [newSecName, setNewSecName] = useState('');
  const [newSecPass, setNewSecPass] = useState('');
  const [newSecSpeed, setNewSecSpeed] = useState('30 Mbps');
  const [newSecVlan, setNewSecVlan] = useState(200);
  const [newSecProfile, setNewSecProfile] = useState('Profile_3HighSpeed_Broadband');
  const [newSecRegion, setNewSecRegion] = useState<Region>('BEKASI wilayah Jatimakmur');

  // Terminal history
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `MikroTik v7.14.3 (stable) console`,
    `Handshaking secure API port 8728... Connection established.`,
    `Type /help or use UI buttons below to launch RouterOS scripting.`,
    `[admin@${selectedRouter.name}] > `
  ]);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll terminal to bottom
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Sync selected router when changed tab is terminal
  useEffect(() => {
    setTerminalLogs([
      `MikroTik RouterOS console connected to [admin@${selectedRouter.name}] IP: ${selectedRouter.ipAddress}`,
      `RosVersion: ${selectedRouter.rosVersion} | Hardware: ${selectedRouter.model}`,
      `Handshaking secure API port 8728... Connection established.`,
      `[admin@${selectedRouter.name}] > `
    ]);
  }, [selectedRouterId]);

  // Filter regional subscribers registered on selected Router's region
  const routerSubscribers = customers.filter(c => c.region === selectedRouter.region);
  
  // Apply Search to regional secrets
  const filteredSubs = routerSubscribers.filter(c => {
    const q = secretSearch.toLowerCase();
    const matchesUser = (c.pppoeUsername?.toLowerCase() || '').includes(q) || c.id.toLowerCase().includes(q);
    const matchesName = c.name.toLowerCase().includes(q);
    return matchesUser || matchesName;
  });

  const totalSecrets = filteredSubs.length;
  const totalSecPages = Math.ceil(totalSecrets / secretsPerPage) || 1;
  const startSecIdx = (currentPage - 1) * secretsPerPage;
  const pagedSubs = filteredSubs.slice(startSecIdx, startSecIdx + secretsPerPage);

  // Handle opening subscriber credentials for modification
  const handleEditSecret = (cust: Customer) => {
    setEditingSecretUser(cust.id);
    setEditingSecretPass(cust.pppoePassword || '');
    setEditingSecretSpeed(cust.packageSpeed);
    setEditingSecretVlan(cust.vlanId || 200);
    setEditingSecretProfile(cust.pppServicePreset || 'PPPoE_HSIA_VLAN_100');
    setEditingSecretStatus(cust.pppStatus === 'connected' ? 'connected' : 'disconnected');
  };

  // Save modified credentials
  const handleSaveSecretChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSecretUser) return;

    setIsProcessing(true);
    setActionSuccessMsg(null);

    const target = customers.find(c => c.id === editingSecretUser);
    if (target) {
      setTimeout(() => {
        // Prepare updated subscriber object
        const updatedCustomer: Customer = {
          ...target,
          pppoePassword: editingSecretPass,
          packageSpeed: editingSecretSpeed,
          vlanId: Number(editingSecretVlan),
          pppServicePreset: editingSecretProfile,
          pppStatus: editingSecretStatus === 'connected' ? 'connected' : 'disconnected',
          // Synchronize network operational status with authentication status
          status: editingSecretStatus === 'connected' ? 'online' : 'offline',
          opticalPower: editingSecretStatus === 'connected' ? -20.5 : -40.0
        };

        // Fire parent handler
        onUpdateCustomer(updatedCustomer);
        
        setIsProcessing(false);
        setActionSuccessMsg(`SUKSES: Akun PPPoE ${target.pppoeUsername} berhasil diperbarui di database RouterBOARD!`);
        setEditingSecretUser(null);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }, 700);
    }
  };

  // Add a totally new PPPoE subscriber secret profile!
  const handleAddSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecName || !newSecPass) return;

    setIsProcessing(true);
    const generatedId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const cleanNick = newSecName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const pppUsername = `${cleanNick}@aisyaka.net`;
    const randOnuSn = `ZTEG${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

    setTimeout(() => {
      const newCustomer: Customer = {
        id: generatedId,
        name: newSecName,
        region: newSecRegion,
        address: `Jl. Kehormatan Raya No.${Math.floor(Math.random() * 100) + 1}, Area ${newSecRegion}`,
        packageSpeed: newSecSpeed,
        status: 'online',
        opticalPower: -20.2,
        phone: `0812-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        ipAddress: `10.${110 + (regions.indexOf(newSecRegion) * 10)}.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`,
        onuSn: randOnuSn,
        ontModel: 'ZTE F670L Dual Band',
        oltId: 'OLT-' + newSecRegion.substring(0,3).toUpperCase() + '-01',
        pppoeUsername: pppUsername,
        pppoePassword: newSecPass,
        vlanId: Number(newSecVlan),
        pppServicePreset: newSecProfile,
        pppStatus: 'connected'
      };

      onUpdateCustomer(newCustomer);
      setIsProcessing(false);
      setShowAddSecretModal(false);
      setActionSuccessMsg(`SUKSES: Akun PPPoE Baru [ ${pppUsername} ] terdaftar di ${newSecRegion}!`);
      
      // Reset inputs
      setNewSecName('');
      setNewSecPass('');
      
      setTimeout(() => setActionSuccessMsg(null), 5000);
    }, 800);
  };

  // Disconnect / Kick Connection Simulation
  const handleKickSession = (cust: Customer) => {
    setIsProcessing(true);
    setActionSuccessMsg(null);

    // Write terminal logs if connected to terminal
    setTerminalLogs(prev => [
      ...prev,
      `/interface pppoe-server active-connections remove [find user="${cust.pppoeUsername}"]`,
      `[STATUS] PPPoE Session kicked-off for subscriber ${cust.pppoeUsername}.`
    ]);

    setTimeout(() => {
      // Temporarily mark disconnecting
      const updatedCust: Customer = {
        ...cust,
        pppStatus: 'authenticating'
      };
      onUpdateCustomer(updatedCust);

      // Reconnect after brief interval
      setTimeout(() => {
        onUpdateCustomer({
          ...cust,
          pppStatus: 'connected',
          status: 'online',
          opticalPower: -21.4
        });
        setTerminalLogs(prev => [
          ...prev,
          `[RADIUS] Sesi Baru Terotentikasi: ${cust.pppoeUsername} - IP: ${cust.ipAddress} - Calling-Station-ID: ${cust.onuSn}`,
          `[admin@${selectedRouter.name}] > `
        ]);
      }, 1500);

      setIsProcessing(false);
      setActionSuccessMsg(`DISPATCH: Sesi PPPoE ${cust.pppoeUsername} ditendang (re-binding lease active)!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }, 600);
  };

  // Reboot RouterBOARD Simulation
  const triggerRebootRouter = (id: string) => {
    setRouters(prev => prev.map(r => r.id === id ? { ...r, status: 'rebooting', cpuLoad: 0, uptime: '0s' } : r));
    setActionSuccessMsg(`SIGNAL: Mengirimkan perintah reboot keras ke ${selectedRouter.name}...`);
    
    setTerminalLogs(prev => [
      ...prev,
      `/system reboot`,
      `WARNING: RouterBOARD is going down for reboot IMMEDIATELY...`,
      `Closing API session.`
    ]);

    setTimeout(() => {
      setRouters(prev => prev.map(r => r.id === id ? { ...r, status: 'online', uptime: '10s', cpuLoad: 15 } : r));
      setActionSuccessMsg(`RECOVERY: RouterBOARD ${selectedRouter.name} kembali online setelah reboot!`);
      
      setTerminalLogs(prev => [
        `System reloaded. MikroTik RouterConfig console ready.`,
        `[admin@${selectedRouter.name}] > `
      ]);

      setTimeout(() => setActionSuccessMsg(null), 4000);
    }, 4000);
  };

  // Run terminal commands
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const outputLogs = [...terminalLogs, `${cmd}`];
    setTerminalInput('');

    // Pre-calculated outputs based on MikroTik command structures
    let response = `Error: bad command suffix or path prefix.`;
    const parts = cmd.toLowerCase().split(' ');

    if (cmd === '/system resource print') {
      response = 
        `          uptime: ${selectedRouter.uptime}\n` +
        `         version: ${selectedRouter.rosVersion}\n` +
        `      build-time: Jun/10/2026 12:45:10\n` +
        `     free-memory: ${(selectedRouter.ramFree / 1024).toFixed(2)} GiB\n` +
        `    total-memory: ${(selectedRouter.ramTotal / 1024).toFixed(2)} GiB\n` +
        `             cpu: tile\n` +
        `       cpu-count: ${selectedRouter.cpuCores}\n` +
        `        cpu-load: ${selectedRouter.cpuLoad}%\n` +
        `  free-hdd-space: ${selectedRouter.diskFree} MiB\n` +
        ` total-hdd-space: ${selectedRouter.diskTotal} MiB`;
    } else if (cmd === '/interface pppoe-server server print') {
      response = 
        `Flags: X - disabled, I - invalid, J - dynamic\n` +
        ` #   INTERFACE            SERVICE-NAME      MAX-MTU   MRRU      AUTHENTICATION\n` +
        ` 0   VLAN-${selectedRouter.region.replace(' ', '_')}   pppoe-service     1480      disabled  pap, chap, mschap2`;
    } else if (cmd === '/ip pool print') {
      const regIdx = regions.indexOf(selectedRouter.region);
      response = 
        ` #   NAME          RANGES\n` +
        ` 0   pool_HSIA     10.${110 + regIdx * 10}.1.2-10.${110 + regIdx * 10}.254.254`;
    } else if (cmd === '/interface pppoe-server active print' || cmd === '/ppp active print') {
      response = ` #   USER                    SERVICE  CALLING-SIDE    ADDRESS         UPTIME\n`;
      routerSubscribers.forEach((c, i) => {
        if (c.status === 'online') {
          response += ` ${i}   ${(c.pppoeUsername || '').padEnd(24)} pppoe    ${c.onuSn.substring(0,12).padEnd(15)} ${c.ipAddress.padEnd(15)} ${Math.floor(i * 1.5) + 1}h ${i % 60}m\n`;
        }
      });
    } else if (cmd.startsWith('/tool ping')) {
      const address = parts[2] || '8.8.8.8';
      response = 
        `  SEQ HOST                                    SIZE TTL TIME  STATUS\n` +
        `    0 ${address}                                  56  64 5ms   ok\n` +
        `    1 ${address}                                  56  64 4ms   ok\n` +
        `    2 ${address}                                  56  64 5ms   ok\n` +
        `    3 ${address}                                  56  64 6ms   ok\n` +
        `    sent=4 received=4 packet-loss=0% min-rtt=4ms avg-rtt=5ms max-rtt=6ms`;
    } else if (cmd === '/help') {
      response = 
        `Daftar pintasan skrip RouterOS AISYAKA:\n` +
        `  /system resource print             - Cetak spesifikasi & beban CPU RouterBOARD\n` +
        `  /interface pppoe-server server print - Tampilkan status operasional PPPoE Service\n` +
        `  /ip pool print                     - Tampilkan alokasi subnet IP Pool daerah\n` +
        `  /ppp active print                  - Tampilkan daftar semua sesi user yang online\n` +
        `  /tool ping <host>                  - Lakukan pengujian latensi ICMP ping\n` +
        `  /system reboot                     - Jadwalkan ulang bongkar mesin router`;
    } else {
      response = `[admin@${selectedRouter.name}] > input: syntax error (ketik /help untuk referensi)`;
    }

    setTerminalLogs([...outputLogs, response, `[admin@${selectedRouter.name}] > `]);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Grid: Router Selector Panel & Device Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RouterBOARD Selector component */}
        <div className="lg:col-span-1">
          <NeonBox variant="cyan" className="h-full p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-5 h-5 text-cyan-400" />
                <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider">
                  KONEKTOR MIKROTIK PPPoE SERVER
                </h3>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mb-3 uppercase">
                Pilih router pusat konsolidator wilayah:
              </p>

              {/* Selector links */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {routers.map((r) => {
                  const regSubCount = customers.filter(c => c.region === r.region).length;
                  const regOnCount = customers.filter(c => c.region === r.region && c.status === 'online').length;
                  
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedRouterId(r.id); setCurrentPage(1); }}
                      className={`w-full p-2.5 font-mono text-left border rounded transition-all flex items-center justify-between cursor-pointer ${
                        selectedRouterId === r.id
                          ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                          : r.status === 'rebooting'
                          ? 'bg-amber-950/20 border-amber-800 text-amber-500 animate-pulse'
                          : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="block font-bold text-[11px] truncate">{r.name}</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">{r.region} • {r.model}</span>
                      </div>
                      
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className="text-[9px] font-semibold text-cyan-400">
                          {regOnCount}/{regSubCount} Lease
                        </span>
                        
                        {r.status === 'rebooting' ? (
                          <span className="text-[8px] bg-amber-950/65 px-1 rounded border border-amber-500/20 mt-1 uppercase">
                            REBOOTING...
                          </span>
                        ) : (
                          <span className="text-[8px] text-slate-500 mt-1 uppercase flex items-center gap-1">
                            <Cpu className="w-2.5 h-2.5 text-emerald-500" />
                            {r.cpuLoad}% CPU
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Router status control actions */}
            <div className="pt-4 border-t border-white/5 mt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => triggerRebootRouter(selectedRouter.id)}
                  disabled={selectedRouter.status === 'rebooting'}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-950/55 to-red-950/55 hover:from-amber-900/80 hover:to-red-900/80 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-white uppercase font-mono text-[10px] tracking-wider font-bold rounded cursor-pointer transition-all disabled:opacity-40"
                >
                  Hard Reboot Router
                </button>
              </div>
            </div>
          </NeonBox>
        </div>

        {/* Central Display: Router Information, System specs & CPU telemetry */}
        <div className="lg:col-span-2">
          {actionSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500 text-emerald-400 font-mono text-xs uppercase rounded animate-fadeIn shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              {actionSuccessMsg}
            </div>
          )}

          <NeonBox variant="cyan" className="h-full p-4 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 mb-4 gap-2">
                <div>
                  <h3 className="font-orbitron font-bold text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    KANTOR PUSAT KOORDINASI: {selectedRouter.name}
                  </h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
                    Modul Pengendali Jaringan • {selectedRouter.model} ({selectedRouter.rosVersion})
                  </p>
                </div>
                
                {/* Router Hardware Health status indicator badge */}
                <div className={`px-2.5 py-1 border rounded-sm font-mono text-[10px] font-semibold uppercase tracking-wider ${
                  selectedRouter.status === 'online'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-400 animate-pulse'
                }`}>
                  Status: {selectedRouter.status}
                </div>
              </div>

              {/* Navigation Router-specific internal components tabs */}
              <div className="grid grid-cols-5 bg-slate-950 border border-slate-900 rounded p-0.5 gap-1 mb-4 select-none">
                <button
                  onClick={() => setActiveRouterTab('status')}
                  className={`py-1.5 px-1 font-orbitron text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all ${
                    activeRouterTab === 'status' ? 'bg-cyan-950/70 text-cyan-400 font-black' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  SISTEM
                </button>
                <button
                  onClick={() => setActiveRouterTab('secrets')}
                  className={`py-1.5 px-1 font-orbitron text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all ${
                    activeRouterTab === 'secrets' ? 'bg-cyan-950/70 text-cyan-400 font-black' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  SECRETS (PPPoE)
                </button>
                <button
                  onClick={() => setActiveRouterTab('active')}
                  className={`py-1.5 px-1 font-orbitron text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all relative ${
                    activeRouterTab === 'active' ? 'bg-cyan-950/70 text-cyan-400 font-black' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ACTIVE LEASES
                </button>
                <button
                  onClick={() => setActiveRouterTab('firewall')}
                  className={`py-1.5 px-1 font-orbitron text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all ${
                    activeRouterTab === 'firewall' ? 'bg-cyan-950/70 text-cyan-400 font-black' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  NAT/FILTER
                </button>
                <button
                  onClick={() => setActiveRouterTab('terminal')}
                  className={`py-1.5 px-1 font-orbitron text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all ${
                    activeRouterTab === 'terminal' ? 'bg-cyan-950/70 text-cyan-400 font-black' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  TERMINAL ROS
                </button>
              </div>

              {/* Render Selected Subcomponents inside the Center box */}
              {activeRouterTab === 'status' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* CPU load live specs panel */}
                  <div className="bg-slate-950 border border-slate-900 p-3 rounded space-y-3">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">// BEBAN & SUMBER DAYA PROSESOR</span>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span>CPU Cores:</span>
                        <span className="text-white">{selectedRouter.cpuCores} Core (High-Perf TILE Engine)</span>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>CPU Load:</span>
                          <span className={selectedRouter.cpuLoad > 75 ? 'text-red-400 font-bold' : selectedRouter.cpuLoad > 40 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {selectedRouter.cpuLoad}%
                          </span>
                        </div>
                        {/* Custom animated neon loader status-bar */}
                        <div className="h-2 bg-slate-900 border border-slate-800 rounded overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              selectedRouter.cpuLoad > 75 
                                ? 'bg-gradient-to-r from-red-600 to-red-500' 
                                : selectedRouter.cpuLoad > 40 
                                ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                                : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                            }`}
                            style={{ width: `${selectedRouter.cpuLoad}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-white/5 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Uptime Jaringan:</span>
                        <span className="text-white">{selectedRouter.uptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Router Identity:</span>
                        <span className="text-cyan-400 font-semibold">{selectedRouter.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* RAM & Disk resource panel */}
                  <div className="bg-slate-950 border border-slate-900 p-3 rounded space-y-3">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">// ALOKASI PENYIMPANAN & SFP PORT</span>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>Memori Bebas (RAM):</span>
                          <span>{selectedRouter.ramFree}MB / {selectedRouter.ramTotal}MB</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded overflow-hidden">
                          <div 
                            className="h-full bg-cyan-400"
                            style={{ width: `${(selectedRouter.ramFree / selectedRouter.ramTotal) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>Harddisk Bebas (ROM):</span>
                          <span>{selectedRouter.diskFree}MB / {selectedRouter.diskTotal}MB</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded overflow-hidden">
                          <div 
                            className="h-full bg-purple-400"
                            style={{ width: `${(selectedRouter.diskFree / selectedRouter.diskTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 text-[11px] space-y-1 text-slate-400">
                      <div className="flex justify-between">
                        <span>IP Address (Interface WAN):</span>
                        <span className="text-white">{selectedRouter.ipAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wilayah Pelayanan:</span>
                        <span className="text-cyan-400">PROP_{selectedRouter.region.toUpperCase().replace(' ', '_')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PPPoE Secrets Table tab */}
              {activeRouterTab === 'secrets' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                    
                    {/* Search filter in card */}
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
                      <input
                        type="text"
                        value={secretSearch}
                        onChange={(e) => { setSecretSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari Username PPPoE / Nama Pelanggan..."
                        className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-700 pl-8 pr-3 py-2 text-[11px] leading-none transition-colors"
                      />
                    </div>

                    {/* Add secrets button triggers modal */}
                    <button
                      onClick={() => setShowAddSecretModal(true)}
                      className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase text-[10px] tracking-wider rounded cursor-pointer transition-colors flex items-center justify-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 font-bold" />
                      Registrasi Akun Baru
                    </button>
                  </div>

                  {/* Fast grid list */}
                  <div className="overflow-x-auto border border-white/5 bg-slate-950 rounded">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-900 border-b border-white/5 text-[10px] text-slate-500 uppercase font-black">
                          <th className="p-2">USERNAME PPPoE</th>
                          <th className="p-2">PRESET PROFILE</th>
                          <th className="p-2">PASSWORD</th>
                          <th className="p-2">VLAN</th>
                          <th className="p-2 text-right">AKSI OPERATOR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[11px]">
                        {pagedSubs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-600 uppercase font-bold text-[10px]">
                              Tidak ada PPPoE secret yang cocok di wilayah ini.
                            </td>
                          </tr>
                        ) : (
                          pagedSubs.map((cust) => (
                            <tr key={cust.id} className="hover:bg-cyan-950/15">
                              <td className="p-2 max-w-[160px] truncate">
                                <span className="font-bold text-slate-200 block truncate">{cust.pppoeUsername}</span>
                                <span className="text-[10px] text-slate-500 block truncate">{cust.name}</span>
                              </td>
                              <td className="p-2 text-slate-400 font-medium">
                                {cust.pppServicePreset}
                              </td>
                              <td className="p-2 font-mono text-slate-400">
                                {cust.pppoePassword}
                              </td>
                              <td className="p-2 text-amber-500 font-bold">
                                {cust.vlanId}
                              </td>
                              <td className="p-2 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  id={`edit-secret-btn-${cust.id}`}
                                  onClick={() => handleEditSecret(cust)}
                                  className="px-1.5 py-0.5 border border-slate-800 hover:border-cyan-400 text-cyan-400 hover:text-white bg-slate-950 hover:bg-cyan-950/40 rounded transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px]"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                  Edit Setelan
                                </button>
                                
                                <button
                                  onClick={() => handleKickSession(cust)}
                                  className="px-1.5 py-0.5 border border-slate-800 hover:border-amber-400 text-amber-400 hover:text-white bg-slate-950 hover:bg-amber-950/45 rounded transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px]"
                                >
                                  <Ban className="w-2.5 h-2.5" />
                                  Putus
                                </button>

                                {onDeleteCustomer && (
                                  <button
                                    onClick={() => {
                                      if (confirmDeleteId === cust.id) {
                                        onDeleteCustomer(cust.id);
                                        setConfirmDeleteId(null);
                                      } else {
                                        setConfirmDeleteId(cust.id);
                                      }
                                    }}
                                    className={`px-1.5 py-0.5 border rounded transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] ${confirmDeleteId === cust.id ? 'border-red-500 bg-red-950 text-red-100 hover:bg-red-600 animate-pulse' : 'border-slate-800 hover:border-red-500 text-red-500 hover:text-white bg-slate-950 hover:bg-red-950/45'}`}
                                    title={confirmDeleteId === cust.id ? "Klik lagi untuk konfirmasi hapus permanen!" : "Hapus Secret PPPoE"}
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                    {confirmDeleteId === cust.id ? 'YAKIN?' : 'Hapus'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Simple pagination inside card */}
                  {totalSecrets > secretsPerPage && (
                    <div className="flex justify-between items-center bg-slate-950/60 p-2 border border-white/5 rounded text-[10px] text-slate-500">
                      <span>Tampilan {startSecIdx + 1}-{Math.min(startSecIdx + secretsPerPage, totalSecrets)} dari {totalSecrets} secret.</span>
                      <div className="flex gap-1.5">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 disabled:opacity-30 cursor-pointer font-bold text-[10px]"
                        >
                          &lt;
                        </button>
                        <span className="px-2 py-0.5 border border-cyan-800 bg-cyan-950/20 text-cyan-400">Halaman {currentPage}/{totalSecPages}</span>
                        <button
                          disabled={currentPage === totalSecPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalSecPages))}
                          className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 disabled:opacity-30 cursor-pointer font-bold text-[10px]"
                        >
                          &gt;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Active Leases tab view */}
              {activeRouterTab === 'active' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="bg-slate-950 border border-slate-900 p-2.5 text-slate-400 leading-normal text-[11px]">
                    <p className="font-bold text-white uppercase mb-1 flex items-center gap-1">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      Monitoring Radius Active Sessions (MikroTik dynamic database)
                    </p>
                    Menampilkan data pelanggan yang sedang menggunakan jalur tunneling PPPoE aktif pada server {selectedRouter.name} wilayah {selectedRouter.region}. Pengontrol ini terhubung langsung ke table <code className="text-cyan-400">/interface pppoe-server active</code>.
                  </div>

                  <div className="overflow-x-auto border border-white/5 bg-slate-950 rounded">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-900 border-b border-white/5 text-[10px] text-slate-500 uppercase font-black">
                          <th className="p-2">PELANGGAN / USER</th>
                          <th className="p-2">ALOKASI IP LAN</th>
                          <th className="p-2">MAC ADDRESS (ONU)</th>
                          <th className="p-2">MUTU LINK</th>
                          <th className="p-2 text-right">SESI KONTROL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[11px]">
                        {routerSubscribers.filter(c => c.status === 'online').length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-600 uppercase font-bold text-[10px]">
                              Tidak ada pelanggan yang aktif terhubung secara real-time.
                            </td>
                          </tr>
                        ) : (
                          routerSubscribers
                            .filter(c => c.status === 'online')
                            .slice(0, 10)
                            .map((cust, i) => (
                              <tr key={cust.id} className="hover:bg-cyan-950/15">
                                <td className="p-2">
                                  <strong className="text-white block font-sans text-xs">{cust.pppoeUsername}</strong>
                                  <span className="text-[10px] text-slate-500 block">{cust.name}</span>
                                </td>
                                <td className="p-2 text-cyan-400 font-bold">
                                  {cust.ipAddress}
                                </td>
                                <td className="p-2 text-slate-450 uppercase font-mono">
                                  {cust.onuSn}
                                </td>
                                <td className="p-2">
                                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                                    {20 + (i * 2)} Mbps Act
                                  </span>
                                </td>
                                <td className="p-2 text-right">
                                  <button
                                    id={`kick-btn-${cust.id}`}
                                    onClick={() => handleKickSession(cust)}
                                    className="px-2 py-1 bg-red-950/40 hover:bg-red-950 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded text-[10px] cursor-pointer transition-colors font-bold uppercase inline-flex items-center gap-1"
                                  >
                                    <Ban className="w-3 h-3" />
                                    KICK SESSION
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Firewall / NAT view tab */}
              {activeRouterTab === 'firewall' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Firewall NAT Rules board */}
                  <div className="bg-slate-950 border border-slate-900 p-3 rounded space-y-2.5">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">// MIKROTIK IP FIREWALL NAT</span>
                    
                    <div className="space-y-1.5 text-[11px]">
                      <div className="bg-slate-900 p-2 border border-white/5 rounded flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white text-[11px]">#0 Src-NAT Masquerade</p>
                          <p className="text-[10px] text-slate-500">chain=srcnat out-interface=WAN</p>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">ENABLED</span>
                      </div>

                      <div className="bg-slate-900 p-2 border border-white/5 rounded flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white text-[11px]">#1 WebPort Forwarding</p>
                          <p className="text-[10px] text-slate-500">dstnat protocol=tcp dst-port=80</p>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">ENABLED</span>
                      </div>

                      <div className="bg-slate-900 p-2 border border-white/5 rounded flex justify-between items-center opacity-45">
                        <div>
                          <p className="font-bold text-white text-[11px]">#2 PPTP Tunnel Bypass</p>
                          <p className="text-[10px] text-slate-500">dstnat protocol=tcp dst-port=1723</p>
                        </div>
                        <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 text-[9px] font-bold">DISABLED</span>
                      </div>
                    </div>
                  </div>

                  {/* Firewall Filters card board */}
                  <div className="bg-slate-950 border border-slate-900 p-3 rounded space-y-2.5">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">// MIKROTIK IP FIREWALL FILTER RULES</span>
                    
                    <div className="space-y-1.5 text-[11px]">
                      <div className="bg-slate-900 p-2 border border-white/5 rounded flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white text-[11px]">#0 Allow Established/Related</p>
                          <p className="text-[10px] text-slate-500">chain=input connection-state=established</p>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">ENABLED</span>
                      </div>

                      <div className="bg-slate-900 p-2 border border-white/5 rounded flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white text-[11px]">#1 Fasttrack Connection</p>
                          <p className="text-[10px] text-slate-500">chain=forward action=fasttrack-connection</p>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">ENABLED</span>
                      </div>

                      <div className="bg-slate-900 p-2 border border-emerald-500/10 hover:border-red-500/30 transition-colors rounded flex justify-between items-center">
                        <div>
                          <p className="font-bold text-red-400 text-[11px]">#2 Drop Bogon IPs / WAN brute</p>
                          <p className="text-[10px] text-slate-500">chain=input in-interface=WAN action=drop</p>
                        </div>
                        <span className="px-1.5 py-0.5 bg-red-950/60 border border-red-500/30 text-red-400 text-[9px] font-bold">DROP_ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Terminal tab view panel */}
              {activeRouterTab === 'terminal' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="bg-black/95 border border-cyan-950/60 rounded p-3 h-[240px] overflow-y-auto flex flex-col justify-between">
                    <div>
                      {terminalLogs.map((log, i) => (
                        <p key={i} className={`whitespace-pre-wrap ${log.includes('Error:') ? 'text-red-500 font-bold' : log.includes('SUKSES:') || log.includes('[STATUS]') ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {log}
                        </p>
                      ))}
                      <div ref={terminalBottomRef} />
                    </div>
                  </div>

                  <form onSubmit={handleTerminalSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Masukkan command RouterOS... (e.g. /system resource print)"
                      className="flex-1 bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-cyan-400 font-mono text-xs pl-3 pr-2 py-2.5 placeholder-slate-700"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider text-[11px] font-orbitron transition-colors cursor-pointer"
                    >
                      Kirim
                    </button>
                  </form>

                  {/* Fast Terminal Shortcuts list row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 text-[9px] text-slate-500 select-none">
                    <span className="font-bold uppercase">Skrip Cepat:</span>
                    <button
                      type="button"
                      onClick={() => { setTerminalInput('/system resource print'); }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 rounded cursor-pointer uppercase font-semibold"
                    >
                      /system resource
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTerminalInput('/ppp active print'); }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 rounded cursor-pointer uppercase font-semibold"
                    >
                      /ppp active
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTerminalInput('/ip pool print'); }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 rounded cursor-pointer uppercase font-semibold"
                    >
                      /ip pool
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTerminalInput('/tool ping 8.8.8.8'); }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 rounded cursor-pointer uppercase font-semibold"
                    >
                      /tool ping 8.8.8.8
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom alert row info */}
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row justify-between text-[10px] font-mono text-slate-500 gap-1 select-none">
              <span>Radius Database status: SYNCHRONIZED // WAN PORT UP</span>
              <span>Ketik <code className="text-cyan-400">/help</code> di terminal command untuk panduan lengkap script</span>
            </div>
          </NeonBox>
        </div>
      </div>

      {/* DETAILED MODAL: POPUP FORM TO EDIT PPPOE SUBSCRIBER KEY & VLAN DIRECTLY */}
      {editingSecretUser && (() => {
        const selectedCust = customers.find(c => c.id === editingSecretUser);
        if (!selectedCust) return null;

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="w-full max-w-lg">
              <NeonBox variant="cyan">
                <form onSubmit={handleSaveSecretChanges} className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div>
                      <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Lock className="w-4 h-4" />
                        SETTING AKUN PPST (PPPoE SECRET)
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
                        {selectedCust.name} • {selectedCust.pppoeUsername}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingSecretUser(null)}
                      className="p-1 text-slate-400 hover:text-white border border-slate-900 hover:border-slate-800 bg-slate-950 cursor-pointer"
                    >
                      TUTUP
                    </button>
                  </div>

                  {/* Input parameters */}
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1">PPPoE Session Password</label>
                      <input
                        type="text"
                        required
                        value={editingSecretPass}
                        onChange={(e) => setEditingSecretPass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">Kecepatan Paket (Bandwidth)</label>
                        <select
                          value={editingSecretSpeed}
                          onChange={(e) => setEditingSecretSpeed(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs cursor-pointer"
                        >
                          <option value="30 Mbps">30 Mbps Broadband</option>
                          <option value="50 Mbps">50 Mbps Broadband</option>
                          <option value="100 Mbps">100 Mbps Broadband</option>
                          <option value="150 Mbps">150 Mbps Gaming</option>
                          <option value="200 Mbps">200 Mbps Premium Broadband</option>
                          <option value="100 Mbps Dedicated">100 Mbps Dedicated SLA</option>
                          <option value="200 Mbps Dedicated">200 Mbps Dedicated SLA</option>
                          <option value="300 Mbps Dedicated">300 Mbps Dedicated SLA</option>
                          <option value="500 Mbps Dedicated">500 Mbps Dedicated SLA</option>
                          <option value="1 Gbps Dedicated">1 Gbps Dedicated SLA</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">VLAN Tag (802.1Q)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={4094}
                          value={editingSecretVlan}
                          onChange={(e) => setEditingSecretVlan(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">MikroTik QoS Profile</label>
                        <select
                          value={editingSecretProfile}
                          onChange={(e) => setEditingSecretProfile(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs cursor-pointer"
                        >
                          <option value="PPPoE_HSIA_VLAN_100">PPPoE_HSIA_VLAN_100</option>
                          <option value="PPPoE_IPTV_VLAN_200">PPPoE_IPTV_VLAN_200</option>
                          <option value="PPPoE_Dedicated_VLAN_300">PPPoE_Dedicated_VLAN_300</option>
                          <option value="GamePing_LowLatency_500">GamePing_LowLatency_500</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">Status Konektivitas</label>
                        <select
                          value={editingSecretStatus}
                          onChange={(e) => setEditingSecretStatus(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs cursor-pointer"
                        >
                          <option value="connected">CONNECTED (AKTIF ONLINE)</option>
                          <option value="disconnected">DISCONNECTED (BLOKIR / SUSPEND)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer inside modal */}
                  <div className="pt-4 border-t border-white/5 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingSecretUser(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 uppercase font-bold text-[10px] rounded cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase text-[10px] tracking-widest transition-all rounded cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isProcessing ? 'Mengsinkronisasi...' : 'SIMPAN KE RADIUS'}
                    </button>
                  </div>
                </form>
              </NeonBox>
            </div>
          </div>
        );
      })()}

      {/* POPUP MODAL: REGISTER NEW CUSTOMER WITH COMPLETE PPPoE AUTOMATED FORM */}
      {showAddSecretModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-lg">
            <NeonBox variant="cyan">
              <form onSubmit={handleAddSecretSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div>
                    <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      REGISTRASI PPPOE & PELANGGAN BARU
                    </h4>
                    <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
                      Pendaftaran subscriber FTTH langsung ke RADIUS server Mikrotik
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddSecretModal(false)}
                    className="p-1 text-slate-400 hover:text-white border border-slate-900 hover:border-slate-800 bg-slate-950 cursor-pointer"
                  >
                    TUTUP
                  </button>
                </div>

                {/* Input parameters */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">Nama Lengkap Pelanggan</label>
                    <input
                      type="text"
                      required
                      value={newSecName}
                      onChange={(e) => setNewSecName(e.target.value)}
                      placeholder="e.g. Andi Wijaya"
                      className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-700 px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1">PPPoE Link Password</label>
                      <input
                        type="text"
                        required
                        value={newSecPass}
                        onChange={(e) => setNewSecPass(e.target.value)}
                        placeholder="e.g. sandirahasia"
                        className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-700 px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1">Wilayah Registrasi</label>
                      <select
                        value={newSecRegion}
                        onChange={(e) => setNewSecRegion(e.target.value as Region)}
                        className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs cursor-pointer"
                      >
                        {regions.map((reg) => (
                          <option key={reg} value={reg}>{reg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1">Pilihan Paket Broadband</label>
                      <select
                        value={newSecSpeed}
                        onChange={(e) => setNewSecSpeed(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs cursor-pointer"
                      >
                        <option value="30 Mbps">30 Mbps (Standard)</option>
                        <option value="50 Mbps">50 Mbps (Premium)</option>
                        <option value="100 Mbps">100 Mbps (High Speed)</option>
                        <option value="150 Mbps">150 Mbps (Ultimate)</option>
                        <option value="200 Mbps">200 Mbps (Premium Broadband)</option>
                        <option value="100 Mbps Dedicated">100 Mbps (Dedicated SLA Corporate)</option>
                        <option value="200 Mbps Dedicated">200 Mbps (Dedicated SLA Corporate)</option>
                        <option value="300 Mbps Dedicated">300 Mbps (Dedicated SLA Corporate)</option>
                        <option value="500 Mbps Dedicated">500 Mbps (Dedicated SLA Corporate)</option>
                        <option value="1 Gbps Dedicated">1 Gbps (Dedicated SLA Corporate)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1">VLAN Tag (802.1Q)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={4094}
                        value={newSecVlan}
                        onChange={(e) => setNewSecVlan(Number(e.target.value))}
                        placeholder="e.g. 250"
                        className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">QoS Server Profile</label>
                    <select
                      value={newSecProfile}
                      onChange={(e) => setNewSecProfile(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-100 px-3 py-2 text-xs cursor-pointer"
                    >
                      <option value="PPPoE_HSIA_VLAN_100">PPPoE_HSIA_VLAN_100 (Uncapped Web Traffic)</option>
                      <option value="PPPoE_IPTV_VLAN_200">PPPoE_IPTV_VLAN_200 (Triple Play HD Priority)</option>
                      <option value="PPPoE_Dedicated_VLAN_300">PPPoE_Dedicated_VLAN_300 (Business SLA-99.9%)</option>
                      <option value="GamePing_LowLatency_500">GamePing_LowLatency_500 (Gamer Optimize)</option>
                    </select>
                  </div>
                </div>

                {/* Actions footer inside modal */}
                <div className="pt-4 border-t border-white/5 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddSecretModal(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 uppercase font-bold text-[10px] rounded cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-350 text-slate-950 font-bold uppercase text-[10px] tracking-widest transition-all rounded cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
                  >
                    <Plus className="w-4 h-4 font-bold" />
                    {isProcessing ? 'Mendaftarkan Sesi...' : 'DAFTARKAN PELANGGAN'}
                  </button>
                </div>
              </form>
            </NeonBox>
          </div>
        </div>
      )}

    </div>
  );
}
