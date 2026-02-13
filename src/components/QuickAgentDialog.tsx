import React, { useState, useRef, useEffect } from 'react'
import { Send, X, Maximize2, Bot, User, Loader2, PlusCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface QuickAgentDialogProps {
  onClose: () => void
  onOpenFullApp: (messages: Message[]) => void
  visible: boolean
}

export const QuickAgentDialog: React.FC<QuickAgentDialogProps> = ({ onClose, onOpenFullApp, visible }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [visible])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    abortControllerRef.current = new AbortController()

    const apiEndpoint = localStorage.getItem('agent_api_endpoint') || 'http://192.168.1.189:11434'
    const apiModel = localStorage.getItem('agent_api_model') || 'qwen3:14b'

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: '你是一个全能的智能助手，能够回答各种问题并提供建议。请保持友好、简洁且专业的态度。' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg.content }
          ],
          model: apiModel,
          endpoint: apiEndpoint
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) throw new Error('Failed to fetch')

      const assistantMsgId = (Date.now() + 1).toString()
      setMessages(prev => [...prev, { 
        id: assistantMsgId, 
        role: 'assistant', 
        content: '',
        timestamp: new Date().toISOString()
      }])
      setIsLoading(false)

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.slice(6)
            fullContent += content
            setMessages(prev => prev.map(m =>
              m.id === assistantMsgId ? { ...m, content: fullContent } : m
            ))
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后再试。'
      }])
      setIsLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      left: 80,
      bottom: 32,
      width: 360,
      height: 520,
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
        background: '#fcfcfc'
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
            onClick={() => {
              setMessages([])
              setInput('')
              if (abortControllerRef.current) {
                abortControllerRef.current.abort()
                setIsLoading(false)
              }
            }}
            title="新建对话"
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
            <PlusCircle size={16} />
          </button>
          <button
            onClick={() => onOpenFullApp(messages)}
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
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        backgroundColor: '#fff'
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            gap: 12,
            padding: '0 32px',
            textAlign: 'center'
          }}>
            <Bot size={40} strokeWidth={1.5} opacity={0.5} />
            <p style={{ fontSize: 13 }}>有什么我可以帮您的吗？</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{
            display: 'flex',
            gap: 10,
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: m.role === 'user' ? '#3b82f6' : '#f3f4f6',
              color: m.role === 'user' ? '#fff' : '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2
            }}>
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div style={{
              maxWidth: '80%',
              padding: '8px 12px',
              borderRadius: 12,
              fontSize: 14,
              lineHeight: 1.5,
              backgroundColor: m.role === 'user' ? '#3b82f6' : '#f3f4f6',
              color: m.role === 'user' ? '#fff' : '#1f2937',
              borderTopRightRadius: m.role === 'user' ? 2 : 12,
              borderTopLeftRadius: m.role === 'assistant' ? 2 : 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#f3f4f6',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={16} />
            </div>
            <div style={{
              padding: '8px 12px',
              borderRadius: 12,
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Loader2 size={16} className="animate-spin" style={{ color: '#9ca3af' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fff'
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          background: '#f9fafb',
          padding: '4px 4px 4px 12px',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          alignItems: 'center'
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入您的问题..."
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              outline: 'none',
              fontSize: 14,
              padding: '8px 0',
              color: '#1f2937'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: input.trim() && !isLoading ? '#3b82f6' : '#e5e7eb',
              color: '#fff',
              border: 'none',
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
