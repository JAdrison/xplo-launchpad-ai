import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Trophy, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  column_type: "normal" | "won" | "lost";
}

interface Deal {
  id: string;
  pipeline_id: string;
  column_id: string;
  status: string;
}

interface Pipeline {
  id: string;
  name: string;
  color: string;
}

interface Props {
  clientId: string;
}

export function ClientPipelineBar({ clientId }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);

  const load = async () => {
    const { data: dealRow } = await supabase
      .from("deals")
      .select("id, pipeline_id, column_id, status")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!dealRow) {
      setDeal(null);
      setLoading(false);
      return;
    }
    setDeal(dealRow as Deal);

    const [pipeRes, colsRes] = await Promise.all([
      supabase.from("pipelines").select("id, name, color").eq("id", dealRow.pipeline_id).maybeSingle(),
      supabase
        .from("pipeline_columns")
        .select("id, name, color, sort_order, column_type")
        .eq("pipeline_id", dealRow.pipeline_id)
        .order("sort_order"),
    ]);
    if (pipeRes.data) setPipeline(pipeRes.data as Pipeline);
    if (colsRes.data) setColumns(colsRes.data as Column[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Realtime sync (e.g., movimentação no Kanban)
  useEffect(() => {
    if (!deal?.id) return;
    const channel = supabase
      .channel(`client-pipeline-${deal.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deals", filter: `id=eq.${deal.id}` },
        (payload: any) => {
          const next = payload.new;
          if (next?.column_id) {
            setDeal((prev) => (prev ? { ...prev, column_id: next.column_id, status: next.status } : prev));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [deal?.id]);

  const moveTo = async (columnId: string) => {
    if (!deal || deal.column_id === columnId || moving) return;
    const previous = deal.column_id;
    setMoving(columnId);
    setDeal({ ...deal, column_id: columnId });
    const { error } = await supabase.from("deals").update({ column_id: columnId }).eq("id", deal.id);
    setMoving(null);
    if (error) {
      setDeal({ ...deal, column_id: previous });
      toast.error("Não foi possível mover o lead");
      return;
    }
    const target = columns.find((c) => c.id === columnId);
    toast.success(`Lead movido para "${target?.name}"`);
  };

  if (loading) {
    return (
      <Card className="p-4 sm:p-5 rounded-xl border-border/60">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-9 w-full" />
      </Card>
    );
  }

  if (!deal || columns.length === 0) {
    return (
      <Card className="p-4 sm:p-5 rounded-xl border-border/60 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline</p>
          <p className="text-sm text-foreground mt-1">Nenhum pipeline configurado para este lead.</p>
        </div>
        <button
          onClick={() => navigate("/crm")}
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          Configurar <ExternalLink className="h-3 w-3" />
        </button>
      </Card>
    );
  }

  const currentIdx = columns.findIndex((c) => c.id === deal.column_id);

  return (
    <Card className="p-4 sm:p-5 rounded-xl border-border/60">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Pipeline · <span className="text-foreground/70 normal-case tracking-normal">{pipeline?.name ?? "—"}</span>
        </p>
        <button
          onClick={() => navigate("/crm")}
          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
        >
          Ver no CRM <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {columns.map((col, idx) => {
          const isCurrent = col.id === deal.column_id;
          const isPast = currentIdx >= 0 && idx < currentIdx;
          const isLast = idx === columns.length - 1;
          const isMoving = moving === col.id;

          const Icon =
            col.column_type === "won" ? Trophy : col.column_type === "lost" ? XCircle : isPast ? Check : null;

          return (
            <div key={col.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => moveTo(col.id)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Mover para ${col.name}`}
                disabled={!!moving}
                className={cn(
                  "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                  "hover:scale-[1.03] disabled:opacity-60 disabled:cursor-wait",
                  isCurrent && "text-white shadow-sm ring-2 ring-offset-1 ring-offset-background",
                  !isCurrent && isPast && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",
                  !isCurrent && !isPast && "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground"
                )}
                style={
                  isCurrent
                    ? {
                        backgroundColor: col.color,
                        borderColor: col.color,
                        // @ts-expect-error CSS var
                        "--tw-ring-color": col.color,
                      }
                    : undefined
                }
              >
                {isMoving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : Icon ? (
                  <Icon className="h-3 w-3" />
                ) : (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isCurrent ? "bg-white" : "bg-current opacity-60"
                    )}
                  />
                )}
                {col.name}
              </button>

              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 w-4 sm:w-8 rounded-full transition-colors",
                    isPast || isCurrent ? "bg-primary/40" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
