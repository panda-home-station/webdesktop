import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, ChevronRight, CheckCircle2, Clock, Circle, ZoomIn, ZoomOut, Maximize, RotateCcw, Brain, Terminal } from 'lucide-react'
import { AgentTask, AgentWorkflow, WorkspaceContent } from '../types'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, CHAT_MIN_WIDTH, RESIZER_WIDTH } from '../constants'
import { MarkdownContent } from './MarkdownContent'

interface WorkspaceProps {
  isWorkspaceOpen: boolean
  setIsWorkspaceOpen: (open: boolean) => void
  workspaceWidth: number
  isSidebarOpen: boolean
  isResizing: boolean
  tasks: AgentTask[]
  activeWorkflow: AgentWorkflow | null
  isInitial?: boolean
  workspaceContent?: WorkspaceContent
}

const DetailView = ({ content }: { content: WorkspaceContent }) => {
  if (content.type === 'thinking') {
    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%', backgroundColor: '#fff' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, 
            backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Brain size={20} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Thinking Process</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Detailed reasoning steps</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {content.content.map((thought, idx) => (
            <div key={idx} style={{ 
              padding: '16px', 
              backgroundColor: '#f9fafb', 
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                fontSize: 12, fontWeight: 600, color: '#6b7280', 
                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 
              }}>
                <span style={{ 
                  width: 20, height: 20, borderRadius: '50%', backgroundColor: '#e5e7eb', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' 
                }}>{idx + 1}</span>
                THOUGHT STEP
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: '#374151' }}>
                <MarkdownContent content={thought} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (content.type === 'tool') {
    const tool = content.content
    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%', backgroundColor: '#fff' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, 
            backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Terminal size={20} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Tool Execution</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{tool.name}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Input Section */}
          <div>
            <div style={{ 
              fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>Input Arguments</div>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#1e293b', 
              borderRadius: 12,
              color: '#e2e8f0',
              fontFamily: 'monospace',
              fontSize: 13,
              overflowX: 'auto',
              border: '1px solid #334155'
            }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(tool.args, null, 2)}</pre>
            </div>
          </div>

          {/* Status Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Status:</div>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 6,
              color: tool.status === 'completed' ? '#16a34a' : tool.status === 'error' ? '#dc2626' : '#d97706',
              fontWeight: 600, fontSize: 14
            }}>
              {tool.status === 'completed' && <CheckCircle2 size={16} />}
              {tool.status === 'running' && <Clock size={16} className="animate-spin" />}
              {tool.status === 'error' && <Circle size={16} />}
              <span style={{ textTransform: 'capitalize' }}>{tool.status}</span>
            </div>
          </div>

          {/* Output Section */}
          {tool.result && (
            <div>
              <div style={{ 
                fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>Execution Result</div>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#fff', 
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#334155',
                overflowX: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{tool.result}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

const NodeItem = ({ 
  title, 
  status, 
  index, 
  isLast 
}: { 
  title: string, 
  status: string, 
  index: number, 
  isLast: boolean 
}) => {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: 280,
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: 12,
        border: `1px solid ${status === 'running' || status === 'in_progress' ? '#3b82f6' : status === 'completed' ? '#10b981' : '#e5e7eb'}`,
        boxShadow: status === 'running' || status === 'in_progress' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
        zIndex: 2,
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: status === 'running' || status === 'in_progress' ? '#eff6ff' : status === 'completed' ? '#ecfdf5' : '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: status === 'running' || status === 'in_progress' ? '#3b82f6' : status === 'completed' ? '#10b981' : '#9ca3af',
          flexShrink: 0
        }}>
          {status === 'completed' ? <CheckCircle2 size={18} /> :
           status === 'running' || status === 'in_progress' ? <Clock size={18} className="animate-spin-slow" /> :
           <Circle size={18} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: status === 'completed' ? '#374151' : '#111827',
            marginBottom: 4
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: status === 'running' || status === 'in_progress' ? '#3b82f6' : status === 'completed' ? '#10b981' : '#6b7280',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {status === 'in_progress' ? 'RUNNING' : status}
          </div>
        </div>
        
        <div style={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: '#6b7280',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {index + 1}
        </div>
      </div>

      {!isLast && (
        <div style={{ 
          height: 40, 
          width: 2, 
          backgroundColor: status === 'completed' ? '#10b981' : '#e5e7eb',
          margin: '4px 0',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            bottom: -4,
            left: -3,
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `6px solid ${status === 'completed' ? '#10b981' : '#e5e7eb'}`
          }} />
        </div>
      )}
    </div>
  )
}

export const Workspace: React.FC<WorkspaceProps> = ({
  isWorkspaceOpen,
  setIsWorkspaceOpen,
  workspaceWidth,
  isSidebarOpen,
  isResizing,
  tasks,
  activeWorkflow,
  isInitial,
  workspaceContent = { type: 'workflow' }
}) => {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastMousePos = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - lastMousePos.current.x
    const dy = e.clientY - lastMousePos.current.y
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setScale(prev => Math.min(Math.max(prev * delta, 0.5), 2))
    }
  }

  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 50 })
  }

  // Combine tasks and workflow steps for visualization
  const itemsToRender = activeWorkflow?.steps || tasks.map(t => ({ id: t.id, label: t.title, status: t.status })) || []
  
  let workflowTitle = "Workflow"
  let icon = <Sparkles size={18} color="#3b82f6" />
  let tagText = "Infinite Canvas"
  let tagColor = "#3b82f6"
  let tagBg = "#eff6ff"

  if (workspaceContent.type === 'thinking') {
    workflowTitle = "Thinking Process"
    icon = <Brain size={18} color="#3b82f6" />
    tagText = "Reasoning"
  } else if (workspaceContent.type === 'tool') {
    workflowTitle = "Tool Execution"
    icon = <Terminal size={18} color="#16a34a" />
    tagText = "System"
    tagColor = "#16a34a"
    tagBg = "#f0fdf4"
  } else {
    workflowTitle = activeWorkflow?.title || (tasks.length > 0 ? "Task Execution Plan" : "Workflow")
  }

  return (
    <div style={{
      width: isWorkspaceOpen ? workspaceWidth : 0,
      maxWidth: isWorkspaceOpen ? `calc(100% - ${(isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED)}px - ${CHAT_MIN_WIDTH}px - ${RESIZER_WIDTH}px)` : 0,
      flexShrink: 0,
      transition: (isResizing || isInitial) ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 5,
      boxSizing: 'border-box',
      borderLeft: '1px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{ 
        height: 60, 
        borderBottom: '1px solid #f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 20px', 
        justifyContent: 'space-between', 
        backgroundColor: '#fff', 
        flexShrink: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <span style={{ fontWeight: 600, fontSize: 15 }}>{workflowTitle}</span>
          <span style={{ 
            fontSize: 11, 
            backgroundColor: tagBg, 
            color: tagColor, 
            padding: '2px 8px', 
            borderRadius: 10,
            fontWeight: 500
          }}>
            {tagText}
          </span>
        </div>
        <button 
          onClick={() => setIsWorkspaceOpen(false)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, color: '#999' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {workspaceContent.type === 'workflow' ? (
        /* Infinite Canvas */
        <div 
          ref={containerRef}
          style={{ 
            flex: 1, 
            overflow: 'hidden', 
            position: 'relative', 
            cursor: isDragging ? 'grabbing' : 'grab',
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundColor: '#f8fafc'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px) scale(${scale})`,
            transformOrigin: 'top center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: 100
          }}>
            {itemsToRender.length > 0 ? (
              itemsToRender.map((item: any, index: number) => (
                <NodeItem 
                  key={item.id} 
                  title={item.label || item.title} 
                  status={item.status} 
                  index={index}
                  isLast={index === itemsToRender.length - 1}
                />
              ))
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 16, 
                opacity: 0.5, 
                marginTop: 100 
              }}>
                <Sparkles size={48} color="#cbd5e1" />
                <div style={{ color: '#64748b', fontWeight: 500 }}>No active workflow</div>
              </div>
            )}
          </div>

          {/* Canvas Controls */}
          <div style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            display: 'flex',
            gap: 8,
            backgroundColor: '#fff',
            padding: '8px',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 20
          }}>
            <button 
              onClick={() => setScale(s => Math.min(s + 0.1, 2))}
              style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', borderRadius: 8, transition: 'background 0.2s' }}
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button 
              onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}
              style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', borderRadius: 8, transition: 'background 0.2s' }}
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <button 
              onClick={resetView}
              style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', borderRadius: 8, transition: 'background 0.2s' }}
              title="Reset View"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      ) : (
        <DetailView content={workspaceContent} />
      )}
    </div>
  )
}