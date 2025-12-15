import React, { useEffect, useState } from 'react'
import { subscribe } from '../sdk/notify'

export default function Notifications() {
  const [items, setItems] = useState<{ id: number; message: string }[]>([])
  useEffect(() => {
    const unsub = subscribe((msg) => {
      const id = Date.now()
      setItems((x) => [...x, { id, message: msg }])
      setTimeout(() => {
        setItems((x) => x.filter((i) => i.id !== id))
      }, 3000)
    })
    return () => unsub()
  }, [])
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 56, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999 }}>
      {items.map((i) => (
        <div key={i.id} className="puter-window" style={{ padding: '8px 12px' }}>
          {i.message}
        </div>
      ))}
    </div>
  )
}
