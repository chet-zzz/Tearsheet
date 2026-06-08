import { useEffect, useState } from "react";
import { reportList } from "@/reports";
import { loadReport, type LoadedReport } from "@/runtime/loadReport";
import { ReportRenderer } from "@/runtime/ReportRenderer";
import { THEMES, applyTheme, getInitialTheme } from "@/themes";

export function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [reportId, setReportId] = useState(reportList[0]?.id ?? "");
  const [loaded, setLoaded] = useState<LoadedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1680px] items-center gap-3 px-4 py-3 lg:px-8">
          <span className="text-sm font-semibold">报告平台</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            json-render
          </span>
          <div className="ml-auto flex items-center gap-2">
            {reportList.length > 0 && (
              <Picker
                label="报告"
                value={reportId}
                onChange={setReportId}
                options={reportList.map((r) => ({ value: r.id, label: r.title }))}
              />
            )}
            <Picker
              label="风格"
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

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}
      <select
        className="rounded-md border bg-background px-2 py-1 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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
