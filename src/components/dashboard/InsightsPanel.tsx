import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, AlertCircle, Rocket, Megaphone, LucideIcon, ArrowRight } from "lucide-react";

export interface InsightItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  href: string;
  tone: "warning" | "info" | "success";
}

interface Props {
  insights: InsightItem[];
  isLoading?: boolean;
}

const toneStyles: Record<InsightItem["tone"], { bar: string; icon: string; iconBg: string }> = {
  warning: {
    bar: "bg-[hsl(var(--warning))]",
    icon: "text-[hsl(var(--warning))]",
    iconBg: "bg-[hsl(var(--warning))]/10",
  },
  info: {
    bar: "bg-primary",
    icon: "text-primary",
    iconBg: "bg-primary/10",
  },
  success: {
    bar: "bg-[hsl(var(--success))]",
    icon: "text-[hsl(var(--success))]",
    iconBg: "bg-[hsl(var(--success))]/10",
  },
};

export function InsightsPanel({ insights, isLoading }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Insights IA</CardTitle>
            <CardDescription>Análises automáticas do seu workspace</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Tudo em dia! Sem pendências detectadas.
            </p>
          </div>
        ) : (
          insights.map((insight) => {
            const style = toneStyles[insight.tone];
            const Icon = insight.icon;
            return (
              <div
                key={insight.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className={`absolute inset-y-0 left-0 w-[3px] ${style.bar}`} />
                <div className="flex items-start gap-3 pl-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${style.iconBg} ${style.icon}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{insight.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                    <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-xs gap-1">
                      <Link to={insight.href}>
                        {insight.cta}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export const INSIGHT_ICONS = { AlertCircle, Rocket, Megaphone };
