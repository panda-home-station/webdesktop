# WebSocket 通信架构

## 概述

webdesktop 通过 WebSocket 与 TrueNAS 中间件通信，采用 JSON-RPC 2.0 协议。通信层位于 `src/truenas/api/`，核心文件为 `websocket-client.ts`。

## 目录结构

```
src/truenas/api/
├── index.ts              # 对外 API 导出
└── websocket-client.ts   # WebSocket 客户端实现
```

## 核心组件

### 1. TrueNASWebSocketClient

底层 WebSocket 客户端类，负责：
- WebSocket 连接管理与自动重连（指数退避 + jitter）
- JSON-RPC 2.0 请求/响应处理
- 心跳保活
- **集中化订阅管理**（通过 SubscriptionRegistry）

关键配置项：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `initialReconnectDelay` | 1000ms | 初始重连延迟 |
| `maxReconnectDelay` | 30000ms | 最大重连延迟 |
| `backoffFactor` | 2 | 指数退避因子 |
| `maxReconnectJitter` | 500ms | 重连 jitter（防 thundering herd） |
| `heartbeatInterval` | 30000ms | 心跳间隔 |
| `connectionTimeout` | 10000ms | 连接超时 |
| `maxRetries` | Infinity | 最大重试次数 |

### 2. SubscriptionRegistry（订阅注册中心）

**作用**：集中管理所有 WebSocket 事件订阅，实现去重和断线重连恢复。

**解决的问题**：
- **去重**：多个 store/service 订阅同一事件时，只建立一个后端订阅
- **重连恢复**：WebSocket 断线重连后，自动重新订阅所有活跃事件

**工作流程**：

```
应用调用 subscribe('core.get_jobs', callback)
         │
         ▼
┌─────────────────────────────────────────────┐
│         SubscriptionRegistry                  │
│                                             │
│  subscriptions Map:                          │
│  'core.get_jobs' → {                        │
│    callbacks: Set([cb1, cb2]),               │
│    backendId: 'xxx',  // 后端订阅ID          │
│    isEstablished: true,                      │
│    pendingCallId: null                      │
│  }                                          │
└─────────────────────────────────────────────┘
         │
         ▼
    sendRaw('core.subscribe', ['core.get_jobs'], 'sub_core.get_jobs_xxx')
         │
         ▼
┌─────────────────────────────────────────────┐
│           TrueNAS Backend                    │
│                                             │
│  后端返回确认:                               │
│  { id: 'sub_core.get_jobs_xxx',             │
│    result: 'subscription_id' }              │
│                                             │
│  后续事件推送:                                │
│  { method: 'core.get_jobs',                 │
│    params: { msg: 'ADDED', fields: {...} }}│
└─────────────────────────────────────────────┘
```

### 3. 连接状态机

```typescript
enum ConnectionState {
  Disconnected = 'disconnected',   // 未连接
  Connecting = 'connecting',        // 连接中
  Connected = 'connected',          // 已连接
  Reconnecting = 'reconnecting',    // 重新连接中
  Error = 'error',                 // 连接错误
}
```

## 重连机制

### 指数退避 + Jitter

```
delay_n = min(initialDelay * (backoffFactor^n) + random(0, maxJitter), maxReconnectDelay)
```

**为什么需要 jitter**：当多个客户端同时断线时，如果没有 jitter，所有客户端会在相同时间点尝试重连，造成"thundering herd"问题。Jitter 通过在延迟中加入随机量，使重连时间分散开来。

### 重连流程

```
WebSocket 断开
     │
     ▼
handleClose() → scheduleReconnect()
     │
     ▼
等待 delay_n（包含 jitter）
     │
     ▼
connect() → handleOpen()
     │
     ├── flushPendingCalls()        // 重放断线期间的普通 RPC 调用
     │
     └── resubscribeAll()           // 重新订阅所有活跃事件
              │
              ▼
         遍历 subscriptions Map
              │
              ▼
         对每个有 callbacks 的事件，重新发送 core.subscribe
```

## 订阅去重机制

### 问题

在旧的实现中，每个 store/service 独立订阅：

