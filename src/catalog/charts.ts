import { z } from "zod";
import type { ComponentDefs } from "./component-def";

/** 图表数据：一组行对象。一般绑 { $state: "/datasets/<id>/rows" } 或 $computed 的 groupBy/topN 结果。 */
const data = z
  .array(z.record(z.string(), z.unknown()))
  .describe("行数据数组，绑 $state 取数据集，或绑 $computed 的 groupBy/topN 结果");

/** 数值系列：key 是行对象里的字段名，label 是图例显示名。 */
const series = z
  .array(
    z.object({
      key: z.string().describe("取值字段名"),
      label: z.string().optional().describe("图例名称"),
    }),
  )
  .min(1)
  .describe("要绘制的数值系列，可多条");

const height = z.number().int().min(120).max(640).default(240).describe("图表绘图区高度(px)");

/** 每张图都是一张卡，自带标题——整页一个 Grid 铺排时不需要额外的区块标题。 */
const titleShape = {
  title: z.string().optional().describe("卡片标题。建议用结论句（「营收同比 +12%，华东领涨」）而非「营收图」"),
  subtitle: z.string().optional().describe("副标题：口径 / 单位 / 时间范围"),
};

const tone = z
  .enum(["neutral", "positive", "warning", "critical"])
  .describe("语义色：positive 达标/好、warning 警戒、critical 超标/差、neutral 中性");

/** 数值格式：决定 tooltip 与数据标签怎么显示（轴始终用紧凑万/亿）。 */
const valueFormat = z
  .enum(["number", "currency", "percent", "compact"])
  .default("number")
  .describe("tooltip / 数据标签数值格式：currency 人民币 / percent 百分比 / compact 紧凑 / number 千分位");

/**
 * 专业细节（可选，按需开）：参考线、阈值带、数据标签。这些是让图「像财报」的关键。
 * 适用于 Bar / Line / Area（ComboChart 只支持 refLines）。
 */
const annotations = {
  valueFormat,
  refLines: z
    .array(
      z.object({
        y: z.number().describe("参考线所在数值（纵轴）"),
        label: z.string().optional().describe("线标签，如「目标」「预算」「去年同期」"),
        tone: tone.default("neutral"),
      }),
    )
    .optional()
    .describe("目标线 / 预算线 / 去年同期线（KPI 类图建议加，一眼看出达标与否）"),
  band: z
    .object({
      from: z.number().describe("区间下界"),
      to: z.number().describe("区间上界"),
      label: z.string().optional(),
      tone: tone.default("positive"),
    })
    .optional()
    .describe("阈值 / 正常区间带（背景染色，如「合格区间」「警戒区」）"),
  showValues: z
    .boolean()
    .default(false)
    .describe("在图上直接标数值（柱：每根；折线/面积：仅末值，避免拥挤）"),
};

