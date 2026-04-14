# 模块职责划分

## desktop/ — 桌面环境核心

**职责**：提供完整的桌面体验，包括窗口管理、任务栏、启动器等。

**规则**：
- 所有桌面 UI 组件必须放在 `desktop/components/`
- 窗口相关状态必须放在 `desktop/state/`
- **禁止**从 `desktop/` 直接引用 `apps/` 下的应用代码（循环依赖）
- 预置布局放在 `desktop/layouts/`，供应用使用

## framework/ — 应用加载框架

**职责**：管理应用的注册、发现和动态加载。

**规则**：
- 只包含 `registry.ts`，负责扫描 `apps/*/manifest.json` 并加载应用
- **禁止**在框架层存放业务逻辑

## truenas/ — TrueNAS API 层

**职责**：封装与 TrueNAS 中间件的 WebSocket 通信。

**规则**：
- `api/` — 底层 WebSocket 客户端，实现 JSON-RPC 2.0 协议
- `services/` — 上层服务封装，封装具体的业务调用
- **禁止**服务层直接操作 UI 组件
- 类型定义放在 `shared/types/`，不在此目录重复定义

**WebSocket 架构**：见 [websocket-architecture.md](websocket-architecture.md)

## shared/ — 共享模块

**职责**：被多个模块共享的工具、hooks、状态和类型。

**规则**：
- `hooks/` — 可复用的 React Hooks，不依赖特定业务
- `stores/` — 全局状态库（Zustand），可被任何模块访问
- `types/` — 全局 TypeScript 类型定义
- `utils/` — 纯函数工具，不依赖 React 或状态
- `sdk/` — 桌面 SDK，提供桌面事件的发布/订阅
