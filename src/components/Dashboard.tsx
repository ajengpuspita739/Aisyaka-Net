import React, { useState } from 'react';
import { Customer, Device, NetworkAlert, TrafficPoint, Region, ConnectionStatus } from '../types';
import { getNetworkStats } from '../data';
import { 
  Users, Server, AlertOctagon, Activity, LogOut, 
  MapPin, Radio, Wifi, Clock, Database, ChevronRight, User, Terminal,
  Receipt, Menu, Gauge, Wrench, Smartphone, MessageSquare, Globe, Laptop
} from 'lucide-react';
import NeonBox from './NeonBox';
import PelangganMenu from './PelangganMenu';
import DevicesMenu from './DevicesMenu';
import AlertsMenu from './AlertsMenu';
import RealTimeTraffic from './RealTimeTraffic';
import CustomerDetailModal from './CustomerDetailModal';
import MikroTikMenu from './MikroTikMenu';
import GponMapsMenu from './GponMapsMenu';
import BillingMenu from './BillingMenu';
import SpeedtestMenu from './SpeedtestMenu';
import TeknisiMenu from './TeknisiMenu';
import TechnicianApp from './TechnicianApp';
import HostingDomainMenu from './HostingDomainMenu';
import OntRemoteMenu from './OntRemoteMenu';
import { db } from '../db';

interface DashboardProps {
  username: string;
  customers: Customer[];
  devices: Device[];
  alerts: NetworkAlert[];
  trafficData: TrafficPoint[];
  regions: Region[];
  onLogout: () => void;
  onUpdateCustomersList: (list: Customer[]) => void;
  onUpdateAlertsList: (list: NetworkAlert[]) => void;
}

type TabType = 'customers' | 'devices' | 'alerts' | 'traffic' | 'mikrotik' | 'maps' | 'billing' | 'speedtest' | 'technicians' | 'technician_app' | 'hosting_domain' | 'remote_ont';

