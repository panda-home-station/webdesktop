import { memo } from 'react'

const JobHeader = memo(() => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 140px 160px 160px 80px',
      padding: '8px 32px',
      fontSize: 10,
      fontWeight: 600,
      color: '#a0aec0',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    }}
  >
    <div>任务名称</div>
    <div>状态</div>
    <div>开始时间</div>
    <div>结束时间</div>
    <div style={{ textAlign: 'right' }}>操作</div>
  </div>
))

JobHeader.displayName = 'JobHeader'

export default JobHeader
