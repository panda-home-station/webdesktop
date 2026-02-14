import React from 'react'
import { Plus, Bot, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { Message, Agent } from '../types'
import { AVAILABLE_TOOLS } from '../constants'
import { MessageList } from './agent/MessageList'
import { ChatInput } from './agent/ChatInput'

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
  toggleWorkspace: () => void
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
  toggleWorkspace
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
      <div style={{ 
        height: 60, 
        borderBottom: '1px solid #f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 16px', 
        justifyContent: 'space-between', 
        backgroundColor: '#fff',
        flexShrink: 0 
      }}>
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
            onClick={toggleWorkspace}
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
      <MessageList 
        messages={messages}
        isLoading={isLoading}
        isCompact={false}
        messageItemProps={{
          userStyles: {
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '16px 4px 16px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: 'none'
          },
          assistantStyles: {
            backgroundColor: '#f9f9f9',
            color: '#1a1a1a',
            borderRadius: '4px 16px 16px 16px',
            border: '1px solid #f0f0f0'
          },
          availableTools: AVAILABLE_TOOLS
        }}
        emptyState={
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
        }
      />

      {/* Input Area */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
        isCompact={false}
        placeholder={`给 ${selectedAgent.name} 发送消息...`}
        showTools={true}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
