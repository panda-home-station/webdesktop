import React from 'react'
import { Plus, Layers, Box, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { Agent } from '../types'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, MOCK_AGENTS } from '../constants'

interface SidebarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  setIsWorkspaceOpen: (open: boolean) => void
  setIsSettingsOpen: (open: boolean) => void
  selectedAgent: Agent
  setSelectedAgent: (agent: Agent) => void
  setMessages: (messages: any[]) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  setIsWorkspaceOpen,
  setIsSettingsOpen,
  selectedAgent,
  setSelectedAgent,
  setMessages
}) => {
  return (
    <div style={{
      width: isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
      flexShrink: 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      borderRight: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafafa',
      zIndex: 10
    }}>
      <div className="custom-scrollbar" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: isSidebarOpen ? '12px' : '12px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSidebarOpen ? 'stretch' : 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 4, 
          marginBottom: 24, 
          marginTop: 8,
          width: '100%',
          alignItems: isSidebarOpen ? 'stretch' : 'center'
        }}>
          {[
            { id: 'new-chat', name: '新建会话', icon: <Plus size={16} />, action: () => setMessages([]) },
            { id: 'workspace', name: '工作空间', icon: <Layers size={16} />, action: () => setIsWorkspaceOpen(true) },
            { id: 'app-center', name: '应用中心', icon: <Box size={16} />, action: () => {} },
          ].map(item => (
            <div 
              key={item.id}
              onClick={item.action}
              title={!isSidebarOpen ? item.name : ''}
              style={{
                padding: isSidebarOpen ? '0 12px' : '0',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                gap: isSidebarOpen ? 12 : 0,
                color: '#555',
                transition: 'all 0.2s',
                width: isSidebarOpen ? 'auto' : '40px',
                height: '40px',
                whiteSpace: 'nowrap',
                minWidth: isSidebarOpen ? SIDEBAR_EXPANDED - 24 : 'auto'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 8, 
                background: '#eee', 
                color: '#666',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}>
                {item.icon}
              </div>
              {isSidebarOpen && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{item.name}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {isSidebarOpen && (
          <div style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: '#999', 
            padding: '0 12px', 
            marginBottom: 12, 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            minWidth: SIDEBAR_EXPANDED - 24
          }}>
            智能代理
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MOCK_AGENTS.map(agent => (
            <div 
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              title={!isSidebarOpen ? agent.name : ''}
              style={{
                padding: isSidebarOpen ? '8px 12px' : '0',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                gap: 12,
                backgroundColor: selectedAgent.id === agent.id ? '#fff' : 'transparent',
                boxShadow: selectedAgent.id === agent.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                border: '1px solid',
                borderColor: selectedAgent.id === agent.id ? '#eee' : 'transparent',
                transition: 'all 0.2s',
                width: isSidebarOpen ? 'auto' : '40px',
                height: isSidebarOpen ? 'auto' : '40px',
                whiteSpace: 'nowrap',
                minWidth: isSidebarOpen ? SIDEBAR_EXPANDED - 24 : 'auto'
              }}
            >
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 10, 
                background: selectedAgent.id === agent.id ? '#f0f7ff' : '#eee', 
                color: selectedAgent.id === agent.id ? '#3b82f6' : '#666',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {agent.icon}
              </div>
              {isSidebarOpen && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 2, whiteSpace: 'nowrap' }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.description}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div 
          onClick={() => setIsSettingsOpen(true)}
          style={{
            padding: isSidebarOpen ? '8px 12px' : '8px 0',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            gap: 12,
            color: '#666',
            whiteSpace: 'nowrap',
            minWidth: isSidebarOpen ? SIDEBAR_EXPANDED - 24 : 'auto'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Settings size={18} />
          {isSidebarOpen && <span style={{ fontSize: 13, fontWeight: 500 }}>设置</span>}
        </div>
      </div>
    </div>
  )
}
