import React, { useState } from 'react'
import { 
  X, Plus, Check, Trash2, Server, MessageSquare, 
  Cpu, Command, Save, RotateCcw, MoreHorizontal 
} from 'lucide-react'
import { ApiConfig } from '../types'

interface SettingsPageProps {
  apiEndpoint: string
  setApiEndpoint: (endpoint: string) => void
  apiModel: string
  setApiModel: (model: string) => void
  apiConfigs: ApiConfig[]
  setApiConfigs: React.Dispatch<React.SetStateAction<ApiConfig[]>>
  selectedApiId: string
  setSelectedApiId: React.Dispatch<React.SetStateAction<string>>
  contextWindow: number
  setContextWindow: (window: number) => void
  temperature: number
  setTemperature: (temp: number) => void
  customInstructions: string
  setCustomInstructions: (instructions: string) => void
  saveSettings: () => void
  onCancel: () => void
}

type Tab = 'models' | 'general' | 'instructions'

export const SettingsPage: React.FC<SettingsPageProps> = ({
  apiConfigs,
  setApiConfigs,
  selectedApiId,
  setSelectedApiId,
  contextWindow,
  setContextWindow,
  temperature,
  setTemperature,
  customInstructions,
  setCustomInstructions,
  saveSettings,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('models')
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null)
  const [isNewConfig, setIsNewConfig] = useState(false)

  // Local state for editing
  const [editName, setEditName] = useState('')
  const [editEndpoint, setEditEndpoint] = useState('')
  const [editModel, setEditModel] = useState('')

  const handleEditConfig = (config: ApiConfig) => {
    setEditingConfig(config)
    setIsNewConfig(false)
    setEditName(config.name)
    setEditEndpoint(config.endpoint)
    setEditModel(config.model)
  }

  const handleAddConfig = () => {
    const newConfig: ApiConfig = {
      id: Date.now().toString(),
      name: 'New API',
      endpoint: 'http://localhost:11434/v1',
      model: 'llama3'
    }
    setEditingConfig(newConfig)
    setIsNewConfig(true)
    setEditName(newConfig.name)
    setEditEndpoint(newConfig.endpoint)
    setEditModel(newConfig.model)
  }

  const handleSaveConfig = () => {
    if (!editingConfig) return

    const updatedConfig = {
      ...editingConfig,
      name: editName,
      endpoint: editEndpoint,
      model: editModel
    }

    if (isNewConfig) {
      setApiConfigs(prev => [...prev, updatedConfig])
    } else {
      setApiConfigs(prev => prev.map(c => c.id === updatedConfig.id ? updatedConfig : c))
    }
    setEditingConfig(null)
  }

  const handleDeleteConfig = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (apiConfigs.length <= 1) {
      alert('至少保留一个 API 配置')
      return
    }
    
    setApiConfigs(prev => prev.filter(c => c.id !== id))
    if (selectedApiId === id) {
      const remaining = apiConfigs.filter(c => c.id !== id)
      if (remaining.length > 0) {
        setSelectedApiId(remaining[0].id)
      }
    }
    if (editingConfig?.id === id) {
      setEditingConfig(null)
    }
  }

  const renderSidebarItem = (id: Tab, icon: React.ReactNode, label: string) => (
    <div
      onClick={() => {
        setActiveTab(id)
        setEditingConfig(null)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderRadius: 8,
        cursor: 'pointer',
        backgroundColor: activeTab === id ? '#e5e7eb' : 'transparent',
        color: activeTab === id ? '#111827' : '#4b5563',
        fontWeight: activeTab === id ? 600 : 500,
        transition: 'all 0.2s',
        marginBottom: 4
      }}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      <span style={{ fontSize: 14 }}>{label}</span>
    </div>
  )

  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: '#fff',
      display: 'flex',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Settings Sidebar */}
      <div style={{
        width: 240,
        backgroundColor: '#f9fafb',
        borderRight: '1px solid #e5e7eb',
        padding: 24,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>设置</h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: 14 }}>管理你的智能助手偏好</p>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            通用
          </div>
          {renderSidebarItem('models', <Server />, '模型服务')}
          {renderSidebarItem('general', <Cpu />, '通用设置')}
          {renderSidebarItem('instructions', <Command />, '系统指令')}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
           <button
            onClick={saveSettings}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            <Save size={16} />
            保存并关闭
          </button>
          
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: 12,
              backgroundColor: 'transparent',
              color: '#4b5563',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.color = '#111827'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#4b5563'
            }}
          >
            <RotateCcw size={16} />
            取消并返回
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#fff',
        overflow: 'hidden' 
      }}>
          
          {/* Models Tab */}
          {activeTab === 'models' && (
            <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600 }}>模型服务配置</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>管理你的 LLM API 连接配置</p>
                </div>
                <button
                  onClick={handleAddConfig}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                >
                  <Plus size={16} />
                  添加配置
                </button>
              </div>

              {editingConfig ? (
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  borderRadius: 12, 
                  padding: 24, 
                  border: '1px solid #e5e7eb',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{isNewConfig ? '新建配置' : '编辑配置'}</h4>
                    <button 
                      onClick={() => setEditingConfig(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                        显示名称
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="给这个配置起个名字"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #d1d5db',
                          fontSize: 14,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                        API 端点 (Endpoint)
                      </label>
                      <input
                        type="text"
                        value={editEndpoint}
                        onChange={e => setEditEndpoint(e.target.value)}
                        placeholder="http://..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #d1d5db',
                          fontSize: 14,
                          outline: 'none',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                        模型名称 (Model ID)
                      </label>
                      <input
                        type="text"
                        value={editModel}
                        onChange={e => setEditModel(e.target.value)}
                        placeholder="例如: llama3"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #d1d5db',
                          fontSize: 14,
                          outline: 'none',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingConfig(null)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveConfig}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2563eb',
                        border: 'none',
                        borderRadius: 8,
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500
                      }}
                    >
                      确认保存
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {apiConfigs.map(config => (
                    <div
                      key={config.id}
                      onClick={() => setSelectedApiId(config.id)}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: selectedApiId === config.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        backgroundColor: selectedApiId === config.id ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: selectedApiId === config.id ? '#1e40af' : '#111827',
                          fontSize: 15
                        }}>
                          {config.name}
                        </div>
                        {selectedApiId === config.id && (
                          <div style={{ 
                            backgroundColor: '#2563eb', 
                            borderRadius: '50%', 
                            width: 20, 
                            height: 20, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      
                      <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Server size={12} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {config.model}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditConfig(config)
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: 12,
                            borderRadius: 6,
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          编辑
                        </button>
                        <button
                          onClick={(e) => handleDeleteConfig(config.id, e)}
                          style={{
                            padding: '4px 8px',
                            fontSize: 12,
                            borderRadius: 6,
                            backgroundColor: 'white',
                            border: '1px solid #fee2e2',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600 }}>通用设置</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>调整对话参数和行为</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>上下文长度 (Context Window)</label>
                    <span style={{ fontSize: 14, color: '#6b7280', fontFamily: 'monospace' }}>{contextWindow} tokens</span>
                  </div>
                  <input
                    type="range"
                    min="1024"
                    max="32768"
                    step="1024"
                    value={contextWindow}
                    onChange={e => setContextWindow(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                    决定了模型能记住多少历史对话内容。数值越大消耗的内存和计算资源越多。
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>随机性 (Temperature)</label>
                    <span style={{ fontSize: 14, color: '#6b7280', fontFamily: 'monospace' }}>{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                    <span>精确 (0.0)</span>
                    <span>平衡 (1.0)</span>
                    <span>创意 (2.0)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions Tab */}
          {activeTab === 'instructions' && (
            <div style={{ padding: 32, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600 }}>系统指令</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>全局注入到所有对话的系统提示词</p>
              </div>

              <textarea
                value={customInstructions}
                onChange={e => setCustomInstructions(e.target.value)}
                placeholder="例如：你是一个专业的编程助手，请始终用中文回答，保持代码简洁..."
                style={{
                  flex: 1,
                  width: '100%',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  backgroundColor: '#f9fafb'
                }}
              />
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
                这些指令将作为 System Message 发送给模型，优先级通常高于用户的单次输入。
              </p>
            </div>
          )}
        </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
