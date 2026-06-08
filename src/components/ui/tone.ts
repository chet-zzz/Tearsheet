/** 语气色 → Tailwind 类。用于 Insight / Badge 等需要表达 正/警/危/信息 的组件。 */
export type Tone = "info" | "positive" | "warning" | "critical" | "neutral";

export const toneBadge: Record<Tone, string> = {
  info: "bg-accent text-accent-foreground",
  positive: "bg-success/15 text-success",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-destructive/15 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export const toneBar: Record<Tone, string> = {
  info: "border-l-primary",
  positive: "border-l-success",
  warning: "border-l-amber-500",
  critical: "border-l-destructive",
  neutral: "border-l-border",
};
