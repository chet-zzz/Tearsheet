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
          }),
        )
        .min(1)
        .describe("列定义"),
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
