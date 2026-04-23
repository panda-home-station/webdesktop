/**
 * Network types for TrueNAS webdesktop
 * Based on webui interfaces in /ui/system/network
 */

// Network Interface Types
export enum NetworkInterfaceType {
  Bridge = 'BRIDGE',
  LinkAggregation = 'LINK_AGGREGATION',
  Physical = 'PHYSICAL',
  Vlan = 'VLAN',
  Unknown = 'UNKNOWN',
}

export enum LinkState {
  Up = 'LINK_STATE_UP',
  Down = 'LINK_STATE_DOWN',
  Unknown = 'LINK_STATE_UNKNOWN',
}

// Interface alias (IP address with netmask)
export interface NetworkInterfaceAlias {
  type?: 'INET' | 'INET6';
  address: string;
  netmask?: number;
  broadcast?: string;
}

// Interface state information
export interface NetworkInterfaceState {
  active_media_subtype: string;
  active_media_type: string;
  aliases: NetworkInterfaceAlias[];
  capabilities: string[];
  cloned: boolean;
  description: string;
  flags: string[];
  permanent_link_address: string;
  link_address: string;
  link_state: LinkState;
  mtu: number;
  name: string;
}

// Full network interface
export interface NetworkInterface {
  aliases: NetworkInterfaceAlias[];
  description: string;
  failover_aliases: NetworkInterfaceAlias[];
  failover_critical: boolean;
  failover_group: number;
  id: string;
  ipv4_dhcp: boolean;
  ipv6_auto: boolean;
  mtu: number;
  name: string;
  options: string;
  state: NetworkInterfaceState;
  type: NetworkInterfaceType;
}

// Network Configuration
export interface NetworkServiceAnnouncement {
  netbios: boolean;
  mdns: boolean;
  wsd: boolean;
}

export interface NetworkConfigurationActivity {
  type: 'ALLOW' | 'DENY';
  activities: string[];
}

export interface NetworkConfigurationState {
  ipv4gateway: string;
  ipv6gateway: string;
  nameserver1: string;
  nameserver2: string;
  nameserver3: string;
}

export interface NetworkConfigurationConfig {
  activity: NetworkConfigurationActivity;
  domain: string;
  domains: string[];
  hostname: string;
  hostname_b: string;
  hostname_local: string;
  hostname_virtual: string;
  hosts: string[];
  httpproxy: string;
  id: number;
  inherit_dhcp: boolean;
  ipv4gateway: string;
  ipv6gateway: string;
  nameserver1: string;
  nameserver2: string;
  nameserver3: string;
  netbios: boolean;
  mdns: boolean;
  wsd: boolean;
  service_announcement: NetworkServiceAnnouncement;
  state: NetworkConfigurationState;
}

// Network Summary
export interface NetworkSummary {
  default_routes: string[];
  ips: Record<string, { IPV4?: string[]; IPV6?: string[] }>;
  nameservers: string[];
}

// Static Route
export interface StaticRoute {
  id: number;
  destination: string;
  gateway: string;
  description?: string;
}

// IPMI
export interface IpmiLan {
  backup_gateway_ip_address: string;
  backup_gateway_mac_address: string;
  channel: number;
  default_gateway_ip_address: string;
  default_gateway_mac_address: string;
  id: number;
  ip_address: string;
  ip_address_source: string;
  mac_address: string;
  subnet_mask: string;
  vlan_id: number;
  vlan_id_enable: boolean;
  vlan_priority: number;
}

export interface IpmiUpdate {
  dhcp: boolean;
  gateway: string;
  ipaddress: string;
  netmask: string;
  vlan: number | null;
  password?: string;
  apply_remote?: boolean;
}

// Pending Changes State
export interface PendingChangesState {
  hasPendingChanges: boolean;
  checkinWaiting: boolean;
  checkinRemaining: number | null;
  checkinTimeout: number;
  affectedServices: string[];
  uniqueIps: string[];
}

// Services restarted on sync result
export interface ServicesRestartedOnSync {
  service: string;
  ips: string[];
}