import { Fragment } from "react";
import {
  RadarChart as RRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { Components } from "@json-render/react";
import type { ReportCatalog } from "@/catalog";
import { chartColor } from "@/themes";
import { formatNumber } from "@/data/functions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartFrame, ReportTooltip, legendProps } from "./chart-kit";

const asRows = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** 卡片头（标题 + 副标题），供 CSS / SVG 类图表复用（recharts 图走 ChartFrame）。 */
function Head({ title, subtitle, extra }: { title?: string; subtitle?: string; extra?: React.ReactNode }) {
  if (!title && !subtitle) return null;
  return (
    <CardHeader className="gap-0.5">
      <div className="flex items-start justify-between gap-2">
        <div className="grid gap-0.5">
          {title && <CardTitle className="text-[0.95rem] leading-tight">{title}</CardTitle>}
          {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
        </div>
        {extra}
      </div>
    </CardHeader>
  );
}

export const extraChartRenderers2: Pick<
  Components<ReportCatalog>,
  "DumbbellChart" | "SlopeChart" | "HeatmapChart" | "RadarChart"
> = {
  // 哑铃图：两点 + 连线，连线按方向着色（纯 CSS，确定、随主题换色）。
  DumbbellChart: ({ props }) => {
    const rows = asRows(props.data);
    const vf = props.valueFormat ?? "number";
    const startLabel = props.startLabel ?? "去年";
    const endLabel = props.endLabel ?? "今年";
    const scale =
      Math.max(1, ...rows.flatMap((r) => [num(r[props.startKey]), num(r[props.endKey])])) * 1.08;
    const legend = (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full" style={{ background: "var(--muted-foreground)" }} />
          {startLabel}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full" style={{ background: "var(--chart-1)" }} />
          {endLabel}
        </span>
      </div>
    );
    return (
      <Card className="h-full gap-3 py-3">
        <Head title={props.title} subtitle={props.subtitle} extra={legend} />
        <CardContent className="flex flex-col gap-2.5">
          {rows.map((r, i) => {
            const s = num(r[props.startKey]);
            const e = num(r[props.endKey]);
            const sp = (s / scale) * 100;
            const ep = (e / scale) * 100;
            const lo = Math.min(sp, ep);
            const hi = Math.max(sp, ep);
            const grew = e >= s;
            const delta = e - s;
            const dir = grew ? "var(--success)" : "var(--destructive)";
            return (
              <div key={i} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{String(r[props.labelKey] ?? "")}</span>
                  <span className="font-num shrink-0 text-xs" style={{ color: dir }}>
                    {grew ? "+" : "−"}
                    {formatNumber(Math.abs(delta), vf)}
                  </span>
                </div>
                <div className="relative h-3">
                  <span
                    className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                    style={{ left: `${lo}%`, width: `${hi - lo}%`, background: dir, opacity: 0.45 }}
                  />
                  <span
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                    style={{ left: `${sp}%`, background: "var(--muted-foreground)" }}
                  />
                  <span
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                    style={{ left: `${ep}%`, background: "var(--chart-1)" }}
                  />
                </div>
                <div className="font-num text-xs text-muted-foreground">
                  {startLabel} {formatNumber(s, vf)} → {endLabel} {formatNumber(e, vf)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  },

  // 斜率图：两个时点 + 连线，按方向着色（自绘 SVG，viewBox 等比缩放）。
  SlopeChart: ({ props }) => {
    const rows = asRows(props.data);
    const vf = props.valueFormat ?? "number";
    const sl = props.startLabel ?? "去年";
    const el = props.endLabel ?? "今年";
    const H = props.height ?? 220;
    const vals = rows.flatMap((r) => [num(r[props.startKey]), num(r[props.endKey])]);
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const W = 320;
    const padT = 26;
    const padB = 16;
    const xL = 84;
    const xR = 236;
    const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
    return (
      <Card className="h-full gap-2 py-3">
        <Head title={props.title} subtitle={props.subtitle} />
        <CardContent className="px-2">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet">
            <text x={xL} y={14} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{sl}</text>
            <text x={xR} y={14} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{el}</text>
            <line x1={xL} y1={padT - 4} x2={xL} y2={H - padB} stroke="var(--border)" />
            <line x1={xR} y1={padT - 4} x2={xR} y2={H - padB} stroke="var(--border)" />
            {rows.map((r, i) => {
              const s = num(r[props.startKey]);
              const e = num(r[props.endKey]);
              const grew = e >= s;
              const c = grew ? "var(--success)" : "var(--destructive)";
              const ys = y(s);
              const ye = y(e);
              return (
                <g key={i}>
                  <line x1={xL} y1={ys} x2={xR} y2={ye} stroke={c} strokeWidth="1.5" />
                  <circle cx={xL} cy={ys} r="3" fill={c} />
                  <circle cx={xR} cy={ye} r="3" fill={c} />
                  <text x={xL - 7} y={ys} dy="3.5" textAnchor="end" fontSize="10" fill="var(--foreground)">
                    {String(r[props.labelKey] ?? "")}
                  </text>
                  <text
                    x={xR + 7}
                    y={ye}
                    dy="3.5"
                    textAnchor="start"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                    style={{ fontFamily: "var(--font-num)" }}
                  >
                    {formatNumber(e, vf)}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  },

  // 热力图：CSS grid，色深表强度；diverging 时正绿负红（color-mix 调透明度）。
  HeatmapChart: ({ props }) => {
    const rows = asRows(props.data);
    const vf = props.valueFormat ?? "number";
    const xs = [...new Set(rows.map((r) => String(r[props.xKey])))];
    const ys = [...new Set(rows.map((r) => String(r[props.yKey])))];
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(`${r[props.yKey]}|${r[props.xKey]}`, num(r[props.valueKey])));
    const allv = rows.map((r) => num(r[props.valueKey]));
    const maxAbs = Math.max(...allv.map(Math.abs), 1);
    const maxV = Math.max(...allv, 0);
    const minV = Math.min(...allv, 0);
    const diverging = props.diverging ?? false;
    const cell = (v: number) => {
      if (diverging) {
        const base = v >= 0 ? "var(--success)" : "var(--destructive)";
        const pct = Math.min(70, Math.max(6, (Math.abs(v) / maxAbs) * 100));
        return `color-mix(in srgb, ${base} ${pct}%, transparent)`;
      }
      const pct = Math.min(70, Math.max(6, ((v - minV) / (maxV - minV || 1)) * 100));
      return `color-mix(in srgb, var(--chart-1) ${pct}%, transparent)`;
    };
    return (
      <Card className="h-full gap-2 py-3">
        <Head title={props.title} subtitle={props.subtitle} />
        <CardContent>
          <div
            className="grid gap-1 text-xs"
            style={{ gridTemplateColumns: `auto repeat(${xs.length}, minmax(0, 1fr))` }}
          >
            <div />
            {xs.map((x) => (
              <div key={x} className="pb-1 text-center text-muted-foreground">{x}</div>
            ))}
            {ys.map((yk) => (
              <Fragment key={yk}>
                <div className="flex items-center whitespace-nowrap pr-2 text-muted-foreground">{yk}</div>
                {xs.map((x) => {
                  const v = map.get(`${yk}|${x}`);
                  return (
                    <div
                      key={x}
                      className="font-num flex h-9 items-center justify-center rounded"
                      style={{ background: v == null ? "transparent" : cell(v) }}
                    >
                      {v == null ? "" : formatNumber(v, vf)}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  },

  // 雷达图：recharts 原生。每条系列一张多边形（如 今年 / 去年）。
  RadarChart: ({ props }) => {
    const vf = props.valueFormat ?? "number";
    const series = props.series ?? [];
    const data = asRows(props.data);
    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <RRadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey={props.axisKey} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} angle={90} />
          <Tooltip content={<ReportTooltip valueFormat={vf} />} />
          {series.length > 1 && <Legend {...legendProps} />}
          {series.map((s, i) => (
            <Radar
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={chartColor(i)}
              fill={chartColor(i)}
              fillOpacity={0.15}
              isAnimationActive={false}
            />
          ))}
        </RRadarChart>
      </ChartFrame>
    );
  },
};
