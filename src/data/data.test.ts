import { describe, it, expect } from "vitest";
import { datasetFromCsv } from "./excel-source";
import { computedFunctions } from "./functions";

const csv = `month,revenue,region
2026-01,100,华东
2026-02,200,华北
2026-03,300,华东
`;

describe("ExcelDataSource", () => {
  it("解析 CSV 并推断列类型", async () => {
    const ds = await datasetFromCsv("t", csv);
    expect(ds.rows).toHaveLength(3);
    // 数值列被强制为 number
    expect(ds.rows[0].revenue).toBe(100);
    expect(ds.schema.find((f) => f.name === "revenue")?.type).toBe("number");
    // 文本列保持字符串
    expect(ds.rows[0].region).toBe("华东");
    expect(ds.schema.find((f) => f.name === "region")?.type).toBe("string");
    // 日期格式列识别为 date
    expect(ds.schema.find((f) => f.name === "month")?.type).toBe("date");
  });

  it("容错处理千分位 / 货币符号", async () => {
    const ds = await datasetFromCsv("t", `amount\n"1,200"\n"¥3,400"\n`);
    expect(ds.rows[0].amount).toBe(1200);
    expect(ds.rows[1].amount).toBe(3400);
  });
});

describe("computedFunctions", () => {
  const rows = [
    { revenue: 100, region: "华东" },
    { revenue: 200, region: "华北" },
    { revenue: 300, region: "华东" },
  ];

  it("sum / avg / count / min / max", () => {
    expect(computedFunctions.sum({ rows, field: "revenue" })).toBe(600);
    expect(computedFunctions.avg({ rows, field: "revenue" })).toBe(200);
    expect(computedFunctions.count({ rows })).toBe(3);
    expect(computedFunctions.min({ rows, field: "revenue" })).toBe(100);
    expect(computedFunctions.max({ rows, field: "revenue" })).toBe(300);
  });

  it("groupBy 聚合", () => {
    const g = computedFunctions.groupBy({
      rows,
      by: "region",
      value: "revenue",
    }) as Array<Record<string, unknown>>;
    const east = g.find((r) => r.region === "华东");
    expect(east?.value).toBe(400);
    expect(east?.count).toBe(2);
  });

  it("topN 取前 N 且保留原始列", () => {
    const t = computedFunctions.topN({ rows, field: "revenue", n: 2 }) as Array<
      Record<string, unknown>
    >;
    expect(t).toHaveLength(2);
    expect(t[0].revenue).toBe(300);
    expect(t[0].region).toBe("华东");
  });

  it("format 货币 / 百分比", () => {
    expect(computedFunctions.format({ value: 1234, as: "percent", digits: 0 })).toBe(
      "1234%",
    );
    expect(
      String(computedFunctions.format({ value: 1200000, as: "compact" })),
    ).toContain("万");
  });
});
