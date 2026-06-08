import { defineRegistry, type Components } from "@json-render/react";
import { catalog, type ReportCatalog } from "@/catalog";
import { layoutRenderers } from "./components/layout";
import { textRenderers } from "./components/text";
import { metricRenderers } from "./components/metrics";
import { statRenderers } from "./components/stats";
import { chartRenderers } from "./components/charts";
import { extraChartRenderers } from "./components/charts-extra";
import { extraChartRenderers2 } from "./components/charts-extra2";
import { tableRenderers } from "./components/table";

/**
 * 把 catalog 里每个组件名映射到真实 React 实现。
 * Components<ReportCatalog> 强制：catalog 声明了什么组件，这里就必须实现什么，类型还会自动推断 props。
 */
const components: Components<ReportCatalog> = {
  ...layoutRenderers,
  ...textRenderers,
  ...metricRenderers,
  ...statRenderers,
  ...chartRenderers,
  ...extraChartRenderers,
  ...extraChartRenderers2,
  ...tableRenderers,
};

export const { registry } = defineRegistry(catalog, { components });
