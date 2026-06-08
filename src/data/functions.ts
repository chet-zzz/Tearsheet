import type { ComputedFunction } from "@json-render/core";

/**
 * $computed 聚合函数库。报告 spec 里通过 { "$computed": "<name>", "args": { ... } } 调用，
 * args 会被 json-render 先解析（可嵌套 $state）再传入。这样「数据怎么算」留在 spec 层声明式表达，
 * 不会散落进组件实现——这是和老板反复对齐时改一处就生效的关键。
 *
 * 约定：作用于行集的函数都接收 args.rows（一般绑 { $state: "/datasets/<id>/rows" }）。
 *
 * @example KPI 求和
 *   { "$computed": "sum", "args": { "rows": { "$state": "/datasets/sales/rows" }, "field": "revenue" } }
 * @example 按区域分组求和（喂给柱状图）
 *   { "$computed": "groupBy", "args": { "rows": {...}, "by": "region", "value": "revenue" } }
 * @example Top 5 客户（喂给表格 / 条形图）
 *   { "$computed": "topN", "args": { "rows": {...}, "field": "amount", "n": 5 } }
 */

type Row = Record<string, unknown>;

function asRows(v: unknown): Row[] {
  return Array.isArray(v) ? (v as Row[]) : [];
}

function num(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[,\s%¥$￥]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function values(rows: Row[], field: string): number[] {
  return rows.map((r) => num(r[field]));
}

const sum: ComputedFunction = (a) =>
  values(asRows(a.rows), String(a.field)).reduce((s, n) => s + n, 0);

const avg: ComputedFunction = (a) => {
  const vs = values(asRows(a.rows), String(a.field));
  return vs.length ? vs.reduce((s, n) => s + n, 0) / vs.length : 0;
};

const count: ComputedFunction = (a) => asRows(a.rows).length;

const min: ComputedFunction = (a) => {
  const vs = values(asRows(a.rows), String(a.field));
  return vs.length ? Math.min(...vs) : 0;
};

const max: ComputedFunction = (a) => {
  const vs = values(asRows(a.rows), String(a.field));
  return vs.length ? Math.max(...vs) : 0;
};

/** 去重计数：distinctCount(rows, field) */
const distinctCount: ComputedFunction = (a) =>
  new Set(asRows(a.rows).map((r) => r[String(a.field)])).size;

/** 取某列所有值：pluck(rows, field) -> unknown[] */
const pluck: ComputedFunction = (a) =>
  asRows(a.rows).map((r) => r[String(a.field)]);

/**
 * 分组聚合：groupBy(rows, by, value?, agg?) -> [{ [by]: 组值, value: 聚合, count }]
 * agg ∈ sum|avg|count|min|max（默认 sum）。输出可直接喂给图表（xKey = by，series 取 value）。
 */
const groupBy: ComputedFunction = (a) => {
  const rows = asRows(a.rows);
  const by = String(a.by);
  const valueField = a.value != null ? String(a.value) : null;
  const agg = (a.agg != null ? String(a.agg) : "sum") as
    | "sum"
    | "avg"
    | "count"
    | "min"
    | "max";

  const buckets = new Map<unknown, number[]>();
  for (const r of rows) {
    const key = r[by];
    const arr = buckets.get(key) ?? [];
    arr.push(valueField ? num(r[valueField]) : 1);
    buckets.set(key, arr);
  }

  return [...buckets.entries()].map(([key, nums]) => ({
    [by]: key,
    value: aggregate(nums, agg),
    count: nums.length,
  }));
};

function aggregate(nums: number[], agg: string): number {
  if (nums.length === 0) return 0;
  switch (agg) {
    case "avg":
      return nums.reduce((s, n) => s + n, 0) / nums.length;
    case "count":
      return nums.length;
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    case "sum":
    default:
      return nums.reduce((s, n) => s + n, 0);
  }
}

/** 排序：sortBy(rows, field, dir?) -> 新数组，dir ∈ asc|desc（默认 desc） */
const sortBy: ComputedFunction = (a) => {
  const rows = [...asRows(a.rows)];
  const field = String(a.field);
  const dir = a.dir === "asc" ? 1 : -1;
  return rows.sort((x, y) => (num(x[field]) - num(y[field])) * dir);
};

/** Top N：topN(rows, field, n?, dir?) -> 排序后取前 n 行（保留原始列） */
const topN: ComputedFunction = (a) => {
  const sorted = sortBy(a) as Row[];
  const n = a.n != null ? Number(a.n) : 10;
  return sorted.slice(0, n);
};

/**
 * 简单过滤：filter(rows, field, op, value)
 * op ∈ eq|ne|gt|gte|lt|lte|contains
 */
const filter: ComputedFunction = (a) => {
  const rows = asRows(a.rows);
  const field = String(a.field);
  const op = String(a.op);
  const target = a.value;
  return rows.filter((r) => {
    const v = r[field];
    switch (op) {
      case "eq":
        return v === target;
      case "ne":
        return v !== target;
      case "gt":
        return num(v) > num(target);
      case "gte":
        return num(v) >= num(target);
      case "lt":
        return num(v) < num(target);
      case "lte":
        return num(v) <= num(target);
      case "contains":
        return String(v).includes(String(target));
      default:
        return true;
    }
  });
};

/** 占比：percentOf(part, whole) -> 数字（如 41.7 表示 41.7%）。用于毛利率、达成率、环形图。 */
const percentOf: ComputedFunction = (a) => {
  const part = num(a.part);
  const whole = num(a.whole);
  if (whole === 0) return 0;
  return (part / whole) * 100;
};

/** 同比 / 环比百分比：delta(current, previous) -> 数字（如 12.5 表示 +12.5%） */
const delta: ComputedFunction = (a) => {
  const cur = num(a.current);
  const prev = num(a.previous);
  if (prev === 0) return 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
};

/**
 * 格式化标量：format(value, as?, digits?)
 * as ∈ currency|percent|compact|number（默认 number）
 */
const format: ComputedFunction = (a) => {
  const v = num(a.value);
  const as = a.as != null ? String(a.as) : "number";
  const digits = a.digits != null ? Number(a.digits) : undefined;
  return formatNumber(v, as, digits);
};

export function formatNumber(
  v: number,
  as: string,
  digits?: number,
): string {
  switch (as) {
    case "currency":
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
        maximumFractionDigits: digits ?? 0,
      }).format(v);
    case "percent":
      return `${v.toFixed(digits ?? 1)}%`;
    case "compact":
      return new Intl.NumberFormat("zh-CN", {
        notation: "compact",
        maximumFractionDigits: digits ?? 1,
      }).format(v);
    case "number":
    default:
      return new Intl.NumberFormat("zh-CN", {
        maximumFractionDigits: digits ?? 0,
      }).format(v);
  }
}

/** 传给 JSONUIProvider 的 functions，供 spec 里的 $computed 调用。 */
export const computedFunctions: Record<string, ComputedFunction> = {
  sum,
  avg,
  count,
  min,
  max,
  distinctCount,
  pluck,
  groupBy,
  sortBy,
  topN,
  filter,
  percentOf,
  delta,
  format,
};
