export const joinPath = (dir: string, name: string) => (dir.endsWith('/') ? `${dir}${name}` : `${dir}/${name}`)

export const fmtTime = (ts: number) => {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString()
}

export const fmtSize = (bytes: number) => {
  if (bytes === undefined || bytes === null) return '-'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`
  const gb = mb / 1024
  return `${gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10} GB`
}

export const getUniqueName = (baseName: string, existingNames: Set<string>, isFile: boolean = false) => {
  if (!existingNames.has(baseName)) return baseName

  let name = baseName
  let ext = ''
  if (isFile) {
    const parts = baseName.split('.')
    if (parts.length > 1) {
      ext = '.' + parts.pop()
      name = parts.join('.')
    }
  }

  let i = 1
  while (true) {
    const candidate = `${name} (${i})${ext}`
    if (!existingNames.has(candidate)) return candidate
    i++
  }
}

export const filterSystemEntries = (entries: { name: string }[], path: string) => {
  let filtered = entries
  if (path === '/') {
    filtered = filtered.filter(e => e.name !== 'Trash')
  }
  if (path.startsWith('/Trash')) {
    filtered = filtered.filter(e => e.name !== '.trashinfo')
  }
  return filtered
}
