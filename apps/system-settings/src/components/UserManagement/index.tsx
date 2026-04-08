import { useState } from 'react'
import { UserList } from './UserList'
import { GroupList } from './GroupList'
import { Users, Shield } from 'lucide-react'

// iOS-style color palette
const colors = {
  background: '#f2f2f7',
  cardBg: '#ffffff',
  primary: '#007aff',
  text: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  divider: '#c6c6c8',
}

type Tab = 'users' | 'groups'

// Segmented control for tab switching
function SegmentedControl({
  activeTab,
  onChange,
}: {
  activeTab: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <div style={{
      display: 'flex',
      background: colors.background,
      borderRadius: 8,
      padding: 2,
      marginBottom: 20,
    }}>
      <button
        onClick={() => onChange('users')}
        style={{
          flex: 1,
          padding: '10px 16px',
          border: 'none',
          borderRadius: 6,
          backgroundColor: activeTab === 'users' ? colors.cardBg : 'transparent',
          color: activeTab === 'users' ? colors.text : colors.textSecondary,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: activeTab === 'users' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Users size={16} />
        用户
      </button>
      <button
        onClick={() => onChange('groups')}
        style={{
          flex: 1,
          padding: '10px 16px',
          border: 'none',
          borderRadius: 6,
          backgroundColor: activeTab === 'groups' ? colors.cardBg : 'transparent',
          color: activeTab === 'groups' ? colors.text : colors.textSecondary,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: activeTab === 'groups' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Shield size={16} />
        群组
      </button>
    </div>
  )
}

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('users')

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <SegmentedControl activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'users' ? <UserList /> : <GroupList />}
    </div>
  )
}

export default UserManagement
