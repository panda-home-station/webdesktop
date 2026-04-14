# 路径别名

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
