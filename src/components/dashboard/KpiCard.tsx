import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  deltaPct?: number | null;
  deltaLabel?: string;
  isLoading?: boolean;
  accent?: "primary" | "success" | "warning" | "destructive";
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  destructive: "bg-destructive/10 text-destructive",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  deltaPct,
  deltaLabel = "vs. mês anterior",
  isLoading,
  accent = "primary",
}: KpiCardProps) {
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const positive = hasDelta && deltaPct! > 0;
  const negative = hasDelta && deltaPct! < 0;
  const TrendIcon = positive ? TrendingUp : negative ? TrendingDown : Minus;

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)] hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-9 w-24" />
            ) : (
              <p className="mt-1.5 text-3xl font-bold text-foreground tabular-nums">
                {value}
              </p>
            )}
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {isLoading ? (
            <Skeleton className="h-3 w-32" />
          ) : hasDelta ? (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-semibold",
                  positive && "text-[hsl(var(--success))]",
                  negative && "text-destructive",
                  !positive && !negative && "text-muted-foreground",
                )}
              >
                <TrendIcon className="h-3 w-3" />
                {positive ? "+" : ""}
                {deltaPct!.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">{deltaLabel}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Sem dados comparativos</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
