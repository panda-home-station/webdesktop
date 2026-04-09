/**
 * Window Utilities
 *
 * Pure functions for window calculations and transformations
 */

// Constants
export const DRAG_THRESHOLD = 10
export const WINDOW_BOUNDARY_MARGIN = 30
export const TITLEBAR_HEIGHT = 38
export const DEFAULT_MIN_WIDTH = 300
export const DEFAULT_MIN_HEIGHT = 200
export const DEFAULT_WIDTH = 600
export const DEFAULT_HEIGHT = 400
export const DEFAULT_X = 60
export const DEFAULT_Y = 60
export const DEFAULT_RESTORE_W = 800
export const DEFAULT_RESTORE_H = 600

export interface WindowBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Calculate drag boundaries to keep window partially visible
 */
export function calculateDragBounds(
  screenW: number,
  screenH: number,
  currentW: number
): WindowBounds {
  return {
    minX: WINDOW_BOUNDARY_MARGIN - currentW,
    maxX: screenW - WINDOW_BOUNDARY_MARGIN,
    minY: -1, // Allow covering 1px border/gap
    maxY: screenH - WINDOW_BOUNDARY_MARGIN,
  }
}

/**
 * Clamp position within bounds
 */
export function clampPosition(
  rawX: number,
  rawY: number,
  bounds: WindowBounds
): { x: number; y: number } {
  return {
    x: Math.max(bounds.minX, Math.min(rawX, bounds.maxX)),
    y: Math.max(bounds.minY, Math.min(rawY, bounds.maxY)),
  }
}

/**
 * Calculate new window position and size when restoring from maximized
 */
export function calculateRestoreFromMaximized(
  dragStartX: number,
  dragStartY: number,
  dragInitX: number,
  dragInitY: number,
  currentW: number,
  restoreRect: { w: number; h: number; x: number; y: number }
): { newX: number; newY: number; newW: number; newH: number } {
  const offsetX = dragStartX - dragInitX
  const percent = currentW > 0 ? offsetX / currentW : 0
  const newW = Number.isFinite(restoreRect.w) ? restoreRect.w : DEFAULT_RESTORE_W
  const newH = Number.isFinite(restoreRect.h) ? restoreRect.h : DEFAULT_RESTORE_H
  const newX = dragStartX - (newW * percent)
  const newY = dragStartY - (dragStartY - dragInitY)
  return { newX, newY, newW, newH }
}
