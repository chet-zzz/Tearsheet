import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import type { Components } from "@json-render/react";
import type { ReportCatalog } from "@/catalog";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/data/functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { iconMap } from "./icons";

function fmt(value: unknown, format: string): string {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(n)) {
    return value == null ? "—" : String(value);
  }
  return formatNumber(n, format);
}

export const statRenderers: Pick<Components<ReportCatalog>, "StatList" | "RadialStat"> = {
  StatList: ({ props }) => {
    const data = Array.isArray(props.data) ? props.data : [];
    const rows = data.slice(0, props.max ?? 8);
    const Icon = props.icon ? iconMap[props.icon] : undefined;

    return (
      <Card className="h-full">
        {props.title && (
          <CardHeader>
            <CardTitle className="text-base">{props.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex flex-col">
          {rows.map((row, i) => {
            const sub = props.sublabelKey ? row[props.sublabelKey] : undefined;
            const delta = props.deltaKey ? Number(row[props.deltaKey]) : undefined;
            const hasDelta = delta !== undefined && !Number.isNaN(delta);
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {Icon && (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                  )}
                  <div className="grid min-w-0 gap-0.5">
                    <span className="truncate text-sm font-medium leading-none">
                      {String(row[props.labelKey] ?? "")}
                    </span>
                    {sub != null && sub !== "" && (
                      <span className="truncate text-xs text-muted-foreground">
                        {String(sub)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="font-num text-sm font-semibold">
                    {fmt(row[props.valueKey], props.valueFormat ?? "number")}
                  </span>
                  {hasDelta && (
                    <span
                      className={cn(
                        "font-num text-xs font-medium",
                        delta >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  },

  RadialStat: ({ props }) => {
    const value = typeof props.value === "number" ? props.value : Number(props.value);
    const max = props.max ?? 100;
    const pct = Number.isFinite(value)
      ? Math.max(0, Math.min(100, (value / max) * 100))
      : 0;
    const center = Number.isFinite(value)
      ? formatNumber(value, props.format ?? "percent")
      : String(props.value ?? "—");

    return (
      <Card className="h-full">
        {props.label && (
          <CardHeader>
            <CardTitle className="text-base">{props.label}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex flex-1 flex-col items-center justify-center">
          <div className="relative" style={{ width: 176, height: 176 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={[{ value: pct, fill: "var(--chart-1)" }]}
                innerRadius="72%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: "var(--muted)" }}
                  dataKey="value"
                  cornerRadius={999}
                  isAnimationActive={false}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num-display text-3xl font-semibold">{center}</span>
            </div>
          </div>
          {props.caption && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {props.caption}
            </p>
          )}
        </CardContent>
      </Card>
    );
  },
};
