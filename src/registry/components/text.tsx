import type { ComponentType } from "react";
import { TrendingUp, TriangleAlert, OctagonAlert, Info, Lightbulb } from "lucide-react";
import type { Components } from "@json-render/react";
import type { ReportCatalog } from "@/catalog";
import { cn } from "@/lib/utils";
import { toneBadge, type Tone } from "@/components/ui/tone";

const headingSize = {
  1: "text-2xl font-semibold",
  2: "text-xl font-semibold",
  3: "text-base font-semibold",
  4: "text-sm font-semibold uppercase tracking-wide text-muted-foreground",
} as const;

/* Insight 语气 → 克制的图标 chip（语义只靠小图标承载，不再用整条粗边框抢视觉）。 */
const toneInsight: Record<Tone, { Icon: ComponentType<{ className?: string }>; chip: string }> = {
  info: { Icon: Info, chip: "bg-primary/10 text-primary" },
  positive: { Icon: TrendingUp, chip: "bg-success/10 text-success" },
  warning: { Icon: TriangleAlert, chip: "bg-amber-500/10 text-amber-600" },
  critical: { Icon: OctagonAlert, chip: "bg-destructive/10 text-destructive" },
  neutral: { Icon: Lightbulb, chip: "bg-muted text-muted-foreground" },
};

export const textRenderers: Pick<
  Components<ReportCatalog>,
  "Heading" | "Text" | "Insight" | "Badge"
> = {
  Heading: ({ props }) => {
    const cls = cn("tracking-tight", headingSize[(props.level ?? 2) as 1 | 2 | 3 | 4]);
    return <p className={cls}>{props.text}</p>;
  },

  Text: ({ props }) => (
    <p
      className={cn(
        "text-sm leading-relaxed",
        props.muted ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {props.content}
    </p>
  ),

  Insight: ({ props }) => {
    const { Icon, chip } = toneInsight[(props.tone ?? "info") as Tone];
    return (
      <div className="flex h-full gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            chip,
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          {props.title && (
            <p className="text-sm font-semibold leading-tight">{props.title}</p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {props.content}
          </p>
        </div>
      </div>
    );
  },

  Badge: ({ props }) => (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneBadge[(props.tone ?? "neutral") as Tone],
      )}
    >
      {props.label}
    </span>
  ),
};
