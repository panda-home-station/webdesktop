import React, { useState, ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface TabsLayoutProps {
  items: TabItem[]
  defaultActiveId?: string
  tabPosition?: 'top' | 'bottom'
}

export function TabsLayout({
  items,
  defaultActiveId,
  tabPosition = 'top'
}: TabsLayoutProps) {
  const [activeId, setActiveId] = useState(defaultActiveId || items[0]?.id)

  const activeItem = items.find(item => item.id === activeId)

  const tabsElement = (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '8px 16px',
        backgroundColor: '#f8f9fa',
        borderBottom: tabPosition === 'top' ? '1px solid #e0e0e0' : undefined,
        borderTop: tabPosition === 'bottom' ? '1px solid #e0e0e0' : undefined
      }}
    >
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveId(item.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            border: activeId === item.id ? '1px solid #e0e0e0' : '1px solid transparent',
            borderRadius: 8,
            backgroundColor: activeId === item.id ? '#ffffff' : 'transparent',
            color: activeId === item.id ? '#1976d2' : '#424242',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeId === item.id ? 600 : 400,
            boxShadow: activeId === item.id ? '0 2px 4px rgba(0,0,0,0.05)' : undefined,
            transition: 'all 0.15s ease',
            ':hover': {
              backgroundColor: activeId === item.id ? '#ffffff' : '#f0f0f0'
            }
          }}
        >
          {item.icon && (
            <span style={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )

  const contentElement = (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#ffffff',
        padding: 20
      }}
    >
      {activeItem?.content}
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: tabPosition === 'top' ? 'column' : 'column-reverse',
        height: '100%',
        width: '100%'
      }}
    >
      {tabsElement}
      {contentElement}
    </div>
  )
}

export default TabsLayout
