import { useState, ReactNode } from 'react'

export interface SidebarItem {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface SidebarLayoutProps {
  items: SidebarItem[]
  defaultActiveId?: string
  sidebarWidth?: number
}

export function SidebarLayout({
  items,
  defaultActiveId,
  sidebarWidth = 240
}: SidebarLayoutProps) {
  const [activeId, setActiveId] = useState(defaultActiveId || items[0]?.id)

  const activeItem = items.find(item => item.id === activeId)

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarWidth,
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveId(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 20px',
              border: 'none',
              backgroundColor: activeId === item.id ? '#e3f2fd' : 'transparent',
              color: activeId === item.id ? '#1976d2' : '#424242',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: activeId === item.id ? 600 : 400,
              textAlign: 'left',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              ':hover': {
                backgroundColor: activeId === item.id ? '#e3f2fd' : '#f0f0f0'
              }
            }}
          >
            {item.icon && (
              <span style={{ fontSize: 20, display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#ffffff'
        }}
      >
        {activeItem?.content}
      </div>
    </div>
  )
}

export default SidebarLayout
