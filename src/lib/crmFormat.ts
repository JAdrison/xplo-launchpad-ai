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

export const initialsOf = (name?: string | null) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
