import React, { useEffect, useState, useCallback, memo, useRef } from 'react'
import axios from 'axios'
import { Cpu, HardDrive, Network, MemoryStick as MemoryIcon, Activity, Calendar, Monitor as GpuIcon } from 'lucide-react'
import { Sidebar } from '../../../src/components/Sidebar'
import { subscribeDragging, subscribeAnimating, subscribeLauncherOpen } from '../../../src/sdk/desktop'

// 简单的事件发射器，用于解耦数据更新和组件渲染
class EventEmitter {
  private listeners: { [key: string]: Function[] } = {}
  on(event: string, listener: Function) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(listener)
    return () => this.off(event, listener)
  }
  off(event: string, listener: Function) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(l => l !== listener)
  }
  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(l => l(...args))
  }
}

// 全局状态管理器，避免 React 频繁的 top-level re-render
class StatsStore extends EventEmitter {
  private history: Stats[] = []
  private current: Stats | null = null
  private timer: any = null

  getHistory() { return this.history }
  getCurrent() { return this.current }

  async fetch() {
    try {
      const res = await axios.get('/api/system/stats')
      const stats = res.data
      this.current = stats
      this.history.push(stats)
      if (this.history.length > 60) this.history.shift() // 保留最近 60 个点，增加到 2 分钟数据
      this.emit('update', { current: this.current, history: this.history })
    } catch (e) {
      console.error('Failed to fetch stats', e)
    }
  }

  start() {
    this.fetch()
    this.timer = setInterval(() => this.fetch(), 2000)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
  }
}

const statsStore = new StatsStore()

// 高性能 Canvas 绘图组件
const CanvasAreaChart = memo(({ 
  data: initialData, 
  keys, 
  colors, 
  domain = [0, 100], 
  height = 180,
  useStore = false 
}: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<any[]>(initialData || [])
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 })
  const gradientCache = useRef<{ [key: string]: CanvasGradient }>({})
  const isDraggingRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const isLauncherOpenRef = useRef(false)
  const resizeTimeoutRef = useRef<any>(null)

  useEffect(() => {
    const unsubDrag = subscribeDragging(dragging => {
      isDraggingRef.current = dragging
      if (!dragging) requestAnimationFrame(draw)
    })
    const unsubAnim = subscribeAnimating(animating => {
      isAnimatingRef.current = animating
      if (!animating) requestAnimationFrame(draw)
    })
    const unsubLauncher = subscribeLauncherOpen(isOpen => {
      isLauncherOpenRef.current = isOpen
      if (!isOpen) requestAnimationFrame(draw)
    })
    return () => {
      unsubDrag()
      unsubAnim()
      unsubLauncher()
    }
  }, [])

  const draw = useCallback(() => {
    // Launcher 打开时停止绘制，因为 30px 全屏模糊在有后台渲染时对 GPU 压力极大
    if (isLauncherOpenRef.current) return 
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) return

    const { width, height: h, dpr } = dimensionsRef.current
    if (width === 0 || h === 0) return
    
    if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
      canvas.width = width * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
      gradientCache.current = {}
    }

    // 拖拽或动画期间使用简化绘制逻辑 (不使用渐变填充，仅绘制折线)
    const isSimplified = isDraggingRef.current || isAnimatingRef.current

    // 1. 清除画布
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, h)

    const data = dataRef.current
    const len = data.length
    if (!data || len < 2) return

    // 2. Domain 计算
    let currentDomain = domain
    if (domain[1] === 1000) {
      let maxVal = 10
      for (let i = 0; i < len; i++) {
        for (let j = 0; j < keys.length; j++) {
          const val = data[i][keys[j]] || 0
          if (val > maxVal) maxVal = val
        }
      }
      currentDomain = [0, maxVal * 1.2]
    }

    const range = currentDomain[1] - currentDomain[0]

    // 3. 绘制循环
    keys.forEach((key: string, index: number) => {
      const color = colors[index]
      
      // 仅在非简化状态下绘制填充区域 (渐变非常耗性能)
      if (!isSimplified) {
        const gradientKey = `${color}-${h}`
        if (!gradientCache.current[gradientKey]) {
          const gradient = ctx.createLinearGradient(0, 0, 0, h)
          gradient.addColorStop(0, `${color}33`)
          gradient.addColorStop(1, `${color}00`)
          gradientCache.current[gradientKey] = gradient
        }

        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let i = 0; i < len; i++) {
          const val = data[i][key] ?? 0
          const x = (i / (len - 1)) * width
          const y = h - ((val - currentDomain[0]) / range) * h
          ctx.lineTo(x, y)
        }
        ctx.lineTo(width, h)
        ctx.closePath()
        ctx.fillStyle = gradientCache.current[gradientKey]
        ctx.fill()
      }

      // 始终绘制折线
      ctx.beginPath()
      for (let i = 0; i < len; i++) {
        const val = data[i][key] ?? 0
        const x = (i / (len - 1)) * width
        const y = h - ((val - currentDomain[0]) / range) * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = color
      ctx.lineWidth = isSimplified ? 1 : 2 // 简化模式下线宽变细，进一步减小渲染压力
      ctx.lineJoin = 'round'
      ctx.stroke()
    })
  }, [keys, colors, domain])

  // 处理数据更新
  useEffect(() => {
    if (useStore) {
      return statsStore.on('update', ({ history }: any) => {
        dataRef.current = history
        requestAnimationFrame(draw)
      })
    } else {
      dataRef.current = initialData
      requestAnimationFrame(draw)
    }
  }, [useStore, initialData, draw])

  // 处理尺寸变化
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect()
      dimensionsRef.current = {
        width: rect.width,
        height: rect.height,
        dpr: window.devicePixelRatio || 1
      }
      
      // 初始时，如果数据还没加载，先画一个白底，避免黑屏
      requestAnimationFrame(draw)

      // 防抖：如果在动画中，不立即触发重绘，避免掉帧
      if (isAnimatingRef.current) return

      if (resizeTimeoutRef.current) cancelAnimationFrame(resizeTimeoutRef.current)
      resizeTimeoutRef.current = requestAnimationFrame(draw)
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(canvas)
    updateDimensions() // 初始化尺寸

    return () => resizeObserver.disconnect()
  }, [draw])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', contain: 'strict' }} />
})