```typescript
// 旧实现（问题）
storeA.subscribe('alert.list', cb1)  // → core.subscribe('alert.list')  # 后端建立订阅 A
storeB.subscribe('alert.list', cb2)  // → core.subscribe('alert.list')  # 后端又建订阅 B（重复！）
```

### 解决

```typescript
// 新实现（通过 SubscriptionRegistry）
storeA.subscribe('alert.list', cb1)  // → 注册 cb1，backendId=null
storeB.subscribe('alert.list', cb2)  // → 注册 cb2，共用同一个后端订阅
                                      // 只发送一次 core.subscribe
```

### 内部实现

```typescript
// subscriptions Map 结构
'core.get_jobs' → {
  callbacks: Set([cb1, cb2, cb3]),  // 多个本地回调共享一个后端订阅
  backendId: 'backend_sub_id',       // 后端返回的订阅 ID
  isEstablished: true,                // 订阅是否已确认
  pendingCallId: null                // 等待确认中的 callId
}
```

当所有 callbacks 都取消订阅后（`callbacks.size === 0`），才会发送 `core.unsubscribe` 到后端。

## 事件分发机制

TrueNAS 后端发送两种格式的事件：

### 格式 1：`{ method: 'event_name', params: {...} }`

```typescript
// 例如：core.get_jobs 事件
{
  method: 'core.get_jobs',
  params: {
    msg: 'ADDED' | 'CHANGED' | 'REMOVED',
    id: 123,
    fields: { ... }
  }
}
```

### 格式 2：`{ id: 'event_name', result: {...} }`

某些事件使用 id 字段作为事件名。

### 分发流程

```typescript
handleMessage(message):
  │
  ├── 有 id + 在 pendingRequests 中 → RPC 响应
  │                                    └── resolve/reject Promise
  │
  └── 否则 → handleEventMessage()
              │
              ├── method 存在 → dispatch(method, params)
              │                    │
              │                    └── subscriptions.dispatch(event, data)
              │                           │
              │                           ▼
              │                      遍历 callbacks，逐一调用
              │
              └── id 存在（非响应） → dispatch(id, result)
                                       │
                                       └── 同上
```

## 对比 webui

| 特性 | webui | webdesktop（新） |
|------|-------|-----------------|
| 订阅管理 | SubscriptionManagerService | SubscriptionRegistry |
| 重连恢复 | scheduleCall 队列 | resubscribeAll() |
| 订阅去重 | 是 | 是 |
| Jitter | 无 | 有（maxReconnectJitter） |
| 连接状态 | Connected/Reconnecting | 5 种状态（含 Error） |

### webui 的订阅管理

webui 的 `SubscriptionManagerService` 通过 `WebSocketHandlerService.scheduleCall()` 将 `core.subscribe` 加入队列，重连后自动重放。优点是实现简单，缺点是每个订阅都是独立的后端订阅（不去重）。

## 与业界方案的差距

| 特性 | 当前实现 | 业界方案 |
|------|---------|---------|
| Observable 模式 | 回调 | RxJS / GraphQL Subscriptions |
| 消息确认/QoS | 无 | MQTT QoS 1/2 |
| 熔断器 | 无 | circuit breaker |
| 健康探测 | 心跳 | 订阅状态探测 |
| 分布式 | 无 | Kafka/RabbitMQ |

## 使用示例

```typescript
// 订阅事件
const unsubscribe = truenasApi.subscribe('core.get_jobs', (data) => {
  const event = data as { msg: string; id?: number; fields?: Job }
  // 处理事件
})

// 取消订阅
unsubscribe()

// 获取活跃订阅
const active = truenasApi.getActiveSubscriptions()

// 获取重连统计
const stats = truenasApi.getReconnectStats()
// { attempts: 3, currentDelay: 4000, maxRetries: Infinity }

// 监听连接状态变化
const unsub = truenasApi.onConnectionStateChange((state) => {
  console.log('Connection state:', state)
})
```

## 文件索引

| 文件 | 说明 |
|------|------|
| [websocket-client.ts](../src/truenas/api/websocket-client.ts) | WebSocket 客户端 + SubscriptionRegistry |
| [index.ts](../src/truenas/api/index.ts) | 对外 API 导出 |
