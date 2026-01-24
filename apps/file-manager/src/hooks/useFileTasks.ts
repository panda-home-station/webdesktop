import { useEffect, useRef, useState } from 'react'
import { getFileTasks, subscribeFileTasks, FileTask } from '../../../../src/sdk/desktop'

export function useFileTasks() {
  const [tasks, setTasks] = useState<FileTask[]>([])
  const speedStatsRef = useRef<Map<string, { samples: { ts: number; bps: number }[]; lastAvg: number }>>(new Map())
  const SPEED_WINDOW_MS = 6000

  useEffect(() => {
    setTasks(getFileTasks())
    const unsub = subscribeFileTasks((ts) => {
      const now = Date.now()
      for (const t of ts) {
        if (t.status === 'running') {
          const entry = speedStatsRef.current.get(t.id) || { samples: [], lastAvg: 0 }
          if (t.bps != null) {
            entry.samples.push({ ts: now, bps: t.bps })
          }
          entry.samples = entry.samples.filter(s => now - s.ts <= SPEED_WINDOW_MS)
          if (entry.samples.length > 0) {
            let sum = 0
            for (const s of entry.samples) sum += s.bps
            entry.lastAvg = sum / entry.samples.length
          }
          speedStatsRef.current.set(t.id, entry)
        } else {
          const entry = speedStatsRef.current.get(t.id)
          if (entry) {
            entry.samples = []
            speedStatsRef.current.set(t.id, entry)
          }
        }
      }
      setTasks(ts)
    })
    return () => unsub()
  }, [])

  const getAvgSpeed = (id: string) => {
    const e = speedStatsRef.current.get(id)
    return e && e.lastAvg ? e.lastAvg : 0
  }

  return { tasks, getAvgSpeed }
}
