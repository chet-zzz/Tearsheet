import {
  TrendingUp,
  Banknote,
  Wallet,
  PiggyBank,
  Users,
  ShoppingCart,
  Hash,
  Clock,
  Target,
  AlertTriangle,
  Building2,
  BarChart3,
  Percent,
  type LucideIcon,
} from "lucide-react";

/** 语义图标名 → lucide 组件。KpiCard / StatList 的图标色块共用。 */
export const iconMap: Record<string, LucideIcon> = {
  revenue: Banknote,
  cost: Wallet,
  profit: PiggyBank,
  customers: Users,
  users: Users,
  orders: ShoppingCart,
  count: Hash,
  growth: TrendingUp,
  time: Clock,
  target: Target,
  alert: AlertTriangle,
  building: Building2,
  chart: BarChart3,
  percent: Percent,
};

/** catalog 里图标 prop 的取值集合（保持与 iconMap 同步）。 */
export const ICON_NAMES = [
  "revenue", "cost", "profit", "customers", "users", "orders",
  "count", "growth", "time", "target", "alert", "building", "chart", "percent",
] as const;
