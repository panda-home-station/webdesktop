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
├── apps/                          # 系统应用包（agent, appstore, files, jobs, notifications, reporting, system-settings, user-center, virtual-machines）
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
    │   └── theme/                  # 主题
    ├── environments/               # 环境配置
    ├── App.tsx
    ├── main.tsx
    └── global.css
```

## 核心规则

- **禁止**在 `desktop/` 和 `framework/` 中直接引用 `apps/` 下的代码（循环依赖）
- **禁止**在 `truenas/` 中直接引用 UI 组件
- **禁止**应用间直接 import（使用事件通信）
- 所有类型定义尽量放在 `shared/types/` 集中管理
- 新增模块时，先确认属于哪个目录，遵循职责划分

## 文档索引

### 核心文档（必读）
- [docs/modules.md](docs/modules.md) — 模块职责划分

### 需要时阅读
- [docs/path-aliases.md](docs/path-aliases.md) — 路径别名配置
- [docs/app-development.md](docs/app-development.md) — 应用开发规范
- [docs/window-system.md](docs/window-system.md) — 窗口系统
- [docs/state-management.md](docs/state-management.md) — 状态管理
- [docs/api-calls.md](docs/api-calls.md) — TrueNAS API 调用
- [docs/websocket-architecture.md](docs/websocket-architecture.md) — WebSocket 架构
- [docs/feature-index.md](docs/feature-index.md) — 功能索引（代码定位用）
