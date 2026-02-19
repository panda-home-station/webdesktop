import React from 'react'
import { Save } from 'lucide-react'

interface SettingsPageProps {
  apiEndpoint: string
  setApiEndpoint: (endpoint: string) => void
  apiModel: string
  setApiModel: (model: string) => void
  saveSettings: () => void
  onCancel: () => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  apiEndpoint,
  setApiEndpoint,
  apiModel,
  setApiModel,
  saveSettings,
  onCancel
}) => {
  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        width: '100%'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: '#1a1a1a' }}>设置</h1>
        
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#1a1a1a' }}>服务配置</h3>
          
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>API 终端 (Ollama/OpenAI)</label>
            <input 
              type="text" 
              value={apiEndpoint}
              onChange={e => setApiEndpoint(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: '1px solid #d1d5db',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>例如: http://localhost:11434/v1</div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>模型名称</label>
            <input 
              type="text" 
              value={apiModel}
              onChange={e => setApiModel(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: '1px solid #d1d5db',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
             <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>例如: llama3</div>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <button 
              onClick={onCancel}
              style={{ 
                padding: '10px 20px', 
                borderRadius: 8, 
                border: '1px solid #d1d5db', 
                background: '#fff', 
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
            >
              取消
            </button>
            <button 
              onClick={saveSettings}
              style={{ 
                padding: '10px 20px', 
                borderRadius: 8, 
                border: 'none', 
                background: '#000', 
                color: '#fff', 
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Save size={16} />
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
