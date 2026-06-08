# AGENTS.md — 给 coding agent 的工作手册

本仓库是一个**报告脚手架**。业务同学（财务 / 法务 / 税务 / 人事，通常不懂工程）会让你（coding agent）帮他们搓数据看板。你的工作几乎只有一件事：**在 `reports/` 下增删改报告**。框架、组件、数据接入都已封装好，不要去碰。

## 核心心智模型：三层解耦

一份报告由三个**互不干扰**的维度组成。改其中一个，绝不要牵动另外两个：

| 维度 | 落在哪 | 你怎么改 |
|------|--------|----------|
| **排版 / 用哪些图表** | `reports/<id>/report.json`（声明式 spec） | 增删 elements、调 children 顺序、换组件 type |
| **数据 / 怎么算** | `reports/<id>/*.csv` + spec 里的 `$state`/`$computed` 绑定 | 换 CSV，或改绑定/聚合 |
| **风格** | shadcn 主题（CSS 变量） | 顶栏「风格」下拉切换；**不要在 spec 里写颜色** |

> ⛔ 最容易犯的错：把数值、颜色、布局耦合到一起。**绝不允许**在 spec 里内联写死数字（要用 `$state`/`$computed` 绑数据）或内联写颜色 / 样式（交给主题）。

## 怎么新增一份报告（核心流程）

在 `reports/` 下建一个文件夹 `reports/<your-id>/`，放三类文件，**无需改任何代码**（构建时自动发现）：

```
reports/<your-id>/
  meta.json      # 标题 + 数据集声明
  report.json    # 声明式 spec（你的主战场）
  <name>.csv     # 一个或多个数据文件
```

### 1) `meta.json`

```json
{
  "title": "报告标题",
  "description": "一句话说明",
  "datasets": { "sales": "sales.csv", "region": "region.csv" }
}
```

`datasets` 把一个**数据集 id**（spec 里用）映射到 CSV 文件名。

### 2) CSV 数据

第一行是表头，列类型自动推断（数字 / 文本 / 布尔 / 日期，能容忍 `1,200`、`¥3,400`、`%`）。例如 `sales.csv`：

```csv
month,revenue,profit
2026-01,1200000,480000
2026-02,1350000,540000
```

加载后，spec 里通过 **`/datasets/<id>/rows`** 拿到这张表的行数组。

### 3) `report.json`（spec）

扁平的元素树：一个 `root` key + 一张 `elements` 表。每个元素 `{ type, props, children }`，`children` 是子元素 key 的数组（叶子用 `[]`）。

```json
{
  "root": "page",
  "elements": {
    "page": { "type": "Page", "props": { "title": "月度销售" }, "children": ["kpi", "trend"] },
    "kpi": {
      "type": "KpiCard",
      "props": {
        "label": "总营收", "format": "currency",
        "value": { "$computed": "sum", "args": { "rows": { "$state": "/datasets/sales/rows" }, "field": "revenue" } }
      },
      "children": []
    },
    "trend": {
      "type": "LineChart",
      "props": {
        "xKey": "month",
        "series": [{ "key": "revenue", "label": "营收" }],
        "data": { "$state": "/datasets/sales/rows" }
      },
      "children": []
    }
  }
}
```

完整可参照已有示例：[`reports/finance-q2/`](reports/finance-q2/)。

## 数据绑定：把数据接到组件

props 的值可以是字面量，也可以是**表达式对象**：

| 表达式 | 作用 | 例子 |
|--------|------|------|
| `{ "$state": "/path" }` | 读 state（数据集行用 `/datasets/<id>/rows`） | `{ "$state": "/datasets/sales/rows" }` |
| `{ "$computed": "<fn>", "args": {...} }` | 调用聚合函数（args 会先被解析，可嵌套 `$state`） | 见下 |
| `{ "$template": "营收 ${/datasets/x/total}" }` | 字符串插值 | — |

### 可用的 `$computed` 聚合函数

定义在 [`src/data/functions.ts`](src/data/functions.ts)。作用于行集的函数都接收 `rows`（一般绑 `/datasets/<id>/rows`）：

| 函数 | args | 返回 | 用途 |
|------|------|------|------|
| `sum` / `avg` / `min` / `max` | `{ rows, field }` | 数字 | KPI 标量 |
| `count` | `{ rows }` | 数字 | 行数 |
| `distinctCount` | `{ rows, field }` | 数字 | 去重计数 |
| `groupBy` | `{ rows, by, value?, agg? }` | `[{ [by], value, count }]` | 分组喂图表 |
| `topN` | `{ rows, field, n?, dir? }` | 行子集 | Top 榜（表格 / 条形图） |
| `sortBy` | `{ rows, field, dir? }` | 排序后的行 | — |
| `filter` | `{ rows, field, op, value }` | 过滤后的行 | `op`: eq/ne/gt/gte/lt/lte/contains |
| `delta` | `{ current, previous }` | 百分比数字 | 同比 / 环比 |
| `percentOf` | `{ part, whole }` | 百分比数字 | 占比 / 毛利率 / 达成率（喂 RadialStat） |
| `format` | `{ value, as?, digits? }` | 字符串 | currency/percent/compact/number |

