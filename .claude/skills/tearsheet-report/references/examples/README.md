# 报告例子库（agent 参考用）

这里是几份**完整、真实**的报告例子（`meta.json` + `report.json` + `*.csv`），给写报告的 agent 当模板。
它们**不被应用加载**（应用只扫描项目根的 `reports/`），纯参考；要用就**整个文件夹拷到 `reports/<新名>/`** 再改数据/spec。

读法：先看 `report.json` 学**排版（Grid/spans）+ 组件选型 + 数据绑定（$state/$computed）**，对照下表理解"什么场景用哪些组件"。配套方法论见 [`../comparison-report-playbook.md`](../comparison-report-playbook.md) 与 [`../../SKILL.md`](../../SKILL.md)。

## 例子一览：场景 → 用到的组件

| 例子 | 场景 | 重点组件 / 手法 |
|------|------|----------------|
| [`m7-comparison`](../../../../../reports/m7-comparison/) ⭐（在 `reports/` 里，应用默认加载） | **多公司截面对比（决策级 peer comparison）** | `SummaryBar` 概览带；`DataTable` comp 表（`mode:bar/heat` + `columnGroups` 分组表头 + `summaryRow`/`summaryAgg:median` 基准行）把所有单指标排名**合并成一张**；`ScatterChart`（`quadrantMean` 均值象限 + `percentAxes`）；`BulletChart`（vs 目标）；`SlopeChart`（两期趋势）；`ComboChart`（绝对额+强度双轴）；`BarChart` 的 `stack100`/`stacked`；`series.color` 跨图固定同色；`Insight` 投资结论 |
| [`alibaba-fy2026q4`](alibaba-fy2026q4/) | **单公司深度业绩分析**（端到端真实 SEC 数据） | `KpiCard`（含 `trend` sparkline）；`AreaChart`/`LineChart`（`band` 阈值带 + `refLines` 盈亏线）；`BarChart`（`diverging` 盈亏色）；`ComboChart`；`WaterfallChart` 利润桥；`PieChart`；`BulletChart`；`ScatterChart`；`DumbbellChart`/`SlopeChart`/`HeatmapChart`/`RadarChart` 新图型；`Insight` |
| [`finance-q2`](finance-q2/) | **通用季度财务概览** | `KpiCard`；`WaterfallChart`（利润桥）；`BulletChart`（区域达成率）；`ScatterChart`（客户气泡）；`DataTable`（Top N 明细）；`StatList`/`RadialStat` |
| [`hr-overview`](hr-overview/) | **非财务领域（HR / 运营）** | `LineChart` 编制趋势；`StatList` 各部门；`FunnelChart` 招聘漏斗；`Insight` 关注点 |

## 选型要点（从例子里提炼）

- **多主体横向比** → 先用一张 `DataTable` comp 表合并所有单指标排名，再用散点/子弹/斜率/组合图各展所长，**别堆一排相似柱图**（见 `m7-comparison`）。
- **单主体多维深挖** → KPI 概览 + 趋势（带阈值带/参考线）+ 结构拆解（瀑布/堆叠/环图）+ 洞察（见 `alibaba-fy2026q4`）。
- **有目标/基准** → `BulletChart` 或图表 `refLines`；**为什么 A→B** → `WaterfallChart`；**单向漏斗** → `FunnelChart`；**两个连续变量/离群** → `ScatterChart`。
- 一切颜色/字号交给主题，spec 不写死值；数值一律 `$state`/`$computed` 绑定。
