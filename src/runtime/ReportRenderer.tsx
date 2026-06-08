import { JSONUIProvider, Renderer } from "@json-render/react";
import type { Spec } from "@json-render/core";
import { registry } from "@/registry";
import { computedFunctions } from "@/data";

export interface ReportRendererProps {
  spec: Spec;
  /** 初始 state，至少包含 { datasets }，供 $state / $computed 取数。 */
  initialState: Record<string, unknown>;
}

/**
 * 报告运行时。JSONUIProvider 统一提供：
 *  - registry：组件实现
 *  - initialState：数据（datasets）
 *  - functions：$computed 聚合函数
 * Renderer 消费 spec 渲染出 UI。这一层就是「声明式 spec → 真实界面」的装配点。
 */
export function ReportRenderer({ spec, initialState }: ReportRendererProps) {
  return (
    <JSONUIProvider
      registry={registry}
      initialState={initialState}
      functions={computedFunctions}
    >
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}
