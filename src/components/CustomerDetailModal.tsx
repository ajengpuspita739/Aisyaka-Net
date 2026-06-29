import React, { useState } from 'react';
import { Customer } from '../types';
import { 
  X, User, Phone, MapPin, Signal, Wifi, Key, Layers, Radio, Play, 
  Flame, Check, RefreshCw, Settings, Save, Eye, EyeOff, ShieldAlert, Laptop
} from 'lucide-react';
import NeonBox from './NeonBox';

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
  onUpdate: (updated: Customer) => void;
  onOpenRemoteOnt?: (customer: Customer) => void;
}

export default function CustomerDetailModal({
  customer,
  onClose,
  onUpdate,
  onOpenRemoteOnt,
}: CustomerDetailModalProps) {
  // Tabs for modal views
  const [activeSettingsTab, setActiveSettingsTab] = useState<'diagnostics' | 'pppoe'>('diagnostics');

  // Diagnostics processes states
  const [runningOtdr, setRunningOtdr] = useState(false);
  const [otdrResult, setOtdrResult] = useState<string | null>(null);
  
  const [runningPing, setRunningPing] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  // Optical and operation notification message states
  const [calibrationMsg, setCalibrationMsg] = useState<string | null>(null);

  // Local PPPoE settings state copies
  const [pppoeUser, setPppoeUser] = useState(customer.pppoeUsername || '');
  const [pppoePass, setPppoePass] = useState(customer.pppoePassword || '');
  const [vlan, setVlan] = useState<number>(customer.vlanId || 200);
  const [servicePreset, setServicePreset] = useState(customer.pppServicePreset || 'PPPoE_HSIA_VLAN_100');
  const [pppState, setPppState] = useState<'connected' | 'disconnected' | 'authenticating'>(customer.pppStatus || 'connected');
  
  // Local WiFi settings state copies
  const [wifiSsid, setWifiSsid] = useState(customer.wifiSsid || '');
  const [wifiPasswordState, setWifiPasswordState] = useState(customer.wifiPassword || '');
  
  // View options
  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Optical signal description
  const getPowerQuality = (power: number) => {
    if (customer.status === 'offline') return { label: 'Koneksi Terputus (Loss Of Signal)', color: 'text-red-500 font-bold' };
    if (power >= -24) return { label: 'Optimal (Sinyal Sempurna)', color: 'text-emerald-400 font-bold' };
    if (power >= -27) return { label: 'Marginal (Disarankan Optimasi Optis)', color: 'text-amber-400 font-medium' };
    return { label: 'Critical High Loss (Sinyal Sangat Buruk / Terganggu)', color: 'text-red-400 font-bold animate-pulse' };
  };

  // Run a simulated Optical Time Domain Reflectometer (OTDR) test to map fiber length and health!
  const runOtdrScan = () => {
    setRunningOtdr(true);
    setOtdrResult(null);

    setTimeout(() => {
      setRunningOtdr(false);
      const isDamaged = customer.status !== 'online';
      const fiberLen = 120 + Math.floor(Math.random() * 800);
      
      if (isDamaged) {
         const breakDist = Math.floor(fiberLen * 0.7);
         setOtdrResult(
           `*** LAPORAN REFLEKTOMETER OTDR KABEL OPTIK ***\n` +
           `Status Serat: TERGANGGU (EVENT REFLEKSI TINGGI)\n` +
           `Panjang Kabel Total: ${fiberLen} Meter\n` +
           `Lokasi Titik Putus/Tekukan Kritis: ${breakDist} Meter dari arah ODP\n` +
           `Rekomendasi Teknisi: Lakukan Fusion Splicer kabel drop-core ulang pada jarak ${breakDist}m.`
         );
      } else {
         setOtdrResult(
           `*** LAPORAN REFLEKTOMETER OTDR KABEL OPTIK ***\n` +
           `Status Serat: NORMAL (KABEL SEHAT)\n` +
           `Panjang Kabel Total: ${fiberLen} Meter\n` +
           `Aproksimasi Atenuasi: 0.22 dB/km pada Lambda 1310/1490nm\n` +
           `Penyebaran Sinyal: Sempurna. Tidak ditemukan macrobending.`
         );
      }
    }, 1500);
  };

  // Run a ping terminal checklist simulation
  const runPingDiagnosis = () => {
    setRunningPing(true);
    setPingResult(null);

    setTimeout(() => {
      setRunningPing(false);
      const latencyBase = customer.status === 'online' ? 8 : 140;
      const isOk = customer.status === 'online';

      if (isOk) {
        setPingResult(
          `PING ${customer.ipAddress} dengan 32 bait data:\n` +
          `Balasan dari ${customer.ipAddress}: bait=32 waktu=${latencyBase}ms TTL=64\n` +
          `Balasan dari ${customer.ipAddress}: bait=32 waktu=${latencyBase + 1}ms TTL=64\n` +
          `Balasan dari ${customer.ipAddress}: bait=32 waktu=${latencyBase - 1}ms TTL=64\n` +
          `Statistik Ping: Dikirim = 3, Diterima = 3, Hilang = 0 (0% loss)`
        );
      } else if (customer.status === 'offline') {
        setPingResult(
          `PING ${customer.ipAddress} dengan 32 bait data:\n` +
          `RTO (Request timed out)\n` +
          `RTO (Request timed out)\n` +
          `RTO (Request timed out)\n` +
          `Statistik Ping: Dikirim = 3, Diterima = 0, Hilang = 3 (100% loss)`
        );
      } else {
        setPingResult(
          `PING ${customer.ipAddress} dengan 32 bait data:\n` +
          `Balasan dari ${customer.ipAddress}: bait=32 waktu=${latencyBase + 45}ms TTL=64 (PING SPIKE)\n` +
          `RTO (Request timed out)\n` +
          `Balasan dari ${customer.ipAddress}: bait=32 waktu=${latencyBase - 12}ms TTL=64\n` +
          `Statistik Ping: Dikirim = 3, Diterima = 2, Hilang = 1 (33% loss)`
        );
      }
    }, 1200);
  };

  // Remote Optical Calibration
  const triggerOpticalReCalibration = () => {
    if (customer.status === 'offline') {
      setCalibrationMsg("Gagal: ONT Offline atau putus fisik.");
      return;
    }
    
    setCalibrationMsg("Mengirimkan sinyal kalibrasi sfp gpon laser...");
    setTimeout(() => {
      onUpdate({
        ...customer,
        opticalPower: Math.min(-18.5, Number((customer.opticalPower + 1.2).toFixed(1))),
        status: 'online'
      });
      setCalibrationMsg("Optimalisasi laser berhasil diselesaikan!");
      setTimeout(() => setCalibrationMsg(null), 4000);
    }, 1000);
  };

  // Save modified PPPoE & VLAN properties to subscriber
  const handleSavePppoeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      const updatedCust = {
        ...customer,
        pppoeUsername: pppoeUser,
        pppoePassword: pppoePass,
        vlanId: Number(vlan),
        pppServicePreset: servicePreset,
        pppStatus: pppState,
        wifiSsid: wifiSsid,
        wifiPassword: wifiPasswordState
      };

      // Auto-heal physical connection if PPPoE is connected
      if (pppState === 'connected' && (customer.status === 'offline' || customer.opticalPower <= -35)) {
        updatedCust.status = 'online';
        updatedCust.opticalPower = -19.5;
      } else if (pppState === 'disconnected') {
        updatedCust.status = 'offline';
        updatedCust.opticalPower = -40.0;
      }

      onUpdate(updatedCust);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  // Revert back and Autofill PPPoE settings to regional standards
  const triggerAutofillDefaults = () => {
    const cleanName = customer.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setPppoeUser(`${cleanName}@aisyaka.net`);
    setPppoePass(`aisyaka${customer.id.replace('CUST-', '')}pass`);
    setVlan(200 + (Math.floor(Math.random() * 80)));
    setServicePreset('PPPoE_HSIA_VLAN_100');
    setPppState('connected');
    setWifiSsid(`${customer.name.split(' ')[0].toUpperCase()}_WIFI_GPON`);
    setWifiPasswordState(`aisyaka${customer.id.replace('CUST-', '')}@123`);
  };

  const qualInfo = getPowerQuality(customer.opticalPower);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-3xl z-10 my-8">
        <NeonBox variant={customer.status === 'offline' ? 'red' : customer.status === 'gangguan' ? 'amber' : 'cyan'}>
          {/* Header row */}
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="font-orbitron font-bold text-sm tracking-wider uppercase">
                  DIAGNOSIS DETAIL & KONTROL PELANGGAN
                </h2>
                <p className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase">
                  ID: {customer.id} • {customer.name}
                </p>
              </div>
            </div>
            <button
              id="close-modal-btn"
              onClick={onClose}
              className="p-1.5 border border-slate-800 hover:border-cyan-400 text-slate-400 hover:text-white bg-slate-950 transition-colors cursor-pointer rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector Buttons */}
          <div className="grid grid-cols-2 bg-slate-950/80 border border-slate-900 rounded p-1 mb-5 gap-1">
            <button
              onClick={() => setActiveSettingsTab('diagnostics')}
              className={`py-2 px-3 font-orbitron text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeSettingsTab === 'diagnostics'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Signal className="w-4 h-4" />
              Diagnosis & Telemetri Optik
            </button>
            <button
              onClick={() => setActiveSettingsTab('pppoe')}
              className={`py-2 px-3 font-orbitron text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeSettingsTab === 'pppoe'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configurasi Akun PPPoE / VLAN
            </button>
          </div>

          {/* Render Tab Contents */}
          {activeSettingsTab === 'diagnostics' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Panel: Customer Metadata details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-1">
                    // DATA IDENTITAS PELANGGAN
                  </h3>
                  
                  <div className="space-y-2 text-xs font-sans">
                    <div className="bg-slate-950 p-2 border border-white/5">
                      <p className="text-[10px] font-mono text-slate-500">NAMA LENGKAP</p>
                      <p className="text-sm font-bold text-slate-200 mt-1">{customer.name}</p>
                    </div>

                    <div className="bg-slate-950 p-2 border border-white/5 flex gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] font-mono text-slate-500">WILAYAH DISTRIBUSI</p>
                        <p className="text-xs font-semibold text-slate-200 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {customer.region}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-mono text-slate-500">KECEPATAN PAKET</p>
                        <p className="text-xs font-semibold text-amber-400 mt-1">
                          {customer.packageSpeed} Broadband
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2 border border-white/5">
                      <p className="text-[10px] font-mono text-slate-500">ALAMAT PEMASANGAN FTTH</p>
                      <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">{customer.address}</p>
                    </div>

                    <div className="bg-slate-950 p-2 border border-white/5">
                      <p className="text-[10px] font-mono text-slate-500">NOMOR KONTAK AKTIF</p>
                      <p className="text-slate-300 mt-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {customer.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Technical diagnostics & optical status */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono text-amber-400 uppercase tracking-widest border-b border-white/5 pb-1">
                    // TELEMETRI OPTIS GPON
                  </h3>

                  <div className="space-y-2.5 text-xs font-mono">
                    {/* Optical signal details */}
                    <div className="bg-slate-950 p-3 border border-white/5 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">REDAMAN STRUKTUR:</span>
                        <span className={`text-sm font-bold ${qualInfo.color}`}>
                          {customer.status === 'offline' ? 'LOSS ALERT' : `${customer.opticalPower} dBm`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                        Standard ITU-T fiber status: <strong className="text-slate-300">{qualInfo.label}</strong>
                      </p>
                    </div>

                    {/* Hardware link details */}
                    <div className="bg-slate-950 p-3 border border-white/5 rounded space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">MODEL PERANGKAT:</span>
                        <span className="text-slate-300">{customer.ontModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">SERIAL NUMBER ONU:</span>
                        <span className="text-slate-300">{customer.onuSn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">IP ADDRESS ONT:</span>
                        <span className="text-cyan-400">{customer.ipAddress}</span>
                      </div>
                    </div>
                    
                    {/* Actions Console list */}
                    <div className="space-y-2 pt-1">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold">Consol Diagnosis Lapangan:</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Launch OTDR test */}
                        <button
                          onClick={runOtdrScan}
                          disabled={runningOtdr}
                          className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-750 font-mono text-[10px] text-cyan-400 uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          {runningOtdr ? 'Reflekting...' : 'OTDR Scan'}
                        </button>

                        {/* Launch Ping check */}
                        <button
                          onClick={runPingDiagnosis}
                          disabled={runningPing}
                          className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-750 font-mono text-[10px] text-cyan-400 uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          {runningPing ? 'Pinging...' : 'Ping Cek'}
                        </button>
                      </div>

                      {/* Remote optical calibration */}
                      <button
                        onClick={triggerOpticalReCalibration}
                        disabled={customer.status === 'offline'}
                        className="w-full py-2 bg-gradient-to-r from-emerald-950 to-cyan-950 hover:from-emerald-900 hover:to-cyan-900 border border-emerald-500/20 hover:border-emerald-500/60 font-mono text-[10px] text-emerald-400 hover:text-white uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Remote Optical SFP Re-calibration
                      </button>

                      {calibrationMsg && (
                        <div className="text-center font-mono text-[10px] px-2 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 rounded mt-2 uppercase">
                          {calibrationMsg}
                        </div>
                      )}

                      {/* Open Remote ONT Portal emulated panel directly */}
                      {onOpenRemoteOnt && (
                        <button
                          type="button"
                          onClick={() => onOpenRemoteOnt(customer)}
                          className="w-full py-2.5 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/20 hover:border-cyan-400 font-mono text-[10px] text-cyan-300 hover:text-white uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)] hover:shadow-[0_0_18px_rgba(6,182,212,0.35)]"
                        >
                          <Laptop className="w-4 h-4 text-cyan-400" />
                          Buka Remote Akses ONT Modem
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostics Terminal Output box if available */}
              {(otdrResult || pingResult) && (
                <div className="mt-6 pt-5 border-t border-white/5">
                  <h4 className="font-mono text-xs text-yellow-500 tracking-wider mb-2 uppercase flex items-center gap-1">
                    <span>[TERMINAL OUTPUT] NOC_Diagnosis_Response://</span>
                  </h4>
                  <pre className="p-3 bg-black text-[#00ffcc] border border-cyan-950 rounded font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">
                    {otdrResult || pingResult}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            /* PPPoE / VLAN Settings Tab view form content */
            <form onSubmit={handleSavePppoeConfig} className="space-y-5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                  // EDITOR PROTOKOL OTENTIKASI & VLAN DRIVER
                </h3>
              </div>

              {/* Success Notification */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-400 rounded flex items-center gap-2.5 font-mono text-xs animate-fadeIn">
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="uppercase">Konfigurasi PPPoE Pelanggan Telah Berhasil Diperbarui di Server OLT & Radius!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Credentials block */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      PPPoE Username / ID Sesi
                    </label>
                    <input
                      type="text"
                      required
                      value={pppoeUser}
                      onChange={(e) => setPppoeUser(e.target.value)}
                      placeholder="username@aisyaka.net"
                      className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder-slate-700 px-3 py-2 text-xs font-mono transition-all rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      PPPoE Password / Kunci Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={pppoePass}
                        onChange={(e) => setPppoePass(e.target.value)}
                        placeholder="Kunci sandi rahasia..."
                        className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder-slate-700 px-3 py-2 pr-10 text-xs font-mono transition-all rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-cyan-400 focus:outline-none transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      VLAN ID (802.1Q)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={4094}
                      value={vlan}
                      onChange={(e) => setVlan(Number(e.target.value))}
                      placeholder="e.g. 215"
                      className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder-slate-700 px-3 py-2 text-xs font-mono transition-all rounded"
                    />
                    <span className="text-[9px] text-slate-500 mt-0.5 block">
                      Range yang diizinkan untuk operasional: 1 s.d 4094
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-900 mt-3 space-y-3">
                    <span className="block text-[9px] text-cyan-400 font-bold uppercase tracking-wider">// SETTING WIFI ONT CLIENT</span>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                        WiFi SSID (Nama WiFi)
                      </label>
                      <input
                        type="text"
                        required
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        placeholder="e.g. USER_WIFI_GPON"
                        className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 px-3 py-2 text-xs font-mono transition-all rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                        WiFi Password
                      </label>
                      <input
                        type="text"
                        required
                        value={wifiPasswordState}
                        onChange={(e) => setWifiPasswordState(e.target.value)}
                        placeholder="Kunci sandi WiFi..."
                        className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 px-3 py-2 text-xs font-mono transition-all rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Network parameters & Profiles */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Service Profile Preset (QoS / SLA)
                    </label>
                    <select
                      value={servicePreset}
                      onChange={(e) => setServicePreset(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 px-3 py-2 text-xs font-mono transition-all rounded cursor-pointer"
                    >
                      <option value="PPPoE_HSIA_VLAN_100">PPPoE_HSIA_VLAN_100 (Uncapped Internet)</option>
                      <option value="PPPoE_IPTV_VLAN_200">PPPoE_IPTV_VLAN_200 (Triple Play HD TV)</option>
                      <option value="PPPoE_Dedicated_VLAN_300">PPPoE_Dedicated_VLAN_300 (Business SLA)</option>
                      <option value="GamePing_LowLatency_500">GamePing_LowLatency_500 (Optimized Gaming)</option>
                      <option value="Standard_VoIP_VLAN_10">Standard_VoIP_VLAN_10 (Voice Service)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Status Koneksi PPPoE (PPP Session)
                    </label>
                    <select
                      value={pppState}
                      onChange={(e) => setPppState(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 px-3 py-2 text-xs font-mono transition-all rounded cursor-pointer"
                    >
                      <option value="connected">TERHUBUNG (Connected / Up)</option>
                      <option value="disconnected">TERPUTUS (Disconnected / Administratively Down)</option>
                      <option value="authenticating">MENGOTENTIKASI (Waiting Handshake)</option>
                    </select>
                  </div>

                  {/* Radius Status Panel block */}
                  <div className="bg-slate-950 border border-slate-900 p-3 rounded">
                    <span className="block text-[9px] text-slate-600 font-bold uppercase mb-1.5">// RADIUS DISPATCH DIAG:</span>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">MAC Address WAN:</span>
                        <span className="text-slate-350 font-semibold">{customer.onuSn.toLowerCase().substring(0,6).replace(/(.{2})/g, '$1:')}XX:XX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Alokasi IP WAN:</span>
                        <span className="text-cyan-400 font-bold">{customer.ipAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status Gateway:</span>
                        <span className={pppState === 'connected' ? 'text-emerald-400 font-bold' : pppState === 'authenticating' ? 'text-amber-400' : 'text-red-500'}>
                          {pppState === 'connected' ? '● REACHABLE (UP)' : pppState === 'authenticating' ? '▲ NESTING...' : '■ UNREACHABLE (DOWN)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset to system standards and Save buttons row */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-950/60 p-3 border border-white/5 rounded gap-3">
                <button
                  type="button"
                  onClick={triggerAutofillDefaults}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-800 hover:border-cyan-500/40 text-slate-500 hover:text-cyan-300 transition-colors uppercase font-mono text-[10px] tracking-wider cursor-pointer font-bold rounded"
                >
                  Autofill Standar Provinsi
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold uppercase font-mono text-[11px] tracking-widest transition-all rounded cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </NeonBox>
      </div>
    </div>
  );
}