interface Stats {
  cpu_usage: number
  memory_usage: number
  gpu_usage: number | null
  gpu_memory_usage: number | null
  net_recv_kbps: number
  net_sent_kbps: number
  disk_usage: number
  disk_read_kbps?: number
  disk_write_kbps?: number
  created_at: string
}

const formatBytes = (kb: number) => {
  if (kb === 0) return '0 KB'
  const k = 1024
  const sizes = ['KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(kb) / Math.log(k))
  if (i < 0) return kb.toFixed(2) + ' KB'
  return parseFloat((kb / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (kbps: number) => {
  return formatBytes(kbps) + '/s'
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
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

const Section = memo(({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div style={{ marginBottom: 24, contain: 'content' }}>
      <h3 style={{ fontSize: 13, fontWeight: 400, color: '#6c6c70', marginBottom: 8, marginLeft: 8 }}>{title.toUpperCase()}</h3>
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        border: '1px solid #e5e7eb', 
        padding: 20, 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        contain: 'layout'
      }}>
        {children}
      </div>
    </div>
  )
})

// 专门用于显示实时数值的组件，避免上层组件 re-render
const StatsValue = memo(({ formatter, dataKey }: { formatter: (v: any) => string, dataKey: string }) => {
  const [value, setValue] = useState('0')

  useEffect(() => {
    return statsStore.on('update', ({ current }: any) => {
      if (current) {
        setValue(formatter(current[dataKey]))
      }
    })
  }, [formatter, dataKey])

  return <span style={{ fontSize: 24, fontWeight: 600, color: '#3a3a3c' }}>{value}</span>
})

// 双数值显示组件
const DualStatsValue = memo(({ name1, name2, dataKey1, dataKey2, formatter }: { name1: string, name2: string, dataKey1: string, dataKey2: string, formatter: (v: any) => string }) => {
  const [values, setValues] = useState({ v1: '0', v2: '0' })

  useEffect(() => {
    return statsStore.on('update', ({ current }: any) => {
      if (current) {
        setValues({
          v1: formatter(current[dataKey1]),
          v2: formatter(current[dataKey2])
        })
      }
    })
  }, [dataKey1, dataKey2, formatter])

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#8e8e93' }}>{name1}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#3a3a3c' }}>{values.v1}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#8e8e93' }}>{name2}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#3a3a3c' }}>{values.v2}</div>
      </div>
    </div>
  )
})

const HistoryChart = memo(({ data, keys, colors, unit }: any) => {
  const isSpeed = unit === 'speed'
  const maxVal = Math.max(...data.map((d: any) => Math.max(...keys.map((k: string) => d[k] || 0))), 1)
  const domain: [number, number] = [0, isSpeed ? maxVal * 1.1 : 100]

  return (
    <div style={{ height: 240, position: 'relative' }}>
      {/* 简易背景网格 */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ borderBottom: '1px solid #f3f4f6', height: 0, width: '100%' }} />
        ))}
      </div>
      <CanvasAreaChart 
        data={data} 
        keys={keys} 
        colors={colors} 
        domain={domain}
      />
      {/* Y 轴数值展示 */}
      <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: '#8e8e93', pointerEvents: 'none' }}>
        <span>{isSpeed ? formatSpeed(domain[1]) : '100%'}</span>
        <span>{isSpeed ? formatSpeed(domain[1] * 0.5) : '50%'}</span>
        <span>0</span>
      </div>
    </div>
  )
})

