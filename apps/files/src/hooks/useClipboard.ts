/**
 * useClipboard Hook
 * Hook for clipboard operations (copy/cut/paste)
 */

import { useCallback } from 'react';
import { useClipboardStore } from '../stores/clipboardStore';

export function useClipboard() {
  const {
    operation,
    sources,
    isActive,
    copy,
    cut,
    clear,
  } = useClipboardStore();

  const copyFiles = useCallback((paths: string[]) => {
    copy(paths);
  }, [copy]);

  const cutFiles = useCallback((paths: string[]) => {
    cut(paths);
  }, [cut]);

  const pasteFiles = useCallback(async (destination: string) => {
    if (!isActive || sources.length === 0) {
      return;
    }

    // TODO: Implement actual paste when middleware API is ready
    for (const source of sources) {
      const fileName = source.split('/').pop() || '';
      const _destPath = `${destination}${destination.endsWith('/') ? '' : '/'}${fileName}`;

      if (operation === 'copy') {
        // await filesystemService.copy?.(source, _destPath);
      } else if (operation === 'cut') {
        // await filesystemService.rename?.(source, _destPath);
      }
    }

    clear();
  }, [operation, sources, isActive, clear]);

  const clearClipboard = useCallback(() => {
    clear();
  }, [clear]);

  return {
    operation,
    sources,
    isActive,
    copyFiles,
    cutFiles,
    pasteFiles,
    clearClipboard,
  };
}
