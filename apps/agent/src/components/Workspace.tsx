import React from 'react'
import { Sparkles, ChevronRight, CheckCircle2, Clock, Circle, Workflow } from 'lucide-react'
import { AgentTask, AgentWorkflow } from '../types'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, CHAT_MIN_WIDTH, RESIZER_WIDTH } from '../constants'

interface WorkspaceProps {
  isWorkspaceOpen: boolean
  setIsWorkspaceOpen: (open: boolean) => void
  workspaceWidth: number
  isSidebarOpen: boolean
  isResizing: boolean
  tasks: AgentTask[]
  activeWorkflow: AgentWorkflow | null
}

export const Workspace: React.FC<WorkspaceProps> = ({
  isWorkspaceOpen,
  setIsWorkspaceOpen,
  workspaceWidth,
  isSidebarOpen,
  isResizing,
  tasks,
  activeWorkflow
}) => {
  return (
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
            <div style={{ fontSize: 14, fontWeight: 500, color: '#666', marginBottom: 4 }}>暂无活跃工作流</div>
            <div style={{ fontSize: 12 }}>与 Agent 交互以触发自动化流程</div>
          </div>
        )}
      </div>
    </div>
  )
}
