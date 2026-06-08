import {
  BarChart as RBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  FunnelChart as RFunnelChart,
  Funnel,
  ScatterChart as RScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import type { Components } from "@json-render/react";
import type { ReportCatalog } from "@/catalog";
import { chartColor } from "@/themes";
import { formatNumber } from "@/data/functions";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartFrame, ReportTooltip, axisTick, compactTick } from "./chart-kit";

const asRows = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

/** 稳健的真值判断：无论 CSV 解析成布尔还是字符串 "true"/"是"，都正确识别合计行。 */
const truthy = (v: unknown) =>
  v === true || v === 1 || v === "true" || v === "TRUE" || v === "1" || v === "是";

/** 瀑布图每根的着色：增=绿、减=红、合计=主色。语义优先于品牌色。 */
const waterfallFill: Record<string, string> = {
  rise: "var(--success)",
  fall: "var(--destructive)",
  total: "var(--chart-1)",
};

export const extraChartRenderers: Pick<
  Components<ReportCatalog>,
  "WaterfallChart" | "BulletChart" | "FunnelChart" | "ScatterChart"
> = {
  // 瀑布图：从起点逐项增减累计到终点。透明底座 + 可见段（recharts 标准拼法）。
  WaterfallChart: ({ props }) => {
    const rows = asRows(props.data);
    const vf = props.valueFormat ?? "number";
    let running = 0;
    const bars = rows.map((r) => {
      const raw = Number(r[props.valueKey]) || 0;
      const isTotal = props.totalKey ? truthy(r[props.totalKey]) : false;
      if (isTotal) {
        running = raw;
        return { name: String(r[props.xKey] ?? ""), base: 0, bar: Math.abs(raw), delta: raw, kind: "total" };
      }
      const before = running;
      const after = before + raw;
      running = after;
      return {
        name: String(r[props.xKey] ?? ""),
        base: raw >= 0 ? before : after,
        bar: Math.abs(raw),
        delta: raw,
        kind: raw >= 0 ? "rise" : "fall",
      };
    });

    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <RBarChart data={bars} margin={{ top: 16, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compactTick} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload as (typeof bars)[number];
              const signed = d.kind === "total" ? formatNumber(d.delta, vf) : `${d.delta >= 0 ? "+" : "−"}${formatNumber(Math.abs(d.delta), vf)}`;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <div className="mb-1 font-medium text-popover-foreground">{d.name}</div>
                  <div className="font-num font-medium text-popover-foreground">{signed}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="bar" stackId="w" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {bars.map((b, i) => (
              <Cell key={i} fill={waterfallFill[b.kind]} />
            ))}
            {(props.showValues ?? true) && (
              <LabelList
                content={(p) => {
                  const idx = Number((p as { index?: number }).index ?? -1);
                  const b = bars[idx];
                  if (!b) return null;
                  const x = Number((p as { x?: number }).x ?? 0);
                  const y = Number((p as { y?: number }).y ?? 0);
                  const w = Number((p as { width?: number }).width ?? 0);
                  const txt =
                    b.kind === "total"
                      ? compactTick(b.delta)
                      : `${b.delta >= 0 ? "+" : "−"}${compactTick(Math.abs(b.delta))}`;
                  return (
                    <text
                      x={x + w / 2}
                      y={y - 4}
                      textAnchor="middle"
                      fontSize={11}
                      fill="var(--foreground)"
                      style={{ fontFamily: "var(--font-num)" }}
                    >
                      {txt}
                    </text>
                  );
                }}
              />
            )}
          </Bar>
        </RBarChart>
      </ChartFrame>
    );
  },

  // 子弹图：实际 vs 目标，替代仪表盘。纯 CSS 渲染（确定、清晰、随主题换色）。
  BulletChart: ({ props }) => {
    const rows = asRows(props.data);
    const vf = props.valueFormat ?? "number";
    return (
      <Card className="h-full gap-3 py-4">
        {(props.title || props.subtitle) && (
          <CardHeader className="gap-0.5">
            {props.title && <CardTitle className="text-base">{props.title}</CardTitle>}
            {props.subtitle && <CardDescription>{props.subtitle}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="flex flex-col gap-3.5">
          {rows.map((r, i) => {
            const value = Number(r[props.valueKey]) || 0;
            const target = Number(r[props.targetKey]) || 0;
            const scale = Math.max(value, target, 1) * 1.2;
            const vw = Math.min(100, (value / scale) * 100);
            const tw = Math.min(100, (target / scale) * 100);
            const ok = value >= target;
            const pct = target ? (value / target) * 100 : 0;
            return (
              <div key={i} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{String(r[props.labelKey] ?? "")}</span>
                  <span className="font-num shrink-0 text-xs text-muted-foreground">
                    {formatNumber(value, vf)}
                    <span className="text-muted-foreground/60"> / 目标 {formatNumber(target, vf)}</span>
                    <span className={cn("ml-1.5 font-medium", ok ? "text-success" : "text-destructive")}>
                      {pct.toFixed(0)}%
                    </span>
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width]"
                    style={{ width: `${vw}%`, background: ok ? "var(--success)" : "var(--chart-1)" }}
                  />
                  {/* 目标刻度线 */}
                  <div
                    className="absolute -inset-y-0.5 w-0.5 rounded bg-foreground"
                    style={{ left: `${tw}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  },

  // 漏斗图：单向递减的转化流程。recharts 原生 Funnel。
  FunnelChart: ({ props }) => {
    const rows = asRows(props.data);
    const vf = props.valueFormat ?? "number";
    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <RFunnelChart margin={{ top: 8, right: 96, left: 8, bottom: 8 }}>
          <Tooltip content={<ReportTooltip valueFormat={vf} />} />
          <Funnel
            dataKey={props.valueKey}
            nameKey={props.nameKey}
            data={rows}
            isAnimationActive={false}
          >
            {rows.map((_, i) => (
              <Cell key={i} fill={chartColor(i)} />
            ))}
            <LabelList
              position="right"
              dataKey={props.nameKey}
              fill="var(--foreground)"
              stroke="none"
              fontSize={12}
            />
            <LabelList
              position="center"
              dataKey={props.valueKey}
              formatter={compactTick}
              fill="var(--primary-foreground)"
              stroke="none"
              fontSize={12}
              style={{ fontFamily: "var(--font-num)" }}
            />
          </Funnel>
        </RFunnelChart>
      </ChartFrame>
    );
  },

  // 散点 / 气泡图：看两个连续变量的关系与离群点。
  ScatterChart: ({ props }) => {
    const rows = asRows(props.data);
    const vf = props.valueFormat ?? "number";
    const axisFmt = props.percentAxes
      ? (v: unknown) => `${compactTick(v)}%`
      : compactTick;

    // 均值基准：把散点放进「相对全体的位置」语境，并轻染双高优势区（治小 N 空旷）
    const mean = (k: string) => {
      const v = rows.map((r) => Number(r[k])).filter(Number.isFinite);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    };
    const maxOf = (k: string) =>
      rows.reduce((m, r) => Math.max(m, Number(r[k]) || 0), -Infinity);
    const useMean = props.quadrantMean === true;
    const mx = useMean ? mean(props.xKey) : 0;
    const my = useMean ? mean(props.yKey) : 0;

    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <RScatterChart margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          {useMean && (
            <ReferenceArea
              x1={mx}
              x2={maxOf(props.xKey)}
              y1={my}
              y2={maxOf(props.yKey)}
              fill="var(--success)"
              fillOpacity={0.12}
              ifOverflow="extendDomain"
              label={{ value: "优势区 ↗", position: "insideTopRight", fill: "var(--success)", fontSize: 10, opacity: 0.7 }}
            />
          )}
          {useMean && (
            <ReferenceLine
              x={mx}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
              label={{ value: "均值", position: "top", fill: "var(--muted-foreground)", fontSize: 10 }}
            />
          )}
          {useMean && (
            <ReferenceLine
              y={my}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
            />
          )}
          <XAxis
            type="number"
            dataKey={props.xKey}
            name={props.xLabel ?? props.xKey}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={axisFmt}
          />
          <YAxis
            type="number"
            dataKey={props.yKey}
            name={props.yLabel ?? props.yKey}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={axisFmt}
          />
          {props.sizeKey && (
            <ZAxis type="number" dataKey={props.sizeKey} range={[120, 900]} />
          )}
          {props.quadrant && (
            <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.5} />
          )}
          {props.quadrant && (
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.5} />
          )}
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload as Record<string, unknown>;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  {props.nameKey && (
                    <div className="mb-1 font-medium text-popover-foreground">
                      {String(d[props.nameKey] ?? "")}
                    </div>
                  )}
                  <div className="grid gap-0.5 text-muted-foreground">
                    <span className="font-num">
                      {props.xLabel ?? props.xKey}：{formatNumber(Number(d[props.xKey]), vf)}
                    </span>
                    <span className="font-num">
                      {props.yLabel ?? props.yKey}：{formatNumber(Number(d[props.yKey]), vf)}
                    </span>
                    {props.sizeKey && (
                      <span className="font-num">
                        {props.sizeKey}：{formatNumber(Number(d[props.sizeKey]), vf)}
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Scatter
            data={rows}
            fill="var(--chart-1)"
            fillOpacity={0.65}
            isAnimationActive={false}
          >
            {props.nameKey && (
              <LabelList
                dataKey={props.nameKey}
                position="top"
                fontSize={11}
                fill="var(--foreground)"
              />
            )}
          </Scatter>
        </RScatterChart>
      </ChartFrame>
    );
  },
};
