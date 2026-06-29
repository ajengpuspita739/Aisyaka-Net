import { Customer, Device, NetworkAlert, TrafficPoint, Region } from './types';

export const REGIONS: Region[] = [
  'BEKASI wilayah Jatimakmur',
  'BEKASI wilayah Jatiasih',
  'BEKASI wilayah Dewi sartika',
  'CIKARANG Desa Cibarusah',
  'CIKARANG Desa Sukatani',
  'CIKARANG Desa Jatibaru'
];

// Indonesian mock names for FTTH subscribers
const firstNames = ['Andi', 'Budi', 'Candra', 'Dewi', 'Eko', 'Feri', 'Gita', 'Hendra', 'Iwan', 'Joko', 'Kartika', 'Lanny', 'Muhamad', 'Novi', 'Oki', 'Pratama', 'Rian', 'Siti', 'Taufik', 'Utami', 'Wawan', 'Yayan', 'Zainal', 'Agus', 'Bambang', 'Dedi', 'Edi', 'Hadi', 'Irfan', 'Mulyadi', 'Rudi', 'Slamet', 'Suryono', 'Yusuf', 'Ani', 'Diana', 'Eka', 'Fitri', 'Indah', 'Lestari', 'Maria', 'Ningsih', 'Ratna', 'Sri', 'Wahyu', 'Yanti'];
const lastNames = ['Pratama', 'Santoso', 'Wijaya', 'Hidayat', 'Putra', 'Putri', 'Sari', 'Kusuma', 'Subagyo', 'Gunawan', 'Setiawan', 'Budiman', 'Nugroho', 'Wibowo', 'Prasetyo', 'Hartono', 'Siregar', 'Lubis', 'Tarigan', 'Sitorus', 'Harahap', 'Ginting', 'Sembiring', 'Nasution', 'Pane', 'Batubara', 'Pohan', 'Lumbantoruan', 'Marbun', 'Simanjuntak', 'Siahaan', 'Manurung', 'Sinaga', 'Panjaitan', 'Nainggolan', 'Sidabutar', 'Situmorang', 'Tampubolon', 'Silalahi', 'Gultom', 'Samosir', 'Hutapea', 'Hutagalung', 'Hutabarat', 'Hutasoit', 'Hutajulu'];
const streets = ['Jl. Sudirman', 'Jl. Gatot Subroto', 'Jl. Rasuna Said', 'Jl. Thamrin', 'Jl. Pajajaran', 'Jl. Dago', 'Jl. Dipati Ukur', 'Jl. Margonda', 'Jl. Ir. H. Juanda', 'Jl. Merdeka', 'Jl. Pemuda', 'Jl. Pahlawan', 'Jl. Ahmad Yani', 'Jl. Kartini', 'Jl. Gajah Mada', 'Jl. Hayam Wuruk', 'Jl. Kebon Jeruk', 'Jl. Kemang Raya', 'Jl. Fatmawati', 'Jl. Casablanca', 'Jl. Panglima Polim', 'Jl. Radio Dalam', 'Jl. Gandaria', 'Jl. Kebayoran Lama', 'Jl. Palmerah', 'Jl. Slipi', 'Jl. Tomang Raya', 'Jl. Grogol', 'Jl. Pluit', 'Jl. Kelapa Gading', 'Jl. Sunter', 'Jl. Rawamangun', 'Jl. Jatinegara', 'Jl. Tebet Raya', 'Jl. Pancoran', 'Jl. Cilandak', 'Jl. Pasar Minggu', 'Jl. Ragunan', 'Jl. Jagakarsa', 'Jl. Lenteng Agung'];
const districts: Record<Region, string[]> = {
  'BEKASI wilayah Jatimakmur': ['Jatimakmur', 'Pondok Gede', 'Jatibening', 'Jaticempaka', 'Jatiwaringin'],
  'BEKASI wilayah Jatiasih': ['Jatiasih', 'Jatimekar', 'Jatikramat', 'Jatirasa', 'Jatisari'],
  'BEKASI wilayah Dewi sartika': ['Dewi Sartika', 'Bekasi Timur', 'Margahayu', 'Aren Jaya', 'Duren Jaya'],
  'CIKARANG Desa Cibarusah': ['Cibarusah Kota', 'Cibarusah Jaya', 'Sirnajaya', 'Ridogalih', 'Wanasari'],
  'CIKARANG Desa Sukatani': ['Sukatani', 'Sukamanah', 'Sukamulya', 'Sukarukun', 'Sujakarya'],
  'CIKARANG Desa Jatibaru': ['Jatibaru', 'Cikarang Timur', 'Jatireja', 'Sertajaya', 'Tanjungsari']
};

