import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { Cpu, HardDrive, Network, MemoryStick as MemoryIcon, Activity, Calendar, Monitor as GpuIcon } from 'lucide-react'
import { Sidebar } from '../../../src/components/Sidebar'

interface Stats {
  cpu_usage: number
  memory_usage: number
  gpu_usage: number | null
  net_recv_kbps: number
  net_sent_kbps: number
  disk_usage: number
  disk_read_kbps?: number
  disk_write_kbps?: number
  created_at: string
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

const formatFullTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

const TABS = [
  { id: 'performance', label: '性能', icon: <Activity size={20} /> },
  { id: 'cpu', label: '处理器', icon: <Cpu size={20} /> },
  { id: 'gpu', label: '图形处理器', icon: <GpuIcon size={20} /> },
  { id: 'memory', label: '内存', icon: <MemoryIcon size={20} /> },
  { id: 'disk', label: '磁盘', icon: <HardDrive size={20} /> },
  { id: 'network', label: '网络', icon: <Network size={20} /> },
  { id: 'history', label: '历史记录', icon: <Calendar size={20} /> },
]

export default function MonitorApp() {
  const [currentStats, setCurrentStats] = useState<Stats | null>(null)
  const [realtimeHistory, setRealtimeHistory] = useState<Stats[]>([])
  const [historyData, setHistoryData] = useState<Stats[]>([])
  const [activeTab, setActiveTab] = useState('performance')
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState<'1h' | '6h' | '24h'>('1h')

  const fetchCurrent = useCallback(async () => {
    try {
      const res = await axios.get('/api/system/stats')
      const data = res.data
      setCurrentStats(data)
      setRealtimeHistory(prev => {
        const next = [...prev, data]
        if (next.length > 30) return next.slice(1) // Keep 1 minute of 2s updates
        return next
      })
    } catch (e) {
      console.error('Failed to fetch current stats', e)
    }
  }, [])

  const fetchHistory = useCallback(async (timeRange: '1h' | '6h' | '24h') => {
    setLoading(true)
    try {
      const now = new Date()
      let start = new Date()
      if (timeRange === '1h') start.setHours(now.getHours() - 1)
      else if (timeRange === '6h') start.setHours(now.getHours() - 6)
      else if (timeRange === '24h') start.setDate(now.getDate() - 1)

      const res = await axios.get('/api/system/stats/history', {
        params: {
          start: start.toISOString(),
          end: now.toISOString(),
          limit: 1000
        }
      })
      // API returns desc, we want asc for chart
      setHistoryData(res.data.reverse())
    } catch (e) {
      console.error('Failed to fetch history', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrent()
    const timer = setInterval(fetchCurrent, 2000)
    return () => clearInterval(timer)
  }, [fetchCurrent])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(range)
    }
  }, [activeTab, range, fetchHistory])

  const formatValue = (val: any) => (typeof val === 'number' ? val.toFixed(2) : val)

