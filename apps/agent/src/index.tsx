import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { Workspace } from './components/Workspace'
import { SettingsModal } from './components/SettingsModal'
import { useLayout } from './hooks/useLayout'
import { useChat } from './hooks/useChat'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, CHAT_MIN_WIDTH, RESIZER_WIDTH } from './constants'

export default function AgentApp({ initialMessages }: { initialMessages?: any[] }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
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
    history,
    selectedSessionId,
    loadSession,
    deleteSession,
    createNewChat,
    selectedTools,
    toggleTool
  } = useChat(initialMessages)

  const saveSettings = () => {
    localStorage.setItem('agent_api_endpoint', apiEndpoint)
    localStorage.setItem('agent_api_model', apiModel)
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
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        toggleWorkspace={toggleWorkspace}
        setIsSettingsOpen={setIsSettingsOpen}
        selectedAgent={selectedAgent}
        setSelectedAgent={setSelectedAgent}
        setMessages={setMessages}
        history={history}
        selectedSessionId={selectedSessionId}
        loadSession={loadSession}
        onDeleteSession={deleteSession}
        createNewChat={createNewChat}
        isInitial={isInitial}
      />

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
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        setIsOpen={setIsSettingsOpen}
        apiEndpoint={apiEndpoint}
        setApiEndpoint={setApiEndpoint}
        apiModel={apiModel}
        setApiModel={setApiModel}
        saveSettings={saveSettings}
      />
    </div>
  )
}
