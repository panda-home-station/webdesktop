import React, { useState, useRef, useEffect } from 'react'
import { Message, Agent, AgentWorkflow, AgentTask, ChatSession, ApiConfig } from '../types'
import { MOCK_AGENTS } from '../constants'

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
  const [history, setHistory] = useState<ChatSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [activeWorkflow, setActiveWorkflow] = useState<AgentWorkflow | null>(null)
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [tasks, setTasks] = useState<AgentTask[]>([
    { id: '1', title: '分析项目结构', status: 'completed', createdAt: new Date() },
    { id: '2', title: '实现三栏布局 UI', status: 'in_progress', createdAt: new Date() },
    { id: '3', title: '对接工具 API', status: 'pending', createdAt: new Date() },
  ])

  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>(() => {
    try {
      const stored = localStorage.getItem('agent_api_list')
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse api list', e)
    }
    return [{
      id: 'default',
      name: '默认 API',
      endpoint: localStorage.getItem('agent_api_endpoint') || 'http://192.168.1.189:11434',
      model: localStorage.getItem('agent_api_model') || 'qwen3:14b'
    }]
  })
  
  const [selectedApiId, setSelectedApiId] = useState<string>(() => {
    return localStorage.getItem('agent_api_selected_id') || 'default'
  })

  const currentApiConfig = apiConfigs.find(c => c.id === selectedApiId) || apiConfigs[0]
  const apiEndpoint = currentApiConfig?.endpoint || ''
  const apiModel = currentApiConfig?.model || ''

  const setApiEndpoint = (endpoint: string) => {
    setApiConfigs(prev => prev.map(c => c.id === selectedApiId ? { ...c, endpoint } : c))
  }

  const setApiModel = (model: string) => {
    setApiConfigs(prev => prev.map(c => c.id === selectedApiId ? { ...c, model } : c))
  }
  const [contextWindow, setContextWindow] = useState(() => parseInt(localStorage.getItem('agent_context_window') || '10'))
  const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem('agent_temperature') || '0.7'))
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem('agent_custom_instructions') || '')
  
  const fetchSessions = async () => {
    try {
      const resp = await fetch('/api/agent/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        setHistory(data.map((s: any) => ({
          ...s,
          timestamp: new Date(s.updated_at),
          lastMessage: s.last_message, // Map backend last_message to frontend camelCase
          agentId: s.agent_id,
          messages: [] 
        })));
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setMessages([]); // Clear current messages while loading
      const resp = await fetch(`/api/agent/sessions/${sessionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (resp.ok) {
        const messagesData = await resp.json();
        const session = history.find(s => s.id === sessionId);
        const agent = session ? MOCK_AGENTS.find(a => a.id === session.agentId) : MOCK_AGENTS[0];
        
        setMessages(messagesData.map((m: any) => ({
          ...m,
          timestamp: new Date(m.created_at),
          toolCalls: m.tool_calls // Map snake_case to camelCase
        })));
        setSelectedSessionId(sessionId);
        if (agent) setSelectedAgent(agent);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const resp = await fetch(`/api/agent/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (resp.ok) {
        setHistory(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSessionId === sessionId) {
          createNewChat();
        }
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  }

  const createNewChat = () => {
    setMessages([])
    setSelectedSessionId(null)
    setSelectedAgent(MOCK_AGENTS[0])
    setSelectedTools([])
  }

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId) 
        : [...prev, toolId]
    )
  }

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      const lastMsg = initialMessages[initialMessages.length - 1];
      if (lastMsg.role === 'user') {
        // 只有当这是新消息时才发送
        const isAlreadyProcessed = messages.some(m => m.id === lastMsg.id && m.role === 'assistant');
        if (!isAlreadyProcessed) {
          const exists = messages.find(m => m.id === lastMsg.id);
          let userMsg = exists;
          if (!exists) {
            userMsg = {
              ...lastMsg,
              timestamp: lastMsg.timestamp ? new Date(lastMsg.timestamp) : new Date()
            };
            setMessages(prev => [...prev, userMsg!]);
          }
          processMessage(lastMsg.content, userMsg!);
        }
      }
    }
  }, [initialMessages]);

  const handleSend = async (overrideContent?: string) => {
    const content = overrideContent || input;
    if (!content.trim() || isLoading) return
    
    let sessionId = selectedSessionId;
    
    // Create new session if none selected
    if (!sessionId) {
      try {
        const title = content.length > 20 ? content.slice(0, 20) + '...' : content;
        const resp = await fetch('/api/agent/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          body: JSON.stringify({
            agent_id: selectedAgent.id,
            title: title
          })
        });
        if (resp.ok) {
          const session = await resp.json();
          sessionId = session.id;
          setSelectedSessionId(sessionId);
          
          // Add the new session to history immediately
          setHistory(prev => [{
            id: session.id,
            title: session.title,
            agentId: session.agent_id,
            lastMessage: content,
            timestamp: new Date(session.updated_at),
            messages: []
          }, ...prev]);
        }
      } catch (e) {
        console.error('Failed to create session:', e);
      }
    }

    const userMsg: Message = { 
      id: Date.now().toString(),
      role: 'user', 
      content: content,
      timestamp: new Date()
    }
    
    if (!overrideContent) {
      setInput('')
    }
    
    setMessages(prev => [...prev, userMsg])
    await processMessage(content, userMsg, sessionId);
  }

  const processMessage = async (content: string, userMsg: Message, sessionId: string | null) => {
    abortControllerRef.current = new AbortController()
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
    } else if (selectedAgent.id === 'workflow-master' || content.includes('流程')) {
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
      const isSearchIntent = selectedTools.includes('web_search') || 
                            content.toLowerCase().includes('搜索') || 
                            content.toLowerCase().includes('search') || 
                            content.toLowerCase().includes('联网') ||
                            selectedAgent.id === 'researcher';

      if (isSearchIntent) {
        // Try to extract search query if it's a long message, otherwise use the whole thing
        const query = content.length > 50 ? content.slice(0, 50) : content;
        toolCalls = [{ name: 'web_search', args: { query }, status: 'running' }]
      } else if (selectedTools.includes('file_system') || content.toLowerCase().includes('文件') || content.toLowerCase().includes('file')) {
        toolCalls = [{ name: 'file_system', args: { action: 'read' }, status: 'running' }]
      } else if (selectedTools.includes('terminal') || content.toLowerCase().includes('命令') || content.toLowerCase().includes('run')) {
        toolCalls = [{ name: 'terminal', args: { cmd: content }, status: 'running' }]
      }

      // Reset selected tools after use
      setSelectedTools([])

      let isToolExecuting = false;
      let searchResults = '';
      if (toolCalls) {
        isToolExecuting = true;
        const toolMsgId = 'tool-executing';
        setMessages(prev => [...prev, {
          id: toolMsgId,
          role: 'assistant',
          content: '正在调用工具处理您的请求...',
          timestamp: new Date(),
          toolCalls
        }])

      // If it's a web search, actually perform it
      const searchCall = toolCalls.find(tc => tc.name === 'web_search');
      if (searchCall) {
        try {
          const searchResp = await fetch('/api/agent/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            body: JSON.stringify({ q: searchCall.args.query })
          });
          if (searchResp.ok) {
            const results = await searchResp.json();
            if (Array.isArray(results) && results.length > 0) {
              searchResults = results.map((r: any) => `标题: ${r.title}\n链接: ${r.link}\n摘要: ${r.snippet}`).join('\n\n');
              
              const assistantContent = `已为您找到以下搜索结果：\n\n${searchResults.slice(0, 500)}...`;
              
              setMessages(prev => prev.map(m => 
                m.id === toolMsgId ? { 
                  ...m, 
                  content: assistantContent,
                  toolCalls: m.toolCalls?.map(tc => tc.name === 'web_search' ? { ...tc, status: 'completed', result: JSON.stringify(results) } : tc)
                } : m
              ));

              // Save tool result to history
              if (sessionId) {
                fetch(`/api/agent/sessions/${sessionId}/messages`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                  },
                  body: JSON.stringify({
                    role: 'assistant',
                    content: assistantContent,
                    tool_calls: toolCalls?.map(tc => tc.name === 'web_search' ? { ...tc, status: 'completed', result: JSON.stringify(results) } : tc)
                  })
                }).then(() => {
                  // 更新侧边栏预览
                  setHistory(prev => prev.map(s => 
                    s.id === sessionId ? { ...s, lastMessage: assistantContent, timestamp: new Date() } : s
                  ));
                }).catch(e => console.error('Failed to save tool message:', e));
              }
            } else {
                setMessages(prev => prev.map(m => 
                  m.id === toolMsgId ? { 
                    ...m, 
                    content: '未找到相关搜索结果。',
                    toolCalls: m.toolCalls?.map(tc => tc.name === 'web_search' ? { ...tc, status: 'completed', result: '[]' } : tc)
                  } : m
                ));
              }
            }
          } catch (e) {
            console.error('Search failed:', e);
          }
        }
      }

      const historyMessages = messages.filter(m => m.id !== userMsg.id && m.id !== 'tool-executing');
      // Apply context window limit
      const limitedHistory = contextWindow > 0 ? historyMessages.slice(-contextWindow) : historyMessages;

      const systemPrompt = selectedAgent.systemPrompt + 
        (customInstructions ? `\n\n用户自定义指令：\n${customInstructions}` : '') + 
        (searchResults ? `\n\n以下是相关的搜索结果，请参考这些信息回答用户的问题：\n${searchResults}` : '');

      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...limitedHistory.map(m => ({ role: m.role, content: m.content })),
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
          endpoint: apiEndpoint,
          session_id: sessionId
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      if (isToolExecuting) {
        // Keep search results in history by giving it a unique ID
        setMessages(prev => prev.map(m => m.id === 'tool-executing' ? { ...m, id: 'tool-' + Date.now() } : m))
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
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Save assistant message to history if session exists
          if (sessionId && fullContent) {
            fetch(`/api/agent/sessions/${sessionId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
              },
              body: JSON.stringify({
                role: 'assistant',
                content: fullContent
              })
            }).then(() => {
              // 更新侧边栏预览
              setHistory(prev => prev.map(s => 
                s.id === sessionId ? { ...s, lastMessage: fullContent, timestamp: new Date() } : s
              ));
            }).catch(e => console.error('Failed to save assistant message:', e));
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              // 尝试解析 JSON 格式的内容（新后端格式）
              const data = JSON.parse(dataStr);
              if (data && typeof data.content === 'string') {
                fullContent += data.content;
              } else {
                fullContent += dataStr;
              }
            } catch (e) {
              // 如果不是 JSON，回退到原始字符串解析（兼容旧后端或非标准 SSE）
              fullContent += dataStr;
            }
            
            setMessages(prev => prev.map(m => 
              m.id === assistantMsgId ? { ...m, content: fullContent } : m
            ));
          }
        }
      }

      setActiveWorkflow(prev => {
        if (!prev) return null;
        const newSteps = [...prev.steps];
        const runningIdx = newSteps.findIndex(s => s.status === 'running');
        if (runningIdx !== -1) {
          newSteps[runningIdx].status = 'completed';
        }
        return { ...prev, status: 'completed', steps: newSteps };
      });

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: 'error-' + Date.now(), 
        role: 'assistant', 
        content: '抱歉，处理您的请求时出错了。', 
        timestamp: new Date() 
      }]);
      setIsLoading(false);
      setActiveWorkflow(prev => prev ? { ...prev, status: 'failed' } : null);
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
    apiConfigs,
    setApiConfigs,
    selectedApiId,
    setSelectedApiId,
    history,
    selectedSessionId,
    loadSession,
    createNewChat,
    selectedTools,
    toggleTool,
    contextWindow,
    setContextWindow,
    temperature,
    setTemperature,
    customInstructions,
    setCustomInstructions
  }
}
