import { createContext, useContext } from 'react'

export interface WindowContextValue {
  id: string
  appId: string
  setTitle: (title: string) => void
  close: () => void
  minimize: () => void
  maximize: () => void
  isActive: boolean
}

export const WindowContext = createContext<WindowContextValue | null>(null)

export function useWindow(): WindowContextValue {
  const context = useContext(WindowContext)
  if (!context) {
    throw new Error('useWindow must be used within a Window component')
  }
  return context
}
