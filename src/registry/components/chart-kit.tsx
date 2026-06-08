import type { ReactElement } from "react";
import {
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  type TooltipProps,
} from "recharts";
import { formatNumber } from "@/data/functions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/*
 * 图表共享工具层。所有图表（核心 + 进阶）复用同一套：
 *   - ChartFrame   统一卡片外壳（标题 / 副标题 / 等高）
 *   - ReportTooltip 专业 tooltip：色点呼应系列、等宽数字、千分位、可选语义格式
 *   - 参考线 / 阈值带：目标线、预算线、去年同期、正常区间
 *   - 语义色：涨跌 / 达标 / 警戒（引用主题变量，换肤一致）
 * 这样「专业细节」只实现一次，每张图都拿到。
 */

// ---- 通用样式（引用 CSS 变量，随主题变化） ----
export const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 } as const;
export const legendProps = {
  wrapperStyle: { fontSize: 12, paddingTop: 4 },
  iconType: "circle" as const,
  iconSize: 8,
};

/** 轴 / 数据标签用紧凑数字（1.2万 / 9.9亿），省横向空间。 */
export const compactTick = (v: unknown) => formatNumber(Number(v), "compact");

/** 生成 ASCII id（中文进 url(#...) 会失效，故 slug 化）。 */
export const slug = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "") || "x";

/** 语义色：参考线 / 阈值带 / 涨跌按含义取色，而非品牌色。 */
export const toneColor: Record<string, string> = {
  neutral: "var(--muted-foreground)",
  positive: "var(--success)",
  warning: "var(--chart-3)",
  critical: "var(--destructive)",
};

export function ChartFrame({
  title,
  subtitle,
  height,
  children,
}: {
  title?: string;
  subtitle?: string;
  height: number;
  children: ReactElement;
}) {
  return (
    <Card className="h-full gap-2 py-3">
      {(title || subtitle) && (
        <CardHeader className="gap-0.5">
          {title && <CardTitle className="text-[0.95rem] leading-tight">{title}</CardTitle>}
          {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="px-1.5 sm:px-2">
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 专业 tooltip：标题（类目）+ 每系列「色点 名称 …… 数值」。
 * 数值走等宽字栈 + 指定格式（千分位 / 货币 / 百分比），右对齐对齐小数点。
 */
export function ReportTooltip({
  active,
  payload,
  label,
  valueFormat = "number",
}: TooltipProps<number, string> & { valueFormat?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && label !== "" && (
        <div className="mb-1.5 font-medium text-popover-foreground">{String(label)}</div>
      )}
      <div className="grid gap-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 rounded-[2px]"
                style={{ background: p.color ?? "var(--chart-1)" }}
              />
              {p.name}
            </span>
            <span className="font-num font-medium text-popover-foreground">
              {formatNumber(Number(p.value), valueFormat)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- 参考线 / 阈值带 ----

export type RefLineSpec = {
  y?: number;
  x?: string | number;
  label?: string;
  tone?: "neutral" | "positive" | "warning" | "critical";
};
export type BandSpec = {
  from: number;
  to: number;
  label?: string;
  tone?: "neutral" | "positive" | "warning" | "critical";
};

/** 目标线 / 预算线 / 去年同期线。值在数据坐标系，ifOverflow=extendDomain 防被裁切。 */
export function renderRefLines(refLines?: RefLineSpec[], axis: "y" | "x" = "y") {
  if (!Array.isArray(refLines)) return null;
  return refLines.map((r, i) => {
    const color = toneColor[r.tone ?? "neutral"];
    const pos = axis === "y" ? { y: r.y } : { x: r.x ?? r.y };
    return (
      <ReferenceLine
        key={`ref-${i}`}
        {...pos}
        stroke={color}
        strokeDasharray="5 4"
        strokeWidth={1.5}
        ifOverflow="extendDomain"
        label={
          r.label
            ? {
                value: r.label,
                position: "insideTopRight",
                fill: color,
                fontSize: 11,
                fontWeight: 500,
              }
            : undefined
        }
      />
    );
  });
}

/** 阈值 / 正常区间带（背景浅色填充）。 */
export function renderBand(band?: BandSpec) {
  if (!band) return null;
  const color = toneColor[band.tone ?? "positive"];
  return (
    <ReferenceArea
      y1={band.from}
      y2={band.to}
      fill={color}
      fillOpacity={0.08}
      ifOverflow="hidden"
      label={
        band.label
          ? { value: band.label, position: "insideTopLeft", fill: color, fontSize: 11 }
          : undefined
      }
    />
  );
}

/**
 * 末值直标工厂：折线 / 面积只在最后一个点标数值（替代图例，眼睛不用来回跳）。
 * 返回 LabelList 的 content 函数。
 */
export function lastValueLabel(count: number, color: string) {
  return (props: {
    x?: number | string;
    y?: number | string;
    value?: number | string;
    index?: number;
  }) => {
    if (props.index !== count - 1) return null;
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    return (
      <text
        x={x + 6}
        y={y}
        dy={4}
        fontSize={11}
        fontWeight={600}
        fill={color}
        style={{ fontFamily: "var(--font-num)" }}
      >
        {compactTick(props.value)}
      </text>
    );
  };
}
