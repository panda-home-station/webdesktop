# 窗口系统

## 窗口状态管理

窗口状态由 `desktop/state/windows-store.ts` 统一管理：

```typescript
// 打开应用窗口
const { openWindow } = useWindowSystem()
openWindow({ appId: 'storage', title: '存储管理' })

// 监听窗口事件
import { subscribeOpenApp } from '@shared/sdk/desktop'
subscribeOpenApp((appId) => {
  // 处理应用打开
})
```

## 窗口生命周期

1. **打开** → `openWindow()` 创建窗口
2. **聚焦** → 点击窗口提升 z-order
3. **最小化** → 窗口隐藏但保留状态
4. **最大化** → 窗口填满工作区
5. **关闭** → `closeWindow()` 移除窗口
