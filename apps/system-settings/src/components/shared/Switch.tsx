import { colors } from '../../styles/theme'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ checked, onChange }: SwitchProps) {
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
