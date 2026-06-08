# 决策级「多公司横向财务对比报告」内容手册

> 参考文档（给 coding agent）：要做一份**能支撑投资/战略决策**的多公司对比看板（典型如 Magnificent 7：AAPL/MSFT/GOOGL/AMZN/NVDA/META/TSLA），应该放什么内容、用什么指标、配什么图、需要哪些数据字段。
> 配套：选图机制见 [`SKILL.md`](../SKILL.md) 的「截面对比专项」与仓库 `AGENTS.md`。来源基于 sell-side 培训（WSP/CFI）、ROIC-WACC 方法论、M7 实测区间与可视化最佳实践（链接见末尾）。

## 1. 报告必须回答的核心决策问题

"决策级"的灵魂不是罗列，而是回答这几问——每张图都应服务于其中之一：

1. **谁质量最高？** ROIC 是否长期 > WACC（创造价值），spread 是否稳定/扩大（护城河）。共识：ROIC>15% 卓越、ROIC−WACC spread>5% 才算优质复利。
2. **谁最贵 / 最便宜？** 估值倍数差异是否被增长与 ROIC 解释（贵得有理 vs 离谱）。
3. **谁资本配置最优？** capex / R&D / 回购 / 分红如何切经营现金流这块蛋糕。
4. **AI 投入谁的 ROI 更可信？** capex 强度（capex/营收，hyperscaler 已 >20%）、折旧拐点对 EPS/ROE 的压制、变现节奏。
5. **现金回报"含金量"如何？** FCF yield 比 P/E 更干净（剔除回购/capex 失真）。
6. **风险/集中度在哪？** 收入集中（单一分部/客户）、SBC 稀释、监管、AI 重资产化带来的周期性。

## 2. 指标体系（按族分组 + 为何对决策重要）

| 指标族 | 关键指标 | 为何重要 |
|---|---|---|
| **估值** | P/E (TTM & forward)、EV/EBITDA、EV/Sales、PEG、FCF yield、P/FCF | EV 类倍数做跨资本结构的"苹果对苹果"比较；PEG≈1 才算增长配得上估值；FCF yield 抗操纵 |
| **增长** | 营收/EPS/FCF 的 YoY + 3–5Y CAGR、forward 一致预期增速 | 决定倍数是否合理；forward P/E 依赖盈利预测 |
| **盈利能力与回报** | 毛利率、营业利润率、净利率、ROIC、ROE、ROA、**Rule of 40**(增速+利润率) | ROIC>WACC 才创造价值，是"质量"核心 |
| **现金流质量** | OCF、FCF、FCF 利润率、FCF/净利润转化率、capex 强度 | 揭示利润是否变真金白银；现金流比 EPS 难操纵 |
| **资本配置** | capex、R&D 强度、回购额、分红额、**SBC(股权激励)**、净现金/净债务 | M7 资本结构差异极大；SBC 反映真实稀释 |
| **规模与效率** | 市值、营收体量、**人均营收**、人均利润、员工数 | 经营杠杆与组织效率 |
| **风险与集中度** | 分部/地域/客户集中度、Beta、净杠杆、capex/OCF | AI 重资产化加大盈利周期性与折旧敏感度 |

## 3. 章节 / Exhibit 结构（决策级骨架）

1. **Exec Summary + 投资结论**：一句话排名 + 关键判断（谁买/谁贵/谁配置最优）。
2. **估值 Comps 表**：标准 sell-side 做法——带 min / 25th / median / mean / 75th / max 统计基准行。
3. **增长 × 盈利象限**：营收增速(x) vs 利润率或 Rule of 40(y)，气泡=市值。
4. **利润率结构**：毛利→营业→净利的逐层桥 / 成本去向 100% 堆叠。
5. **资本配置**：capex / R&D / 回购 / 分红 / SBC 如何分配经营现金流。
6. **现金流与资产负债**：FCF 转化率、净现金、capex/OCF。
7. **分部构成**：各公司收入来源拆解（AWS、Services、广告等）。
8. **综合打分 / 排名 scorecard**：把多维压成一张热力评分表。
9. **风险**：集中度、监管、AI 折旧拐点。
10. **"So What" 建议**：明确 actionable 结论（写进 `Insight` 卡）。

## 4. 内容 → 图型映射（在本平台用哪个组件）

