import { colors } from '../../styles/theme'

interface BadgeProps {
  label: string
  bgColor?: string
  textColor?: string
  icon?: React.ReactNode
}

export function Badge({ label, bgColor = colors.primary, textColor = '#fff', icon }: BadgeProps) {
  return (
    <span style={{
      padding: '4px 8px',
      backgroundColor: bgColor,
      color: textColor,
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      {icon}
      {label}
    </span>
  )
}

// Common badge presets
export const StatusBadge = {
  active: () => (
    <Badge label="正常" bgColor="#e8f5e9" textColor={colors.success} />
  ),
  locked: () => (
    <Badge label="已锁定" bgColor="#ffebee" textColor={colors.danger} />
  ),
  disabled: () => (
    <Badge label="已禁用" bgColor="#fff3e0" textColor={colors.warning} />
  ),
  builtin: () => (
    <Badge label="内置" bgColor="#f3e5f5" textColor="#7b1fa2" />
  ),
  smb: () => (
    <Badge label="SMB" bgColor="#e3f2fd" textColor={colors.primary} />
  ),
  sudo: () => (
    <Badge label="Sudo" bgColor="#fff3e0" textColor={colors.warning} />
  ),
  sudoNopasswd: () => (
    <Badge label="Sudo (无密码)" bgColor="#ffebee" textColor={colors.danger} />
  ),
}
