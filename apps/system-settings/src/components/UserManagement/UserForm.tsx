import { useState, useEffect } from 'react'
import { userService, type User, type UserUpdate } from './user.service'
import { groupService, type Group } from './group.service'
import { Modal } from '@desktop/components/Modal'
import {
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
import { Section, FormRow, TextInput, Switch } from '../shared'
import { colors } from '../../styles/theme'

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
    <Modal
      open={true}
      onClose={onCancel}
      title={isEdit ? '编辑用户' : '创建用户'}
      width={480}
      bodyStyle={{ padding: 0 }}
      headerExtra={
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
      }
    >
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

      <div style={{ padding: '20px' }}>
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
          <FormRow label="邮箱" icon={<Mail size={18} />} border={false}>
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
          <FormRow label="主组" icon={<Shield size={18} />} border={false}>
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
          <ToggleRow icon={<Wifi size={18} />} label="SMB 认证" checked={formData.smb ?? true} onChange={(c) => handleChange('smb', c)} />
          <ToggleRow icon={<Terminal size={18} />} label="SSH 密码登录" checked={formData.ssh_password_enabled ?? false} onChange={(c) => handleChange('ssh_password_enabled', c)} />
          {isEdit && (
            <ToggleRow icon={<Lock size={18} />} label="锁定账户" checked={formData.locked ?? false} onChange={(c) => handleChange('locked', c)} border={false} />
          )}
        </Section>

        {/* Sudo Commands */}
        <Section title="Sudo 权限">
          <FormRow label="Sudo 命令 (无密码)" icon={<Terminal size={18} />} border={false}>
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
    </Modal>
  )
}

function ToggleRow({ icon, label, checked, onChange, border = true }: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onChange: (c: boolean) => void
  border?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: border ? '1px solid ' + colors.border : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: colors.primary }}>{icon}</div>
        <span style={{ fontSize: 16, color: colors.text }}>{label}</span>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}
