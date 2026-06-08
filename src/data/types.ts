/**
 * 数据源抽象。核心思想：报告只依赖 Dataset 的「形状」（字段 + 行），
 * 不关心数据来自导出的 Excel/CSV 还是内部 API。换数据源、刷新数据都不动报告 spec。
 */

export type FieldType = "string" | "number" | "boolean" | "date";

/** 一列的定义：字段名 + 推断出的类型。 */
export interface DatasetField {
  name: string;
  type: FieldType;
}

/** 统一的数据集结构。组件通过 $state 读 rows、$computed 做聚合。 */
export interface Dataset {
  id: string;
  /** 列定义（字段名 + 推断类型） */
  schema: DatasetField[];
  /** 行数据，每行是 字段名 → 值 的对象 */
  rows: Record<string, unknown>[];
}

/**
 * 数据源统一接口：不管来自 Excel / CSV / 内部 API，load() 都产出同构的 Dataset。
 * 第一版实现：{@link ExcelDataSource}。内部 API 见 ApiDataSource（插槽，待接入）。
 */
export interface DataSource {
  /** 数据源类型标识（用于调试 / 日志） */
  readonly kind: string;
  /** 加载并返回一个 Dataset */
  load(): Promise<Dataset>;
}
