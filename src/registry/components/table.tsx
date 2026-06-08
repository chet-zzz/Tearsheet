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

function formatCell(value: unknown, format: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (format === "text") return String(value);
  return formatNumber(Number(value), format);
}

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

    return (
      <Card className="h-full gap-0 overflow-hidden py-0">
        {props.caption && (
          <div className="border-b px-4 py-3 text-sm font-medium">{props.caption}</div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn("px-4 text-muted-foreground", alignClass[col.align ?? "left"])}
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
                  return (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "px-4 py-2.5",
                        alignClass[col.align ?? "left"],
                        fmt !== "text" && "font-num",
                      )}
                    >
                      {formatCell(row[col.key], fmt)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
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
