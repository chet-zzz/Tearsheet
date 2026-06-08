import { useEffect, useState, type ComponentType } from "react";
import { BarChart3, FileText, Palette } from "lucide-react";
import { reportList } from "@/reports";
import { loadReport, type LoadedReport } from "@/runtime/loadReport";
import { ReportRenderer } from "@/runtime/ReportRenderer";
import { THEMES, applyTheme, getInitialTheme } from "@/themes";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [reportId, setReportId] = useState(getInitialReport);
  const [loaded, setLoaded] = useState<LoadedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 把当前报告同步进 URL（?report=<id>），便于分享 / 直接打开某份报告
  useEffect(() => {
    if (!reportId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("report", reportId);
    window.history.replaceState(null, "", url);
  }, [reportId]);

  useEffect(() => {
    if (!reportId) return;
    let alive = true;
    setLoaded(null);
    setError(null);
    loadReport(reportId)
      .then((r) => alive && setLoaded(r))
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [reportId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 shadow-[0_1px_2px_-1px_rgb(0_0_0/0.06)] backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="mx-auto flex w-full max-w-[1680px] items-center gap-3 px-4 py-2.5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BarChart3 className="size-[18px]" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.95rem] font-semibold tracking-tight">Tearsheet</span>
                <span className="rounded bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                  json-render
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">声明式报告脚手架</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            {reportList.length > 0 && (
              <HeaderSelect
                icon={FileText}
                ariaLabel="选择报告"
                value={reportId}
                onChange={setReportId}
                options={reportList.map((r) => ({ value: r.id, label: r.title }))}
              />
            )}
            <Separator orientation="vertical" className="h-5" />
            <HeaderSelect
              icon={Palette}
              ariaLabel="选择风格"
              value={theme}
              onChange={setTheme}
              options={THEMES.map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>
        </div>
      </header>

      <main>
        {reportList.length === 0 && (
          <Hint>
            还没有任何报告。在 <code>reports/</code> 下新建一个文件夹（含 report.json +
            meta.json + csv）即可自动出现。
          </Hint>
        )}
        {error && <Hint tone="error">加载失败：{error}</Hint>}
        {!error && reportId && !loaded && <Hint>加载中…</Hint>}
        {loaded && (
          <ReportRenderer spec={loaded.spec} initialState={loaded.initialState} />
        )}
      </main>
    </div>
  );
}

/** 初始报告：优先 URL 的 ?report=<id>（合法才用），否则取第一份。 */
function getInitialReport(): string {
  try {
    const q = new URLSearchParams(window.location.search).get("report");
    if (q && reportList.some((r) => r.id === q)) return q;
  } catch {
    /* ignore */
  }
  return reportList[0]?.id ?? "";
}

function HeaderSelect({
  icon: Icon,
  ariaLabel,
  value,
  onChange,
  options,
}: {
  icon: ComponentType<{ className?: string }>;
  ariaLabel: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={ariaLabel} className="max-w-[15rem]">
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            <SelectValue />
          </span>
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Hint({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "error";
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <p
        className={
          tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
        }
      >
        {children}
      </p>
    </div>
  );
}
