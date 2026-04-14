import { memo } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import type { Tab } from '../types'
import { tabLabels } from '../types'

interface JobsHeaderProps {
  tab: Tab
  search: string
  counts: Record<Tab, number>
  isLoading: boolean
  onTabChange: (tab: Tab) => void
  onSearchChange: (value: string) => void
  onRefresh: () => void
}

const JobsHeader = memo(({
  tab,
  search,
  counts,
  isLoading,
  onTabChange,
  onSearchChange,
  onRefresh,
}: JobsHeaderProps) => (
  <div
    style={{
      padding: '20px 24px',
      background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            color: '#1e293b',
            letterSpacing: '-0.01em',
          }}
        >
          任务管理
        </h2>
        <span
          style={{
            fontSize: 12,
            color: '#94a3b8',
            fontWeight: 500,
          }}
        >
          Job Management
        </span>
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 10,
          background: isLoading
            ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: isLoading
            ? 'none'
            : '0 4px 12px rgba(59, 130, 246, 0.35)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)'
          }
        }}
      >
        <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
        刷新
      </button>
    </div>

    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        background: '#f1f5f9',
        padding: 4,
        borderRadius: 12,
        width: 'fit-content',
      }}
    >
      {(['all', 'running', 'failed'] as Tab[]).map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t)}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            background: tab === t ? '#fff' : 'transparent',
            color: tab === t ? '#3b82f6' : '#64748b',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {tabLabels[t]}
          {counts[t] > 0 && (
            <span
              style={{
                background:
                  tab === t
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                color: tab === t ? '#fff' : '#64748b',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                minWidth: 20,
                textAlign: 'center',
              }}
            >
              {counts[t]}
            </span>
          )}
        </button>
      ))}
    </div>

    <div style={{ position: 'relative' }}>
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#94a3b8',
          transition: 'color 0.15s ease',
        }}
      />
      <input
        type="text"
        placeholder="搜索任务名称或方法..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px 12px 44px',
          borderRadius: 12,
          border: '2px solid #e5e7eb',
          fontSize: 14,
          outline: 'none',
          transition: 'all 0.15s ease',
          background: '#fff',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6'
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e5e7eb'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  </div>
))

JobsHeader.displayName = 'JobsHeader'

export default JobsHeader
