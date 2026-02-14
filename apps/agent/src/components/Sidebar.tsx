import React from 'react'
import { Plus, Layers, Box, Settings, ChevronLeft, ChevronRight, MessageSquare, Trash2 } from 'lucide-react'
import { Agent, ChatSession } from '../types'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, MOCK_AGENTS } from '../constants'

interface SidebarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  toggleWorkspace: () => void
  setIsSettingsOpen: (open: boolean) => void
  selectedAgent: Agent
  setSelectedAgent: (agent: Agent) => void
  setMessages: (messages: any[]) => void
  history: ChatSession[]
  selectedSessionId: string | null
  loadSession: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
  createNewChat: () => void
  isInitial?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  toggleWorkspace,
  setIsSettingsOpen,
  selectedAgent,
  setSelectedAgent,
  setMessages,
  history,
  selectedSessionId,
  loadSession,
  onDeleteSession,
  createNewChat,
  isInitial
}) => {
  return (
    <div style={{
      width: isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
      flexShrink: 0,
      transition: isInitial ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      borderRight: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafafa',
      zIndex: 10,
      boxSizing: 'border-box',
      userSelect: 'none'
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
            { id: 'new-chat', name: '新建会话', icon: <Plus size={16} />, action: createNewChat },
            { id: 'workspace', name: '工作空间', icon: <Layers size={16} />, action: toggleWorkspace },
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
                color: '#666',
                transition: 'all 0.2s',
                width: isSidebarOpen ? '100%' : '40px',
                height: '40px',
                minWidth: 0,
                maxWidth: isSidebarOpen ? SIDEBAR_EXPANDED - 24 : '40px',
                overflow: 'hidden',
                boxSizing: 'border-box'
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
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
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
            对话历史
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {history.map(session => (
            <div 
              key={session.id}
              onClick={() => loadSession(session.id)}
              title={!isSidebarOpen ? session.title : ''}
              style={{
                padding: isSidebarOpen ? '8px 12px' : '0',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                gap: 12,
                backgroundColor: selectedSessionId === session.id ? '#fff' : 'transparent',
                boxShadow: selectedSessionId === session.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                border: '1px solid',
                borderColor: selectedSessionId === session.id ? '#eee' : 'transparent',
                transition: 'all 0.2s',
                width: isSidebarOpen ? '100%' : '40px',
                height: isSidebarOpen ? 'auto' : '40px',
                minWidth: 0,
                maxWidth: isSidebarOpen ? SIDEBAR_EXPANDED - 24 : '40px',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 10, 
                background: selectedSessionId === session.id ? '#f0f7ff' : '#eee', 
                color: selectedSessionId === session.id ? '#3b82f6' : '#666',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MessageSquare size={16} />
              </div>
              {isSidebarOpen && (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#666', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.title}</div>
                    <div style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.lastMessage}</div>
                  </div>
                  <div 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession?.(session.id);
                    }}
                    style={{
                      padding: 4,
                      borderRadius: 4,
                      color: '#999',
                      opacity: 0,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#999';
                    }}
                  >
                    <Trash2 size={14} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .delete-btn { opacity: 0; }
          div:hover > .delete-btn { opacity: 1; }
          /* Ensure the parent div hover triggers the child's opacity */
          div[style*="cursor: pointer"]:hover .delete-btn { opacity: 1; }
        `}} />
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
            width: isSidebarOpen ? '100%' : '40px',
            minWidth: 0,
            maxWidth: isSidebarOpen ? SIDEBAR_EXPANDED - 24 : '40px',
            overflow: 'hidden',
            boxSizing: 'border-box'
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