const packages = [
  '30 Mbps', '50 Mbps', '100 Mbps', '150 Mbps', '200 Mbps',
  '100 Mbps Dedicated', '200 Mbps Dedicated', '300 Mbps Dedicated', '500 Mbps Dedicated', '1 Gbps Dedicated'
];
const ontModels = ['ZTE F670L Dual Band', 'Huawei HG8245H5', 'ZTE F609 V5.2', 'Huawei EG8145V5', 'Huawei HG8546M'];
const olts: Record<Region, string> = {
  'BEKASI wilayah Jatimakmur': 'OLT-BKS-01',
  'BEKASI wilayah Jatiasih': 'OLT-BKS-02',
  'BEKASI wilayah Dewi sartika': 'OLT-BKS-03',
  'CIKARANG Desa Cibarusah': 'OLT-CKR-01',
  'CIKARANG Desa Sukatani': 'OLT-CKR-02',
  'CIKARANG Desa Jatibaru': 'OLT-CKR-03',
};

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Budi Santoso',
    region: 'CIKARANG Desa Sukatani',
    address: 'Jl. Gatot Subroto No. 45, Sukatani',
    packageSpeed: '100 Mbps',
    status: 'online',
    opticalPower: -18.4,
    phone: '0812-3456-7890',
    ipAddress: '10.120.45.12',
    onuSn: 'ZTEGC9A29F12',
    ontModel: 'ZTE F670L Dual Band',
    oltId: 'OLT-CKR-02'
  },
  {
    id: 'CUST-002',
    name: 'Siti Aminah',
    region: 'CIKARANG Desa Sukatani',
    address: 'Komp. Sukarukun Mas Blok B-7, Sukarukun',
    packageSpeed: '50 Mbps',
    status: 'gangguan',
    opticalPower: -29.8, // Bad signal! Threshold -27dBm
    phone: '0813-8822-1144',
    ipAddress: '10.120.45.89',
    onuSn: 'HWTC4B889FF1',
    ontModel: 'Huawei HG8245H5',
    oltId: 'OLT-CKR-02'
  },
  {
    id: 'CUST-003',
    name: 'Aditya Pratama',
    region: 'BEKASI wilayah Jatimakmur',
    address: 'Jl. Jatimakmur No. 12, Pondok Gede',
    packageSpeed: '100 Mbps',
    status: 'online',
    opticalPower: -21.1,
    phone: '0856-1122-3344',
    ipAddress: '10.110.12.54',
    onuSn: 'ZTEGC9B10AC3',
    ontModel: 'ZTE F670L Dual Band',
    oltId: 'OLT-BKS-01'
  },
  {
    id: 'CUST-004',
    name: 'Dewi Lestari',
    region: 'BEKASI wilayah Jatimakmur',
    address: 'Perumahan Jatibening Estate No. 4, Jatibening',
    packageSpeed: '150 Mbps',
    status: 'offline', // OLT LOS, or OLT power down
    opticalPower: -40.0, // Indicated as LOS (No optical input)
    phone: '0819-7755-1100',
    ipAddress: '10.110.12.98',
    onuSn: 'ZTEGC8B99AA9',
    ontModel: 'ZTE F609 V5.2',
    oltId: 'OLT-BKS-01'
  },
  {
    id: 'CUST-005',
    name: 'Hendra Wijaya',
    region: 'BEKASI wilayah Jatiasih',
    address: 'Perum Jatiasih Indah Blok F-3, Jatiasih',
    packageSpeed: '50 Mbps',
    status: 'online',
    opticalPower: -19.5,
    phone: '0878-9900-5544',
    ipAddress: '10.130.67.11',
    onuSn: 'HWTC3A12A11B',
    ontModel: 'Huawei HG8546M',
    oltId: 'OLT-BKS-02'
  },
  {
    id: 'CUST-006',
    name: 'Rian Hidayat',
    region: 'BEKASI wilayah Dewi sartika',
    address: 'Perum Margahayu Blok C/10, Bekasi Timur',
    packageSpeed: '30 Mbps',
    status: 'online',
    opticalPower: -22.4,
    phone: '0812-7711-2299',
    ipAddress: '10.140.23.104',
    onuSn: 'ZTEGC900BFAF',
    ontModel: 'ZTE F670L',
    oltId: 'OLT-BKS-03'
  },
  {
    id: 'CUST-007',
    name: 'Santi Novitasari',
    region: 'CIKARANG Desa Cibarusah',
    address: 'Komp. Wanasari Baru Blok K-1 No. 5, Wanasari',
    packageSpeed: '100 Mbps',
    status: 'gangguan', // High packet loss / fluctuation
    opticalPower: -26.5,
    phone: '0811-4477-8899',
    ipAddress: '10.150.11.15',
    onuSn: 'HWTC4C33EE01',
    ontModel: 'Huawei HG8245A',
    oltId: 'OLT-CKR-01'
  },
  {
    id: 'CUST-008',
    name: 'Rudi Hermawan',
    region: 'CIKARANG Desa Jatibaru',
    address: 'Komp. Jatibaru Cluster Foresta Blok G-4, Cikarang Timur',
    packageSpeed: '150 Mbps',
    status: 'online',
    opticalPower: -17.2,
    phone: '0813-5599-2233',
    ipAddress: '10.160.89.88',
    onuSn: 'ZTEGC9A11100',
    ontModel: 'ZTE F670L Dual Band',
    oltId: 'OLT-CKR-03'
  },
  {
    id: 'CUST-009',
    name: 'Lanny Wijaya',
    region: 'CIKARANG Desa Jatibaru',
    address: 'Graha Jatireja Cluster Fortune B/15, Jatireja',
    packageSpeed: '100 Mbps',
    status: 'online',
    opticalPower: -18.9,
    phone: '0812-4433-2211',
    ipAddress: '10.160.89.124',
    onuSn: 'HWTC3B99EE00',
    ontModel: 'Huawei EG8145V5',
    oltId: 'OLT-CKR-03'
  },
  {
    id: 'CUST-010',
    name: 'Andi Yusuf',
    region: 'BEKASI wilayah Dewi sartika',
    address: 'Jl. Dewi Sartika No. 84, Aren Jaya',
    packageSpeed: '50 Mbps',
    status: 'online',
    opticalPower: -20.2,
    phone: '0852-1100-3377',
    ipAddress: '10.140.23.12',
    onuSn: 'ZTEGC7A10A9B',
    ontModel: 'ZTE F609 V5.2',
    oltId: 'OLT-BKS-03'
  },
  {
    id: 'CUST-011',
    name: 'Eko Sulistyo',
    region: 'CIKARANG Desa Cibarusah',
    address: 'Jl. Cibarusah Kota No. 11, Cibarusah',
    packageSpeed: '100 Mbps',
    status: 'online',
    opticalPower: -19.8,
    phone: '0818-0818-1999',
    ipAddress: '10.150.11.77',
    onuSn: 'HWTC4A22AA99',
    ontModel: 'Huawei HG8245H5',
    oltId: 'OLT-CKR-01'
  },
  {
    id: 'CUST-012',
    name: 'Feri Irawan',
    region: 'BEKASI wilayah Jatiasih',
    address: 'Vila Jatimekar Blok X-10 No. 2, Jatiasih',
    packageSpeed: '30 Mbps',
    status: 'gangguan', // Sudden signal drop
    opticalPower: -28.4,
    phone: '0812-8877-3366',
    ipAddress: '10.130.67.225',
    onuSn: 'ZTEGC90011EE',
    ontModel: 'ZTE F609 V5.2',
    oltId: 'OLT-BKS-02'
  },
  {
    id: 'CUST-013',
    name: 'Habbillah Abduk Fattah',
    region: 'CIKARANG Desa Sukatani',
    address: 'Jl. Sukamulya No. 12, Sukatani',
    packageSpeed: '1 Gbps Dedicated',
    status: 'online',
    opticalPower: -19.2,
    phone: '0812-5566-7788',
    ipAddress: '10.120.45.105',
    onuSn: 'ZTEGC9A29F99',
    ontModel: 'ZTE F670L Dual Band',
    oltId: 'OLT-CKR-02'
  },
  {
    id: 'CUST-014',
    name: 'Joko Purnomo',
    region: 'BEKASI wilayah Jatimakmur',
    address: 'Jl. Jaticempaka No. 8, Jatimakmur',
    packageSpeed: '500 Mbps Dedicated',
    status: 'online',
    opticalPower: -20.5,
    phone: '0813-1122-3344',
    ipAddress: '10.110.12.110',
    onuSn: 'HWTC4B889FA2',
    ontModel: 'Huawei HG8245H5',
    oltId: 'OLT-BKS-01'
  },
  {
    id: 'CUST-015',
    name: 'ATM Bank Danamon Pekanbaru Wahid Hasyim 1',
    region: 'CIKARANG Desa Sukatani',
    address: 'ATM Bank Danamon Sukatani Raya No. 1, Sukatani',
    packageSpeed: '500 Mbps Dedicated',
    status: 'online',
    opticalPower: -16.8,
    phone: '0811-9988-7766',
    ipAddress: '10.120.45.201',
    onuSn: 'ZTEGC9A22FF4',
    ontModel: 'ZTE F670L Dual Band',
    oltId: 'OLT-CKR-02'
  }
];

