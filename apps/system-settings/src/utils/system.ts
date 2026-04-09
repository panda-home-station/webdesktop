import type { ReportingRealtimeUpdate } from '@shared/types/system-types'

// Format bytes to human readable string
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// Calculate CPU usage percentage from AllCpusUpdate
export function getCpuUsage(realtime: ReportingRealtimeUpdate | null): string {
  if (!realtime?.cpu?.cpu) return '0%'
  const usage = realtime.cpu.cpu.usage
  return `${usage.toFixed(1)}%`
}

// Network interface alias from interface.query
export interface NetworkInterfaceAlias {
  address: string
  type?: string
  netmask?: number
}

// Network interface from interface.query
export interface NetworkInterfaceFromApi {
  name: string
  state: {
    link_state: string
    flags: string[]
    aliases: NetworkInterfaceAlias[]
  }
}

// Get network info
export function getNetworkInfo(
  networkInterfaces: NetworkInterfaceFromApi[]
): { ip: string; status: string } {
  if (!networkInterfaces || networkInterfaces.length === 0) {
    return { ip: 'Loading...', status: 'Loading...' }
  }

  // Find primary interface (up and has IP)
  const primaryIface = networkInterfaces.find(
    (iface) => iface.state?.link_state === 'LINK_STATE_UP' || iface.state?.flags?.includes('UP')
  ) || networkInterfaces[0]

  if (!primaryIface) {
    return { ip: 'N/A', status: 'Disconnected' }
  }

  // Get IP address from state.aliases
  const aliases = primaryIface.state?.aliases || []
  const ip = aliases.find(
    (alias) => alias.address?.startsWith('192.168.') || alias.address?.startsWith('10.') || alias.address?.startsWith('172.')
  )?.address || aliases[0]?.address || 'N/A'

  return {
    ip,
    status: primaryIface.state?.link_state === 'LINK_STATE_UP' ? 'Connected' : 'Disconnected',
  }
}

// Format uptime string
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) {
    return `${days} days ${hours} hours ${minutes} minutes`
  }
  return `${hours} hours ${minutes} minutes`
}

// Parse system datetime with multiple format support
export function parseSystemDatetime(datetime: unknown): number {
  const tryParse = (value: unknown, convertFromSeconds = true): number | null => {
    let ts: number
    if (typeof value === 'object' && value !== null && '$date' in value) {
      const dateValue = (value as { $date: number }).$date
      ts = convertFromSeconds && dateValue < 1e12 ? dateValue * 1000 : dateValue
    } else if (typeof value === 'number') {
      ts = convertFromSeconds && value < 1e12 ? value * 1000 : value
    } else {
      return null
    }
    const year = new Date(ts).getFullYear()
    if (year >= 2000 && year <= 2100) {
      return ts
    }
    return null
  }

  return (
    tryParse(datetime, true) ??
    tryParse(datetime, false) ??
    tryParse((datetime as { $date?: number })?.$date, true) ??
    tryParse((datetime as { $date?: number })?.$date, false) ??
    Date.now()
  )
}

// Format datetime to display string
export function formatDatetime(ms: number): string {
  const d = new Date(ms)
  if (isNaN(d.getTime())) return 'N/A'
  const pad = (n: number) => n < 10 ? '0' + n : n
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
