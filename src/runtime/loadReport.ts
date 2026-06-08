import type { Spec } from "@json-render/core";
import { datasetFromCsv, type Dataset } from "@/data";
import { reports } from "@/reports";

export interface LoadedReport {
  id: string;
  title: string;
  description?: string;
  spec: Spec;
  /** 注入 json-render 的初始 state：组件通过 $state "/datasets/<id>/rows" 取数。 */
  initialState: { datasets: Record<string, Dataset> };
}

/**
 * 加载一份报告：解析它声明的所有数据集（CSV → Dataset），组装成 initialState。
 * 换数据源时只需改 meta.datasets 指向（未来可指向 ApiDataSource），spec 完全不动。
 */
export async function loadReport(id: string): Promise<LoadedReport> {
  const src = reports[id];
  if (!src) throw new Error(`找不到报告：${id}`);

  const datasets: Record<string, Dataset> = {};
  for (const [datasetId, file] of Object.entries(src.meta.datasets)) {
    const text = src.csv[file];
    if (text == null) {
      throw new Error(`报告「${id}」引用了不存在的数据文件：${file}`);
    }
    datasets[datasetId] = await datasetFromCsv(datasetId, text);
  }

  return {
    id,
    title: src.meta.title,
    description: src.meta.description,
    spec: src.spec,
    initialState: { datasets },
  };
}
