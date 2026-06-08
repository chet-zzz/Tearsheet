import { z } from "zod";
import type { ComponentDefs } from "./component-def";

const iconEnum = z.enum([
  "revenue", "cost", "profit", "customers", "users", "orders",
  "count", "growth", "time", "target", "alert", "building", "chart", "percent",
]);

const numberFormat = z.enum(["number", "currency", "percent", "compact"]);

/** 富展示组件：列表卡 + 环形进度，对齐 shadcn dashboard 的高密度面板。 */
export const statComponents = {
  StatList: {
    description:
      "图标列表卡：每行 [图标+标签(+子标签)] … [数值(+涨跌)]。适合「各区域营收」「各渠道表现」「指标清单」这类构成型数据。data 绑行集，用 labelKey/valueKey 指定读哪列。",
    props: z.object({
      title: z.string().optional().describe("卡片标题"),
      data: z
        .array(z.record(z.string(), z.unknown()))
        .describe("行数据，绑 $state 或 $computed（如 groupBy / topN 结果）"),
      labelKey: z.string().describe("作为每行标签的字段"),
      valueKey: z.string().describe("作为每行数值的字段"),
      sublabelKey: z.string().optional().describe("子标签字段（小灰字，如数量）"),
      deltaKey: z.string().optional().describe("涨跌百分比字段（正负自动着色）"),
      valueFormat: numberFormat.default("number"),
      icon: iconEnum.optional().describe("每行左侧统一的图标色块"),
      max: z.number().int().min(1).max(50).default(8).describe("最多显示行数"),
    }),
    example: {
      title: "各区域营收",
      data: [{ region: "华东", revenue: 350 }],
      labelKey: "region",
      valueKey: "revenue",
      valueFormat: "currency",
      icon: "building",
    },
  },

  RadialStat: {
    description:
      "环形进度卡：把一个数值显示为环形百分比 + 中心大数字。适合达成率、占比、健康度。value 绑 $computed，进度 = value / max。",
    props: z.object({
      label: z.string().optional().describe("标题"),
      value: z
        .union([z.number(), z.string()])
        .describe("数值，可绑 $computed"),
      max: z.number().default(100).describe("满值（value/max=进度），默认 100"),
      format: numberFormat.default("percent").describe("中心数字格式"),
      caption: z.string().optional().describe("底部说明文字"),
    }),
    example: { label: "目标达成率", value: 87, max: 100, format: "percent" },
  },
} satisfies ComponentDefs;
