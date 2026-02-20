import React from 'react'
import { ChevronRight } from 'lucide-react'

interface SettingsPageProps {
  apiEndpoint: string
  setApiEndpoint: (endpoint: string) => void
  apiModel: string
  setApiModel: (model: string) => void
  contextWindow: number
  setContextWindow: (window: number) => void
  temperature: number
  setTemperature: (temp: number) => void
  customInstructions: string
  setCustomInstructions: (instructions: string) => void
  saveSettings: () => void
  onCancel: () => void
}

const IOSSection: React.FC<{ title?: string; footer?: string; children: React.ReactNode }> = ({ title, footer, children }) => (
  <div style={{ marginBottom: 24 }}>
    {title && (
      <div style={{ 
        padding: '0 16px', 
        marginBottom: 8, 
        fontSize: 13, 
        color: '#6e6e73', 
        textTransform: 'uppercase',
        letterSpacing: -0.1
      }}>
        {title}
      </div>
    )}
    <div style={{ 
      backgroundColor: '#fff', 
      borderRadius: 10, 
      overflow: 'hidden',
      border: '0.5px solid #c6c6c8'
    }}>
      {children}
    </div>
    {footer && (
      <div style={{ 
        padding: '8px 16px 0', 
        fontSize: 13, 
        color: '#6e6e73',
        lineHeight: 1.3
      }}>
        {footer}
      </div>
    )}
  </div>
)

const IOSItem: React.FC<{ 
  label: string; 
  children?: React.ReactNode; 
  isLast?: boolean; 
  onClick?: () => void 
}> = ({ label, children, isLast, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      paddingLeft: 16,
      minHeight: 44,
      backgroundColor: '#fff',
      cursor: onClick ? 'pointer' : 'default'
    }}
  >
    <div style={{ 
      fontSize: 17, 
      color: '#000', 
      flexShrink: 0,
      width: '140px'
    }}>
      {label}
    </div>
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'flex-end',
      paddingRight: 16,
      borderBottom: isLast ? 'none' : '0.5px solid #c6c6c8',
      minHeight: 44,
      paddingTop: 8,
      paddingBottom: 8
    }}>
      {children}
    </div>
  </div>
)

export const SettingsPage: React.FC<SettingsPageProps> = ({
  apiEndpoint,
  setApiEndpoint,
  apiModel,
  setApiModel,
  contextWindow,
  setContextWindow,
  temperature,
  setTemperature,
  customInstructions,
  setCustomInstructions,
  saveSettings,
  onCancel
}) => {
  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: '#f2f2f7',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        backgroundColor: '#f2f2f7', // Transparent/Blurred in real iOS, but solid here for simplicity
        borderBottom: '0.5px solid #c6c6c8',
        flexShrink: 0,
        zIndex: 10
      }}>
        <button 
          onClick={onCancel}
          style={{ 
            border: 'none', 
            background: 'none', 
            color: '#007aff', 
            fontSize: 17, 
            cursor: 'pointer',
            padding: 0
          }}
        >
          取消
        </button>
        <div style={{ fontSize: 17, fontWeight: 600 }}>设置</div>
        <button 
          onClick={saveSettings}
          style={{ 
            border: 'none', 
            background: 'none', 
            color: '#007aff', 
            fontSize: 17, 
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0
          }}
        >
          完成
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px'
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          
          <IOSSection title="服务配置" footer="配置 LLM API 服务地址和模型名称。">
            <IOSItem label="API 终端">
              <input 
                type="text" 
                value={apiEndpoint}
                onChange={e => setApiEndpoint(e.target.value)}
                placeholder="例如: http://localhost:11434/v1"
                style={{
                  border: 'none',
                  outline: 'none',
                  textAlign: 'right',
                  fontSize: 17,
                  color: '#8e8e93',
                  width: '100%',
                  background: 'transparent'
                }}
              />
            </IOSItem>
            <IOSItem label="模型名称" isLast>
              <input 
                type="text" 
                value={apiModel}
                onChange={e => setApiModel(e.target.value)}
                placeholder="例如: llama3"
                style={{
                  border: 'none',
                  outline: 'none',
                  textAlign: 'right',
                  fontSize: 17,
                  color: '#8e8e93',
                  width: '100%',
                  background: 'transparent'
                }}
              />
            </IOSItem>
          </IOSSection>

          <IOSSection title="对话设置">
            <IOSItem label="上下文长度">
              <input 
                type="number" 
                value={contextWindow}
                onChange={e => setContextWindow(parseInt(e.target.value) || 0)}
                style={{
                  border: 'none',
                  outline: 'none',
                  textAlign: 'right',
                  fontSize: 17,
                  color: '#8e8e93',
                  width: '100%',
                  background: 'transparent'
                }}
              />
            </IOSItem>
            <IOSItem label="随机性" isLast>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 15, color: '#8e8e93', width: 30, textAlign: 'right' }}>{temperature}</span>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  style={{ 
                    width: 120,
                    accentColor: '#007aff',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </IOSItem>
          </IOSSection>

          <IOSSection title="自定义指令" footer="这些指令将附加到所有代理的系统提示词后，用于控制全局行为。">
            <div style={{ padding: '12px 16px' }}>
              <textarea 
                value={customInstructions}
                onChange={e => setCustomInstructions(e.target.value)}
                placeholder="例如：请始终用中文回答，保持简洁..."
                style={{ 
                  width: '100%', 
                  minHeight: 120,
                  border: 'none',
                  fontSize: 17,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  padding: 0,
                  margin: 0,
                  display: 'block'
                }}
              />
            </div>
          </IOSSection>

        </div>
      </div>
    </div>
  )
}
