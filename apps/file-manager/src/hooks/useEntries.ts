import { useEffect, useMemo, useRef, useState } from 'react'
import { api, Entry } from '../../../../src/api/client'

export function useEntries(path: string) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [sortKey, setSortKey] = useState<'name' | 'size' | 'modified_ts'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [q, setQ] = useState<string>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    name: 172,
    modified: 149,
    type: 60,
    size: 85,
    created: 105,
    owner: 120,
  })
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null)


  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const r = await api.fsList(path)
        if (!mounted) return
        setEntries(r.entries)
        if (r.has_more && r.next_offset != null) {
          let nextOffset = r.next_offset
          let more = r.has_more
          while (mounted && more) {
            const rr = await api.fsListPage(path, nextOffset, 500)
            if (!mounted) break
            if (rr.entries && rr.entries.length > 0) {
              setEntries(prev => {
                const seen = new Set(prev.map(e => e.name))
                const appended = rr.entries.filter(e => !seen.has(e.name))
                return appended.length > 0 ? [...prev, ...appended] : prev
              })
            }
            more = !!rr.has_more
            nextOffset = rr.next_offset ?? (nextOffset + (rr.entries?.length ?? 0))
            await new Promise(res => setTimeout(res, 0))
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [path])

  const refresh = async () => {
    const r = await api.fsList(path)
    setEntries(r.entries)
  }

  const filtered = useMemo(() => {
    const base = [...entries]
    base.sort((a, b) => {
      let comparison = 0
      if (sortKey === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortKey === 'size') {
        comparison = (a.size || 0) - (b.size || 0)
      } else {
        comparison = (a.modified_ts || 0) - (b.modified_ts || 0)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    const qq = q.trim().toLowerCase()
    return qq ? base.filter(e => e.name.toLowerCase().includes(qq)) : base
  }, [entries, sortKey, sortOrder, q])

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const next = new Set([...prev])
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  const clearSelection = () => setSelected(new Set())

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
  useEffect(() => {
    const total = filtered.length
    const sel = selected.size
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = sel > 0 && sel < total
      headerCheckboxRef.current.checked = total > 0 && sel === total
    }
  }, [selected, filtered])

  const startResize = (key: keyof typeof colWidths, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = colWidths[key]
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const next = Math.max(60, startW + dx)
      setColWidths((cw) => ({ ...cw, [key]: next }))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const fmtTime = (ts: number) => {
    if (!ts) return '-'
    return new Date(ts * 1000).toLocaleString()
  }
  const fmtSize = (bytes: number) => {
    if (bytes === undefined || bytes === null) return '-'
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${Math.round(kb)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`
    const gb = mb / 1024
    return `${gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10} GB`
  }

  return {
    entries,
    setEntries,
    loading,
    refresh,
    filtered,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    q,
    setQ,
    selected,
    setSelected,
    toggleSelect,
    clearSelection,
    colWidths,
    setColWidths,
    headerCheckboxRef,
    startResize,
    fmtTime,
    fmtSize
  }
}
