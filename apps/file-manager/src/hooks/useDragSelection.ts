import { useRef, useState } from 'react'
import { DragSelection } from '../types'

interface UseDragSelectionProps {
  path: string
  view: 'list' | 'grid'
  selected: Set<string>
  setSelected: (selected: Set<string>) => void
}

export function useDragSelection({ path, view, selected, setSelected }: UseDragSelectionProps) {
  const [dragSelect, setDragSelect] = useState<DragSelection | null>(null)
  const dragItemsRef = useRef<{ name: string, rect: DOMRect }[]>([])
  const isDragOperation = useRef(false)

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.list-row, .grid-item')) return
    if (path === '/Trash' || path === '/Transfers') return
    
    // Allow left (0) and right (2) click
    if (e.button !== 0 && e.button !== 2) return

    const startX = e.clientX
    const startY = e.clientY
    
    // Optimization: Don't calculate rects yet. Wait for drag threshold.
    dragItemsRef.current = []
    isDragOperation.current = false
    
    // Initial selection state
    const initialSelected = new Set(e.ctrlKey || e.metaKey || e.shiftKey ? selected : [])
    
    const move = (ev: MouseEvent) => {
      // If moved significantly, mark as drag operation
      if (!isDragOperation.current) {
         if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
             isDragOperation.current = true
             
             // Calculate rects only once when drag actually starts
             const items = document.querySelectorAll(view === 'list' ? '.list-row' : '.grid-item')
             const dragItems: { name: string, rect: DOMRect }[] = []
             items.forEach(el => {
                const name = el.getAttribute('data-name')
                if (name) {
                  dragItems.push({ name, rect: el.getBoundingClientRect() })
                }
             })
             dragItemsRef.current = dragItems
         } else {
             return
         }
      }
      
      setDragSelect({ startX, startY, curX: ev.clientX, curY: ev.clientY })
      
      const box = {
        left: Math.min(startX, ev.clientX),
        top: Math.min(startY, ev.clientY),
        right: Math.max(startX, ev.clientX),
        bottom: Math.max(startY, ev.clientY)
      }
      
      const nextSelected = new Set(initialSelected)
      
      // Use cached rects
      for (const item of dragItemsRef.current) {
        const r = item.rect
        // Check overlap
        if (r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top) {
           nextSelected.add(item.name)
        }
      }
      
      setSelected(nextSelected)
    }
    
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      setDragSelect(null)
      
      // If no drag happened and clicked on empty space, clear selection (only for left click)
      if (!isDragOperation.current) {
         if (e.button === 0 && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !(e.target as HTMLElement).closest('.list-row, .grid-item')) {
           setSelected(new Set())
         }
      } else {
         // If dragged, prevent context menu if it was right click
         if (e.button === 2) {
            const preventMenu = (e: Event) => {
                e.preventDefault()
                e.stopPropagation()
            }
            window.addEventListener('contextmenu', preventMenu, { capture: true, once: true })
            setTimeout(() => window.removeEventListener('contextmenu', preventMenu, { capture: true }), 100)
         }
      }
      dragItemsRef.current = []
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return { dragSelect, handleContainerMouseDown }
}
