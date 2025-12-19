import React from 'react'

export function NavItem({ id, icon, label, active, onClick }: { id: string; icon?: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  const isActive = active
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        background: isActive ? '#eff6ff' : 'transparent',
        color: isActive ? '#2563eb' : '#374151',
        fontWeight: isActive ? 500 : 400,
        marginBottom: 2,
        fontSize: 14,
        transition: 'all 0.2s'
      }}
    >
      {icon && (
        <span style={{ 
          fontSize: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 20,
          opacity: isActive ? 1 : 0.7
        }}>
          {icon}
        </span>
      )}
      <span>{label}</span>
    </div>
  )
}

export default function Sidebar({ active, onGoto }: { active: string; onGoto: (to: string, key: string) => void }) {
  return (
    <div
      style={{
        width: 220,
        borderRight: '1px solid #e5e7eb',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, padding: 8, overflowY: 'auto' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>文件</div>
        <NavItem id="home" icon="📁" label="我的文件" active={active === 'home'} onClick={() => onGoto('/', 'home')} />
        <NavItem id="team" icon="👥" label="团队文件" active={active === 'team'} onClick={() => onGoto('/Team', 'team')} />
        <NavItem id="appdata" icon="⚙️" label="应用文件" active={active === 'appdata'} onClick={() => onGoto('/AppData', 'appdata')} />

        <div style={{ height: 8 }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>共享</div>
        <NavItem id="shared-with-me" icon="📨" label="他人共享" active={active === 'shared-with-me'} onClick={() => onGoto('/SharedWithMe', 'shared-with-me')} />
        <NavItem id="my-shares" icon="📤" label="我的共享" active={active === 'my-shares'} onClick={() => onGoto('/MyShares', 'my-shares')} />
        <NavItem id="public-links" icon="🔗" label="外链分享" active={active === 'public-links'} onClick={() => onGoto('/PublicLinks', 'public-links')} />

        <div style={{ height: 8 }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>快捷</div>
        <NavItem id="recent" icon="🕒" label="最近访问" active={active === 'recent'} onClick={() => onGoto('/Recent', 'recent')} />
        <NavItem id="favorites" icon="⭐" label="我的收藏" active={active === 'favorites'} onClick={() => onGoto('/Favorites', 'favorites')} />

        <div style={{ height: 8 }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>系统</div>
        <NavItem id="trash" icon="🗑️" label="回收站" active={active === 'trash'} onClick={() => onGoto('/Trash', 'trash')} />
      </div>
    </div>
  )
}
