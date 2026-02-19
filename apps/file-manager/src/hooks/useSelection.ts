import { useState, useCallback } from 'react'

export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const selectAll = useCallback((items: string[]) => {
    setSelected(new Set(items))
  }, [])

  const isSelected = useCallback((name: string) => selected.has(name), [selected])

  return { selected, setSelected, toggleSelect, clearSelection, selectAll, isSelected }
}
