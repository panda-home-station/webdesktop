import { useState, useCallback } from 'react'
import { api } from '../../../../src/api/client'
import { TrashMetadata } from '../types'

export function useTrash() {
  const [trashMetadata, setTrashMetadata] = useState<Record<string, TrashMetadata>>({})

  const loadTrashMetadata = useCallback(async () => {
    try {
      const blob = await api.fsDownloadBlob('/Trash/.trashinfo')
      const text = await blob.text()
      const data = JSON.parse(text)
      setTrashMetadata(data)
      return data
    } catch (e) {
      setTrashMetadata({})
      return {}
    }
  }, [])

  const saveTrashMetadata = useCallback(async (data: Record<string, TrashMetadata>) => {
    try {
      const file = new File([JSON.stringify(data)], '.trashinfo', { type: 'application/json' })
      await api.fsUpload('/Trash', file)
      setTrashMetadata(data)
    } catch (e) {
      console.error("Failed to save trash metadata", e)
    }
  }, [])

  return { trashMetadata, setTrashMetadata, loadTrashMetadata, saveTrashMetadata }
}
