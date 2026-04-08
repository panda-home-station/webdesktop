import { useState, useEffect } from 'react'
import { groupService, type Group, type GroupUpdate } from './group.service'
import { userService, type User } from './user.service'
import {
  Users,
  Terminal,
  AlertCircle,
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

// iOS-style Section component
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {title && (
        <h3 style={{
          fontSize: 13,
          fontWeight: 400,
          color: colors.textTertiary,
          marginBottom: 8,
          paddingLeft: 16,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
        }}>
          {title}
        </h3>
      )}
      <div style={{
        background: colors.cardBg,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

// Form input row
function FormRow({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid ' + colors.border,
    }}>
      {icon && <div style={{ marginRight: 12, color: colors.primary, width: 24 }}>{icon}</div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: colors.textTertiary, marginBottom: 4 }}>{label}</div>
        <div>{children}</div>
      </div>
    </div>
  )
}

// Text input
function TextInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
}: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        fontSize: 16,
        color: colors.text,
        outline: 'none',
        padding: 0,
      }}
    />
  )
}

// Toggle switch
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

interface GroupFormProps {
  group: Group | null
  onSuccess: () => void
  onCancel: () => void
}

export function GroupForm({ group, onSuccess, onCancel }: GroupFormProps) {
  const isEdit = group !== null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [nextGid, setNextGid] = useState<number | null>(null)

  const [formData, setFormData] = useState<Partial<GroupUpdate>>(() => {
    if (group) {
      return {
        name: group.name,
        gid: group.gid,
        smb: group.smb,
        sudo_commands: group.sudo_commands,
        sudo_commands_nopasswd: group.sudo_commands_nopasswd,
        users: group.users,
      }
    }
    return {
      name: '',
      smb: true,
      sudo_commands: [],
      sudo_commands_nopasswd: [],
      users: [],
    }
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, gid] = await Promise.all([
          userService.query(),
          isEdit ? Promise.resolve(group!.gid) : groupService.getNextGid(),
        ])
        setUsers(userData)
        setNextGid(gid)
        if (!isEdit) {
          setFormData((prev) => ({ ...prev, gid }))
        }
      } catch (err) {
        console.error('Failed to load form data:', err)
      }
    }
    loadData()
  }, [isEdit, group])

  const handleChange = (field: keyof GroupUpdate, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!formData.name?.trim()) {
        setError('组名不能为空')
        setLoading(false)
        return
      }

      if (isEdit && group) {
        await groupService.update(group.id, formData)
      } else {
        await groupService.create(formData as GroupUpdate)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      setLoading(false)
    }
  }

  return (
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div style={{
        width: 480,
        maxHeight: '90vh',
        background: '#fff',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'modal-pop 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid ' + colors.border,
        }}>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: colors.primary,
              fontSize: 16,
            }}
          >
            取消
          </button>
          <div style={{ fontSize: 17, fontWeight: 600, color: colors.text }}>
            {isEdit ? '编辑组' : '创建用户组'}
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: loading ? 'not-allowed' : 'pointer',
              color: colors.primary,
              fontSize: 16,
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? '处理中...' : isEdit ? '完成' : '创建'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            backgroundColor: '#ffebee',
            color: colors.danger,
            fontSize: 14,
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Form content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Basic Info */}
          <Section title="基本信息">
            <FormRow label="组名" icon={<Users size={18} />}>
              <TextInput
                value={formData.name || ''}
                onChange={(v) => handleChange('name', v)}
                placeholder="输入组名"
                disabled={isEdit}
              />
            </FormRow>
            <FormRow label="GID" icon={<Users size={18} />}>
              <TextInput
                value={formData.gid || nextGid || ''}
                onChange={(v) => handleChange('gid', Number(v))}
                disabled={isEdit}
              />
            </FormRow>
          </Section>

          {/* SMB Settings */}
          <Section title="文件共享">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Users size={18} color={colors.primary} />
                <span style={{ fontSize: 16, color: colors.text }}>SMB 组映射</span>
              </div>
              <Switch
                checked={formData.smb ?? true}
                onChange={(c) => handleChange('smb', c)}
              />
            </div>
          </Section>

          {/* Sudo Permissions */}
          <Section title="Sudo 权限">
            <FormRow label="Sudo 命令 (无密码)" icon={<Terminal size={18} />}>
              <TextInput
                value={(formData.sudo_commands_nopasswd || []).join(', ')}
                onChange={(v) => handleChange(
                  'sudo_commands_nopasswd',
                  v.split(',').map((s) => s.trim()).filter(Boolean)
                )}
                placeholder="ALL, /usr/sbin/reboot"
              />
            </FormRow>
          </Section>

          {/* Members */}
          <Section title="成员用户">
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {users
                .filter((u) => u.local)
                .map((user, index) => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: index < users.filter((u) => u.local).length - 1 ? '1px solid ' + colors.border : 'none',
                    }}
                  >
                    <div
                      onClick={() => {
                        const current = formData.users || []
                        if (current.includes(user.id)) {
                          handleChange('users', current.filter((id) => id !== user.id))
                        } else {
                          handleChange('users', [...current, user.id])
                        }
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: (formData.users || []).includes(user.id) ? colors.primary : 'transparent',
                        border: (formData.users || []).includes(user.id) ? 'none' : '2px solid ' + colors.border,
                        marginRight: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {(formData.users || []).includes(user.id) && (
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                          <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, color: colors.text }}>{user.username}</div>
                      <div style={{ fontSize: 13, color: colors.textSecondary }}>UID: {user.uid}</div>
                    </div>
                  </div>
                ))}
              {users.filter((u) => u.local).length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary }}>
                  暂无可用用户
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
      <style>{`
        @keyframes modal-pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
