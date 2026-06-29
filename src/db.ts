import { Customer, Device, NetworkAlert, Technician, HomeVisit } from './types';
import { MOCK_CUSTOMERS, MOCK_DEVICES, MOCK_ALERTS, REGIONS } from './data';

// Define the shape of our relational DB tables
interface DatabaseSchema {
  customers: Customer[];
  devices: Device[];
  alerts: NetworkAlert[];
  technicians: Technician[];
  visits: HomeVisit[];
}

const STORAGE_KEY = 'aisyaka_net_local_db';

const MOCK_TECHNICIANS: Technician[] = [
  { id: 'TECH-001', name: 'Rian Hidayat', phone: '0812-3456-7890', region: 'CIKARANG Desa Sukatani', specialization: 'Splicing Fiber Optic', status: 'idle' },
  { id: 'TECH-002', name: 'Budi Santoso', phone: '0812-9876-5432', region: 'BEKASI wilayah Jatimakmur', specialization: 'Aktivasi ONT Dual Band', status: 'idle' },
  { id: 'TECH-003', name: 'Fajar Prasetyo', phone: '0813-1122-3344', region: 'BEKASI wilayah Jatiasih', specialization: 'Penarikan Dropcore & ODP', status: 'idle' },
  { id: 'TECH-004', name: 'Andika Putra', phone: '0815-4433-2211', region: 'BEKASI wilayah Dewi sartika', specialization: 'Troubleshooting Red LOS', status: 'idle' },
  { id: 'TECH-005', name: 'Hendra Wijaya', phone: '0818-5566-7788', region: 'CIKARANG Desa Cibarusah', specialization: 'Setting AP & Router', status: 'idle' },
  { id: 'TECH-006', name: 'Yudi Pratama', phone: '0819-9988-7766', region: 'CIKARANG Desa Jatibaru', specialization: 'Instalasi Dropcore', status: 'idle' }
];

const MOCK_VISITS: HomeVisit[] = [
  {
    id: 'VISIT-001',
    customerId: 'CUST-002',
    customerName: 'Asep Suhendar',
    customerAddress: 'Jl. Jatimakmur No. 45, Bekasi',
    customerPhone: '0812-3456-7811',
    customerRegion: 'BEKASI wilayah Jatimakmur',
    technicianId: 'TECH-002',
    technicianName: 'Budi Santoso',
    issueDescription: 'Sinyal drop / Redaman tinggi -29 dBm',
    scheduledDate: '2026-06-23',
    status: 'completed',
    resolutionNotes: 'Splice ulang konektor dropcore di ODP, redaman kembali normal ke -19.2 dBm.',
    resolvedAt: '2026-06-23 15:42'
  }
];

class LocalSQLDatabase {
  private schema: DatabaseSchema = {
    customers: [],
    devices: [],
    alerts: [],
    technicians: [],
    visits: [],
  };

  constructor() {
    this.init();
  }

  // Initialize and seed database if it does not exist
  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Ensure standard datasets exist
        let loadedCustomers = parsed.customers && parsed.customers.length ? parsed.customers : MOCK_CUSTOMERS;
        
        let shouldForceSave = false;
        
        const hasRequiredCustomers = 
          loadedCustomers.some((c: any) => c.name === 'Habbillah Abduk Fattah') &&
          loadedCustomers.some((c: any) => c.name === 'Joko Purnomo') &&
          loadedCustomers.some((c: any) => c.name === 'ATM Bank Danamon Pekanbaru Wahid Hasyim 1');

        const validRegions = [
          'BEKASI wilayah Jatimakmur',
          'BEKASI wilayah Jatiasih',
          'BEKASI wilayah Dewi sartika',
          'CIKARANG Desa Cibarusah',
          'CIKARANG Desa Sukatani',
          'CIKARANG Desa Jatibaru'
        ];
        const hasOldRegions = loadedCustomers.some((c: any) => !validRegions.includes(c.region));

