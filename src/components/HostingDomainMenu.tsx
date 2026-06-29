import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, HardDrive, Cpu, ShieldCheck, CheckCircle, TrendingUp, 
  Terminal, Activity, Play, Pause, Plus, Search, Trash2, 
  ExternalLink, RefreshCw, Sliders, Database, Server, Zap, Sparkles 
} from 'lucide-react';
import { Customer, Region } from '../types';

interface HostingDomainRecord {
  id: string;
  customerId: string;
  customerName: string;
  domainName: string;
  domainStatus: 'active' | 'pending' | 'expired';
  hostingPlan: 'SLA Cloud VPS Pro' | 'Dedicated Corporate Server' | 'Enterprise Web Hosting';
  hostingStatus: 'active' | 'provisioning' | 'suspended';
  expiryDate: string;
  price: number;
  ipAddress: string;
  dnsPropagation: number; // 0 to 100
  sslStatus: 'active' | 'generating' | 'failed';
  autoBackup: boolean;
  cpuUsage: number;
  ramUsage: number;
}

interface HostingDomainMenuProps {
  customers: Customer[];
  regions: Region[];
  onUpdateCustomers: (updated: Customer[]) => void;
  onUpdateAlerts: () => void;
}

export default function HostingDomainMenu({
  customers,
  regions,
  onUpdateCustomers,
  onUpdateAlerts
}: HostingDomainMenuProps) {
  // Filter out corporate customers (those with "Dedicated" in their package)
  const corporateCustomers = customers.filter(c => 
    c.packageSpeed && c.packageSpeed.toLowerCase().includes('dedicated')
  );

  // Default mock records for hosting and domain
  const getInitialRecords = (): HostingDomainRecord[] => {
    const saved = localStorage.getItem('aisyaka_net_hosting_domains');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse hosting domains:', e);
      }
    }

    // Seed initial data based on actual corporate customers
    const defaultRecords: HostingDomainRecord[] = [];
    corporateCustomers.forEach((cust, index) => {
      // Seed hosting for about 60% of corporate customers initially
      if (index % 1.5 === 0 || index === 0) {
        const domainSlug = cust.name.toLowerCase()
          .replace(/pt\.\s*/gi, '')
          .replace(/cv\.\s*/gi, '')
          .replace(/[^a-z0-9]/g, '');
        
        const plans: Array<'SLA Cloud VPS Pro' | 'Dedicated Corporate Server' | 'Enterprise Web Hosting'> = [
          'SLA Cloud VPS Pro',
          'Dedicated Corporate Server',
          'Enterprise Web Hosting'
        ];
        const planPrices = {
          'SLA Cloud VPS Pro': 1500000,
          'Dedicated Corporate Server': 4000000,
          'Enterprise Web Hosting': 450000
        };
        const plan = plans[index % plans.length];

        defaultRecords.push({
          id: `HD-${100 + index}`,
          customerId: cust.id,
          customerName: cust.name,
          domainName: `${domainSlug || 'company' + cust.id.substring(3)}.co.id`,
          domainStatus: 'active',
          hostingPlan: plan,
          hostingStatus: 'active',
          expiryDate: new Date(Date.now() + (365 - index * 12) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: planPrices[plan],
          ipAddress: `103.111.140.${20 + index * 4}`,
          dnsPropagation: 100,
          sslStatus: 'active',
          autoBackup: true,
          cpuUsage: Math.floor(Math.random() * 40) + 15,
          ramUsage: Math.floor(Math.random() * 30) + 30,
        });
      }
    });

    localStorage.setItem('aisyaka_net_hosting_domains', JSON.stringify(defaultRecords));
    return defaultRecords;
  };

  const [records, setRecords] = useState<HostingDomainRecord[]>(getInitialRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Terminal log console simulation
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [NOC INFRA] Menginisialisasi sistem otomasi cloud hosting & domain...`,
    `[${new Date().toLocaleTimeString()}] [NOC INFRA] Terkoneksi ke Registry PANDI CO.ID & Registrar Nasional... OK`,
    `[${new Date().toLocaleTimeString()}] [NOC INFRA] Menyinkronkan records dengan database pelanggan Dedicated...`
  ]);

  const [isRunning, setIsRunning] = useState(true);
  const [runnerSpeed, setRunnerSpeed] = useState<number>(3000); // ms per log/action

  // Modal State for adding new hosting
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'SLA Cloud VPS Pro' | 'Dedicated Corporate Server' | 'Enterprise Web Hosting'>('SLA Cloud VPS Pro');
  const [isAutoBackup, setIsAutoBackup] = useState(true);

  // Terminal autoscroll helper
  const terminalEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Sync state back to localStorage
  useEffect(() => {
    localStorage.setItem('aisyaka_net_hosting_domains', JSON.stringify(records));
  }, [records]);

  // Background Auto-Runner simulator
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      // 1. Generate normal operations logs (SSL checks, ping checks, usage update)
      const randomType = Math.floor(Math.random() * 5);
      const timestamp = new Date().toLocaleTimeString();

      if (records.length === 0) {
        setLogs(prev => [...prev, `[${timestamp}] [AUTOMATION] Menunggu pelanggan corporate didaftarkan ke sistem cloud...`]);
        return;
      }

      // Pick a random record to perform operation on
      const randIdx = Math.floor(Math.random() * records.length);
      const targetRecord = records[randIdx];

      setRecords(prev => prev.map((rec, idx) => {
        if (idx === randIdx && rec.hostingStatus === 'active') {
          return {
            ...rec,
            cpuUsage: Math.min(98, Math.max(5, rec.cpuUsage + Math.floor(Math.random() * 15) - 7)),
            ramUsage: Math.min(95, Math.max(10, rec.ramUsage + Math.floor(Math.random() * 11) - 5))
          };
        }
        return rec;
      }));

      switch (randomType) {
        case 0: // SSL Validity check
          setLogs(prev => [
            ...prev.slice(-49),
            `[${timestamp}] [SSL ENGINE] Memverifikasi Certificate Authority Let's Encrypt untuk https://${targetRecord.domainName}... OK (SSL VALID)`
          ]);
          break;

        case 1: // Auto Backup process
          if (targetRecord.autoBackup) {
            setLogs(prev => [
              ...prev.slice(-49),
              `[${timestamp}] [BACKUP ENGINE] Menjalankan incremental backup harian untuk ${targetRecord.domainName} -> target backup-srv-sg01... SUKSES (Integrity: 100%)`
            ]);
          } else {
            setLogs(prev => [
              ...prev.slice(-49),
              `[${timestamp}] [BACKUP ENGINE] [WARNING] Auto backup dinonaktifkan untuk ${targetRecord.domainName}. Melompati pencadangan!`
            ]);
          }
          break;

        case 2: // DNS Propagation & Ping check
          setLogs(prev => [
            ...prev.slice(-49),
            `[${timestamp}] [DNS CHECK] Resolving ${targetRecord.domainName} via Anycast DNS Cloudflare... IP: ${targetRecord.ipAddress} (Latency: ${Math.floor(Math.random() * 12) + 3}ms)`
          ]);
          break;

        case 3: // Auto provision simulator for corporate customer without hosting
          const nonHostingCorp = corporateCustomers.filter(c => !records.some(r => r.customerId === c.id));
          if (nonHostingCorp.length > 0) {
            const chosenCust = nonHostingCorp[Math.floor(Math.random() * nonHostingCorp.length)];
            const domainSlug = chosenCust.name.toLowerCase()
              .replace(/pt\.\s*/gi, '')
              .replace(/cv\.\s*/gi, '')
              .replace(/[^a-z0-9]/g, '');
            const defaultDomain = `${domainSlug || 'company' + chosenCust.id.substring(3)}.co.id`;
            
            setLogs(prev => [
              ...prev.slice(-49),
              `[${timestamp}] [PROVISIONER] Menemukan pelanggan corporate aktif tanpa layanan cloud: ${chosenCust.name}. Memulai setup otomatis...`
            ]);

            // Add the service as "provisioning" and let it scale up propagation in the next step
            setTimeout(() => {
              const plans: Array<'SLA Cloud VPS Pro' | 'Dedicated Corporate Server' | 'Enterprise Web Hosting'> = [
                'SLA Cloud VPS Pro', 'Dedicated Corporate Server', 'Enterprise Web Hosting'
              ];
              const planPrices = {
                'SLA Cloud VPS Pro': 1500000,
                'Dedicated Corporate Server': 4000000,
                'Enterprise Web Hosting': 450000
              };
              const randPlan = plans[Math.floor(Math.random() * plans.length)];
              
              const newRecord: HostingDomainRecord = {
                id: `HD-${200 + Math.floor(Math.random() * 800)}`,
                customerId: chosenCust.id,
                customerName: chosenCust.name,
                domainName: defaultDomain,
                domainStatus: 'pending',
                hostingPlan: randPlan,
                hostingStatus: 'provisioning',
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                price: planPrices[randPlan],
                ipAddress: `103.111.140.${100 + Math.floor(Math.random() * 150)}`,
                dnsPropagation: 15,
                sslStatus: 'generating',
                autoBackup: true,
                cpuUsage: 12,
                ramUsage: 25
              };

              setRecords(current => {
                if (current.some(r => r.customerId === chosenCust.id)) return current;
                return [...current, newRecord];
              });

              setLogs(prevLog => [
                ...prevLog.slice(-49),
                `[${new Date().toLocaleTimeString()}] [PROVISIONER] [PENDING] Sukses me-registrasikan domain ${defaultDomain} ke PANDI. Menyiapkan space VPS CPanel...`
              ]);
            }, 1000);
          } else {
            // Random server check log
            setLogs(prev => [
              ...prev.slice(-49),
              `[${timestamp}] [SYS MONITOR] Load core server cloud-hypervisor-03: CPU ${Math.floor(Math.random() * 20) + 10}%, RAM ${Math.floor(Math.random() * 15) + 40}% (Suhu: 42°C - Dingin)`
            ]);
          }
          break;

        case 4: // Upgrade/process any "pending" or "provisioning" records
          const provisioningRec = records.find(r => r.hostingStatus === 'provisioning' || r.domainStatus === 'pending');
          if (provisioningRec) {
            setRecords(current => current.map(r => {
              if (r.id === provisioningRec.id) {
                const nextProp = Math.min(100, r.dnsPropagation + 40);
                const nextHostingStatus = nextProp === 100 ? 'active' : 'provisioning';
                const nextDomainStatus = nextProp === 100 ? 'active' : 'pending';
                const nextSSL = nextProp === 100 ? 'active' : 'generating';

                if (nextProp === 100) {
                  setLogs(prevLog => [
                    ...prevLog.slice(-49),
                    `[${new Date().toLocaleTimeString()}] [PROVISIONER] [SUCCESS] Domain ${r.domainName} & VPS ${r.hostingPlan} telah aktif sepenuhnya! DNS terpropagasi 100%. SSL Terbit.`
                  ]);
                } else {
                  setLogs(prevLog => [
                    ...prevLog.slice(-49),
                    `[${new Date().toLocaleTimeString()}] [PROVISIONER] Propagasi Anycast DNS untuk ${r.domainName}: ${nextProp}%...`
                  ]);
                }

                return {
                  ...r,
                  dnsPropagation: nextProp,
                  hostingStatus: nextHostingStatus as any,
                  domainStatus: nextDomainStatus as any,
                  sslStatus: nextSSL as any
                };
              }
              return r;
            }));
          } else {
            // General status report
            setLogs(prev => [
              ...prev.slice(-49),
              `[${timestamp}] [SLA HEALTH] Kualitas jaringan cloud hosting Aisyaka.Net di angka 99.98% Uptime. Semua sistem normal.`
            ]);
          }
          break;
      }
    }, runnerSpeed);

    return () => clearInterval(timer);
  }, [isRunning, records, runnerSpeed, corporateCustomers]);

  // Manually Add service
  const handleAddHostingDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustId) return;

    const chosenCust = customers.find(c => c.id === selectedCustId);
    if (!chosenCust) return;

    // Check if customer already has a service registered
    if (records.some(r => r.customerId === selectedCustId)) {
      alert(`Pelanggan ${chosenCust.name} sudah memiliki layanan hosting/domain di sistem!`);
      return;
    }

    const domain = customDomain.trim() || `${chosenCust.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.id`;
    const planPrices = {
      'SLA Cloud VPS Pro': 1500000,
      'Dedicated Corporate Server': 4000000,
      'Enterprise Web Hosting': 450000
    };

    const newRec: HostingDomainRecord = {
      id: `HD-${Math.floor(Math.random() * 900) + 100}`,
      customerId: chosenCust.id,
      customerName: chosenCust.name,
      domainName: domain,
      domainStatus: 'active',
      hostingPlan: selectedPlan,
      hostingStatus: 'active',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: planPrices[selectedPlan],
      ipAddress: `103.111.140.${40 + Math.floor(Math.random() * 150)}`,
      dnsPropagation: 100,
      sslStatus: 'active',
      autoBackup: isAutoBackup,
      cpuUsage: 10,
      ramUsage: 25
    };

    setRecords(prev => [...prev, newRec]);
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [ADMIN CRON] Manual provisioning sukses oleh NOC Admin untuk ${chosenCust.name} (${domain}) - Paket: ${selectedPlan}`
    ]);

    setIsAddModalOpen(false);
    setSelectedCustId('');
    setCustomDomain('');
  };

  // Delete service
  const handleDeleteService = (id: string, domainName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus & menonaktifkan layanan hosting/domain untuk ${domainName}? Tindakan ini akan menghapus seluruh data virtual container VPS.`)) {
      setRecords(prev => prev.filter(r => r.id !== id));
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [NOC INFRA] Menghapus VPS Container & Melepas delegasi Domain DNS untuk ${domainName} (DELETED)`
      ]);
    }
  };

  // Toggle backup setting
  const toggleBackup = (id: string, domain: string, current: boolean) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, autoBackup: !current } : r));
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [CONFIG UPDATE] Mengubah status Auto Backup ${domain} menjadi: ${!current ? 'AKTIF' : 'NON-AKTIF'}`
    ]);
  };

  // Run instant manual backup
  const runInstantBackup = (domainName: string) => {
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [BACKUP MANUAL] Memulai backup instan atas permintaan NOC Admin untuk ${domainName}...`,
      `[${new Date().toLocaleTimeString()}] [BACKUP MANUAL] Mengkompresi database MySQL & folder public_html... OK`,
      `[${new Date().toLocaleTimeString()}] [BACKUP MANUAL] Mengirimkan file arsip (.tar.gz) ke cluster backup-cold01... SUKSES`
    ]);
  };

  // Trigger manual domain propagation refresh
  const runDomainPing = (domainName: string, ip: string) => {
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [DNS QUERY] Menjalankan dig +trace ${domainName} @8.8.8.8...`,
      `[${new Date().toLocaleTimeString()}] [DNS QUERY] NS1.AISYAKA.NET resolved to ${ip}`,
      `[${new Date().toLocaleTimeString()}] [DNS QUERY] NS2.AISYAKA.NET resolved to ${ip}`,
      `[${new Date().toLocaleTimeString()}] [DNS QUERY] Hasil kueri: Propagasi Sukses di 24 Server DNS Global!`
    ]);
  };

  // Filter records based on search and drop-downs
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ipAddress.includes(searchQuery);

    const matchesPlan = selectedPlanFilter === 'all' || r.hostingPlan === selectedPlanFilter;
    const matchesStatus = statusFilter === 'all' || r.hostingStatus === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Calculate stats
  const totalActiveDomains = records.filter(r => r.domainStatus === 'active').length;
  const totalHostingInProvision = records.filter(r => r.hostingStatus === 'provisioning').length;
  const totalMRR = records.reduce((sum, r) => sum + r.price, 0);

  // Suggested domain generator helper for form
  const handleCustomerSelectForForm = (id: string) => {
    setSelectedCustId(id);
    const chosen = customers.find(c => c.id === id);
    if (chosen) {
      const slug = chosen.name.toLowerCase()
        .replace(/pt\.\s*/gi, '')
        .replace(/cv\.\s*/gi, '')
        .replace(/[^a-z0-9]/g, '');
      setCustomDomain(`${slug || 'perusahaan'}.co.id`);
    } else {
      setCustomDomain('');
    }
  };

  return (
    <div className="space-y-6" id="hosting-domain-app">
      {/* HEADER BAR */}
      <div className="bg-slate-950 p-4 border border-cyan-500/30 rounded shadow-[0_0_15px_rgba(6,182,212,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
            <h1 className="text-lg font-orbitron font-black text-white tracking-widest uppercase">
              PORTAL CLOUD: HOSTING & CUSTOM DOMAIN
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase text-[10px]">
            // Automasi provisioning hosting, VPS, dan pendaftaran domain bagi pelanggan Corporate Dedicated SLA
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-400 text-cyan-300 font-orbitron font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Layanan Cloud
          </button>
          
          <button
            onClick={() => {
              // Automatically provision for ALL non-hosting corporate customers
              const nonHosting = corporateCustomers.filter(c => !records.some(r => r.customerId === c.id));
              if (nonHosting.length === 0) {
                alert("Semua pelanggan corporate dedicated sudah memiliki layanan cloud hosting!");
                return;
              }
              
              setLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] [BULK JOB] Memulai auto-provisioning massal untuk ${nonHosting.length} pelanggan dedicated...`
              ]);

              const plans: Array<'SLA Cloud VPS Pro' | 'Dedicated Corporate Server' | 'Enterprise Web Hosting'> = [
                'SLA Cloud VPS Pro', 'Dedicated Corporate Server', 'Enterprise Web Hosting'
              ];
              const planPrices = {
                'SLA Cloud VPS Pro': 1500000,
                'Dedicated Corporate Server': 4000000,
                'Enterprise Web Hosting': 450000
              };

              const newRecsToAdd: HostingDomainRecord[] = [];
              nonHosting.forEach((chosenCust, i) => {
                const slug = chosenCust.name.toLowerCase()
                  .replace(/pt\.\s*/gi, '')
                  .replace(/cv\.\s*/gi, '')
                  .replace(/[^a-z0-9]/g, '');
                const domain = `${slug || 'company' + chosenCust.id.substring(3)}.co.id`;
                const plan = plans[i % plans.length];
                
                newRecsToAdd.push({
                  id: `HD-${300 + i}`,
                  customerId: chosenCust.id,
                  customerName: chosenCust.name,
                  domainName: domain,
                  domainStatus: 'active',
                  hostingPlan: plan,
                  hostingStatus: 'active',
                  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  price: planPrices[plan],
                  ipAddress: `103.111.140.${60 + i * 5}`,
                  dnsPropagation: 100,
                  sslStatus: 'active',
                  autoBackup: true,
                  cpuUsage: 12 + i * 2,
                  ramUsage: 28 + i * 3
                });
              });

              setRecords(prev => [...prev, ...newRecsToAdd]);
              setLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] [BULK JOB] Berhasil mengaktifkan otomatis ${newRecsToAdd.length} cluster hosting & domain!`
              ]);
            }}
            className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500 text-emerald-400 font-orbitron font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Run Massal
          </button>
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-slate-950 p-3.5 border border-slate-900 rounded shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-2 p-1.5 bg-cyan-950/40 rounded-full">
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">// Domain Terdaftar</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-orbitron font-black text-white">{totalActiveDomains}</span>
            <span className="text-xs text-cyan-400 font-mono uppercase">CO.ID / NET / COM</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Uptime SLA Monitoring: 100%
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-slate-950 p-3.5 border border-slate-900 rounded shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-2 p-1.5 bg-fuchsia-950/40 rounded-full">
            <Server className="w-4 h-4 text-fuchsia-400" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">// Server Active</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-orbitron font-black text-white">
              {records.filter(r => r.hostingStatus === 'active').length}
            </span>
            {totalHostingInProvision > 0 && (
              <span className="text-xs text-amber-500 animate-pulse font-mono">
                (+{totalHostingInProvision} pending)
              </span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Plesk & cPanel Clusters Online
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-slate-950 p-3.5 border border-slate-900 rounded shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-2 p-1.5 bg-emerald-950/40 rounded-full">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">// Cloud Hosting MRR</p>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-orbitron font-black text-emerald-400">
              Rp {totalMRR.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Recurring billing per bulan
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-slate-950 p-3.5 border border-slate-900 rounded shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-2 p-1.5 bg-slate-900 rounded-full">
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">// NOC Runner Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
            <span className="text-xs font-orbitron font-bold tracking-widest uppercase text-slate-200">
              {isRunning ? 'AUTOMATION ACTIVE' : 'PAUSED'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-1 text-[9px] uppercase font-bold border font-mono rounded cursor-pointer ${
                isRunning 
                  ? 'border-amber-500/30 text-amber-500 hover:bg-amber-950/20' 
                  : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-950/20'
              }`}
            >
              {isRunning ? 'Pause Engine' : 'Resume Engine'}
            </button>
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
              <span>Speed:</span>
              <select
                value={runnerSpeed}
                onChange={(e) => setRunnerSpeed(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-300 p-0.5 rounded cursor-pointer focus:outline-none"
              >
                <option value={1500}>Fast (1.5s)</option>
                <option value={3000}>Normal (3s)</option>
                <option value={6000}>Slow (6s)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TERMINAL & NO ACTION INTERFACE CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LIVE TERMINAL AUTOMATION LOGS */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded shadow-lg flex flex-col h-[320px] lg:h-auto">
          <div className="bg-slate-900/60 p-2.5 border-b border-slate-900 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-orbitron font-bold text-slate-300 tracking-wider">
                NOC ENGINE LIVE AUTOMATION LOGS
              </span>
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </div>
          </div>
          
          <div className="flex-1 p-3 font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1 bg-slate-950/80 leading-relaxed max-h-[250px] lg:max-h-[350px]">
            {logs.map((log, index) => {
              let textClass = "text-slate-300";
              if (log.includes('SUKSES') || log.includes('OK') || log.includes('VALID')) textClass = "text-emerald-400 font-semibold";
              if (log.includes('WARNING') || log.includes('PENDING')) textClass = "text-amber-400";
              if (log.includes('PROVISION') || log.includes('bulk')) textClass = "text-cyan-400 font-bold";
              if (log.includes('DELETED')) textClass = "text-red-400 font-semibold";

              return (
                <div key={index} className={`whitespace-pre-wrap ${textClass}`}>
                  {log}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
          
          <div className="p-2 border-t border-slate-900 bg-slate-900/40 flex justify-between text-[9px] text-slate-500 font-mono">
            <span>Buffer size: {logs.length}/50</span>
            <button 
              onClick={() => setLogs([`[${new Date().toLocaleTimeString()}] [NOC INFRA] Konsol logs dibersihkan.`])}
              className="hover:text-cyan-400 cursor-pointer text-slate-400 uppercase font-bold"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* CLIENT QUICK GUIDE & QUICK AUTO-PROPOSE CARDS */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="bg-slate-950/60 p-4 border border-slate-900 rounded flex-1">
            <h2 className="text-xs font-orbitron font-bold text-cyan-300 tracking-wider uppercase mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              INFORMASI HOSTING & DOMAIN CORPORATE
            </h2>
            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>
                Sistem portal cloud diintegrasikan dengan jaringan <strong className="text-white">Aisyaka.Net</strong>. Setiap pelanggan corporate dengan bandwidth bertipe <span className="text-cyan-300 font-semibold">"Dedicated SLA"</span> berhak mendapatkan integrasi Domain .CO.ID Indonesia gratis dan Cloud VPS Server.
              </p>
              <p>
                Fitur auto-run massal akan secara berkala memicu registrasi DNS otomatis, memeriksa integrasi Let's Encrypt SSL, dan menjalankan background backup harian tanpa menguras resource OLT.
              </p>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-900 text-[11px] grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex gap-2">
                  <div className="mt-0.5 text-cyan-400">❶</div>
                  <div>
                    <h4 className="font-bold text-slate-300 uppercase">Enterprise Hosting</h4>
                    <span className="text-slate-500 font-mono">Rp 450.000 / bln</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="mt-0.5 text-cyan-400">❷</div>
                  <div>
                    <h4 className="font-bold text-slate-300 uppercase">SLA Cloud VPS Pro</h4>
                    <span className="text-slate-500 font-mono">Rp 1.500.000 / bln</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="mt-0.5 text-cyan-400">❸</div>
                  <div>
                    <h4 className="font-bold text-slate-300 uppercase">Dedicated Server</h4>
                    <span className="text-slate-500 font-mono">Rp 4.000.000 / bln</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED CUSTOMERS WITHOUT SERVICES */}
          <div className="bg-slate-950 p-4 border border-slate-900 rounded">
            <h3 className="text-xs font-orbitron font-bold text-amber-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-500 animate-spin" />
              PELANGGAN CORPORATE BELUM AKTIF CLOUD ({corporateCustomers.filter(c => !records.some(r => r.customerId === c.id)).length})
            </h3>
            
            {corporateCustomers.filter(c => !records.some(r => r.customerId === c.id)).length === 0 ? (
              <p className="text-[11px] text-slate-500 font-mono uppercase text-center py-4 bg-slate-950/40 rounded border border-white/5">
                Semua pelanggan Corporate (Dedicated) telah terintegrasi dengan Portal Hosting & Domain!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[140px] overflow-y-auto pr-1">
                {corporateCustomers
                  .filter(c => !records.some(r => r.customerId === c.id))
                  .map(cust => {
                    const slug = cust.name.toLowerCase()
                      .replace(/pt\.\s*/gi, '')
                      .replace(/cv\.\s*/gi, '')
                      .replace(/[^a-z0-9]/g, '');
                    const suggestedDomain = `${slug || 'perusahaan'}.co.id`;

                    return (
                      <div key={cust.id} className="bg-slate-950/80 p-2.5 border border-white/5 rounded flex justify-between items-center">
                        <div className="space-y-0.5">
                          <h4 className="text-[11px] font-bold text-white uppercase truncate max-w-[150px]">{cust.name}</h4>
                          <p className="text-[9px] font-mono text-cyan-400">{cust.packageSpeed}</p>
                          <p className="text-[9px] text-slate-500 font-mono">Saran: {suggestedDomain}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCustId(cust.id);
                            setCustomDomain(suggestedDomain);
                            setIsAddModalOpen(true);
                          }}
                          className="px-2 py-1 bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:border-cyan-400 text-[10px] font-orbitron font-bold uppercase rounded cursor-pointer transition-all"
                        >
                          PROPOSE
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* INTEGRATED CLIENT DATABASE TABLE */}
      <div className="bg-slate-950 border border-slate-900 rounded shadow-lg overflow-hidden">
        <div className="bg-slate-900/40 p-4 border-b border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-orbitron font-bold text-white uppercase tracking-wider">
              DATABASE PENJUALAN HOSTING & DOMAIN PELANGGAN
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari domain / pelanggan..."
                className="w-full md:w-48 bg-slate-900/60 border border-slate-800 focus:border-cyan-500 text-xs text-white pl-8 pr-2 py-1.5 rounded focus:outline-none placeholder:text-slate-600"
              />
            </div>
            
            {/* Hosting Plan Filter */}
            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 text-xs text-slate-300 p-1.5 rounded focus:outline-none cursor-pointer hover:border-slate-700"
            >
              <option value="all">Semua Paket</option>
              <option value="SLA Cloud VPS Pro">SLA Cloud VPS Pro</option>
              <option value="Dedicated Corporate Server">Dedicated Corporate Server</option>
              <option value="Enterprise Web Hosting">Enterprise Web Hosting</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 text-xs text-slate-300 p-1.5 rounded focus:outline-none cursor-pointer hover:border-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="active">Active</option>
              <option value="provisioning">Provisioning</option>
            </select>
          </div>
        </div>

        {/* TABLE COMPONENT */}
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center uppercase font-bold text-slate-600 text-xs font-mono">
            TIDAK ADA DATA PELANGGAN CORPORATE YANG COCOK.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-900 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3">ID & Pelanggan</th>
                  <th className="p-3">Domain Resmi</th>
                  <th className="p-3">Paket Cloud Server</th>
                  <th className="p-3">IP Address & DNS</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">VPS Resources</th>
                  <th className="p-3 text-center">Auto Backup</th>
                  <th className="p-3 text-right">Aksi Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredRecords.map((rec) => {
                  return (
                    <tr 
                      key={rec.id} 
                      className={`hover:bg-slate-950/80 transition-colors ${
                        rec.hostingStatus === 'provisioning' ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* ID & Customer */}
                      <td className="p-3">
                        <div className="font-bold text-white uppercase">{rec.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <span className="px-1 py-0.5 bg-slate-900 rounded">{rec.id}</span>
                          <span>• ID Pelanggan: {rec.customerId}</span>
                        </div>
                      </td>

                      {/* Domain Name */}
                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                          <Globe className="w-3.5 h-3.5" />
                          <a href={`http://${rec.domainName}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
                            {rec.domainName}
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Exp: {rec.expiryDate}
                        </div>
                      </td>

                      {/* Plan & Price */}
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{rec.hostingPlan}</div>
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                          Rp {rec.price.toLocaleString('id-ID')} / bln
                        </div>
                      </td>

                      {/* IP & Propagation */}
                      <td className="p-3 font-mono text-[11px] text-slate-300">
                        <div>{rec.ipAddress}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 uppercase font-bold">DNS:</span>
                          <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full ${rec.dnsPropagation === 100 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
                              style={{ width: `${rec.dnsPropagation}%` }}
                            />
                          </div>
                          <span className={`text-[9px] font-bold ${rec.dnsPropagation === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {rec.dnsPropagation}%
                          </span>
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="p-3 space-y-1">
                        {/* Hosting Status */}
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            rec.hostingStatus === 'active' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-amber-500 animate-pulse'
                          }`} />
                          <span className={`text-[10px] uppercase font-mono font-bold ${
                            rec.hostingStatus === 'active' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            Host: {rec.hostingStatus}
                          </span>
                        </div>

                        {/* SSL Status */}
                        <div className="flex items-center gap-1">
                          <ShieldCheck className={`w-3.5 h-3.5 ${rec.sslStatus === 'active' ? 'text-cyan-400' : 'text-amber-500 animate-spin'}`} />
                          <span className={`text-[10px] uppercase font-mono ${rec.sslStatus === 'active' ? 'text-cyan-400' : 'text-amber-400'}`}>
                            SSL: {rec.sslStatus}
                          </span>
                        </div>
                      </td>

                      {/* CPU & RAM */}
                      <td className="p-3 font-mono space-y-1">
                        {rec.hostingStatus === 'active' ? (
                          <>
                            <div className="flex items-center justify-between gap-2 text-[10px]">
                              <span className="text-slate-500">CPU:</span>
                              <span className={rec.cpuUsage > 75 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{rec.cpuUsage}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-[10px]">
                              <span className="text-slate-500">RAM:</span>
                              <span className="text-slate-300">{rec.ramUsage}%</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-600 uppercase text-[9px] font-bold">// Offline Setup</span>
                        )}
                      </td>

                      {/* Auto Backup toggle switch */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleBackup(rec.id, rec.domainName, rec.autoBackup)}
                          className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold border rounded-sm cursor-pointer transition-colors ${
                            rec.autoBackup 
                              ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-950' 
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {rec.autoBackup ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => runInstantBackup(rec.domainName)}
                            title="Lakukan Backup Cepat"
                            className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/50 rounded cursor-pointer transition-all"
                          >
                            <HardDrive className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => runDomainPing(rec.domainName, rec.ipAddress)}
                            title="Query DNS & Ping Trace"
                            className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/50 rounded cursor-pointer transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteService(rec.id, rec.domainName)}
                            title="Hapus Layanan Hosting"
                            className="p-1.5 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/50 rounded cursor-pointer transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FOR ADDING CLOUD SERVICES */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-950 border border-cyan-400/50 rounded shadow-[0_0_30px_rgba(6,182,212,0.4)] w-full max-w-md p-6 relative">
            <h3 className="text-sm font-orbitron font-black text-white uppercase tracking-widest border-b border-slate-900 pb-3 mb-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              INTEGRASI CLOUD HOSTING & DOMAIN
            </h3>
            
            <form onSubmit={handleAddHostingDomain} className="space-y-4">
              {/* Select Corporate Customer */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  PILIH PELANGGAN CORPORATE *
                </label>
                <select
                  required
                  value={selectedCustId}
                  onChange={(e) => handleCustomerSelectForForm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white p-2.5 rounded focus:outline-none"
                >
                  <option value="">-- Pilih Pelanggan Dedicated --</option>
                  {corporateCustomers.map(cust => {
                    const alreadyHas = records.some(r => r.customerId === cust.id);
                    return (
                      <option 
                        key={cust.id} 
                        value={cust.id}
                        disabled={alreadyHas}
                        className={alreadyHas ? 'text-slate-600' : 'text-slate-100'}
                      >
                        {cust.name} ({cust.packageSpeed}) {alreadyHas ? '[SUDAH AKTIF]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Domain Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  NAMA DOMAIN UTAMA *
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="misal: sinarmas.co.id"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white pl-10 pr-3 py-2.5 rounded focus:outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>
                <p className="text-[9px] text-slate-500 font-mono">
                  * Prioritas menggunakan domain resmi Indonesia .CO.ID untuk korporasi
                </p>
              </div>

              {/* Hosting Plan Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  PAKET CLOUD SERVER / VPS *
                </label>
                <select
                  required
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white p-2.5 rounded focus:outline-none"
                >
                  <option value="SLA Cloud VPS Pro">SLA Cloud VPS Pro (Rp 1.500.000 / bln)</option>
                  <option value="Dedicated Corporate Server">Dedicated Corporate Server (Rp 4.000.000 / bln)</option>
                  <option value="Enterprise Web Hosting">Enterprise Web Hosting (Rp 450.000 / bln)</option>
                </select>
              </div>

              {/* Toggle Auto Backup */}
              <div className="flex items-center gap-3 py-2 bg-slate-950 p-2.5 rounded border border-slate-900">
                <input
                  type="checkbox"
                  id="auto_backup_check"
                  checked={isAutoBackup}
                  onChange={(e) => setIsAutoBackup(e.target.checked)}
                  className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900"
                />
                <label htmlFor="auto_backup_check" className="text-[11px] font-mono text-slate-300 uppercase cursor-pointer">
                  Aktifkan Auto-Backup 24 Jam & SLA Protection
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-orbitron font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-400 text-cyan-300 font-orbitron font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer"
                >
                  Mulai Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
