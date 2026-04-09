import { Section, Row } from './shared'

export function StorageOverview() {
  return (
    <div>
      <Section title="存储概览">
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>已用 1.2 TB</span>
            <span style={{ fontSize: 15, color: '#8e8e93' }}>共 4.0 TB</span>
          </div>
          <div style={{ height: 16, background: '#e5e5ea', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: '30%', height: '100%', background: '#007aff' }} />
            <div style={{ width: '20%', height: '100%', background: '#34c759' }} />
            <div style={{ width: '15%', height: '100%', background: '#ff9500' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, fontSize: 13, color: '#6c6c70', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#007aff' }} /> 文档 (30%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34c759' }} /> 图片 (20%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff9500' }} /> 视频 (15%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e5ea' }} /> 空闲 (35%)
            </div>
          </div>
        </div>
      </Section>

      <Section title="建议">
        <Row label="清理重复文件" onClick={() => {}} />
        <Row label="优化存储空间" onClick={() => {}} border={false} />
      </Section>
    </div>
  )
}
