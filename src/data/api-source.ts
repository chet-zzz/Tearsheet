import type { Dataset, DataSource } from "./types";

export interface ApiSourceOptions {
  id: string;
  /** 内部数据 API 端点 */
  endpoint: string;
  /** 查询参数 */
  query?: Record<string, string | number>;
  /**
   * 把 API 原始响应映射为行集。不同内部系统返回结构不同，由调用方提供。
   * 返回的每个对象就是一行；字段类型会在下游自动推断。
   */
  mapRows?: (raw: unknown) => Record<string, unknown>[];
}

/**
 * 内部 API 数据源（插槽，第一版未实现）。
 *
 * 接入步骤（待内部 API / SSO 文档明确后实现）：
 *  1. 用内部登录态（SSO token / cookie）发起对 endpoint 的请求；
 *  2. 把响应交给 mapRows 转成行集；
 *  3. 复用 ExcelDataSource 同款的类型推断（可抽公共函数），产出 Dataset。
 *
 * 这样报告 spec 完全不用改——只是把某个 dataset 的来源从 CSV 换成 API。
 */
export class ApiDataSource implements DataSource {
  readonly kind = "api";

  constructor(private readonly options: ApiSourceOptions) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async load(): Promise<Dataset> {
    throw new Error(
      `ApiDataSource(${this.options.id}) 尚未接入内部数据 API / SSO。` +
        `请在 src/data/api-source.ts 中实现：携带内部登录态请求 ${this.options.endpoint}，` +
        `用 mapRows 映射为行集后产出 Dataset。第一版请改用 Excel/CSV。`,
    );
  }
}
