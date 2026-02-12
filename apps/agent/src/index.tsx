import React, { useState, useRef, useEffect, useCallback } from 'react'
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

type AgentTask = {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: Date
}

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
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [workspaceWidth, setWorkspaceWidth] = useState(450)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Layout Constants
  const SIDEBAR_EXPANDED = 240
  const SIDEBAR_COLLAPSED = 60
  const CHAT_MIN_WIDTH = 450
  const WORKSPACE_MIN_THRESHOLD = 450
  const RESIZER_WIDTH = 1

  // Sidebar toggle logic to maintain chat area width
  const prevSidebarOpen = useRef(isSidebarOpen)
  useEffect(() => {
    if (prevSidebarOpen.current !== isSidebarOpen && isWorkspaceOpen) {
      const diff = SIDEBAR_EXPANDED - SIDEBAR_COLLAPSED
      if (isSidebarOpen) {
        // Collapsed -> Expanded: Workspace should shrink
        setWorkspaceWidth(prev => Math.max(WORKSPACE_MIN_THRESHOLD, prev - diff))
      } else {
        // Expanded -> Collapsed: Workspace should grow
        setWorkspaceWidth(prev => prev + diff)
      }
    }
    prevSidebarOpen.current = isSidebarOpen
  }, [isSidebarOpen, isWorkspaceOpen])

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const sidebarWidth = isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED
      const resizerWidth = isWorkspaceOpen ? RESIZER_WIDTH : 0
      
      // 1. Priority: If workspace is open, check if it needs to be squeezed or closed
      if (isWorkspaceOpen) {
        const availableForWorkspace = containerWidth - sidebarWidth - CHAT_MIN_WIDTH - resizerWidth
        if (availableForWorkspace < WORKSPACE_MIN_THRESHOLD) {
          setIsWorkspaceOpen(false)
        } else if (workspaceWidth > availableForWorkspace) {
          // Squeeze workspace width if it's taking too much space
          setWorkspaceWidth(Math.max(WORKSPACE_MIN_THRESHOLD, availableForWorkspace))
        }
      }

      // 2. Sidebar auto-collapse logic (optional, keeping it but refined)
      if (containerWidth < 600 && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [isSidebarOpen, isWorkspaceOpen, workspaceWidth])

  const minWidth = WORKSPACE_MIN_THRESHOLD // Used for the resizer logic below

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRef.current.clientWidth
      const sidebarWidth = isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED
      
      // Calculate max width more defensively using clientWidth
      const maxWorkspaceWidth = Math.floor(containerWidth - sidebarWidth - CHAT_MIN_WIDTH - RESIZER_WIDTH)
      
      // Calculate new width relative to container's right edge
      let newWidth = Math.floor(rect.right - e.clientX - RESIZER_WIDTH)
      
      // Clamp the width
      if (newWidth < WORKSPACE_MIN_THRESHOLD) newWidth = WORKSPACE_MIN_THRESHOLD
      if (newWidth > maxWorkspaceWidth) newWidth = maxWorkspaceWidth
      
      setWorkspaceWidth(newWidth)
    }
  }, [isResizing, isSidebarOpen, SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, CHAT_MIN_WIDTH, WORKSPACE_MIN_THRESHOLD, RESIZER_WIDTH])

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  const [selectedAgent, setSelectedAgent] = useState<Agent>(MOCK_AGENTS[0])
  const [activeWorkflow, setActiveWorkflow] = useState<AgentWorkflow | null>(null)
  const [tasks, setTasks] = useState<AgentTask[]>([
    { id: '1', title: '分析项目结构', status: 'completed', createdAt: new Date() },
    { id: '2', title: '实现三栏布局 UI', status: 'in_progress', createdAt: new Date() },
    { id: '3', title: '对接工具 API', status: 'pending', createdAt: new Date() },
  ])
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
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
      minWidth: (isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED) + CHAT_MIN_WIDTH,
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
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
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
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
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e0e0e0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d0d0d0;
        }
        .responsive-content {
          width: 100%;
          max-width: min(92%, 800px);
          margin: 0 auto;
          transition: all 0.3s ease;
        }
        @media (max-width: 768px) {
          .responsive-content {
            max-width: 100%;
            padding: 0 8px !important;
          }
          .message-bubble-container {
            max-width: 98% !important;
          }
          .chat-header {
            padding: 0 10px !important;
          }
        }
      `}</style>

      {/* Column 1: Catalog (Sidebar) */}
      <div style={{
        width: isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
        flexShrink: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa',
        zIndex: 10
      }}>
        <div className="custom-scrollbar" style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isSidebarOpen ? '12px' : '12px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSidebarOpen ? 'stretch' : 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 4, 
            marginBottom: 24, 
            marginTop: 8,
            width: '100%',
            alignItems: isSidebarOpen ? 'stretch' : 'center'
          }}>
            {[
              { id: 'new-chat', name: '新建会话', icon: <Plus size={16} />, action: () => setMessages([]) },
              { id: 'workspace', name: '工作空间', icon: <Layers size={16} />, action: () => setIsWorkspaceOpen(true) },
              { id: 'app-center', name: '应用中心', icon: <Box size={16} />, action: () => {} },
            ].map(item => (
              <div 
                key={item.id}
                onClick={item.action}
                title={!isSidebarOpen ? item.name : ''}
                style={{
                  padding: isSidebarOpen ? '0 12px' : '0',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  gap: isSidebarOpen ? 12 : 0,
                  color: '#555',
                  transition: 'all 0.2s',
                  width: isSidebarOpen ? 'auto' : '40px',
                  height: '40px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 8, 
                  background: '#eee', 
                  color: '#666',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transform: 'translateX(0)',
                }}>
                  {item.icon}
                </div>
                {isSidebarOpen && (
                  <div style={{ flex: 1, overflow: 'hidden', animation: 'slideIn 0.3s ease-out' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{item.name}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            width: '100%',
            alignItems: isSidebarOpen ? 'stretch' : 'center',
            marginTop: 20
          }}>
            {isSidebarOpen && (
              <div style={{ 
                padding: '0 12px', 
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                历史会话
              </div>
            )}
            {isSidebarOpen ? (
              [1, 2, 3].map(i => (
                <div 
                  key={i}
                  style={{
                    padding: '0 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    height: '40px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Clock size={14} color="#999" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>历史会话 {i}</span>
                </div>
              ))
            ) : (
              [1, 2, 3].map(i => (
                <div 
                  key={i}
                  title={`历史会话 ${i}`}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Clock size={16} color="#999" />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ 
          padding: isSidebarOpen ? '16px' : '16px 0', 
          borderTop: '1px solid #f0f0f0', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 4,
          alignItems: isSidebarOpen ? 'stretch' : 'center'
        }}>
          <div 
            onClick={() => setIsSettingsOpen(true)}
            title={!isSidebarOpen ? '设置' : ''}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              gap: isSidebarOpen ? 10 : 0, 
              padding: isSidebarOpen ? '0 12px' : '0', 
              borderRadius: 8, 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              width: isSidebarOpen ? 'auto' : '40px',
              height: '40px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ 
              width: 32, 
              display: 'flex', 
              justifyContent: 'center', 
              flexShrink: 0,
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: 'translateX(0)',
            }}>
              <Settings size={20} color="#666" />
            </div>
            {isSidebarOpen && (
              <span style={{ fontSize: 14, color: '#444', fontWeight: 500, whiteSpace: 'nowrap' }}>设置</span>
            )}
          </div>
        </div>
      </div>

      {/* Column 2: Chat Area */}
      <div style={{
        flex: 1,
        minWidth: CHAT_MIN_WIDTH,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        transition: isResizing ? 'none' : 'all 0.3s ease',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Chat Header */}
        <div 
          className="chat-header"
          style={{
            height: 60,
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            zIndex: 5
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={20} color="#666" style={{ transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedAgent.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedAgent.name}</div>
                <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  已连接
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              style={{ 
                border: '1px solid #eee', 
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
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#2563eb'
                        e.currentTarget.style.textDecoration = 'underline'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#3b82f6'
                        e.currentTarget.style.textDecoration = 'none'
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
              <div 
                key={message.id}
                style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 32,
                  animation: 'slideIn 0.3s ease-out',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: message.role === 'user' ? '#000' : '#f0f0f0',
                  color: message.role === 'user' ? '#fff' : '#666'
                }}>
                  {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 8,
                  maxWidth: 'calc(100% - 52px)',
                  alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div 
                    className="message-bubble"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 16,
                      backgroundColor: message.role === 'user' ? '#f4f4f4' : 'transparent',
                      color: '#1a1a1a',
                      fontSize: 15,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.content}
                  </div>
                  {message.toolCalls && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                      {message.toolCalls.map((tool, idx) => (
                        <div key={idx} style={{ 
                          padding: '10px 14px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: 12, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 10,
                          fontSize: 12, 
                          color: '#3b82f6', 
                          border: '1px solid #dbeafe'
                        }}>
                          <Terminal size={14} />
                          <span>调用工具: {tool.name}</span>
                          {tool.status === 'running' && <div className="animate-spin-slow" style={{ width: 12, height: 12, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }}></div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#fff', 
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0
        }}>
          <div className="responsive-content" style={{ 
            backgroundColor: '#fff', 
            borderRadius: 12, 
            border: '1px solid #e5e5e5',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`向 ${selectedAgent.name} 发送消息...`}
              style={{
                width: '100%',
                minHeight: 60,
                maxHeight: 160,
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                resize: 'none',
                fontSize: 14,
                lineHeight: 1.5,
                outline: 'none',
                color: '#1a1a1a',
                boxSizing: 'border-box',
                overflowY: 'auto'
              }}
            />
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '8px 12px'
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
            <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
              AI 可能会产生错误，请核实重要信息。
            </div>
          </div>
        </div>

      {/* Resizer Handle */}
      {isWorkspaceOpen && (
        <div 
          onMouseDown={startResizing}
          style={{
            width: RESIZER_WIDTH,
            cursor: 'col-resize',
            backgroundColor: isResizing ? '#3b82f6' : '#f0f0f0',
            transition: 'background-color 0.2s',
            zIndex: 100,
            position: 'relative'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: -4,
            right: -4,
            bottom: 0,
          }} />
        </div>
      )}

      {/* Column 3: Workspace (Visualization) */}
      <div style={{
        width: isWorkspaceOpen ? workspaceWidth : 0,
        maxWidth: isWorkspaceOpen ? `calc(100% - ${(isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED)}px - ${CHAT_MIN_WIDTH}px - ${RESIZER_WIDTH}px)` : 0,
        flexShrink: 0,
        transition: isResizing ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 5
      }}>
        <div style={{ height: 60, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="#3b82f6" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>工作区</span>
          </div>
          <button 
            onClick={() => setIsWorkspaceOpen(false)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, color: '#999' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Section: Tasks / TODOs */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>任务进度</h3>
              <span style={{ fontSize: 11, backgroundColor: '#eee', padding: '2px 8px', borderRadius: 10, color: '#666' }}>{tasks.filter(t => t.status === 'completed').length}/{tasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(task => (
                <div key={task.id} style={{
                  padding: '12px 16px',
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  border: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {task.status === 'completed' ? <CheckCircle2 size={18} color="#10b981" /> :
                   task.status === 'in_progress' ? <Clock size={18} color="#3b82f6" className="animate-spin-slow" /> :
                   <Circle size={18} color="#ccc" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: task.status === 'completed' ? '#999' : '#333', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Workflow Visualization */}
          {activeWorkflow ? (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>工作流: {activeWorkflow.title}</h3>
              <div style={{ position: 'relative', paddingLeft: 12 }}>
                <div style={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 2, backgroundColor: '#eee' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {activeWorkflow.steps.map((step, idx) => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                      <div style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        backgroundColor: step.status === 'completed' ? '#10b981' : step.status === 'running' ? '#3b82f6' : '#eee',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 2px ' + (step.status === 'completed' ? '#10b981' : step.status === 'running' ? '#3b82f6' : '#eee'),
                        zIndex: 2
                      }}></div>
                      <div style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: step.status === 'running' ? '#f0f7ff' : '#fff',
                        borderRadius: 10,
                        border: '1px solid',
                        borderColor: step.status === 'running' ? '#3b82f6' : '#eee',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: step.status === 'pending' ? '#aaa' : '#333' }}>{step.label}</div>
                        {step.status === 'running' && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>执行中...</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center', 
              backgroundColor: '#fff', 
              borderRadius: 16, 
              border: '1px dashed #ddd',
              color: '#999',
              marginBottom: 32
            }}>
              <Workflow size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <div style={{ fontSize: 13 }}>暂无活跃工作流</div>
            </div>
          )}

          {/* Section: Tool Terminal */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>终端输出</h3>
            <div style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: 12, 
              padding: '16px', 
              fontFamily: 'monospace', 
              fontSize: 12, 
              color: '#fff',
              minHeight: 120,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#666', marginBottom: 8 }}>$ agent --version</div>
              <div style={{ color: '#10b981' }}>agent v1.0.0-beta.1 initialized.</div>
              <div style={{ color: '#666', marginTop: 8, marginBottom: 8 }}>$ ls -la</div>
              <div style={{ color: '#eee' }}>
                drwxr-xr-x  2 user  group   64 Feb 12 10:00 .<br/>
                drwxr-xr-x  5 user  group  160 Feb 12 10:00 ..<br/>
                -rw-r--r--  1 user  group  428 Feb 12 10:00 index.tsx
              </div>
              <div style={{ color: '#3b82f6', marginTop: 8 }}>_</div>
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
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            width: 480,
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>设置</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>API Endpoint</label>
                <input 
                  type="text" 
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #eee', fontSize: 14, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>Model Name</label>
                <input 
                  type="text" 
                  value={apiModel}
                  onChange={(e) => setApiModel(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #eee', fontSize: 14, outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 40 }}>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #eee', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
              >
                取消
              </button>
              <button 
                onClick={saveSettings}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#000', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

