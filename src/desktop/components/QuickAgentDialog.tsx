import React, { useState, useEffect, useRef } from 'react'
import { Maximize2, Sparkles, CornerDownLeft } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface QuickAgentDialogProps {
  onClose: () => void
  onOpenFullApp: (messages: Message[]) => void
  visible: boolean
}

const SUGGESTIONS = [
  { icon: '📝', text: '帮我写一份周报', prompt: '帮我写一份本周的工作周报，包含项目进度、遇到的问题和下周计划。' },
  { icon: '💡', text: '头脑风暴', prompt: '针对"提升团队工作效率"这个主题，帮我进行头脑风暴，提供5个创新性的建议。' },
  { icon: '🔍', text: '解释概念', prompt: '用通俗易懂的语言帮我解释一下什么是"量子计算"。' },
  { icon: '🌐', text: '翻译成英文', prompt: '请将以下内容翻译成地道的英文：' },
]

export const QuickAgentDialog: React.FC<QuickAgentDialogProps> = ({ onClose, onOpenFullApp, visible }) => {
  const [input, setInput] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [isMaximizing, setIsMaximizing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (visible) {
      setIsMaximizing(false)
      // Auto focus input
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [visible])

  const handleMaximize = (messages: Message[] = []) => {
    setIsMaximizing(true)
    // Delay calling actual open function to let animation play
    setTimeout(() => {
      onOpenFullApp(messages)
    }, 100)
  }

  const handleSend = (textOverride?: string) => {
    const finalInput = textOverride || input
    if (!finalInput.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalInput,
      timestamp: new Date()
    }

    handleMaximize([userMsg])
    setInput('')
  }

  const handleSuggestionClick = (suggestion: typeof SUGGESTIONS[0]) => {
    if (suggestion.prompt.endsWith('：')) {
      setInput(suggestion.prompt)
    } else {
      handleSend(suggestion.prompt)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Background Overlay to capture clicks outside */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          backgroundColor: 'transparent', // Fully transparent, no dimming
          animation: isMaximizing ? 'quickAgentFadeOut 0.1s forwards' : 'quickAgentFadeIn 0.15s ease-out'
        }}
      />

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dialog
        style={{
          position: 'fixed',
          left: '50%',
          bottom: '15%',
          transform: 'translateX(-50%)',
          width: 720,
          backgroundColor: '#ffffff', // Solid white background
          borderRadius: 24,
          boxShadow: isHovered
            ? '0 40px 80px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)'
            : '0 30px 70px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10001,
          border: '1px solid #e5e7eb', // Distinct light border
          animation: isMaximizing
            ? 'quickAgentMaximize 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : 'quickAgentSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '12px 0 0 0',
          pointerEvents: isMaximizing ? 'none' : 'auto'
        }}
      >
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px 8px',
          borderBottom: '1px solid rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', lineHeight: 1.2 }}>AI 助手</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>随时为您提供帮助</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleMaximize()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="全屏模式"
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        <div style={{ width: '100%', padding: '8px 0' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="告诉我你想做什么..."
            style={{
              width: '100%',
              minHeight: 80,
              maxHeight: 200,
              padding: '8px 24px',
              border: 'none',
              background: 'transparent',
              fontSize: 18,
              lineHeight: 1.6,
              fontWeight: 400,
              color: '#111827',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Suggestions Row */}
        <div style={{
          display: 'flex',
          gap: 10,
          padding: '0 24px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {SUGGESTIONS.map((s, i) => (
            <div
              key={i}
              onClick={() => handleSuggestionClick(s)}
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(0,0,0,0.05)',
                fontSize: 13,
                color: '#4b5563',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
              }}
            >
              <span>{s.icon}</span>
              {s.text}
            </div>
          ))}
        </div>

        {/* Footer Hints */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: 'rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#9ca3af'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>ESC 关闭</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CornerDownLeft size={12} /> 发送
            </span>
          </div>
          <div>AI 可能会产生错误，请核实重要信息。</div>
        </div>

        <style>{`
          @keyframes quickAgentSlideUp {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
          @keyframes quickAgentFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes quickAgentFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes quickAgentMaximize {
            0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -20px) scale(1.02); }
          }
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </>
  )
}