        if (!hasRequiredCustomers || loadedCustomers.length !== MOCK_CUSTOMERS.length || hasOldRegions) {
          loadedCustomers = MOCK_CUSTOMERS;
          shouldForceSave = true;
        }

        // Force sync packageSpeed for the 3 special customers to avoid stale localStorage cache
        loadedCustomers = loadedCustomers.map((c: any) => {
          const match = MOCK_CUSTOMERS.find((mc: any) => mc.id === c.id);
          if (match && ['CUST-013', 'CUST-014', 'CUST-015'].includes(c.id)) {
            if (c.packageSpeed !== match.packageSpeed) {
              shouldForceSave = true;
              return { ...c, packageSpeed: match.packageSpeed };
            }
          }
          return c;
        });

        let loadedDevices = parsed.devices && parsed.devices.length ? parsed.devices : MOCK_DEVICES;
        const hasOldDeviceRegions = loadedDevices.some((d: any) => !validRegions.includes(d.region));
        const hasOldOltNames = loadedDevices.some((d: any) => d.type === 'OLT' && (d.name.includes('JKT') || d.name.includes('BDG') || d.name.includes('BGR') || d.name.includes('TGR')));
        if (hasOldDeviceRegions || hasOldOltNames || loadedDevices.length !== MOCK_DEVICES.length) {
          loadedDevices = MOCK_DEVICES;
          shouldForceSave = true;
        }

        const loadedAlerts = parsed.alerts && parsed.alerts.length ? parsed.alerts : MOCK_ALERTS;
        const loadedTechnicians = parsed.technicians && parsed.technicians.length ? parsed.technicians : MOCK_TECHNICIANS;
        const loadedVisits = parsed.visits && parsed.visits.length ? parsed.visits : MOCK_VISITS;

        // Perform deep property merging with MOCK_CUSTOMERS to prevent undefined parameters on older database schemas stored locally
        const mergedCustomers = loadedCustomers.map((cust: any, idx: number) => {
          const fallback = MOCK_CUSTOMERS[idx % MOCK_CUSTOMERS.length] || {};
          return {
            ...fallback,
            ...cust
          };
        });

        this.schema = {
          customers: mergedCustomers,
          devices: loadedDevices,
          alerts: loadedAlerts,
          technicians: loadedTechnicians,
          visits: loadedVisits,
        };

