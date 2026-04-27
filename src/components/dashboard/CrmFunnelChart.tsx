import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export interface FunnelStage {
  name: string;
  count: number;
}

interface Props {
  data: FunnelStage[];
  isLoading?: boolean;
  pipelineName?: string | null;
}

export function CrmFunnelChart({ data, isLoading, pipelineName }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Funil CRM</CardTitle>
          <CardDescription>
            {pipelineName ? `Pipeline: ${pipelineName}` : "Distribuição de negócios por etapa"}
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/crm">
            Abrir CRM
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum pipeline configurado ainda.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/crm">Configurar CRM</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.map((stage) => {
              const pct = (stage.count / max) * 100;
              return (
                <div key={stage.name} className="grid grid-cols-[120px_1fr_auto] items-center gap-3">
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {stage.name}
                  </span>
                  <div className="h-7 w-full overflow-hidden rounded-md bg-muted">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-primary to-primary/60 transition-all"
                      style={{ width: `${Math.max(pct, stage.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums">
                    {stage.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
