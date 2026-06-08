import { z } from "zod";
import type { ComponentDefs } from "./component-def";

const tone = z
  .enum(["info", "positive", "warning", "critical", "neutral"])
  .describe("语气色：positive 绿 / warning 橙 / critical 红 / info 蓝 / neutral 灰");

/** 文本与说明类组件：标题、正文、洞察块、标签。都是叶子节点（无 children）。 */
export const textComponents = {
  Heading: {
    description: "标题文字。level 控制层级（1 最大）。用于 Section 内的小标题或强调。",
    props: z.object({
      text: z.string().describe("标题文字，支持 $template 插值"),
      level: z.number().int().min(1).max(4).default(2).describe("层级 1-4"),
    }),
    example: { text: "营收同比 +12%", level: 3 },
  },

  Text: {
    description: "普通段落文字。可用 $template 引用状态做动态文案。muted 为弱化的次要文字。",
    props: z.object({
      content: z.string().describe("正文，支持 $template 插值"),
      muted: z.boolean().default(false).describe("是否弱化为次要灰字"),
    }),
    example: { content: "数据来源：财务系统导出" },
  },

  Insight: {
    description:
      "洞察 / 结论卡片，用来突出一条关键判断（如「华东区贡献 45% 营收」）。带语气色和左侧强调条。",
    props: z.object({
      title: z.string().optional().describe("洞察标题"),
      content: z.string().describe("洞察正文，支持 $template"),
      tone: tone.default("info"),
    }),
    example: { title: "关键发现", content: "华东区贡献了 45% 的营收", tone: "positive" },
  },

  Badge: {
    description: "小标签，用于状态 / 分类标注。",
    props: z.object({
      label: z.string(),
      tone: tone.default("neutral"),
    }),
    example: { label: "已审核", tone: "positive" },
  },
} satisfies ComponentDefs;
