import React, { useState, useEffect } from 'react'
import { X, Maximize2, Bot } from 'lucide-react'
import { ChatInput } from '../../apps/agent/src/components/agent/ChatInput'
import { Message } from '../../apps/agent/src/components/agent/MessageItem'

interface QuickAgentDialogProps {
  onClose: () => void
  onOpenFullApp: (messages: Message[]) => void
  visible: boolean
}

export const QuickAgentDialog: React.FC<QuickAgentDialogProps> = ({ onClose, onOpenFullApp, visible }) => {
  const [input, setInput] = useState('')

  useEffect(() => {
    if (visible) {
      // Focus is handled by ChatInput internal input
    }
  }, [visible])

  const handleSend = () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    onOpenFullApp([userMsg])
    setInput('')
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      left: 80,
      bottom: 32,
      width: 400,
      backgroundColor: '#fff',
      borderRadius: 16,
      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10001,
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.08)',
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fcfcfc',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: '#eff6ff',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={18} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>AI 助手</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onOpenFullApp([])}
            title="打开完整应用"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={onClose}
            title="关闭"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div style={{ padding: '4px 0' }}>
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isCompact={true}
          autoFocus={true}
          placeholder="有什么我可以帮您的吗？"
          containerStyles={{ border: 'none', background: 'transparent' }}
        />
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
