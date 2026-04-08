/**
 * System types
 * Ported from webui/src/app/interfaces/
 */

// System Info from system.info API
export interface SystemInfo {
  version: string;
  buildtime: ApiTimestamp;
  hostname: string;
  physmem: number;
  model: string;
  cores: number;
  physical_cores: number;
  loadavg: [number, number, number];
  uptime: string;
  uptime_seconds: number;
  system_serial: string | null;
  system_product: string | null;
  system_product_version: string | null;
  license: SystemLicense | null;
  boottime: ApiTimestamp;
  datetime: ApiTimestamp;
  timezone: string;
  system_manufacturer: string | null;
  ecc_memory: boolean;
}

// TrueNAS API timestamp format: { $date: number }
export interface ApiTimestamp {
  $date: number;
}

export interface SystemLicense {
  addhw: unknown[];
  addhw_detail: unknown[];
  contract_end: string;
  contract_start: string;
  contract_type: ContractType;
  customer_name: string;
  expired: boolean;
  features: unknown[];
  legacy_contract_hardware: unknown;
  legacy_contract_software: unknown;
  model: string;
  system_serial: string;
  system_serial_ha: string;
}

export enum ContractType {
  Gold = 'GOLD',
  SilverInternational = 'SILVERINTERNATIONAL',
  Legacy = 'LEGACY',
  Standard = 'STANDARD',
  Bronze = 'BRONZE',
  Silver = 'SILVER',
  FreeNasCertified = 'FREENASCERTIFIED',
  FreeNasMini = 'FREENASMINI',
}

// Network Interface from interface.query
export interface NetworkInterface {
  id: string;
  name: string;
  addresses: string[];
  mac: string;
  state?: string;
  type?: string;
  link_address?: string;
  ip4?: string;
  ip6?: string;
  flags?: string[];
}

// Reporting Realtime from reporting.realtime subscription
export interface ReportingRealtimeUpdate {
  cpu: AllCpusUpdate;
  pools: Record<string, PoolUsage>;
  disks: DisksUpdate;
  interfaces: AllNetworkInterfacesUpdate;
  memory: MemoryUpdate;
}

export interface AllCpusUpdate {
  user: number;
  nice: number;
  system: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
  guest: number;
  guest_nice: number;
  cpu: CpuUsageUpdate;
  [key: string]: number | CpuUsageUpdate | undefined;
}

export interface CpuUsageUpdate {
  usage: number;
  temp: number;
}

export interface DisksUpdate {
  busy: number;
  read_bytes: number;
  read_ops: number;
  write_bytes: number;
  write_ops: number;
}

export type AllNetworkInterfacesUpdate = Record<string, NetworkInterfaceUpdate>;

export interface NetworkInterfaceUpdate {
  link_state: string;
  received_bytes_rate: number;
  sent_bytes_rate: number;
  speed: number;
}

export interface MemoryUpdate {
  arc_size: number;
  arc_free_memory: number;
  arc_available_memory: number;
  physical_memory_total: number;
  physical_memory_available: number;
}

export interface PoolUsage {
  available: number;
  used: number;
  total: number;
}
