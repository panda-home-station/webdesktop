import { useState, useEffect } from 'react'
import { ColumnWidths } from '../types'

export function useColumns(listContainerRef: React.RefObject<HTMLDivElement>) {
  const [colWidths, setColWidths] = useState<ColumnWidths>({
    name: 172,
    modified: 149,
    type: 60,
    size: 85,
    created: 105,
    owner: 120,
    originalPath: 200,
  })
  
  const [resizingKey, setResizingKey] = useState<string | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem('fm:colWidths')
      if (s) {
        const obj = JSON.parse(s)
        if (obj && typeof obj === 'object') {
          setColWidths((prev) => ({ ...prev, ...obj }))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('fm:colWidths', JSON.stringify(colWidths))
    } catch {}
  }, [colWidths])

  const startResize = (
    key: keyof typeof colWidths, 
    nextKey: keyof typeof colWidths | null, 
    e: React.MouseEvent,
    options: {
      containerRef?: React.RefObject<HTMLDivElement> | null,
      fixedCols?: string[],
      minFluidWidth?: number
    } = {}
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingKey(key as string)
    const startX = e.clientX
    const startW = colWidths[key]
    const startNextW = nextKey ? colWidths[nextKey] : 0
    
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      
      if (nextKey) {
        // Adjust both columns to keep total width constant
        // Current column cannot be smaller than 60
        // Next column cannot be smaller than 60
        
        let validDx = dx
        if (startW + dx < 60) {
          validDx = 60 - startW
        } else if (startNextW - dx < 60) {
          validDx = startNextW - 60
        }
        
        setColWidths((cw) => ({ 
          ...cw, 
          [key]: startW + validDx,
          [nextKey]: startNextW - validDx
        }))
      } else {
        // Fallback for single column resize (should not happen for inner columns)
        let next = Math.max(60, startW + dx)

        // Constraint to window boundary
        const container = options.containerRef?.current || listContainerRef.current
        if (container) {
          const containerWidth = container.clientWidth
          // Default to ListView fixed cols if not provided
          const fixedCols = options.fixedCols || ['name', 'modified', 'type']
          const otherFixedCols = fixedCols.filter(k => k !== key)
          const usedByOthers = otherFixedCols.reduce((acc, k) => acc + (colWidths[k] || 0), 0)
          const minFluidWidth = options.minFluidWidth || 80 // Reserved for fluid column
          const maxAvailable = containerWidth - usedByOthers - minFluidWidth
          
          if (next > maxAvailable) {
            next = Math.max(60, maxAvailable)
          }
        }

        setColWidths((cw) => ({ ...cw, [key]: next }))
      }
    }
    const onUp = () => {
      setResizingKey(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return {
    colWidths,
    setColWidths,
    resizingKey,
    startResize
  }
}
