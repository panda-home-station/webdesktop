import React from 'react'

export default function FooterCount({ count }: { count: number }) {
  return (
    <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', color: '#8e8e93', borderTop: '1px solid #f2f2f7', fontSize: 12, fontWeight: 500 }}>
      {count} 项
    </div>
  )
}
