import React from 'react'
import { Bot, User, Globe, Box, Terminal, ChevronRight, CheckCircle2, Brain } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { Message, WorkspaceContent } from '../types'

interface MessageItemProps {
  message: Message
  isCompact?: boolean
  userStyles?: React.CSSProperties
  assistantStyles?: React.CSSProperties
  avatarStyles?: React.CSSProperties
  showToolCalls?: boolean
  availableTools?: { id: string; name: string }[]
  onShowDetail?: (content: WorkspaceContent) => void
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCompact = false,
  userStyles = {},
  assistantStyles = {},
  avatarStyles = {},
  showToolCalls = true,
  availableTools = [],
  onShowDetail
}) => {
  const isUser = message.role === 'user'
  
  const defaultUserStyles: React.CSSProperties = {
    backgroundColor: '#e3f2fd',
    color: '#1a73e8',
    borderRadius: '12px 2px 12px 12px',
    padding: '8px 12px',
    fontSize: '15px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    border: '1px solid #bbdefb',
    ...userStyles
  }

  const defaultAssistantStyles: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    borderRadius: '2px 12px 12px 12px',
    padding: '8px 12px',
    fontSize: '15px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    ...assistantStyles
  }

  const currentStyles = isUser ? defaultUserStyles : defaultAssistantStyles

  return (
    <div style={{
      display: 'flex',
      gap: isCompact ? 10 : 12,
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      marginBottom: isCompact ? 16 : 32,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        width: isCompact ? 28 : 32,
        height: isCompact ? 28 : 32,
        borderRadius: isCompact ? 8 : 10,
        backgroundColor: isUser ? (isCompact ? '#3b82f6' : '#000') : (isCompact ? '#f3f4f6' : '#f0f7ff'),
        color: isUser ? '#fff' : '#3b82f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: isCompact ? 2 : 4,
        ...avatarStyles
      }}>
        {isUser ? <User size={isCompact ? 16 : 16} /> : <Bot size={isCompact ? 16 : 16} />}
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 8, 
        maxWidth: isCompact ? '80%' : '85%',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        lineHeight: '1.5'
      }}>
        {/* Thinking Process Section */}
        {message.thoughts && message.thoughts.length > 0 && (
          <div 
            onClick={() => onShowDetail?.({ type: 'thinking', content: message.thoughts || [] })}
            style={{
              fontSize: '13px',
              color: '#666',
              backgroundColor: '#f8f9fa',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '8px',
              border: '1px solid #e0e0e0',
              width: '100%',
              boxSizing: 'border-box',
              cursor: onShowDetail ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (onShowDetail) {
                e.currentTarget.style.backgroundColor = '#f0f4f8'
                e.currentTarget.style.borderColor = '#d1d5db'
              }
            }}
            onMouseLeave={(e) => {
              if (onShowDetail) {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
                e.currentTarget.style.borderColor = '#e0e0e0'
              }
            }}
          >
            <Brain size={14} color="#3b82f6" />
            <span style={{ fontWeight: 500, color: '#374151' }}>Thinking Process</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {message.content ? (
                  <CheckCircle2 size={14} color="#10b981" />
                ) : (
                  <span className="animate-pulse" style={{ fontSize: 11, color: '#3b82f6' }}>Thinking...</span>
                )}
                {onShowDetail && <ChevronRight size={14} color="#9ca3af" />}
             </div>
          </div>
        )}

        {/* Tool Calls Section */}
        {showToolCalls && message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginBottom: '8px' }}>
            {message.toolCalls.map((tool, idx) => (
              <div 
                key={idx} 
                onClick={() => onShowDetail?.({ type: 'tool', content: tool })}
                style={{ 
                  fontSize: '12px', 
                  color: '#444', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  backgroundColor: '#f0f7ff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dbeafe',
                  cursor: onShowDetail ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (onShowDetail) {
                    e.currentTarget.style.backgroundColor = '#eff6ff'
                    e.currentTarget.style.borderColor = '#bfdbfe'
                  }
                }}
                onMouseLeave={(e) => {
                  if (onShowDetail) {
                    e.currentTarget.style.backgroundColor = '#f0f7ff'
                    e.currentTarget.style.borderColor = '#dbeafe'
                  }
                }}
              >
                <Terminal size={12} color="#3b82f6" />
                <span style={{ fontWeight: 600, color: '#1d4ed8' }}>Using Tool:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{tool.name}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {tool.status === 'running' && <span className="animate-pulse" style={{ color: '#f59e0b', fontSize: 11 }}>Running...</span>}
                  {tool.status === 'completed' && <CheckCircle2 size={14} color="#10b981" />}
                  {tool.status === 'error' && <span style={{ color: '#ef4444', fontWeight: 500, fontSize: 11 }}>Error</span>}
                  {onShowDetail && <ChevronRight size={14} color="#9ca3af" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Answer Section */}
        {message.content && (
          <div style={{ width: '100%' }}>
            {!isUser && (
              <div style={{ fontWeight: 600, fontSize: '11px', color: '#10b981', marginBottom: '4px', paddingLeft: '4px' }}>ANSWER:</div>
            )}
            <div style={currentStyles}>
              <MarkdownContent content={message.content} color={currentStyles.color as string} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