/** 图表类组件。全部是叶子节点，通过 data + 字段映射声明式地画图。 */
export const chartComponents = {
  BarChart: {
    description:
      "柱状图。分类对比（各区域营收、各月销量）。可堆叠/横向；做排行榜用 sort 排序 + highlight 高亮最高那根；stack100 看构成占比。支持目标线/阈值带/数据标签。",
    props: z.object({
      ...titleShape,
      data,
      xKey: z.string().describe("X 轴 / 分类字段名"),
      series,
      stacked: z.boolean().default(false).describe("是否堆叠（看绝对量构成）"),
      stack100: z.boolean().default(false).describe("百分比堆叠（看占比随时间/类目变化）"),
      horizontal: z.boolean().default(false).describe("是否横向（条形图，排行榜常用）"),
      sort: z.enum(["asc", "desc"]).optional().describe("按首个系列排序（排行榜）"),
      highlight: z
        .enum(["max", "min"])
        .optional()
        .describe("单系列时高亮最高/最低那根，其余淡化（一图一信息）"),
      diverging: z
        .boolean()
        .default(false)
        .describe("单系列时按正负着色：正绿负红（盈亏 / 同比差异 / 预算偏差图）"),
      ...annotations,
      height,
    }),
    example: {
      title: "各区域营收，华东居首",
      data: [{ region: "华东", revenue: 120 }],
      xKey: "region",
      series: [{ key: "revenue", label: "营收" }],
      sort: "desc",
      highlight: "max",
    },
  },

  LineChart: {
    description: "折线图。时间趋势（月度营收走势）。支持目标线、阈值带、末值直标。",
    props: z.object({
      ...titleShape,
      data,
      xKey: z.string().describe("X 轴字段名，通常是时间"),
      series,
      smooth: z.boolean().default(false).describe("是否平滑曲线"),
      ...annotations,
      height,
    }),
    example: {
      title: "营收趋势",
      data: [{ month: "2026-01", revenue: 100 }],
      xKey: "month",
      series: [{ key: "revenue", label: "营收" }],
      refLines: [{ y: 120, label: "目标", tone: "positive" }],
    },
  },

  AreaChart: {
    description: "面积图（带渐变填充）。趋势 + 体量感，适合营收 / 累计走势。可堆叠。",
    props: z.object({
      ...titleShape,
      data,
      xKey: z.string(),
      series,
      stacked: z.boolean().default(false),
      ...annotations,
      height,
    }),
  },

  PieChart: {
    description: "饼图 / 环图。构成占比（各品类销售占比）。建议分类不超过 6 项。",
    props: z.object({
      ...titleShape,
      data,
      nameKey: z.string().describe("扇区名称字段"),
      valueKey: z.string().describe("扇区数值字段"),
      donut: z.boolean().default(true).describe("是否为环图"),
      valueFormat,
      height,
    }),
    example: {
      title: "区域构成",
      data: [{ category: "硬件", amount: 60 }],
      nameKey: "category",
      valueKey: "amount",
    },
  },

  ComboChart: {
    description:
      "组合图：柱 + 线双系列同图（如柱表营收、线表利润率）。bars 与 lines 各指定字段。",
    props: z.object({
      ...titleShape,
      data,
      xKey: z.string(),
      bars: series.describe("画成柱子的系列"),
      lines: series.describe("画成折线的系列（可用右 Y 轴）"),
      secondAxis: z.boolean().default(true).describe("折线是否用独立的右侧 Y 轴"),
      valueFormat,
      refLines: annotations.refLines,
      height,
    }),
  },

  WaterfallChart: {
    description:
      "瀑布图（利润桥 / 成本桥）：从起点逐项增减累计到终点，增绿减红、合计主色。解释「为什么从 A 变成 B」——营收→各项成本→净利、预算 vs 实际差异分解。每行一项增减值。",
    props: z.object({
      ...titleShape,
      data,
      xKey: z.string().describe("类目字段（项目名）"),
      valueKey: z.string().describe("每项的增减值字段（正=增、负=减）"),
      totalKey: z
        .string()
        .optional()
        .describe("可选：标记该行为合计/小计的布尔字段名（true 则画成从 0 起的总额柱）"),
      valueFormat,
      showValues: z.boolean().default(true).describe("在每根上标增减值"),
      height,
    }),
    example: {
      title: "利润桥：营收到净利",
      data: [
        { item: "营收", value: 1000, total: true },
        { item: "成本", value: -600 },
        { item: "费用", value: -150 },
        { item: "净利", value: 250, total: true },
      ],
      xKey: "item",
      valueKey: "value",
      totalKey: "total",
      valueFormat: "currency",
    },
  },

  BulletChart: {
    description:
      "子弹图：实际 vs 目标对比，替代仪表盘。每行一个指标，自动算达成率（≥目标变绿、未达变主色），目标位置有刻度线。适合「各 KPI / 各区域达成率」。",
    props: z.object({
      ...titleShape,
      data,
      labelKey: z.string().describe("指标名字段"),
      valueKey: z.string().describe("实际值字段"),
      targetKey: z.string().describe("目标值字段"),
      valueFormat,
    }),
    example: {
      title: "区域营收达成",
      data: [{ region: "华东", actual: 120, target: 100 }],
      labelKey: "region",
      valueKey: "actual",
      targetKey: "target",
      valueFormat: "currency",
    },
  },

  FunnelChart: {
    description:
      "漏斗图：严格单向递减的流程，暴露在哪一环流失最狠。销售转化（线索→商机→报价→签约）、招聘漏斗、审批流转化。data 须按阶段顺序排列。",
    props: z.object({
      ...titleShape,
      data,
      nameKey: z.string().describe("阶段名称字段"),
      valueKey: z.string().describe("阶段数值字段"),
      valueFormat,
      height,
    }),
    example: {
      title: "招聘漏斗",
      data: [
        { stage: "投递", count: 800 },
        { stage: "初筛", count: 320 },
        { stage: "面试", count: 90 },
        { stage: "录用", count: 24 },
      ],
      nameKey: "stage",
      valueKey: "count",
    },
  },

  ScatterChart: {
    description:
      "散点 / 气泡图：看两个连续变量的关系与离群点（客户毛利率 vs 营收，气泡=回款额；门店坪效）。给 sizeKey 即变气泡图。",
    props: z.object({
      ...titleShape,
      data,
      xKey: z.string().describe("X 轴数值字段"),
      yKey: z.string().describe("Y 轴数值字段"),
      sizeKey: z.string().optional().describe("气泡大小字段（给了就是气泡图）"),
      nameKey: z.string().optional().describe("点的名称字段（tooltip + 点旁标注）"),
      xLabel: z.string().optional().describe("X 轴名称"),
      yLabel: z.string().optional().describe("Y 轴名称"),
      quadrant: z
        .boolean()
        .default(false)
        .describe("画 x=0 / y=0 象限分割线（增长×盈利矩阵、风险×收益矩阵等四象限分析）"),
      valueFormat,
      height,
    }),
    example: {
      title: "客户分布：营收 vs 毛利率",
      data: [{ name: "A 客户", revenue: 120, margin: 38, amount: 50 }],
      xKey: "revenue",
      yKey: "margin",
      sizeKey: "amount",
      nameKey: "name",
      xLabel: "营收",
      yLabel: "毛利率",
    },
  },

  DumbbellChart: {
    description:
      "哑铃图：两期 / 区间对比（去年 vs 今年、预算 vs 实际、薪酬区间）。每行一个类目，两点 + 连线，连线按方向着色（增绿减红）。比并排柱更省空间、更聚焦「变化量」。",
    props: z.object({
      ...titleShape,
      data,
      labelKey: z.string().describe("类目字段"),
      startKey: z.string().describe("起点值字段（如 去年 / 预算）"),
      endKey: z.string().describe("终点值字段（如 今年 / 实际）"),
      startLabel: z.string().optional().describe("起点图例名，默认「去年」"),
      endLabel: z.string().optional().describe("终点图例名，默认「今年」"),
      valueFormat,
    }),
    example: {
      title: "各分部 今年 vs 去年",
      data: [{ seg: "云", last: 301, now: 416 }],
      labelKey: "seg",
      startKey: "last",
      endKey: "now",
    },
  },

  SlopeChart: {
    description:
      "斜率图：只看两个时点间的方向 / 排名变化（各类目 去年→今年 谁升谁降）。每类目一条斜线，按方向着色。值差距悬殊时下方会拥挤，适合量级相近的对比。",
    props: z.object({
      ...titleShape,
      data,
      labelKey: z.string().describe("类目字段"),
      startKey: z.string().describe("左侧（起点）值字段"),
      endKey: z.string().describe("右侧（终点）值字段"),
      startLabel: z.string().optional().describe("左轴名，默认「去年」"),
      endLabel: z.string().optional().describe("右轴名，默认「今年」"),
      valueFormat,
      height,
    }),
  },

  HeatmapChart: {
    description:
      "热力图（网格）：x 类目 × y 类目 × 强度，用颜色深浅表达数值。如 指标×季度、月×品类、风险矩阵。diverging=true 时正绿负红（适合利润率 / 增速），否则单色由浅到深。data 用长表：每行 {x, y, value}。",
    props: z.object({
      ...titleShape,
      data,
      xKey: z.string().describe("列字段（横向类目，如季度）"),
      yKey: z.string().describe("行字段（纵向类目，如指标）"),
      valueKey: z.string().describe("强度值字段"),
      diverging: z.boolean().default(false).describe("正负发散着色（正绿负红，0 为中性）"),
      valueFormat,
    }),
    example: {
      title: "利润率热力图",
      data: [{ q: "24/06", metric: "经营利润率", v: 14.8 }],
      xKey: "q",
      yKey: "metric",
      valueKey: "v",
      diverging: true,
      valueFormat: "percent",
    },
  },

  RadarChart: {
    description:
      "雷达图：多维 / 多类目对比，每条系列是一张多边形。⚠️ 严肃财报里慎用——多指标单位不一致、径向长度难比较时易误导；较安全的用法是同一组类目的两期对比（如各分部 今年 vs 去年，同单位）。",
    props: z.object({
      ...titleShape,
      data,
      axisKey: z.string().describe("轴 / 维度字段（每行一个轴，如分部名）"),
      series,
      valueFormat,
      height,
    }),
    example: {
      title: "各分部 今年 vs 去年",
      data: [{ seg: "云", now: 416, last: 301 }],
      axisKey: "seg",
      series: [{ key: "now", label: "今年" }, { key: "last", label: "去年" }],
    },
  },
} satisfies ComponentDefs;
