import { colors } from '../../styles/theme'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
}

export function TextInput({ value, onChange, type = 'text', placeholder, disabled }: TextInputProps) {
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
