import { z } from "zod";
import type { ComponentDefs } from "./component-def";

/** 布局类组件：负责报告的骨架与排版。它们都接收 children（slots: ['default']）。 */
export const layoutComponents = {
  Page: {
    description:
      "报告根容器。每份报告的 root 元素应为 Page，承载标题、副标题、更新时间，内部按纵向堆叠放各个 Section。",
    slots: ["default"],
    props: z.object({
      title: z.string().describe("报告标题"),
      subtitle: z.string().optional().describe("副标题 / 一句话摘要"),
      updatedAt: z.string().optional().describe("数据更新时间，如 2026-06-07"),
    }),
    example: { title: "Q2 财务概览", subtitle: "营收、成本与利润", updatedAt: "2026-06-07" },
  },

  Section: {
    description:
      "轻量分组（只渲染一行小号灰标题 + children）。仅当报告有两个语义无关的大板块时才用；高密度看板优先整页一个 Grid，靠每张卡自己的标题分组，不要用 Section 把页面切成竖向堆叠的块。",
    slots: ["default"],
    props: z.object({
      title: z.string().optional().describe("小号分组标题"),
      description: z.string().optional().describe("分组说明文字"),
    }),
    example: { title: "财务明细" },
  },

  Grid: {
    description:
      "12 列响应式 bento 网格——看板的主力布局。用 spans 指定每个子项占的列宽（与 children 顺序一一对应，每一行 span 加总建议=12）；省略 spans 则等分。窄屏自动单列。典型：4×KPI=[3,3,3,3]；主图+侧栏=[8,4]；三等分=[4,4,4]；半宽表并排=[6,6]。**整页放进一个 Grid 连续铺排，不要按区块竖向堆叠。**",
    slots: ["default"],
    props: z.object({
      spans: z
        .array(z.number().int().min(1).max(12))
        .optional()
        .describe("每个子项占的列数（顺序对应 children，加总建议=12）；省略则等分"),
      cols: z.number().int().min(1).max(12).default(12).describe("总列数，默认 12"),
      gap: z.enum(["sm", "md", "lg"]).default("md").describe("间距"),
    }),
    example: { spans: [8, 4] },
  },

  Row: {
    description: "横向弹性排列容器（flex row），用于不等宽的并排布局。",
    slots: ["default"],
    props: z.object({
      gap: z.enum(["sm", "md", "lg"]).default("md"),
      align: z.enum(["start", "center", "end", "stretch"]).default("stretch"),
    }),
  },

  Col: {
    description: "纵向排列容器，可设置在 Row/Grid 中占据的弹性权重 grow。",
    slots: ["default"],
    props: z.object({
      gap: z.enum(["sm", "md", "lg"]).default("md"),
      grow: z.number().min(0).max(6).default(1).describe("弹性权重，0 表示不伸展"),
    }),
  },

  Divider: {
    description: "分隔线，用于在视觉上切分内容。无 children。",
    props: z.object({
      label: z.string().optional().describe("可选的居中文字"),
    }),
  },
} satisfies ComponentDefs;
