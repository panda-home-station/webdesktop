import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Settings,
  Terminal,
  Cpu,
  Workflow,
  Layers,
  Sparkles,
  Command,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Save,
  Globe,
  Box
} from 'lucide-react'
import axios from 'axios'

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  id: string
  timestamp: Date
  toolCalls?: {
    name: string
    args: any
    status: 'running' | 'completed' | 'error'
    result?: string
  }[]
}

type Agent = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: 'online' | 'busy' | 'offline'
  systemPrompt: string
}

type AgentWorkflow = {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'error'
  steps: {
    id: string
    label: string
    status: 'pending' | 'running' | 'completed' | 'error'
  }[]
}

const MOCK_AGENTS: Agent[] = [
  { 
    id: 'general', 
    name: '智能助手', 
    description: '通用的 AI 助手，协助日常任务', 
    icon: <Sparkles size={18} />, 
    status: 'online',
    systemPrompt: '你是一个全能的智能助手，能够回答各种问题并提供建议。请保持友好、简洁且专业的态度。'
  },
  { 
    id: 'coder', 
    name: '代码专家', 
    description: '擅长编程、调试和架构设计', 
    icon: <Terminal size={18} />, 
    status: 'online',
    systemPrompt: '你是一个顶尖的软件工程师和架构师。在编写代码时，注重性能、可维护性和安全性。请直接提供高质量的代码片段和深度的技术见解。'
  },
  { 
    id: 'researcher', 
    name: '研究员', 
    description: '深度搜索和信息汇总分析', 
    icon: <Search size={18} />, 
    status: 'online',
    systemPrompt: '你是一个严谨的研究员。在提供信息时，请务必客观、详尽，并尽可能引用来源（即使是模拟的）。擅长分析复杂数据和总结长篇文章。'
  },
  { 
    id: 'workflow-master', 
    name: '流程大师', 
    description: '自动化工作流编排与执行', 
    icon: <Workflow size={18} />, 
    status: 'online',
    systemPrompt: '你是一个工作流编排专家。你的任务是帮助用户将复杂任务拆解为可执行的步骤，并模拟工作流的执行过程。在回复时，请使用清晰的步骤描述。'
  },
]

