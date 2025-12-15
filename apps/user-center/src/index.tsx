import React from 'react'

export default function UserCenter() {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>用户中心</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div className="puter-window" style={{ padding: 12 }}>
          <div style={{ fontWeight: 600 }}>账户</div>
          <div>用户名：guest</div>
          <div>角色：标准用户</div>
        </div>
        <div className="puter-window" style={{ padding: 12 }}>
          <div style={{ fontWeight: 600 }}>设置</div>
          <div>主题：Puter</div>
          <div>语言：中文</div>
        </div>
      </div>
    </div>
  )
}
