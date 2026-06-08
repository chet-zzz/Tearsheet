import type { Spec } from "@json-render/core";

/**
 * 报告自动发现。每份报告是顶层 reports/<id>/ 下的一个文件夹：
 *   report.json  —— 报告的声明式 spec（agent 主要在这里干活）
 *   meta.json    —— { title, description?, datasets: { <datasetId>: "<file.csv>" } }
 *   *.csv        —— 数据文件
 *
 * 用 import.meta.glob 在构建时扫描顶层 reports/，所以「新增一份报告 = 加一个文件夹」，
 * 无需改任何代码。glob 路径相对本文件（src/reports/），故用 ../../reports/ 指向项目根的 reports/。
 */
export interface ReportMeta {
  title: string;
  description?: string;
  /** 数据集 id → CSV 文件名（相对报告目录）。spec 里通过 /datasets/<id>/rows 引用。 */
  datasets: Record<string, string>;
}

export interface ReportSource {
  id: string;
  meta: ReportMeta;
  spec: Spec;
  /** CSV 文件名 → 原始文本 */
  csv: Record<string, string>;
}

const metas = import.meta.glob("../../reports/*/meta.json", {
  eager: true,
  import: "default",
}) as Record<string, ReportMeta>;

const specs = import.meta.glob("../../reports/*/report.json", {
  eager: true,
  import: "default",
}) as Record<string, Spec>;

const csvs = import.meta.glob("../../reports/*/*.csv", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

/** ".../reports/finance-q2/meta.json" → "finance-q2" */
function idFromPath(path: string): string {
  const m = path.match(/\/reports\/([^/]+)\//);
  return m ? m[1] : path;
}

const specsById: Record<string, Spec> = {};
for (const [path, spec] of Object.entries(specs)) {
  specsById[idFromPath(path)] = spec;
}

const csvById: Record<string, Record<string, string>> = {};
for (const [path, text] of Object.entries(csvs)) {
  const id = idFromPath(path);
  (csvById[id] ??= {})[path.split("/").pop()!] = text;
}

export const reports: Record<string, ReportSource> = {};
for (const [path, meta] of Object.entries(metas)) {
  const id = idFromPath(path);
  const spec = specsById[id];
  if (!spec) {
    console.warn(`报告 ${id} 缺少 report.json，已跳过`);
    continue;
  }
  reports[id] = { id, meta, spec, csv: csvById[id] ?? {} };
}

/** 给报告选择器用的轻量列表。 */
export const reportList = Object.values(reports)
  .map((r) => ({ id: r.id, title: r.meta.title, description: r.meta.description }))
  .sort((a, b) => a.id.localeCompare(b.id));
