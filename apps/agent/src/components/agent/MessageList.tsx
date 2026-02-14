import React, { useRef, useEffect } from 'react'
import { MessageItem, Message } from './MessageItem'
import { Bot } from 'lucide-react'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  isCompact?: boolean
  emptyState?: React.ReactNode
  messageItemProps?: any
  renderLoading?: () => React.ReactNode
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  isCompact = false,
  emptyState,
  messageItemProps = {},
  renderLoading
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    // 使用 requestAnimationFrame 确保在 DOM 更新后滚动
    const rafId = requestAnimationFrame(() => {
      scrollToBottom()
    })
    return () => cancelAnimationFrame(rafId)
  }, [messages, isLoading])

  if (messages.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div 
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: isCompact ? '16px' : '40px 16px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff'
      }} className="custom-scrollbar">
      <div style={{ 
        width: '100%', 
        maxWidth: isCompact ? 'none' : 'min(92%, 800px)',
        margin: '0 auto'
      }}>
        {messages.map(m => (
          <MessageItem 
            key={m.id} 
            message={m} 
            isCompact={isCompact}
            {...messageItemProps}
          />
        ))}
        
        {isLoading && renderLoading && renderLoading()}
        
        {isLoading && !renderLoading && (
          <div style={{ display: 'flex', gap: isCompact ? 10 : 12, marginBottom: isCompact ? 16 : 32 }}>
            <div style={{
              width: isCompact ? 28 : 32,
              height: isCompact ? 28 : 32,
              borderRadius: isCompact ? 8 : 10,
              backgroundColor: isCompact ? '#f3f4f6' : '#f0f7ff',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bot size={16} />
            </div>
            <div style={{ 
              padding: '8px 12px', 
              borderRadius: isCompact ? 12 : '4px 16px 16px 16px', 
              backgroundColor: isCompact ? '#f3f4f6' : '#f9f9f9',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <div className="dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'bounce 1s infinite 0.1s' }}></div>
              <div className="dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'bounce 1s infinite 0.2s' }}></div>
              <div className="dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'bounce 1s infinite 0.3s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
