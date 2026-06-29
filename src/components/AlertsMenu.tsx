import React, { useState } from 'react';
import { NetworkAlert, Region } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, MapPin, ShieldAlert, Send, Wrench, Search, Info } from 'lucide-react';
import NeonBox from './NeonBox';

interface AlertsMenuProps {
  alerts: NetworkAlert[];
  regions: Region[];
  onAcknowledgeAlert: (alertId: string, operatorName: string) => void;
  onResolveAlert: (alertId: string) => void;
}

export default function AlertsMenu({
  alerts,
  regions,
  onAcknowledgeAlert,
  onResolveAlert,
}: AlertsMenuProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  // Filter alerts lists
  const filteredAlerts = alerts.filter((alt) => {
    const matchRegion = selectedRegion === 'ALL' || alt.region === selectedRegion;
    const matchSeverity = selectedSeverity === 'ALL' || alt.severity === selectedSeverity;
    const matchSearch =
      (alt.customerName && alt.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      alt.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchSeverity && matchSearch;
  });

  const getSeverityBadge = (severity: 'CRITICAL' | 'WARNING' | 'INFO') => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/50 text-red-400 border border-red-500/50 text-xs font-mono font-bold uppercase animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/50 text-amber-400 border border-amber-500/40 text-xs font-mono font-semibold uppercase">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            WARNING
          </span>
        );
      case 'INFO':
        default:
          return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/50 text-blue-400 border border-blue-500/30 text-xs font-mono uppercase">
              <Info className="w-4 h-4 text-blue-400" />
              INFO
            </span>
          );
    }
  };

  const handleDispatchTechnician = (alertId: string, location: string) => {
    setDispatchedId(alertId);
    
    // Simulate radio communication dispatch
    setTimeout(() => {
      setDispatchedId(null);
      alert(`TEKNISI DISPATCH: Teknisi lapangan wilayah ${location} telah ditugaskan untuk menangani tiket #${alertId}. Membawa splicing tool & OTDR optis.`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Alert metrics with Neon Box widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeonBox variant="red" title="GANGGUAN KRITIS" subtitle="Critical fiber incidents" className="p-4" withGlitch={true}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-orbitron font-black text-red-400 neon-glow-red mt-1">
                {alerts.filter(a => !a.resolved && a.severity === 'CRITICAL').length}
              </p>
              <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">
                Total Gangguan Putus Sinyal (RED LOS)
              </p>
            </div>
            <ShieldAlert className="w-8 h-8 text-red-500 opacity-80 animate-bounce" />
          </div>
        </NeonBox>

        <NeonBox variant="amber" title="PERINGATAN REDAMAN" subtitle="High optical loss alerts" className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-orbitron font-black text-amber-400 neon-glow-amber mt-1">
                {alerts.filter(a => !a.resolved && a.severity === 'WARNING').length}
              </p>
              <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">
                Microbending / Degradasi Jalur
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-505 opacity-80" />
          </div>
        </NeonBox>

        <NeonBox variant="emerald" title="BERHASIL DISINGKIRKAN" subtitle="Resolved tickets" className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-orbitron font-black text-emerald-400 neon-glow-emerald mt-1">
                {alerts.filter(a => a.resolved).length}
              </p>
              <p className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                Laporan Gangguan Terselesaikan
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500 opacity-80" />
          </div>
        </NeonBox>
      </div>

      {/* Grid Filter control */}
      <NeonBox variant="cyan" title="NOC INCIDENT MONITOR HANDLER" subtitle="Active Incidents filtration Console">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Filter Wilayah Insiden:
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

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Filter Keparahan (Severity):
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-2 px-3 text-xs font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">Semua Level Keparahan</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
              <option value="INFO">Info Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Cari Pelanggan / Detail Isu:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari keterangan / nama..."
                className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-600 pl-9 pr-4 py-2 text-xs font-mono transition-colors"
              />
            </div>
          </div>
        </div>
      </NeonBox>

      {/* Main Alert Feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-mono border border-slate-850 bg-slate-950/40 rounded-none text-xs">
            *** MONITOR CLEAR: TIDAK ADA ALERTS GANGGUAN PADA PARAMETER INI ***
          </div>
        ) : (
          filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              className={`border-l-4 p-5 transition-all duration-200 ${
                alt.resolved
                  ? 'border-emerald-500 bg-emerald-950/5'
                  : alt.severity === 'CRITICAL'
                  ? 'border-red-500 bg-red-950/5 shadow-[0_0_10px_rgba(239,68,68,0.05)]'
                  : 'border-amber-500 bg-amber-950/5'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-3.5 items-start">
                  <div className="mt-1 shrink-0">
                    {alt.resolved ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className={`w-5 h-5 ${alt.severity === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-100">
                        {alt.type}
                      </span>
                      {getSeverityBadge(alt.severity)}
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-cyan-400">
                        <MapPin className="w-3 h-3" />
                        {alt.region}
                      </span>
                      {alt.customerName && (
                        <span className="font-sans font-medium text-xs text-slate-300">
                          - Pelanggan: <strong className="text-white hover:underline cursor-pointer">{alt.customerName}</strong> ({alt.customerId})
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
                      {alt.message}
                    </p>

                    <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {new Date(alt.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB • {new Date(alt.timestamp).toLocaleDateString('id-ID')}
                      </span>
                      {alt.resolved && (
                        <span className="text-emerald-500 font-bold uppercase">
                          • Terselesaikan (NOC Sync OK)
                        </span>
                      )}
                      {alt.ackBy && (
                        <span>• Di-acknowledge oleh: <strong className="text-cyan-400">{alt.ackBy}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations Actions bar */}
                <div className="flex flex-wrap md:flex-col gap-2 shrink-0 md:items-end w-full md:w-auto">
                  {!alt.resolved ? (
                    <>
                      {/* Resolve incident button */}
                      <button
                        onClick={() => onResolveAlert(alt.id)}
                        className="flex-1 md:flex-none px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-950 border border-emerald-500/20 hover:border-emerald-500 text-[10px] text-emerald-400 hover:text-white font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Selesaikan Gangguan
                      </button>

                      {/* Dispatch Field engineer */}
                      {alt.customerName && (
                        <button
                          onClick={() => handleDispatchTechnician(alt.id, alt.region)}
                          disabled={dispatchedId === alt.id}
                          className="flex-1 md:flex-none px-3.5 py-1.5 bg-slate-900 hover:bg-cyan-950 border border-cyan-500/20 hover:border-cyan-500 text-[10px] text-cyan-400 hover:text-white font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {dispatchedId === alt.id ? "MENENTUKAN..." : "Kirim Teknisi"}
                        </button>
                      )}

                      {/* Acknowledge event */}
                      {!alt.ackBy && (
                        <button
                          onClick={() => onAcknowledgeAlert(alt.id, 'NOC_Operator_Sistem')}
                          className="flex-1 md:flex-none px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-500 text-[10px] text-slate-400 hover:text-slate-100 font-mono uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Ack Alert
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] font-mono bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 uppercase rounded-sm">
                      Ticket Closed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
