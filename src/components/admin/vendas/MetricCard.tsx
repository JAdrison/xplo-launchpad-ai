import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Props {
  label: string;
  value: string;
  meta?: string;
  variation?: number;
  subtitle?: string;
  icon?: ReactNode;
  iconBg?: string;
}

export function MetricCard({ label, value, meta, variation, subtitle, icon, iconBg = "bg-primary/10 text-primary" }: Props) {
  return (
    <Card className="p-5 relative overflow-hidden">
      {icon && (
        <div className={cn("absolute right-4 top-4 h-10 w-10 rounded-full flex items-center justify-center", iconBg)}>
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {meta && <span className="text-sm text-muted-foreground">/ {meta}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {typeof variation === "number" && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              variation > 0 ? "text-emerald-600" : variation < 0 ? "text-red-600" : "text-muted-foreground"
            )}
          >
            {variation > 0 ? <ArrowUp className="h-3 w-3" /> : variation < 0 ? <ArrowDown className="h-3 w-3" /> : null}
            {variation.toFixed(1)}% vs mês anterior
          </div>
        )}
      </div>
    </Card>
  );
}
