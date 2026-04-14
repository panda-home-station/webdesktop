# 应用开发规范

## 创建新应用

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

## 应用布局选择

- **SidebarLayout**：适用于有 3-5 个子菜单项的导航
- **TabsLayout**：适用于同级重要性的多个面板切换
- **自定义**：应用完全控制自己的布局

## 应用间通信

- 使用 `@shared/sdk/desktop` 中的事件系统
- 使用 `@truenas/stores/` 中的全局状态
- **禁止**应用间直接 import（使用事件通信）
