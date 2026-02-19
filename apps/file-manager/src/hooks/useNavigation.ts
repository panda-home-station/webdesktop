import { useState, useMemo } from 'react'

export function useNavigation(initialPath: string = '/') {
  const [path, setPath] = useState<string>(initialPath)
  const [navHist, setNavHist] = useState<string[]>([initialPath])
  const [navIndex, setNavIndex] = useState<number>(0)

  const navigate = (to: string) => {
    const target = to || '/'
    if (navHist[navIndex] !== target) {
      const nextHist = [...navHist.slice(0, navIndex + 1), target]
      setNavHist(nextHist)
      setNavIndex(nextHist.length - 1)
    }
    setPath(target)
  }

  const back = () => {
    if (navIndex > 0) {
      const i = navIndex - 1
      setNavIndex(i)
      setPath(navHist[i])
    }
  }

  const forward = () => {
    if (navIndex < navHist.length - 1) {
      const i = navIndex + 1
      setNavIndex(i)
      setPath(navHist[i])
    }
  }

  const up = useMemo(() => {
    if (path === '/' || path === '') return '/'
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
  }, [path])

  const crumbs = useMemo(() => {
    const parts = path.split('/').filter(Boolean)
    const acc: { label: string; to: string }[] = [{ label: '根目录', to: '/' }]
    let cur = ''
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : `/${p}`
      acc.push({ label: p, to: cur })
    }
    return acc
  }, [path])

  return { path, setPath, navHist, navIndex, navigate, back, forward, up, crumbs }
}