export default function Dashboard({
  username,
  customers,
  devices,
  alerts,
  trafficData,
  regions,
  onLogout,
  onUpdateCustomersList,
  onUpdateAlertsList,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [selectedInspectCustomer, setSelectedInspectCustomer] = useState<Customer | null>(null);
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync calculations from active list
  const stats = getNetworkStats(customers, devices, alerts);

  // Handlers for modifying state
  const handleUpdateCustomer = (updatedCust: Customer) => {
    // 1. Update customer inside local persistent DB
    db.updateCustomer(updatedCust);
    
    // 2. Fetch fresh array from DB
    const updated = db.getCustomers();
    onUpdateCustomersList(updated);

    // 3. Also keep inspected customer in sync
    if (selectedInspectCustomer?.id === updatedCust.id) {
      setSelectedInspectCustomer(updatedCust);
    }

    // 4. If customer signal was fixed/restored, auto-resolve related critical/warning alarms
    if (updatedCust.status === 'online') {
      const updatedAl = alerts.map((al) => {
        if (al.customerId === updatedCust.id && !al.resolved) {
          return { ...al, resolved: true, ackBy: 'NOC_Auto_Optical_Sync' };
        }
        return al;
      });
      onUpdateAlertsList(updatedAl);
    }
  };

  const handleAddCustomer = (newCustData: Omit<Customer, 'id'>) => {
    const savedCust = db.addCustomer(newCustData);
    onUpdateCustomersList(db.getCustomers());

    // Check if Auto-Provisioning (Auto-Reg) is active for this region
    let isAutoRegEnabled = true;
    let targetVlan = newCustData.vlanId || 200;
    try {
      const saved = localStorage.getItem('aisyaka_regional_olts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[newCustData.region]) {
          isAutoRegEnabled = parsed[newCustData.region].autoReg;
          targetVlan = parsed[newCustData.region].vlan;
        }
      }
    } catch (e) {}

    if (isAutoRegEnabled) {
      // Create a successful automated provisioning message
      const provAlert: NetworkAlert = {
        id: `ALERT-PROV-${Date.now()}`,
        customerId: savedCust.id,
        customerName: savedCust.name,
        region: savedCust.region,
        type: 'RED LOS', // existing type inside union
        severity: 'INFO',
        message: `[SINKRONISASI OTOMATIS] Sukses mendaftarkan ONT SN: ${savedCust.onuSn} di OLT Chassis ${savedCust.region}. Port map VLAN ${targetVlan} selesai & Secret PPPoE disinkronkan otomatis!`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        resolved: true // auto-resolved since it is a success notification
      };
      
      onUpdateAlertsList([provAlert, ...alerts]);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    db.deleteCustomer(id);
    onUpdateCustomersList(db.getCustomers());
  };

  // Resolve Alerts handler
  const handleResolveAlert = (alertId: string) => {
    // 1. Mark alert as resolved
    const targetAlert = alerts.find(a => a.id === alertId);
    const updatedAl = alerts.map((al) => (al.id === alertId ? { ...al, resolved: true } : al));
    onUpdateAlertsList(updatedAl);

    // 2. Automatically sync customer status back to normal / online!
    if (targetAlert?.customerId) {
      const cust = customers.find(c => c.id === targetAlert.customerId);
      if (cust) {
        handleUpdateCustomer({
          ...cust,
          status: 'online',
          opticalPower: -19.2 // Normalize DB optical loss
        });
      }
    }
  };

  // Acknowledge alert handler
  const handleAcknowledgeAlert = (alertId: string, operatorName: string) => {
    const updatedAl = alerts.map((al) => 
      al.id === alertId ? { ...al, ackBy: operatorName } : al
    );
    onUpdateAlertsList(updatedAl);
  };

  // Reboot Device Simulation
  const handleTriggerReboot = (deviceId: string) => {
    console.log(`Reboot signal transmitted for router device ID ${deviceId}`);
    // If device was warning/offline, we could simulate normal auto reboot after timeout
  };

  const menuItems = [
    { id: 'customers', label: 'PELANGGAN', icon: Users, color: 'text-cyan-400' },
    { id: 'devices', label: 'DEVICES INFRA', icon: Server, color: 'text-emerald-400' },
    { id: 'alerts', label: 'GPON ALERTS', icon: AlertOctagon, color: 'text-red-400', badge: stats.activeAlertsCount },
    { id: 'traffic', label: 'GRAFIK TRAFIK DATA', icon: Activity, color: 'text-cyan-400' },
    { id: 'mikrotik', label: 'CONFIG MIKROTIK', icon: Terminal, color: 'text-cyan-400' },
    { id: 'maps', label: 'PETA GPON (ODC/ODP)', icon: MapPin, color: 'text-emerald-400' },
    { id: 'speedtest', label: 'UJI SPEEDTEST Mbps', icon: Gauge, color: 'text-cyan-400', animate: true },
    { id: 'hosting_domain', label: 'HOSTING & DOMAIN CORP', icon: Globe, color: 'text-cyan-400' },
    { id: 'remote_ont', label: 'AKSES REMOTE ONT (MODEM)', icon: Laptop, color: 'text-cyan-400', animate: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 cyber-grid flex flex-col font-sans relative">
      {/* Background neon scanline */}
      <div className="cyber-scanline" />

      {/* Mobile Top Header (only visible on mobile) */}
      <header className="md:hidden border-b border-cyan-500/20 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="font-orbitron font-black text-xs tracking-widest text-cyan-400 uppercase">
            AISYAKA NOC
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 border border-cyan-500/30 text-cyan-400 rounded-sm hover:bg-cyan-950/50"
        >
          <Menu className="w-4 h-4" />
        </button>
      </header>

      {/* Unified Flex Container for Sidebar & Main Content */}
      <div className="flex flex-1 flex-col md:flex-row min-h-0 relative">
        
        {/* Left Sidebar Layout */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-cyan-500/20 bg-slate-950/95 md:bg-slate-950/80 backdrop-blur-md flex flex-col transition-transform duration-300 transform md:translate-x-0 md:sticky md:top-0 h-[calc(100vh-53px)] md:h-screen ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Logo & Header inside Sidebar */}
          <div className="hidden md:flex p-4 border-b border-cyan-500/10 flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-950 border border-cyan-500/50 rounded shadow-[0_0_10px_rgba(6,182,212,0.15)] shrink-0">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <div className="font-orbitron font-black text-sm tracking-widest text-cyan-400 neon-glow-cyan uppercase">
                  AISYAKA.NET
                </div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wide uppercase">
                  NOC MONITOR v2.0
                </div>
              </div>
            </div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-tight mt-1">
              Pusat Kontrol NOC Jaringan Wilayah
            </p>
          </div>

          {/* User Session Profile Card inside Sidebar */}
          <div className="p-3.5 border-b border-cyan-500/10 bg-slate-950/40 font-mono text-[11.5px] space-y-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">OPERATOR:</span>
              <strong className="text-cyan-400 uppercase">{username}</strong>
            </div>
            <div className="text-[10px] text-slate-600 uppercase">LEVEL: SUPER NOC ADMIN</div>
          </div>

          {/* Vertical Menu Links List */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
            <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
              // DAFTAR MENU NOC
            </div>
            
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 transition-all duration-150 flex items-center justify-between rounded font-mono text-[12px] group cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/50 text-cyan-300 font-bold border-l-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-cyan-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComponent className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'
                    } ${item.animate ? 'animate-pulse' : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-950 border border-red-500/30 text-red-400 rounded-full animate-pulse shrink-0">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer with Logout */}
          <div className="p-3.5 border-t border-cyan-500/10 shrink-0 bg-slate-950/90">
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-3 bg-red-950/40 hover:bg-red-950 border border-red-500/30 hover:border-red-500/80 text-red-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2.5 font-orbitron font-bold text-[11px] tracking-wider uppercase rounded-md"
            >
              <LogOut className="w-4 h-4" />
              KELUAR SESSION
            </button>
          </div>
        </aside>

        {/* Backdrop overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header row in main area (only on desktop for beautiful telemetry handshake status) */}
          <header className="hidden md:flex border-b border-cyan-500/10 bg-slate-950/40 p-4 justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                SYS INTEGRATION HANDSHAKE // STATUS: OPERATIONAL
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-500">
              TIME (WIB): <span className="text-cyan-400 font-bold">{new Date().toLocaleTimeString('id-ID')}</span>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto animate-fadeIn">
            {/* Core telemetry quick stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <NeonBox variant="cyan" className="p-3 cursor-pointer" onClick={() => setActiveTab('customers')}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-500 uppercase">Total Subs</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-orbitron font-black text-cyan-400 neon-glow-cyan">
                    {stats.totalSubscribers}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Node GPON</span>
                </div>
                <div className="text-[9px] font-mono text-slate-600 mt-1 uppercase">
                  {stats.onlineSubscribers} Online • {stats.offlineSubscribers} Offline
                </div>
              </NeonBox>

              <NeonBox variant="emerald" className="p-3 cursor-pointer" onClick={() => setActiveTab('devices')}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-500 uppercase">Aktif OLT/ONT</span>
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-orbitron font-black text-emerald-400 neon-glow-emerald">
                    {customers.filter(c => c.status === 'online').length}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Modem</span>
                </div>
                <div className="text-[9px] font-mono text-slate-600 mt-1 uppercase">
                  Rasio Sehat: {Math.round((stats.onlineSubscribers / stats.totalSubscribers) * 100)}% Total GPON
                </div>
              </NeonBox>

              <NeonBox variant={stats.activeAlertsCount > 0 ? 'red' : 'cyan'} className="p-3 animate-pulse cursor-pointer" onClick={() => setActiveTab('alerts')}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-500 uppercase">GPON Alerts</span>
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-orbitron font-black text-red-400 neon-glow-red`}>
                    {stats.activeAlertsCount}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Gangguan</span>
                </div>
                <div className="text-[9px] font-mono text-slate-600 mt-1 uppercase">
                  Butuh Penanganan NOC Teknisi
                </div>
              </NeonBox>

              <NeonBox variant="fuchsia" className="p-3 cursor-pointer" onClick={() => setActiveTab('traffic')}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-500 uppercase">ATTENUATION RX</span>
                  <Radio className="w-4 h-4 text-fuchsia-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-orbitron font-black text-fuchsia-400">
                    {stats.averageOpticalPower}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">dBm Avg</span>
                </div>
                <div className="text-[9px] font-mono text-slate-600 mt-1 uppercase">
                  Sinyal rata-rata pelanggan
                </div>
              </NeonBox>
            </div>

            {/* Tab display views selector */}
            <div className="space-y-4">
              {activeTab === 'customers' && (
                <PelangganMenu
                  customers={customers}
                  regions={regions}
                  onSelectCustomer={(c) => setSelectedInspectCustomer(c)}
                  onUpdateCustomer={handleUpdateCustomer}
                  onAddCustomer={handleAddCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}

              {activeTab === 'devices' && (
                <DevicesMenu
                  devices={devices}
                  regions={regions}
                  customers={customers}
                  onTriggerReboot={handleTriggerReboot}
                />
              )}

              {activeTab === 'alerts' && (
                <AlertsMenu
                  alerts={alerts}
                  regions={regions}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                  onResolveAlert={handleResolveAlert}
                />
              )}

              {activeTab === 'traffic' && (
                <RealTimeTraffic
                  customers={customers}
                  regions={regions}
                  initialTraffic={trafficData}
                />
              )}

              {activeTab === 'mikrotik' && (
                <MikroTikMenu
                  customers={customers}
                  regions={regions}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}

              {activeTab === 'maps' && (
                <GponMapsMenu
                  customers={customers}
                  regions={regions}
                />
              )}

              {activeTab === 'billing' && (
                <BillingMenu
                  customers={customers}
                  regions={regions}
                />
              )}

              {activeTab === 'speedtest' && (
                <SpeedtestMenu
                  customers={customers}
                  regions={regions}
                />
              )}

              {activeTab === 'technicians' && (
                <TeknisiMenu
                  customers={customers}
                  regions={regions}
                  onUpdateCustomers={onUpdateCustomersList}
                  onUpdateAlerts={() => {
                    onUpdateAlertsList(db.getAlerts());
                  }}
                />
              )}

              {activeTab === 'technician_app' && (
                <TechnicianApp
                  customers={customers}
                  onUpdateCustomers={onUpdateCustomersList}
                  onUpdateAlerts={() => {
                    onUpdateAlertsList(db.getAlerts());
                  }}
                  onBackToAdmin={() => setActiveTab('customers')}
                />
              )}

              {activeTab === 'hosting_domain' && (
                <HostingDomainMenu
                  customers={customers}
                  regions={regions}
                  onUpdateCustomers={onUpdateCustomersList}
                  onUpdateAlerts={() => {
                    onUpdateAlertsList(db.getAlerts());
                  }}
                />
              )}

              {activeTab === 'remote_ont' && (
                <OntRemoteMenu
                  customers={customers}
                  regions={regions}
                  onUpdateCustomers={onUpdateCustomersList}
                  preSelectedCustomerId={preSelectedCustomerId}
                  onClearPreSelectedId={() => setPreSelectedCustomerId('')}
                />
              )}
            </div>
          </main>

          {/* Footer copyright */}
          <footer className="border-t border-slate-900 bg-slate-950 p-4 mt-auto shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-slate-600 gap-2">
              <span>GPON ENGINE STATUS: ONLINE // SYSTEM HANDSHAKE OK</span>
              <span>AISYAKA.NET OPERATIONS DASHBOARD • TINGKAT NASIONAL © 2026</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Customer detailed diag modal overlay */}
      {selectedInspectCustomer && (
        <CustomerDetailModal
          customer={selectedInspectCustomer}
          onClose={() => setSelectedInspectCustomer(null)}
          onUpdate={handleUpdateCustomer}
          onOpenRemoteOnt={(cust) => {
            setSelectedInspectCustomer(null);
            setPreSelectedCustomerId(cust.id);
            setActiveTab('remote_ont');
          }}
        />
      )}
    </div>
  );
}
