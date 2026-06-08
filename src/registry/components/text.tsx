import type { Components } from "@json-render/react";
import type { ReportCatalog } from "@/catalog";
import { cn } from "@/lib/utils";
import { toneBadge, toneBar, type Tone } from "@/components/ui/tone";

const headingSize = {
  1: "text-2xl font-semibold",
  2: "text-xl font-semibold",
  3: "text-base font-semibold",
  4: "text-sm font-semibold uppercase tracking-wide text-muted-foreground",
} as const;

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

  Insight: ({ props }) => (
    <div
      className={cn(
        "rounded-lg border border-l-4 bg-card p-4",
        toneBar[(props.tone ?? "info") as Tone],
      )}
    >
      {props.title && (
        <p className="text-sm font-semibold">{props.title}</p>
      )}
      <p className="mt-0.5 text-sm text-muted-foreground">{props.content}</p>
    </div>
  ),

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
