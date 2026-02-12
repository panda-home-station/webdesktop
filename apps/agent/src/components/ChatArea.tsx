import React from 'react'
import { Send, Globe, Box, Terminal, Plus, Bot, User, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { Message, Agent, Tool } from '../types'
import { AVAILABLE_TOOLS } from '../constants'

interface ChatAreaProps {
  messages: Message[]
  input: string
  setInput: (input: string) => void
  isLoading: boolean
  handleSend: () => void
  handleStop: () => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  selectedAgent: Agent
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  isWorkspaceOpen: boolean
  setIsWorkspaceOpen: (open: boolean) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  input,
  setInput,
  isLoading,
  handleSend,
  handleStop,
  handleKeyDown,
  selectedAgent,
  isSidebarOpen,
  setIsSidebarOpen,
  isWorkspaceOpen,
  setIsWorkspaceOpen,
  messagesEndRef
}) => {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 450,
      backgroundColor: '#fff',
      position: 'relative',
      zIndex: 1,
      boxSizing: 'border-box'
    }}>
      {/* Chat Header */}
      <div style={{ height: 60, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "收起目录" : "展开目录"}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              width: 32,
              height: 32,
              borderRadius: '8px',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
              e.currentTarget.style.color = '#3b82f6'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#666'
            }}
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          
          <div style={{ width: 1, height: 16, backgroundColor: '#eee', margin: '0 4px' }}></div>

          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f0f7ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {selectedAgent.icon}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>{selectedAgent.name}</div>
            <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              在线
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            style={{ 
              border: '1px solid',
              borderColor: isWorkspaceOpen ? '#3b82f6' : '#eee', 
              background: isWorkspaceOpen ? '#f0f7ff' : '#fff', 
              cursor: 'pointer', 
              padding: '6px 12px', 
              borderRadius: 8, 
              fontSize: 12, 
              color: isWorkspaceOpen ? '#3b82f6' : '#666',
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <Layers size={14} />
            工作区
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="custom-scrollbar" style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '40px 0',
        scrollBehavior: 'smooth',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="responsive-content" style={{ padding: '0 16px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 48, padding: '0 20px' }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 20, 
                background: '#f9f9f9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px',
                color: '#ccc',
                border: '1px solid #f0f0f0'
              }}>
                {selectedAgent.icon}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>{selectedAgent.name}</h2>
              <p style={{ color: '#666', fontSize: 14, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>{selectedAgent.description}</p>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px', 
                marginTop: 40,
                width: 'fit-content',
                margin: '40px auto 0'
              }}>
                {['帮我分析项目结构', '创建一个自动化工作流', '查找最新的 AI 趋势', '优化这段代码逻辑'].map(tip => (
                  <div 
                    key={tip}
                    onClick={() => setInput(tip)}
                    style={{
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#3b82f6',
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                      width: '100%',
                      justifyContent: 'flex-start'
                    }}
                  >
                    <Plus size={14} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 32,
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{
                display: 'flex',
                gap: 12,
                maxWidth: '85%',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
              }} className="message-bubble-container">
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: message.role === 'user' ? '#000' : '#f0f7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: message.role === 'user' ? '#fff' : '#3b82f6',
                  marginTop: 4
                }}>
                  {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className="message-bubble" style={{
                    padding: '12px 16px',
                    borderRadius: message.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    backgroundColor: message.role === 'user' ? '#000' : '#f9f9f9',
                    color: message.role === 'user' ? '#fff' : '#1a1a1a',
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    boxShadow: message.role === 'user' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    border: message.role === 'user' ? 'none' : '1px solid #f0f0f0'
                  }}>
                    {message.content}
                  </div>
                  {message.toolCalls && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                      {message.toolCalls.map((tool, idx) => (
                        <div key={idx} style={{ 
                          fontSize: 12, 
                          color: '#666', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          backgroundColor: '#f5f5f5',
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #eee'
                        }}>
                          {tool.name === 'web_search' && <Globe size={12} />}
                          {tool.name === 'file_system' && <Box size={12} />}
                          {tool.name === 'terminal' && <Terminal size={12} />}
                          <span>正在使用 {AVAILABLE_TOOLS.find(t => t.id === tool.name)?.name || tool.name}...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: '#f0f7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
              }}>
                <Bot size={16} />
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '12px 16px', backgroundColor: '#f9f9f9', borderRadius: '4px 16px 16px 16px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'bounce 1s infinite 0.1s' }}></div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'bounce 1s infinite 0.2s' }}></div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'bounce 1s infinite 0.3s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{ padding: '0 24px 24px', backgroundColor: '#fff' }}>
        <div className="responsive-content" style={{ position: 'relative' }}>
          <div style={{
            backgroundColor: '#f9f9f9',
            borderRadius: 20,
            border: '1px solid #eee',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`给 ${selectedAgent.name} 发送消息...`}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                resize: 'none',
                fontSize: 14,
                lineHeight: 1.5,
                outline: 'none',
                color: '#1a1a1a',
                boxSizing: 'border-box',
                overflowY: 'auto',
                minHeight: 24,
                maxHeight: 200
              }}
              rows={Math.min(5, input.split('\n').length || 1)}
            />
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
                <Globe size={18} style={{ cursor: 'pointer', flexShrink: 0 }} />
                <Box size={18} style={{ cursor: 'pointer', flexShrink: 0 }} />
                <Terminal size={18} style={{ cursor: 'pointer', flexShrink: 0 }} />
              </div>
              {isLoading ? (
                <button
                  onClick={handleStop}
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
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: !input.trim() ? '#f0f0f0' : '#000',
                    color: '#fff',
                    border: 'none',
                    cursor: !input.trim() ? 'default' : 'pointer',
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
          </div>
          <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8 }}>
            AI 可能会产生错误，请核实重要信息。
          </div>
        </div>
      </div>
    </div>
  )
}
