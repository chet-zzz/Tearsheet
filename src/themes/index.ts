/**
 * 主题预设。每个 id 对应 globals.css 里一个 [data-theme="<id>"] 块。
 * 切换主题只改 <html data-theme>，CSS 变量随之变化——报告 spec 与数据完全不动。
 *
 * 想引入更多 shadcnstudio 预设：去 https://shadcnstudio.com/theme-generator 选好风格，
 * 把它导出的 CSS 变量粘进 globals.css 新增一个 [data-theme="<id>"] 块，再在此数组登记即可。
 */
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
}

export const THEMES: ThemePreset[] = [
  { id: "base", name: "中性 Base", description: "默认中性灰，通用报告" },
  { id: "vega", name: "清爽蓝 Vega", description: "蓝色主色，现代清爽" },
  { id: "emerald", name: "财务绿 Emerald", description: "稳重绿，适合财务 / 营收看板" },
  { id: "violet", name: "活力紫 Violet", description: "紫色主色，适合增长 / 运营" },
];

export const DEFAULT_THEME = "base";
const STORAGE_KEY = "report-theme";

/** 应用主题并持久化到 localStorage。 */
export function applyTheme(id: string): void {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* localStorage 不可用时忽略 */
  }
}

/** 读取上次选择的主题，无则回退默认。 */
export function getInitialTheme(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

/** 按序号取图表色（引用 CSS 变量，随主题变化），自动在 5 色调色板内循环。 */
export function chartColor(index: number): string {
  return `var(--chart-${(index % 5) + 1})`;
}
