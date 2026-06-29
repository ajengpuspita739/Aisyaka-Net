import React, { useState } from 'react';
import { Device, Region, Customer } from '../types';
import { Cpu, Server, HardDrive, Smartphone, Thermometer, Radio, Zap, Settings, Command, Search, AlertCircle, RefreshCcw, Play, Check, Terminal, Sliders, Sparkles } from 'lucide-react';
import NeonBox from './NeonBox';

interface DevicesMenuProps {
  devices: Device[];
  regions: Region[];
  customers: Customer[];
  onTriggerReboot: (deviceId: string) => void;
}

export default function DevicesMenu({
  devices,
  regions,
  customers,
  onTriggerReboot,
}: DevicesMenuProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedOnuPackageType, setSelectedOnuPackageType] = useState<'ALL' | 'broadband' | 'dedicated'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  // Helper to cross-reference customer details for devices
  const getDeviceCustomerPackage = (dev: Device) => {
    if (!customers) return null;
    return customers.find(c => c.id === dev.associatedCustomerId || c.name === dev.associatedCustomerName);
  };

  // States for regional OLT configuration per region
  const [regionalOlts, setRegionalOlts] = useState<Record<string, {
    ip: string;
    model: string;
    vlan: number;
    autoReg: boolean;
    dba: string;
    ports: number;
    status: 'active' | 'maintenance' | 'offline';
  }>>(() => {
    const saved = localStorage.getItem('aisyaka_regional_olts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      'BEKASI wilayah Jatimakmur': { ip: '10.100.2.10', model: 'Huawei MA5800-T', vlan: 220, autoReg: true, dba: '100 Mbps Dedicated', ports: 16, status: 'active' },
      'BEKASI wilayah Jatiasih': { ip: '10.100.3.10', model: 'ZTE C320 Mini-OLT', vlan: 300, autoReg: true, dba: '50 Mbps', ports: 8, status: 'active' },
      'BEKASI wilayah Dewi sartika': { ip: '10.100.4.10', model: 'Huawei MA5800-T', vlan: 150, autoReg: true, dba: '100 Mbps Dedicated', ports: 16, status: 'active' },
      'CIKARANG Desa Cibarusah': { ip: '10.100.5.10', model: 'ZTE C300 GPON', vlan: 250, autoReg: true, dba: '100 Mbps Dedicated', ports: 16, status: 'active' },
      'CIKARANG Desa Sukatani': { ip: '10.100.1.10', model: 'ZTE C300 Rackmount', vlan: 200, autoReg: true, dba: '100 Mbps Dedicated', ports: 16, status: 'active' },
      'CIKARANG Desa Jatibaru': { ip: '10.100.6.10', model: 'ZTE C300 GPON', vlan: 180, autoReg: true, dba: '100 Mbps Dedicated', ports: 16, status: 'active' }
    };
  });

  const [lastSavedRegion, setLastSavedRegion] = useState<string | null>(null);

  const handleUpdateRegionalOlt = (region: string, fields: any) => {
    setRegionalOlts(prev => {
      const updated = {
        ...prev,
        [region]: {
          ...prev[region],
          ...fields
        }
      };
      localStorage.setItem('aisyaka_regional_olts', JSON.stringify(updated));
      return updated;
    });
    setLastSavedRegion(region);
    setTimeout(() => {
      setLastSavedRegion(null);
    }, 2000);
  };

  // States for automated OLT configuration
  const [oltTarget, setOltTarget] = useState('DEV-OLT-001');
  const [configMode, setConfigMode] = useState<'register' | 'vlan_mapping' | 'dba_profile'>('register');
  const [customerName, setCustomerName] = useState('Budi Santoso');
  const [onuSn, setOnuSn] = useState('ZTEGC8923AB4');
  const [onuType, setOnuType] = useState('ZTE F670L Dual Band');
  const [onuVlan, setOnuVlan] = useState('200');
  const [onuProfile, setOnuProfile] = useState('100 Mbps Dedicated');
  
  const [oltLogs, setOltLogs] = useState<string[]>([
    '-- OLT AUTOMATED CONFIGURATION ENGINE READY --',
    'Pilih parameter dan klik "JALANKAN KONFIGURASI OTOMATIS" untuk memulai sinkronisasi firmware.'
  ]);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configProgress, setConfigProgress] = useState(0);

  // Filter devices list
  const filteredDevices = devices.filter((dev) => {
    const matchRegion = selectedRegion === 'ALL' || dev.region === selectedRegion;
    const matchType = selectedType === 'ALL' || dev.type === selectedType;
    const matchSearch =
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.associatedCustomerName && dev.associatedCustomerName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRegion && matchType && matchSearch;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'OLT':
        return <Server className="w-5 h-5 text-cyan-400" />;
      case 'GPON Port':
        return <Radio className="w-4 h-4 text-fuchsia-400" />;
      case 'ONU/ONT':
        return <HardDrive className="w-4 h-4 text-emerald-400" />;
      case 'Router':
        return <Smartphone className="w-4 h-4 text-amber-400" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20';
      case 'warning':
        return 'text-amber-400 bg-amber-950/40 border border-amber-500/20 animate-pulse';
      case 'offline':
        return 'text-red-400 bg-red-950/40 border border-red-500/20';
      default:
        return 'text-slate-400 bg-slate-900 border border-slate-700';
    }
  };

  const handleRebootSimulation = (deviceId: string) => {
    setRebootingId(deviceId);
    onTriggerReboot(deviceId);
    
    setTimeout(() => {
      setRebootingId(null);
      alert(`Reboot command sent to device ${deviceId} successfully. Core engine logged command execution.`);
    }, 2000);
  };

  const handleRunOltConfig = () => {
    if (isConfiguring) return;
    setIsConfiguring(true);
    setConfigProgress(0);
    setOltLogs([`[INIT] Menginisialisasi modul konfigurasi otomatis OLT (${oltTarget})`]);

    let steps: { prg: number; msg: string }[] = [];

    if (configMode === 'register') {
      steps = [
        { prg: 10, msg: `[STATUS] Menghubungkan ke chassis OLT ${oltTarget} via Telnet vty 0...` },
        { prg: 20, msg: `[AUTH] Hak akses operator divalidasi. Masuk ke mode config.` },
        { prg: 30, msg: `[COMMAND] olt-c300(config)# interface gpon-olt_1/1/1` },
        { prg: 40, msg: `[SCAN] Memindai ONU yang tidak terdaftar... Ditemukan SN: ${onuSn}` },
        { prg: 55, msg: `[COMMAND] olt-c300(config-if)# onu 8 type ${onuType.replace(/\s+/g, '-')} sn ${onuSn}` },
        { prg: 70, msg: `[COMMAND] olt-c300(config-if)# name "${customerName.replace(/\s+/g, '_')}"` },
        { prg: 80, msg: `[COMMAND] olt-c300(config-if)# service-port 1 vlan ${onuVlan} user-vlan ${onuVlan} tag-action trust` },
        { prg: 90, msg: `[STATUS] Menyinkronkan redaman laser optik ONT... Hasil: -19.4 dBm (Sangat Baik)` },
        { prg: 100, msg: `[SUCCESS] Registrasi ONT ${onuSn} berhasil dijalankan otomatis! Modul ONT sekarang berstatus ACTIVE.` }
      ];
    } else if (configMode === 'vlan_mapping') {
      steps = [
        { prg: 15, msg: `[STATUS] Menghubungkan ke core OLT chassis ${oltTarget}...` },
        { prg: 35, msg: `[COMMAND] olt-c300(config)# vlan ${onuVlan}` },
        { prg: 50, msg: `[COMMAND] olt-c300(config-vlan)# name VLAN_INTERNET_${onuVlan}` },
        { prg: 70, msg: `[COMMAND] olt-c300(config-vlan)# exit` },
        { prg: 85, msg: `[COMMAND] olt-c300(config)# service-port 200 vlan ${onuVlan} gpon-olt_1/1/1 onu 8 gemport 1 user-vlan ${onuVlan}` },
        { prg: 100, msg: `[SUCCESS] Pemetaan VLAN ${onuVlan} pada port fiber-optic OLT telah selesai dan berjalan otomatis!` }
      ];
    } else {
      steps = [
        { prg: 20, msg: `[STATUS] Memuat DBA Profile Editor pada OLT ${oltTarget}...` },
        { prg: 45, msg: `[COMMAND] olt-c300(config)# dba-profile profile-name "PROFILE_${onuProfile.replace(/\s+/g, '_')}"` },
        { prg: 70, msg: `[COMMAND] olt-c300(config-dba)# type3 assure 10240 max ${onuProfile.includes('Gbps') || onuProfile.includes('Giga') ? '1024000' : '204800'}` },
        { prg: 85, msg: `[STATUS] Melakukan binding bandwidth allocation ke interface GPON GPON-OLT_1/1/1:8...` },
        { prg: 100, msg: `[SUCCESS] Dynamic Bandwidth Allocation (DBA) Profile "${onuProfile}" sukses terikat secara otomatis.` }
      ];
    }

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setOltLogs(prev => [...prev, step.msg]);
        setConfigProgress(step.prg);
        if (step.prg === 100) {
          setIsConfiguring(false);
        }
      }, (idx + 1) * 400);
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtering Box with Neon styling */}
      <NeonBox variant="cyan" title="SISTEM INVENTARIS INFRASTRUKTUR PERANGKAT" subtitle="FTTH Hardware Nodes Telemetry">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Region Filter */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Filter Wilayah Telemetri:
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as Region | 'ALL')}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-2 px-3 text-xs font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">Semua Wilayah</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Tipe Hardware:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-2 px-3 text-xs font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">Semua Jenis Hardware</option>
              <option value="OLT">OLT Core Rackmount</option>
              <option value="GPON Port">Slot GPON Chassis</option>
              <option value="ONU/ONT">Pelanggan ONU/ONT Terminals</option>
            </select>
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Keywords:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, seri, pelanggan..."
                className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-600 pl-9 pr-4 py-2 text-xs font-mono transition-colors"
              />
            </div>
          </div>
        </div>
      </NeonBox>

      {/* Hardware Telemetry List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: OLT Core Distribution Chassis */}
        <div className="space-y-4">
          <h3 className="font-orbitron font-bold text-sm tracking-wider text-cyan-400 uppercase neon-glow-cyan flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Core OLT (Optical Line Terminals)
          </h3>
          {filteredDevices
            .filter((d) => d.type === 'OLT' || d.type === 'GPON Port')
            .map((dev) => (
              <NeonBox key={dev.id} variant={dev.status === 'warning' ? 'amber' : 'cyan'} className="p-4" subtitle={dev.id}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="p-2.5 bg-slate-950 border border-white/5 rounded shrink-0">
                      {getDeviceIcon(dev.type)}
                    </div>
                    <div>
                      <h4 className="font-orbitron font-bold text-xs uppercase text-slate-100">
                        {dev.name}
                      </h4>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {dev.model} • IP: <span className="text-cyan-400">{dev.ipAddress}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded ${getStatusColor(dev.status)}`}>
                    {dev.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 block">TEMPERATURE</span>
                    <span className={`font-semibold flex items-center gap-0.5 mt-0.5 ${dev.temperature > 50 ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                      <Thermometer className="w-3.5 h-3.5" />
                      {dev.temperature}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">UPTIME SYSTEM</span>
                    <span className="text-slate-300 block font-semibold mt-0.5 truncate">
                      {dev.uptime}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">REGIONAL GPON</span>
                    <span className="text-slate-300 block font-semibold mt-0.5">
                      {dev.region}
                    </span>
                  </div>
                </div>

                {/* Laser details */}
                <div className="mt-3 p-2 bg-slate-950/60 rounded border border-white/5 flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span>LASER SFP: Tx Power: <strong className="text-cyan-400">+{dev.txPower} dBm</strong></span>
                  <span>Rx Power Threshold: <strong className="text-cyan-400">-{Math.abs(dev.rxPower)} dBm</strong></span>
                </div>

                {/* Quick actions */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => handleRebootSimulation(dev.id)}
                    disabled={rebootingId === dev.id}
                    className="px-2.5 py-1 hover:bg-red-950 border border-red-500/10 hover:border-red-500/50 text-[10px] text-red-400 hover:text-white font-mono uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCcw className={`w-3 h-3 ${rebootingId === dev.id ? 'animate-spin' : ''}`} />
                    Reboot OLT
                  </button>
                </div>
              </NeonBox>
            ))}
          {filteredDevices.filter((d) => d.type === 'OLT' || d.type === 'GPON Port').length === 0 && (
            <div className="p-6 bg-slate-950/40 border border-slate-900 border-dashed rounded text-center text-slate-500 font-mono text-xs">
              Mnemonic: No OLT cores cataloged under current criteria.
            </div>
          )}
        </div>

        {/* Right Side: Customer ONT Modems */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
            <h3 className="font-orbitron font-bold text-sm tracking-wider text-emerald-400 uppercase neon-glow-emerald flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Subscriber Terminals & ONTs
            </h3>
            
            {/* Quick Filter Buttons to separate Broadband and Dedicated */}
            <div className="flex gap-1 bg-slate-950/90 p-1 border border-white/5 rounded text-[10px]">
              <button
                onClick={() => setSelectedOnuPackageType('ALL')}
                className={`px-2 py-0.5 font-mono uppercase transition-all rounded-sm cursor-pointer ${
                  selectedOnuPackageType === 'ALL'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua ({filteredDevices.filter(d => d.type === 'ONU/ONT').length})
              </button>
              <button
                onClick={() => setSelectedOnuPackageType('broadband')}
                className={`px-2 py-0.5 font-mono uppercase transition-all rounded-sm cursor-pointer ${
                  selectedOnuPackageType === 'broadband'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Broadband ({filteredDevices.filter(d => d.type === 'ONU/ONT' && !getDeviceCustomerPackage(d)?.packageSpeed.toLowerCase().includes('dedicated')).length})
              </button>
              <button
                onClick={() => setSelectedOnuPackageType('dedicated')}
                className={`px-2 py-0.5 font-mono uppercase transition-all rounded-sm cursor-pointer ${
                  selectedOnuPackageType === 'dedicated'
                    ? 'bg-fuchsia-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dedicated ({filteredDevices.filter(d => d.type === 'ONU/ONT' && !!getDeviceCustomerPackage(d)?.packageSpeed.toLowerCase().includes('dedicated')).length})
              </button>
            </div>
          </div>

          {filteredDevices
            .filter((d) => d.type === 'ONU/ONT')
            .filter((d) => {
              if (selectedOnuPackageType === 'ALL') return true;
              const cust = getDeviceCustomerPackage(d);
              const isDedicated = cust ? cust.packageSpeed.toLowerCase().includes('dedicated') : false;
              return selectedOnuPackageType === 'dedicated' ? isDedicated : !isDedicated;
            })
            .map((dev) => {
              const cust = getDeviceCustomerPackage(dev);
              const isDedicated = cust ? cust.packageSpeed.toLowerCase().includes('dedicated') : false;
              
              return (
                <NeonBox 
                  key={dev.id} 
                  variant={dev.status === 'offline' ? 'red' : dev.status === 'warning' ? 'amber' : isDedicated ? 'fuchsia' : 'emerald'} 
                  className="p-4" 
                  subtitle={dev.id}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="p-2.5 bg-slate-950 border border-white/5 rounded shrink-0">
                        {getDeviceIcon(dev.type)}
                      </div>
                      <div>
                        <h4 className="font-orbitron font-bold text-xs uppercase text-slate-100 flex items-center gap-1.5 flex-wrap">
                          {dev.name}
                          {isDedicated && (
                            <span className="px-1.5 py-0.5 bg-fuchsia-950/80 border border-fuchsia-500/30 text-fuchsia-400 font-bold text-[8px] rounded uppercase tracking-wider animate-pulse">
                              💎 VVIP DEDICATED
                            </span>
                          )}
                        </h4>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                          Model: {dev.model} • IP: <span className="text-cyan-400">{dev.ipAddress}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded ${getStatusColor(dev.status)}`}>
                      {dev.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5 font-mono text-[10px]">
                    <div>
                      <span className="text-slate-500 block">PELANGGAN (OWNER)</span>
                      <span className="text-slate-200 mt-0.5 block font-semibold hover:underline">
                        {dev.associatedCustomerName || 'Unassigned'}
                      </span>
                      {cust && (
                        <div className="mt-1.5">
                          <span className={`px-1.5 py-0.5 border text-[8px] font-bold rounded uppercase tracking-wide inline-block ${
                            isDedicated 
                              ? 'bg-fuchsia-950/60 border-fuchsia-500/40 text-fuchsia-400' 
                              : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400'
                          }`}>
                            {cust.packageSpeed}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">GPON PORT OLT LINK</span>
                      <span className="text-slate-200 mt-0.5 block truncate font-semibold">
                        {dev.gponPort || 'None-Standalone'}
                      </span>
                    </div>
                  </div>

                  {dev.status !== 'offline' && (
                    <div className="mt-3 p-3 bg-slate-950/60 rounded border border-white/5 grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
                      <div>ONT Temperature: <strong className="text-emerald-400">{dev.temperature}°C</strong></div>
                      <div>Laser RX Optis: <strong className={dev.rxPower <= -27 ? "text-amber-400 animate-pulse" : "text-emerald-400"}>{dev.rxPower} dBm</strong></div>
                    </div>
                  )}

                  {/* Reboot simulation */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => handleRebootSimulation(dev.id)}
                      disabled={rebootingId === dev.id}
                      className="px-2.5 py-1 hover:bg-slate-900 border border-emerald-500/10 hover:border-emerald-500/50 text-[10px] text-emerald-400 hover:text-white font-mono uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCcw className={`w-3 h-3 ${rebootingId === dev.id ? 'animate-spin' : ''}`} />
                      RESTART ONT MODEM
                    </button>
                  </div>
                </NeonBox>
              );
            })}
          {filteredDevices
            .filter((d) => d.type === 'ONU/ONT')
            .filter((d) => {
              if (selectedOnuPackageType === 'ALL') return true;
              const cust = getDeviceCustomerPackage(d);
              const isDedicated = cust ? cust.packageSpeed.toLowerCase().includes('dedicated') : false;
              return selectedOnuPackageType === 'dedicated' ? isDedicated : !isDedicated;
            }).length === 0 && (
            <div className="p-6 bg-slate-950/40 border border-slate-900 border-dashed rounded text-center text-slate-500 font-mono text-xs">
              Mnemonic: No client ONTs match the selected filtering region or service class.
            </div>
          )}
        </div>
      </div>

      {/* CONFIGURATION & SETTINGS FOR OLT PER REGION */}
      <NeonBox variant="cyan" title="SINKRONISASI & SETINGAN KONFIGURASI OLT SETIAP DAERAH (WILAYAH)" subtitle="Regional OLT Hub & Auto-Provisioning Core Coordinator">
        <div className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-cyan-500/10 rounded mb-4 font-mono text-xs text-slate-300">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                Sistem Sinkronisasi & Auto-Provisioning Core
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Atur parameter teknis OLT untuk setiap wilayah operasional. Ketika fitur <strong className="text-cyan-400">"Provisioning Otomatis"</strong> diaktifkan, setiap registrasi pelanggan baru di wilayah terkait akan secara otomatis dikonfigurasi pada OLT chassis (mendaftarkan Serial Number ONT, memetakan VLAN, dan mem-binding bandwidth profil) serta disinkronkan langsung ke router MikroTik secara real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {regions.map((reg) => {
              const cfg = regionalOlts[reg] || { ip: '10.100.1.10', model: 'ZTE C300', vlan: 200, autoReg: true, dba: '100 Mbps Dedicated', ports: 16, status: 'active' };
              const isSavedJustNow = lastSavedRegion === reg;
              
              return (
                <div key={reg} className="p-3 bg-slate-950/45 border border-slate-900 rounded-lg space-y-3 font-mono text-[11px] relative overflow-hidden">
                  {/* Decorative background scan line for active autoReg */}
                  {cfg.autoReg && (
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-cyan-500/20 shadow-[0_1px_4px_rgba(6,182,212,0.4)] animate-pulse" />
                  )}

                  {/* Header Row */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-100 font-bold text-xs uppercase tracking-tight flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      {reg}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.autoReg ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      <span className={`text-[8.5px] uppercase font-bold ${cfg.autoReg ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {cfg.autoReg ? 'AUTO-SYNC' : 'MANUAL'}
                      </span>
                    </div>
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <label className="text-slate-500 block text-[8px] uppercase font-semibold">Tipe / Model OLT:</label>
                      <select
                        value={cfg.model}
                        onChange={(e) => handleUpdateRegionalOlt(reg, { model: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 hover:border-cyan-500/30 text-slate-200 py-1 px-1.5 rounded focus:outline-none focus:border-cyan-400"
                      >
                        <option value="ZTE C300 Rackmount">ZTE C300 Rackmount</option>
                        <option value="Huawei MA5800-T">Huawei MA5800-T</option>
                        <option value="ZTE C320 Mini-OLT">ZTE C320 Mini-OLT</option>
                        <option value="FiberHome AN5516">FiberHome AN5516</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-500 block text-[8px] uppercase font-semibold">IP Address Chassis:</label>
                      <input
                        type="text"
                        value={cfg.ip}
                        onChange={(e) => handleUpdateRegionalOlt(reg, { ip: e.target.value })}
                        placeholder="10.100.1.10"
                        className="w-full bg-slate-950 border border-slate-850 hover:border-cyan-500/30 text-slate-200 py-1 px-1.5 rounded focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 block text-[8px] uppercase font-semibold">Service VLAN ID:</label>
                      <input
                        type="number"
                        value={cfg.vlan}
                        onChange={(e) => handleUpdateRegionalOlt(reg, { vlan: parseInt(e.target.value, 10) || 200 })}
                        placeholder="200"
                        className="w-full bg-slate-950 border border-slate-850 hover:border-cyan-500/30 text-slate-200 py-1 px-1.5 rounded focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 block text-[8px] uppercase font-semibold">DBA Profile Default:</label>
                      <select
                        value={cfg.dba}
                        onChange={(e) => handleUpdateRegionalOlt(reg, { dba: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 hover:border-cyan-500/30 text-slate-200 py-1 px-1.5 rounded focus:outline-none focus:border-cyan-400"
                      >
                        <option value="30 Mbps">30 Mbps</option>
                        <option value="50 Mbps">50 Mbps</option>
                        <option value="100 Mbps Dedicated">100 Mbps Dedicated</option>
                        <option value="200 Mbps Dedicated">200 Mbps Dedicated</option>
                        <option value="300 Mbps Dedicated">300 Mbps Dedicated</option>
                        <option value="500 Mbps Dedicated">500 Mbps Dedicated</option>
                        <option value="1 Gbps Dedicated">1 Gbps Dedicated</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-500 block text-[8px] uppercase font-semibold">Jumlah GPON Port:</label>
                      <input
                        type="number"
                        value={cfg.ports}
                        onChange={(e) => handleUpdateRegionalOlt(reg, { ports: parseInt(e.target.value, 10) || 16 })}
                        className="w-full bg-slate-950 border border-slate-850 text-slate-300 py-1 px-1.5 rounded focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 block text-[8px] uppercase font-semibold">Status Koneksi OLT:</label>
                      <select
                        value={cfg.status}
                        onChange={(e) => handleUpdateRegionalOlt(reg, { status: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 text-slate-200 py-1 px-1.5 rounded focus:outline-none focus:border-cyan-400"
                      >
                        <option value="active">ACTIVE / ONLINE</option>
                        <option value="maintenance">MAINTENANCE</option>
                        <option value="offline">OFFLINE / CUT</option>
                      </select>
                    </div>
                  </div>

                  {/* Provisioning Switch */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 bg-slate-950/25 p-1 rounded">
                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                      <Zap className={`w-3 h-3 ${cfg.autoReg ? 'text-cyan-400 fill-current' : 'text-slate-600'}`} />
                      Provisioning Otomatis (Auto-Reg)
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cfg.autoReg}
                        onChange={(e) => handleUpdateRegionalOlt(reg, { autoReg: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950 peer-checked:after:border-cyan-300"></div>
                    </label>
                  </div>

                  {/* Success indicator message */}
                  {isSavedJustNow && (
                    <div className="text-[9px] text-cyan-400 font-bold bg-cyan-950/20 border border-cyan-500/20 px-1.5 py-0.5 rounded text-center animate-bounce">
                      ✓ Konfigurasi Regional Berhasil Disinkronkan!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </NeonBox>

      {/* OLT Auto-Configuration Assistant Panel */}
      <NeonBox variant="cyan" title="ASISTEN OTOMATISASI & KONFIGURASI PROVISIONING GPON OLT" subtitle="OLT Provisioning Core Control Panel">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: configuration parameters */}
          <div className="lg:col-span-5 space-y-4 font-mono text-xs text-slate-300">
            <div className="p-3 bg-slate-950/60 border border-cyan-500/10 rounded">
              <span className="text-cyan-400 font-bold block mb-1 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Parameter Konfigurasi
              </span>
              <p className="text-[10px] text-slate-500">
                Sistem akan menyusun syntax CLI sesuai standar vendor OLT secara real-time dan mengeksekusinya ke core fiber optik.
              </p>
            </div>

            {/* Target OLT */}
            <div>
              <label className="block text-slate-500 uppercase text-[9px] mb-1 font-bold">Pilih Perangkat OLT Tujuan:</label>
              <select
                value={oltTarget}
                onChange={(e) => setOltTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-200 py-1.5 px-2 rounded"
              >
                <option value="DEV-OLT-001">OLT C300 - Cikarang Sukatani (10.100.1.10)</option>
                <option value="DEV-OLT-002">OLT MA5800 - Bekasi Jatimakmur (10.100.2.10)</option>
                <option value="DEV-OLT-003">OLT C320 - Bekasi Jatiasih (10.100.3.10)</option>
                <option value="DEV-OLT-004">OLT MA5800 - Bekasi Dewi Sartika (10.100.4.10)</option>
                <option value="DEV-OLT-005">OLT C300 - Cikarang Cibarusah (10.100.5.10)</option>
                <option value="DEV-OLT-006">OLT C300 - Cikarang Jatibaru (10.100.6.10)</option>
              </select>
            </div>

            {/* Mode Provisioning */}
            <div>
              <label className="block text-slate-500 uppercase text-[9px] mb-1 font-bold">Modul / Jenis Konfigurasi:</label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setConfigMode('register')}
                  className={`py-1.5 px-2 text-[10px] uppercase font-bold border transition-all text-center cursor-pointer ${
                    configMode === 'register'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-400'
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Regis ONT
                </button>
                <button
                  onClick={() => setConfigMode('vlan_mapping')}
                  className={`py-1.5 px-2 text-[10px] uppercase font-bold border transition-all text-center cursor-pointer ${
                    configMode === 'vlan_mapping'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-400'
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  VLAN Port
                </button>
                <button
                  onClick={() => setConfigMode('dba_profile')}
                  className={`py-1.5 px-2 text-[10px] uppercase font-bold border transition-all text-center cursor-pointer ${
                    configMode === 'dba_profile'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-400'
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  DBA Profile
                </button>
              </div>
            </div>

            {configMode === 'register' && (
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-950/40 border border-white/5 rounded">
                <div>
                  <label className="block text-slate-500 uppercase text-[8px] mb-1 font-bold">Nama Pelanggan:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-200 py-1 px-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase text-[8px] mb-1 font-bold">Serial Number ONT:</label>
                  <input
                    type="text"
                    value={onuSn}
                    onChange={(e) => setOnuSn(e.target.value)}
                    placeholder="ZTEGC1234567"
                    className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-200 py-1 px-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase text-[8px] mb-1 font-bold">Tipe ONU ONT:</label>
                  <select
                    value={onuType}
                    onChange={(e) => setOnuType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-200 py-1 px-1.5 rounded"
                  >
                    <option value="ZTE F670L Dual Band">ZTE F670L Dual Band</option>
                    <option value="Huawei EG8145V5">Huawei EG8145V5</option>
                    <option value="ZTE F609 V5.2">ZTE F609 V5.2</option>
                    <option value="Huawei HG8245H5">Huawei HG8245H5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 uppercase text-[8px] mb-1 font-bold">Service VLAN ID:</label>
                  <input
                    type="number"
                    value={onuVlan}
                    onChange={(e) => setOnuVlan(e.target.value)}
                    placeholder="200"
                    className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-200 py-1 px-1.5 rounded"
                  />
                </div>
              </div>
            )}

            {configMode === 'vlan_mapping' && (
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-950/40 border border-white/5 rounded">
                <div>
                  <label className="block text-slate-500 uppercase text-[8px] mb-1 font-bold">Pilih VLAN ID:</label>
                  <input
                    type="number"
                    value={onuVlan}
                    onChange={(e) => setOnuVlan(e.target.value)}
                    placeholder="200"
                    className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-200 py-1 px-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase text-[8px] mb-1 font-bold">Tagging Port Mode:</label>
                  <select className="w-full bg-slate-950 border border-slate-900 focus:outline-none text-slate-200 py-1 px-1.5 rounded">
                    <option>Trunk Tagged (Standard)</option>
                    <option>Access Untagged</option>
                    <option>QinQ Double Tagged</option>
                  </select>
                </div>
              </div>
            )}

            {configMode === 'dba_profile' && (
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-950/40 border border-white/5 rounded">
                <div className="col-span-2">
                  <label className="block text-slate-500 uppercase text-[8px] mb-1 font-bold">Limitasi Bandwidth Profile:</label>
                  <select
                    value={onuProfile}
                    onChange={(e) => setOnuProfile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:outline-none focus:border-cyan-400 text-slate-200 py-1 px-1.5 rounded"
                  >
                    <option value="30 Mbps">30 Mbps (Broadband)</option>
                    <option value="50 Mbps">50 Mbps (Premium)</option>
                    <option value="100 Mbps">100 Mbps (High Speed)</option>
                    <option value="100 Mbps Dedicated">100 Mbps Dedicated SLA</option>
                    <option value="200 Mbps Dedicated">200 Mbps Dedicated SLA</option>
                    <option value="300 Mbps Dedicated">300 Mbps Dedicated SLA</option>
                    <option value="500 Mbps Dedicated">500 Mbps Dedicated SLA</option>
                    <option value="1 Gbps Dedicated">1 Gbps Dedicated SLA</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={handleRunOltConfig}
              disabled={isConfiguring}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 text-[11px] font-black tracking-wider uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/50 disabled:opacity-40"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isConfiguring ? 'animate-pulse' : ''}`} />
              {isConfiguring ? 'Sedang Memproses Script OLT...' : 'Jalankan Konfigurasi Otomatis'}
            </button>
          </div>

          {/* Right panel: Live scrolling CLI terminal terminal */}
          <div className="lg:col-span-7 flex flex-col h-[320px] bg-black/90 border border-slate-850 rounded relative overflow-hidden font-mono">
            {/* Terminal Top bar */}
            <div className="flex justify-between items-center bg-slate-950 px-3 py-1.5 border-b border-white/5 text-[9px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                CLI SHELL TERMINAL - {oltTarget}
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isConfiguring ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                {isConfiguring ? 'SINKRONISASI' : 'TERMINAL IDLE'}
              </span>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-3 text-[10px] space-y-1 bg-black/95 select-text text-emerald-400 scrollbar-thin">
              {oltLogs.map((log, i) => {
                let colorClass = 'text-emerald-500';
                if (log.startsWith('[SUCCESS]')) {
                  colorClass = 'text-cyan-400 font-bold';
                } else if (log.startsWith('[COMMAND]')) {
                  colorClass = 'text-slate-300';
                } else if (log.startsWith('[INFO]')) {
                  colorClass = 'text-indigo-400 font-bold';
                } else if (log.startsWith('[SCAN]')) {
                  colorClass = 'text-amber-400';
                } else if (log.startsWith('[AUTH]')) {
                  colorClass = 'text-purple-400';
                }
                return (
                  <div key={i} className={`leading-relaxed whitespace-pre-wrap ${colorClass}`}>
                    {log}
                  </div>
                );
              })}
              {isConfiguring && (
                <div className="text-cyan-400 text-[10px] animate-pulse flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                  Mengirim instruksi baris perintah ke microchip OLT...
                </div>
              )}
            </div>

            {/* Progress bar inside terminal footer */}
            {isConfiguring && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${configProgress}%` }}
                />
              </div>
            )}
          </div>

        </div>
      </NeonBox>
    </div>
  );
}
