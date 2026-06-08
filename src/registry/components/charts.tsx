import {
  BarChart as RBarChart,
  Bar,
  LineChart as RLineChart,
  Line,
  AreaChart as RAreaChart,
  Area,
  PieChart as RPieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import type { Components } from "@json-render/react";
import type { ReportCatalog } from "@/catalog";
import { chartColor } from "@/themes";
import {
  ChartFrame,
  ReportTooltip,
  axisTick,
  legendProps,
  compactTick,
  slug,
  renderRefLines,
  renderBand,
  lastValueLabel,
} from "./chart-kit";

const gridProps = {
  strokeDasharray: "3 3",
  stroke: "var(--border)",
  vertical: false,
} as const;

const asRows = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

export const chartRenderers: Pick<
  Components<ReportCatalog>,
  "BarChart" | "LineChart" | "AreaChart" | "PieChart" | "ComboChart"
> = {
  BarChart: ({ props }) => {
    const series = props.series ?? [];
    const vf = props.valueFormat ?? "number";
    let data = asRows(props.data);

    // 排行榜：按首个系列排序
    if (props.sort && series[0]) {
      const k = series[0].key;
      const dir = props.sort === "asc" ? 1 : -1;
      data = [...data].sort((a, b) => (Number(a[k]) - Number(b[k])) * dir);
    }

    // 单系列高亮：最高 / 最低那根满色，其余淡化（一图一信息）
    const single = series.length === 1 ? series[0].key : null;
    let target: number | null = null;
    if (props.highlight && single) {
      const vals = data.map((d) => Number(d[single]));
      target = props.highlight === "min" ? Math.min(...vals) : Math.max(...vals);
    }

    // stack100：把每段标成「占该行的百分比」（段够高才标，避免拥挤）
    const seriesKeys = series.map((s) => s.key);
    const rowTotals = data.map((d) => seriesKeys.reduce((sum, k) => sum + (Number(d[k]) || 0), 0));
    const stackPctLabel =
      (key: string) =>
      (p: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; index?: number }) => {
        const i = p.index ?? -1;
        const h = Number(p.height ?? 0);
        const tot = rowTotals[i] || 0;
        const v = Number(data[i]?.[key]) || 0;
        if (i < 0 || !tot || h < 14) return null;
        const pct = (v / tot) * 100;
        if (pct < 7) return null;
        const cx = Number(p.x ?? 0) + Number(p.width ?? 0) / 2;
        const cy = Number(p.y ?? 0) + h / 2;
        return (
          <text
            x={cx}
            y={cy}
            dy={3.5}
            textAnchor="middle"
            fontSize={10}
            fontWeight={600}
            fill="#fff"
            style={{ fontFamily: "var(--font-num)" }}
          >
            {Math.round(pct)}%
          </text>
        );
      };

    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <RBarChart
          data={data}
          layout={props.horizontal ? "vertical" : "horizontal"}
          stackOffset={props.stack100 ? "expand" : undefined}
          margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
        >
          <CartesianGrid {...gridProps} />
          {props.horizontal ? (
            <>
              <XAxis
                type="number"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={
                  props.stack100 ? (v) => `${Math.round(Number(v) * 100)}%` : compactTick
                }
              />
              <YAxis type="category" dataKey={props.xKey} tick={axisTick} tickLine={false} axisLine={false} width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey={props.xKey} tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={
                  props.stack100 ? (v) => `${Math.round(Number(v) * 100)}%` : compactTick
                }
              />
            </>
          )}
          {!props.stack100 && renderBand(props.band)}
          {!props.stack100 && renderRefLines(props.refLines)}
          <Tooltip
            content={<ReportTooltip valueFormat={vf} />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          {series.length > 1 && <Legend {...legendProps} />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              fill={chartColor(i)}
              stackId={props.stacked || props.stack100 ? "stack" : undefined}
              radius={props.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={props.stacked || props.stack100 ? 56 : 40}
              isAnimationActive={false}
            >
              {single &&
                (props.diverging || target !== null) &&
                data.map((d, di) => {
                  const v = Number(d[single]);
                  if (props.diverging) {
                    return (
                      <Cell
                        key={di}
                        fill={v >= 0 ? "var(--success)" : "var(--destructive)"}
                      />
                    );
                  }
                  return (
                    <Cell key={di} fill="var(--chart-1)" fillOpacity={v === target ? 1 : 0.28} />
                  );
                })}
              {props.showValues && props.stack100 && (
                <LabelList content={stackPctLabel(s.key)} />
              )}
              {props.showValues && !props.stack100 && (
                <LabelList
                  dataKey={s.key}
                  position={props.horizontal ? "right" : "top"}
                  formatter={compactTick}
                  fontSize={11}
                  fill="var(--muted-foreground)"
                  style={{ fontFamily: "var(--font-num)" }}
                />
              )}
            </Bar>
          ))}
        </RBarChart>
      </ChartFrame>
    );
  },

  LineChart: ({ props }) => {
    const series = props.series ?? [];
    const vf = props.valueFormat ?? "number";
    const data = asRows(props.data);
    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <RLineChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={props.xKey} tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compactTick} />
          {renderBand(props.band)}
          {renderRefLines(props.refLines)}
          <Tooltip content={<ReportTooltip valueFormat={vf} />} />
          {series.length > 1 && <Legend {...legendProps} />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type={props.smooth ? "monotone" : "linear"}
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={chartColor(i)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            >
              {props.showValues && (
                <LabelList content={lastValueLabel(data.length, chartColor(i))} />
              )}
            </Line>
          ))}
        </RLineChart>
      </ChartFrame>
    );
  },

  AreaChart: ({ props }) => {
    const series = props.series ?? [];
    const vf = props.valueFormat ?? "number";
    const data = asRows(props.data);
    const gid = (i: number) => `area-${slug(props.xKey)}-${i}`;
    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <RAreaChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={gid(i)} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor(i)} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor(i)} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={props.xKey} tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compactTick} />
          {renderBand(props.band)}
          {renderRefLines(props.refLines)}
          <Tooltip content={<ReportTooltip valueFormat={vf} />} />
          {series.length > 1 && <Legend {...legendProps} />}
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="natural"
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={chartColor(i)}
              fill={`url(#${gid(i)})`}
              fillOpacity={1}
              strokeWidth={2}
              stackId={props.stacked ? "stack" : undefined}
              isAnimationActive={false}
            >
              {props.showValues && (
                <LabelList content={lastValueLabel(data.length, chartColor(i))} />
              )}
            </Area>
          ))}
        </RAreaChart>
      </ChartFrame>
    );
  },

  PieChart: ({ props }) => {
    const vf = props.valueFormat ?? "number";
    const data = asRows(props.data);
    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <RPieChart>
          <Pie
            data={data}
            dataKey={props.valueKey}
            nameKey={props.nameKey}
            innerRadius={(props.donut ?? true) ? "55%" : 0}
            outerRadius="80%"
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={chartColor(i)} />
            ))}
          </Pie>
          <Tooltip content={<ReportTooltip valueFormat={vf} />} />
          <Legend {...legendProps} />
        </RPieChart>
      </ChartFrame>
    );
  },

  ComboChart: ({ props }) => {
    const vf = props.valueFormat ?? "number";
    const bars = props.bars ?? [];
    const lines = props.lines ?? [];
    const data = asRows(props.data);
    return (
      <ChartFrame title={props.title} subtitle={props.subtitle} height={props.height ?? 240}>
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={props.xKey} tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compactTick} />
          {(props.secondAxis ?? true) && (
            <YAxis yAxisId="right" orientation="right" tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compactTick} />
          )}
          {renderRefLines(props.refLines)}
          <Tooltip
            content={<ReportTooltip valueFormat={vf} />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Legend {...legendProps} />
          {bars.map((s, i) => (
            <Bar
              key={s.key}
              yAxisId="left"
              dataKey={s.key}
              name={s.label ?? s.key}
              fill={chartColor(i)}
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
              isAnimationActive={false}
            />
          ))}
          {lines.map((s, i) => (
            <Line
              key={s.key}
              yAxisId={(props.secondAxis ?? true) ? "right" : "left"}
              type="monotone"
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={chartColor(bars.length + i)}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ChartFrame>
    );
  },
};