const regionStreets: Record<Region, string[]> = {
  'BEKASI wilayah Jatimakmur': ['Jl. Raya Jatimakmur', 'Jl. Dr. Ratna', 'Jl. Jaticempaka', 'Jl. Jatiwaringin', 'Jl. Jatibening Indah', 'Jl. Kemang', 'Jl. Kodau'],
  'BEKASI wilayah Jatiasih': ['Jl. Raya Jatiasih', 'Jl. Jatimekar', 'Jl. Jatikramat', 'Jl. Jatirasa', 'Jl. Jatisari', 'Jl. Dr. Ratna', 'Jl. Wibawa Mukti'],
  'BEKASI wilayah Dewi sartika': ['Jl. Dewi Sartika', 'Jl. Chairil Anwar', 'Jl. Mayor Oking', 'Jl. Margahayu Raya', 'Jl. Kartini', 'Jl. Ir. H. Juanda', 'Jl. Underpass'],
  'CIKARANG Desa Cibarusah': ['Jl. Raya Cibarusah', 'Jl. Sirnajaya', 'Jl. Ridogalih', 'Jl. Wanasari', 'Jl. Loji', 'Jl. Cibarusah Kota', 'Jl. Raya Cikarang-Cibarusah'],
  'CIKARANG Desa Sukatani': ['Jl. Raya Sukatani', 'Jl. Sukamanah', 'Jl. Sukamulya', 'Jl. Sukarukun', 'Jl. Jagawana', 'Jl. Sukahurip', 'Jl. Cabangbungin'],
  'CIKARANG Desa Jatibaru': ['Jl. Raya Jatibaru', 'Jl. Cikarang Timur', 'Jl. Jatireja', 'Jl. Sertajaya', 'Jl. Tanjungsari', 'Jl. Hegarmanah', 'Jl. Jatiwangi']
};

