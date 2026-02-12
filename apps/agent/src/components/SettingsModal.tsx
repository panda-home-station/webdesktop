import React from 'react'
import { Save } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  apiEndpoint: string
  setApiEndpoint: (endpoint: string) => void
  apiModel: string
  setApiModel: (model: string) => void
  saveSettings: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  setIsOpen,
  apiEndpoint,
  setApiEndpoint,
  apiModel,
  setApiModel,
  saveSettings
}) => {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: 400,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1a1a1a' }}>服务配置</h3>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>API 终端 (Ollama/OpenAI)</label>
          <input 
            type="text" 
            value={apiEndpoint}
            onChange={e => setApiEndpoint(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: 10, 
              border: '1px solid #eee',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>模型名称</label>
          <input 
            type="text" 
            value={apiModel}
            onChange={e => setApiModel(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: 10, 
              border: '1px solid #eee',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: 12, 
              border: '1px solid #eee', 
              background: '#fff', 
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: '#666'
            }}
          >
            取消
          </button>
          <button 
            onClick={saveSettings}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: 12, 
              border: 'none', 
              background: '#000', 
              color: '#fff', 
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Save size={16} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  )
}
