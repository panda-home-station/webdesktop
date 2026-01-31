import React, { useState, useRef, useEffect } from 'react'
import Icon from '@mdi/react'
import { mdiRobot, mdiSend, mdiAccountCircle } from '@mdi/js'
import axios from 'axios'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function AgentApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const resp = await axios.post('/api/agent/chat', {
        messages: [...messages, userMsg],
        model: 'qwen2.5:14b' // Default model
      })
      
      const reply = resp.data.reply
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err: any) {
      console.error('Agent chat error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      backgroundColor: '#f9fafb'
    }}>
      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        scrollBehavior: 'smooth'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            marginTop: 40,
            fontSize: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Icon path={mdiRobot} size={1.5} color="#9ca3af" />
            </div>
            <p>你好！我是你的 AI 助手，有什么可以帮你的吗？</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 8
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 4
              }}>
                <Icon path={mdiRobot} size={0.7} color="white" />
              </div>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: msg.role === 'user' ? '#3b82f6' : 'white',
              color: msg.role === 'user' ? 'white' : '#1f2937',
              fontSize: 14,
              lineHeight: 1.5,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              borderTopRightRadius: msg.role === 'user' ? 2 : 12,
              borderTopLeftRadius: msg.role === 'assistant' ? 2 : 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 4
            }}>
              <Icon path={mdiRobot} size={0.7} color="white" />
            </div>
            <div style={{
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: 'white',
              color: '#6b7280',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              borderTopLeftRadius: 2
            }}>
              <span className="typing-dot" style={{animationDelay: '0s'}}>●</span>
              <span className="typing-dot" style={{animationDelay: '0.2s'}}>●</span>
              <span className="typing-dot" style={{animationDelay: '0.4s'}}>●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px',
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end'
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            resize: 'none',
            height: 40,
            maxHeight: 120,
            outline: 'none',
            fontSize: 14,
            fontFamily: 'inherit',
            lineHeight: 1.5,
            transition: 'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: (!input.trim() || isLoading) ? '#f3f4f6' : '#3b82f6',
            color: (!input.trim() || isLoading) ? '#9ca3af' : 'white',
            border: 'none',
            cursor: (!input.trim() || isLoading) ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          <Icon path={mdiSend} size={0.8} />
        </button>
      </div>
    </div>
  )
}
