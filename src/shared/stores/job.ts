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
      // Fetch all jobs and filter client-side (matching webui logic):
      // - Non-SUCCESS jobs (all)
      // - SUCCESS jobs (limit 30, sorted by id desc)
      const allJobs = await truenasApi.call('core.get_jobs') as Job[]
      const notCompletedJobs = allJobs.filter(j => j.state !== 'SUCCESS')
      const completedJobs = allJobs
        .filter(j => j.state === 'SUCCESS')
        .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        .slice(0, 30)
      const jobs = [...notCompletedJobs, ...completedJobs]
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
      // msg is lowercase from TrueNAS backend: 'added' | 'changed' | 'removed'
      const eventData = data as { msg: string; id?: number; fields?: Job }

      set((state) => {
        let jobs = [...state.jobs]

        if (eventData.msg === 'added' && eventData.fields) {
          // Check if job already exists
          const existingIndex = jobs.findIndex(j => j.id === eventData.fields!.id)
          if (existingIndex === -1) {
            jobs.push(eventData.fields)
          } else {
            jobs[existingIndex] = eventData.fields
          }
        } else if (eventData.msg === 'changed' && eventData.fields) {
          const index = jobs.findIndex(j => j.id === eventData.id)
          if (index !== -1) {
            jobs[index] = eventData.fields
          }
        } else if (eventData.msg === 'removed' && eventData.id !== undefined) {
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