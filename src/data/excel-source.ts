import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Dataset, DatasetField, DataSource, FieldType } from "./types";

export interface ExcelSourceInput {
  /** 数据集 id（报告 spec 里通过 /datasets/<id>/rows 引用） */
  id: string;
  /** CSV / TSV 文本（与 arrayBuffer 二选一） */
  csv?: string;
  /** xlsx 二进制（与 csv 二选一） */
  arrayBuffer?: ArrayBuffer;
  /** 指定工作表名；xlsx 时省略则取第一个 sheet */
  sheet?: string;
}

/**
 * Excel / CSV 数据源。把导出的表格文件解析成统一 Dataset，并自动推断列类型。
 *
 * @example
 * const ds = await new ExcelDataSource({ id: "sales", csv: rawCsvText }).load();
 * // ds.rows -> [{ month: "2026-01", revenue: 120000, region: "华东" }, ...]
 */
export class ExcelDataSource implements DataSource {
  readonly kind = "excel";

  constructor(private readonly input: ExcelSourceInput) {}

  async load(): Promise<Dataset> {
    const raw =
      this.input.csv != null
        ? parseCsv(this.input.csv)
        : parseXlsx(this.requireBuffer(), this.input.sheet);

    const schema = inferSchema(raw);
    const rows = raw.map((r) => coerceRow(r, schema));
    return { id: this.input.id, schema, rows };
  }

  private requireBuffer(): ArrayBuffer {
    if (!this.input.arrayBuffer) {
      throw new Error(
        `ExcelDataSource(${this.input.id}): 需要提供 csv 文本或 arrayBuffer 之一`,
      );
    }
    return this.input.arrayBuffer;
  }
}

/** 便捷工厂：从 CSV 文本建 Dataset。 */
export function datasetFromCsv(id: string, csv: string): Promise<Dataset> {
  return new ExcelDataSource({ id, csv }).load();
}

/** 便捷工厂：从 xlsx 二进制建 Dataset（如用户上传 / fetch 的文件）。 */
export function datasetFromArrayBuffer(
  id: string,
  arrayBuffer: ArrayBuffer,
  sheet?: string,
): Promise<Dataset> {
  return new ExcelDataSource({ id, arrayBuffer, sheet }).load();
}

// ---- 内部解析 ----

type RawRow = Record<string, unknown>;

function parseCsv(text: string): RawRow[] {
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false, // 统一交给我们自己的类型推断，保证 csv / xlsx 行为一致
    transformHeader: (h) => h.trim(),
  });
  return result.data.filter((r) => r && Object.keys(r).length > 0);
}

function parseXlsx(buf: ArrayBuffer, sheetName?: string): RawRow[] {
  const wb = XLSX.read(buf, { type: "array" });
  const name = sheetName ?? wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`xlsx 中找不到工作表「${name}」`);
  return XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null, raw: true });
}

/** 扫描每列的样本值，推断类型。 */
function inferSchema(rows: RawRow[]): DatasetField[] {
  const names = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) names.add(k);

  return [...names].map((name) => {
    const samples = rows
      .map((r) => r[name])
      .filter((v) => v !== null && v !== undefined && v !== "");
    return { name, type: inferFieldType(samples) };
  });
}

function inferFieldType(samples: unknown[]): FieldType {
  if (samples.length === 0) return "string";
  if (samples.every(isBooleanLike)) return "boolean";
  if (samples.every(isNumberLike)) return "number";
  if (samples.every(isDateLike)) return "date";
  return "string";
}

function coerceRow(row: RawRow, schema: DatasetField[]): RawRow {
  const out: RawRow = {};
  for (const field of schema) {
    out[field.name] = coerceValue(row[field.name], field.type);
  }
  return out;
}

function coerceValue(value: unknown, type: FieldType): unknown {
  if (value === null || value === undefined || value === "") return null;
  switch (type) {
    case "number":
      return toNumber(value);
    case "boolean":
      return toBoolean(value);
    case "date":
    case "string":
    default:
      return typeof value === "string" ? value : String(value);
  }
}

// ---- 类型判定 / 转换 ----

function isNumberLike(v: unknown): boolean {
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v !== "string") return false;
  const cleaned = v.replace(/[,\s%¥$￥]/g, "");
  return cleaned !== "" && Number.isFinite(Number(cleaned));
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  const cleaned = String(v).replace(/[,\s%¥$￥]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function isBooleanLike(v: unknown): boolean {
  if (typeof v === "boolean") return true;
  if (typeof v !== "string") return false;
  return ["true", "false", "是", "否", "yes", "no"].includes(v.trim().toLowerCase());
}

function toBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  return ["true", "是", "yes", "1"].includes(String(v).trim().toLowerCase());
}

function isDateLike(v: unknown): boolean {
  if (typeof v !== "string") return false;
  // 仅接受明确的日期格式，避免把 "2026" 这类纯数字误判为日期
  return /^\d{4}[-/]\d{1,2}([-/]\d{1,2})?/.test(v.trim());
}
