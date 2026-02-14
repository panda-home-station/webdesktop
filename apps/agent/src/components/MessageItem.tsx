import React from 'react'
import { Bot, User, Globe, Box, Terminal } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { Message } from '../types'

interface MessageItemProps {
  message: Message
  isCompact?: boolean
  userStyles?: React.CSSProperties
  assistantStyles?: React.CSSProperties
  avatarStyles?: React.CSSProperties
  showToolCalls?: boolean
  availableTools?: { id: string; name: string }[]
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCompact = false,
  userStyles = {},
  assistantStyles = {},
  avatarStyles = {},
  showToolCalls = true,
  availableTools = []
}) => {
  const isUser = message.role === 'user'
  
  const defaultUserStyles: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: '12px 2px 12px 12px',
    padding: '8px 12px',
    fontSize: '14px',
    lineHeight: 1.5,
    wordBreak: 'break-word',
    ...userStyles
  }

  const defaultAssistantStyles: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    borderRadius: '2px 12px 12px 12px',
    padding: '8px 12px',
    fontSize: '14px',
    lineHeight: 1.5,
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
        alignItems: isUser ? 'flex-end' : 'flex-start' 
      }}>
        <div style={currentStyles}>
          <MarkdownContent content={message.content} color={currentStyles.color as string} />
        </div>

        {showToolCalls && message.toolCalls && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            {message.toolCalls.map((tool, idx) => (
              <div key={idx} style={{ 
                fontSize: '12px', 
                color: '#666', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                backgroundColor: '#f5f5f5',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #eee'
              }}>
                {tool.name === 'web_search' && <Globe size={12} />}
                {tool.name === 'file_system' && <Box size={12} />}
                {tool.name === 'terminal' && <Terminal size={12} />}
                <span>正在使用 {availableTools.find(t => t.id === tool.name)?.name || tool.name}...</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
