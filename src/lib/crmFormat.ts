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

export const initialsOf = (name?: string | null) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
