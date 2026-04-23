import { useEffect, useMemo, useState } from "react";
import { format, isToday, isThisWeek, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, MessageSquare, Phone, Mail, CheckCircle2, Circle, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealDetailModal } from "@/components/crm/DealDetailModal";
import { cn } from "@/lib/utils";

interface ActivityRow {
  id: string;
  deal_id: string;
  client_id: string;
  type: "lembrete" | "mensagem" | "ligacao" | "email";
  subject: string;
  scheduled_at: string | null;
  responsible_id: string | null;
  status: "pending" | "completed";
  auto_generated: boolean;
  deals?: {
    name: string;
    pipeline_id: string;
    column_id: string;
    pipelines?: { name: string };
    pipeline_columns?: { name: string; color: string };
  };
  clients?: { name: string };
}

const TYPE_ICONS = {
  lembrete: Bell,
  mensagem: MessageSquare,
  ligacao: Phone,
  email: Mail,
} as const;

const TYPE_COLORS = {
  lembrete: "text-amber-600",
  mensagem: "text-blue-600",
  ligacao: "text-green-600",
  email: "text-purple-600",
} as const;

type Scope = "mine" | "all";
type Bucket = "late" | "today" | "week" | "upcoming" | "completed";

export default function CrmActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [pipelines, setPipelines] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [scope, setScope] = useState<Scope>("all");
  const [bucket, setBucket] = useState<Bucket>("late");
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");

  const [openDealId, setOpenDealId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [actsRes, pipesRes] = await Promise.all([
      supabase
        .from("activities")
        .select("*, deals(name, pipeline_id, column_id, pipelines(name), pipeline_columns(name, color)), clients(name)")
        .order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase.from("pipelines").select("id, name").order("sort_order"),
    ]);

    if (actsRes.error) {
      toast({ title: "Erro", description: actsRes.error.message, variant: "destructive" });
    } else {
      setActivities((actsRes.data ?? []) as unknown as ActivityRow[]);
    }
    if (pipesRes.data) setPipelines(pipesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleStatus = async (act: ActivityRow) => {
    const newStatus = act.status === "completed" ? "pending" : "completed";
    const completed_at = newStatus === "completed" ? new Date().toISOString() : null;
    setActivities((prev) =>
      prev.map((a) => (a.id === act.id ? { ...a, status: newStatus } : a))
    );
    const { error } = await supabase
      .from("activities")
      .update({ status: newStatus, completed_at })
      .eq("id", act.id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      fetchAll();
    }
  };

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (scope === "mine" && a.responsible_id !== user?.id) return false;
      if (pipelineFilter !== "all" && a.deals?.pipeline_id !== pipelineFilter) return false;

      const scheduled = a.scheduled_at ? new Date(a.scheduled_at) : null;
      const isCompleted = a.status === "completed";

      switch (bucket) {
        case "late":
          return !isCompleted && scheduled && isPast(scheduled) && !isToday(scheduled);
        case "today":
          return !isCompleted && scheduled && isToday(scheduled);
        case "week":
          return !isCompleted && scheduled && isThisWeek(scheduled, { locale: ptBR });
        case "upcoming":
          return !isCompleted && scheduled && !isPast(scheduled);
        case "completed":
          return isCompleted;
      }
    });
  }, [activities, scope, bucket, pipelineFilter, user]);

  const counts = useMemo(() => {
    const base = activities.filter((a) => {
      if (scope === "mine" && a.responsible_id !== user?.id) return false;
      if (pipelineFilter !== "all" && a.deals?.pipeline_id !== pipelineFilter) return false;
      return true;
    });
    const c = { late: 0, today: 0, week: 0, upcoming: 0, completed: 0 };
    for (const a of base) {
      const s = a.scheduled_at ? new Date(a.scheduled_at) : null;
      if (a.status === "completed") { c.completed++; continue; }
      if (!s) continue;
      if (isPast(s) && !isToday(s)) c.late++;
      if (isToday(s)) c.today++;
      if (isThisWeek(s, { locale: ptBR })) c.week++;
      if (!isPast(s)) c.upcoming++;
    }
    return c;
  }, [activities, scope, pipelineFilter, user]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-xl font-semibold mb-1">Atividades</h1>
        <p className="text-sm text-muted-foreground">Visão geral de todas as tarefas dos pipelines.</p>
      </div>

      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="mine">Minhas</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pipelines</SelectItem>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={bucket} onValueChange={(v) => setBucket(v as Bucket)} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-3">
          <TabsList>
            <TabsTrigger value="late" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
              🔴 Em atraso <Badge variant="secondary" className="ml-2">{counts.late}</Badge>
            </TabsTrigger>
            <TabsTrigger value="today">
              🟡 Hoje <Badge variant="secondary" className="ml-2">{counts.today}</Badge>
            </TabsTrigger>
            <TabsTrigger value="week">
              🟠 Semana <Badge variant="secondary" className="ml-2">{counts.week}</Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              🔵 Próximas <Badge variant="secondary" className="ml-2">{counts.upcoming}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              🟣 Concluídas <Badge variant="secondary" className="ml-2">{counts.completed}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={bucket} className="flex-1 overflow-y-auto px-4 py-3 mt-0">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma atividade neste filtro.</p>
          ) : (
            <ul className="space-y-2 max-w-3xl mx-auto">
              {filtered.map((a) => {
                const Icon = TYPE_ICONS[a.type];
                const colorClass = TYPE_COLORS[a.type];
                const scheduled = a.scheduled_at ? new Date(a.scheduled_at) : null;
                const isCompleted = a.status === "completed";
                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                  >
                    <button onClick={() => toggleStatus(a)} className="mt-0.5 shrink-0" aria-label="Concluir">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      )}
                    </button>

                    <Icon className={cn("h-4 w-4 mt-1 shrink-0", colorClass)} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium", isCompleted && "line-through text-muted-foreground")}>
                          {a.subject}
                        </p>
                        {scheduled && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(scheduled, "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <button
                          onClick={() => setOpenDealId(a.deal_id)}
                          className="text-xs text-primary hover:underline"
                        >
                          {a.clients?.name ?? "Cliente"} · {a.deals?.name ?? "Negócio"}
                        </button>
                        {a.deals?.pipeline_columns?.name && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4">
                            {a.deals.pipelines?.name} → {a.deals.pipeline_columns.name}
                          </Badge>
                        )}
                        {a.auto_generated && (
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">auto</Badge>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <DealDetailModal dealId={openDealId} onClose={() => setOpenDealId(null)} onChanged={fetchAll} />
    </div>
  );
}
