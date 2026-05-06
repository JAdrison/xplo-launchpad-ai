import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
}

export interface PipelineColumn {
  id: string;
  pipeline_id: string;
  name: string;
  color: string;
  sort_order: number;
  column_type: "normal" | "won" | "lost";
  automation_enabled: boolean;
  checkpoint_code?: string | null;
}

export interface Deal {
  id: string;
  client_id: string;
  pipeline_id: string;
  column_id: string;
  name: string;
  value_cents: number;
  status: "active" | "won" | "lost";
  responsible_id: string | null;
  entered_current_column_at: string;
  closed_at: string | null;
  custom_fields: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export interface DealWithMeta extends Deal {
  client_name?: string;
  client_phone?: string | null;
  activities_total?: number;
  activities_done?: number;
}

export function usePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pipelines")
      .select("*")
      .order("sort_order");
    if (error) toast({ title: "Erro ao carregar pipelines", description: error.message, variant: "destructive" });
    else setPipelines((data ?? []) as Pipeline[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { pipelines, loading, refetch: fetch };
}

export function usePipelineData(pipelineId: string | null) {
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [deals, setDeals] = useState<DealWithMeta[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!pipelineId) return;
    setLoading(true);

    const [colsRes, dealsRes] = await Promise.all([
      supabase.from("pipeline_columns").select("*").eq("pipeline_id", pipelineId).order("sort_order"),
      supabase.from("deals").select("*, clients(name, phone)").eq("pipeline_id", pipelineId).order("sort_order"),
    ]);

    if (colsRes.error) toast({ title: "Erro colunas", description: colsRes.error.message, variant: "destructive" });
    else setColumns((colsRes.data ?? []) as PipelineColumn[]);

    if (dealsRes.error) {
      toast({ title: "Erro negócios", description: dealsRes.error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const baseDeals = (dealsRes.data ?? []).map((d: any) => ({
      ...d,
      client_name: d.clients?.name,
      client_phone: d.clients?.phone,
    })) as DealWithMeta[];

    if (baseDeals.length) {
      const ids = baseDeals.map((d) => d.id);
      const { data: acts } = await supabase
        .from("activities")
        .select("deal_id, status")
        .in("deal_id", ids);
      const counts = new Map<string, { total: number; done: number }>();
      (acts ?? []).forEach((a: any) => {
        const c = counts.get(a.deal_id) ?? { total: 0, done: 0 };
        c.total++;
        if (a.status === "completed") c.done++;
        counts.set(a.deal_id, c);
      });
      baseDeals.forEach((d) => {
        const c = counts.get(d.id);
        d.activities_total = c?.total ?? 0;
        d.activities_done = c?.done ?? 0;
      });
    }

    setDeals(baseDeals);
    setLoading(false);
  }, [pipelineId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime
  useEffect(() => {
    if (!pipelineId) return;
    const ch = supabase
      .channel(`crm-pipeline-${pipelineId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deals", filter: `pipeline_id=eq.${pipelineId}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [pipelineId, fetchAll]);

  const moveDeal = async (dealId: string, newColumnId: string) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, column_id: newColumnId, entered_current_column_at: new Date().toISOString() } : d)));
    const { error } = await supabase.from("deals").update({ column_id: newColumnId }).eq("id", dealId);
    if (error) {
      toast({ title: "Erro ao mover", description: error.message, variant: "destructive" });
      fetchAll();
    }
  };

  return { columns, deals, loading, refetch: fetchAll, moveDeal, setColumns };
}
