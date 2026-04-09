import { useEffect, useState, useCallback } from 'react'
import {
  User,
  userService,
} from './user.service'
import { UserForm } from './UserForm'
import {
  User as UserIcon,
  Lock,
  Mail,
  Shell,
  Home,
  CheckCircle,
  Wifi,
  Terminal,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Key as KeyIcon,
  History as HistoryIcon,
  Clock as ClockIcon,
  FileText,
  Activity,
} from 'lucide-react'
import {
  Card,
  SearchInput,
  StatsCard,
  DeleteConfirm,
  EmptyState,
  LoadingSkeleton,
  Badge,
  StatusBadge,
} from '../shared'
import { colors } from '../../styles/theme'

// User card component
function UserCard({
  user,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  user: User
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (uid: number) => {
    const hue = (uid * 47) % 360
    return `hsl(${hue}, 60%, 55%)`
  }

  const status: 'active' | 'locked' | 'disabled' =
    user.locked ? 'locked' : user.password_disabled ? 'disabled' : 'active'

  // Format password age
  const formatPasswordAge = (age: number | null): string => {
    if (age === null) return '-'
    if (age === 0) return '今天'
    if (age === 1) return '1 天'
    if (age < 30) return `${age} 天`
    const months = Math.floor(age / 30)
    if (months === 1) return '1 个月'
    if (months < 12) return `${months} 个月`
    const years = Math.floor(months / 12)
    return years === 1 ? '1 年' : `${years} 年`
  }

  // Format last password change
  const formatLastPasswordChange = (date: { $date: number } | null): string => {
    if (!date) return '-'
    return new Date(date.$date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get user type label
  const getUserTypeLabel = (): string => {
    if (user.builtin) return '内置'
    return '本地'
  }

  // Get TrueNAS access level
  const getTrueNASAccess = (): string => {
    if (user.roles?.includes('truenas_admin') || user.builtin) return '完全管理员'
    if (user.roles?.includes('reader')) return '只读'
    if (user.local) return '本地用户'
    return '标准用户'
  }

  // Get sudo commands display
  const getSudoDisplay = (): string => {
    if (user.sudo_commands_nopasswd?.includes('ALL')) return 'ALL (无密码)'
    if (user.sudo_commands?.includes('ALL')) return 'ALL'
    const cmds = [
      ...(user.sudo_commands_nopasswd || []),
      ...(user.sudo_commands || []),
    ]
    if (cmds.length === 0) return '-'
    return cmds.slice(0, 3).join(', ') + (cmds.length > 3 ? '...' : '')
  }

  return (
    <Card>
      {/* Header with avatar and name - always visible, clickable */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: getAvatarColor(user.uid),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          marginRight: 12,
          flexShrink: 0,
        }}>
          {getInitials(user.full_name || user.username)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 2 }}>
            {user.full_name || user.username}
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>
            @{user.username}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {StatusBadge[status]()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: colors.textSecondary,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Info rows - Basic Info */}
          <div style={{ background: colors.background, borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
            <InfoRow icon={<UserIcon size={16} />} label="UID" value={user.uid} />
            <InfoRow icon={<Shield size={16} />} label="群组" value={user.group?.bsdgrp_group || '-'} />
            <InfoRow icon={<CheckCircle size={16} />} label="类型" value={getUserTypeLabel()} />
            <InfoRow icon={<Home size={16} />} label="主目录" value={user.home} />
            <InfoRow icon={<Shell size={16} />} label="Shell" value={user.shell} />
            <InfoRow icon={<Mail size={16} />} label="邮箱" value={user.email || '-'} />
            <InfoRow icon={<Lock size={16} />} label="密码状态" value={user.password_disabled ? '无密码' : '具有密码'} />
            <InfoRow icon={<Wifi size={16} />} label="SMB访问" value={user.smb ? '具有 SMB 访问' : '无 SMB 访问'} />
            <InfoRow icon={<Terminal size={16} />} label="SSH访问" value={user.ssh_password_enabled ? '允许密码登录' : '无 SSH 访问'} border={false} />
          </div>

          {/* Access & Permissions */}
          <div style={{ background: colors.background, borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
            <InfoRow icon={<Shield size={16} />} label="TrueNAS访问" value={getTrueNASAccess()} />
            <InfoRow icon={<KeyIcon size={16} />} label="API密钥" value={user.api_keys?.length ? `${user.api_keys.length} 个密钥` : '无 API 密钥'} />
            <InfoRow icon={<Terminal size={16} />} label="Sudo命令" value={getSudoDisplay()} border={false} />
          </div>

          {/* Password Info */}
          <div style={{ background: colors.background, borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
            <InfoRow icon={<Lock size={16} />} label="密码时长" value={formatPasswordAge(user.password_age)} />
            <InfoRow icon={<HistoryIcon size={16} />} label="密码历史" value={user.password_history ? `${user.password_history.length} 条记录` : '无历史'} />
            <InfoRow icon={<ClockIcon size={16} />} label="上次更改" value={formatLastPasswordChange(user.last_password_change)} border={false} />
          </div>

          {/* Feature badges */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {user.smb && <Badge label="SMB" bgColor="#e3f2fd" textColor={colors.primary} icon={<CheckCircle size={12} />} />}
            {user.ssh_password_enabled && <Badge label="SSH" bgColor="#e8f5e9" textColor={colors.success} icon={<Wifi size={12} />} />}
            {(user.sudo_commands?.length > 0 || user.sudo_commands_nopasswd?.length > 0) && (
              <Badge label="Sudo" bgColor="#fff3e0" textColor={colors.warning} icon={<Terminal size={12} />} />
            )}
            {user.builtin && <Badge label="内置" bgColor="#f3e5f5" textColor="#7b1fa2" icon={<Lock size={12} />} />}
            {user.password_disabled && <Badge label="无密码" bgColor="#ffebee" textColor={colors.danger} icon={<Lock size={12} />} />}
          </div>

          {/* Access section - Last Action & Logs */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid ' + colors.border }}>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>
              <Activity size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              <span>访问</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, color: colors.text }}>
                <span style={{ color: colors.textSecondary }}>Last Action: </span>
                <span>认证方式</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Open logs viewer
                  console.log('View logs for user:', user.id)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primary,
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <FileText size={14} />
                See Logs
              </button>
            </div>
          </div>

          {/* Action buttons */}
          {!user.builtin && !user.immutable && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + colors.border }}>
              <ActionButton onClick={onEdit} icon={<Edit2 size={16} />} label="编辑" primary />
              <ActionButton onClick={onDelete} icon={<Trash2 size={16} />} label="" danger />
            </div>
          )}
        </>
      )}
    </Card>
  )
}

function InfoRow({ icon, label, value, border = true }: { icon: React.ReactNode; label: string; value: React.ReactNode; border?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      borderBottom: border ? '1px solid ' + colors.border : 'none',
    }}>
      <div style={{ color: colors.textSecondary, marginRight: 10 }}>{icon}</div>
      <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, color: colors.textSecondary }}>{value}</span>
    </div>
  )
}

