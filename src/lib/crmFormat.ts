import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);

export const parseBRLToCents = (input: string): number => {
  const cleaned = (input || "").replace(/[^\d,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100);
};

export const timeInColumn = (date?: string | null) => {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: false });
};

export interface DueState {
  overdue: boolean;
  daysLate: number;
}

/** Calcula se uma tarefa está atrasada e há quantos dias. */
export const getDueState = (scheduledAt: string | null | undefined, status: string | null | undefined): DueState => {
  if (!scheduledAt || status === "completed") return { overdue: false, daysLate: 0 };
  const due = new Date(scheduledAt).getTime();
  const now = Date.now();
  if (due >= now) return { overdue: false, daysLate: 0 };
  return { overdue: true, daysLate: Math.max(1, Math.floor((now - due) / 86400000)) };
};

export type MaintenanceStatus = "none" | "waiting" | "ontrack" | "today" | "overdue";

export interface MaintenanceMeta {
  total: number;
  pending: number;
  overdueCount: number;
  dueTodayCount: number;
  nextDueAt: string | null;
  maxDaysLate: number;
}

/** Deriva o estado visível da manutenção de um deal. */
export const getMaintenanceStatus = (m?: MaintenanceMeta | null): MaintenanceStatus => {
  if (!m || m.total === 0) return "waiting";
  if (m.overdueCount > 0) return "overdue";
  if (m.dueTodayCount > 0) return "today";
  return "ontrack";
};

export const MAINTENANCE_LABEL: Record<MaintenanceStatus, string> = {
  none: "—",
  waiting: "Aguardando início",
  ontrack: "Em dia",
  today: "Para hoje",
  overdue: "Atrasado",
};

/** Classes Tailwind por estado (HSL semântico, com fallback discreto). */
export const MAINTENANCE_CLASSES: Record<MaintenanceStatus, { dot: string; badge: string }> = {
  none:    { dot: "bg-muted",       badge: "bg-muted text-muted-foreground" },
  waiting: { dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-700 border border-slate-200" },
  ontrack: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  today:   { dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-800 border border-amber-200" },
  overdue: { dot: "bg-red-500",     badge: "bg-red-50 text-red-700 border border-red-200" },
};

export const initialsOf = (name?: string | null) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