  const renderPerformance = () => (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1c1c1e' }}>性能</h1>
          <p style={{ margin: '4px 0 0 0', color: '#8e8e93', fontSize: 14 }}>实时系统资源使用情况</p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 24 
      }}>
        {/* CPU Chart */}
        <Section title="处理器 (CPU)">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{currentStats?.cpu_usage.toFixed(2)}%</span>
            <Cpu size={20} color="#3b82f6" />
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="created_at" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  labelFormatter={formatTime} 
                  formatter={formatValue}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Area isAnimationActive={false} type="monotone" dataKey="cpu_usage" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* GPU Chart */}
        <Section title="图形处理器 (GPU)">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{currentStats?.gpu_usage?.toFixed(2) ?? 'N/A'}%</span>
            <GpuIcon size={20} color="#ef4444" />
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="created_at" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  labelFormatter={formatTime} 
                  formatter={formatValue}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Area isAnimationActive={false} type="monotone" dataKey="gpu_usage" stroke="#ef4444" strokeWidth={2} fill="url(#colorGpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Memory Chart */}
        <Section title="内存 (Memory)">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{currentStats?.memory_usage.toFixed(2)}%</span>
            <MemoryIcon size={20} color="#10b981" />
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="created_at" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  labelFormatter={formatTime} 
                  formatter={formatValue}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Area isAnimationActive={false} type="monotone" dataKey="memory_usage" stroke="#10b981" strokeWidth={2} fill="url(#colorMem)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Disk R/W Chart */}
        <Section title="磁盘读写 (Disk I/O)">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8e8e93' }}>读取</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{(currentStats?.disk_read_kbps ?? 0).toFixed(2)} KB/s</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8e8e93' }}>写入</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{(currentStats?.disk_write_kbps ?? 0).toFixed(2)} KB/s</div>
              </div>
            </div>
            <HardDrive size={20} color="#f59e0b" />
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="created_at" hide />
                <YAxis hide />
                <Tooltip 
                  labelFormatter={formatTime} 
                  formatter={formatValue}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Area isAnimationActive={false} type="monotone" dataKey="disk_read_kbps" name="读取" stroke="#f59e0b" strokeWidth={2} fill="url(#colorDiskRead)" />
                <Area isAnimationActive={false} type="monotone" dataKey="disk_write_kbps" name="写入" stroke="#d97706" strokeWidth={2} fill="url(#colorDiskWrite)" />
                <defs>
                  <linearGradient id="colorDiskRead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDiskWrite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Network Chart */}
        <Section title="网络速度 (Network)">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8e8e93' }}>下载</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{(currentStats?.net_recv_kbps ?? 0).toFixed(2)} KB/s</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8e8e93' }}>上传</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{(currentStats?.net_sent_kbps ?? 0).toFixed(2)} KB/s</div>
              </div>
            </div>
            <Network size={20} color="#8b5cf6" />
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="created_at" hide />
                <YAxis hide />
                <Tooltip 
                  labelFormatter={formatTime} 
                  formatter={formatValue}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Area isAnimationActive={false} type="monotone" dataKey="net_recv_kbps" name="下载" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorNetRecv)" />
                <Area isAnimationActive={false} type="monotone" dataKey="net_sent_kbps" name="上传" stroke="#ec4899" strokeWidth={2} fill="url(#colorNetSent)" />
                <defs>
                  <linearGradient id="colorNetRecv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNetSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  )

  const renderDetail = (type: 'cpu' | 'memory' | 'disk' | 'network' | 'gpu') => {
    const config = {
      cpu: { key: 'cpu_usage', name: 'CPU 使用率', unit: '%', color: '#3b82f6' },
      gpu: { key: 'gpu_usage', name: 'GPU 使用率', unit: '%', color: '#ef4444' },
      memory: { key: 'memory_usage', name: '内存 使用率', unit: '%', color: '#10b981' },
      disk: { key: 'disk_usage', name: '磁盘 使用率', unit: '%', color: '#f59e0b' },
      network: { key: 'net_recv_kbps', name: '下行速度', unit: ' KB/s', color: '#8b5cf6' }
    }[type]

    return (
      <div style={{ padding: 32, height: '100%', boxSizing: 'border-box', maxWidth: 1200, margin: '0 auto' }}>
        <Section title={`${config.name} 详情`}>
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="created_at" tickFormatter={formatTime} fontSize={12} tickMargin={8} />
                <YAxis fontSize={12} unit={config.unit} tickLine={false} axisLine={false} />
                <Tooltip 
                  labelFormatter={formatFullTime} 
                  formatter={formatValue}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Area isAnimationActive={false} type="monotone" dataKey={config.key} name={config.name} stroke={config.color} strokeWidth={2} fill={`url(#color${type})`} />
                {type === 'network' && <Area isAnimationActive={false} type="monotone" dataKey="net_sent_kbps" name="上行速度" stroke="#ec4899" strokeWidth={2} fill="url(#colorSent)" />}
                {type === 'disk' && <Area isAnimationActive={false} type="monotone" dataKey="disk_read_kbps" name="读取速度" stroke="#f59e0b" strokeWidth={2} fill="url(#colorDiskRead)" />}
                {type === 'disk' && <Area isAnimationActive={false} type="monotone" dataKey="disk_write_kbps" name="写入速度" stroke="#d97706" strokeWidth={2} fill="url(#colorDiskWrite)" />}
                <defs>
                  <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    )
  }

  const renderHistory = () => (
    <div style={{ padding: 32, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>历史数据查看</h2>
        <div style={{ display: 'flex', background: '#fff', padding: 4, borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {(['1h', '6h', '24h'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '6px 16px',
                border: 'none',
                background: range === r ? '#3b82f6' : 'transparent',
                color: range === r ? '#fff' : '#4b5563',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {r === '1h' ? '1小时' : r === '6h' ? '6小时' : '24小时'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <Section title="CPU & 内存 (%)">
          <HistoryChart data={historyData} keys={['cpu_usage', 'memory_usage']} colors={['#3b82f6', '#10b981']} unit="%" />
        </Section>
        <Section title="GPU 使用率 (%)">
          <HistoryChart data={historyData} keys={['gpu_usage']} colors={['#ef4444']} unit="%" />
        </Section>
        <Section title="网络流量 (KB/s)">
          <HistoryChart data={historyData} keys={['net_recv_kbps', 'net_sent_kbps']} colors={['#8b5cf6', '#ec4899']} unit="" />
        </Section>
        <Section title="磁盘使用率 (%)">
          <HistoryChart data={historyData} keys={['disk_usage']} colors={['#f59e0b']} unit="%" />
        </Section>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'performance': return renderPerformance()
      case 'cpu': return renderDetail('cpu')
      case 'gpu': return renderDetail('gpu')
      case 'memory': return renderDetail('memory')
      case 'disk': return renderDetail('disk')
      case 'network': return renderDetail('network')
      case 'history': return renderHistory()
      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f2f2f7', color: '#1c1c1e' }} className="monitor-app noselect">
      <Sidebar
        items={TABS}
        activeId={activeTab}
        onSelect={setActiveTab}
      />
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, subValue }: any) {
  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: 16, 
      padding: 20, 
      border: '1px solid #e5e7eb', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'grid', placeItems: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>{title}</span>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{value}</div>
        {subValue && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subValue}</div>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 13, fontWeight: 400, color: '#6c6c70', marginBottom: 8, marginLeft: 8 }}>{title.toUpperCase()}</h3>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function HistoryChart({ data, keys, colors, unit }: any) {
  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="created_at" tickFormatter={formatTime} fontSize={11} />
          <YAxis fontSize={11} unit={unit} tickLine={false} axisLine={false} />
          <Tooltip 
            labelFormatter={formatFullTime} 
            formatter={(val: any) => (typeof val === 'number' ? val.toFixed(2) : val)}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
          />
          {keys.map((key: string, i: number) => (
            <Area key={key} isAnimationActive={false} type="monotone" dataKey={key} stroke={colors[i]} strokeWidth={2} fill={`${colors[i]}10`} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
