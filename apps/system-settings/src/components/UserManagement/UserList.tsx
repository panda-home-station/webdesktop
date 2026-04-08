import { useEffect, useState, useCallback } from 'react'
import {
  User,
  userService,
} from './user.service'
import { UserForm } from './UserForm'
import {
  User as UserIcon,
  Shield,
  Lock,
  Mail,
  Shell,
  Home,
  CheckCircle,
  Wifi,
  Terminal,
  Search,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react'

// iOS-style color palette
const colors = {
  background: '#f2f2f7',
  cardBg: '#ffffff',
  primary: '#007aff',
  success: '#34c759',
  warning: '#ff9500',
  danger: '#ff3b30',
  text: '#1c1c1e',
  textSecondary: '#8e8e93',
  textTertiary: '#6c6c70',
  border: '#e5e5ea',
  divider: '#c6c6c8',
}

// Status badge component
function StatusBadge({ status }: { status: 'active' | 'locked' | 'disabled' }) {
  const config = {
    active: { bg: '#e8f5e9', color: colors.success, label: '正常' },
    locked: { bg: '#ffebee', color: colors.danger, label: '已锁定' },
    disabled: { bg: '#fff3e0', color: colors.warning, label: '已禁用' },
  }
  const { bg, color, label } = config[status]
  return (
    <span style={{
      padding: '4px 10px',
      backgroundColor: bg,
      color: color,
      borderRadius: 6,
      fontSize: 13,
      fontWeight: 500,
    }}>
      {label}
    </span>
  )
}

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
    <div style={{
      background: colors.cardBg,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    }}>
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
        <StatusBadge status={status} />
      </div>

      {/* Info rows */}
      <div style={{ background: colors.background, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid ' + colors.border,
        }}>
          <UserIcon size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>UID</span>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>{user.uid}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid ' + colors.border,
        }}>
          <Home size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>主目录</span>
          <span style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.home}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid ' + colors.border,
        }}>
          <Shell size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>Shell</span>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>{user.shell}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
        }}>
          <Mail size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>邮箱</span>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>
            {user.email || '-'}
          </span>
        </div>
      </div>

      {/* Feature badges */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {user.smb && (
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#e3f2fd',
            color: colors.primary,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <CheckCircle size={12} /> SMB
          </span>
        )}
        {user.ssh_password_enabled && (
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#e8f5e9',
            color: colors.success,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Wifi size={12} /> SSH
          </span>
        )}
        {user.sudo_commands?.length > 0 && (
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#fff3e0',
            color: colors.warning,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Terminal size={12} /> Sudo
          </span>
        )}
        {user.builtin && (
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#f3e5f5',
            color: '#7b1fa2',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Lock size={12} /> 内置
          </span>
        )}
      </div>

      {/* Action buttons */}
      {!user.builtin && !user.immutable && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + colors.border }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: colors.primary,
              color: '#fff',
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
            <Edit2 size={16} /> 编辑
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '10px 16px',
              backgroundColor: '#ffebee',
              color: colors.danger,
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
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// Empty state component
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: colors.textSecondary,
    }}>
      <UserIcon size={48} color={colors.divider} style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 17, marginBottom: 8 }}>
        {hasSearch ? '未找到匹配的用户' : '暂无用户'}
      </div>
      <div style={{ fontSize: 14, color: colors.textTertiary }}>
        {hasSearch ? '请尝试其他搜索条件' : '点击上方按钮创建第一个用户'}
      </div>
    </div>
  )
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div style={{ padding: 20 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: colors.cardBg,
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
          height: 200,
          animation: 'pulse 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
    </div>
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
  const [deleteLoading, setDeleteLoading] = useState(false)

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
    try {
      setDeleteLoading(true)
      await userService.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleteLoading(false)
    }
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
          <div style={{
            flex: 1,
            background: colors.background,
            borderRadius: 8,
            padding: '12px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>{totalUsers}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>总用户</div>
          </div>
          <div style={{
            flex: 1,
            background: colors.background,
            borderRadius: 8,
            padding: '12px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.success }}>{localUsers}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>本地用户</div>
          </div>
          <div style={{
            flex: 1,
            background: colors.background,
            borderRadius: 8,
            padding: '12px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{builtinUsers}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>内置账户</div>
          </div>
        </div>

        {/* Search and Add */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: colors.cardBg,
            borderRadius: 10,
            padding: '8px 14px',
            border: '1px solid ' + colors.border,
          }}>
            <Search size={18} color={colors.textSecondary} />
            <input
              type="text"
              placeholder="搜索用户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                marginLeft: 10,
                fontSize: 16,
                outline: 'none',
                color: colors.text,
              }}
            />
          </div>
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
        {loading && <LoadingSkeleton />}

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
          <EmptyState hasSearch={!!search} />
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
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null)
          }}
        >
          <div style={{
            width: 300,
            background: '#fff',
            borderRadius: 14,
            padding: 20,
            textAlign: 'center',
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: '#ffebee',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Trash2 size={28} color={colors.danger} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: colors.text }}>
              删除用户
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
              确定要删除用户 <strong>{deleteConfirm.username}</strong> 吗？此操作无法撤销。
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: colors.background,
                  color: colors.text,
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: colors.danger,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserList
