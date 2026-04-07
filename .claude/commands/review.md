# Code Review Guidelines

Before committing, perform a code review of the changes.

## Review Checklist

### 1. 代码逻辑 (Code Logic)
- [ ] 没有死代码 (No dead code)
- [ ] 没有未使用的导入 (No unused imports)
- [ ] 没有 console.log/console.error 调试代码 (No debug code left)
- [ ] 逻辑正确，无明显 bug

### 2. 安全性 (Security)
- [ ] 没有硬编码的密钥或凭证 (No hardcoded secrets)
- [ ] 用户输入有适当验证 (User input properly validated)
- [ ] 没有 SQL 注入/XSS 风险 (No SQL injection/XSS risks)

### 3. TypeScript 类型 (Types)
- [ ] 类型定义正确 (Types properly defined)
- [ ] 没有 `any` 类型滥用 (No `any` type abuse)
- [ ] 接口/类型可导出 (Exported types/interfaces)

### 4. 测试 (Tests)
- [ ] 新功能有测试覆盖 (New features have test coverage)
- [ ] 现有测试未被破坏 (Existing tests not broken)
- [ ] 测试有意义，不是无用的 assertions

### 5. 代码风格 (Style)
- [ ] 遵循项目编码规范 (Follows project style guidelines)
- [ ] 命名有意义 (Meaningful naming)
- [ ] 注释必要且准确 (Comments are necessary and accurate)

### 6. 性能 (Performance)
- [ ] 没有明显的性能问题 (No obvious performance issues)
- [ ] 没有不必要的重渲染 (No unnecessary re-renders in React)

## Review Output Format

完成 review 后，报告：

```
## Code Review Report

### ✅ 通过的检查
- 检查项1
- 检查项2

### ⚠️ 需要注意
- 问题1及解决方案
- 问题2及解决方案

### ❌ 阻塞问题
- 问题1（必须修复）
- 问题2（必须修复）

### 结论
✅ 可以提交 / ❌ 需要修复后提交
```

## Review 命令

运行以下命令查看变更：

```bash
git diff --cached    # 已暂存的变更
git diff            # 未暂存的变更
git status          # 当前状态
```
