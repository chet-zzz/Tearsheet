import { z } from "zod";
import type { ComponentDefs } from "./component-def";

const numberFormat = z
  .enum(["number", "currency", "percent", "compact"])
  .describe("数值格式：currency 人民币 / percent 百分比 / compact 紧凑(1.2万) / number 普通");

/** 指标类组件。value 通常绑 $computed（如 sum/avg）算出的标量。 */
export const metricComponents = {
  KpiCard: {
    description:
      "关键指标卡：一个大数字 + 标签 + 可选同比/环比。value 一般用 $computed 聚合得到（如对某列求和）。delta 为变化百分比，正负自动着色。",
    props: z.object({
      label: z.string().describe("指标名，如「总营收」"),
      value: z
        .union([z.number(), z.string()])
        .describe("指标值，可为 $computed 算出的数字"),
      format: numberFormat.default("number"),
      digits: z
        .number()
        .int()
        .min(0)
        .max(2)
        .optional()
        .describe("小数位数（默认 currency/number 取 0、percent 取 1）；小额指标想显示 -8.5 / 0.9 时设 1"),
      icon: z
        .enum([
          "revenue", "cost", "profit", "customers", "users", "orders",
          "count", "growth", "time", "target", "alert", "building", "chart", "percent",
        ])
        .optional()
        .describe("左上角图标色块（可选，按语义选）"),
      unit: z.string().optional().describe("单位后缀，如「单」「人」"),
      delta: z
        .number()
        .optional()
        .describe("相对上期的变化百分比，如 12.5 表示 +12.5%"),
      deltaLabel: z.string().optional().describe("变化的说明，如「环比」「同比」"),
      trend: z
        .array(z.union([z.number(), z.record(z.string(), z.unknown())]))
        .optional()
        .describe("迷你趋势(sparkline)：绑数据集行集（配 trendKey）或 pluck 出的数值数组，给数字补上「怎么走到这个数」的上下文"),
      trendKey: z
        .string()
        .optional()
        .describe("当 trend 绑的是行集时，画 sparkline 用哪个字段"),
    }),
    example: {
      label: "总营收",
      value: 4520000,
      format: "currency",
      delta: 12.5,
      deltaLabel: "同比",
      trend: [{ month: "2026-01", revenue: 100 }],
      trendKey: "revenue",
    },
  },

  SummaryBar: {
    description:
      "概览指标带：单张紧凑卡里横排多个「标签 + 数值」，竖线分隔。用来替代一排「虚胖」KPI 卡（只有绝对值、无趋势同比时），省大量垂直空间。适合放报告顶部当「总盘子」概览。每项 value 可绑 $computed。",
    props: z.object({
      title: z.string().optional().describe("可选小标题（如「M7 合计盘子」）"),
      items: z
        .array(
          z.object({
            label: z.string().describe("指标名"),
            value: z.union([z.number(), z.string()]).describe("指标值，可绑 $computed"),
            unit: z.string().optional().describe("单位后缀"),
            format: numberFormat.default("number"),
            digits: z.number().int().min(0).max(2).optional().describe("小数位数"),
          }),
        )
        .min(2)
        .describe("指标项数组，横排展示"),
    }),
    example: {
      title: "合计盘子",
      items: [
        { label: "合计营收", value: 2329, unit: "十亿$" },
        { label: "合计净利润", value: 608, unit: "十亿$" },
      ],
    },
  },
} satisfies ComponentDefs;
