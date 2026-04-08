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
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react'
import {
  Card,
  SearchInput,
  StatsCard,
  Switch,
  DeleteConfirm,
  EmptyState,
  LoadingSkeleton,
  Badge,
} from '../shared'
import { colors } from '../../styles/theme'

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
    <Card>
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
          <Badge label="内置" bgColor="#f3e5f5" textColor="#7b1fa2" />
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
          <span style={{ fontSize: 14, color: group.smb ? colors.success : colors.textSecondary }}>
            {group.smb ? '已启用' : '未启用'}
          </span>
        </div>
      </div>

      {/* Feature badges */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {(group.sudo_commands?.length ?? 0) > 0 && (
          <Badge label="Sudo" bgColor="#fff3e0" textColor={colors.warning} icon={<Terminal size={12} />} />
        )}
        {(group.sudo_commands_nopasswd?.length ?? 0) > 0 && (
          <Badge label="Sudo (无密码)" bgColor="#ffebee" textColor={colors.danger} icon={<Terminal size={12} />} />
        )}
      </div>

      {/* Action buttons */}
      {!group.builtin && !group.immutable && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + colors.border }}>
          <ActionButton onClick={onEdit} icon={<Edit2 size={16} />} label="编辑" primary />
          <ActionButton onClick={onDelete} icon={<Trash2 size={16} />} label="" danger />
        </div>
      )}
    </Card>
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

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showBuiltin, setShowBuiltin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Group | null>(null)

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
    await groupService.delete(deleteConfirm.id)
    setDeleteConfirm(null)
    loadGroups()
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingGroup(null)
    loadGroups()
  }

  // Stats
  const totalGroups = groups.length
  const localGroups = groups.filter((g) => g.local).length
  const sudoGroups = groups.filter((g) => (g.sudo_commands?.length ?? 0) > 0 || (g.sudo_commands_nopasswd?.length ?? 0) > 0).length

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <StatsCard label="总组数" value={totalGroups} color={colors.primary} />
          <StatsCard label="本地组" value={localGroups} color={colors.success} />
          <StatsCard label="Sudo 权限" value={sudoGroups} color={colors.warning} />
        </div>

        {/* Search and Add */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="搜索用户组..."
          />
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: colors.textSecondary, marginRight: 12 }}>
            显示内置组
          </span>
          <Switch checked={showBuiltin} onChange={setShowBuiltin} />
        </div>
      </div>

      {/* Content */}
      <div>
        {loading && <LoadingSkeleton count={3} height={180} />}

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
          <EmptyState title={search ? '未找到匹配的组' : '暂无用户组'} description={search ? '请尝试其他搜索条件' : '点击上方按钮创建第一个用户组'} />
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
        <DeleteConfirm
          open={true}
          title="删除用户组"
          itemName={deleteConfirm.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

export default GroupList