const PerformanceChart = memo(({ title, icon: Icon, color, dataKey }: any) => {
  return (
    <Section title={title}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <StatsValue dataKey={dataKey} formatter={(v) => typeof v === 'number' ? `${v.toFixed(2)}%` : '0.00%'} />
        <Icon size={20} color={color} />
      </div>
      <div style={{ height: 180 }}>
        <CanvasAreaChart 
          keys={[dataKey]} 
          colors={[color]} 
          useStore={true}
        />
      </div>
    </Section>
  )
})

const DualPerformanceChart = memo(({ title, icon: Icon, dataKey1, dataKey2, name1, name2, color1, color2, unit }: any) => {
  const formatter = unit === 'speed' ? formatSpeed : (v: any) => typeof v === 'number' ? `${v.toFixed(2)}%` : 'N/A'
  
  return (
    <Section title={title}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <DualStatsValue 
          name1={name1} 
          name2={name2} 
          dataKey1={dataKey1} 
          dataKey2={dataKey2} 
          formatter={formatter} 
        />
        <Icon size={20} color={color1} />
      </div>
      <div style={{ height: 180 }}>
        <CanvasAreaChart 
          keys={[dataKey1, dataKey2]} 
          colors={[color1, color2]} 
          domain={unit === 'speed' ? [0, 1000] : [0, 100]} // 速度类动态 domain 在 Canvas 组件内部处理或在此处设置一个合理默认值
          useStore={true}
        />
      </div>
    </Section>
  )
})

const PerformanceView = memo(() => (
  <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', contain: 'layout' }}>
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
      <PerformanceChart 
        title="处理器 (CPU)" 
        icon={Cpu} 
        color="#3b82f6" 
        dataKey="cpu_usage" 
      />
      <DualPerformanceChart 
        title="图形处理器 (GPU)" 
        icon={GpuIcon} 
        dataKey1="gpu_usage" 
        dataKey2="gpu_memory_usage" 
        name1="使用率" 
        name2="显存" 
        color1="#ef4444" 
        color2="#a855f7" 
      />
      <PerformanceChart 
        title="内存 (Memory)" 
        icon={MemoryIcon} 
        color="#10b981" 
        dataKey="memory_usage" 
      />
      <DualPerformanceChart 
        title="磁盘读写 (Disk I/O)" 
        icon={HardDrive} 
        dataKey1="disk_read_kbps" 
        dataKey2="disk_write_kbps" 
        name1="读取" 
        name2="写入" 
        color1="#f59e0b" 
        color2="#d97706" 
        unit="speed"
      />
      <DualPerformanceChart 
        title="网络速度 (Network)" 
        icon={Network} 
        dataKey1="net_recv_kbps" 
        dataKey2="net_sent_kbps" 
        name1="下载" 
        name2="上传" 
        color1="#8b5cf6" 
        color2="#ec4899" 
        unit="speed"
      />
    </div>
  </div>
))

