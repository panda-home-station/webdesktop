import React from 'react'
import { Send, Globe, Box, Terminal } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isLoading?: boolean
  isCompact?: boolean
  placeholder?: string
  showTools?: boolean
  showActionBar?: boolean
  selectedTools?: string[]
  onToggleTool?: (toolId: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  containerStyles?: React.CSSProperties
  inputStyles?: React.CSSProperties
  wrapperStyles?: React.CSSProperties
  autoFocus?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  isLoading = false,
  isCompact = false,
  placeholder = "输入您的问题...",
  showTools = false,
  showActionBar = true,
  selectedTools = [],
  onToggleTool,
  onKeyDown,
  containerStyles = {},
  inputStyles = {},
  wrapperStyles = {},
  autoFocus = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e)
    }
    
    if (e.defaultPrevented) return

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const defaultContainerStyles: React.CSSProperties = isCompact ? {
    display: 'flex',
    gap: 8,
    background: '#f9fafb',
    padding: '4px 4px 4px 12px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    alignItems: 'center',
    ...containerStyles
  } : {
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    border: '1px solid #eee',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    ...containerStyles
  }

  return (
    <div style={{ 
      padding: isCompact ? '16px' : '0 24px 24px', 
      backgroundColor: '#fff',
      ...wrapperStyles 
    }}>
      <div style={{ 
        maxWidth: isCompact ? 'none' : 'min(92%, 800px)', 
        margin: '0 auto',
        position: 'relative' 
      }}>
        <div style={defaultContainerStyles}>
          {isCompact ? (
            <>
              <input
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  padding: '8px 0',
                  color: '#1f2937',
                  ...inputStyles
                }}
              />
              <button
                onClick={onSend}
                disabled={!value.trim() || isLoading}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: value.trim() && !isLoading ? '#3b82f6' : '#e5e7eb',
                  color: '#fff',
                  border: 'none',
                  cursor: value.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
              </button>
            </>
          ) : (
            <>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  padding: '8px 12px',
                  outline: 'none',
                  color: '#1a1a1a',
                  boxSizing: 'border-box',
                  overflowY: 'auto',
                  minHeight: 24,
                  maxHeight: 200,
                  ...inputStyles
                }}
                rows={Math.min(5, value.split('\n').length || 1)}
              />
              {showActionBar && (
                <div style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '8px 0 0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: 12, 
                    color: '#999',
                    overflow: 'hidden',
                    flexShrink: 1 
                  }}>
                    {showTools && (
                      <>
                        <Globe 
                          size={18} 
                          style={{ 
                            cursor: 'pointer', 
                            flexShrink: 0,
                            color: selectedTools.includes('web_search') ? '#3b82f6' : '#999' 
                          }} 
                          onClick={() => onToggleTool?.('web_search')}
                          title="联网搜索"
                        />
                        <Box 
                          size={18} 
                          style={{ 
                            cursor: 'pointer', 
                            flexShrink: 0,
                            color: selectedTools.includes('file_system') ? '#3b82f6' : '#999' 
                          }} 
                          onClick={() => onToggleTool?.('file_system')}
                          title="文件系统"
                        />
                        <Terminal 
                          size={18} 
                          style={{ 
                            cursor: 'pointer', 
                            flexShrink: 0,
                            color: selectedTools.includes('terminal') ? '#3b82f6' : '#999' 
                          }} 
                          onClick={() => onToggleTool?.('terminal')}
                          title="终端执行"
                        />
                      </>
                    )}
                  </div>
                  {isLoading && onStop ? (
                    <button
                      onClick={onStop}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: '#ff4d4f',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <div style={{ width: 12, height: 12, backgroundColor: '#fff', borderRadius: 2 }}></div>
                    </button>
                  ) : (
                    <button
                      onClick={onSend}
                      disabled={!value.trim()}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: !value.trim() ? '#f0f0f0' : '#000',
                        color: '#fff',
                        border: 'none',
                        cursor: !value.trim() ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
