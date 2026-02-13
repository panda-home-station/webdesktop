import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, CHAT_MIN_WIDTH, WORKSPACE_MIN_THRESHOLD, RESIZER_WIDTH } from '../constants'

export function useLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [workspaceWidth, setWorkspaceWidth] = useState(450)
  const [isResizing, setIsResizing] = useState(false)
  const [isInitial, setIsInitial] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsInitial(false), 100)
    return () => clearTimeout(timer)
  }, [])

  const prevSidebarOpen = useRef(isSidebarOpen)

  // Handle sidebar toggle compensation
  useEffect(() => {
    if (prevSidebarOpen.current !== isSidebarOpen && isWorkspaceOpen) {
      const diff = SIDEBAR_EXPANDED - SIDEBAR_COLLAPSED
      if (isSidebarOpen) {
        setWorkspaceWidth(prev => Math.max(WORKSPACE_MIN_THRESHOLD, prev - diff))
      } else {
        setWorkspaceWidth(prev => prev + diff)
      }
    }
    prevSidebarOpen.current = isSidebarOpen
  }, [isSidebarOpen, isWorkspaceOpen])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const sidebarWidth = isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED
      const resizerWidth = isWorkspaceOpen ? RESIZER_WIDTH : 0
      
      if (isWorkspaceOpen) {
        const availableForWorkspace = containerWidth - sidebarWidth - CHAT_MIN_WIDTH - resizerWidth
        if (availableForWorkspace < WORKSPACE_MIN_THRESHOLD) {
          setIsWorkspaceOpen(false)
        } else if (workspaceWidth > availableForWorkspace) {
          setWorkspaceWidth(Math.max(WORKSPACE_MIN_THRESHOLD, availableForWorkspace))
        }
      }

      if (containerWidth < 600 && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [isSidebarOpen, isWorkspaceOpen, workspaceWidth])

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRef.current.clientWidth
      const sidebarWidth = isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED
      const maxWorkspaceWidth = Math.floor(containerWidth - sidebarWidth - CHAT_MIN_WIDTH - RESIZER_WIDTH)
      let newWidth = Math.floor(rect.right - e.clientX - RESIZER_WIDTH)
      
      if (newWidth < WORKSPACE_MIN_THRESHOLD) newWidth = WORKSPACE_MIN_THRESHOLD
      if (newWidth > maxWorkspaceWidth) newWidth = maxWorkspaceWidth
      
      setWorkspaceWidth(newWidth)
    }
  }, [isResizing, isSidebarOpen])

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  const toggleWorkspace = useCallback(() => {
    if (!isWorkspaceOpen) {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const sidebarWidth = isSidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED
        const availableForWorkspace = containerWidth - sidebarWidth - CHAT_MIN_WIDTH - RESIZER_WIDTH
        if (availableForWorkspace < WORKSPACE_MIN_THRESHOLD) {
          return
        }
      }
    }
    setIsWorkspaceOpen(prev => !prev)
  }, [isWorkspaceOpen, isSidebarOpen])

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isWorkspaceOpen,
    setIsWorkspaceOpen,
    toggleWorkspace,
    workspaceWidth,
    setWorkspaceWidth,
    isResizing,
    isInitial,
    containerRef,
    startResizing
  }
}
