import { useEffect, useState, useCallback } from 'react'
import {
  Group,
  groupService,
} from './group.service'
import { GroupForm } from './GroupForm'
import {
  Users,
  Shield,
  Lock,
  Terminal,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Search,
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

// Group card component
function GroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: Group
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div style={{
      background: colors.cardBg,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          backgroundColor: group.builtin ? '#f3e5f5' : colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}>
          {group.builtin ? (
            <Lock size={22} color="#7b1fa2" />
          ) : (
            <Users size={22} color="#fff" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 2 }}>
            {group.name}
          </div>
          <div style={{ fontSize: 14, color: colors.textSecondary }}>
            GID {group.gid}
          </div>
        </div>
        {group.builtin && (
          <span style={{
            padding: '4px 10px',
            backgroundColor: '#f3e5f5',
            color: '#7b1fa2',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
          }}>
            内置
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ background: colors.background, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid ' + colors.border,
        }}>
          <Users size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>成员数量</span>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>{group.users?.length || 0}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
        }}>
          <Shield size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>SMB 映射</span>
          <span style={{
            fontSize: 14,
            color: group.smb ? colors.success : colors.textSecondary,
          }}>
            {group.smb ? '已启用' : '未启用'}
          </span>
        </div>
      </div>

      {/* Feature badges */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {(group.sudo_commands?.length ?? 0) > 0 && (
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
        {(group.sudo_commands_nopasswd?.length ?? 0) > 0 && (
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#ffebee',
            color: colors.danger,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Terminal size={12} /> Sudo (无密码)
          </span>
        )}
      </div>

      {/* Action buttons */}
      {!group.builtin && !group.immutable && (
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
      <Users size={48} color={colors.divider} style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 17, marginBottom: 8 }}>
        {hasSearch ? '未找到匹配的组' : '暂无用户组'}
      </div>
      <div style={{ fontSize: 14, color: colors.textTertiary }}>
        {hasSearch ? '请尝试其他搜索条件' : '点击上方按钮创建第一个用户组'}
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
          height: 180,
          animation: 'pulse 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
    </div>
  )
}

// Switch component
function Switch({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 51,
        height: 31,
        background: checked ? colors.success : '#e9e9ea',
        borderRadius: 31,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s ease',
        boxSizing: 'border-box',
        border: checked ? 'none' : '2px solid #e9e9ea',
      }}
    >
      <div
        style={{
          width: 27,
          height: 27,
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  )
}

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showBuiltin, setShowBuiltin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Group | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await groupService.query()
      setGroups(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户组失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    const unsubscribe = groupService.subscribe((event: unknown) => {
      const e = event as { msg?: string }
      if (e.msg === 'changed') {
        loadGroups()
      }
    })
    return unsubscribe
  }, [loadGroups])

  const filteredGroups = groups.filter((group) => {
    if (!showBuiltin && group.builtin) return false
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      group.name.toLowerCase().includes(searchLower) ||
      group.gid.toString().includes(searchLower)
    )
  })

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      setDeleteLoading(true)
      await groupService.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      loadGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingGroup(null)
    loadGroups()
  }

  // Stats
  const totalGroups = groups.length
  const localGroups = groups.filter((g) => g.local).length
  const builtinGroups = groups.filter((g) => g.builtin).length
  const sudoGroups = groups.filter((g) => (g.sudo_commands?.length ?? 0) > 0 || (g.sudo_commands_nopasswd?.length ?? 0) > 0).length

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
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>{totalGroups}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>总组数</div>
          </div>
          <div style={{
            flex: 1,
            background: colors.background,
            borderRadius: 8,
            padding: '12px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.success }}>{localGroups}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>本地组</div>
          </div>
          <div style={{
            flex: 1,
            background: colors.background,
            borderRadius: 8,
            padding: '12px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.warning }}>{sudoGroups}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>Sudo 权限</div>
          </div>
        </div>

        {/* Search and Add */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
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
              placeholder="搜索用户组..."
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
              setEditingGroup(null)
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

        {/* Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, color: colors.textSecondary, marginRight: 12 }}>
            显示内置组
          </span>
          <Switch
            checked={showBuiltin}
            onChange={(c) => setShowBuiltin(c)}
          />
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

        {!loading && !error && filteredGroups.length === 0 && (
          <EmptyState hasSearch={!!search} />
        )}

        {!loading && !error && filteredGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onEdit={() => handleEdit(group)}
            onDelete={() => setDeleteConfirm(group)}
          />
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <GroupForm
          group={editingGroup}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false)
            setEditingGroup(null)
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
              删除用户组
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
              确定要删除用户组 <strong>{deleteConfirm.name}</strong> 吗？此操作无法撤销。
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

export default GroupList
