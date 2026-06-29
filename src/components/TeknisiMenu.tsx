import React, { useState } from 'react';
import { Customer, Region, Technician, HomeVisit } from '../types';
import { 
  Wrench, Users, Phone, MapPin, CheckCircle, Clock, 
  Plus, Trash2, Edit2, AlertCircle, Calendar, Shield, Play, 
  Check, X, FileText, Send, UserCheck, UserX, AlertOctagon, Terminal
} from 'lucide-react';
import NeonBox from './NeonBox';
import { db } from '../db';

interface TeknisiMenuProps {
  customers: Customer[];
  regions: Region[];
  onUpdateCustomers: (updatedList: Customer[]) => void;
  onUpdateAlerts?: () => void; // Optional trigger to refresh active alerts
}

export default function TeknisiMenu({
  customers,
  regions,
  onUpdateCustomers,
  onUpdateAlerts,
}: TeknisiMenuProps) {
  // DB query states
  const [technicians, setTechnicians] = useState<Technician[]>(db.getTechnicians());
  const [visits, setVisits] = useState<HomeVisit[]>(db.getHomeVisits());

  // Navigation filtering states
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>('ALL');
  const [techFilterStatus, setTechFilterStatus] = useState<'ALL' | 'idle' | 'visiting' | 'off'>('ALL');

  // Input Technician Form State
  const [isAddingTech, setIsAddingTech] = useState(false);
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techRegion, setTechRegion] = useState<Region>('BEKASI wilayah Jatimakmur');
  const [techSpecialization, setTechSpecialization] = useState('Splicing Fiber Optic');

  // Home Visit Scheduling Form State
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [visitCustomerId, setVisitCustomerId] = useState('');
  const [visitTechnicianId, setVisitTechnicianId] = useState('');
  const [visitIssue, setVisitIssue] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);

  // Complete Visit Action Modal/Form State
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Editing Technician Mode
  const [editingTechId, setEditingTechId] = useState<string | null>(null);

  // Dispatch live notification banner state
  const [dispatchNotification, setDispatchNotification] = useState<string | null>(null);

  // Sync state helpers
  const refreshDbData = () => {
    setTechnicians(db.getTechnicians());
    setVisits(db.getHomeVisits());
  };

  // 1. ADD TECHNICIAN Handler
  const handleAddTechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techName.trim()) return;

    db.addTechnician({
      name: techName,
      phone: techPhone || '0812-0000-0000',
      region: techRegion,
      specialization: techSpecialization,
      status: 'idle'
    });

    setIsAddingTech(false);
    setTechName('');
    setTechPhone('');
    refreshDbData();
  };

  // 2. UPDATE TECHNICIAN STATUS
  const handleToggleTechStatus = (tech: Technician, nextStatus: 'idle' | 'visiting' | 'off') => {
    db.updateTechnician({
      ...tech,
      status: nextStatus
    });
    refreshDbData();
  };

  // 3. DELETE TECHNICIAN
  const handleDeleteTech = (id: string) => {
    const hasActiveVisits = visits.some(v => v.technicianId === id && (v.status === 'scheduled' || v.status === 'in_progress'));
    if (hasActiveVisits) {
      alert('Teknisi sedang ditugaskan dalam kunjungan aktif. Selesaikan atau batalkan kunjungan terlebih dahulu!');
      return;
    }

    if (window.confirm('Hapus teknisi ini dari database?')) {
      db.deleteTechnician(id);
      refreshDbData();
    }
  };

  // 4. SUBMIT SCHEDULE VISIT
  const handleScheduleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitCustomerId || !visitTechnicianId || !visitIssue.trim()) {
      alert('Pilih Pelanggan, Teknisi, dan deskripsi kendala!');
      return;
    }

    const selectedCust = customers.find(c => c.id === visitCustomerId);
    const selectedTech = technicians.find(t => t.id === visitTechnicianId);

    if (!selectedCust || !selectedTech) return;

    // Add home visit record
    db.addHomeVisit({
      customerId: selectedCust.id,
      customerName: selectedCust.name,
      customerAddress: selectedCust.address,
      customerPhone: selectedCust.phone,
      customerRegion: selectedCust.region,
      technicianId: selectedTech.id,
      technicianName: selectedTech.name,
      issueDescription: visitIssue,
      scheduledDate: visitDate,
      status: 'scheduled'
    });

    // Update technician status to 'visiting'
    db.updateTechnician({
      ...selectedTech,
      status: 'visiting'
    });

    // Reset Form
    setIsAddingVisit(false);
    setVisitCustomerId('');
    setVisitTechnicianId('');
    setVisitIssue('');
    refreshDbData();
  };

  // 5. PROGRESS VISIT TO IN_PROGRESS
  const handleStartVisit = (visit: HomeVisit) => {
    // 1. Update the visit status to in_progress
    db.updateHomeVisit({
      ...visit,
      status: 'in_progress'
    });

    // 2. Ensure technician status is updated to visiting
    const tech = technicians.find(t => t.id === visit.technicianId);
    if (tech) {
      db.updateTechnician({
        ...tech,
        status: 'visiting'
      });
    }

    // 3. Automatically tag/acknowledge active network alerts for this customer with OTW info
    const allAlerts = db.getAlerts();
    let alertChanged = false;
    const updatedAlerts = allAlerts.map(al => {
      if (al.customerId === visit.customerId && !al.resolved) {
        alertChanged = true;
        return {
          ...al,
          ackBy: `OTW: ${visit.technicianName}`
        };
      }
      return al;
    });

    if (alertChanged) {
      db.updateAlerts(updatedAlerts);
      if (onUpdateAlerts) {
        onUpdateAlerts();
      }
    }

    // 4. Set dispatch notification to show on screen
    setDispatchNotification(`DISPATCH: Teknisi ${visit.technicianName} sedang dalam perjalanan (OTW) menuju lokasi pelanggan ${visit.customerName}!`);
    setTimeout(() => {
      setDispatchNotification(null);
    }, 5500);

    refreshDbData();
  };

  // 6. COMPLETE VISIT (triggering Catatan Resolusi Modal)
  const handlePromptCompleteVisit = (visitId: string) => {
    setCompletingVisitId(visitId);
    setResolutionNotes('Splicing ulang kabel FO dropcore dan restart perangkat ONT. Signal redaman kembali normal.');
  };

  const handleConfirmCompleteVisit = () => {
    if (!completingVisitId) return;

    const targetVisit = visits.find(v => v.id === completingVisitId);
    if (!targetVisit) return;

    // 1. Mark visit as completed
    const completedVisit: HomeVisit = {
      ...targetVisit,
      status: 'completed',
      resolutionNotes: resolutionNotes,
      resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    db.updateHomeVisit(completedVisit);

    // 2. Set technician back to idle
    const targetTech = technicians.find(t => t.id === targetVisit.technicianId);
    if (targetTech) {
      db.updateTechnician({
        ...targetTech,
        status: 'idle'
      });
    }

    // 3. INTERACTIVE MAGIC: Auto-resolve associated customer's network issue!
    const targetCust = customers.find(c => c.id === targetVisit.customerId);
    if (targetCust) {
      // Restore optical signal and set connection back to 'online'
      const restoredCust: Customer = {
        ...targetCust,
        status: 'online',
        opticalPower: Number((-18.5 - Math.random() * 4).toFixed(1)), // -18.5 to -22.5 (excellent signal)
        pppStatus: 'connected'
      };
      db.updateCustomer(restoredCust);
      
      // Update app state
      onUpdateCustomers(db.getCustomers());

      // Resolve related active alarms
      const allAlerts = db.getAlerts();
      let alertChanged = false;
      const updatedAlerts = allAlerts.map(al => {
        if (al.customerId === targetCust.id && !al.resolved) {
          alertChanged = true;
          return { ...al, resolved: true, ackBy: 'AUTO_RESOLVE_TECH_VISIT' };
        }
        return al;
      });

      if (alertChanged) {
        db.updateAlerts(updatedAlerts);
        if (onUpdateAlerts) onUpdateAlerts();
      }
    }

    // Reset modal state
    setCompletingVisitId(null);
    setResolutionNotes('');
    refreshDbData();
  };

  // 7. CANCEL VISIT
  const handleCancelVisit = (visit: HomeVisit) => {
    if (window.confirm('Batalkan jadwal kunjungan ini?')) {
      db.updateHomeVisit({
        ...visit,
        status: 'cancelled'
      });

      // Release technician back to idle
      const targetTech = technicians.find(t => t.id === visit.technicianId);
      if (targetTech) {
        db.updateTechnician({
          ...targetTech,
          status: 'idle'
        });
      }

      refreshDbData();
    }
  };

  // 8. DELETE HISTORIC VISIT
  const handleDeleteVisit = (id: string) => {
    if (window.confirm('Hapus log kunjungan ini secara permanen dari database?')) {
      db.deleteHomeVisit(id);
      refreshDbData();
    }
  };

  // Filtering Logic
  const filteredTechs = technicians.filter(t => {
    const matchRegion = selectedRegion === 'ALL' || t.region === selectedRegion;
    const matchStatus = techFilterStatus === 'ALL' || t.status === techFilterStatus;
    return matchRegion && matchStatus;
  });

  // Count active issues (customers with 'gangguan' or 'offline' status)
  const customersWithIssues = customers.filter(c => c.status === 'gangguan' || c.status === 'offline');

  return (
    <div className="space-y-6">

      {/* Dynamic Dispatch Notification Banner */}
      {dispatchNotification && (
        <div className="bg-amber-950/80 border border-amber-500/50 text-amber-200 font-mono text-xs p-3.5 flex items-center gap-3 rounded shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-bounce">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
          <p className="flex-1">⚡ <strong>[DISPATCH DISALURKAN]</strong> {dispatchNotification}</p>
          <button 
            onClick={() => setDispatchNotification(null)}
            className="text-slate-500 hover:text-white font-bold px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action and Metric Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Techs Metric */}
        <NeonBox variant="cyan" title="STATISTIK TEKNISI LAPANGAN" subtitle="NOC Technician Fleet Telemetry">
          <div className="flex justify-between items-center h-full">
            <div className="space-y-1 font-mono">
              <p className="text-2xl font-black text-cyan-400 font-orbitron">{technicians.length} <span className="text-xs text-slate-500">CREW</span></p>
              <div className="text-[10px] space-y-0.5 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Siaga / Idle: {technicians.filter(t => t.status === 'idle').length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Kunjungan: {technicians.filter(t => t.status === 'visiting').length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Off Duty: {technicians.filter(t => t.status === 'off').length}</span>
                </div>
              </div>
            </div>
            <Wrench className="w-12 h-12 text-cyan-950 neon-glow-cyan" />
          </div>
        </NeonBox>

        {/* Current Active Home Visits Metric */}
        <NeonBox variant="amber" title="KUNJUNGAN AKTIF HARI INI" subtitle="Live Dispatch Monitoring">
          <div className="flex justify-between items-center h-full">
            <div className="space-y-1 font-mono">
              <p className="text-2xl font-black text-amber-400 font-orbitron">
                {visits.filter(v => v.status === 'scheduled' || v.status === 'in_progress').length} <span className="text-xs text-slate-500">VISITS</span>
              </p>
              <div className="text-[10px] space-y-0.5 text-slate-400">
                <p>⚡ Berjalan: {visits.filter(v => v.status === 'in_progress').length}</p>
                <p>📅 Terjadwal: {visits.filter(v => v.status === 'scheduled').length}</p>
                <p>✔ Selesai (Historic): {visits.filter(v => v.status === 'completed').length}</p>
              </div>
            </div>
            <Calendar className="w-12 h-12 text-amber-950/40 neon-glow-amber" />
          </div>
        </NeonBox>

        {/* Urgent Customer Incidents to Dispatch */}
        <NeonBox variant="red" title="INCIDENT GANGGUAN" subtitle="Subscribers Needing Dispatch">
          <div className="flex justify-between items-center h-full">
            <div className="space-y-1 font-mono">
              <p className="text-2xl font-black text-red-500 font-orbitron animate-pulse">
                {customersWithIssues.length} <span className="text-xs text-slate-500">DEGRADED</span>
              </p>
              <p className="text-[9px] text-slate-400 leading-normal max-w-[190px]">
                {customersWithIssues.length > 0 
                  ? `Ada ${customersWithIssues.length} pelanggan putus/gangguan signal. Jadwalkan visit ke rumah sekarang!`
                  : "Semua pelanggan dalam kondisi prima (sinyal normal & online)."}
              </p>
            </div>
            <AlertOctagon className={`w-12 h-12 ${customersWithIssues.length > 0 ? 'text-red-950 animate-bounce' : 'text-slate-800'}`} />
          </div>
        </NeonBox>
      </div>

      {/* Quick Dispatch Controls Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-950 p-4 border border-slate-900 rounded">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-200">
              KONTROL TIM TEKNISI AISYAKA.NET
            </h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
              Kelola nama tim lapangan, buat SPK kunjungan, & perbaiki kendala internet rumah pelanggan
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Dispatch Button */}
          <button
            onClick={() => {
              setIsAddingVisit(!isAddingVisit);
              setIsAddingTech(false);
            }}
            className={`flex-1 sm:flex-initial py-2 px-4 text-[10px] font-orbitron font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border ${
              isAddingVisit
                ? 'bg-red-950 text-red-400 border-red-500/50'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {isAddingVisit ? 'BATAL VISIT' : 'BUAT JADWAL KUNJUNGAN'}
          </button>

          {/* Add Tech Button */}
          <button
            onClick={() => {
              setIsAddingTech(!isAddingTech);
              setIsAddingVisit(false);
            }}
            className={`flex-1 sm:flex-initial py-2 px-4 text-[10px] font-orbitron font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border ${
              isAddingTech 
                ? 'bg-red-950 text-red-400 border-red-500/50' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isAddingTech ? 'BATAL INPUT' : 'TAMBAH TEKNISI BARU'}
          </button>
        </div>
      </div>

      {/* FORM: INPUT TEKNISI BARU */}
      {isAddingTech && (
        <NeonBox variant="cyan" title="FORM INPUT DATA TEKNISI BARU" subtitle="FTTH Installer & Maintenance Registration">
          <form onSubmit={handleAddTechSubmit} className="space-y-4 font-mono text-xs text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Name */}
              <div className="md:col-span-1">
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Nama Lengkap Teknisi *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gilang Permana"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Nomor Handphone/WA</label>
                <input
                  type="text"
                  placeholder="e.g. 0812-3321-4455"
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Region */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Wilayah Siaga / Basecamp</label>
                <select
                  value={techRegion}
                  onChange={(e) => setTechRegion(e.target.value as Region)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {regions.map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Spesialisasi Keahlian</label>
                <select
                  value={techSpecialization}
                  onChange={(e) => setTechSpecialization(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="Splicing Fiber Optic">Splicing Fiber Optic</option>
                  <option value="Aktivasi & Provisi ONT">Aktivasi & Provisi ONT</option>
                  <option value="Penarikan Dropcore & ODP">Penarikan Dropcore & ODP</option>
                  <option value="Troubleshooting Sinyal Red LOS">Troubleshooting Sinyal Red LOS</option>
                  <option value="Setting Router & Access Point">Setting Router & Access Point</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
              <button
                type="submit"
                className="py-2.5 px-6 bg-cyan-600 hover:bg-cyan-500 text-slate-950 hover:text-white font-orbitron font-extrabold text-[10px] tracking-wider uppercase rounded cursor-pointer transition-all duration-300 border border-cyan-400"
              >
                PROVISI & SIMPAN TEKNISI
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTech(false)}
                className="py-2.5 px-4 border border-slate-850 hover:border-red-500 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              >
                BATAL
              </button>
            </div>
          </form>
        </NeonBox>
      )}

      {/* FORM: SCHEDULE HOME VISIT / SPK */}
      {isAddingVisit && (
        <NeonBox variant="amber" title="SURAT PERINTAH KERJA (SPK) - KUNJUNGAN GANGGUAN INTERNET" subtitle="NOC Home Visit Dispatch System">
          <form onSubmit={handleScheduleVisitSubmit} className="space-y-4 font-mono text-xs text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Select Customer */}
              <div className="md:col-span-2">
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Pilih Pelanggan Bermasalah / Alami Kendala *</label>
                <select
                  required
                  value={visitCustomerId}
                  onChange={(e) => {
                    setVisitCustomerId(e.target.value);
                    const selected = customers.find(c => c.id === e.target.value);
                    if (selected) {
                      // Pre-fill the issue description based on the customer status
                      setVisitIssue(
                        selected.status === 'offline' 
                          ? 'Menerima alarm ONT Putus / Red LOS. Cek kondisi dropcore dan patchcord rumah.' 
                          : selected.status === 'gangguan' 
                          ? `Redaman tinggi (${selected.opticalPower} dBm) mengganggu koneksi. Splicing ulang jalur.`
                          : 'Pengecekan kualitas internet regular.'
                      );
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- PILIH PELANGGAN --</option>
                  
                  {/* Highlight degraded/degraded status */}
                  {customersWithIssues.length > 0 && (
                    <optgroup label="CRITICAL: BUTUH PERBAIKAN SEGERA">
                      {customersWithIssues.map(c => (
                        <option key={c.id} value={c.id}>
                          🚨 [{c.status.toUpperCase()}] {c.name} - {c.region} ({c.id})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup label="LAINNYA / SEMUA PELANGGAN">
                    {customers.filter(c => c.status === 'online').map(c => (
                      <option key={c.id} value={c.id}>
                        📶 {c.name} - {c.region} ({c.id})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Select Technician */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Pilih Teknisi Siaga *</label>
                <select
                  required
                  value={visitTechnicianId}
                  onChange={(e) => setVisitTechnicianId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- PILIH TEKNISI --</option>
                  <optgroup label="TEKNISI SIAGA (IDLE)">
                    {technicians.filter(t => t.status === 'idle').map(t => (
                      <option key={t.id} value={t.id}>
                        🟢 {t.name} - {t.region} ({t.specialization})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="TEKNISI SEDANG KUNJUNGAN / SIBUK">
                    {technicians.filter(t => t.status === 'visiting').map(t => (
                      <option key={t.id} value={t.id} disabled>
                        🟡 [SIBUK] {t.name} - {t.region}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="TEKNISI OFF DUTY">
                    {technicians.filter(t => t.status === 'off').map(t => (
                      <option key={t.id} value={t.id} disabled>
                        🔴 [OFF] {t.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Tanggal Rencana Kunjungan</label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Issue description */}
            <div>
              <label className="block text-[9px] text-slate-500 uppercase mb-1">Deskripsi Masalah / Catatan Perintah Kerja *</label>
              <textarea
                required
                rows={3}
                placeholder="Detail keluhan pelanggan atau kendala sinyal..."
                value={visitIssue}
                onChange={(e) => setVisitIssue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
              <button
                type="submit"
                className="py-2.5 px-6 bg-amber-600 hover:bg-amber-500 text-slate-950 hover:text-white font-orbitron font-extrabold text-[10px] tracking-wider uppercase rounded cursor-pointer transition-all duration-300 border border-amber-400"
              >
                DISPATCH & TERBITKAN SPK
              </button>
              <button
                type="button"
                onClick={() => setIsAddingVisit(false)}
                className="py-2.5 px-4 border border-slate-850 hover:border-red-500 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              >
                BATAL
              </button>
            </div>
          </form>
        </NeonBox>
      )}

      {/* RESOLUTION CLOSING DIALOG / OVERLAY */}
      {completingVisitId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/30 p-6 max-w-lg w-full font-mono text-xs rounded-lg space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <div>
                <h3 className="font-orbitron font-bold text-sm uppercase tracking-wide">PENUTUPAN LAPORAN KUNJUNGAN</h3>
                <p className="text-[9px] text-slate-500">Submit resolution logs to automatically restore customer signal</p>
              </div>
            </div>

            <div>
              <p className="text-slate-400 leading-relaxed mb-3">
                Kunjungan lapangan selesai. Tulis catatan tindakan teknisi di lokasi. Sistem akan otomatis memperbarui database pelanggan dan menyelaraskan jaringan GPON menjadi <span className="text-emerald-400 font-bold font-sans">ONLINE (Sinyal Sehat)</span>.
              </p>

              <label className="block text-[9px] text-slate-500 uppercase mb-1">Laporan Tindakan Lapangan (Resolution Notes)</label>
              <textarea
                rows={4}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-black border border-slate-800 rounded p-2.5 text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={handleConfirmCompleteVisit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:text-white font-bold uppercase cursor-pointer rounded transition-all duration-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              >
                SUBMIT & SELESAIKAN GANGGUAN
              </button>
              <button
                onClick={() => setCompletingVisitId(null)}
                className="px-3 py-2 border border-slate-800 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER BOX */}
      <NeonBox variant="cyan" title="FILTERING WILAYAH TEKNISI" subtitle="Basecamp Area & Duty Status">
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Region Select */}
          <div className="flex-1">
            <span className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Wilayah Basecamp:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedRegion('ALL')}
                className={`py-1 px-3 font-orbitron text-[10px] font-bold uppercase transition-all duration-200 border cursor-pointer ${
                  selectedRegion === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-950/80 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/60'
                }`}
              >
                Semua Area
              </button>
              {regions.map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`py-1 px-3 font-orbitron text-[10px] font-bold uppercase transition-all duration-200 border cursor-pointer ${
                    selectedRegion === reg
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-950/80 text-cyan-400 border-cyan-500/20 hover:border-cyan-400/60'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* Status Select */}
          <div className="min-w-[180px]">
            <span className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Status Operasional:
            </span>
            <select
              value={techFilterStatus}
              onChange={(e) => setTechFilterStatus(e.target.value as any)}
              className="w-full bg-slate-950/90 border border-slate-800 focus:outline-none focus:border-cyan-400 text-slate-100 py-1.5 px-3 text-xs font-mono cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="idle">🟢 Ready / Siaga</option>
              <option value="visiting">🟡 On Duty / Kunjungan</option>
              <option value="off">🔴 Off Duty</option>
            </select>
          </div>

        </div>
      </NeonBox>

      {/* TWO COLUMN GRID: LEFT = TECHNICIAN LIST, RIGHT = SPK/VISITS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: LIST TEKNISI (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <NeonBox variant="cyan" title={`TIM TEKNISI FIELDFORCE (${filteredTechs.length} PERSONEL)`} subtitle="Field Technicians Registry">
            <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTechs.length === 0 ? (
                <div className="text-center text-slate-500 font-mono py-8 text-xs">
                  *** DATA TEKNISI TIDAK DITEMUKAN ***
                </div>
              ) : (
                filteredTechs.map((tech) => (
                  <div 
                    key={tech.id}
                    className="p-3.5 bg-slate-950 border border-slate-900 rounded flex flex-col justify-between gap-3 group hover:border-cyan-500/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            tech.status === 'idle' ? 'bg-emerald-500 animate-pulse' : tech.status === 'visiting' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          <h4 className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors text-sm">{tech.name}</h4>
                          <span className="text-[8px] font-mono bg-slate-900 text-slate-500 px-1 border border-slate-800 rounded">
                            {tech.id}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">{tech.specialization}</p>
                      </div>

                      {/* Status display badge */}
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm ${
                        tech.status === 'idle' 
                          ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' 
                          : tech.status === 'visiting' 
                          ? 'bg-amber-950/40 border-amber-500/20 text-amber-400' 
                          : 'bg-red-950/40 border-red-500/20 text-red-400'
                      }`}>
                        {tech.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[10px] font-mono text-slate-500 border-t border-white/5 pt-2">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {tech.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {tech.region}
                      </span>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex items-center justify-end gap-1.5 border-t border-white/5 pt-2">
                      {tech.status !== 'visiting' && (
                        <button
                          onClick={() => handleToggleTechStatus(tech, tech.status === 'idle' ? 'off' : 'idle')}
                          className="px-2 py-1 border border-slate-800 hover:border-slate-700 text-[9px] text-slate-400 hover:text-white rounded transition-colors"
                        >
                          {tech.status === 'idle' ? 'Set Off Duty' : 'Set Siaga'}
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteTech(tech.id)}
                        className="p-1 border border-slate-800 hover:border-red-500 text-slate-500 hover:text-red-400 rounded bg-slate-950 transition-colors"
                        title="Hapus Teknisi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </NeonBox>
        </div>

        {/* RIGHT COLUMN: ACTIVE & HISTORICAL HOME VISITS (Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          <NeonBox variant="amber" title={`LOG & JADWAL KUNJUNGAN RUMAH (${visits.length} DATA)`} subtitle="Dispatch Assignment Work Orders">
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {visits.length === 0 ? (
                <div className="text-center text-slate-500 font-mono py-12 text-xs">
                  *** BELUM ADA JADWAL KUNJUNGAN ***
                </div>
              ) : (
                [...visits].reverse().map((visit) => (
                  <div 
                    key={visit.id}
                    className={`p-4 bg-slate-950 border rounded space-y-3 relative overflow-hidden ${
                      visit.status === 'completed' 
                        ? 'border-emerald-500/20 opacity-80' 
                        : visit.status === 'in_progress' 
                        ? 'border-amber-500 border-l-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                        : visit.status === 'cancelled'
                        ? 'border-slate-900 opacity-50'
                        : 'border-cyan-500/30'
                    }`}
                  >
                    {/* Status stripe corner */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-amber-500 font-extrabold">{visit.id}</span>
                          <span className="text-slate-600 font-mono">•</span>
                          <span className="text-[10px] font-mono text-slate-400">{visit.scheduledDate}</span>
                        </div>
                        <h4 className="font-bold text-slate-200 text-sm">Pelanggan: {visit.customerName}</h4>
                        <p className="text-[9px] font-mono text-slate-500">ID Pelanggan: <span className="text-cyan-400">{visit.customerId}</span> • Area: {visit.customerRegion}</p>
                      </div>

                      {/* Visit Status Badge */}
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded ${
                        visit.status === 'completed' 
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                          : visit.status === 'in_progress' 
                          ? 'bg-amber-950/40 border-amber-500 text-amber-400 animate-pulse' 
                          : visit.status === 'cancelled'
                          ? 'bg-slate-900 border-slate-700 text-slate-400'
                          : 'bg-cyan-950/40 border-cyan-500 text-cyan-400'
                      }`}>
                        {visit.status === 'in_progress' ? 'ON THE WAY / IN PROGRESS' : visit.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Address & dispatch logs */}
                    <div className="bg-slate-950/60 p-2.5 border border-slate-900 rounded space-y-1.5 text-[11px] font-mono text-slate-300">
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block mb-0.5">// Alamat Rumah:</span>
                        <p className="text-slate-300">{visit.customerAddress}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block mb-0.5">// Detail Gangguan:</span>
                        <p className="text-amber-300">{visit.issueDescription}</p>
                      </div>

                      {visit.resolutionNotes && (
                        <div className="border-t border-white/5 pt-2 mt-1.5 text-emerald-400">
                          <span className="text-slate-500 uppercase text-[9px] block mb-0.5">// Catatan Solusi Teknisi:</span>
                          <p>{visit.resolutionNotes}</p>
                          {visit.resolvedAt && (
                            <span className="block text-[8px] text-slate-500 mt-1">Selesai pada: {visit.resolvedAt}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Assigned Technician information */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Teknisi Ditugaskan: <strong className="text-slate-200">{visit.technicianName}</strong> ({visit.technicianId})</span>
                    </div>

                    {/* Controls */}
                    {visit.status !== 'completed' && visit.status !== 'cancelled' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                        {visit.status === 'scheduled' && (
                          <button
                            onClick={() => handleStartVisit(visit)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 rounded transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            OTW / Start Kerja
                          </button>
                        )}

                        {visit.status === 'in_progress' && (
                          <button
                            onClick={() => handlePromptCompleteVisit(visit.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 rounded transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Selesaikan Visit
                          </button>
                        )}

                        <button
                          onClick={() => handleCancelVisit(visit)}
                          className="px-2.5 py-1 border border-slate-800 hover:border-red-500 text-slate-500 hover:text-red-400 text-[9px] rounded transition-colors"
                        >
                          Batalkan Visit
                        </button>
                      </div>
                    )}

                    {/* Delete completed or cancelled ones */}
                    {(visit.status === 'completed' || visit.status === 'cancelled') && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleDeleteVisit(visit.id)}
                          className="text-[9px] text-slate-600 hover:text-red-400 transition-colors font-mono uppercase"
                        >
                          Hapus Log SPK
                        </button>
                      </div>
                    )}

                  </div>
                ))
              )}
            </div>
          </NeonBox>
        </div>

      </div>

    </div>
  );
}
