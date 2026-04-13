/**
 * Job Store
 *
 * Manages TrueNAS job state including running, waiting, and failed jobs.
 * Subscribes to core.get_jobs WebSocket collection for real-time updates.
 */

import { create } from 'zustand'
import { Job, JobState } from '../types/job-types'
import { truenasApi } from '@truenas/api'

interface JobCounts {
  running: number
  waiting: number
  failed: number
}

interface JobState {
  jobs: Job[]
  counts: JobCounts
  isLoading: boolean
  unsubscribe: (() => void) | null

  // Actions
  loadJobs: () => Promise<void>
  subscribeToJobs: () => void
  unsubscribeFromJobs: () => void
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  counts: { running: 0, waiting: 0, failed: 0 },
  isLoading: false,
  unsubscribe: null,

  loadJobs: async () => {
    set({ isLoading: true })
    try {
      const jobs = await truenasApi.call('core.get_jobs') as Job[]
      const counts = calculateCounts(jobs)
      set({ jobs, counts, isLoading: false })
    } catch (error) {
      console.error('Failed to load jobs:', error)
      set({ isLoading: false })
    }
  },

  subscribeToJobs: () => {
    const { unsubscribe } = get()
    if (unsubscribe) {
      unsubscribe()
    }

    const newUnsubscribe = truenasApi.subscribe('core.get_jobs', (data) => {
      const eventData = data as { msg: 'ADDED' | 'CHANGED' | 'REMOVED'; id?: number; fields?: Job }

      set((state) => {
        let jobs = [...state.jobs]

        if (eventData.msg === 'ADDED' && eventData.fields) {
          // Check if job already exists
          const existingIndex = jobs.findIndex(j => j.id === eventData.fields!.id)
          if (existingIndex === -1) {
            jobs.push(eventData.fields)
          } else {
            jobs[existingIndex] = eventData.fields
          }
        } else if (eventData.msg === 'CHANGED' && eventData.fields) {
          const index = jobs.findIndex(j => j.id === eventData.id)
          if (index !== -1) {
            jobs[index] = eventData.fields
          }
        } else if (eventData.msg === 'REMOVED' && eventData.id !== undefined) {
          jobs = jobs.filter(j => j.id !== eventData.id)
        }

        return { jobs, counts: calculateCounts(jobs) }
      })
    })

    set({ unsubscribe: newUnsubscribe })
  },

  unsubscribeFromJobs: () => {
    const { unsubscribe } = get()
    if (unsubscribe) {
      unsubscribe()
      set({ unsubscribe: null })
    }
  },
}))

function calculateCounts(jobs: Job[]): JobCounts {
  return {
    running: jobs.filter(j => j.state === 'RUNNING').length,
    waiting: jobs.filter(j => j.state === 'WAITING').length,
    failed: jobs.filter(j => j.state === 'FAILED' || j.state === 'ABORTED').length,
  }
}