import { Children } from "react";
import type { Components } from "@json-render/react";
import type { ReportCatalog } from "@/catalog";
import { cn } from "@/lib/utils";

const gapClass = { sm: "gap-3", md: "gap-4", lg: "gap-6" } as const;
const alignClass = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

// Tailwind 需要静态类名，故用字面量映射（不能拼 `md:col-span-${n}`，JIT 扫不到）
const mdCols: Record<number, string> = {
  1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4",
  5: "md:grid-cols-5", 6: "md:grid-cols-6", 7: "md:grid-cols-7", 8: "md:grid-cols-8",
  9: "md:grid-cols-9", 10: "md:grid-cols-10", 11: "md:grid-cols-11", 12: "md:grid-cols-12",
};
const mdSpan: Record<number, string> = {
  1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
  5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
  9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12",
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const layoutRenderers: Pick<
  Components<ReportCatalog>,
  "Page" | "Section" | "Grid" | "Row" | "Col" | "Divider"
> = {
  Page: ({ props, children }) => (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-6 lg:px-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{props.title}</h1>
          {props.subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{props.subtitle}</p>
          )}
        </div>
        {props.updatedAt && (
          <p className="text-xs text-muted-foreground">数据更新：{props.updatedAt}</p>
        )}
      </header>
      <div className="flex flex-col gap-7">{children}</div>
    </div>
  ),

  // 轻量分组标题（仅在两个语义无关的大板块之间用；高密度看板通常整页一个 Grid 即可）
  Section: ({ props, children }) => (
    <section className="flex flex-col gap-3">
      {props.title && (
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{props.title}</h2>
          {props.description && (
            <span className="text-xs text-muted-foreground">{props.description}</span>
          )}
        </div>
      )}
      {children}
    </section>
  ),

  // 12 列 bento 网格：spans 指定每张卡占的列宽（加总建议 = cols）；省略则等分。窄屏单列。
  Grid: ({ props, children }) => {
    const cols = props.cols ?? 12;
    const items = Children.toArray(children);
    const n = items.length || 1;
    const defaultSpan = clamp(Math.floor(cols / n), 1, cols);
    return (
      <div className={cn("grid grid-cols-1", mdCols[cols], gapClass[props.gap ?? "md"])}>
        {items.map((child, i) => {
          const span = clamp(props.spans?.[i] ?? defaultSpan, 1, cols);
          return (
            <div key={i} className={cn("col-span-1 min-w-0", mdSpan[span])}>
              {child}
            </div>
          );
        })}
      </div>
    );
  },

  Row: ({ props, children }) => (
    <div
      className={cn(
        "flex flex-wrap",
        gapClass[props.gap ?? "md"],
        alignClass[props.align ?? "stretch"],
      )}
    >
      {children}
    </div>
  ),

  Col: ({ props, children }) => (
    <div
      className={cn("flex min-w-0 flex-col", gapClass[props.gap ?? "md"])}
      style={{ flexGrow: props.grow ?? 1, flexBasis: 0 }}
    >
      {children}
    </div>
  ),

  Divider: ({ props }) =>
    props.label ? (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {props.label}
        <span className="h-px flex-1 bg-border" />
      </div>
    ) : (
      <hr className="border-border" />
    ),
};
