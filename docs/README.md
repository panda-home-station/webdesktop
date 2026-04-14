# 文档索引

## 架构文档

| 文档 | 说明 |
|------|------|
| [websocket-architecture.md](websocket-architecture.md) | WebSocket 通信架构（订阅管理、重连机制、事件分发） |

---

# 功能索引

将特性名称映射到对应的实现文件，方便快速定位代码。

```
webdesktop
├── apps/                              # 系统应用包
│   └── system-settings/               # 系统设置应用
│       └── src/
│           ├── components/
│           │   └── pool-wizard/       # 存储池向导
│           │       ├── CreatePoolPage.tsx       # 向导主入口 (全屏页面)
│           │       ├── store/
│           │       │   └── poolWizardStore.ts  # 状态管理 (Zustand)
│           │       ├── steps/
│           │       │   ├── GeneralStep.tsx     # 通用步骤 (池名称、加密)
│           │       │   ├── DataStep.tsx        # 数据步骤 (布局选择、硬盘分配)
│           │       │   ├── VdevStep.tsx        # 可选 VDEV 步骤 (Log/Spare/Cache/Metadata/Dedup)
│           │       │   └── ReviewStep.tsx      # 审查步骤
│           │       ├── components/
│           │       │   ├── DiskIcon.tsx        # 硬盘图标组件
│           │       │   ├── DiskList.tsx         # 硬盘列表组件
│           │       │   ├── DiskSizeSelector.tsx # 硬盘容量选择器
│           │       │   ├── LayoutSelector.tsx   # 布局选择器
│           │       │   ├── PoolSummary.tsx      # 存储池摘要组件
│           │       │   └── VdevConfigurator.tsx # VDEV 配置器
│           │       └── utils/
│           │           ├── validation.ts       # 步骤验证逻辑
│           │           ├── disk-selection.ts  # 硬盘自动选择逻辑
│           │           └── topology-utils.ts   # 拓扑工具函数
│           └── styles/
│               └── theme.ts            # 颜色/主题配置
│
├── src/
│   ├── desktop/                      # 桌面环境核心
│   │   ├── components/               # 桌面 UI 组件
│   │   ├── layouts/                  # 应用布局组件
│   │   └── state/
│   │       ├── windows-store.ts      # 窗口状态管理
│   │       └── persistence.ts        # 窗口持久化
│   │
│   ├── framework/                    # 应用加载框架
│   │   └── registry.ts               # 应用注册/加载
│   │
│   ├── truenas/                     # TrueNAS API 层
│   │   ├── api/                     # WebSocket API 客户端
│   │   └── services/                 # 服务封装
│   │       ├── pool.ts              # 存储池 API 服务
│   │       └── disk.ts              # 硬盘 API 服务
│   │
│   ├── shared/                      # 共享模块
│   │   ├── types/
│   │   │   ├── pool-types.ts        # 存储池类型定义
│   │   │   ├── disk-types.ts        # 硬盘类型定义
│   │   │   └── vdev-enum-types.ts   # VDEV 枚举类型
│   │   ├── theme/
│   │   │   └── panda.css            # 熊猫主题
│   │   └── ...
│   │
│   ├── global.css                   # 全局样式
│   ├── App.tsx
│   └── main.tsx
```

## 按功能分类

### 存储管理 (Storage)

#### 存储池向导 (Pool Wizard)
- 向导主入口 → [CreatePoolPage.tsx](apps/system-settings/src/components/pool-wizard/CreatePoolPage.tsx)
- 状态管理 (Zustand) → [poolWizardStore.ts](apps/system-settings/src/components/pool-wizard/store/poolWizardStore.ts)
- 通用步骤 (池名称、加密) → [GeneralStep.tsx](apps/system-settings/src/components/pool-wizard/steps/GeneralStep.tsx)
- 数据步骤 (布局选择、硬盘分配) → [DataStep.tsx](apps/system-settings/src/components/pool-wizard/steps/DataStep.tsx)
- 可选 VDEV 步骤 (Log/Spare/Cache/Metadata/Dedup) → [VdevStep.tsx](apps/system-settings/src/components/pool-wizard/steps/VdevStep.tsx)
- 审查步骤 → [ReviewStep.tsx](apps/system-settings/src/components/pool-wizard/steps/ReviewStep.tsx)
- 硬盘图标组件 → [DiskIcon.tsx](apps/system-settings/src/components/pool-wizard/components/DiskIcon.tsx)
- 硬盘列表组件 → [DiskList.tsx](apps/system-settings/src/components/pool-wizard/components/DiskList.tsx)
- 硬盘容量选择器 → [DiskSizeSelector.tsx](apps/system-settings/src/components/pool-wizard/components/DiskSizeSelector.tsx)
- 布局选择器 → [LayoutSelector.tsx](apps/system-settings/src/components/pool-wizard/components/LayoutSelector.tsx)
- 存储池摘要组件 → [PoolSummary.tsx](apps/system-settings/src/components/pool-wizard/components/PoolSummary.tsx)
- VDEV 配置器 → [VdevConfigurator.tsx](apps/system-settings/src/components/pool-wizard/components/VdevConfigurator.tsx)
- 步骤验证逻辑 → [validation.ts](apps/system-settings/src/components/pool-wizard/utils/validation.ts)
- 硬盘自动选择逻辑 → [disk-selection.ts](apps/system-settings/src/components/pool-wizard/utils/disk-selection.ts)
- 拓扑工具函数 → [topology-utils.ts](apps/system-settings/src/components/pool-wizard/utils/topology-utils.ts)

#### 存储相关服务
- 存储池 API 服务 → [pool.ts](src/truenas/services/pool.ts)
- 硬盘 API 服务 → [disk.ts](src/truenas/services/disk.ts)
- 存储池类型定义 → [pool-types.ts](src/shared/types/pool-types.ts)
- 硬盘类型定义 → [disk-types.ts](src/shared/types/disk-types.ts)
- VDEV 枚举类型 → [vdev-enum-types.ts](src/shared/types/vdev-enum-types.ts)

### 桌面环境 (Desktop)
- 窗口状态管理 → [windows-store.ts](src/desktop/state/windows-store.ts)
- 窗口持久化 → [persistence.ts](src/desktop/state/persistence.ts)
- 应用注册/加载 → [registry.ts](src/framework/registry.ts)
- 桌面布局组件 → [src/desktop/layouts/](src/desktop/layouts/)
- 桌面 UI 组件 → [src/desktop/components/](src/desktop/components/)

### TrueNAS API 层
- WebSocket API 客户端 → [src/truenas/api/](src/truenas/api/)
- 服务封装 → [src/truenas/services/](src/truenas/services/)

### 主题与样式
- 全局样式 → [global.css](src/global.css)
- 熊猫主题 → [panda.css](src/shared/theme/panda.css)
- 颜色/主题配置 → [theme.ts](apps/system-settings/src/styles/theme.ts)
