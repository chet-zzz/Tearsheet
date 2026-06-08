import type { Components } from "@json-render/react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import type { ReportCatalog } from "@/catalog";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/data/functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { iconMap } from "./icons";
import { slug } from "./chart-kit";

export const metricRenderers: Pick<Components<ReportCatalog>, "KpiCard"> = {
  KpiCard: ({ props }) => {
    const display =
      typeof props.value === "number"
        ? formatNumber(props.value, props.format, props.digits)
        : props.value;

    const delta = props.delta;
    const hasDelta = delta !== undefined && delta !== null;
    const dir = !hasDelta ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const Icon = props.icon ? iconMap[props.icon] : undefined;

    // 迷你趋势：给单个数字补上「怎么走到这」的上下文
    const raw = Array.isArray(props.trend) ? props.trend : [];
    const spark = raw
      .map((d, i) => ({
        i,
        v: typeof d === "number" ? d : Number(d[props.trendKey ?? ""]),
      }))
      .filter((p) => Number.isFinite(p.v));
    const sparkId = `spark-${slug(props.label)}`;

    // 有图标时标签下沉到底部说明行；同比/环比说明也并入底部
    const footer: string[] = [];
    if (Icon) footer.push(props.label);
    if (hasDelta && props.deltaLabel) footer.push(props.deltaLabel);

    return (
      <Card className="h-full gap-1.5 bg-linear-to-t from-primary/[0.04] to-card py-3 shadow-xs">
        <div className="flex items-start justify-between gap-2 px-4">
          {Icon ? (
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {props.label}
            </span>
          )}
          {hasDelta && <DeltaBadge dir={dir} value={delta} />}
        </div>

        <div className="flex items-baseline gap-1 px-4">
          <span className="num-display text-[1.75rem] font-semibold">{display}</span>
          {props.unit && (
            <span className="text-sm text-muted-foreground">{props.unit}</span>
          )}
        </div>

        {spark.length >= 2 && (
          <div className="mt-1 h-9 w-full px-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--chart-1)"
                  strokeWidth={1.5}
                  fill={`url(#${sparkId})`}
                  fillOpacity={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {footer.length > 0 && (
          <p className="px-4 text-xs text-muted-foreground">{footer.join(" · ")}</p>
        )}
      </Card>
    );
  },
};

function DeltaBadge({ dir, value }: { dir: "up" | "down" | "flat"; value: number }) {
  const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
  const color =
    dir === "up"
      ? "border-success/30 bg-success/10 text-success"
      : dir === "down"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-border bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("rounded-md tabular-nums", color)}>
      <Icon className="size-3" />
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </Badge>
  );
}