export default function AgentApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent>(MOCK_AGENTS[0])
  const [activeWorkflow, setActiveWorkflow] = useState<AgentWorkflow | null>(null)
  const [availableTools] = useState([
    { id: 'web_search', name: '网页搜索', icon: <Globe size={14} />, description: '在互联网上搜索最新信息' },
    { id: 'file_system', name: '文件系统', icon: <Box size={14} />, description: '读写本地文件系统' },
    { id: 'terminal', name: '终端执行', icon: <Terminal size={14} />, description: '运行系统命令和脚本' },
  ])
  
  // API Configuration
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('agent_api_endpoint') || 'http://192.168.1.189:11434')
  const [apiModel, setApiModel] = useState(() => localStorage.getItem('agent_api_model') || 'qwen3:14b')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const saveSettings = () => {
    localStorage.setItem('agent_api_endpoint', apiEndpoint)
    localStorage.setItem('agent_api_model', apiModel)
    setIsSettingsOpen(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    abortControllerRef.current = new AbortController()
    
    const userMsg: Message = { 
      id: Date.now().toString(),
      role: 'user', 
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Dynamic workflow based on agent type
    const setupWorkflow = () => {
      if (selectedAgent.id === 'coder') {
        setActiveWorkflow({
          id: 'wf-' + Date.now(),
          title: '代码生成与验证',
          status: 'running',
          steps: [
            { id: '1', label: '需求分析', status: 'completed' },
            { id: '2', label: '架构设计', status: 'running' },
            { id: '3', label: '代码实现', status: 'pending' },
            { id: '4', label: '单元测试', status: 'pending' },
          ]
        })
      } else if (selectedAgent.id === 'researcher') {
        setActiveWorkflow({
          id: 'wf-' + Date.now(),
          title: '深度研究与汇总',
          status: 'running',
          steps: [
            { id: '1', label: '关键词提取', status: 'completed' },
            { id: '2', label: '全网搜索', status: 'running' },
            { id: '3', label: '内容过滤', status: 'pending' },
            { id: '4', label: '报告生成', status: 'pending' },
          ]
        })
      } else if (selectedAgent.id === 'workflow-master' || input.includes('流程')) {
        setActiveWorkflow({
          id: 'wf-' + Date.now(),
          title: '自动化分析流程',
          status: 'running',
          steps: [
            { id: '1', label: '环境扫描', status: 'completed' },
            { id: '2', label: '数据提取', status: 'running' },
            { id: '3', label: '深度分析', status: 'pending' },
            { id: '4', label: '生成报告', status: 'pending' },
          ]
        })
      } else {
        setActiveWorkflow(null)
      }
    }

    setupWorkflow()

    try {
      // Simulate Tool Calls based on input
      let toolCalls: Message['toolCalls'] = undefined
      if (input.toLowerCase().includes('搜索') || input.toLowerCase().includes('search')) {
        toolCalls = [{ name: 'web_search', args: { query: input }, status: 'running' }]
      } else if (input.toLowerCase().includes('文件') || input.toLowerCase().includes('file')) {
        toolCalls = [{ name: 'file_system', args: { action: 'read' }, status: 'running' }]
      } else if (input.toLowerCase().includes('命令') || input.toLowerCase().includes('run')) {
        toolCalls = [{ name: 'terminal', args: { cmd: input }, status: 'running' }]
      }

      let isToolExecuting = false;
      if (toolCalls) {
        isToolExecuting = true;
        // Add a temporary message showing tool activity
        const toolMsg: Message = {
          id: 'tool-executing',
          role: 'assistant',
          content: '正在调用工具处理您的请求...',
          timestamp: new Date(),
          toolCalls
        }
        setMessages(prev => [...prev, toolMsg])
      }

      const chatMessages = [
        { role: 'system', content: selectedAgent.systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg.content }
      ]

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          messages: chatMessages,
          model: apiModel,
          endpoint: apiEndpoint
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      // If we were showing a tool message, remove it now that we're getting the real response
      if (isToolExecuting) {
        setMessages(prev => prev.filter(m => m.id !== 'tool-executing'))
        setIsLoading(false) // This is the key: Stop the "..." loading state
        
        // Also update workflow steps if active
        setActiveWorkflow(prev => {
          if (!prev) return null;
          const newSteps = [...prev.steps];
          const runningIdx = newSteps.findIndex(s => s.status === 'running');
          if (runningIdx !== -1 && runningIdx < newSteps.length - 1) {
            newSteps[runningIdx].status = 'completed';
            newSteps[runningIdx + 1].status = 'running';
          }
          return { ...prev, steps: newSteps };
        });
      }

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false); // Stop showing the separate loading dots

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // SSE format: "data: content\n\n"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.slice(6);
            fullContent += content;
            setMessages(prev => prev.map(m => 
              m.id === assistantMsgId ? { ...m, content: fullContent } : m
            ));
          }
        }
      }

      // Update workflow completion if active
      setActiveWorkflow(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'completed',
          steps: prev.steps.map(s => ({ ...s, status: 'completed' }))
        };
      });

    } catch (error) {
      if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
        console.log('Request cancelled')
      } else {
        console.error('Chat error:', error)
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '抱歉，连接服务时出现了点问题，请检查后端配置或稍后再试。',
          timestamp: new Date()
        }])
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
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
      height: '100%',
      width: '100%',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .message-bubble {
          transition: transform 0.2s ease;
        }
        .message-bubble:hover {
          transform: translateX(4px);
        }
      `}</style>
      {/* Sidebar */}
      <div style={{
        width: isSidebarOpen ? 260 : 0,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Command size={18} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Agent Center</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 8, paddingLeft: 8 }}>智能体列表</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {MOCK_AGENTS.map(agent => (
              <div 
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: selectedAgent.id === agent.id ? '#fff' : 'transparent',
                  boxShadow: selectedAgent.id === agent.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  border: selectedAgent.id === agent.id ? '1px solid #eee' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 8, 
                  background: selectedAgent.id === agent.id ? '#000' : '#eee', 
                  color: selectedAgent.id === agent.id ? '#fff' : '#666',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {agent.icon}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.description}</div>
                </div>
              </div>
            ))}
          </div>

          {activeWorkflow && (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#888', marginTop: 24, marginBottom: 8, paddingLeft: 8 }}>当前工作流</div>
              <div style={{ 
                padding: '12px', 
                borderRadius: 12, 
                backgroundColor: '#fff', 
                border: '1px solid #eee',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Workflow size={14} color="#3b82f6" />
                  {activeWorkflow.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeWorkflow.steps.map(step => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {step.status === 'completed' ? <CheckCircle2 size={14} color="#10b981" /> :
                       step.status === 'running' ? <Clock size={14} color="#3b82f6" className="animate-spin-slow" /> :
                       <Circle size={14} color="#ccc" />}
                      <span style={{ fontSize: 12, color: step.status === 'pending' ? '#aaa' : '#444' }}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ fontSize: 12, fontWeight: 500, color: '#888', marginTop: 24, marginBottom: 8, paddingLeft: 8 }}>可用工具 (MCP)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {availableTools.map(tool => (
              <div 
                key={tool.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: '#f5f5f5',
                  border: '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ color: '#666' }}>{tool.icon}</div>
                <div style={{ fontSize: 12, color: '#444', fontWeight: 500 }}>{tool.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div 
            onClick={() => setMessages([])}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Plus size={18} color="#666" />
            <span style={{ fontSize: 14, color: '#444' }}>开启新对话</span>
          </div>
          <div 
            onClick={() => setIsSettingsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Settings size={18} color="#666" />
            <span style={{ fontSize: 14, color: '#444' }}>设置</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: '#fff'
      }}>
        {/* Header */}
        <div style={{
          height: 60,
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isSidebarOpen ? <ChevronLeft size={20} color="#666" /> : <ChevronRight size={20} color="#666" />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{selectedAgent.name}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => setMessages([])}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Plus size={16} />
              清空对话
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, backgroundColor: '#f5f5f5', fontSize: 12, color: '#666' }}>
              <Cpu size={14} />
              <span>MCP: 8 Active</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', padding: '0 20px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 100 }}>
                <div style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 20, 
                  backgroundColor: '#f9f9f9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  {selectedAgent.icon}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{selectedAgent.name}</h2>
                <p style={{ color: '#666', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>{selectedAgent.description}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 40, maxWidth: 500, margin: '40px auto 0' }}>
                  {['分析当前系统状态', '帮我写一个工作流', '查找最新的 AI 趋势', '优化这段 Python 代码'].map(tip => (
                    <div 
                      key={tip}
                      onClick={() => setInput(tip)}
                      style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #eee', fontSize: 13, color: '#444', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 32,
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {msg.role === 'assistant' ? (
                    <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Bot size={14} />
                    </div>
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                      <User size={14} />
                    </div>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>
                    {msg.role === 'assistant' ? selectedAgent.name : 'You'}
                  </span>
                </div>
                
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  backgroundColor: msg.role === 'user' ? '#f5f5f5' : 'transparent',
                  color: '#1a1a1a',
                  fontSize: 15,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  border: msg.role === 'assistant' ? 'none' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {msg.content}
                  {msg.role === 'assistant' && !msg.content && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ddd', animation: 'bounce 1s infinite' }}></div>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ddd', animation: 'bounce 1s infinite 0.2s' }}></div>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ddd', animation: 'bounce 1s infinite 0.4s' }}></div>
                    </div>
                  )}
                </div>

                {msg.toolCalls && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, width: '100%' }}>
                    {msg.toolCalls.map((tool, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        padding: '8px 12px', 
                        borderRadius: 10, 
                        backgroundColor: '#f8fafc', 
                        border: '1px solid #e2e8f0',
                        fontSize: 13
                      }}>
                        <Terminal size={14} color="#64748b" />
                        <span style={{ fontWeight: 500, color: '#334155' }}>Using Tool: {tool.name}</span>
                        {tool.status === 'running' && <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>}
                        {tool.status === 'completed' && <CheckCircle2 size={14} color="#10b981" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 32, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Bot size={14} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>{selectedAgent.name}</span>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 16, backgroundColor: 'transparent', display: 'flex', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ddd', animation: 'bounce 1s infinite' }}></div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ddd', animation: 'bounce 1s infinite 0.2s' }}></div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ddd', animation: 'bounce 1s infinite 0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{
          padding: '20px 0 40px',
          borderTop: 'none'
        }}>
          <div style={{ 
            maxWidth: 800, 
            margin: '0 auto', 
            width: '100%', 
            padding: '0 20px',
            position: 'relative'
          }}>
            <div style={{
              backgroundColor: '#f9f9f9',
              borderRadius: 20,
              padding: '8px 12px',
              border: '1px solid #eee',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              transition: 'all 0.3s ease'
            }}
            onFocusCapture={e => e.currentTarget.style.borderColor = '#ddd'}
            onBlurCapture={e => e.currentTarget.style.borderColor = '#eee'}
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedAgent.name}...`}
                style={{
                  width: '100%',
                  minHeight: 40,
                  maxHeight: 200,
                  padding: '10px 8px',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 15,
                  lineHeight: 1.6,
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#666' }}>
                    <Plus size={20} />
                  </button>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#666' }}>
                    <Layers size={20} />
                  </button>
                </div>
                {isLoading ? (
                  <button
                    onClick={handleStop}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: '#000',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
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
                      borderRadius: 10,
                      backgroundColor: !input.trim() ? '#eee' : '#000',
                      color: '#fff',
                      border: 'none',
                      cursor: !input.trim() ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 12 }}>
              Agent can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: 400,
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={18} color="#000" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>API 设置</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} />
                  Ollama Endpoint
                </label>
                <input 
                  type="text" 
                  value={apiEndpoint}
                  onChange={e => setApiEndpoint(e.target.value)}
                  placeholder="http://127.0.0.1:11434"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #eee',
                    outline: 'none',
                    fontSize: 14,
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Box size={14} />
                  Model Name
                </label>
                <input 
                  type="text" 
                  value={apiModel}
                  onChange={e => setApiModel(e.target.value)}
                  placeholder="qwen3:14b"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #eee',
                    outline: 'none',
                    fontSize: 14,
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid #eee',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                取消
              </button>
              <button 
                onClick={saveSettings}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#000',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Save size={16} />
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  )
}

