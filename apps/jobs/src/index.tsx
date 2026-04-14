import { useState, useMemo, useCallback } from 'react'
import { useJobStore } from '@truenas/stores/job'
import { truenasApi } from '@truenas/api'
import type { Tab, ExtendedJob } from './types'
import { JobStateEnum } from './types'
import { getJobDescription } from './utils'
import JobsHeader from './components/JobsHeader'
import JobHeader from './components/JobHeader'
import JobRow from './components/JobRow'
import EmptyState from './components/EmptyState'
import LoadingState from './components/LoadingState'
import Pagination from './components/Pagination'

export default function JobsApp() {
  const { jobs, loadJobs, isLoading } = useJobStore()
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filteredJobs = useMemo(() => {
    // Filter out transient jobs (same as webui)
    let filtered = jobs.filter(j => !j.transient)

    switch (tab) {
      case 'running':
        filtered = filtered.filter(j => j.state === JobStateEnum.RUNNING || j.state === JobStateEnum.WAITING)
        break
      case 'failed':
        filtered = filtered.filter(j => j.state === JobStateEnum.FAILED || j.state === JobStateEnum.ABORTED)
        break
    }

    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(j => {
        const desc = getJobDescription(j).toLowerCase()
        const method = (j.method || '').toLowerCase()
        return desc.includes(query) || method.includes(query)
      })
    }

    filtered.sort((a, b) => b.id - a.id)
    return filtered
  }, [jobs, tab, search])

  const totalCount = filteredJobs.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, currentPage, pageSize])

  const handleTabChange = useCallback((newTab: Tab) => {
    setTab(newTab)
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }, [])

  const counts = useMemo(() => {
    // Exclude transient jobs from counts (same as webui)
    const nonTransientJobs = jobs.filter(j => !j.transient)
    return {
      all: nonTransientJobs.length,
      running: nonTransientJobs.filter(j => j.state === JobStateEnum.RUNNING || j.state === JobStateEnum.WAITING).length,
      failed: nonTransientJobs.filter(j => j.state === JobStateEnum.FAILED || j.state === JobStateEnum.ABORTED).length,
    }
  }, [jobs])

  const handleAbort = useCallback(async (job: ExtendedJob) => {
    if (!confirm(`确定要停止任务 "${getJobDescription(job)}" 吗？`)) return
    try {
      await truenasApi.call('core.job_abort', [job.id])
    } catch (error) {
      console.error('Failed to abort job:', error)
    }
  }, [])

  const handleToggle = useCallback((jobId: number) => {
    setExpandedId(prev => prev === jobId ? null : jobId)
  }, [])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <JobsHeader
        tab={tab}
        search={search}
        counts={counts}
        isLoading={isLoading}
        onTabChange={handleTabChange}
        onSearchChange={handleSearchChange}
        onRefresh={loadJobs}
      />

      <JobHeader />

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 20px' }}>
        {isLoading && filteredJobs.length === 0 ? (
          <LoadingState />
        ) : filteredJobs.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          paginatedJobs.map((job, index) => (
            <JobRow
              key={job.id}
              job={job}
              isExpanded={expandedId === job.id}
              onToggle={() => handleToggle(job.id)}
              onAbort={handleAbort}
              isEven={index % 2 === 0}
            />
          ))
        )}
      </div>

      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
