# TrueNAS API 调用

## 服务封装

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

## 类型定义

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