const DetailView = memo(({ type }: { type: 'cpu' | 'memory' | 'disk' | 'network' | 'gpu' }) => {
  const config = {
    cpu: { keys: ['cpu_usage'], name: 'CPU 使用率', colors: ['#3b82f6'], isSpeed: false },
    gpu: { keys: ['gpu_usage', 'gpu_memory_usage'], name: 'GPU 详情', colors: ['#ef4444', '#a855f7'], isSpeed: false },
    memory: { keys: ['memory_usage'], name: '内存 使用率', colors: ['#10b981'], isSpeed: false },
    disk: { keys: ['disk_read_kbps', 'disk_write_kbps'], name: '磁盘 吞吐量', colors: ['#f59e0b', '#d97706'], isSpeed: true },
    network: { keys: ['net_recv_kbps', 'net_sent_kbps'], name: '网络 流量', colors: ['#8b5cf6', '#ec4899'], isSpeed: true }
  }[type]

  return (
    <div style={{ padding: 32, height: '100%', boxSizing: 'border-box', maxWidth: 1200, margin: '0 auto', contain: 'layout' }}>
      <Section title={`${config.name}`}>
        <div style={{ height: 400, position: 'relative' }}>
          {/* 简易背景网格 */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ borderBottom: '1px solid #f3f4f6', height: 0, width: '100%' }} />
            ))}
          </div>
          <CanvasAreaChart 
            keys={config.keys} 
            colors={config.colors} 
            domain={config.isSpeed ? [0, 1000] : [0, 100]}
            useStore={true}
          />
        </div>
      </Section>
    </div>
  )
})

const HistoryView = memo(({ historyData, range, setRange }: { historyData: Stats[]; range: '1h' | '6h' | '24h'; setRange: (r: '1h' | '6h' | '24h') => void }) => (
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
        <HistoryChart data={historyData} keys={['net_recv_kbps', 'net_sent_kbps']} colors={['#8b5cf6', '#ec4899']} unit="speed" />
      </Section>
      <Section title="磁盘使用率 (%)">
        <HistoryChart data={historyData} keys={['disk_usage']} colors={['#f59e0b']} unit="%" />
      </Section>
    </div>
  </div>
))

export default function MonitorApp() {
  const [activeTab, setActiveTab] = useState('performance')
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState<'1h' | '6h' | '24h'>('1h')
  const [historyData, setHistoryData] = useState<Stats[]>([])

  // 订阅实时数据更新，仅启动和停止 store，不触发当前组件 re-render
  useEffect(() => {
    statsStore.start()
    return () => {
      statsStore.stop()
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
      setHistoryData(res.data.reverse())
    } catch (e) {
      console.error('Failed to fetch history', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(range)
    }
  }, [activeTab, range, fetchHistory])

  const renderContent = () => {
    switch (activeTab) {
      case 'performance': return <PerformanceView />
      case 'cpu': return <DetailView type="cpu" />
      case 'gpu': return <DetailView type="gpu" />
      case 'memory': return <DetailView type="memory" />
      case 'disk': return <DetailView type="disk" />
      case 'network': return <DetailView type="network" />
      case 'history': return <HistoryView historyData={historyData} range={range} setRange={setRange} />
      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f2f2f7', color: '#1c1c1e', contain: 'strict' }} className="monitor-app noselect">
      <Sidebar
        items={TABS}
        activeId={activeTab}
        onSelect={setActiveTab}
      />
      
      <div style={{ flex: 1, overflowY: 'auto', background: '#f2f2f7' }}>
        {renderContent()}
      </div>
    </div>
  )
}