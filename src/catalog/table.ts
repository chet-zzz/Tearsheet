import { z } from "zod";
import type { ComponentDefs } from "./component-def";

/** 表格类组件。 */
export const tableComponents = {
  DataTable: {
    description:
      "数据明细表。data 绑行数据，columns 声明要展示哪些列、表头名、对齐和格式。适合 Top N 明细、逐项清单。",
    props: z.object({
      data: z
        .array(z.record(z.string(), z.unknown()))
        .describe("行数据数组，绑 $state 或 $computed 结果"),
      columns: z
        .array(
          z.object({
            key: z.string().describe("字段名"),
            label: z.string().optional().describe("表头显示名（省略用字段名）"),
            align: z.enum(["left", "right", "center"]).default("left"),
            format: z
              .enum(["text", "number", "currency", "percent", "compact"])
              .default("text")
              .describe("单元格格式化方式"),
            digits: z.number().int().min(0).max(4).optional().describe("小数位数（如比率列设 2）"),
            mode: z
              .enum(["plain", "bar", "heat"])
              .default("plain")
              .describe(
                "单元格视觉：plain 纯文字；bar 数值 + 内联条形（编码量级，省一张排行图）；heat 数值 + 色阶背景（越强越深，快速定位）。做高信息密度的 comp 对比表时按列分别设。",
              ),
            heatColor: z
              .string()
              .optional()
              .describe(
                "heat 列的色阶基色（CSS 变量名，默认 chart-1）。给语义不同的列换色避免满屏同色，如「资本开支率」设 chart-3。",
              ),
          }),
        )
        .min(1)
        .describe("列定义"),
      columnGroups: z
        .array(z.object({ label: z.string().optional(), span: z.number().int().min(1) }))
        .optional()
        .describe("二级分组表头（span 之和需 = 列数）：把列按语义分组，如「盈利与变现」跨 2 列，结构更清晰。"),
      summaryRow: z
        .boolean()
        .default(false)
        .describe("在表底追加一行各数值列的均值，作为横向对比的 benchmark（comp 表强烈建议开）。"),
      summaryLabel: z.string().default("均值").describe("汇总行在首列显示的名称"),
      caption: z.string().optional().describe("表格标题 / 说明"),
      pageSize: z
        .number()
        .int()
        .min(0)
        .max(100)
        .default(10)
        .describe("每页行数，0 表示不分页全部显示"),
    }),
    example: {
      data: [{ name: "客户A", amount: 99000 }],
      columns: [
        { key: "name", label: "客户" },
        { key: "amount", label: "金额", align: "right", format: "currency" },
      ],
    },
  },
} satisfies ComponentDefs;
