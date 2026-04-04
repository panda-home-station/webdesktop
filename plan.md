# WebDesktop TrueNAS 应用架构规划

## 整体架构

将 webui 左侧主目录中的功能模块迁移为 webdesktop 应用，采用**分类集成**的策略：
- **独立核心应用**：功能单一、使用频繁的模块作为独立应用
- **功能集成应用**：将相关功能集成到一个应用内，使用侧边栏或标签页切换

## 应用分类

### 第一类：独立核心应用
每个都是完整的独立应用，功能单一且重要

| 应用 | 路径 | 说明 |
|------|------|------|
| Storage | `storage` | 存储 - 磁盘管理、存储池管理、硬件监控 |
| Apps | `apps` | 应用市场 - TrueNAS 应用管理、Docker/Kubernetes 容器 |

### 第二类：功能集成应用
将相关功能集成到一个应用内，使用侧边栏或标签页切换

| 应用 | 路径 | 子功能 | 导航方式 |
|------|------|--------|----------|
| Datasets | `datasets` | 数据集管理、权限、快照、配额、ZFS 属性 | 侧边栏 |
| Sharing | `sharing` | SMB、NFS、AFP、WebDAV、iSCSI 等所有共享协议 | 标签页 |
| Data Protection | `data-protection` | 快照、复制任务、云同步、备份恢复 | 标签页 |
| Virtual Machines | `virtual-machines` | 虚拟机管理、容器/实例组管理 | 标签页 |
| Reporting | `reporting` | CPU、内存、磁盘、网络等所有监控报告 | 标签页 |
| Credentials | `credentials` | 用户、用户组、SSH密钥、证书、AD/LDAP | 侧边栏 |
| System | `system` | 网络设置、通用设置、更新、重置、系统信息等 | 侧边栏 |

## 目录结构

```
src/apps/
├── storage/                      # 独立应用 - 存储
│   ├── components/
│   │   ├── DiskManagement/
│   │   ├── PoolManagement/
│   │   └── HardwareMonitor/
│   ├── hooks/
│   ├── api.ts
│   ├── App.tsx
│   └── index.ts
│
├── datasets/                     # 集成应用 - 数据集
│   ├── components/
│   │   ├── Dataset DatasetsList/
│   │   ├── Permissions/
│   │   ├── Snapshots/
│   │   └── Quotas/
│   ├── layouts/
│   │   └── SidebarLayout.tsx
│   ├── hooks/
│   ├── api.ts
│   ├── App.tsx
│   └── index.ts
│
├── sharing/                      # 集成应用 - 共享
│   ├── components/
│   │   ├── SMB/
│   │   ├── NFS/
│   │   ├── AFP/
│   │   ├── WebDAV/
│   │   └── iSCSI/
│   ├── layouts/
│   │   └── TabsLayout.tsx
│   ├── hooks/
│   ├── api.ts
│   ├── App.tsx
│   └── index.ts
│
├── data-protection/              # 集成应用 - 数据保护
│   ├── components/
│   │   ├── Snapshots/
│   │   ├── Replication/
│   │   ├── CloudSync/
│   │   └── BackupRestore/
│   ├── layouts/
│   │   └── TabsLayout.tsx
│   ├── hooks/
│   ├── api.ts
│   ├── App.tsx
│   └── index.ts
│
├── virtual-machines/              # 集成应用 - 虚拟机
│   ├── components/
│   │   ├── VMManagement/
│   │   └── ContainerManagement/
│   ├── layouts/
│   │   └── TabsLayout.tsx
│   ├── hooks/
│   ├── api.ts
│   ├── App.tsx
│   └── index.ts
│
├── reporting/                   # 集成应用 - 报告
│   ├── components/
│   │   ├── CPUReports/
│   │   ├── MemoryReports/
│   │   ├── DiskReports/
│   │   └── NetworkReports/
│   ├── layouts/
│   │   └── TabsLayout.tsx
│   ├── hooks/
│   ├── api.ts
│   ├── App.tsx
│   └── index.ts
│
├── credentials/                  # 集成应用 - 用户凭据
│   ├── components/
│   │   ├── Users/
│   │   ├── Groups/
│   │   ├── SSHKeys/
│   │   ├── Certificates/
│   │   └── DirectoryServices/
│   ├── layouts/
│   │   └── SidebarLayout.tsx
│   ├── hooks/
│   ├── api.ts
│   ├── App.tsx
│   └── index.ts
│
├── system/                       # 集成应用 - 系统设置
│   ├── components/
│   │   ├── Network/
│   │   ├── General/
│   │   ├── Update/
│   │   ├── Advanced/
│   │   └── SystemInfo/
│   ├── layouts/
│   │   └── SidebarLayout.tsx
│   ├── hooks/
│   ├── api.ts
│   ├── App.tsx
│   └── index.ts
│
└── apps/                         # 独立应用 - 应用市场
    ├── components/
    ├── hooks/
    ├── api.ts
    ├── App.tsx
    └── index.ts
```