function ActionButton({ onClick, icon, label, primary, danger }: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  primary?: boolean
  danger?: boolean
}) {
  const bgColor = danger ? '#ffebee' : primary ? colors.primary : colors.background
  const textColor = danger ? colors.danger : primary ? '#fff' : colors.text

  return (
    <button
      onClick={onClick}
      style={{
        flex: danger ? 'none' : 1,
        padding: '10px 16px',
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await userService.query()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    const unsubscribe = userService.subscribe((event: unknown) => {
      const e = event as { msg?: string }
      if (e.msg === 'changed') {
        loadUsers()
      }
    })
    return unsubscribe
  }, [loadUsers])

  const filteredUsers = users.filter((user) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.full_name.toLowerCase().includes(searchLower) ||
      user.uid.toString().includes(searchLower)
    )
  })

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await userService.delete(deleteConfirm.id)
    setDeleteConfirm(null)
    loadUsers()
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingUser(null)
    loadUsers()
  }

  // Stats
  const totalUsers = users.length
  const localUsers = users.filter((u) => u.local).length
  const builtinUsers = users.filter((u) => u.builtin).length

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <StatsCard label="总用户" value={totalUsers} color={colors.primary} />
          <StatsCard label="本地用户" value={localUsers} color={colors.success} />
          <StatsCard label="内置账户" value={builtinUsers} color={colors.text} />
        </div>

        {/* Search and Add */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="搜索用户..."
          />
          <button
            onClick={() => {
              setEditingUser(null)
              setShowForm(true)
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={18} /> 创建
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {loading && <LoadingSkeleton count={3} height={200} />}

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            color: colors.danger,
            fontSize: 15,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <EmptyState title={search ? '未找到匹配的用户' : '暂无用户'} description={search ? '请尝试其他搜索条件' : '点击上方按钮创建第一个用户'} />
        )}

        {!loading && !error && filteredUsers.map((user) => (
          <div key={user.id} style={{ marginBottom: 8 }}>
            <UserCard
              user={user}
              expanded={expandedUserId === user.id}
              onToggle={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
              onEdit={() => handleEdit(user)}
              onDelete={() => setDeleteConfirm(user)}
            />
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false)
            setEditingUser(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <DeleteConfirm
          open={true}
          title="删除用户"
          itemName={deleteConfirm.username}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

export default UserList
