import type { z } from "zod";

/**
 * 一个组件在 catalog 里的定义。对应 @json-render/react 预制 schema 的组件条目：
 * - props:       Zod schema，约束该组件能接收的属性（AI 越不出界靠它）
 * - slots:       插槽；['default'] 表示接收 children
 * - description: 给 catalog.prompt() 的高层用途说明（agent 据此选用组件）
 * - example:     prompt 里展示的示例属性（省略则按 Zod 自动生成）
 */
export interface ComponentDef {
  props: z.ZodType;
  slots?: string[];
  description?: string;
  example?: unknown;
}

export type ComponentDefs = Record<string, ComponentDef>;
