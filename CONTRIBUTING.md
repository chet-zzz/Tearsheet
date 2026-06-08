# 贡献指南

感谢参与 Tearsheet！本仓库是一个**报告脚手架**，绝大多数贡献分两类。

## 1. 加 / 改报告（最常见，不碰底座）

只在 `reports/` 下操作：新建文件夹，放 `meta.json` + `report.json` + `*.csv`，构建时自动发现。

- 写法、组件清单、数据绑定（`$state` / `$computed`）、排版铁律全部见 **[AGENTS.md](AGENTS.md)**。
- 硬规则：只用 catalog 内组件；数值走绑定不内联死值；颜色 / 样式交给主题，绝不内联。

## 2. 扩组件 / 改底座（需确有必要）

- 新增组件：先在 `src/catalog/` 用 Zod 定义（这是白名单 + 给 agent 的说明书），再到 `src/registry/components/` 补 React 实现（类型会强制你补齐）。
- 新增 `$computed` 聚合函数：在 `src/data/functions.ts` 实现并登记到 `computedFunctions`。
- 新增主题：把 shadcnstudio 预设的 CSS 变量加进 `src/globals.css` 的 `[data-theme="<id>"]`，再到 `src/themes/index.ts` 登记。

## 提交前自检

```bash
pnpm typecheck   # 类型检查
pnpm build       # 生产构建
pnpm test        # 数据层 / 聚合函数单测
```

涉及 UI 改动请在浏览器（`pnpm dev`）确认渲染正常、数值正确，最好附上截图。

## 提 PR

- 一个 PR 聚焦一件事，描述清楚动机与影响面。
- 报告类 PR 请说明数据来源；底座类 PR 请说明为何需要扩展。
