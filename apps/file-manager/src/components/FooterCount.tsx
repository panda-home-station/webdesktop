import React from 'react'

export default function FooterCount({ count }: { count: number }) {
  return (
    <div style={{ height: 32, display: 'flex', alignItems: 'center', padding: '0 8px', color: '#6b7280', borderTop: '1px solid #e5e7eb', fontSize: 14 }}>
      共 {count} 项
    </div>
  )
}
