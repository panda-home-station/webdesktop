import React, { useState, useRef, useEffect } from 'react'
import { Message, Agent, AgentWorkflow, AgentTask, ChatSession } from '../types'
import { MOCK_AGENTS, MOCK_HISTORY } from '../constants'

export function useChat(initialMessages?: any[]) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages.map(m => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
      }))
    }
    return []
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent>(MOCK_AGENTS[0])
  const [history, setHistory] = useState<ChatSession[]>(MOCK_HISTORY)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [activeWorkflow, setActiveWorkflow] = useState<AgentWorkflow | null>(null)
  const [tasks, setTasks] = useState<AgentTask[]>([
    { id: '1', title: '分析项目结构', status: 'completed', createdAt: new Date() },
    { id: '2', title: '实现三栏布局 UI', status: 'in_progress', createdAt: new Date() },
    { id: '3', title: '对接工具 API', status: 'pending', createdAt: new Date() },
  ])

  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('agent_api_endpoint') || 'http://192.168.1.189:11434')
  const [apiModel, setApiModel] = useState(() => localStorage.getItem('agent_api_model') || 'qwen3:14b')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement?.parentElement
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }

  const loadSession = (sessionId: string) => {
    const session = history.find(s => s.id === sessionId)
    if (session) {
      setMessages(session.messages)
      setSelectedSessionId(sessionId)
      const agent = MOCK_AGENTS.find(a => a.id === session.agentId)
      if (agent) setSelectedAgent(agent)
    }
  }

  const createNewChat = () => {
    setMessages([])
    setSelectedSessionId(null)
    setSelectedAgent(MOCK_AGENTS[0])
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

    // Dynamic workflow logic
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

    try {
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
        setMessages(prev => [...prev, {
          id: 'tool-executing',
          role: 'assistant',
          content: '正在调用工具处理您的请求...',
          timestamp: new Date(),
          toolCalls
        }])
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

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      if (isToolExecuting) {
        setMessages(prev => prev.filter(m => m.id !== 'tool-executing'))
        setIsLoading(false)
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
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date() }]);
      setIsLoading(false);

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
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

      setActiveWorkflow(prev => {
        if (!prev) return null;
        return { ...prev, status: 'completed', steps: prev.steps.map(s => ({ ...s, status: 'completed' })) };
      });

    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
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

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    handleSend,
    handleStop,
    handleKeyDown,
    selectedAgent,
    setSelectedAgent,
    activeWorkflow,
    tasks,
    apiEndpoint,
    setApiEndpoint,
    apiModel,
    setApiModel,
    messagesEndRef,
    history,
    selectedSessionId,
    loadSession,
    createNewChat
  }
}