> 想加新聚合函数：在 `src/data/functions.ts` 里实现并登记到 `computedFunctions`，立刻可在所有报告里用。

## 可用组件（catalog）

**只能用下面这些**（白名单，越界会校验失败）。权威定义在 [`src/catalog/`](src/catalog/)；运行时调用 `getSystemPrompt()`（`src/catalog/index.ts`）可拿到自动生成的完整说明。

**布局** — 都接收 children：
- `Page`(根)：`title`、`subtitle?`、`updatedAt?`
- `Grid`：**12 列 bento 网格，看板主力布局**。`spans`(每个子项占的列数数组，与 children 顺序对应，每行加总=12)、`cols`(默认 12)、`gap`(sm/md/lg)。窄屏自动单列。
- `Section`：轻量分组（小灰标题），仅用于两个语义无关的大板块；**默认不要用，整页一个 Grid 即可**。
- `Row` / `Col`：弹性排列（备用，优先用 Grid+spans）。
- `Divider`：`label?`

**文本** — 叶子：
- `Heading`：`text`、`level`(1-4)
- `Text`：`content`、`muted?`
- `Insight`：`content`、`title?`、`tone`(info/positive/warning/critical/neutral) — 洞察卡
- `Badge`：`label`、`tone`

**指标** — 叶子：
- `KpiCard`：`label`、`value`(常绑 `$computed`)、`format`(number/currency/percent/compact)、`icon?`(revenue/cost/profit/customers/users/orders/count/growth/time/target/alert/building/chart/percent)、`unit?`、`delta?`、`deltaLabel?`、`trend?`+`trendKey?`(迷你趋势 sparkline：`trend` 绑行集、`trendKey` 指字段，给大数字补「怎么走到这」的上下文)

**图表** — 叶子，`data` 绑行集，字段映射声明式画图。**都支持 `title?`/`subtitle?`**（自带卡片标题，配合连续 Grid 用，省去 Section）。**`title` 建议写结论句**（「营收同比 +12%，华东领涨」）而非「营收图」。

基础趋势/对比：
- `BarChart`：`data`、`xKey`、`series[{key,label?}]`、`stacked?`、`horizontal?`、`height?`。排行榜：`sort`(asc/desc) + `highlight`(max/min，单系列时高亮那一根、其余淡化)。构成占比随时间变化用 `stack100`(百分比堆叠)。
- `LineChart`：`data`、`xKey`、`series`、`smooth?`、`height?`
- `AreaChart`：`data`、`xKey`、`series`、`stacked?`、`height?`
- `PieChart`：`data`、`nameKey`、`valueKey`、`donut?`、`height?`
- `ComboChart`：`data`、`xKey`、`bars`、`lines`、`secondAxis?`、`height?`

专门图表（按场景选，别硬套柱/线）：
- `WaterfallChart`（瀑布/利润桥）：解释「**为什么**从 A 变成 B」——营收→各项成本→净利、预算 vs 实际差异分解。`data` 每行一项增减值，`xKey`(类目)、`valueKey`(增减值，正增负减)、`totalKey?`(标记合计行的字段，画成从 0 起的总额柱)。增绿减红、自动累计。
- `BulletChart`（子弹图）：指标**自带目标/基准**时比达成率，替代仪表盘。每行一个指标，`labelKey`、`valueKey`(实际)、`targetKey`(目标)，自动算达成%、目标处有刻度线。
- `FunnelChart`（漏斗）：**严格单向递减**的流程（线索→签约、招聘漏斗、审批转化），暴露在哪一环流失最狠。`nameKey`(阶段)、`valueKey`(数值)，`data` 须按阶段顺序排列。
- `ScatterChart`（散点/气泡）：看**两个连续变量的关系/离群点**（客户毛利率 vs 营收）。`xKey`、`yKey`，给 `sizeKey?` 即变气泡图，`nameKey?`/`xLabel?`/`yLabel?` 优化 tooltip，`quadrant?` 画 x=0/y=0 象限线（增长×盈利矩阵）。
- `DumbbellChart`（哑铃）：**两期/区间对比**（去年 vs 今年、预算 vs 实际）。`labelKey`、`startKey`(起点)、`endKey`(终点)、`startLabel?`/`endLabel?`，连线按方向着色（增绿减红）。比并排柱更聚焦"变化量"。
- `SlopeChart`（斜率）：**两个时点的方向/排名变化**（各类目 去年→今年 谁升谁降）。`labelKey`、`startKey`、`endKey`、`startLabel?`/`endLabel?`。值差距悬殊时下方会拥挤，适合量级相近的对比。
- `HeatmapChart`（热力图/网格）：`x 类目 × y 类目 × 强度`（指标×季度、月×品类）。长表 `data`，`xKey`/`yKey`/`valueKey`，`diverging?`(正绿负红，适合利润率)。
- `RadarChart`（雷达）：多维/多类目对比，`axisKey`(每行一个轴) + `series`(每条一张多边形)。⚠️ **慎用**——多指标单位不一致、量级悬殊时易误导；较安全的用法是同一组类目、同单位的两期对比。

