import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { layoutComponents } from "./layout";
import { textComponents } from "./text";
import { metricComponents } from "./metrics";
import { statComponents } from "./stats";
import { chartComponents } from "./charts";
import { tableComponents } from "./table";

/**
 * 报告组件目录（单一事实源）。它同时决定了：
 *  1. AI / coding agent 能用哪些组件（白名单约束，越界即校验失败）；
 *  2. catalog.prompt() 自动生成给 agent 的「组件说明书」；
 *  3. 每个组件 props 的 Zod 校验。
 *
 * 新增组件：在对应分组文件里加定义，再到这里 spread 即可——registry 会要求你补上实现。
 */
export const catalog = defineCatalog(schema, {
  components: {
    ...layoutComponents,
    ...textComponents,
    ...metricComponents,
    ...statComponents,
    ...chartComponents,
    ...tableComponents,
  },
  actions: {},
});

export type ReportCatalog = typeof catalog;

/** 生成喂给 coding agent / LLM 的系统提示（组件清单 + 用法约束）。 */
export function getSystemPrompt(): string {
  return catalog.prompt();
}
