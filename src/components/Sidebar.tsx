import React from 'react'

export interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
  onClick?: () => void
}

interface SidebarProps {
  items?: SidebarItem[]
  sections?: { title: string; items: SidebarItem[] }[]
  activeId: string
  onSelect?: (id: string) => void
  width?: number | string
  className?: string
  style?: React.CSSProperties
}

export function Sidebar({ items, sections, activeId, onSelect, width = 220, style, className }: SidebarProps) {
  return (
    <div
      className={className}
      style={{
        width,
        borderRight: '1px solid #e5e7eb',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        ...style
      }}
    >
      <div style={{ flex: 1, padding: 8, overflowY: 'auto' }}>
        {Array.isArray(sections) && sections.length > 0 ? (
          sections.map((section, si) => (
            <div key={`sec-${si}`} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>{section.title}</div>
              {section.items.map(item => {
                const isActive = activeId === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.onClick) item.onClick()
                      else if (onSelect) onSelect(item.id)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: isActive ? '#e5e7eb' : 'transparent',
                      color: isActive ? '#111827' : '#374151',
                      fontWeight: isActive ? 500 : 400,
                      marginBottom: 2,
                      fontSize: 14,
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.icon && (
                      <span style={{
                        fontSize: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        opacity: isActive ? 1 : 0.7
                      }}>
                        {item.icon}
                      </span>
                    )}
                    <span style={{ height: 24, display: 'flex', alignItems: 'center' }}>{item.label}</span>
                    {item.badge ? (
                      <span style={{
                        marginLeft: 'auto',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 600,
                        lineHeight: '14px'
                      }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))
        ) : (
          (items ?? []).map(item => {
            const isActive = activeId === item.id
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.onClick) item.onClick()
                  else if (onSelect) onSelect(item.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: isActive ? '#e5e7eb' : 'transparent',
                  color: isActive ? '#111827' : '#374151',
                  fontWeight: isActive ? 500 : 400,
                  marginBottom: 2,
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
              >
                {item.icon && (
                  <span style={{
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    opacity: isActive ? 1 : 0.7
                  }}>
                    {item.icon}
                  </span>
                )}
                <span style={{ height: 24, display: 'flex', alignItems: 'center' }}>{item.label}</span>
                    {item.badge ? (
                      <span style={{
                        marginLeft: 'auto',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 600,
                        lineHeight: '14px'
                      }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
            )
          })
        )}
      </div>
    </div>
  )
}
