import React, { useState, useEffect, useContext } from 'react'
import { WindowContext } from '../../../src/sdk/window'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { Workspace } from './components/Workspace'
import { SettingsPage } from './components/SettingsPage'
import { useLayout } from './hooks/useLayout'
import { useChat } from './hooks/useChat'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, CHAT_MIN_WIDTH, RESIZER_WIDTH } from './constants'
import { AgentTask, AgentWorkflow, WorkspaceContent } from './types'

export default function AgentApp({ initialMessages }: { initialMessages?: any[] }) {
  const win = useContext(WindowContext)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [workspaceContent, setWorkspaceContent] = useState<WorkspaceContent>({ type: 'workflow' })
  
  useEffect(() => {
    if (win && win.setTitle) {
      win.setTitle('Agent - AI Assistant')
    }
  }, [win])

  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isWorkspaceOpen,
    setIsWorkspaceOpen,
    toggleWorkspace,
    workspaceWidth,
    isResizing,
    isInitial,
    containerRef,
    startResizing
  } = useLayout()

  const {
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
    deleteSession,
    createNewChat,
    selectedTools,
    toggleTool,
    contextWindow,
    setContextWindow,
    temperature,
    setTemperature,
    customInstructions,
    setCustomInstructions
  } = useChat(initialMessages)

  const saveSettings = () => {
    localStorage.setItem('agent_api_endpoint', apiEndpoint)
    localStorage.setItem('agent_api_model', apiModel)
    localStorage.setItem('agent_api_list', JSON.stringify(apiConfigs))
    localStorage.setItem('agent_api_selected_id', selectedApiId)
    localStorage.setItem('agent_context_window', contextWindow.toString())
    localStorage.setItem('agent_temperature', temperature.toString())
    localStorage.setItem('agent_custom_instructions', customInstructions)
    setIsSettingsOpen(false)
  }

  const handleCreateNewChat = () => {
    createNewChat()
    setIsSettingsOpen(false)
  }

  const handleLoadSession = (sessionId: string) => {
    loadSession(sessionId)
    setIsSettingsOpen(false)
  }

  const handleToggleWorkspace = () => {
    toggleWorkspace()
    setIsSettingsOpen(false)
  }

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        minWidth: (isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED) + CHAT_MIN_WIDTH + (isWorkspaceOpen ? RESIZER_WIDTH : 0),
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
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: #d1d5db transparent;
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
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        toggleWorkspace={handleToggleWorkspace}
        setIsSettingsOpen={setIsSettingsOpen}
        selectedAgent={selectedAgent}
        setSelectedAgent={setSelectedAgent}
        setMessages={setMessages}
        history={history}
        selectedSessionId={selectedSessionId}
        loadSession={handleLoadSession}
        onDeleteSession={deleteSession}
        createNewChat={handleCreateNewChat}
        isInitial={isInitial}
      />

      {isSettingsOpen ? (
        <SettingsPage 
          apiEndpoint={apiEndpoint}
          setApiEndpoint={setApiEndpoint}
          apiModel={apiModel}
          setApiModel={setApiModel}
          apiConfigs={apiConfigs}
          setApiConfigs={setApiConfigs}
          selectedApiId={selectedApiId}
          setSelectedApiId={setSelectedApiId}
          contextWindow={contextWindow}
          setContextWindow={setContextWindow}
          temperature={temperature}
          setTemperature={setTemperature}
          customInstructions={customInstructions}
          setCustomInstructions={setCustomInstructions}
          saveSettings={saveSettings}
          onCancel={() => setIsSettingsOpen(false)}
        />
      ) : (
        <>
          {/* Column 2: Chat Area */}
          <ChatArea 
            messages={messages}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            handleSend={handleSend}
            handleStop={handleStop}
            handleKeyDown={handleKeyDown}
            selectedAgent={selectedAgent}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isWorkspaceOpen={isWorkspaceOpen}
            toggleWorkspace={toggleWorkspace}
            selectedTools={selectedTools}
            onToggleTool={toggleTool}
            setWorkspaceContent={setWorkspaceContent}
            setIsWorkspaceOpen={setIsWorkspaceOpen}
          />

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
                position: 'relative',
                userSelect: 'none'
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
          <Workspace 
            isWorkspaceOpen={isWorkspaceOpen}
            setIsWorkspaceOpen={setIsWorkspaceOpen}
            workspaceWidth={workspaceWidth}
            isSidebarOpen={isSidebarOpen}
            isResizing={isResizing}
            tasks={tasks}
            activeWorkflow={activeWorkflow}
            isInitial={isInitial}
            workspaceContent={workspaceContent}
          />
        </>
      )}
    </div>
  )
}