const generatedCustomers: Customer[] = [...INITIAL_CUSTOMERS];

for (let i = 16; i <= 70; i++) {
  const region = REGIONS[i % REGIONS.length];
  const firstName = firstNames[(i * 3) % firstNames.length];
  const lastName = lastNames[(i * 7) % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const listStreets = regionStreets[region];
  const street = listStreets[(i * 11) % listStreets.length];
  const listDistricts = districts[region];
  const district = listDistricts[(i * 13) % listDistricts.length];
  const address = `${street} No. ${((i * 17) % 150) + 1}, ${district}`;
  const packageSpeed = packages[(i * 19) % packages.length];
  
  // Distribute realistic states: 94% online, 4% gangguan, 2% offline
  const rand = (i * 23) % 100;
  let status: 'online' | 'offline' | 'gangguan' = 'online';
  let opticalPower = -21.0 - (i % 6); // standard online: -19 to -25 dBm
  if (rand < 2) {
    status = 'offline';
    opticalPower = -40.0;
  } else if (rand < 6) {
    status = 'gangguan';
    opticalPower = -27.5 - (i % 5); // attenuation gangguan: -27 to -32 dBm
  }
  
  const phone = `08${((i * 29) % 900) + 100}-${((i * 31) % 9000) + 1000}-${((i * 37) % 9000) + 1000}`;
  const ipAddress = `10.${110 + (REGIONS.indexOf(region) * 10)}.${(i * 13) % 254 + 1}.${(i * 17) % 254 + 1}`;
  
  // Random SN
  const hex = '0123456789ABCDEF';
  let snSuffix = '';
  for (let j = 0; j < 8; j++) {
    snSuffix += hex[(i * (j + 2)) % 16];
  }
  const isZte = i % 2 === 0;
  const onuSn = isZte ? `ZTEG${snSuffix}` : `HWTC${snSuffix}`;
  const ontModel = ontModels[i % ontModels.length];
  const oltId = olts[region];

  generatedCustomers.push({
    id: `CUST-${String(i).padStart(3, '0')}`,
    name,
    region,
    address,
    packageSpeed,
    status,
    opticalPower: Number(opticalPower.toFixed(1)),
    phone,
    ipAddress,
    onuSn,
    ontModel,
    oltId
  });
}

// Add automated realistic PPPoE configurations to ALL 70 mock customers
const finalizedCustomers: Customer[] = generatedCustomers.map((cust, idx) => {
  const cleanName = cust.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const baseUsername = `${cleanName}@aisyaka.net`;
  const regionIndex = REGIONS.indexOf(cust.region);
  const defaultVlan = 200 + (regionIndex >= 0 ? regionIndex : 0) * 20 + (idx % 15);
  
  return {
    ...cust,
    pppoeUsername: cust.pppoeUsername || baseUsername,
    pppoePassword: cust.pppoePassword || `aisyaka${idx + 101}`,
    vlanId: cust.vlanId || defaultVlan,
    pppServicePreset: cust.pppServicePreset || 'PPPoE_HSIA_VLAN_100',
    pppStatus: cust.pppStatus || (cust.status === 'online' ? 'connected' : 'disconnected'),
    wifiSsid: cust.wifiSsid || `${cust.name.split(' ')[0].toUpperCase()}_WIFI_GPON`,
    wifiPassword: cust.wifiPassword || `aisyaka${idx + 101}@123`
  };
});

export const MOCK_CUSTOMERS: Customer[] = finalizedCustomers;

// OLT and Core Network devices for FTTH infrastructure
export const MOCK_DEVICES: Device[] = [
  // Core / Aggregation GPON OLT Devices
  {
    id: 'DEV-OLT-001',
    name: 'OLT C300 - Cikarang Sukatani',
    type: 'OLT',
    model: 'ZTE ZXA10 C300',
    ipAddress: '10.10.10.1',
    status: 'active',
    temperature: 42.5,
    uptime: '154 hari, 12 jam',
    rxPower: 2.1,
    txPower: 4.8,
    region: 'CIKARANG Desa Sukatani'
  },
  {
    id: 'DEV-OLT-002',
    name: 'OLT MA5800 - Bekasi Jatimakmur',
    type: 'OLT',
    model: 'Huawei SmartAX MA5800-X17',
    ipAddress: '10.10.10.2',
    status: 'warning', // One GPON card temp is high
    temperature: 52.1,
    uptime: '45 hari, 8 jam',
    rxPower: 1.8,
    txPower: 5.2,
    region: 'BEKASI wilayah Jatimakmur'
  },
  {
    id: 'DEV-OLT-003',
    name: 'OLT C320 - Bekasi Jatiasih',
    type: 'OLT',
    model: 'ZTE ZXA10 C320',
    ipAddress: '10.10.10.3',
    status: 'active',
    temperature: 39.8,
    uptime: '19 hari, 4 jam',
    rxPower: 2.0,
    txPower: 4.5,
    region: 'BEKASI wilayah Jatiasih'
  },
  {
    id: 'DEV-OLT-004',
    name: 'OLT MA5800 - Bekasi Dewi Sartika',
    type: 'OLT',
    model: 'Huawei SmartAX MA5800-X7',
    ipAddress: '10.10.10.4',
    status: 'active',
    temperature: 41.2,
    uptime: '82 hari, 19 jam',
    rxPower: 1.9,
    txPower: 5.0,
    region: 'BEKASI wilayah Dewi sartika'
  },
  {
    id: 'DEV-OLT-005',
    name: 'OLT C300 - Cikarang Cibarusah',
    type: 'OLT',
    model: 'ZTE ZXA10 C300',
    ipAddress: '10.10.10.5',
    status: 'active',
    temperature: 44.1,
    uptime: '9 hari, 3 jam',
    rxPower: 2.2,
    txPower: 4.9,
    region: 'CIKARANG Desa Cibarusah'
  },
  {
    id: 'DEV-OLT-006',
    name: 'OLT C300 - Cikarang Jatibaru',
    type: 'OLT',
    model: 'ZTE ZXA10 C300',
    ipAddress: '10.10.10.6',
    status: 'active',
    temperature: 43.0,
    uptime: '228 hari, 2 jam',
    rxPower: 2.1,
    txPower: 4.7,
    region: 'CIKARANG Desa Jatibaru'
  },

  // GPON Ports under OLT Cikarang Sukatani
  {
    id: 'DEV-PORT-001',
    name: 'GPON Slot 1/Port 1 (Sukatani)',
    type: 'GPON Port',
    model: '16-Port GPON Card GTGH',
    ipAddress: '10.10.10.1 / Port 1',
    status: 'active',
    temperature: 38.0,
    uptime: '154 hari, 12 jam',
    rxPower: -8.1,
    txPower: 3.2,
    region: 'CIKARANG Desa Sukatani'
  },
  {
    id: 'DEV-PORT-002',
    name: 'GPON Slot 1/Port 2 (Sukarukun)',
    type: 'GPON Port',
    model: '16-Port GPON Card GTGH',
    ipAddress: '10.10.10.1 / Port 2',
    status: 'warning', // Customers connected here reporting high loss due to tree trunks
    temperature: 45.4,
    uptime: '154 hari, 12 jam',
    rxPower: -14.2,
    txPower: 3.1,
    region: 'CIKARANG Desa Sukatani'
  },

  // Active Customer devices
  {
    id: 'DEV-ONU-001',
    name: 'ONT Budi Santoso',
    type: 'ONU/ONT',
    model: 'ZTE F670L Dual Band',
    ipAddress: '10.120.45.12',
    status: 'active',
    temperature: 34.2,
    uptime: '5 hari, 2 jam',
    associatedCustomerId: 'CUST-001',
    associatedCustomerName: 'Budi Santoso',
    gponPort: 'OLT C300 - Cikarang Sukatani / Slot 1 / Port 1',
    rxPower: -18.4,
    txPower: 1.5,
    region: 'CIKARANG Desa Sukatani'
  },
  {
    id: 'DEV-ONU-002',
    name: 'ONT Siti Aminah',
    type: 'ONU/ONT',
    model: 'Huawei HG8245H5',
    ipAddress: '10.120.45.89',
    status: 'warning',
    temperature: 38.9,
    uptime: '12 jam, 30 menit',
    associatedCustomerId: 'CUST-002',
    associatedCustomerName: 'Siti Aminah',
    gponPort: 'OLT C300 - Cikarang Sukatani / Slot 1 / Port 2',
    rxPower: -29.8, // Bad attenuation limit
    txPower: 1.2,
    region: 'CIKARANG Desa Sukatani'
  },
  {
    id: 'DEV-ONU-004',
    name: 'ONT Dewi Lestari',
    type: 'ONU/ONT',
    model: 'ZTE F609 V5.2',
    ipAddress: '10.110.12.98',
    status: 'offline',
    temperature: 0,
    uptime: '0 menit (LOS)',
    associatedCustomerId: 'CUST-004',
    associatedCustomerName: 'Dewi Lestari',
    gponPort: 'OLT MA5800 - Bekasi Jatimakmur / Slot 3 / Port 1',
    rxPower: -40.0, // Optical power cut
    txPower: 0,
    region: 'BEKASI wilayah Jatimakmur'
  },
  {
    id: 'DEV-ONU-007',
    name: 'ONT Santi Novitasari',
    type: 'ONU/ONT',
    model: 'Huawei HG8245A',
    ipAddress: '10.150.11.15',
    status: 'warning',
    temperature: 37.5,
    uptime: '2 hari, 1 jam',
    associatedCustomerId: 'CUST-007',
    associatedCustomerName: 'Santi Novitasari',
    gponPort: 'OLT C300 - Cikarang Cibarusah / Slot 2 / Port 4',
    rxPower: -26.5,
    txPower: 1.3,
    region: 'CIKARANG Desa Cibarusah'
  }
];

// Current active and historic alerts for network disturbances
export const MOCK_ALERTS: NetworkAlert[] = [
  {
    id: 'ALT-101',
    customerId: 'CUST-004',
    customerName: 'Dewi Lestari',
    region: 'BEKASI wilayah Jatimakmur',
    type: 'RED LOS', // Loss of Signal
    severity: 'CRITICAL',
    message: 'Kabel Drop-Core terindikasi putus (Optical Rx Power drop di bawah -40 dBm). Indikator lampu LOS merah menyala pada ONT.',
    timestamp: '2026-06-23T05:12:00-07:00',
    resolved: false
  },
  {
    id: 'ALT-102',
    customerId: 'CUST-002',
    customerName: 'Siti Aminah',
    region: 'CIKARANG Desa Sukatani',
    type: 'High Attenuation', // Redaman Tinggi
    severity: 'WARNING',
    message: 'Sinyal optik lemah (-29.8 dBm). Kemungkinan kabel fiber terjepit atau tertekuk (macro-bending) di area tiang distribusi.',
    timestamp: '2026-06-23T06:01:00-07:00',
    resolved: false
  },
  {
    id: 'ALT-103',
    customerId: 'CUST-012',
    customerName: 'Feri Irawan',
    region: 'BEKASI wilayah Jatiasih',
    type: 'High Attenuation',
    severity: 'WARNING',
    message: 'Redaman optik naik tiba-tiba ke -28.4 dBm. Terdeteksi kotoran pada konektor adapter fiber ODP.',
    timestamp: '2026-06-23T06:33:00-07:00',
    resolved: false
  },
  {
    id: 'ALT-104',
    customerId: 'CUST-007',
    customerName: 'Santi Novitasari',
    region: 'CIKARANG Desa Cibarusah',
    type: 'High Packet Loss',
    severity: 'WARNING',
    message: 'Terjadi ping spikes dan hilangnya paket data hingga 12.5%. Indikasi saturasi bandwidth atau performa ONT yang menurun.',
    timestamp: '2026-06-23T04:22:00-07:00',
    resolved: false
  },
  {
    id: 'ALT-105',
    region: 'BEKASI wilayah Jatimakmur',
    type: 'Power Interruption',
    severity: 'CRITICAL',
    message: 'OLT Bekasi Jatimakmur kehilangan sirkuit input daya A. Berjalan menggunakan UPS cadangan sirkuit B. Sisa estimasi baterai 3 jam.',
    timestamp: '2026-06-23T03:00:00-07:00',
    resolved: false
  },
  {
    id: 'ALT-099',
    customerId: 'CUST-008',
    customerName: 'Rudi Hermawan',
    region: 'CIKARANG Desa Jatibaru',
    type: 'ONT Offline',
    severity: 'INFO',
    message: 'ONT dimatikan secara manual oleh pelanggan (Power down normal).',
    timestamp: '2026-06-23T00:15:00-07:00',
    resolved: true,
    ackBy: 'Operator_Rian'
  }
];

// High fidelity mock traffic points for visualization
export const MOCK_TRAFFIC_WAVE: TrafficPoint[] = [
  { time: '06:00', download: 284.5, upload: 94.2, latency: 12, loss: 0.0 },
  { time: '06:05', download: 310.2, upload: 102.1, latency: 14, loss: 0.1 },
  { time: '06:10', download: 350.8, upload: 110.5, latency: 13, loss: 0.0 },
  { time: '06:15', download: 412.0, upload: 115.4, latency: 15, loss: 0.0 },
  { time: '06:20', download: 420.5, upload: 124.8, latency: 18, loss: 0.2 },
  { time: '06:25', download: 495.1, upload: 132.3, latency: 22, loss: 0.3 },
  { time: '06:30', download: 512.3, upload: 155.0, latency: 19, loss: 0.0 },
  { time: '06:35', download: 550.4, upload: 168.1, latency: 16, loss: 0.1 },
  { time: '06:40', download: 610.9, upload: 184.2, latency: 14, loss: 0.0 },
  { time: '06:45', download: 685.2, upload: 195.9, latency: 15, loss: 0.0 },
  { time: '06:50', download: 720.1, upload: 215.3, latency: 17, loss: 0.2 },
  { time: '06:55', download: 742.6, upload: 224.8, latency: 16, loss: 0.0 }
];

// Live counter calculations
export const getNetworkStats = (customers: Customer[], devices: Device[], alerts: NetworkAlert[]) => {
  const totalSubscribers = customers.length;
  const onlineSubscribers = customers.filter(c => c.status === 'online').length;
  const offlineSubscribers = customers.filter(c => c.status === 'offline').length;
  const disturbedSubscribers = customers.filter(c => c.status === 'gangguan').length;
  
  const activeAlertsCount = alerts.filter(a => !a.resolved).length;
  const averageOpticalPower = customers.reduce((acc, c) => acc + (c.status !== 'offline' ? c.opticalPower : 0), 0) / 
    (customers.filter(c => c.status !== 'offline').length || 1);

  return {
    totalSubscribers,
    onlineSubscribers,
    offlineSubscribers,
    disturbedSubscribers,
    activeAlertsCount,
    averageOpticalPower: Number(averageOpticalPower.toFixed(2))
  };
};
