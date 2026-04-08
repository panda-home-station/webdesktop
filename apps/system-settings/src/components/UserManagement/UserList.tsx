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
  onEdit,
  onDelete,
}: {
  user: User
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

  return (
    <Card>
      {/* Header with avatar and name */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: getAvatarColor(user.uid),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 20,
          fontWeight: 600,
          marginRight: 14,
        }}>
          {getInitials(user.full_name || user.username)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 2 }}>
            {user.full_name || user.username}
          </div>
          <div style={{ fontSize: 15, color: colors.textSecondary }}>
            @{user.username}
          </div>
        </div>
        {StatusBadge[status]()}
      </div>

      {/* Info rows */}
      <div style={{ background: colors.background, borderRadius: 8, overflow: 'hidden' }}>
        <InfoRow icon={<UserIcon size={16} />} label="UID" value={user.uid} />
        <InfoRow icon={<Home size={16} />} label="主目录" value={user.home} />
        <InfoRow icon={<Shell size={16} />} label="Shell" value={user.shell} />
        <InfoRow icon={<Mail size={16} />} label="邮箱" value={user.email || '-'} border={false} />
      </div>

      {/* Feature badges */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {user.smb && <Badge label="SMB" bgColor="#e3f2fd" textColor={colors.primary} icon={<CheckCircle size={12} />} />}
        {user.ssh_password_enabled && <Badge label="SSH" bgColor="#e8f5e9" textColor={colors.success} icon={<Wifi size={12} />} />}
        {user.sudo_commands?.length > 0 && <Badge label="Sudo" bgColor="#fff3e0" textColor={colors.warning} icon={<Terminal size={12} />} />}
        {user.builtin && <Badge label="内置" bgColor="#f3e5f5" textColor="#7b1fa2" icon={<Lock size={12} />} />}
      </div>

      {/* Action buttons */}
      {!user.builtin && !user.immutable && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + colors.border }}>
          <ActionButton onClick={onEdit} icon={<Edit2 size={16} />} label="编辑" primary />
          <ActionButton onClick={onDelete} icon={<Trash2 size={16} />} label="" danger />
        </div>
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
          <UserCard
            key={user.id}
            user={user}
            onEdit={() => handleEdit(user)}
            onDelete={() => setDeleteConfirm(user)}
          />
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
