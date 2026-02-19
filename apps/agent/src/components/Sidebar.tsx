import React from 'react'
import { Plus, Layers, Box, Settings, ChevronLeft, ChevronRight, Trash2, History, PanelLeft } from 'lucide-react'
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
  const [isHistoryExpanded, setIsHistoryExpanded] = React.useState(true)

  return (
    <div style={{
      width: isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
      flexShrink: 0,
      transition: isInitial ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      borderRight: '1px solid rgba(0, 0, 0, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f7',
      zIndex: 10,
      boxSizing: 'border-box',
      userSelect: 'none'
    }}>
      <div className="custom-scrollbar" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 4, 
          marginBottom: 24, 
          marginTop: 8,
          width: '100%',
          alignItems: 'stretch'
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
                padding: '4px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 12,
                color: '#666',
                transition: 'all 0.2s',
                width: '100%',
                height: '40px',
                minWidth: 0,
                maxWidth: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 8, 
                background: 'rgba(255, 255, 255, 0.5)', 
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

          <div style={{ 
            height: 1, 
            backgroundColor: 'rgba(0, 0, 0, 0.08)', 
            margin: '8px auto',
            width: isSidebarOpen ? 'calc(100% - 24px)' : '24px'
          }} />

          <div 
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            title={!isSidebarOpen ? '对话历史' : ''}
            style={{
              padding: '4px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 12,
              color: '#666',
              transition: 'all 0.2s',
              width: '100%',
              height: '40px',
              minWidth: 0,
              maxWidth: '100%',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 8, 
              background: 'rgba(255, 255, 255, 0.5)', 
              color: '#666',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}>
              <History size={16} />
            </div>
            {isSidebarOpen && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>对话历史</div>
                <div style={{ 
                  transform: isHistoryExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <ChevronRight size={14} />
                </div>
              </div>
            )}
          </div>
        </div>

        {isSidebarOpen && isHistoryExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {history.map(session => (
              <div 
                key={session.id}
                onClick={() => loadSession(session.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 12,
                  backgroundColor: selectedSessionId === session.id ? '#fff' : 'transparent',
                  boxShadow: selectedSessionId === session.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  border: '1px solid',
                  borderColor: selectedSessionId === session.id ? '#eee' : 'transparent',
                  transition: 'all 0.2s',
                  width: '100%',
                  height: 'auto',
                  minWidth: 0,
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={e => {
                  if (selectedSessionId !== session.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                  }
                }}
                onMouseLeave={e => {
                  if (selectedSessionId !== session.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
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
              </div>
            ))}
          </div>
        )}
        <style dangerouslySetInnerHTML={{ __html: `
          .delete-btn { opacity: 0; }
          div:hover > .delete-btn { opacity: 1; }
          /* Ensure the parent div hover triggers the child's opacity */
          div[style*="cursor: pointer"]:hover .delete-btn { opacity: 1; }
        `}} />
      </div>

      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(0, 0, 0, 0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div 
          onClick={() => setIsSettingsOpen(true)}
          style={{
            padding: '4px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
            color: '#666',
            width: '100%',
            height: '40px',
            minWidth: 0,
            maxWidth: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            background: 'rgba(255, 255, 255, 0.5)', 
            color: '#666',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}>
            <Settings size={18} />
          </div>
          {isSidebarOpen && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>设置</div>
            </div>
          )}
        </div>

        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            padding: '4px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
            color: '#666',
            width: '100%',
            height: '40px',
            minWidth: 0,
            maxWidth: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            background: 'rgba(255, 255, 255, 0.5)', 
            color: '#666',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}>
            <PanelLeft size={18} />
          </div>
          {isSidebarOpen && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isSidebarOpen ? '收起目录' : '展开目录'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
