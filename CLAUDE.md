# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TrueNAS WebDesktop

React-based TrueNAS web interface providing a full desktop environment. Migrates the original Angular webui to React.

## Project Overview

- **Branch**: `truenas`
- **Stack**: React 18 + Vite + TypeScript + Zustand
- **Backend**: WebSocket with JSON-RPC 2.0 protocol (TrueNAS middleware)

## Development Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build
npm run test       # Run tests with vitest
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix linting
```

## Directory Structure

```
webdesktop/
├── apps/                          # 系统应用包，目前包含应用商店、存储管理、系统设置等。每个应用是一个子目录
│
└── src/
    ├── desktop/
    │   ├── components/              # 桌面 UI 组件
    │   ├── layouts/                 # 应用布局组件
    │   └── state/                   # 窗口状态管理
    ├── framework/                   # 应用加载框架
    ├── truenas/
    │   ├── api/                    # WebSocket 客户端
    │   └── services/               # API 服务封装
    ├── shared/
    │   ├── hooks/                  # React Hooks
    │   ├── sdk/                    # 桌面 SDK
    │   ├── stores/                 # Zustand 状态库
    │   ├── types/                  # TypeScript 类型
    │   ├── utils/                  # 工具函数
    │   ├── styles/                 # 全局样式
    │   ├── theme/                  # 主题
    │   └── workers/                # Web Workers
    ├── environments/               # 环境配置
    ├── App.tsx
    ├── main.tsx
    └── global.css
```

## 模块职责划分

### desktop/ — 桌面环境核心

**职责**：提供完整的桌面体验，包括窗口管理、任务栏、启动器等。

**规则**：
- 所有桌面 UI 组件必须放在 `desktop/components/`
- 窗口相关状态必须放在 `desktop/state/`
- **禁止**从 `desktop/` 直接引用 `apps/` 下的应用代码（循环依赖）
- 预置布局放在 `desktop/layouts/`，供应用使用

### framework/ — 应用加载框架

**职责**：管理应用的注册、发现和动态加载。

**规则**：
- 只包含 `registry.ts`，负责扫描 `apps/*/manifest.json` 并加载应用
- **禁止**在框架层存放业务逻辑

### truenas/ — TrueNAS API 层

**职责**：封装与 TrueNAS 中间件的 WebSocket 通信。

**规则**：
- `api/` — 底层 WebSocket 客户端，实现 JSON-RPC 2.0 协议
- `services/` — 上层服务封装，封装具体的业务调用
- **禁止**服务层直接操作 UI 组件
- 类型定义放在 `shared/types/`，不在此目录重复定义

### shared/ — 共享模块

**职责**：被多个模块共享的工具、hooks、状态和类型。

**规则**：
- `hooks/` — 可复用的 React Hooks，不依赖特定业务
- `stores/` — 全局状态库（Zustand），可被任何模块访问
- `types/` — 全局 TypeScript 类型定义
- `utils/` — 纯函数工具，不依赖 React 或状态
- `sdk/` — 桌面 SDK，提供桌面事件的发布/订阅

## 路径别名

为了简化 import 路径，配置了以下别名：

```typescript
// vite.config.ts 和 tsconfig.json 中配置
'@src'                 // 指向 src/
'@src/components'      // 指向 src/desktop/components
'@src/sdk'            // 指向 src/shared/sdk
'@desktop/components'  // 指向 src/desktop/components
'@desktop/layouts'    // 指向 src/desktop/layouts
'@desktop/state'      // 指向 src/desktop/state
'@shared/sdk'         // 指向 src/shared/sdk
'@truenas/api'        // 指向 src/truenas/api
'@truenas/services'   // 指向 src/truenas/services
'@truenas/stores'     // 指向 src/shared/stores
'@truenas/types'      // 指向 src/shared/types
'@truenas/utils'      // 指向 src/shared/utils
```

**使用示例**：

```typescript
// 从 desktop 组件引用 shared 模块
import { useAuthStore } from '@truenas/stores/auth'
import { openApp } from '@shared/sdk/desktop'

// 从应用引用 desktop 布局
import { SidebarLayout } from '@desktop/layouts/SidebarLayout'

// 从应用引用 shared 组件
import { Modal } from '@desktop/components/Modal'
```

## 应用开发规范

### 创建新应用

1. 在 `apps/` 下创建应用目录
2. 创建 `manifest.json`：

```json
{
  "name": "my-app",
  "title": "我的应用",
  "entry": "./src/index.tsx",
  "icons": {
    "default": "./icon.svg"
  },
  "minWidth": 400,
  "minHeight": 300
}
```

3. 导出默认 React 组件

### 应用布局选择

- **SidebarLayout**：适用于有 3-5 个子菜单项的导航
- **TabsLayout**：适用于同级重要性的多个面板切换
- **自定义**：应用完全控制自己的布局

### 应用间通信

- 使用 `@shared/sdk/desktop` 中的事件系统
- 使用 `@truenas/stores/` 中的全局状态
- **禁止**应用间直接 import（使用事件通信）

## 窗口系统

### 窗口状态管理

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

### 窗口生命周期

1. **打开** → `openWindow()` 创建窗口
2. **聚焦** → 点击窗口提升 z-order
3. **最小化** → 窗口隐藏但保留状态
4. **最大化** → 窗口填满工作区
5. **关闭** → `closeWindow()` 移除窗口

## 状态管理

### Zustand Store 规范

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

### 状态持久化

使用 `desktop/state/persistence.ts` 提供的工具：

```typescript
import { persistentStorage, sessionStorage } from '@desktop/state/persistence'

// 持久化存储（localStorage）
persistentStorage.set('key', value)
persistentStorage.get('key')

// 会话存储（sessionStorage）
sessionStorage.set('key', value)
```

## TrueNAS API 调用

### 服务封装

在 `truenas/services/` 下封装业务调用：

```typescript
// truenas/services/pool.ts
import { truenasApi } from '../api'

export const poolService = {
  async listPools() {
    return truenasApi.call('pool.query')
  },
  async createPool(data: PoolCreateParams) {
    return truenasApi.call('pool.create', [data])
  }
}
```

### 类型定义

类型定义放在 `shared/types/`：

```typescript
// shared/types/pool-types.ts
export interface Pool {
  id: number
  name: string
  status: PoolStatus
  // ...
}
```

## 样式规范

- 全局样式：`src/global.css`
- 主题样式：`src/shared/theme/panda.css`
- 应用样式：在各自 `apps/*/` 目录下维护

## 注意事项

- **禁止**在 `desktop/` 和 `framework/` 中直接引用 `apps/` 下的代码
- **禁止**在 `truenas/` 中直接引用 UI 组件
- 所有类型定义尽量放在 `shared/types/` 集中管理
- 新增模块时，先确认属于哪个目录，遵循职责划分

## 功能索引

详细的功能索引文档位于 [docs/](docs/README.md)。
