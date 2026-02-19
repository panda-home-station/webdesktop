import { useRef, useEffect } from 'react'
import { api } from '../../../../src/api/client'
import { updateFileTask, pushFileTask, getFileTasks, subscribeFileTasks } from '../../../../src/sdk/desktop'
import { FileTask } from '../../../../src/sdk/desktop'

interface UseFileUploadProps {
  path: string
  reloadCurrentDir: () => Promise<void>
  setTasks: React.Dispatch<React.SetStateAction<FileTask[]>>
}

const SPEED_WINDOW_MS = 6000

export function useFileUpload({ path, reloadCurrentDir, setTasks }: UseFileUploadProps) {
  const abortControllers = useRef<Map<string, AbortController>>(new Map())
  const uploadFilesMap = useRef<Map<string, File>>(new Map())
  const speedStatsRef = useRef<Map<string, { samples: { ts: number; bps: number }[]; lastAvg: number }>>(new Map())

  const startUpload = async (id: string, file: File, dir: string, offset: number = 0) => {
    const controller = new AbortController()
    abortControllers.current.set(id, controller)
    updateFileTask(id, { status: 'running' })
    console.log(`[${new Date().toLocaleTimeString()}] FileManager: startUpload ${file.name}`);
    try {
      await api.fsUpload(dir, file, (info) => {
        updateFileTask(id, { progress: info.percent, total: info.total, loaded: info.loaded, bps: info.bps })
      }, controller.signal)
      console.log(`[${new Date().toLocaleTimeString()}] FileManager: upload finished ${file.name}`);
      updateFileTask(id, { progress: 100, status: 'done' })
      uploadFilesMap.current.delete(id)
      if (path === dir) {
        await reloadCurrentDir()
      }
    } catch (e: any) {
      if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
        // ignore
      } else {
        updateFileTask(id, { status: 'error' })
      }
    } finally {
      abortControllers.current.delete(id)
    }
  }

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    const tasksToRun: { id: string, file: File }[] = []

    for (const f of fileList) {
      const id = `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      pushFileTask({ id, kind: 'upload', name: f.name, dir: path, progress: 0, total: f.size, loaded: 0, bps: 0, status: 'pending' })
      uploadFilesMap.current.set(id, f)
      tasksToRun.push({ id, file: f })
    }

    for (const { id, file } of tasksToRun) {
      if (!uploadFilesMap.current.has(id)) continue
      await startUpload(id, file, path)
    }
  }

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
  }, [setTasks])

  const getAvgSpeed = (id: string) => {
    const e = speedStatsRef.current.get(id)
    return e && e.lastAvg ? e.lastAvg : 0
  }

  return {
    startUpload,
    handleUploadFiles,
    getAvgSpeed,
    uploadFilesMap // Exposed for copy paste operations if needed
  }
}