| 内容 | 推荐组件 |
|---|---|
| 估值/经营 comps + 统计基准 | `DataTable`（`mode:bar`+`heat`、`summaryRow` 出 median/mean、`columnGroups` 分组） |
| 增长 vs 盈利定位 | `ScatterChart`（`sizeKey`=市值、`quadrantMean` 均值象限） |
| 是否达标（ROIC>WACC、Rule of 40>40、PEG<1）| `BulletChart`（实际 vs 目标线） |
| 两期对比（毛利率/capex 强度 今 vs 去年）| `DumbbellChart` |
| 收入分部构成 | `BarChart` `stack100`（开 `showValues` 标段内%） |
| 单指标横向排名（FCF yield、人均营收）| `BarChart`（`sort`+`highlight`）或 `DataTable` `bar` 列 |
| 多维综合打分 | `DataTable` 多 `heat` 列（评分热力 scorecard）或 `HeatmapChart` |
| 同一指标 7 家趋势 | small multiples（多张同尺度小 `LineChart`） |
| 顶部总量概览 | `SummaryBar`（别用 KPI 卡墙） |

**怎么压成一张可决策 scorecard**：对每个指标族（估值/增长/质量/现金流/配置/风险）按 percentile 打 1–5 分 → 加权求总分 → 用 `DataTable` 的 `heat` 列 + 综合排名列呈现。读者一眼看出"高质量但贵 / 便宜但增长弱"的权衡。

## 5. 数据字段清单（标注来源）

**可从 SEC 10-K（Item 8 财报 + 附注 + MD&A）拿**：
- 营收、毛利、营业利润、净利润、EPS（利润表）
- 经营现金流、capex、回购额、分红额（现金流量表）
- 现金及等价物、总债务（→净现金）、总资产/权益（→ROIC/ROE）
- **R&D 费用、SBC、分部收入、员工数**（附注 / MD&A / Item 1）

**需市场数据源（Koyfin / Bloomberg / stockanalysis / macrotrends 等，且随行情变动，须标 as-of 日期）**：
- 股价、市值、企业价值(EV)
- **P/E(TTM & forward)、EV/EBITDA、EV/Sales、PEG、FCF yield**
- forward 营收/EPS 一致预期、Beta、WACC、3–5Y CAGR

**可派生字段**：毛利率=(营收−营业成本)/营收、ROIC、ROIC−WACC spread、Rule of 40、FCF 利润率、FCF 转化率、人均营收、capex/营收、capex/OCF、R&D 强度、SBC/营收、SBC/FCF（稀释）。

## 6. 关键来源

- [Wall Street Prep — Comparable Company Analysis](https://www.wallstreetprep.com/knowledge/comparable-company-analysis-comps/)（comp 表结构 / 统计基准）
- [CFI — Comparable Company Analysis](https://corporatefinanceinstitute.com/resources/valuation/comparable-company-analysis/)
- [dividend.school — ROIC vs WACC](https://www.dividend.school/p/roic-vs-wacc-how-value-creation-really) ／ [FMP — WACC vs ROIC](https://site.financialmodelingprep.com/education/other/wacc-vs-roic-evaluating-capital-efficiency-and-value-creation)
- [heygotrade — M7 ranked by FCF yield](https://www.heygotrade.com/en/blog/mega-cap-tech-stocks-ranked-fcf-yield/)
- [RBC — Big Tech AI: investment to scalable returns](https://www.rbcwealthmanagement.com/en-us/insights/big-techs-ai-expansion-from-investment-to-scalable-returns) ／ [Allianz — AI capex cycle](https://www.allianz-trade.com/en_global/news-insights/economic-insights/AI-capex-cycle-war-proof-now.html) ／ [Visual Capitalist — Big Tech AI spending](https://www.visualcapitalist.com/visualized-big-tech-ai-spending/)
- [piranhaprofits — PEG vs P/E vs EV/EBITDA vs FCF yield](https://www.piranhaprofits.com/blog/peg-ratio-explained) ／ [CFA Institute — Market-based valuation multiples](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/market-based-valuation-price-enterprise-value-multiples)
- [StockTitan — How to read a 10-K](https://www.stocktitan.net/articles/10-k-annual-report-guide)
- 可视化：[luzmo — bullet charts](https://www.luzmo.com/blog/bullet-chart) ／ [ResearchGate — value scorecard heat map](https://www.researchgate.net/figure/Example-of-a-Value-Scorecard-with-Heat-Map_fig6_268820833) ／ [FasterCapital — data viz in equity research](https://www.fastercapital.com/content/Data-Visualization--Data-Visualization--Bringing-Clarity-to-Equity-Research-Reports.html)
