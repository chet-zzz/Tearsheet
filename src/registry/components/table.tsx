import type { Components } from "@json-render/react";
import type { ReportCatalog } from "@/catalog";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/data/functions";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

function formatCell(value: unknown, format: string, digits?: number): string {
  if (value === null || value === undefined || value === "") return "—";
  if (format === "text") return String(value);
  return formatNumber(Number(value), format, digits);
}

type ColStat = { min: number; max: number };

export const tableRenderers: Pick<Components<ReportCatalog>, "DataTable"> = {
  DataTable: ({ props }) => {
    // 绑定未解析（首帧 state 尚未注入）时 props.data 可能为 undefined——必须兜底，
    // 否则会触发 json-render 的 ElementErrorBoundary 并被永久锁定为空白。
    const data = Array.isArray(props.data) ? props.data : [];
    const columns = props.columns ?? [];
    const total = data.length;
    const pageSize = props.pageSize ?? 10;
    const limit = pageSize === 0 ? total : pageSize;
    const rows = data.slice(0, limit);

    // 为 bar / heat 列预计算量级范围（comp 对比表的内联可视化按列归一）
    const stats: Record<string, ColStat> = {};
    for (const col of columns) {
      if (col.mode === "bar" || col.mode === "heat") {
        const vals = rows.map((r) => Number(r[col.key])).filter(Number.isFinite);
        if (vals.length) stats[col.key] = { min: Math.min(...vals, 0), max: Math.max(...vals) };
      }
    }

    // 汇总行：各数值列求均值，作为横向对比基准
    const isNumericCol = (c: (typeof columns)[number]) =>
      (c.format ?? "text") !== "text" || c.mode === "bar" || c.mode === "heat";
    const means: Record<string, number> = {};
    if (props.summaryRow) {
      const agg = props.summaryAgg ?? "mean";
      for (const col of columns) {
        if (!isNumericCol(col)) continue;
        const vals = rows.map((r) => Number(r[col.key])).filter(Number.isFinite);
        if (!vals.length) continue;
        if (agg === "median") {
          const s = [...vals].sort((a, b) => a - b);
          const m = Math.floor(s.length / 2);
          means[col.key] = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
        } else {
          means[col.key] = vals.reduce((a, b) => a + b, 0) / vals.length;
        }
      }
    }
    const groups = props.columnGroups;

    return (
      <Card className="h-full gap-0 overflow-hidden py-0">
        {props.caption && (
          <div className="border-b px-4 py-3 text-sm font-medium">{props.caption}</div>
        )}
        <Table>
          <TableHeader>
            {groups && groups.length > 0 && (
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {groups.map((g, gi) => (
                  <TableHead
                    key={gi}
                    colSpan={g.span}
                    className={cn(
                      "px-4 text-center text-xs font-medium text-muted-foreground",
                      gi > 0 && "border-l",
                    )}
                  >
                    {g.label ?? ""}
                  </TableHead>
                ))}
              </TableRow>
            )}
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "px-4 text-muted-foreground",
                    alignClass[col.align ?? (col.mode && col.mode !== "plain" ? "right" : "left")],
                  )}
                >
                  {col.label ?? col.key}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri}>
                {columns.map((col) => {
                  const fmt = col.format ?? "text";
                  const mode = col.mode ?? "plain";
                  const align = col.align ?? (mode !== "plain" ? "right" : "left");
                  const raw = row[col.key];
                  const text = formatCell(raw, fmt, col.digits);
                  const n = Number(raw);
                  const st = stats[col.key];
                  const hasNum = st && Number.isFinite(n);

                  // 内联条形：量级编码成左起的浅色条，数值压在条上
                  if (mode === "bar" && hasNum) {
                    const pct = st.max > 0 ? Math.max(0, (n / st.max) * 100) : 0;
                    return (
                      <TableCell key={col.key} className="relative px-4 py-2.5">
                        <span
                          className="absolute inset-y-1 left-2 rounded-sm bg-chart-1/25"
                          style={{ width: `calc(${pct}% - 0.5rem)` }}
                          aria-hidden
                        />
                        <span className={cn("font-num relative block", alignClass[align])}>{text}</span>
                      </TableCell>
                    );
                  }

                  // 色阶背景：强弱用主色透明度编码（文字保持可读）
                  if (mode === "heat" && hasNum) {
                    const span = st.max - st.min || 1;
                    const t = Math.max(0, Math.min(1, (n - st.min) / span));
                    const pctMix = Math.round(8 + t * 48); // 8%~56%，留出文字对比
                    return (
                      <TableCell
                        key={col.key}
                        className={cn("font-num px-4 py-2.5", alignClass[align])}
                        style={{
                          background: `color-mix(in srgb, var(--${col.heatColor ?? "chart-1"}) ${pctMix}%, transparent)`,
                        }}
                      >
                        {text}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      key={col.key}
                      className={cn("px-4 py-2.5", alignClass[align], fmt !== "text" && "font-num")}
                    >
                      {text}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {props.summaryRow && rows.length > 0 && (
              <TableRow className="border-t-2 bg-muted/30 font-medium hover:bg-muted/30">
                {columns.map((col, ci) => {
                  const align = col.align ?? (col.mode && col.mode !== "plain" ? "right" : "left");
                  if (ci === 0) {
                    return (
                      <TableCell key={col.key} className={cn("px-4 py-2.5", alignClass[align])}>
                        {props.summaryLabel ?? "均值"}
                      </TableCell>
                    );
                  }
                  const m = means[col.key];
                  return (
                    <TableCell
                      key={col.key}
                      className={cn("px-4 py-2.5", alignClass[align], "font-num")}
                    >
                      {m === undefined ? "" : formatCell(m, col.format ?? "number", col.digits)}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
        {total > limit && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            共 {total} 行，显示前 {limit} 行
          </div>
        )}
      </Card>
    );
  },
};