## 实现顺序

### 阶段一：基础设施
1. 创建应用通用布局组件
   - `SidebarLayout.tsx` - 侧边栏导航布局
   - `TabsLayout.tsx` - 标签页导航布局

2. 创建应用注册机制
   - 应用图标配置
   - 应用元数据定义

### 阶段二：独立核心应用
3. 实现 **Storage** 应用
   - 磁盘管理
   - 存储池管理
   - 硬件监控

### 阶段三：功能集成应用（按优先级）
4. 实现 **System** 应用
   - 网络设置
   - 通用设置

5. 实现 **Credentials** 应用
   - 用户管理
   - 用户组管理

6. 实现 **Datasets** 应用
   - 数据集列表
   - 权限管理

7. 实现 **Sharing** 应用
   - SMB 配置
   - NFS 配置

8. 实现 **Data Protection** 应用
   - 快照管理
   - 复制任务

9. 实现 **Virtual Machines** 应用
    - 虚拟机管理

10. 实现 **Reporting** 应用
    - 性能报告

11. 实现 **Apps** 应用
    - 应用市场
    - 应用管理

## 技术要点

### 1. 应用标准接口
每个应用需要实现统一的应用接口：

```typescript
interface DesktopApp {
  id: string
  name: string
  icon: string | React.ComponentType
  description?: string
  Component: React.ComponentType
  defaultWidth?: number
  defaultHeight?: number
  defaultPosition?: { x: number; y: number }
  minimizable?: boolean
  maximizable?: boolean
  resizable?: boolean
}
```

### 2. API 集成
每个应用的 `api.ts` 负责封装该应用相关的 TrueNAS API 调用

### 3. 状态管理
- 应用内状态使用 React hooks
- 跨应用状态使用 zustand 或桌面 SDK 事件系统

### 4. 导航模式
- **SidebarLayout**: 适合 3-5 个子项，采用左侧边栏 + 右侧内容区
- **TabsLayout**: 适合所有子项平级显示，采用顶部标签页 + 内容区

## WebUI 功能映射

| WebUI 菜单 | 对应应用 | 子功能 |
|------------|----------|--------|
| Storage | Storage | - |
| Datasets | Datasets | 数据集管理 |
| Shares | Sharing | SMB, NFS, AFP, WebDAV, iSCSI |
| Data Protection | Data Protection | 快照, 复制, 云同步 |
| Credentials | Credentials | 用户, 用户组, SSH密钥, 证书 |
| Containers | Virtual Machines | 容器管理 |
| Virtual Machines | Virtual Machines | 虚拟机管理 |
| Apps | Apps | - |
| Reporting | Reporting | CPU, 内存, 磁盘, 网络 |
| System | System | 网络设置, 通用设置, 更新等 |

## 后续优化

1. **应用间通信**: 通过桌面 SDK 实现应用间事件通信
2. **拖拽支持**: 在数据集和应用之间支持拖拽创建共享
3. **通知系统**: 集成 TrueNAS 事件到桌面通知系统
4. **快速访问**: 在桌面快捷方式栏添加常用应用的快捷入口
