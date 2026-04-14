import { memo, type ReactNode } from 'react'
import { ChevronsLeft, ChevronsRight, ArrowLeft, ArrowRight } from 'lucide-react'
import { PAGE_SIZE_OPTIONS } from '../types'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const Pagination = memo(({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) => {
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div
      style={{
        padding: '12px 20px',
        borderTop: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 13,
        color: '#64748b',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500 }}>每页显示</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 13,
            cursor: 'pointer',
            background: '#fff',
            fontWeight: 500,
            color: '#1e293b',
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span style={{ fontWeight: 500 }}>条</span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 500,
        }}
      >
        <span style={{ color: '#1e293b' }}>{startItem}</span>
        <span style={{ color: '#94a3b8' }}>-</span>
        <span style={{ color: '#1e293b' }}>{endItem}</span>
        <span style={{ color: '#94a3b8' }}>/</span>
        <span style={{ color: '#1e293b' }}>共 {totalCount} 条</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PageButton
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          icon={<ChevronsLeft size={16} />}
        />
        <PageButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          icon={<ArrowLeft size={16} />}
        />
        <div
          style={{
            padding: '6px 14px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            minWidth: 70,
            textAlign: 'center',
          }}
        >
          {currentPage} / {totalPages}
        </div>
        <PageButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          icon={<ArrowRight size={16} />}
        />
        <PageButton
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          icon={<ChevronsRight size={16} />}
        />
      </div>
    </div>
  )
})

Pagination.displayName = 'Pagination'

interface PageButtonProps {
  onClick: () => void
  disabled: boolean
  icon: ReactNode
}

const PageButton = memo(({ onClick, disabled, icon }: PageButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 8,
      border: '1px solid #e5e7eb',
      background: '#fff',
      fontSize: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.background = '#f1f5f9'
        e.currentTarget.style.borderColor = '#3b82f6'
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = '#fff'
      e.currentTarget.style.borderColor = '#e5e7eb'
    }}
  >
    {icon}
  </button>
))

PageButton.displayName = 'PageButton'

export default Pagination
