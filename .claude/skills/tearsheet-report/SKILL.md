---
name: tearsheet-report
description: >-
  在 Tearsheet（tob-json-render）仓库里新增或修改数据报告看板时使用。覆盖声明式
  report.json 的写法、图表选型、最关键的「图表形状→box 尺寸」bento 排版约定，以及
  风格（主题）与组件的合规改法。当用户说"加一份报告 / 改这个看板 / 这个图表换一下 /
  调一下排版或配色"时，先读它。
---

# Tearsheet 报告作者手册（画得专业又合规）

Tearsheet 是一个**报告脚手架**：业务同学（财务/法务/HR，不懂工程）让你帮他们搓数据看板。
运行时 = `json-render`（声明式 JSON spec → 确定性渲染）+ `shadcn/ui`（主题）+ `Recharts`（图表）。

> 仓库根的 [`AGENTS.md`](../../../AGENTS.md) 是权威全量手册（完整组件清单 + `$computed` 函数表）。
> 本 skill 是「**怎么做得好看、怎么改得合规**」的实操层，先读这里建立直觉，细节查 AGENTS.md。

## 三层解耦（动一层别牵动另两层）

| 维度 | 落在哪 | 怎么改 |
|------|--------|--------|
| **排版 / 用哪些图** | `reports/<id>/report.json` | 增删 elements、调 children、换 `type`、调 `spans` |
| **数据 / 怎么算** | `reports/<id>/*.csv` + spec 里 `$state`/`$computed` | 换 CSV 或改绑定 |
| **风格** | shadcn 主题（CSS 变量，`src/globals.css`） | 顶栏「风格」下拉切换；**spec 里绝不写颜色** |

## 新增报告 = 只加文件，不改代码

```
reports/<your-id>/
  meta.json      # { "title", "description", "datasets": { "<id>": "x.csv" } }
  report.json    # 声明式 spec（你的主战场）
  <name>.csv     # 表头 + 数据；spec 里用 /datasets/<id>/rows 拿到行数组
```

数值**永远走绑定**，不要把数字写死进 spec：
- `{ "$state": "/datasets/sales/rows" }` —— 读整张表的行
- `{ "$computed": "sum", "args": { "rows": {"$state": "/datasets/sales/rows"}, "field": "revenue" } }` —— 聚合标量

可用聚合：`sum/avg/min/max/count/distinctCount/groupBy/topN/sortBy/filter/delta/percentOf/format`（详见 AGENTS.md）。
图表的 `data` 必须是**行数组**：直接绑 `/datasets/<id>/rows`，或绑 `sortBy`/`topN`/`groupBy` 的结果。

---

## ★ 排版的灵魂：图表形状 → box 尺寸（最容易翻车，重点看）

报告是**一个连续的 12 列 bento 网格**，不是全宽区块竖向堆积木。每张卡用 `Grid` 的 `spans` 给列宽（一行加总=12）。

**别乱拍 bento。** 每种图有**天生的形状**，`span`（宽）和 `height`（高）要顺着它，否则两种典型翻车：
矮图被高图**撑出大片空白**、宽 box 把少类目**摊得稀稀拉拉**。

| 天生形状 | 典型图 | 建议 span | 建议 height | 要点 |
|---------|--------|-----------|-------------|------|
| **宽而扁** | 时间序列 `LineChart`/`AreaChart`/`ComboChart`（多时间点）、`HeatmapChart`（多列）、`WaterfallChart`（多步） | 8–12 | 240–300 | 需横向空间铺 x 轴；主趋势图给整行或 8 列 |
| **近方形** | `ScatterChart` 散点/气泡、`PieChart` 环图、`RadarChart`、≤8 类目分组 `BarChart`、单系列排行 `BarChart` | 5–6 | 260–300 | 接近正方最稳，别硬拉宽 |
| **逐行增高** | `DumbbellChart`、`BulletChart`、`StatList`、`DataTable`、`SlopeChart` | 4–6（窄） | 由行数决定 | 高度随行数涨；**绝不能和矮图并排** |

**行内等高铁律**：同一 `Grid` 行里的卡片**天生高度要接近**。
反例：7 行的哑铃图（≈360px）和 260px 散点并排 → 散点被撑出一大片空白（真实踩过的坑）。两种解法：
- ① 「逐行增高」的图**独占一行**，或**旁边配一张 `Insight`/文本卡**（文本自适应填高，凑成 `[8,4]` 的漂亮组合）；
- ② 给它**压低 `height`**，把行数挤进与邻图相当的高度。

**常用 row 配方**：
- 4×KPI → `[3,3,3,3]`
- 主趋势独占 → `[12]`；主图+侧栏 → `[8,4]`（趋势 8 + 列表/环形 4）
- 两张同类对比 → `[6,6]`；三等分 → `[4,4,4]`
- 逐行增高的图 → `[8,4]` 配洞察卡，或独占 `[12]` 但压低 `height`

**决策顺序**：先问"这张图天生是宽、是方、还是高？"→ 再定 `span`。**不要为了填满 12 列硬塞**。一行别超过 3–4 张卡。

