import { useState, useEffect } from 'react'
import { groupService, type Group, type GroupUpdate } from './group.service'
import { userService, type User } from './user.service'
import { Modal } from '@desktop/components/Modal'
import {
  Users,
  Terminal,
  AlertCircle,
} from 'lucide-react'
import { Section, FormRow, TextInput, Switch } from '../shared'
import { colors } from '../../styles/theme'

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

  const localUsers = users.filter((u) => u.local)

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={isEdit ? '编辑组' : '创建用户组'}
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
          <FormRow label="GID" icon={<Users size={18} />} border={false}>
            <TextInput
              value={formData.gid || nextGid || ''}
              onChange={(v) => handleChange('gid', Number(v))}
              disabled={isEdit}
            />
          </FormRow>
        </Section>

        {/* SMB Settings */}
        <Section title="文件共享">
          <ToggleRow icon={<Users size={18} />} label="SMB 组映射" checked={formData.smb ?? true} onChange={(c) => handleChange('smb', c)} border={false} />
        </Section>

        {/* Sudo Permissions */}
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

        {/* Members */}
        <Section title="成员用户">
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            {localUsers.length > 0 ? (
              localUsers.map((user, index) => (
                <MemberRow
                  key={user.id}
                  user={user}
                  checked={(formData.users || []).includes(user.id)}
                  onToggle={() => {
                    const current = formData.users || []
                    if (current.includes(user.id)) {
                      handleChange('users', current.filter((id) => id !== user.id))
                    } else {
                      handleChange('users', [...current, user.id])
                    }
                  }}
                  isLast={index === localUsers.length - 1}
                />
              ))
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary }}>
                暂无可用用户
              </div>
            )}
          </div>
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

function MemberRow({ user, checked, onToggle, isLast }: {
  user: User
  checked: boolean
  onToggle: () => void
  isLast: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: isLast ? 'none' : '1px solid ' + colors.border,
      }}
    >
      <div
        onClick={onToggle}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          backgroundColor: checked ? colors.primary : 'transparent',
          border: checked ? 'none' : '2px solid ' + colors.border,
          marginRight: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {checked && (
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
  )
}
