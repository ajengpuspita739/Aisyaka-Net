import React, { useState } from 'react';
import { Customer, Region, ConnectionStatus } from '../types';
import { 
  Search, MapPin, Signal, Phone, Cpu, Wifi, User, CheckCircle, 
  AlertTriangle, XCircle, RefreshCw, Plus, Database, Terminal, 
  Trash2, Send, Check, Play, Eye
} from 'lucide-react';
import NeonBox from './NeonBox';
import { db } from '../db';

interface PelangganMenuProps {
  customers: Customer[];
  regions: Region[];
  onSelectCustomer: (customer: Customer) => void;
  onUpdateCustomer: (updated: Customer) => void;
  onAddCustomer: (newCustData: Omit<Customer, 'id'>) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function PelangganMenu({
  customers,
  regions,
  onSelectCustomer,
  onUpdateCustomer,
  onAddCustomer,
  onDeleteCustomer,
}: PelangganMenuProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ConnectionStatus | 'ALL'>('ALL');
  const [selectedPackageType, setSelectedPackageType] = useState<'ALL' | 'broadband' | 'dedicated'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // New Customer Input Form States
  const [isAdding, setIsAdding] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRegion, setFormRegion] = useState<Region>('BEKASI wilayah Jatimakmur');
  const [formAddress, setFormAddress] = useState('');
  const [formPackage, setFormPackage] = useState('50 Mbps');
  const [formOntModel, setFormOntModel] = useState('ZTE F670L Dual Band');
  const [formOnuSn, setFormOnuSn] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formPppoeUser, setFormPppoeUser] = useState('');
  const [formPppoePass, setFormPppoePass] = useState('');
  const [formVlan, setFormVlan] = useState(220);

  // SQL Studio Terminal States
  const [isSqlConsoleOpen, setIsSqlConsoleOpen] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM customers WHERE status = 'online' LIMIT 5");
  const [sqlResult, setSqlResult] = useState<{ success: boolean; data?: any[]; message: string; affectedRows?: number } | null>(null);
  
  // Non-blocking iframe safe deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter customers logic
  const filteredCustomers = customers.filter((cust) => {
    const matchRegion = selectedRegion === 'ALL' || cust.region === selectedRegion;
    const matchStatus = selectedStatus === 'ALL' || cust.status === selectedStatus;
    const isDedicated = cust.packageSpeed.toLowerCase().includes('dedicated');
    const matchPackageType = 
      selectedPackageType === 'ALL' ||
      (selectedPackageType === 'dedicated' && isDedicated) ||
      (selectedPackageType === 'broadband' && !isDedicated);
    const matchSearch =
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.onuSn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchStatus && matchPackageType && matchSearch;
  });

  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Color code status badge
  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'online':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-xs font-mono lowercase">
            <CheckCircle className="w-3.5 h-3.5" />
            online
          </span>
        );
      case 'gangguan':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-500/30 text-xs font-mono lowercase animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            gangguan
          </span>
        );
      case 'offline':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-950/40 text-red-400 border border-red-500/30 text-xs font-mono lowercase">
            <XCircle className="w-3.5 h-3.5" />
            offline/LOS
          </span>
        );
    }
  };

  // Color code optical power
  const getOpticalPowerColor = (power: number, status: ConnectionStatus) => {
    if (status === 'offline') return 'text-red-500 neon-glow-red font-bold';
    if (power >= -24) return 'text-emerald-400 neon-glow-emerald';
    if (power >= -27) return 'text-amber-400 neon-glow-amber';
    return 'text-red-400 neon-glow-red animate-pulse font-bold';
  };

  const handleSyncGponPower = (cust: Customer) => {
    setSyncingId(cust.id);
    
    setTimeout(() => {
      setSyncingId(null);
      let newPower = cust.opticalPower;
      let newStatus = cust.status;

      if (cust.status === 'gangguan') {
        newPower = Number((-21.0 - Math.random() * 4).toFixed(1));
        newStatus = 'online';
      } else if (cust.status === 'online') {
        newPower = Number((-17.0 - Math.random() * 6).toFixed(1));
      } else if (cust.status === 'offline') {
        newPower = Number((-19.0 - Math.random() * 4).toFixed(1));
        newStatus = 'online';
      }

      onUpdateCustomer({
        ...cust,
        opticalPower: newPower,
        status: newStatus
      });
    }, 1500);
  };

  // Submit Add Customer Form
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Generate random serial if empty
    let finalSn = formOnuSn.trim();
    if (!finalSn) {
      const hex = '0123456789ABCDEF';
      let snSuffix = '';
      for (let j = 0; j < 8; j++) {
        snSuffix += hex[Math.floor(Math.random() * 16)];
      }
      finalSn = `ZTEG${snSuffix}`;
    }

    // Generate IP if empty
    let finalIp = formIp.trim();
    if (!finalIp) {
      finalIp = `10.120.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
    }

    // Generate PPPoE credentials if empty
    const cleanName = formName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const finalPppUser = formPppoeUser.trim() || `${cleanName}@aisyaka.net`;
    const finalPppPass = formPppoePass.trim() || `aisyaka${Math.floor(100 + Math.random() * 900)}`;

    const newCust: Omit<Customer, 'id'> = {
      name: formName,
      phone: formPhone || '0812-1100-2200',
      region: formRegion,
      address: formAddress || 'Jl. Raya Area Baru No. 1',
      packageSpeed: formPackage,
      status: 'online',
      opticalPower: -19.5,
      ipAddress: finalIp,
      onuSn: finalSn,
      ontModel: formOntModel,
      oltId: `OLT-${formRegion.split(' ')[0].toUpperCase()}-01`,
      pppoeUsername: finalPppUser,
      pppoePassword: finalPppPass,
      vlanId: Number(formVlan) || 200,
      pppServicePreset: 'PPPoE_HSIA_VLAN_100',
      pppStatus: 'connected'
    };

    onAddCustomer(newCust);
    setIsAdding(false);

    // Reset Form Fields
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormOnuSn('');
    setFormIp('');
    setFormPppoeUser('');
    setFormPppoePass('');
  };

  // Execute Simulated SQL Query
  const handleExecuteSQL = () => {
    const res = db.executeSQL(sqlQuery);
    setSqlResult(res);
    
    // If it was a mutator (INSERT, UPDATE, DELETE), sync the parent's state
    if (res.success && (res.affectedRows !== undefined || sqlQuery.toUpperCase().includes('INSERT'))) {
      onUpdateCustomer(db.getCustomers()[0]); // Trigger parent update safely by updating something small
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Action Bar (Tambah & SQL terminal buttons) */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-950 p-4 border border-slate-900 rounded">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-200">
              KONTROL DATABASE PELANGGAN GPON
            </h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
              Input pelanggan baru otomatis tanpa limitasi / Hubungkan terminal relasi SQL
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Tambah Pelanggan Button */}
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setIsSqlConsoleOpen(false);
            }}
            className={`flex-1 sm:flex-initial py-2 px-4 text-[10px] font-orbitron font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border ${
              isAdding 
                ? 'bg-red-950 text-red-400 border-red-500/50' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isAdding ? 'BATAL TAMBAH' : 'TAMBAH PELANGGAN'}
          </button>

          {/* SQL terminal button */}
          <button
            onClick={() => {
              setIsSqlConsoleOpen(!isSqlConsoleOpen);
              setIsAdding(false);
            }}
            className={`flex-1 sm:flex-initial py-2 px-4 text-[10px] font-orbitron font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border ${
              isSqlConsoleOpen
                ? 'bg-purple-950 text-purple-300 border-purple-500'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-400" />
            SQL CONSOLE
          </button>
        </div>
      </div>

      {/* A. TAMBAH PELANGGAN FORM */}
      {isAdding && (
        <NeonBox variant="cyan" title="FORM INPUT PELANGGAN BARU (DURABLE REGISTER)" subtitle="FTTH Auto-Provisioning & IP/PPPoE Generation">
          <form onSubmit={handleAddSubmit} className="space-y-4 font-mono text-xs text-slate-300">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Name */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Nama Lengkap Pelanggan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Dani"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Nomor Telepon/WA</label>
                <input
                  type="text"
                  placeholder="e.g. 0812-7489-1029"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Package Speed */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Paket Layanan FTTH</label>
                <select
                  value={formPackage}
                  onChange={(e) => setFormPackage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="30 Mbps">30 Mbps (Rp 165.000)</option>
                  <option value="50 Mbps">50 Mbps (Rp 220.000)</option>
                  <option value="100 Mbps">100 Mbps (Rp 350.000)</option>
                  <option value="150 Mbps">150 Mbps (Rp 480.000)</option>
                  <option value="200 Mbps">200 Mbps (Rp 590.000)</option>
                  <option value="100 Mbps Dedicated">100 Mbps Dedicated (Rp 1.500.000)</option>
                  <option value="200 Mbps Dedicated">200 Mbps Dedicated (Rp 2.800.000)</option>
                  <option value="300 Mbps Dedicated">300 Mbps Dedicated (Rp 4.000.000)</option>
                  <option value="500 Mbps Dedicated">500 Mbps Dedicated (Rp 6.500.000)</option>
                  <option value="1 Gbps Dedicated">1 Gbps Dedicated (Rp 12.000.000)</option>
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Region */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Wilayah Distribusi Node</label>
                <select
                  value={formRegion}
                  onChange={(e) => setFormRegion(e.target.value as Region)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {regions.map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Alamat Instalasi Rumah</label>
                <input
                  type="text"
                  placeholder="e.g. Jl. Anggrek No. 12, Kelapa Gading"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

            </div>

            {/* ONT / Provisioning Specifics Section */}
            <div className="bg-slate-950/70 p-4 border border-slate-900 rounded space-y-3">
              <span className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wide">// GPON PROVISIONING DETAILS (AUTO-FILL AVAILABLE)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                {/* ONT model */}
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase mb-1">Model Perangkat ONT</label>
                  <select
                    value={formOntModel}
                    onChange={(e) => setFormOntModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none text-[11px]"
                  >
                    <option value="ZTE F670L Dual Band">ZTE F670L Dual Band</option>
                    <option value="Huawei HG8245H5">Huawei HG8245H5</option>
                    <option value="ZTE F609 V5.2">ZTE F609 V5.2</option>
                    <option value="Huawei EG8145V5">Huawei EG8145V5</option>
                    <option value="Huawei HG8546M">Huawei HG8546M</option>
                  </select>
                </div>

                {/* ONU Serial */}
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase mb-1">Serial Number (ONU SN)</label>
                  <input
                    type="text"
                    placeholder="Kosongkan untuk acak"
                    value={formOnuSn}
                    onChange={(e) => setFormOnuSn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>

                {/* IP Address */}
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase mb-1">IP Address Static / DHCP</label>
                  <input
                    type="text"
                    placeholder="Kosongkan untuk acak"
                    value={formIp}
                    onChange={(e) => setFormIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>

                {/* VLAN ID */}
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase mb-1">VLAN ID Internet</label>
                  <input
                    type="number"
                    value={formVlan}
                    onChange={(e) => setFormVlan(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* PPPoE User */}
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase mb-1">Username PPPoE MikroTik Dial</label>
                  <input
                    type="text"
                    placeholder="e.g. username@aisyaka.net (Kosongkan untuk otomatis)"
                    value={formPppoeUser}
                    onChange={(e) => setFormPppoeUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>
                {/* PPPoE Pass */}
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase mb-1">Password PPPoE</label>
                  <input
                    type="text"
                    placeholder="Kosongkan untuk otomatis"
                    value={formPppoePass}
                    onChange={(e) => setFormPppoePass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
              <button
                type="submit"
                className="py-2.5 px-6 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-slate-950 hover:text-white font-orbitron font-extrabold text-[10px] tracking-wider uppercase rounded cursor-pointer transition-all duration-300"
              >
                PROVISI & SIMPAN DATA PELANGGAN
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2.5 px-4 border border-slate-850 hover:border-red-500 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              >
                BATAL
              </button>
            </div>

          </form>
        </NeonBox>
      )}

      {/* B. SQL CONSOLE / RELATIONAL DB STUDIO */}
      {isSqlConsoleOpen && (
        <NeonBox variant="fuchsia" title="TERMINAL SQL STUDIO (CLIENT-SIDE RELATIONAL DATABASE)" subtitle="Standard SQL Console for querying customers dataset">
          <div className="space-y-4 font-mono text-xs">
            
            <div className="p-3.5 bg-slate-950 border border-slate-900 rounded space-y-1.5">
              <span className="block text-[8px] font-extrabold text-fuchsia-400 uppercase tracking-widest">// CONTOH SYNTAX SQL VALID:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px] text-slate-400">
                <button 
                  type="button"
                  onClick={() => setSqlQuery("SELECT * FROM customers WHERE region = 'BEKASI wilayah Jatimakmur'")}
                  className="text-left bg-slate-900/45 p-1 rounded hover:bg-slate-900 hover:text-cyan-400 truncate cursor-pointer transition-colors border border-white/5"
                >
                  SELECT * FROM customers WHERE region = 'BEKASI wilayah Jatimakmur'
                </button>
                <button 
                  type="button"
                  onClick={() => setSqlQuery("SELECT id, name, status, packageSpeed FROM customers LIMIT 5")}
                  className="text-left bg-slate-900/45 p-1 rounded hover:bg-slate-900 hover:text-cyan-400 truncate cursor-pointer transition-colors border border-white/5"
                >
                  SELECT id, name, status, packageSpeed FROM customers LIMIT 5
                </button>
                <button 
                  type="button"
                  onClick={() => setSqlQuery("SELECT * FROM customers WHERE status = 'gangguan'")}
                  className="text-left bg-slate-900/45 p-1 rounded hover:bg-slate-900 hover:text-cyan-400 truncate cursor-pointer transition-colors border border-white/5"
                >
                  SELECT * FROM customers WHERE status = 'gangguan'
                </button>
                <button 
                  type="button"
                  onClick={() => setSqlQuery("UPDATE customers SET status = 'online' WHERE id = 'CUST-002'")}
                  className="text-left bg-slate-900/45 p-1 rounded hover:bg-slate-900 hover:text-cyan-400 truncate cursor-pointer transition-colors border border-white/5"
                >
                  UPDATE customers SET status = 'online' WHERE id = 'CUST-002'
                </button>
              </div>
            </div>

            {/* Command box */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fuchsia-400" />
                <input
                  type="text"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Ketik kueri SQL di sini..."
                  className="w-full bg-slate-950 border border-slate-800 text-fuchsia-300 placeholder-slate-700 pl-10 pr-4 py-2.5 font-mono text-xs focus:outline-none focus:border-fuchsia-500 rounded"
                />
              </div>
              <button
                onClick={handleExecuteSQL}
                className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold uppercase rounded cursor-pointer transition-all duration-200 shadow-[0_0_8px_rgba(217,70,239,0.2)] inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                RUN SQL
              </button>
            </div>

            {/* Results Grid display */}
            {sqlResult && (
              <div className="p-3 bg-black border border-slate-900 rounded space-y-2">
                <span className={`block font-bold text-[10px] ${sqlResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {sqlResult.success ? '✔ KUERI BERHASIL DI EKSEKUSI' : '❌ SYNTACK ERROR SQL'}
                </span>
                
                <p className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-900">{sqlResult.message}</p>

                {sqlResult.success && sqlResult.data && sqlResult.data.length > 0 && (
                  <div className="overflow-x-auto max-h-52">
                    <table className="w-full text-left text-[10px] font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950 text-slate-500">
                          {Object.keys(sqlResult.data[0]).map((key) => (
                            <th key={key} className="p-1 px-2 uppercase">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {sqlResult.data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/60">
                            {Object.values(row).map((val: any, vIdx) => (
                              <td key={vIdx} className="p-1 px-2 text-slate-350 max-w-[160px] truncate">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </NeonBox>
      )}

      {/* Filterbox Wilayah */}
      <NeonBox variant="cyan" title="FILTERING WILAYAH NETWORK" subtitle="Gpon Node Distribution Selection">
        <div className="space-y-4">
          
          {/* Region Select Grid */}
          <div>
            <span className="block text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wider">
              Pilih Wilayah Distribusi FTTH:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                onClick={() => { setSelectedRegion('ALL'); setCurrentPage(1); }}
                className={`py-1.5 px-3 font-orbitron text-xs font-bold uppercase transition-all duration-200 border cursor-pointer ${
                  selectedRegion === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-950/80 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/60'
                }`}
              >
                Semua ({customers.length})
              </button>
              {regions.map((reg) => {
                const count = customers.filter(c => c.region === reg).length;
                return (
                  <button
                    key={reg}
                    onClick={() => { setSelectedRegion(reg); setCurrentPage(1); }}
                    className={`py-1.5 px-3 font-orbitron text-xs font-bold uppercase transition-all duration-200 border cursor-pointer ${
                      selectedRegion === reg
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-950/80 text-cyan-400 border-cyan-500/20 hover:border-cyan-400/60'
                    }`}
                  >
                    {reg} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-1">
            {/* Search filter */}
            <div className="flex-1 relative">
              <span className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
                Pencarian Pelanggan:
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Cari Nama, CID, atau SN ONU..."
                  className="w-full bg-slate-950/90 border border-slate-800 focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-600 pl-9 pr-4 py-2 text-xs font-mono transition-colors"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[150px]">
              <span className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
                Status Koneksi:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value as ConnectionStatus | 'ALL'); setCurrentPage(1); }}
                className="w-full bg-slate-950/90 border border-slate-800 focus:outline-none focus:border-cyan-400 text-slate-100 py-2 px-3 text-xs font-mono transition-colors"
              >
                <option value="ALL">Semua Status</option>
                <option value="online">Online</option>
                <option value="gangguan">Gangguan</option>
                <option value="offline">Offline / Red LOS</option>
              </select>
            </div>

            {/* Package Type Filter */}
            <div className="flex-1 min-w-[150px]">
              <span className="block text-xs font-mono text-slate-400 mb-1.5 uppercase text-cyan-400">
                Kategori Layanan:
              </span>
              <select
                value={selectedPackageType}
                onChange={(e) => { setSelectedPackageType(e.target.value as 'ALL' | 'broadband' | 'dedicated'); setCurrentPage(1); }}
                className="w-full bg-slate-950/90 border border-cyan-500/30 focus:outline-none focus:border-cyan-400 text-cyan-300 py-2 px-3 text-xs font-mono transition-colors"
              >
                <option value="ALL">Semua Layanan (Broadband & Dedicated)</option>
                <option value="broadband">Broadband FTTH Only</option>
                <option value="dedicated">Dedicated Line (VVIP) Only</option>
              </select>
            </div>
          </div>

        </div>
      </NeonBox>

      {/* Main Customers List */}
      <NeonBox variant="cyan" title={`DAFTAR PELANGGAN (${filteredCustomers.length} DATA)`} subtitle="List of Connected Subscriber ONTs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs select-none">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase font-mono text-cyan-400/70 tracking-wider">
                <th className="py-2.5 px-3">Pelanggan Informatif</th>
                <th className="py-2.5 px-3">Wilayah</th>
                <th className="py-2.5 px-3">Status GPON</th>
                <th className="py-2.5 px-3">Redaman (Rx Power)</th>
                <th className="py-2.5 px-3">Seri ONU & SN</th>
                <th className="py-2.5 px-3 text-right">Aksi Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    *** TIDAK ADA DATA PELANGGAN YANG COCOK ***
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-cyan-950/20 transition-all group duration-150"
                  >
                    {/* Basic Info */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-300 text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {cust.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="text-cyan-400/80">{cust.id}</span>
                        <span>•</span>
                        <span>IP: {cust.ipAddress}</span>
                        <span>•</span>
                        {cust.packageSpeed.toLowerCase().includes('dedicated') ? (
                          <span className="px-1.5 py-0.5 bg-fuchsia-950/50 border border-fuchsia-500/30 text-fuchsia-400 font-bold rounded text-[9px] uppercase tracking-wider animate-pulse-glow">
                            💎 {cust.packageSpeed} (DEDICATED VVIP)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 rounded text-[9px] uppercase tracking-wider">
                            🌐 {cust.packageSpeed} (BROADBAND)
                          </span>
                        )}
                      </div>
                      {/* PPPoE Quick Specs */}
                      <div className="text-[9px] font-mono mt-1.5 flex flex-wrap items-center gap-1">
                        <span className="px-1 py-0.5 bg-cyan-950/40 border border-cyan-500/10 text-cyan-400/90 rounded">
                          📶 {cust.pppoeUsername || '-'}
                        </span>
                        <span className="px-1 py-0.5 bg-purple-950/40 border border-purple-500/10 text-purple-400/90 rounded">
                          🔗 VLAN {cust.vlanId || '-'}
                        </span>
                        {cust.pppStatus && (
                          <span className={`px-1.5 py-0.5 border rounded-sm font-semibold tracking-wide text-[8px] ${
                            cust.pppStatus === 'connected' 
                              ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' 
                              : cust.pppStatus === 'authenticating' 
                              ? 'bg-amber-950/40 border-amber-500/20 text-amber-400'
                              : 'bg-red-950/40 border-red-500/20 text-red-400'
                          }`}>
                            {cust.pppStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Region */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                        <MapPin className="w-3 h-3 text-cyan-500" />
                        {cust.region}
                      </span>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5 max-w-[150px] truncate">
                        {cust.address}
                      </div>
                    </td>

                    {/* Status GPON */}
                    <td className="py-3 px-3">
                      {getStatusBadge(cust.status)}
                    </td>

                    {/* Attenuation / Rx Power */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Signal className="w-3.5 h-3.5 text-slate-500" />
                        <span className={`font-mono text-sm leading-none ${getOpticalPowerColor(cust.opticalPower, cust.status)}`}>
                          {cust.status === 'offline' ? 'N/A' : `${cust.opticalPower} dBm`}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        {cust.status === 'offline' ? 'LOS (Putus)' : cust.opticalPower >= -24 ? 'Normal (Sangat Baik)' : cust.opticalPower >= -27 ? 'Marginal (Sedang)' : 'Under Threshold (Buruk)'}
                      </p>
                    </td>

                    {/* ONU model / serial */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-300 text-[11px]">{cust.onuSn}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{cust.ontModel}</div>
                    </td>

                    {/* Diagnostic Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Open Details Button */}
                        <button
                          onClick={() => onSelectCustomer(cust)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-cyan-900 border border-cyan-500/20 hover:border-cyan-400 text-[10px] text-cyan-400 hover:text-white font-mono uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Detail
                        </button>

                        {/* OLT Pull / Sync Button */}
                        <button
                          onClick={() => handleSyncGponPower(cust)}
                          disabled={syncingId === cust.id}
                          title="Tarik daya optical waktu-nyata langsung dari OLT"
                          className="p-1 border border-slate-800 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 rounded bg-slate-950 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingId === cust.id ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>

                        {/* Delete Customer Button */}
                        {confirmDeleteId === cust.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                onDeleteCustomer(cust.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-0.5 border border-red-500 bg-red-950/70 text-red-200 text-[10px] font-bold uppercase hover:bg-red-500 hover:text-slate-950 transition-all rounded cursor-pointer"
                              title="Konfirmasi hapus permanen"
                            >
                              Yakin?
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 border border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-[10px] rounded cursor-pointer"
                              title="Batal"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(cust.id)}
                            title="Hapus pelanggan secara permanen"
                            className="p-1 border border-slate-800 hover:border-red-500 text-slate-500 hover:text-red-400 rounded bg-slate-950 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Neon Pagination Panel */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-white/5 gap-3 font-mono text-[11px] text-slate-400 select-none">
            <div>
              Menampilkan <span className="text-cyan-400 font-bold">{Math.min(startIndex + 1, totalItems)}</span> Ke <span className="text-cyan-400 font-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> Dari <span className="text-cyan-400 font-bold">{totalItems}</span> Pelanggan
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 disabled:opacity-30 disabled:pointer-events-none text-slate-350 hover:text-cyan-400 transition-all font-mono tracking-wider cursor-pointer font-bold"
              >
                &lt;&lt;
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 disabled:opacity-30 disabled:pointer-events-none text-slate-350 hover:text-cyan-400 transition-all font-mono tracking-wider cursor-pointer font-bold"
              >
                &lt; SEBELUMNYA
              </button>
              
              <div className="px-3 py-1 bg-cyan-950/20 border border-cyan-500/30 text-cyan-400 font-bold font-mono">
                HALAMAN {currentPage} / {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 disabled:opacity-30 disabled:pointer-events-none text-slate-350 hover:text-cyan-400 transition-all font-mono tracking-wider cursor-pointer font-bold"
              >
                BERIKUTNYA &gt;
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 disabled:opacity-30 disabled:pointer-events-none text-slate-350 hover:text-cyan-400 transition-all font-mono tracking-wider cursor-pointer font-bold"
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        )}
      </NeonBox>

      {/* Guide Card / Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NeonBox variant="emerald" title="STANDAR REDAMAN SINYAL GPON (ITU-T)" subtitle="Signal Standardization Guidance">
          <ul className="space-y-2 font-mono text-[11px]">
            <li className="flex justify-between items-center py-1 border-b border-white/5">
              <span>Sangat Baik (Sangat Sehat)</span>
              <span className="text-emerald-400">-15 dBm s/d -24 dBm</span>
            </li>
            <li className="flex justify-between items-center py-1 border-b border-white/5">
              <span>Marginal / Rentah Degradasi</span>
              <span className="text-amber-400">-24.1 dBm s/d -27 dBm</span>
            </li>
            <li className="flex justify-between items-center py-1 border-b border-white/5">
              <span>Redam Tinggi (Kritis / Gangguan)</span>
              <span className="text-red-400">-27.1 dBm s/d -30 dBm</span>
            </li>
            <li className="flex justify-between items-center py-1">
              <span>LOS (Loss of Signal / Putus Total)</span>
              <span className="text-red-500 font-bold">-40 dBm atau kurang</span>
            </li>
          </ul>
        </NeonBox>

        <NeonBox variant="fuchsia" title="TOTAL DENSITY PELANGGAN AKTIF" subtitle="FTTH Subscriber Geographic Split">
          <div className="space-y-2 font-mono text-[11px]">
            <div className="grid grid-cols-3 gap-2">
              {regions.map(r => {
                const count = customers.filter(c => c.region === r).length;
                const onlineCount = customers.filter(c => c.region === r && c.status === 'online').length;
                const pct = count > 0 ? Math.round((onlineCount / count) * 100) : 0;
                return (
                  <div key={r} className="p-2 bg-slate-950/60 border border-white/5 rounded">
                    <p className="text-[10px] text-slate-400 truncate">{r}</p>
                    <p className="text-sm font-semibold text-slate-200 mt-1">{count} <span className="text-[10px] text-slate-500">Sub</span></p>
                    <div className="w-full bg-slate-800 h-1 rounded overflow-hidden mt-1 bg-opacity-40">
                      <div className={`h-full ${pct > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </NeonBox>
      </div>
    </div>
  );
}