---

## 选对图（别什么都用柱/线）

| 想表达 | 用 |
|--------|-----|
| 趋势 / 时间序列 | `LineChart`、`AreaChart`（带量级），双轴用 `ComboChart` |
| 排行 / 对比几个类目 | `BarChart`（`sort:"desc"` + `highlight:"max"` 单系列高亮一图一信息）|
| 构成占比 | `PieChart`(donut)；**占比随时间变** → `BarChart` 的 `stack100` |
| 为什么从 A 变成 B | `WaterfallChart`（利润桥 / 预算差异分解，增绿减红自动累计）|
| 实际 vs 目标 | `BulletChart`（自带刻度算达成%，替代仪表盘）|
| 单向递减流程 | `FunnelChart`（线索→签约、招聘漏斗）|
| 两个连续变量关系 / 离群 | `ScatterChart`（给 `sizeKey` 变气泡，`quadrant` 画象限）|
| 两期/区间对比、聚焦"变化量" | `DumbbellChart`（去年 vs 今年）|
| 谁升谁降（排名/方向变化）| `SlopeChart` |
| 类目 × 类目 × 强度 | `HeatmapChart`（`diverging` 正绿负红，适合利润率）|

⚠️ `RadarChart` 慎用——多单位/一家独大会拉成尖刺失真；速度表别用，达成率用 `BulletChart`/`RadialStat`。

## 让它"专业"（这些写进 spec，其余自动）

- **`title` 写结论句**：「营收同比 +12%，华东领涨」而非「营收图」。靠卡片标题分组，少用 `Section`。
- **有目标/基准必加 `refLines`**：`[{ y, label?, tone? }]`（tone: positive/warning/critical/neutral），一眼看达标。
- **有合格/警戒区间** → `band: { from, to, label?, tone? }` 背景染色。
- `valueFormat`(number/currency/percent/compact)：金额图必设 `currency`。
- `showValues` 克制用：柱图标值容易吵，多类目时别全标。

> 等宽数字、柱宽、图例位置（右上角）、轴/网格/Tooltip 样式、语义色——**组件层已统一处理，spec 不用也不要写**。
> **绝不在 spec 里写 hex/hsl 颜色、字号、内联 style。**

## 改风格（主题）—— 合规方式

- 切换：顶栏「风格」下拉（base / vega / emerald / violet），实时生效，spec 与数据不动。
- 加预设：去 https://shadcnstudio.com/theme-generator 选风格 → 把它的 CSS 变量粘进
  [`src/globals.css`](../../../src/globals.css) 新增一个 `[data-theme="<id>"]` 块 → 在
  [`src/themes/index.ts`](../../../src/themes/index.ts) 的 `THEMES` 数组登记。
- 调全局观感（饱和度、卡片层级、间距）：改 `globals.css` 的语义变量或组件类，**别去报告 spec 里改**。
  本仓库基调：低饱和（参考 Economist/FT/IBCS）、灰底白卡 bento 层级、`shadow-xs` 细边。

## 改 / 加组件 —— 合规方式（确认确有必要再动）

组件是**白名单**：catalog（Zod 定义，`src/catalog/`）+ registry（React 实现，`src/registry/components/`），spec 越界会校验失败。

- **改某类图的样式/行为**（柱宽、图例、轴、Tooltip、配色逻辑）：改 `src/registry/components/`（图表共享层在 `chart-kit.tsx`，核心图在 `charts.tsx`，进阶图在 `charts-extra.tsx`/`charts-extra2.tsx`）。**这是改"所有报告里这类图"的正确位置**，不要在单份 spec 里 hack。
- **加一个新组件**：先在 `src/catalog/` 加 Zod 定义（props schema），再在 `src/registry/components/` 加实现并登记到 `src/registry/index.ts`（类型会强制你补齐）。
- **加聚合函数**：在 `src/data/functions.ts` 实现并登记到 `computedFunctions`。

### Recharts 硬坑（改组件时必记）
- 入场动画必关：`isAnimationActive={false}`（否则图表卡在动画初态）。
- `BarChart` 的 `horizontal: true` **当前有 bug**（NaN 宽度、只出一根柱），样例一律用纵向规避，待修。
- 多系列/`stack100` 柱图首帧（0 宽）会刷 recharts "NaN width" 无害告警，可忽略。

## 硬规则 + 自检

1. 只用 catalog 里的组件，props 合 Zod schema。
2. 数据用绑定不内联死值；样式交给主题，不写颜色/字号；图表 `data` 是行数组。
3. 新增报告只加文件不改代码。
4. 改完跑：
   ```bash
   pnpm dev        # 改 report.json 即时热更新；浏览器确认渲染 + 数值正确
   pnpm typecheck  # 改了 src/ 必跑
   pnpm test       # 改了数据层/聚合函数必跑
   pnpm build      # 提交前
   ```
   带 `?report=<id>` 可直接打开某份报告（如 `localhost:5173/?report=m7-comparison`）。
