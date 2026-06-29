/**
 * Types definition for Aisyaka.Net FTTH Network Monitoring Application
 */

export type Region = 
  | 'BEKASI wilayah Jatimakmur'
  | 'BEKASI wilayah Jatiasih'
  | 'BEKASI wilayah Dewi sartika'
  | 'CIKARANG Desa Cibarusah'
  | 'CIKARANG Desa Sukatani'
  | 'CIKARANG Desa Jatibaru';

export type ConnectionStatus = 'online' | 'offline' | 'gangguan';

export interface Customer {
  id: string;
  name: string;
  region: Region;
  address: string;
  packageSpeed: string; // e.g. "50 Mbps", "100 Mbps"
  status: ConnectionStatus;
  opticalPower: number; // in dBm, acceptable: -15 to -25, critical: < -27
  phone: string;
  ipAddress: string;
  onuSn: string;        // ONU Serial Number (e.g., ZTEGC1234567)
  ontModel: string;      // ONT model name (e.g., ZTE F670L, Huawei HG8245H)
  oltId: string;        // OLT ID link
  pppoeUsername?: string;
  pppoePassword?: string;
  vlanId?: number;
  pppServicePreset?: string;
  pppStatus?: 'connected' | 'disconnected' | 'authenticating';
  wifiSsid?: string;
  wifiPassword?: string;
}

export type DeviceType = 'OLT' | 'GPON Port' | 'ONU/ONT' | 'Router';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  ipAddress: string;
  status: 'active' | 'warning' | 'offline';
  temperature: number; // in Celsius
  uptime: string;
  gponPort?: string;   // if ONU
  rxPower: number;     // in dBm
  txPower: number;     // in dBm
  region: Region;
  associatedCustomerId?: string;
  associatedCustomerName?: string;
}

export interface NetworkAlert {
  id: string;
  customerId?: string;
  customerName?: string;
  region: Region;
  type: 'RED LOS' | 'High Attenuation' | 'Power Interruption' | 'ONT Offline' | 'High Packet Loss';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: string;
  resolved: boolean;
  ackBy?: string;
}

export interface TrafficPoint {
  time: string;
  download: number; // in Mbps
  upload: number;   // in Mbps
  latency: number;  // in ms
  loss: number;     // in %
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  region: Region;
  specialization: string; // e.g. "Splicing Fiber Optic", "Aktivasi ONT", "Penarikan Dropcore"
  status: 'idle' | 'visiting' | 'off';
}

export interface HomeVisit {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerRegion: Region;
  technicianId: string;
  technicianName: string;
  issueDescription: string;
  scheduledDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  resolutionNotes?: string;
  resolvedAt?: string;
}

