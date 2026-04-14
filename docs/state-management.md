# 状态管理

## Zustand Store 规范

```typescript
// 命名：use{Feature}Store
// 文件：shared/stores/{feature}.ts

import { create } from 'zustand'

interface AlertState {
  alerts: Alert[]
  isLoading: boolean
  setAlerts: (alerts: Alert[]) => void
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  isLoading: false,
  setAlerts: (alerts) => set({ alerts }),
}))
```

## 状态持久化

使用 `desktop/state/persistence.ts` 提供的工具：

```typescript
import { persistentStorage, sessionStorage } from '@desktop/state/persistence'

// 持久化存储（localStorage）
persistentStorage.set('key', value)
persistentStorage.get('key')

// 会话存储（sessionStorage）
sessionStorage.set('key', value)
```
