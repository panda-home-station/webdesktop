import { useState, useEffect } from 'react'
import { userService, type User, type UserUpdate } from './user.service'
import { groupService, type Group } from './group.service'
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Home,
  Shell,
  Shield,
  Wifi,
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
  value: string
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

interface UserFormProps {
  user: User | null
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const isEdit = user !== null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [shells, setShells] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<Partial<UserUpdate>>(() => {
    if (user) {
      return {
        username: user.username,
        full_name: user.full_name,
        email: user.email || '',
        home: user.home,
        shell: user.shell,
        uid: user.uid,
        group: user.group?.id,
        groups: user.groups,
        smb: user.smb,
        ssh_password_enabled: user.ssh_password_enabled,
        locked: user.locked,
        password_disabled: user.password_disabled,
        sudo_commands: user.sudo_commands,
        sudo_commands_nopasswd: user.sudo_commands_nopasswd,
      }
    }
    return {
      full_name: '',
      email: '',
      home: '/mnt',
      shell: '/bin/sh',
      smb: true,
      ssh_password_enabled: false,
      locked: false,
      password_disabled: false,
      sudo_commands: [],
      sudo_commands_nopasswd: [],
    }
  })

  const [password, setPassword] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupData, shellData] = await Promise.all([
          groupService.query(),
          userService.getShellChoices(),
        ])
        setGroups(groupData)
        setShells(shellData)
      } catch (err) {
        console.error('Failed to load form data:', err)
      }
    }
    loadData()
  }, [])

  const handleChange = (field: keyof UserUpdate, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const payload: UserUpdate = { ...formData }
      if (password) {
        payload.password = password
      }

      if (isEdit && user) {
        await userService.update(user.id, payload)
      } else {
        if (!payload.username) {
          setError('用户名不能为空')
          setLoading(false)
          return
        }
        if (!password) {
          setError('密码不能为空')
          setLoading(false)
          return
        }
        await userService.create(payload)
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
            {isEdit ? '编辑用户' : '创建用户'}
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
          {/* Basic Info Section */}
          <Section title="基本信息">
            <FormRow label="用户名" icon={<UserIcon size={18} />}>
              <TextInput
                value={formData.username || ''}
                onChange={(v) => handleChange('username', v)}
                placeholder="输入用户名"
                disabled={isEdit}
              />
            </FormRow>
            <FormRow label="全名" icon={<UserIcon size={18} />}>
              <TextInput
                value={formData.full_name || ''}
                onChange={(v) => handleChange('full_name', v)}
                placeholder="输入用户全名"
              />
            </FormRow>
            {!isEdit && (
              <FormRow label="密码" icon={<Lock size={18} />}>
                <TextInput
                  value={password}
                  onChange={setPassword}
                  type="password"
                  placeholder="输入密码"
                />
              </FormRow>
            )}
            <FormRow label="邮箱" icon={<Mail size={18} />}>
              <TextInput
                value={formData.email || ''}
                onChange={(v) => handleChange('email', v)}
                placeholder="user@example.com"
              />
            </FormRow>
          </Section>

          {/* Account Settings */}
          <Section title="账户设置">
            <FormRow label="主目录" icon={<Home size={18} />}>
              <TextInput
                value={formData.home || ''}
                onChange={(v) => handleChange('home', v)}
                placeholder="/mnt"
              />
            </FormRow>
            <FormRow label="Shell" icon={<Shell size={18} />}>
              <select
                value={formData.shell || ''}
                onChange={(e) => handleChange('shell', e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 16,
                  color: colors.text,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {Object.entries(shells).map(([path, name]) => (
                  <option key={path} value={path}>
                    {name}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="主组" icon={<Shield size={18} />}>
              <select
                value={formData.group || ''}
                onChange={(e) => handleChange('group', Number(e.target.value))}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 16,
                  color: colors.text,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {groups.filter((g) => g.local || g.id === formData.group).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} (GID: {group.gid})
                  </option>
                ))}
              </select>
            </FormRow>
          </Section>

          {/* Access Control */}
          <Section title="访问控制">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid ' + colors.border,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Wifi size={18} color={colors.primary} />
                <span style={{ fontSize: 16, color: colors.text }}>SMB 认证</span>
              </div>
              <Switch
                checked={formData.smb ?? true}
                onChange={(c) => handleChange('smb', c)}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid ' + colors.border,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Terminal size={18} color={colors.primary} />
                <span style={{ fontSize: 16, color: colors.text }}>SSH 密码登录</span>
              </div>
              <Switch
                checked={formData.ssh_password_enabled ?? false}
                onChange={(c) => handleChange('ssh_password_enabled', c)}
              />
            </div>
            {isEdit && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Lock size={18} color={colors.primary} />
                  <span style={{ fontSize: 16, color: colors.text }}>锁定账户</span>
                </div>
                <Switch
                  checked={formData.locked ?? false}
                  onChange={(c) => handleChange('locked', c)}
                />
              </div>
            )}
          </Section>

          {/* Sudo Commands */}
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