> ⚠️ 注意：`RadarChart` 在"一家独大/多单位"数据上会被拉成尖刺、失真，优先考虑 `DumbbellChart`/`BarChart`；速度表信息少——达成率用 `BulletChart` 或 `RadialStat`。

**表格** — 叶子：
- `DataTable`：`data`、`columns[{key,label?,align?,format?}]`、`caption?`、`pageSize?`

**富展示** — 叶子，shadcn dashboard 同款高密度面板：
- `StatList`：图标列表卡，每行 [图标+标签] … [数值+涨跌]。`data`(行集)、`labelKey`、`valueKey`、`sublabelKey?`、`deltaKey?`、`valueFormat?`、`icon?`、`max?`。适合「各区域营收」「各渠道表现」「指标清单」。
- `RadialStat`：环形进度卡，`value`(常绑 `$computed`，进度=value/max)、`max?`、`label?`、`format?`、`caption?`。适合达成率 / 占比 / 健康度。

> 需要新组件时：在 `src/catalog/` 加 Zod 定义，并在 `src/registry/components/` 加 React 实现（类型会强制你补齐）。这属于「扩展框架」，确认确有必要再做。

## 排版铁律（高密度 bento，别堆积木）

报告是**一个连续的 12 列网格**，不是一摞全宽区块竖向累加。

1. **整页放进一个 `Grid`**，用 `spans` 把卡片按列宽铺满每一行（每行加总=12）。不要用 `Section` 把页面切成竖向堆叠的块。
2. **每张卡自带标题**（图表/列表/表格的 `title`/`caption`、KpiCard 的 `label`），靠卡片本身分组，不要大区块标题。
3. **常用 row 配方**（spans）：
   - 4×KPI：`[3,3,3,3]`
   - 主图 + 侧栏：`[8,4]`（趋势图 8 + 列表/环形 4）
   - 三等分：`[4,4,4]`（饼图 + 列表 + 小表）
   - 半宽并排：`[6,6]`
4. **表格/列表强制半宽或更窄**（span ≤ 6）且只显 Top N（`pageSize`/`max` 5-8 行），不要让表格独占全宽一行。
5. **全宽卡（span 12）只留给**：唯一的主趋势图、超宽表格、或一条洞察 banner。
6. KPI 用 `span 3`、主趋势图 `span 8`、次图/列表 `span 4`。窄屏会自动塌成单列，无需操心。

## 让图表更专业（可选细节）

素图（只有坐标轴+数据）和财报级图表的差距，全在这些细节上。`BarChart`/`LineChart`/`AreaChart` 都支持，按需开：

| 细节 | prop | 什么时候用 |
|------|------|-----------|
| 数值格式 | `valueFormat`(number/currency/percent/compact) | tooltip 与数据标签的格式；金额图必设 `currency`。轴始终自动用紧凑「万/亿」 |
| 目标/预算/去年同期线 | `refLines: [{ y, label?, tone? }]` | 指标有目标/基准时**必加**，一眼看出达标与否。`tone`: positive/warning/critical/neutral |
| 阈值/正常区间带 | `band: { from, to, label?, tone? }` | 有「合格区间」「警戒区」时背景染色 |
| 数据标签 | `showValues: true` | 柱图每根标值；折线/面积只标**末值**（自动，避免拥挤） |
| 排序 | `sort: "desc"` | 排行榜柱图按值排序 |
| 单根高亮 | `highlight: "max"` | 单系列时只给最高/最低那根上色，其余淡化（一图一信息） |

这些都不写颜色——`tone` 与高亮色都来自主题变量，换肤自动一致。**绝不在 spec 里写 hex 色值。**

> 数字排版（等宽 tabular-nums、金额右对齐、KPI 大数字字栈）已由组件自动处理，spec 不用管。

## 硬规则（务必遵守）

1. **只用 catalog 里的组件**，props 必须符合其 Zod schema。
2. **数据用绑定，不要内联死值**：数字走 `$state`/`$computed`，不要把 `8740000` 直接写进 spec。
3. **样式交给主题**：不要在 spec 里写颜色、字号、内联 style；换风格用顶栏下拉。
4. **图表 `data` 必须是行数组**：直接绑 `/datasets/<id>/rows`，或绑 `groupBy`/`topN`/`sortBy` 的结果。
5. 新增报告**只加文件、不改代码**；改完用下方命令自检。

## 换 / 加主题

- 切换：顶栏「风格」下拉（base / vega / emerald / violet），实时生效，spec 不动。
- 新增预设：去 https://shadcnstudio.com/theme-generator 选风格，把它的 CSS 变量粘进 [`src/globals.css`](src/globals.css) 新增 `[data-theme="<id>"]` 块，再到 [`src/themes/index.ts`](src/themes/index.ts) 的 `THEMES` 登记。

## 命令

```bash
pnpm dev        # 本地预览（改 report.json 即时热更新）
pnpm typecheck  # 类型检查
pnpm test       # 数据层 / 聚合函数单测
pnpm build      # 生产构建
```

改完报告后，至少跑一遍 `pnpm dev` 在浏览器确认渲染正常、数值正确。
