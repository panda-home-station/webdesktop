import { useState, useCallback } from 'react'
import { api } from '../../../../src/api/client'
import { TrashMetadata } from '../types'

export function useTrash() {
  const [trashMetadata, setTrashMetadata] = useState<Record<string, TrashMetadata>>({})

  const loadTrashMetadata = useCallback(async () => {
    setTrashMetadata({})
    return {}
  }, [])

  const saveTrashMetadata = useCallback(async (data: Record<string, TrashMetadata>) => {
    setTrashMetadata(data)
  }, [])

  return { trashMetadata, setTrashMetadata, loadTrashMetadata, saveTrashMetadata }
}
