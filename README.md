# Tearsheet

> **Agent-authored, declarative report dashboards.** 写一份 JSON spec，确定性地渲染成专业看板。
> 面向企业内部非工程团队（财务 / 法务 / 税务 / 人事）的**报告脚手架**：用 coding agent 写声明式 spec，[json-render](https://github.com/vercel-labs/json-render) 运行时渲染。把"框架 / 组件 / 数据接入"藏进底座，让业务同学（通过 agent）只调**报告本身**。

<p>
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="react" src="https://img.shields.io/badge/React-19-149eca.svg" />
  <img alt="typescript" src="https://img.shields.io/badge/TypeScript-5-3178c6.svg" />
  <img alt="built with" src="https://img.shields.io/badge/built%20with-json--render%20%C2%B7%20shadcn%20%C2%B7%20Recharts-111.svg" />
</p>

## 为什么做这个

财务 / 法务 / 税务 / 人事这类业务团队常被要求"用 AI 搓看板"，但他们不懂工程，弱模型直接生成代码又往往得到一坨 **pandas + 字符串拼 HTML** 的产物——**风格、数据、排版焊死在一起**，改一处崩一片，和老板反复对齐版面就是灾难；数据源（Excel / 内部 API）和登录态也毫无抽象。

Tearsheet 把这件事**结构化**：

- **AI 前移到开发期**：业务同学用手里的 coding agent（如 Claude Code）改本仓库，产物是确定的、能跑的 spec + 数据，不靠运行时抽卡——弱模型不再是运行时风险。
- **三层彻底解耦**：改版面 / 换数据 / 换风格互不干扰。

## 三层解耦（项目的灵魂）

```
排版 / 用哪些图表  ──►  reports/<id>/report.json   (声明式 spec，agent 主战场)
数据 / 怎么算       ──►  reports/<id>/*.csv + $state / $computed 绑定
风格               ──►  shadcn 主题(CSS 变量)，一键切换，spec 与数据不动
框架 / 组件 / 数据接入 ─►  src/ 底座(catalog + registry + 运行时)，对业务隐藏
```

> ⛔ 最容易犯的错：把数值、颜色、布局耦合到一起。**绝不**在 spec 里内联死数字（用 `$state`/`$computed` 绑数据）或内联颜色 / 样式（交给主题）。

## 内置示例

项目**开箱自带一份样例报告** `reports/m7-comparison`（Magnificent 7 财务对比），保证你第一次 `pnpm dev` 就能看到效果——它是一份决策级 peer comparison：合计概览带、估值/质量 comp 对比表（含前瞻 P/E、M7 中位基准）、增长×质量散点矩阵、Rule of 40 子弹达标、增速斜率、AI 资本开支组合图、投资结论。顶栏可切换**风格**实时换肤。

> 这份样例**可以随意删除**——它只是个参考/占位，删掉后 `reports/` 为空，应用会提示你新建自己的报告。

**给 coding agent 的更多例子**（不同场景的完整 `report.json`，含单公司深度分析 / 通用财务概览 / HR 招聘漏斗）放在 [`.claude/skills/tearsheet-report/references/examples/`](.claude/skills/tearsheet-report/references/examples/)，配有「场景 → 该用哪些组件」对照表。这些不被应用加载，纯当模板参考；要用就整个文件夹拷进 `reports/`。

无论哪份都体现同一设计主张：**agent 开发期把数据分析 + 声明式 spec 一起写好，运行时确定性渲染**；换数据=换 CSV、换风格=切下拉、改版面=动 spec，三者互不串味。

## 快速开始

```bash
pnpm install
pnpm dev        # 打开本地预览（默认端口 5173），自带一份样例报告
```

## 加一份报告（不用改代码）

在 `reports/` 下新建文件夹，放三类文件即可**自动发现**：

```
reports/<your-id>/
  meta.json      # 标题 + 数据集声明
  report.json    # 声明式 spec（你的主战场）
  <name>.csv     # 一个或多个数据文件
```

完整写法、组件清单、数据绑定约定与排版铁律见 **[AGENTS.md](AGENTS.md)**——它同时是给 coding agent 的工作手册（让 agent clone 后即懂怎么搓报告）。

## 架构

```
CSV ──ExcelDataSource──► Dataset ──┐
                                   ├─► initialState ──► JSONUIProvider ──► Renderer ──► UI
report.json (spec) ────────────────┘        (registry + $computed functions)
```

- **`src/catalog/`** — 用 Zod 定义所有报告组件（白名单 + 给 agent 的说明书 `catalog.prompt()`）
- **`src/registry/`** — 组件的 React 实现（shadcn 真原语 + Recharts）
- **`src/data/`** — 数据源抽象（Excel/CSV → `Dataset`）+ `$computed` 聚合函数；内部 API 留 `ApiDataSource` 插槽
- **`src/themes/`** + `src/globals.css` — shadcn 主题预设与切换（base / vega / emerald / violet）
- **`src/runtime/`** — `loadReport` + `ReportRenderer` 装配
- **`reports/`** — 报告内容（每个文件夹一份，构建时自动发现）

可用图表：Bar / Line / Area / Pie / Combo / **Waterfall(利润桥)** / **Bullet(子弹/达成)** / **Funnel(漏斗)** / **Scatter(散点·气泡·象限)**，外加 KPI 卡（含迷你趋势 sparkline）、StatList、RadialStat、DataTable、Insight。专业细节内建：目标线 / 阈值带 / 末值标注 / 盈亏语义色 / 排序高亮 / 等宽数字排版。

技术栈：Vite · React 19 · TypeScript · json-render · shadcn (Tailwind v4) · Recharts · SheetJS / papaparse · Zod。

## 命令

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 本地预览（热更新） |
| `pnpm build` | 生产构建 |
| `pnpm typecheck` | 类型检查 |
| `pnpm test` | 数据层 / 聚合函数单测 |

## 路线图（暂未实现）

- 内部数据 API / SSO 真实对接（已留 `ApiDataSource` 插槽）
- 更多 shadcnstudio 主题预设
- 运行时 LLM 流式生成（json-render 原生能力，本仓库默认走静态 spec）

## 贡献

欢迎 PR / Issue。改报告只动 `reports/`；扩组件需同步 `src/catalog/`（Zod 定义）与 `src/registry/`（React 实现）。提交前请跑 `pnpm typecheck && pnpm build && pnpm test`。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 致谢

- [json-render](https://github.com/vercel-labs/json-render) — 声明式 UI 运行时
- [shadcn/ui](https://ui.shadcn.com/) — 组件原语与主题体系
- [Recharts](https://recharts.org/) — 图表底层

## License

[MIT](LICENSE) © chet-zzz
