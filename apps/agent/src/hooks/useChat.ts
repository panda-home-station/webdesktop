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
    
    // Create placeholder assistant message
    const assistantMsgId = Date.now().toString() + '-assistant';
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      thoughts: [],
      toolCalls: []
    }]);

    try {
      const historyMessages = messages.filter(m => m.id !== userMsg.id && m.id !== 'tool-executing');
      const limitedHistory = contextWindow > 0 ? historyMessages.slice(-contextWindow) : historyMessages;

      const chatMessages = [
        ...(selectedAgent.systemPrompt ? [{ role: 'system', content: selectedAgent.systemPrompt }] : []),
        ...(customInstructions ? [{ role: 'system', content: `用户自定义指令：\n${customInstructions}` }] : []),
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              
              setMessages(prev => prev.map(m => {
                if (m.id !== assistantMsgId) return m;

                const updatedMsg = { ...m };
                
                if (event.type === 'thought') {
                  // Add new thought or append to last thought if it's incomplete (not implemented here, assuming full thoughts for now)
                  // For streaming thoughts, we might want to just append text. 
                  // But the backend seems to send full thought content or chunks?
                  // Let's assume 'thought' event sends a chunk of thought text.
                  // Wait, the backend implementation sends: AgentEvent::Thought(content)
                  // If it's a stream of tokens, we should append. If it's a full block, we push.
                  // The backend loop sends `Thought(content)` when `response.tool_calls` is present.
                  // It seems `content` is the whole text so far? Or a chunk?
                  // In `AgentRuntime`, `provider.chat` returns a stream. 
                  // But the `AgentEvent::Thought` is emitted when `response.content` is present AND `tool_calls` is present.
                  // Actually, `AgentRuntime` logic is:
                  // if content is present:
                  //   if no tool calls: Answer(content)
                  //   else: Thought(content)
                  // So it's sending chunks.
                  
                  // Let's treat thoughts as a list of strings. 
                  // If the last item in thoughts is "active", we append. 
                  // But for simplicity, let's just push to thoughts array if it's a new "block" of thought.
                  // However, usually thoughts are just text. 
                  // Let's append to the last thought entry if it exists, otherwise create new.
                  const thoughts = updatedMsg.thoughts || [];
                  if (thoughts.length === 0) {
                    thoughts.push(event.content);
                  } else {
                    // Simple append for now
                    thoughts[thoughts.length - 1] += event.content;
                  }
                  updatedMsg.thoughts = thoughts;
                } else if (event.type === 'tool_call') {
                  const toolCall = event.content; // Expecting {id, function: {name, arguments}}
                  const toolCalls = updatedMsg.toolCalls || [];
                  // Check if tool call already exists (by ID) to avoid duplicates if re-sent
                  if (!toolCalls.find(tc => tc.id === toolCall.id)) {
                    toolCalls.push({
                      id: toolCall.id,
                      name: toolCall.function.name,
                      args: JSON.parse(toolCall.function.arguments),
                      status: 'running'
                    });
                  }
                  updatedMsg.toolCalls = toolCalls;
                } else if (event.type === 'tool_result') {
                  const { id, result } = event.content;
                  const toolCalls = updatedMsg.toolCalls || [];
                  updatedMsg.toolCalls = toolCalls.map(tc => 
                    tc.id === id ? { ...tc, status: 'completed', result } : tc
                  );
                } else if (event.type === 'answer') {
                  updatedMsg.content += event.content;
                }

                return updatedMsg;
              }));

            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Final update to history
      if (sessionId) {
        // Fetch the updated message from state to save it
        // Since setMessages is async, we can't rely on 'messages' here.
        // But we can construct the final message content from what we have.
        // Actually, better to just let the backend handle persistence if possible, 
        // but here we are frontend-driven.
        // We should save the final assistant message to the backend session.
        // For now, let's just update the local history list last message.
        setHistory(prev => prev.map(s => {
          if (s.id === sessionId) {
            return {
              ...s,
              lastMessage: 'Assistant responded', // Placeholder or actual content
              timestamp: new Date()
            }
          }
          return s;
        }));
      }

    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', e);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          content: `Error: ${e.message}`,
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
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
