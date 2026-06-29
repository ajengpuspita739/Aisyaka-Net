import React, { useState } from 'react';
import { Customer, Region } from '../types';
import { 
  CreditCard, DollarSign, Receipt, Filter, Plus, Calendar, Search, 
  CheckCircle, AlertTriangle, Clock, RefreshCw, ChevronRight, X, 
  Printer, ArrowUpRight, TrendingUp, Sparkles, Building, Briefcase, 
  Users, Check, Wallet, Smartphone, Landmark, ShieldCheck, QrCode
} from 'lucide-react';
import NeonBox from './NeonBox';

interface BillingMenuProps {
  customers: Customer[];
  regions: Region[];
}

export interface Invoice {
  id: string; // INV-2026-XXXX
  customerId: string;
  customerName: string;
  region: Region;
  packageSpeed: string;
  billingMonth: string; // e.g., "Juni 2026"
  dueDate: string;      // e.g., "10 Juni 2026"
  basePrice: number;
  tax: number;          // 11% PPN
  adminFee: number;
  discount: number;
  total: number;
  status: 'Lunas' | 'Belum Lunas' | 'Jatuh Tempo';
  paidAt?: string;
  paymentMethod?: string;
  refNo?: string;
}

export default function BillingMenu({ customers, regions }: BillingMenuProps) {
  // 1. Initial State for Invoices matching our default FTTH customer database
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'INV-2026-0601',
      customerId: 'CUST-001',
      customerName: 'Budi Santoso',
      region: 'CIKARANG Desa Sukatani',
      packageSpeed: '100 Mbps',
      billingMonth: 'Juni 2026',
      dueDate: '10 Juni 2026',
      basePrice: 350000,
      tax: 38500,
      adminFee: 5000,
      discount: 0,
      total: 393500,
      status: 'Lunas',
      paidAt: '05 Juni 2026 14:22',
      paymentMethod: 'BCA Virtual Account',
      refNo: 'TX-9921029'
    },
    {
      id: 'INV-2026-0602',
      customerId: 'CUST-002',
      customerName: 'Siti Aminah',
      region: 'CIKARANG Desa Sukatani',
      packageSpeed: '50 Mbps',
      billingMonth: 'Juni 2026',
      dueDate: '10 Juni 2026',
      basePrice: 220000,
      tax: 24200,
      adminFee: 5000,
      discount: 25000, // special discount for connection issues
      total: 224200,
      status: 'Jatuh Tempo',
    },
    {
      id: 'INV-2026-0603',
      customerId: 'CUST-003',
      customerName: 'Aditya Pratama',
      region: 'BEKASI wilayah Jatimakmur',
      packageSpeed: '100 Mbps',
      billingMonth: 'Juni 2026',
      dueDate: '10 Juni 2026',
      basePrice: 350000,
      tax: 38500,
      adminFee: 5000,
      discount: 0,
      total: 393500,
      status: 'Lunas',
      paidAt: '08 Juni 2026 09:15',
      paymentMethod: 'QRIS Gopay',
      refNo: 'TX-8742910'
    },
    {
      id: 'INV-2026-0604',
      customerId: 'CUST-004',
      customerName: 'Dewi Lestari',
      region: 'BEKASI wilayah Jatimakmur',
      packageSpeed: '150 Mbps',
      billingMonth: 'Juni 2026',
      dueDate: '10 Juni 2026',
      basePrice: 480000,
      tax: 52800,
      adminFee: 5000,
      discount: 0,
      total: 537800,
      status: 'Belum Lunas',
    },
    {
      id: 'INV-2026-0605',
      customerId: 'CUST-005',
      customerName: 'Hendra Wijaya',
      region: 'BEKASI wilayah Jatiasih',
      packageSpeed: '50 Mbps',
      billingMonth: 'Juni 2026',
      dueDate: '10 Juni 2026',
      basePrice: 220000,
      tax: 24200,
      adminFee: 5000,
      discount: 0,
      total: 249200,
      status: 'Lunas',
      paidAt: '09 Juni 2026 11:40',
      paymentMethod: 'Mandiri Virtual Account',
      refNo: 'TX-4402913'
    },
    {
      id: 'INV-2026-0606',
      customerId: 'CUST-006',
      customerName: 'Rudi Hermawan',
      region: 'CIKARANG Desa Jatibaru',
      packageSpeed: '30 Mbps',
      billingMonth: 'Juni 2026',
      dueDate: '10 Juni 2026',
      basePrice: 165000,
      tax: 18150,
      adminFee: 5000,
      discount: 0,
      total: 188150,
      status: 'Belum Lunas',
    },
    {
      id: 'INV-2026-0607',
      customerId: 'CUST-007',
      customerName: 'Eka Sari',
      region: 'BEKASI wilayah Dewi sartika',
      packageSpeed: '50 Mbps',
      billingMonth: 'Juni 2026',
      dueDate: '10 Juni 2026',
      basePrice: 220000,
      tax: 24200,
      adminFee: 5000,
      discount: 0,
      total: 249200,
      status: 'Belum Lunas',
    },
    {
      id: 'INV-2026-0501',
      customerId: 'CUST-002',
      customerName: 'Siti Aminah',
      region: 'CIKARANG Desa Sukatani',
      packageSpeed: '50 Mbps',
      billingMonth: 'Mei 2026',
      dueDate: '10 Mei 2026',
      basePrice: 220000,
      tax: 24200,
      adminFee: 5000,
      discount: 0,
      total: 249200,
      status: 'Lunas',
      paidAt: '07 Mei 2026 16:05',
      paymentMethod: 'Indomaret Cash',
      refNo: 'TX-1029381'
    }
  ]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'Semua' | 'Lunas' | 'Belum Lunas' | 'Jatuh Tempo'>('Semua');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<'Semua' | Region>('Semua');
  
  // Selection & Details State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  
  // Create Bill Form State
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formMonth, setFormMonth] = useState('Juni 2026');
  const [formDueDate, setFormDueDate] = useState('10 Juni 2026');
  const [formDiscount, setFormDiscount] = useState(0);
  const [formAdminFee, setFormAdminFee] = useState(5000);
  const [formCustomNote, setFormCustomNote] = useState('');

  // Payment Gateway Simulator Modal State
  const [isPayingInvoiceId, setIsPayingInvoiceId] = useState<string | null>(null);
  const [paymentChannel, setPaymentChannel] = useState<'QRIS' | 'BCA_VA' | 'MANDIRI_VA' | 'RETAIL'>('QRIS');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Success Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Helpers to get Package Price mapping
  const getPackagePrice = (speed: string): number => {
    const s = speed || '';
    if (s.includes('100 Mbps Dedicated')) return 1500000;
    if (s.includes('200 Mbps Dedicated')) return 2800000;
    if (s.includes('300 Mbps Dedicated')) return 4000000;
    if (s.includes('500 Mbps Dedicated')) return 6500000;
    if (s.includes('1 Gbps Dedicated') || s.includes('1 Giga Dedicated') || s.includes('1Gbps')) return 12000000;
    if (s.includes('30 Mbps')) return 165000;
    if (s.includes('50 Mbps')) return 220000;
    if (s.includes('100 Mbps')) return 350000;
    if (s.includes('150 Mbps')) return 480000;
    if (s.includes('200 Mbps')) return 590000;
    return 150000; // default basic
  };

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'Semua' || inv.status === selectedStatus;
    const matchesRegion = selectedRegionFilter === 'Semua' || inv.region === selectedRegionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Financial Stats Counters
  const totalRevenueThisMonth = invoices
    .filter(inv => inv.status === 'Lunas')
    .reduce((acc, curr) => acc + curr.total, 0);

  const pendingBillingAmount = invoices
    .filter(inv => inv.status === 'Belum Lunas')
    .reduce((acc, curr) => acc + curr.total, 0);

  const overdueBillingAmount = invoices
    .filter(inv => inv.status === 'Jatuh Tempo')
    .reduce((acc, curr) => acc + curr.total, 0);

  const collectionRatePercentage = Math.round(
    (totalRevenueThisMonth / (totalRevenueThisMonth + pendingBillingAmount + overdueBillingAmount)) * 100
  ) || 0;

  // Selected Invoice Details
  const activeInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  // Form submit: Generate invoice
  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCust = customers.find(c => c.id === formCustomerId);
    if (!targetCust) return;

    const basePrice = getPackagePrice(targetCust.packageSpeed);
    const tax = Math.round(basePrice * 0.11); // 11% VAT
    const discountAmt = Number(formDiscount);
    const adminAmt = Number(formAdminFee);
    const totalVal = basePrice + tax + adminAmt - discountAmt;

    const newInv: Invoice = {
      id: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: targetCust.id,
      customerName: targetCust.name,
      region: targetCust.region,
      packageSpeed: targetCust.packageSpeed,
      billingMonth: formMonth,
      dueDate: formDueDate,
      basePrice,
      tax,
      adminFee: adminAmt,
      discount: discountAmt,
      total: totalVal,
      status: 'Belum Lunas'
    };

    setInvoices(prev => [newInv, ...prev]);
    setIsCreatingBill(false);
    setNotification(`SUKSES: Invoice [ ${newInv.id} ] berhasil dicetak untuk ${newInv.customerName}!`);
    setSelectedInvoiceId(newInv.id); // View details
    setTimeout(() => setNotification(null), 4000);
  };

  // Simulated Payment Trigger
  const handleProcessPaymentSim = () => {
    if (!isPayingInvoiceId) return;
    setIsProcessingPayment(true);
    
    // Simulate API authorization handshake
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      
      // Update local invoices state to 'Lunas'
      setInvoices(prev => prev.map(inv => {
        if (inv.id === isPayingInvoiceId) {
          const channelNames = {
            'QRIS': 'QRIS Gopay/OVO Auto',
            'BCA_VA': 'BCA Virtual Account',
            'MANDIRI_VA': 'Mandiri Virtual Account',
            'RETAIL': 'Alfamart Retail Cash'
          };
          return {
            ...inv,
            status: 'Lunas',
            paidAt: new Date().toLocaleString('id-ID', { hour12: false }) + ' WIB',
            paymentMethod: channelNames[paymentChannel],
            refNo: `TX-${Math.floor(1000000 + Math.random() * 9000000)}`
          };
        }
        return inv;
      }));

      // Close after some delay
      setTimeout(() => {
        setPaymentSuccess(false);
        setIsPayingInvoiceId(null);
        setNotification('PEMBAYARAN DITERIMA: Transaksi tervalidasi sukses oleh modul core billing.');
        setTimeout(() => setNotification(null), 4000);
      }, 1500);

    }, 2000);
  };

  // Helper currency formatter
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Control */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-slate-950 p-4 border border-slate-900 rounded gap-4">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-fuchsia-400" />
          <div>
            <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider">
              BILLING PEMBAYARAN PELANGGAN FTTH
            </h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
              Administrasi tagihan bulanan, pencetakan invoice, dan integrasi kasir digital
            </p>
          </div>
        </div>

        {/* Generate Invoice Quick Trigger Button */}
        <button
          onClick={() => {
            setIsCreatingBill(true);
            if (customers.length > 0) setFormCustomerId(customers[0].id);
          }}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-orbitron text-[10px] font-bold uppercase tracking-wider px-4 py-2 flex items-center justify-center gap-2 rounded transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(217,70,239,0.2)] hover:shadow-[0_0_15px_rgba(217,70,239,0.4)]"
        >
          <Plus className="w-4 h-4" />
          CETAK TAGIHAN BARU
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-fuchsia-950/70 border border-fuchsia-500 text-fuchsia-300 font-mono text-xs uppercase rounded animate-fadeIn shadow-[0_0_10px_rgba(217,70,239,0.15)] flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {notification}
        </div>
      )}

      {/* Financial Overview Bento Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <NeonBox variant="emerald" className="p-4 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            PENDAPATAN TERIMA (LUNAS)
          </span>
          <span className="block text-xl font-orbitron font-black text-emerald-400 mt-2">
            {formatRupiah(totalRevenueThisMonth)}
          </span>
          <span className="block text-[9px] font-mono text-slate-400 mt-1 uppercase">
            Dari {invoices.filter(i => i.status === 'Lunas').length} transaksi terbayar
          </span>
        </NeonBox>

        <NeonBox variant="cyan" className="p-4 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15">
            <Clock className="w-12 h-12 text-cyan-400" />
          </div>
          <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            BELUM LUNAS (OUTSTANDING)
          </span>
          <span className="block text-xl font-orbitron font-black text-cyan-400 mt-2">
            {formatRupiah(pendingBillingAmount)}
          </span>
          <span className="block text-[9px] font-mono text-slate-400 mt-1 uppercase">
            {invoices.filter(i => i.status === 'Belum Lunas').length} pelanggan aktif belum bayar
          </span>
        </NeonBox>

        <NeonBox variant="amber" className="p-4 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15">
            <AlertTriangle className="w-12 h-12 text-amber-400" />
          </div>
          <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            OVERDUE (JATUH TEMPO)
          </span>
          <span className="block text-xl font-orbitron font-black text-amber-500 mt-2">
            {formatRupiah(overdueBillingAmount)}
          </span>
          <span className="block text-[9px] font-mono text-slate-400 mt-1 uppercase text-amber-400">
            {invoices.filter(i => i.status === 'Jatuh Tempo').length} pelanggan terancam isolir pppoe
          </span>
        </NeonBox>

        <NeonBox variant="fuchsia" className="p-4 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15">
            <TrendingUp className="w-12 h-12 text-fuchsia-400" />
          </div>
          <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            COLLECTION RATE NET
          </span>
          <span className="block text-xl font-orbitron font-black text-fuchsia-400 mt-2">
            {collectionRatePercentage}%
          </span>
          {/* Collection indicator bar */}
          <div className="w-full bg-slate-900 h-1 mt-2.5 rounded overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded" 
              style={{ width: `${collectionRatePercentage}%` }}
            />
          </div>
        </NeonBox>
      </div>

      {/* Main Content Layout splits to List & Details Side Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Filter and Invoices Collection */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded p-4">
            
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              
              {/* Search text input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari Nama Pelanggan atau ID Invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded pl-10 pr-4 py-2 font-mono text-xs focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              {/* Filter selections */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 border border-slate-800 rounded px-2.5 py-1 bg-slate-900/40 text-[10px] font-mono text-slate-400 uppercase select-none">
                  <Filter className="w-3.5 h-3.5 text-fuchsia-400" />
                  Status:
                </div>
                {['Semua', 'Lunas', 'Belum Lunas', 'Jatuh Tempo'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st as any)}
                    className={`px-3 py-1 text-[10px] font-mono rounded cursor-pointer border transition-all ${
                      selectedStatus === st
                        ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Region quick filter bar */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-900/60">
              <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center pr-1 select-none">Area Kerja:</span>
              <button
                onClick={() => setSelectedRegionFilter('Semua')}
                className={`px-2 py-0.5 text-[9px] font-mono rounded border cursor-pointer ${
                  selectedRegionFilter === 'Semua'
                    ? 'bg-slate-900 text-cyan-400 border-cyan-500/55'
                    : 'bg-slate-950 border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                SEMUA
              </button>
              {regions.map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegionFilter(reg)}
                  className={`px-2 py-0.5 text-[9px] font-mono rounded border cursor-pointer uppercase ${
                    selectedRegionFilter === reg
                      ? 'bg-slate-900 text-cyan-400 border-cyan-500/55'
                      : 'bg-slate-950 border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {reg.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Invoices List Grid */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-[9px] uppercase tracking-wider bg-slate-900/10">
                    <th className="py-2.5 px-3">No. Invoice</th>
                    <th className="py-2.5 px-2">Nama Pelanggan</th>
                    <th className="py-2.5 px-2">Wilayah</th>
                    <th className="py-2.5 px-2">Layanan</th>
                    <th className="py-2.5 px-2">Jatuh Tempo</th>
                    <th className="py-2.5 px-2 text-right">Total Tagihan</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 uppercase">
                        -- Tidak ada riwayat invoice ditemukan yang cocok dengan kriteria filter --
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr 
                        key={inv.id}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className={`hover:bg-slate-900/30 cursor-pointer transition-colors ${
                          selectedInvoiceId === inv.id ? 'bg-fuchsia-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-slate-300 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          {inv.id}
                        </td>
                        <td className="py-3 px-2 font-medium text-slate-200">
                          {inv.customerName}
                        </td>
                        <td className="py-3 px-2 text-slate-400 uppercase text-[10px]">
                          {inv.region}
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {inv.packageSpeed}
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {inv.dueDate}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-100 font-bold">
                          {formatRupiah(inv.total)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                            inv.status === 'Lunas'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                              : inv.status === 'Jatuh Tempo'
                              ? 'bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Total count HUD */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-900 text-[10px] text-slate-500">
              <span>MENAMPILKAN {filteredInvoices.length} DARI {invoices.length} TOTAL INVOICE</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-600">Aisyaka.Net Billing Core v4.1</span>
            </div>
          </div>

          {/* Mini Revenue SVG Chart Panel */}
          <div className="bg-slate-950 border border-slate-900 p-4 rounded space-y-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[10px] font-orbitron font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                GRAFIK REVENUE ALIRAN KAS (6 BULAN TERAKHIR)
              </span>
              <span className="text-[8px] font-mono text-slate-500">Mata Uang: IDR Rupiah (Simulasi)</span>
            </div>

            {/* SVG bar representation chart */}
            <div className="h-28 flex items-end justify-between px-6 pt-4 relative">
              
              {/* Horizontal grid lines */}
              <div className="absolute inset-x-0 bottom-4 border-b border-slate-900" />
              <div className="absolute inset-x-0 bottom-12 border-b border-slate-900" />
              <div className="absolute inset-x-0 bottom-20 border-b border-slate-900" />

              {/* Data: Jan (1.2m), Feb (1.4m), Mar (1.9m), Apr (2.1m), Mei (2.4m), Jun (Active total) */}
              {[
                { m: 'JAN', v: 1250000 },
                { m: 'FEB', v: 1480000 },
                { m: 'MAR', v: 1950000 },
                { m: 'APR', v: 2150000 },
                { m: 'MEI', v: 2490000 },
                { m: 'JUN (LUNAS)', v: totalRevenueThisMonth, active: true },
              ].map((pt, idx) => {
                const maxChartValue = 3000000;
                const percentageHeight = Math.min(100, Math.round((pt.v / maxChartValue) * 80));
                
                return (
                  <div key={pt.m} className="flex flex-col items-center flex-1 group z-10">
                    <span className="text-[7.5px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-black/80 px-1 py-0.5 rounded text-cyan-400 font-bold">
                      {formatRupiah(pt.v)}
                    </span>
                    <div 
                      className={`w-10 sm:w-12 transition-all duration-500 rounded-t border-t border-x ${
                        pt.active 
                          ? 'bg-gradient-to-t from-fuchsia-950/80 to-fuchsia-500 border-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.25)]' 
                          : 'bg-gradient-to-t from-slate-900/60 to-slate-800 border-slate-700'
                      }`}
                      style={{ height: `${percentageHeight}px` }}
                    />
                    <span className={`text-[8.5px] font-mono mt-1.5 font-bold ${pt.active ? 'text-fuchsia-400' : 'text-slate-500'}`}>
                      {pt.m}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side Panel: Detail Invoice (Slip Kasir) or Forms */}
        <div className="space-y-4">
          
          {/* A. Create Custom Bill Mode */}
          {isCreatingBill && (
            <NeonBox variant="fuchsia">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-fuchsia-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-fuchsia-400" />
                  + CETAK INVOICE BARU
                </span>
                <button
                  onClick={() => setIsCreatingBill(false)}
                  className="p-1 border border-slate-850 hover:border-red-500 text-slate-500 hover:text-white rounded cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleGenerateInvoice} className="space-y-4 font-mono text-[11px] text-slate-300">
                
                {/* 1. Select existing customer */}
                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1">Pilih Pelanggan FTTH</label>
                  <select
                    required
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 focus:outline-none focus:border-fuchsia-500 text-slate-100 cursor-pointer"
                  >
                    <option value="">-- PILIH LANGGANAN --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id} - {c.packageSpeed})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info preview from customer speed */}
                {formCustomerId && (
                  <div className="bg-slate-950 p-2.5 border border-slate-900 rounded space-y-1.5">
                    <span className="text-[8px] text-slate-550 block uppercase">// ESTIMASI TARIF DASAR LAYANAN:</span>
                    {(() => {
                      const cust = customers.find(c => c.id === formCustomerId);
                      if (!cust) return null;
                      const basePrice = getPackagePrice(cust.packageSpeed);
                      return (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400">Paket {cust.packageSpeed}</span>
                          <span className="text-cyan-400 font-bold">{formatRupiah(basePrice)}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Month Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1">Periode Bulan</label>
                    <select
                      value={formMonth}
                      onChange={(e) => setFormMonth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:border-fuchsia-500 text-slate-100 cursor-pointer"
                    >
                      <option value="Juni 2026">Juni 2026</option>
                      <option value="Juli 2026">Juli 2026</option>
                      <option value="Agustus 2026">Agustus 2026</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1">Batas Jatuh Tempo</label>
                    <input
                      type="text"
                      required
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-fuchsia-500 text-slate-100"
                    />
                  </div>
                </div>

                {/* Additional charges & discount fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1">Biaya Admin (Rp)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={formAdminFee}
                      onChange={(e) => setFormAdminFee(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-fuchsia-500 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1">Diskon Khusus (Rp)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-fuchsia-500 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1">Catatan Keterangan Tambahan</label>
                  <textarea
                    placeholder="e.g. Kompensasi diskon gangguan red-los 3 hari."
                    value={formCustomNote}
                    onChange={(e) => setFormCustomNote(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white font-bold uppercase tracking-widest text-[10px] rounded cursor-pointer transition-all duration-300"
                  >
                    TERBITKAN INVOICE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingBill(false)}
                    className="px-3 py-2 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
                  >
                    BATAL
                  </button>
                </div>
              </form>
            </NeonBox>
          )}

          {/* B. Show Payment Simulator Gateway Box */}
          {isPayingInvoiceId && (
            <NeonBox variant="cyan" className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  <QrCode className="w-4 h-4" />
                  SIMULATOR PAYMENT GATEWAY
                </span>
                <button
                  onClick={() => setIsPayingInvoiceId(null)}
                  className="p-1 border border-slate-850 hover:border-red-500 text-slate-500 hover:text-white rounded cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {(() => {
                const payInv = invoices.find(i => i.id === isPayingInvoiceId);
                if (!payInv) return null;

                return (
                  <div className="font-mono text-[11px] text-slate-300 space-y-4">
                    
                    {/* Payment slip meta info */}
                    <div className="p-2.5 bg-slate-950 border border-slate-900 rounded space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">MEMBER:</span>
                        <span className="text-slate-200 font-bold">{payInv.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">INVOICE ID:</span>
                        <span className="text-cyan-400 font-bold">{payInv.id}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-900 pt-1 mt-1 text-xs">
                        <span className="text-slate-400">TOTAL TAGIHAN:</span>
                        <strong className="text-fuchsia-400">{formatRupiah(payInv.total)}</strong>
                      </div>
                    </div>

                    {/* Choose simulated channel */}
                    <div>
                      <span className="block text-[8.5px] text-slate-500 uppercase mb-1.5">// PILIH SALURAN PEMBAYARAN:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'QRIS', label: 'QRIS (GOPAY/OVO)', icon: Smartphone },
                          { id: 'BCA_VA', label: 'BCA VIRTUAL A/C', icon: Landmark },
                          { id: 'MANDIRI_VA', label: 'MANDIRI VIRTUAL', icon: Landmark },
                          { id: 'RETAIL', label: 'ALFAMART / RETR', icon: Building },
                        ].map((ch) => {
                          const IconComp = ch.icon;
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => setPaymentChannel(ch.id as any)}
                              className={`p-2.5 rounded border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                                paymentChannel === ch.id
                                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                                  : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              <IconComp className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="text-[9px] uppercase leading-none font-bold">{ch.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Simulated details output (e.g. show QR Code mockup or Bank VA number) */}
                    <div className="p-3 bg-black/60 rounded border border-slate-900 flex flex-col items-center text-center justify-center min-h-[140px]">
                      {paymentChannel === 'QRIS' && (
                        <>
                          <div className="w-24 h-24 bg-white p-1 rounded mb-2 flex items-center justify-center relative">
                            {/* Standard pixel-art visualizer representation for a mockup QRIS */}
                            <div className="w-full h-full bg-slate-950/5 border border-slate-300 flex items-center justify-center p-1.5">
                              <div className="grid grid-cols-4 gap-0.5 w-full h-full">
                                {[...Array(16)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-full h-full ${
                                      (i + idxOffsetForMock(i)) % 3 === 0 || i === 0 || i === 3 || i === 12 || i === 15
                                        ? 'bg-slate-900' 
                                        : 'bg-white'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="absolute inset-0 m-auto w-5 h-5 bg-white border border-slate-300 flex items-center justify-center text-[7px] text-red-500 font-extrabold uppercase">
                              QRIS
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">PINDAI DENGAN GOPAY, OVO, DANA ATAU BANKING</span>
                        </>
                      )}

                      {paymentChannel === 'BCA_VA' && (
                        <div className="space-y-1">
                          <span className="text-[8px] text-slate-500 uppercase">NOMOR VIRTUAL ACCOUNT BCA:</span>
                          <div className="text-md font-bold tracking-widest text-cyan-400 font-orbitron">882930 + 08123456</div>
                          <p className="text-[8px] text-slate-400 mt-1 max-w-[200px]">Transfer nominal pas Rp {payInv.total.toLocaleString()} ke rekening VA di atas.</p>
                        </div>
                      )}

                      {paymentChannel === 'MANDIRI_VA' && (
                        <div className="space-y-1">
                          <span className="text-[8px] text-slate-500 uppercase">NOMOR VIRTUAL ACCOUNT MANDIRI:</span>
                          <div className="text-md font-bold tracking-widest text-cyan-400 font-orbitron">89001 + 08123456</div>
                          <p className="text-[8px] text-slate-400 mt-1 max-w-[200px]">Masukkan kode tagihan Mandiri di atas via Livin atau ATM.</p>
                        </div>
                      )}

                      {paymentChannel === 'RETAIL' && (
                        <div className="space-y-1">
                          <span className="text-[8px] text-slate-500 uppercase">KODE PEMBAYARAN KASIR ALFAMART:</span>
                          <div className="text-md font-bold tracking-widest text-cyan-400 font-orbitron">AISYAKANET + {payInv.id.replace('INV-', '')}</div>
                          <p className="text-[8px] text-slate-400 mt-1 max-w-[200px]">Beritahu kasir Alfamart untuk melakukan pembayaran internet Aisyaka.Net.</p>
                        </div>
                      )}
                    </div>

                    {/* Simulation trigger buttons */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={handleProcessPaymentSim}
                        disabled={isProcessingPayment || paymentSuccess}
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold uppercase transition-all tracking-wider text-[10px] rounded cursor-pointer disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                      >
                        {isProcessingPayment ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            MENUNGGU OTORISASI GATEWAY...
                          </>
                        ) : paymentSuccess ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                            TRANSAKSI TERBAYAR SUKSES!
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            SIMULASI BAYAR TAGIHAN SEKARANG
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPayingInvoiceId(null)}
                        disabled={isProcessingPayment}
                        className="w-full py-1.5 border border-slate-900 hover:border-slate-800 text-slate-500 hover:text-slate-300 transition-all rounded text-[9px] uppercase cursor-pointer text-center"
                      >
                        Batal Pembayaran
                      </button>
                    </div>

                  </div>
                );
              })()}
            </NeonBox>
          )}

          {/* C. Default Right Display: Selected Invoice Details (Professional Cashier Print Look) */}
          {activeInvoice && !isCreatingBill && !isPayingInvoiceId && (
            <NeonBox variant={activeInvoice.status === 'Lunas' ? 'emerald' : activeInvoice.status === 'Jatuh Tempo' ? 'amber' : 'cyan'} className="p-4 relative">
              
              {/* Header metadata */}
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3.5 select-none">
                <span className="text-[10px] font-orbitron font-extrabold tracking-widest text-slate-400 uppercase">
                  SLIP INVOICE DIGITAL
                </span>
                <button
                  onClick={() => setSelectedInvoiceId(null)}
                  className="p-1 border border-slate-850 hover:border-slate-700 text-slate-500 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Casher Slip Receipt styling with paper feel layout */}
              <div className="bg-slate-950 p-4 border border-slate-900 rounded font-mono text-[10.5px] text-slate-300 space-y-4">
                
                {/* Header Logo */}
                <div className="text-center border-b border-dashed border-slate-800 pb-3">
                  <h4 className="font-orbitron font-extrabold text-sm text-cyan-400 tracking-widest">AISYAKA.NET</h4>
                  <p className="text-[8px] text-slate-500 uppercase mt-0.5">High Speed Fiber Optic FTTH</p>
                  <p className="text-[8px] text-slate-500 uppercase">Telp: 021-990-2311</p>
                </div>

                {/* Meta details */}
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-550">NOMOR INVOICE:</span>
                    <strong className="text-slate-200">{activeInvoice.id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-550">NAMA SUBSCRIBER:</span>
                    <span className="text-slate-300 font-bold">{activeInvoice.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-550">WILAYAH (NODE):</span>
                    <span className="text-slate-300 uppercase">{activeInvoice.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-550">PERIODE TAGIHAN:</span>
                    <span className="text-cyan-400 font-bold">{activeInvoice.billingMonth.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-550">JATUH TEMPO:</span>
                    <span className="text-amber-400 font-bold">{activeInvoice.dueDate}</span>
                  </div>
                </div>

                {/* Line items pricing breakdown */}
                <div className="border-t border-dashed border-slate-800 pt-3 space-y-2">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-wider">// PENJABARAN RINCIAN:</span>
                  
                  <div className="flex justify-between">
                    <span>Paket Internet FTTH ({activeInvoice.packageSpeed})</span>
                    <span>{formatRupiah(activeInvoice.basePrice)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>PPN Terhitung (11% VAT)</span>
                    <span>{formatRupiah(activeInvoice.tax)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Biaya Layanan Admin</span>
                    <span>{formatRupiah(activeInvoice.adminFee)}</span>
                  </div>

                  {activeInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Diskon Kompensasi</span>
                      <span>-{formatRupiah(activeInvoice.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-900 pt-2 text-xs font-black">
                    <span className="text-slate-200">TOTAL PEMBAYARAN:</span>
                    <strong className="text-fuchsia-400 font-orbitron">{formatRupiah(activeInvoice.total)}</strong>
                  </div>
                </div>

                {/* Validation stamp if paid */}
                <div className="border-t border-dashed border-slate-800 pt-3 text-center">
                  {activeInvoice.status === 'Lunas' ? (
                    <div className="p-2 bg-emerald-950/30 border border-emerald-500/50 rounded-lg inline-block w-full">
                      <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                        TRANSAKSI TERBAYAR LUNAS
                      </div>
                      <div className="text-[8px] text-slate-400 mt-1 uppercase">
                        Metode: {activeInvoice.paymentMethod}
                      </div>
                      <div className="text-[8px] text-slate-500 font-mono">
                        Ref: {activeInvoice.refNo} | Tanggal: {activeInvoice.paidAt}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/40 rounded-lg inline-block w-full">
                      <span className="text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider block">
                        MENUNGGU PROSES VALIDASI
                      </span>
                      <p className="text-[8.5px] text-slate-500 mt-0.5">Silakan lakukan pembayaran sebelum jatuh tempo isolir.</p>
                    </div>
                  )}
                </div>

                {/* Mock barcode strip */}
                <div className="flex flex-col items-center justify-center pt-2 select-none">
                  <div className="h-6 w-full max-w-[140px] flex gap-[1px]">
                    {[...Array(40)].map((_, i) => (
                      <div 
                        key={i} 
                        className="h-full bg-slate-800" 
                        style={{ width: `${(i % 3 === 0 || i % 7 === 0) ? '2.5px' : '1px'}` }} 
                      />
                    ))}
                  </div>
                  <span className="text-[7.5px] text-slate-600 mt-1 uppercase font-mono">AISYAKA-{activeInvoice.id}</span>
                </div>
              </div>

              {/* Action buttons on selection */}
              <div className="mt-4 flex gap-2">
                {activeInvoice.status !== 'Lunas' && (
                  <button
                    onClick={() => setIsPayingInvoiceId(activeInvoice.id)}
                    className="flex-1 py-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white text-[10px] font-bold font-orbitron uppercase tracking-wider rounded cursor-pointer transition-all duration-300 shadow-[0_0_8px_rgba(217,70,239,0.2)] inline-flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    PROSES BAYAR (KASIR)
                  </button>
                )}

                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3.5 py-2 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-[10px] font-bold font-orbitron uppercase tracking-wider">PRINT</span>
                </button>
              </div>

            </NeonBox>
          )}

          {/* D. Welcome Box if no invoice is currently selected */}
          {!activeInvoice && !isCreatingBill && !isPayingInvoiceId && (
            <NeonBox variant="fuchsia" className="p-4 text-center space-y-4">
              <div className="w-12 h-12 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_12px_rgba(217,70,239,0.1)]">
                <Receipt className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
                <strong className="text-slate-200 block text-xs uppercase font-orbitron font-extrabold tracking-wider">
                  SISTEM ADMINISTRASI BILLING
                </strong>
                <p className="leading-relaxed">
                  Pilih salah satu baris rincian invoice pelanggan FTTH di samping untuk memunculkan panel kontrol pembayaran, struk kasir lunas, atau cetak bukti fisik transaksi.
                </p>
              </div>

              <div className="border-t border-white/5 pt-4 font-mono text-[10px] text-slate-550 space-y-2 text-left">
                <span className="block text-[8px] font-extrabold uppercase text-fuchsia-400">// ANALISA SALURAN UTAMA:</span>
                <div className="flex justify-between">
                  <span>1. Virtual Account BCA</span>
                  <span className="text-slate-300 font-bold">45% Volume</span>
                </div>
                <div className="flex justify-between">
                  <span>2. QRIS (Gopay/OVO/Dana)</span>
                  <span className="text-slate-300 font-bold">35% Volume</span>
                </div>
                <div className="flex justify-between">
                  <span>3. Indomaret/Alfamart Retail</span>
                  <span className="text-slate-300 font-bold">20% Volume</span>
                </div>
              </div>
            </NeonBox>
          )}

        </div>

      </div>

    </div>
  );
}

// Inline helper mock offset generator for mock QR codes
function idxOffsetForMock(idx: number): number {
  if (idx < 4) return 2;
  if (idx < 8) return 5;
  if (idx < 12) return 1;
  return 7;
}
