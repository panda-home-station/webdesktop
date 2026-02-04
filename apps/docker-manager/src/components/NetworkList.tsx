import React from 'react'
import { Network } from '../types'

interface NetworkListProps {
  networks: Network[]
}

export function NetworkList({ networks }: NetworkListProps) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>网络</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {networks.map((n, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{n.Name}</div>
              <div style={{ fontSize: 13, color: '#8e8e93', display: 'flex', gap: 8 }}>
                <span style={{ background: '#f2f2f7', padding: '2px 6px', borderRadius: 4 }}>{n.Driver}</span>
                <span style={{ fontFamily: 'monospace' }}>{n.Id.slice(0, 12)}</span>
                {n.Scope && <span>{n.Scope}</span>}
              </div>
              {n.IPAM?.Config?.length > 0 && (
                <div style={{ fontSize: 12, color: '#8e8e93' }}>
                  Subnet: {n.IPAM.Config[0].Subnet} Gateway: {n.IPAM.Config[0].Gateway}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {networks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>
          暂无网络
        </div>
      )}
    </div>
  )
}
