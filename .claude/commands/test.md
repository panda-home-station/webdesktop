# Test Guidelines

Before committing, ensure all tests pass.

## Test Commands

```bash
# 运行所有检查（lint + 测试）
npm run test:all
```

## Test Requirements

### 必须通过的条件
1. 所有测试必须通过（0 failures）
2. 测试覆盖率不能下降
3. 没有 TypeScript 类型错误

### 测试覆盖检查
运行 `npm run test:coverage -- --run` 后检查：
- 语句覆盖率（Statements）：建议 > 60%
- 分支覆盖率（Branches）：建议 > 50%
- 函数覆盖率（Functions）：建议 > 60%
- 行覆盖率（Lines）：建议 > 60%

如果覆盖率下降，需要：
1. 添加更多测试用例
2. 或在 review 中说明原因

## Test Output Format

测试通过时报告：

```
## Test Report

✅ 所有测试通过
- 测试文件: X 个
- 测试用例: Y 个
- 覆盖率: XX%

结论: ✅ 测试通过
```

测试失败时报告：

```
## Test Report

❌ 测试失败
- 失败测试: X 个
- 失败原因:
  1. src/path/TestName.test.ts - 具体错误

结论: ❌ 需要修复后提交
```
