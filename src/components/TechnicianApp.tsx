import React, { useState, useEffect } from 'react';
import { 
  Wrench, Phone, MapPin, CheckCircle, Clock, Calendar, Play, 
  Check, X, FileText, Send, UserCheck, UserX, AlertOctagon, 
  Smartphone, Bell, Signal, Compass, RefreshCw, Layers, Award
} from 'lucide-react';
import NeonBox from './NeonBox';
import { db } from '../db';
import { Customer, Region, Technician, HomeVisit, NetworkAlert } from '../types';

interface TechnicianAppProps {
  customers: Customer[];
  onUpdateCustomers: (updatedList: Customer[]) => void;
  onUpdateAlerts: () => void;
  onBackToAdmin?: () => void; // If they want to toggle back to Admin Mode
  isEmbed?: boolean; // If embedded inside NOC Admin
}

export default function TechnicianApp({
  customers,
  onUpdateCustomers,
  onUpdateAlerts,
  onBackToAdmin,
  isEmbed = false
}: TechnicianAppProps) {
  // DB state sync
  const [technicians, setTechnicians] = useState<Technician[]>(db.getTechnicians());
  const [visits, setVisits] = useState<HomeVisit[]>(db.getHomeVisits());
  const [alerts, setAlerts] = useState<NetworkAlert[]>(db.getAlerts());

  // Current logged in technician context
  const [selectedTechId, setSelectedTechId] = useState<string>(() => {
    const existing = db.getTechnicians();
    return existing.length > 0 ? existing[0].id : '';
  });

  // Interactive OPM test simulation state
  const [opmTestingCustId, setOpmTestingCustId] = useState<string | null>(null);
  const [opmValue, setOpmValue] = useState<number | null>(null);
  const [isOPMCalibrating, setIsOPMCalibrating] = useState(false);

  // Resolution Form modal state
  const [closingVisitId, setClosingVisitId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Notification toast inside mobile view
  const [mobileToast, setMobileToast] = useState<string | null>(null);

  // Sync data
  const syncWithDb = () => {
    setTechnicians(db.getTechnicians());
    setVisits(db.getHomeVisits());
    setAlerts(db.getAlerts());
  };

  useEffect(() => {
    syncWithDb();
  }, [customers]);

  const showToast = (msg: string) => {
    setMobileToast(msg);
    setTimeout(() => {
      setMobileToast(null);
    }, 4000);
  };

  // Find active technician object
  const activeTech = technicians.find(t => t.id === selectedTechId) || technicians[0];

  // Get active tickets for this specific technician
  const activeTickets = visits.filter(v => 
    v.technicianId === selectedTechId && 
    (v.status === 'scheduled' || v.status === 'in_progress')
  );

  // Get history tickets for this specific technician
  const historyTickets = visits.filter(v => 
    v.technicianId === selectedTechId && 
    (v.status === 'completed' || v.status === 'cancelled')
  );

  // Get unassigned/open issues in the tech's operational region
  // (Customers who are 'gangguan' or 'offline' and don't have a scheduled visit yet)
  const openRegionIssues = customers.filter(c => {
    const isDegraded = c.status === 'gangguan' || c.status === 'offline';
    if (!isDegraded) return false;
    
    // Check if there is already an active visit scheduled for this customer
    const hasActiveVisit = visits.some(v => 
      v.customerId === c.id && 
      (v.status === 'scheduled' || v.status === 'in_progress')
    );
    
    // Check if matches tech's region
    const matchesRegion = activeTech ? c.region === activeTech.region : true;
    
    return !hasActiveVisit && matchesRegion;
  });

  // Action: Change Tech Duty Status
  const handleChangeStatus = (status: 'idle' | 'visiting' | 'off') => {
    if (!activeTech) return;
    db.updateTechnician({
      ...activeTech,
      status
    });
    syncWithDb();
    showToast(`Status Anda kini diubah menjadi: ${status === 'idle' ? '🟢 READY / SIAGA' : status === 'visiting' ? '🟡 ON DUTY' : '🔴 OFF DUTY'}`);
  };

  // Action: Self Assign Ticket
  const handleSelfAssign = (customer: Customer) => {
    if (!activeTech) return;
    if (activeTech.status === 'off') {
      alert('Status Anda sedang OFF. Ubah status menjadi SIAGA terlebih dahulu untuk menerima tiket!');
      return;
    }

    db.addHomeVisit({
      customerId: customer.id,
      customerName: customer.name,
      customerAddress: customer.address,
      customerPhone: customer.phone,
      customerRegion: customer.region,
      technicianId: activeTech.id,
      technicianName: activeTech.name,
      issueDescription: customer.status === 'offline' 
        ? 'ONT Offline / LOS Red (Sinyal Putus). Cek kabel dropcore.' 
        : `Optical Power Drop (${customer.opticalPower} dBm). Splicing ulang konektor.`,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'scheduled'
    });

    // Update tech status
    db.updateTechnician({
      ...activeTech,
      status: 'visiting'
    });

    syncWithDb();
    showToast(`Tiket Pelanggan ${customer.name} berhasil ditambahkan ke tugas Anda!`);
  };

  // Action: Start Travel (OTW / Mulai Kerja)
  const handleStartTravel = (visit: HomeVisit) => {
    // Update visit
    db.updateHomeVisit({
      ...visit,
      status: 'in_progress'
    });

    // Sync tech status
    if (activeTech) {
      db.updateTechnician({
        ...activeTech,
        status: 'visiting'
      });
    }

    // Auto-ack active alert
    const updatedAl = alerts.map(al => {
      if (al.customerId === visit.customerId && !al.resolved) {
        return {
          ...al,
          ackBy: `OTW: ${visit.technicianName}`
        };
      }
      return al;
    });
    db.updateAlerts(updatedAl);
    onUpdateAlerts();

    syncWithDb();
    showToast(`Status Kunjungan ${visit.id} diperbarui: Anda dalam perjalanan (OTW)!`);
  };

  // Action: Perform virtual OPM line measurement
  const handleRunOPM = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    setOpmTestingCustId(customerId);
    setIsOPMCalibrating(true);
    setOpmValue(null);

    // Simulate high frequency light power measurement
    setTimeout(() => {
      setIsOPMCalibrating(false);
      setOpmValue(cust.opticalPower);
    }, 1500);
  };

  // Action: Complete Repair Ticket (Triggering report dialog)
  const handleCompleteRepairPrompt = (visitId: string) => {
    setClosingVisitId(visitId);
    
    // Autofill resolution suggestions
    const visitObj = visits.find(v => v.id === visitId);
    if (visitObj) {
      const isOffline = customers.find(c => c.id === visitObj.customerId)?.status === 'offline';
      setResolutionText(
        isOffline 
          ? 'Melakukan penyambungan ulang (splicing) core serat optik yang putus di ODP. Sinyal redaman kembali normal.' 
          : 'Melakukan pembersihan konektor SC APC dropcore di Roset pelanggan. Signal redaman kembali prima.'
      );
    }
  };

  // Action: Save and Close Work Order (Triggers restoration!)
  const handleSaveResolution = () => {
    if (!closingVisitId) return;
    const targetVisit = visits.find(v => v.id === closingVisitId);
    if (!targetVisit) return;

    // 1. Complete work order log
    db.updateHomeVisit({
      ...targetVisit,
      status: 'completed',
      resolutionNotes: resolutionText,
      resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    // 2. Set technician back to idle
    if (activeTech) {
      db.updateTechnician({
        ...activeTech,
        status: 'idle'
      });
    }

    // 3. RESTORE CUSTOMER SIGNAL TO PERFECT!
    const targetCust = customers.find(c => c.id === targetVisit.customerId);
    if (targetCust) {
      db.updateCustomer({
        ...targetCust,
        status: 'online',
        pppStatus: 'connected',
        opticalPower: Number((-18.5 - Math.random() * 3.5).toFixed(1)) // Restore to highly optimal power e.g. -19.5 dBm
      });
      onUpdateCustomers(db.getCustomers());
    }

    // 4. Resolve alarms automatically
    const updatedAl = alerts.map(al => {
      if (al.customerId === targetVisit.customerId && !al.resolved) {
        return {
          ...al,
          resolved: true,
          ackBy: `RESTORED_BY_${activeTech?.name.toUpperCase().replace(/\s+/g, '_')}`
        };
      }
      return al;
    });
    db.updateAlerts(updatedAl);
    onUpdateAlerts();

    setClosingVisitId(null);
    setOpmTestingCustId(null);
    setOpmValue(null);
    syncWithDb();
    showToast(`SUKSES: Jaringan dipulihkan! Sinyal normal kembali.`);
  };

  return (
    <div className={`max-w-4xl mx-auto ${isEmbed ? 'p-0' : 'p-4 md:p-6'}`}>
      
      {/* Dynamic Selector Header */}
      <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-950 border border-emerald-500/50 rounded text-emerald-400">
            <Smartphone className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h2 className="font-orbitron font-black text-xs uppercase tracking-widest text-emerald-400">
              PORTAL APPS TEKNISI LAPANGAN
            </h2>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              Live Field Dispatch & GPON Repair Console
            </p>
          </div>
        </div>

        {/* Profile Switcher */}
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Akun Teknisi:</span>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="bg-black border border-slate-800 text-slate-200 text-xs font-mono py-1 px-2.5 rounded focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id}) - {t.region}
              </option>
            ))}
          </select>

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="py-1 px-2.5 border border-cyan-800 text-cyan-400 hover:text-slate-950 hover:bg-cyan-400 text-[10px] font-bold font-orbitron uppercase rounded transition-all duration-200 cursor-pointer"
            >
              Kembali ke NOC Admin
            </button>
          )}
        </div>
      </div>

      {/* Main Container styling as a High-Tech Smartphone Shell Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Smartphone Shell Emulator (Span 5) */}
        <div className="md:col-span-5 flex justify-center">
          
          {/* Phone Frame mock */}
          <div className="w-[320px] h-[640px] bg-slate-950 border-8 border-slate-900 rounded-[30px] shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col font-mono text-[11px] leading-relaxed text-slate-300">
            
            {/* Phone notch speaker/camera */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-b-xl z-20 flex justify-center items-center">
              <span className="w-10 h-1 bg-slate-950 rounded" />
              <span className="w-1.5 h-1.5 bg-slate-950 rounded-full ml-1" />
            </div>

            {/* Smartphone Live Status Bar */}
            <div className="h-6 bg-black flex justify-between items-center px-4 pt-1 text-[8px] text-slate-500 font-mono shrink-0 select-none border-b border-white/5">
              <span>08:27 AM</span>
              <div className="flex items-center gap-1">
                <Signal className="w-2.5 h-2.5 text-emerald-500" />
                <span>AISYAKA-GPON 5G</span>
                <span className="w-3.5 h-2 bg-emerald-500 rounded-sm inline-block relative ml-1">
                  <span className="absolute -right-0.5 top-0.5 w-0.5 h-1 bg-emerald-500 rounded-sm" />
                </span>
              </div>
            </div>

            {/* Inside Phone Display Container */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-black relative">
              
              {/* Live Toast alert overlay */}
              {mobileToast && (
                <div className="absolute top-2 left-2 right-2 bg-emerald-950 border border-emerald-500 text-[9px] text-emerald-300 p-2 rounded z-30 shadow-lg animate-bounce flex items-start gap-1.5 font-sans">
                  <Bell className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <p>{mobileToast}</p>
                </div>
              )}

              {/* Personal Header Info */}
              {activeTech && (
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest">// PROFIL TEKNISI LAPANGAN</p>
                      <h3 className="font-bold text-slate-200 text-xs font-sans">{activeTech.name}</h3>
                      <p className="text-[9px] text-cyan-400 font-mono mt-0.5">Spesialis: {activeTech.specialization}</p>
                    </div>
                    <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-bold ${
                      activeTech.status === 'idle' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' :
                      activeTech.status === 'visiting' ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30' :
                      'bg-red-950/80 text-red-400 border border-red-500/30'
                    }`}>
                      {activeTech.status === 'idle' ? '🟢 SIAGA' : activeTech.status === 'visiting' ? '🟡 ON DUTY' : '🔴 OFF'}
                    </span>
                  </div>

                  {/* Duty status switcher inside phone */}
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5 text-[9px]">
                    <button
                      onClick={() => handleChangeStatus('idle')}
                      className={`py-1 rounded text-center font-bold cursor-pointer transition-colors ${
                        activeTech.status === 'idle' ? 'bg-emerald-800 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                      }`}
                    >
                      SIAGA
                    </button>
                    <button
                      onClick={() => handleChangeStatus('visiting')}
                      className={`py-1 rounded text-center font-bold cursor-pointer transition-colors ${
                        activeTech.status === 'visiting' ? 'bg-amber-800 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                      }`}
                    >
                      ON-DUTY
                    </button>
                    <button
                      onClick={() => handleChangeStatus('off')}
                      className={`py-1 rounded text-center font-bold cursor-pointer transition-colors ${
                        activeTech.status === 'off' ? 'bg-red-800 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                      }`}
                    >
                      OFF
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIVE VISIT SECTION */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-amber-400 font-sans uppercase tracking-wider">Kunjungan Aktif Saya</h4>
                  <span className="text-[8px] text-slate-500 font-mono">({activeTickets.length} Tugas)</span>
                </div>

                {activeTickets.length === 0 ? (
                  <div className="bg-slate-950 border border-dashed border-slate-900 text-center py-6 text-slate-600 rounded-lg text-[10px]">
                    😴 Tidak ada tiket aktif saat ini.
                    <p className="text-[9px] text-slate-700 mt-1 uppercase">Silakan ambil tiket gangguan di luar!</p>
                  </div>
                ) : (
                  activeTickets.map(visit => (
                    <div 
                      key={visit.id}
                      className={`bg-slate-950 border p-3 rounded-lg space-y-2.5 relative overflow-hidden ${
                        visit.status === 'in_progress' ? 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'border-slate-900'
                      }`}
                    >
                      {/* Ticket Badge */}
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-amber-400 font-sans">{visit.id}</span>
                        <span className={`px-1 py-0.2 rounded-sm text-[8px] font-mono ${
                          visit.status === 'in_progress' ? 'bg-amber-950 text-amber-400' : 'bg-cyan-950 text-cyan-400'
                        }`}>
                          {visit.status === 'in_progress' ? 'OTW / BERJALAN' : 'DIJADWALKAN'}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-0.5">
                        <p className="text-slate-400 font-bold text-[11px]">{visit.customerName}</p>
                        <p className="text-[9px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          {visit.customerAddress}
                        </p>
                        <p className="text-[9px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          {visit.customerPhone}
                        </p>
                      </div>

                      {/* Incident description */}
                      <div className="p-2 bg-black border border-slate-900 rounded text-[10px] text-amber-200">
                        <strong className="text-[8px] text-slate-500 block">KENDALA NOC:</strong>
                        {visit.issueDescription}
                      </div>

                      {/* OPM Live Testing tool block inside ticket! */}
                      {visit.status === 'in_progress' && (
                        <div className="p-2 bg-slate-950 border border-emerald-950 rounded space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-slate-500 uppercase">// Live OPM Fiber Meter</span>
                            <button
                              type="button"
                              onClick={() => handleRunOPM(visit.customerId)}
                              disabled={isOPMCalibrating}
                              className="px-1.5 py-0.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/30 rounded text-[8px] font-sans font-bold cursor-pointer uppercase transition-all duration-150 flex items-center gap-1"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${isOPMCalibrating ? 'animate-spin' : ''}`} />
                              Uji Sinyal GPON
                            </button>
                          </div>

                          {opmTestingCustId === visit.customerId && (
                            <div className="bg-black p-1.5 rounded text-center border border-white/5 font-mono">
                              {isOPMCalibrating ? (
                                <span className="text-[9px] text-amber-400 animate-pulse">// MEMBACA FREKUENSI 1490nm...</span>
                              ) : opmValue !== null ? (
                                <div className="space-y-0.5">
                                  <span className="text-[9px] text-slate-400">Daya Optik Terukur:</span>
                                  <p className={`text-sm font-bold ${opmValue < -27 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                                    {opmValue} dBm
                                  </p>
                                  <p className="text-[8px] text-slate-500 uppercase">
                                    {opmValue < -27 ? '🚨 REDAMAN SANGAT BURUK / LOS' : '🟢 JALUR NORMAL SEHAT'}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Travel & Completion buttons */}
                      <div className="flex gap-1.5 pt-1 border-t border-white/5">
                        {visit.status === 'scheduled' ? (
                          <button
                            type="button"
                            onClick={() => handleStartTravel(visit)}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-sans font-bold uppercase rounded flex items-center justify-center gap-1 cursor-pointer transition-all duration-200"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            OTW / Start Kerja
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCompleteRepairPrompt(visit.id)}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-sans font-bold uppercase rounded flex items-center justify-center gap-1 cursor-pointer transition-all duration-200"
                          >
                            <Check className="w-3 h-3" />
                            Selesaikan & Restore
                          </button>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* UNASSIGNED REGIONAL ISSUES (PICKUP TICKET) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-red-400 font-sans uppercase tracking-wider">Ambil Tiket Wilayah ({activeTech?.region})</h4>
                  <span className="text-[8px] px-1 bg-red-950 text-red-400 rounded-sm font-mono">{openRegionIssues.length} Tiket</span>
                </div>

                {openRegionIssues.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-900 text-center py-4 text-slate-600 rounded-lg text-[10px]">
                    🎉 Semua jaringan wilayah Anda aman!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {openRegionIssues.map(cust => (
                      <div 
                        key={cust.id} 
                        className="bg-slate-950 border border-red-500/10 p-2.5 rounded-lg flex flex-col justify-between gap-2 hover:border-red-500/30 transition-all duration-150"
                      >
                        <div>
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="font-bold text-slate-300">{cust.name}</span>
                            <span className="text-red-500 font-bold uppercase text-[8px]">{cust.status}</span>
                          </div>
                          <p className="text-[8px] text-slate-500 truncate mt-0.5">{cust.address}</p>
                          <p className="text-[9px] text-red-400/90 font-mono">Daya: {cust.opticalPower} dBm</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelfAssign(cust)}
                          className="w-full py-1 bg-red-950 hover:bg-red-900 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-white text-[9px] font-sans uppercase font-semibold rounded cursor-pointer transition-colors"
                        >
                          AMBIL TUGAS INI
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RECENT SETTLED HISTORY TICKET TRACK */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Histori Penyelesaian Saya</h4>
                {historyTickets.length === 0 ? (
                  <p className="text-[8px] text-slate-700 font-mono text-center py-2 uppercase">*** Belum ada log historis ***</p>
                ) : (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {[...historyTickets].reverse().map(hist => (
                      <div key={hist.id} className="p-2 bg-slate-950/40 border border-slate-900 rounded text-[9px] space-y-1">
                        <div className="flex justify-between text-[8px]">
                          <span className="text-slate-500 font-bold">{hist.id}</span>
                          <span className="text-emerald-500 font-bold">✔ SELESAI</span>
                        </div>
                        <p className="text-slate-300 font-semibold">{hist.customerName}</p>
                        <p className="text-slate-500 leading-normal italic">"{hist.resolutionNotes}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Simulated Smartphone bottom navigation bar */}
            <div className="h-10 bg-black border-t border-white/5 flex justify-around items-center text-slate-500 shrink-0 font-sans text-[9px]">
              <div className="flex flex-col items-center cursor-pointer text-emerald-400">
                <Layers className="w-4 h-4" />
                <span>Job Board</span>
              </div>
              <div className="flex flex-col items-center cursor-not-allowed opacity-40">
                <Compass className="w-4 h-4" />
                <span>Maps</span>
              </div>
              <div className="flex flex-col items-center cursor-not-allowed opacity-40">
                <Award className="w-4 h-4" />
                <span>Leaderboard</span>
              </div>
            </div>

            {/* Smartphone mechanical home indicator button */}
            <div className="h-5 bg-slate-950 flex justify-center items-center shrink-0 border-t border-white/5">
              <span className="w-20 h-1 bg-slate-800 rounded-full" />
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Dashboard explanation & control panel (Span 7) */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Neon Welcome block */}
          <NeonBox variant="emerald" title="ALUR INTERAKSI TERPADU (LIVE INTEGRATION)" subtitle="Real-time Dispatch Synchronizer">
            <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
              <p>
                Aplikasi ini merepresentasikan <span className="text-emerald-400 font-bold">Portal Perangkat Mobile Mandiri Teknisi</span> yang tersambung langsung ke database backend NOC Admin secara real-time.
              </p>

              <div className="bg-slate-950/80 p-3.5 border border-slate-900 rounded space-y-3">
                <h4 className="text-emerald-400 font-orbitron font-bold text-[10px] uppercase tracking-wide">// CARA SIMULASI GANGGUAN & OTOMATISASI:</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 text-[11px] leading-relaxed">
                  <li>
                    Masuk ke menu <strong className="text-cyan-400">NOC Admin (Pelanggan)</strong> dan ubah status salah satu pelanggan menjadi <span className="text-red-500">OFFLINE</span> atau <span className="text-amber-500">GANGGUAN</span>.
                  </li>
                  <li>
                    Atau, berikan tiket gangguan pada menu <strong className="text-amber-400">Buat Jadwal Kunjungan / Dispatch</strong> di NOC Admin.
                  </li>
                  <li>
                    Secara instan, tiket tersebut akan masuk ke <span className="text-emerald-400">Aplikasi Teknisi Lapangan</span> ini!
                  </li>
                  <li>
                    Teknisi menekan tombol <strong className="text-amber-400">OTW / Start Kerja</strong>. Status admin akan berubah secara live!
                  </li>
                  <li>
                    Jalankan <strong className="text-emerald-400">Uji Sinyal GPON (Live OPM)</strong> pada menu ponsel simulasi untuk mengukur redaman loss kabel optik.
                  </li>
                  <li>
                    Tekan <strong className="text-emerald-400">Selesaikan & Restore</strong>, isi laporan kerja lapangan, dan simpan. 
                  </li>
                  <li>
                    Sistem otomatis memperbaiki parameter redaman fiber pelanggan tersebut menjadi <span className="text-emerald-400">ONLINE (-19 dBm)</span> di panel admin utama, serta menutup alarm secara otomatis!
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300/90 rounded text-[10px] leading-relaxed">
                📢 <strong>LOGIC ENGINE READY:</strong> Tombol OTW / Start Kerja, Meteran OPM Laser, dan Sistem Auto-Resolusi Alarm serta Reset Signal Pelanggan semuanya fungsional 100% menggunakan arsitektur event-driven local database.
              </div>
            </div>
          </NeonBox>

          {/* ACTIVE DISPATCH LOGS FOR THIS SESSION */}
          <NeonBox variant="cyan" title="SINKRONISASI RELASIONAL DATABASE TIKET" subtitle="Telemetry Dispatch Log Stream">
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-white/5 pb-1.5">
                <span>WORK ORDER ID</span>
                <span>TEKNISI</span>
                <span>STATUS KUNJUNGAN</span>
              </div>
              
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 text-[11px]">
                {visits.map(v => (
                  <div key={v.id} className="flex justify-between items-center bg-slate-950 p-2 border border-slate-900 rounded">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-300">{v.id} - {v.customerName}</p>
                      <p className="text-[9px] text-slate-500">{v.scheduledDate} • {v.customerRegion}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-bold">{v.technicianName}</p>
                      <span className={`text-[8px] px-1 font-bold rounded ${
                        v.status === 'completed' ? 'bg-emerald-950 text-emerald-400' :
                        v.status === 'in_progress' ? 'bg-amber-950 text-amber-400 animate-pulse' :
                        v.status === 'cancelled' ? 'bg-slate-900 text-slate-500' :
                        'bg-cyan-950 text-cyan-400'
                      }`}>
                        {v.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </NeonBox>

        </div>

      </div>

      {/* FOOTER DIALOG CLOSING REPORT FORM */}
      {closingVisitId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/40 p-6 max-w-md w-full font-mono text-xs rounded-lg space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-emerald-400">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-orbitron font-bold text-sm uppercase tracking-wide">PENYELESAIAN TUGAS LAPANGAN</h3>
                <p className="text-[9px] text-slate-500">Kirim laporan pekerjaan untuk menormalkan sinyal pelanggan</p>
              </div>
            </div>

            <div>
              <p className="text-slate-400 leading-relaxed mb-3 text-[11px]">
                Tindakan penyambungan / pembersihan telah selesai. Masukkan laporan akhir tindakan lapangan untuk menormalkan Optical Loss GPON pelanggan kembali ke kondisi online normal.
              </p>

              <label className="block text-[9px] text-slate-500 uppercase mb-1">Laporan Tindakan Perbaikan *</label>
              <textarea
                rows={4}
                required
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                className="w-full bg-black border border-slate-800 rounded p-2.5 text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono text-xs leading-normal"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={handleSaveResolution}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:text-white font-bold uppercase cursor-pointer rounded transition-all duration-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              >
                SUBMIT & SELESAI
              </button>
              <button
                onClick={() => setClosingVisitId(null)}
                className="px-3 py-2 border border-slate-800 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
