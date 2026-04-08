# Commit Skill

当用户提到 commit 或者运行 commit 命令时，执行以下流程：

## 提交流程

### 1. Code Review（必须）

详细检查项见 [.claude/commands/review.md](.claude/commands/review.md)。

**核心检查：**
- [ ] 代码逻辑正确，无死代码
- [ ] 无硬编码密钥或凭证
- [ ] TypeScript 类型正确
- [ ] 新功能有测试覆盖
- [ ] 现有测试未被破坏
- [ ] 遵循代码风格规范

**输出格式：**
```
## Code Review Report
✅ 通过的检查
⚠️ 需要注意
❌ 阻塞问题
结论: ✅ 可以提交 / ❌ 需要修复后提交
```

### 2. Test（必须）

详细要求见 [.claude/commands/test.md](.claude/commands/test.md)。

**必须运行：**
```bash
npm run regression
```

**必须满足：**
- 所有测试通过（0 failures）
- 覆盖率不能下降
- 无 TypeScript 类型错误

**输出格式：**
```
## Test Report
✅ 所有测试通过
- 测试文件: X 个
- 测试用例: Y 个
结论: ✅ 测试通过
```

### 3. Commit（仅在 Review 和 Test 都通过后）

执行 git commit。

```bash
git add <files>
git commit -m "<message>"
```

## Commit Message 格式

```
<type>: <subject>

<body>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Type 类型
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具变更
- `docs`: 文档变更

## 中断条件

如果任一环节失败：
1. Code Review 失败 → 修复问题后重新 review
2. Test 失败 → 修复问题后重新测试

**禁止**在 Review 或 Test 失败时进行 Commit。