        if (shouldForceSave) {
          this.save();
        }
      } else {
        // Seed with standard mock datasets
        this.schema = {
          customers: MOCK_CUSTOMERS,
          devices: MOCK_DEVICES,
          alerts: MOCK_ALERTS,
          technicians: MOCK_TECHNICIANS,
          visits: MOCK_VISITS,
        };
        this.save();
      }
    } catch (e) {
      console.error('Failed to initialize local database:', e);
      this.schema = {
        customers: MOCK_CUSTOMERS,
        devices: MOCK_DEVICES,
        alerts: MOCK_ALERTS,
        technicians: MOCK_TECHNICIANS,
        visits: MOCK_VISITS,
      };
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.schema));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  // Standard CRUD for Customers
  public getCustomers(): Customer[] {
    return this.schema.customers;
  }

  public addCustomer(cust: Omit<Customer, 'id'> & { id?: string }): Customer {
    const lastId = this.schema.customers.reduce((max, c) => {
      const match = c.id.match(/\d+/);
      const val = match ? parseInt(match[0], 10) : 0;
      return val > max ? val : max;
    }, 0);

    const newId = `CUST-${String(lastId + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      ...cust,
      id: cust.id || newId,
    };

    this.schema.customers.push(newCust);
    this.save();
    return newCust;
  }

  public updateCustomer(updated: Customer): Customer {
    const idx = this.schema.customers.findIndex(c => c.id === updated.id);
    if (idx !== -1) {
      this.schema.customers[idx] = updated;
      this.save();
    }
    return updated;
  }

  public deleteCustomer(id: string): boolean {
    const initialLen = this.schema.customers.length;
    this.schema.customers = this.schema.customers.filter(c => c.id !== id);
    const deleted = this.schema.customers.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Standard CRUD for Devices
  public getDevices(): Device[] {
    return this.schema.devices;
  }

  // Standard CRUD for Alerts
  public getAlerts(): NetworkAlert[] {
    return this.schema.alerts;
  }

  public updateAlerts(updated: NetworkAlert[]) {
    this.schema.alerts = updated;
    this.save();
  }

  // Standard CRUD for Technicians
  public getTechnicians(): Technician[] {
    return this.schema.technicians;
  }

  public addTechnician(tech: Omit<Technician, 'id'>): Technician {
    const lastId = this.schema.technicians.reduce((max, t) => {
      const match = t.id.match(/\d+/);
      const val = match ? parseInt(match[0], 10) : 0;
      return val > max ? val : max;
    }, 0);

    const newId = `TECH-${String(lastId + 1).padStart(3, '0')}`;
    const newTech: Technician = {
      ...tech,
      id: newId,
    };

    this.schema.technicians.push(newTech);
    this.save();
    return newTech;
  }

  public updateTechnician(updated: Technician): Technician {
    const idx = this.schema.technicians.findIndex(t => t.id === updated.id);
    if (idx !== -1) {
      this.schema.technicians[idx] = updated;
      this.save();
    }
    return updated;
  }

  public deleteTechnician(id: string): boolean {
    const initialLen = this.schema.technicians.length;
    this.schema.technicians = this.schema.technicians.filter(t => t.id !== id);
    const deleted = this.schema.technicians.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Standard CRUD for Home Visits
  public getHomeVisits(): HomeVisit[] {
    return this.schema.visits;
  }

  public addHomeVisit(visit: Omit<HomeVisit, 'id'>): HomeVisit {
    const lastId = this.schema.visits.reduce((max, v) => {
      const match = v.id.match(/\d+/);
      const val = match ? parseInt(match[0], 10) : 0;
      return val > max ? val : max;
    }, 0);

    const newId = `VISIT-${String(lastId + 1).padStart(3, '0')}`;
    const newVisit: HomeVisit = {
      ...visit,
      id: newId,
    };

    this.schema.visits.push(newVisit);
    this.save();
    return newVisit;
  }

  public updateHomeVisit(updated: HomeVisit): HomeVisit {
    const idx = this.schema.visits.findIndex(v => v.id === updated.id);
    if (idx !== -1) {
      this.schema.visits[idx] = updated;
      this.save();
    }
    return updated;
  }

  public deleteHomeVisit(id: string): boolean {
    const initialLen = this.schema.visits.length;
    this.schema.visits = this.schema.visits.filter(v => v.id !== id);
    const deleted = this.schema.visits.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  /**
   * LIGHTWEIGHT SQL INTERPRETER / PARSER
   * Allows users to interact with our dataset using actual SQL statements!
   * E.g., "SELECT * FROM customers WHERE status = 'online'"
   * E.g., "SELECT * FROM technicians"
   */
  public executeSQL(queryStr: string): { success: boolean; data?: any[]; message: string; affectedRows?: number } {
    const cleanQuery = queryStr.trim().replace(/\s+/g, ' ');
    const selectRegex = /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i;
    const updateRegex = /^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+?)$/i;
    const deleteRegex = /^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+?)$/i;
    const insertRegex = /^INSERT\s+INTO\s+(\w+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)$/i;

    const validTables = ['customers', 'devices', 'alerts', 'technicians', 'visits'];

    try {
      // 1. SELECT Query Handler
      if (selectRegex.test(cleanQuery)) {
        const match = cleanQuery.match(selectRegex)!;
        const fields = match[1].trim();
        const tableName = match[2].trim().toLowerCase();
        const whereClause = match[3] ? match[3].trim() : null;
        const limitClause = match[4] ? parseInt(match[4], 10) : null;

        const actualTable = tableName === 'visits' ? 'visits' : tableName;
        if (!validTables.includes(tableName)) {
          return { success: false, message: `Table '${tableName}' not found in relational database schema.` };
        }

        let dataset = [...(this.schema[actualTable as keyof DatabaseSchema] as any[])];

        // Apply WHERE filtering
        if (whereClause) {
          const conditions = whereClause.split(/\s+AND\s+/i);
          dataset = dataset.filter((row) => {
            return conditions.every((cond) => {
              // Supports: field = 'val' or field = val
              const eqMatch = cond.match(/^(\w+)\s*=\s*(['"]?)(.*?)\2$/);
              if (eqMatch) {
                const field = eqMatch[1].trim();
                const val = eqMatch[3].trim();
                return String(row[field]).toLowerCase() === val.toLowerCase();
              }
              // Supports: field LIKE 'val'
              const likeMatch = cond.match(/^(\w+)\s+LIKE\s+['"]%(.*?)%['"]$/i);
              if (likeMatch) {
                const field = likeMatch[1].trim();
                const val = likeMatch[2].trim();
                return String(row[field]).toLowerCase().includes(val.toLowerCase());
              }
              return true;
            });
          });
        }

        // Apply Fields Mapping
        let result = dataset;
        if (fields !== '*') {
          const fieldList = fields.split(',').map((f) => f.trim());
          result = dataset.map((row) => {
            const mappedRow: any = {};
            fieldList.forEach((f) => {
              if (f in row) mappedRow[f] = row[f];
            });
            return mappedRow;
          });
        }

        // Apply Limit
        if (limitClause !== null) {
          result = result.slice(0, limitClause);
        }

        return {
          success: true,
          data: result,
          message: `Query executed successfully. Returned ${result.length} row(s).`,
        };
      }

      // 2. UPDATE Query Handler
      if (updateRegex.test(cleanQuery)) {
        const match = cleanQuery.match(updateRegex)!;
        const tableName = match[1].trim().toLowerCase();
        const setClauses = match[2].trim();
        const whereClause = match[3].trim();

        if (!validTables.includes(tableName)) {
          return { success: false, message: `Table '${tableName}' not found.` };
        }

        const actualTable = tableName === 'visits' ? 'visits' : tableName;

        // Parse set clauses: status = 'gangguan', opticalPower = -29.5
        const assignments: Record<string, any> = {};
        const assignmentsArr = setClauses.split(',');
        assignmentsArr.forEach((assign) => {
          const parts = assign.split('=');
          if (parts.length === 2) {
            const field = parts[0].trim();
            let val: any = parts[1].trim().replace(/^['"]|['"]$/g, '');
            if (!isNaN(val)) val = Number(val);
            assignments[field] = val;
          }
        });

        // Parse WHERE clause
        const eqMatch = whereClause.match(/^(\w+)\s*=\s*(['"]?)(.*?)\2$/);
        if (!eqMatch) {
          return { success: false, message: 'Only simple WHERE matching (e.g. id = \'CUST-002\') is supported in UPDATE.' };
        }
        const whereField = eqMatch[1].trim();
        const whereVal = eqMatch[3].trim();

        let affectedRows = 0;
        const dataset = this.schema[actualTable as keyof DatabaseSchema] as any[];

        dataset.forEach((row) => {
          if (String(row[whereField]).toLowerCase() === whereVal.toLowerCase()) {
            Object.keys(assignments).forEach((key) => {
              if (key in row) {
                row[key] = assignments[key];
              }
            });
            affectedRows++;
          }
        });

        if (affectedRows > 0) {
          this.save();
        }

        return {
          success: true,
          affectedRows,
          message: `UPDATE executed successfully. Affected ${affectedRows} row(s).`,
        };
      }

      // 3. DELETE Query Handler
      if (deleteRegex.test(cleanQuery)) {
        const match = cleanQuery.match(deleteRegex)!;
        const tableName = match[1].trim().toLowerCase();
        const whereClause = match[2].trim();

        if (!validTables.includes(tableName)) {
          return { success: false, message: `Table '${tableName}' not found.` };
        }

        const actualTable = tableName === 'visits' ? 'visits' : tableName;

        // Parse WHERE clause
        const eqMatch = whereClause.match(/^(\w+)\s*=\s*(['"]?)(.*?)\2$/);
        if (!eqMatch) {
          return { success: false, message: 'Only simple WHERE matching (e.g. id = \'CUST-002\') is supported in DELETE.' };
        }
        const whereField = eqMatch[1].trim();
        const whereVal = eqMatch[3].trim();

        const initialCount = (this.schema[actualTable as keyof DatabaseSchema] as any[]).length;
        (this.schema[actualTable as keyof DatabaseSchema] as any[]) = (this.schema[actualTable as keyof DatabaseSchema] as any[]).filter(
          (row: any) => String(row[whereField]).toLowerCase() !== whereVal.toLowerCase()
        );
        const affectedRows = initialCount - (this.schema[actualTable as keyof DatabaseSchema] as any[]).length;

        if (affectedRows > 0) {
          this.save();
        }

        return {
          success: true,
          affectedRows,
          message: `DELETE executed successfully. Affected ${affectedRows} row(s).`,
        };
      }

      // 4. INSERT Query Handler
      if (insertRegex.test(cleanQuery)) {
        const match = cleanQuery.match(insertRegex)!;
        const tableName = match[1].trim().toLowerCase();
        const fieldStr = match[2].trim();
        const valStr = match[3].trim();

        if (tableName !== 'customers') {
          return { success: false, message: 'INSERT is only supported for the \'customers\' table currently via terminal.' };
        }

        const fields = fieldStr.split(',').map((f) => f.trim());
        const values = valStr.split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, ''));

        if (fields.length !== values.length) {
          return { success: false, message: 'Column count does not match value count.' };
        }

        const insertObj: any = {};
        fields.forEach((field, idx) => {
          let val: any = values[idx];
          if (!isNaN(val)) val = Number(val);
          insertObj[field] = val;
        });

        // Set mandatory fields if missing
        if (!insertObj.name) return { success: false, message: 'Field \'name\' is mandatory for new customers.' };
        if (!insertObj.region) insertObj.region = 'BEKASI wilayah Jatimakmur';
        if (!insertObj.packageSpeed) insertObj.packageSpeed = '50 Mbps';
        if (!insertObj.status) insertObj.status = 'online';
        if (!insertObj.opticalPower) insertObj.opticalPower = -19.5;
        if (!insertObj.address) insertObj.address = 'Jl. Baru No. 1';
        if (!insertObj.phone) insertObj.phone = '0812-0000-0000';
        if (!insertObj.onuSn) {
          const hex = '0123456789ABCDEF';
          let snSuffix = '';
          for (let j = 0; j < 8; j++) snSuffix += hex[Math.floor(Math.random() * 16)];
          insertObj.onuSn = `ZTEG${snSuffix}`;
        }
        if (!insertObj.ontModel) insertObj.ontModel = 'ZTE F670L Dual Band';
        if (!insertObj.ipAddress) {
          insertObj.ipAddress = `10.120.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
        }

        const added = this.addCustomer(insertObj);

        return {
          success: true,
          affectedRows: 1,
          data: [added],
          message: `INSERT executed successfully. Created customer with ID '${added.id}'.`,
        };
      }

      return { success: false, message: 'Unsupported SQL Syntax. Supported commands: SELECT, INSERT, UPDATE, DELETE.' };
    } catch (err: any) {
      return { success: false, message: `SQL Syntax Error: ${err.message}` };
    }
  }
}

export const db = new LocalSQLDatabase();
