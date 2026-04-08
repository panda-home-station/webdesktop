import { Search } from 'lucide-react'
import { colors } from '../../styles/theme'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = '搜索...' }: SearchInputProps) {
  return (
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  )
}
