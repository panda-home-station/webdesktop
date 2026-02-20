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
        {message.thoughts && message.thoughts.length > 0 && (
          <div style={{
            fontSize: '13px',
            color: '#666',
            backgroundColor: '#f8f9fa',
            padding: '8px 12px',
            borderRadius: '8px',
            marginBottom: '8px',
            borderLeft: '3px solid #ddd'
          }}>
            <div style={{ fontWeight: 500, marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>思考过程</div>
            {message.thoughts.map((thought, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                <MarkdownContent content={thought} color="#666" />
              </div>
            ))}
          </div>
        )}

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
                <Terminal size={12} />
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{tool.name}</span>
                <span style={{ fontFamily: 'monospace', color: '#888' }}>{JSON.stringify(tool.args)}</span>
                {tool.status === 'running' && <span className="animate-pulse">...</span>}
                {tool.status === 'completed' && <span style={{ color: 'green' }}>✓</span>}
                {tool.status === 'error' && <span style={{ color: 'red' }}>✗</span>}
              </div>
            ))}
            {/* Show tool results if available */}
            {message.toolCalls.map((tool, idx) => tool.result && (
              <div key={`result-${idx}`} style={{
                fontSize: '12px',
                color: '#444',
                backgroundColor: '#f0f9ff',
                padding: '8px',
                borderRadius: '6px',
                borderLeft: '3px solid #3b82f6',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: '#3b82f6' }}>Result ({tool.name}):</div>
                {tool.result}
              </div>
            ))}
          </div>
        )}

        <div style={currentStyles}>
          <MarkdownContent content={message.content} color={currentStyles.color as string} />
        </div>
      </div>
    </div>
  )
}
