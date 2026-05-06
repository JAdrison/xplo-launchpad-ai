import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, ExternalLink, Plus, Send, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL, initialsOf } from "@/lib/crmFormat";
import { ActivityFormDialog, type ActivityEditable } from "./ActivityFormDialog";
import { PlanBadge } from "@/components/client/PlanBadge";
import type { XploBonus, XploPlan } from "@/lib/xploProcessTemplate";
import { JOB_FUNCTION_LABELS, JOB_FUNCTION_COLORS, type JobFunction } from "@/lib/jobFunctions";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  dealId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

interface DealFull {
  id: string; client_id: string; name: string; value_cents: number;
  status: "active" | "won" | "lost"; column_id: string; pipeline_id: string;
  responsible_id: string | null; entered_current_column_at: string;
}
interface ClientLite { id: string; name: string; phone: string | null; email: string | null; xplo_plan?: XploPlan | null; xplo_bonuses?: XploBonus[] | null; }
interface ColLite { id: string; name: string; color: string; sort_order: number; column_type: string; }
interface Activity {
  id: string; type: "lembrete" | "mensagem" | "ligacao" | "email"; subject: string; description: string | null;
  scheduled_at: string | null; status: string; completed_at: string | null;
  duration_minutes?: number | null;
  checkpoint_code?: string | null; checkpoint_label?: string | null;
  required_plan?: string | null; required_bonus?: string | null; template_key?: string | null;
  recurrence_days?: number | null;
  required_function?: JobFunction | null; responsible_id?: string | null;
}
interface Note { id: string; author_id: string; content: string; created_at: string; }
interface HistoryEvt { id: string; event_type: string; event_data: any; created_at: string; }

export function DealDetailModal({ dealId, onClose, onChanged }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deal, setDeal] = useState<DealFull | null>(null);
  const [client, setClient] = useState<ClientLite | null>(null);
  const [columns, setColumns] = useState<ColLite[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<HistoryEvt[]>([]);
  const [newNote, setNewNote] = useState("");
  const [actDialog, setActDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityEditable | null>(null);

  const open = !!dealId;

  const refetch = async () => {
    if (!dealId) return;
    const { data: d } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
    if (!d) return;
    setDeal(d as DealFull);

    const [cRes, colRes, aRes, nRes, hRes] = await Promise.all([
      supabase.from("clients").select("id, name, phone, email, xplo_plan, xplo_bonuses").eq("id", d.client_id).maybeSingle(),
      supabase.from("pipeline_columns").select("id, name, color, sort_order, column_type").eq("pipeline_id", d.pipeline_id).order("sort_order"),
      supabase.from("activities").select("*").eq("deal_id", dealId).order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase.from("notes").select("*").eq("deal_id", dealId).order("created_at", { ascending: false }),
      supabase.from("deal_history").select("*").eq("deal_id", dealId).order("created_at", { ascending: false }),
    ]);
    if (cRes.data) setClient(cRes.data as ClientLite);
    setColumns((colRes.data ?? []) as ColLite[]);
    setActivities((aRes.data ?? []) as Activity[]);
    setNotes((nRes.data ?? []) as Note[]);
    setHistory((hRes.data ?? []) as HistoryEvt[]);
  };

  useEffect(() => { if (dealId) refetch(); /* eslint-disable-next-line */ }, [dealId]);

  const moveTo = async (columnId: string) => {
    if (!deal) return;
    const { error } = await supabase.from("deals").update({ column_id: columnId }).eq("id", deal.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { refetch(); onChanged(); }
  };

  const toggleActivity = async (a: Activity) => {
    const completed = a.status !== "completed";
    const { error } = await supabase.from("activities").update({
      status: completed ? "completed" : "pending",
      completed_at: completed ? new Date().toISOString() : null,
    }).eq("id", a.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      await supabase.from("deal_history").insert({
        deal_id: a.id ? deal!.id : "", event_type: completed ? "activity_completed" : "activity_created",
        event_data: { activity_id: a.id, subject: a.subject }, actor_id: user?.id ?? null,
      });
      refetch();
    }
  };

  const openEditActivity = (a: Activity) => {
    setEditingActivity({
      id: a.id,
      type: a.type,
      subject: a.subject,
      description: a.description,
      scheduled_at: a.scheduled_at,
      duration_minutes: a.duration_minutes ?? null,
      required_function: a.required_function ?? null,
      recurrence_days: a.recurrence_days ?? null,
    });
    setActDialog(true);
  };

  const deleteActivity = async (a: Activity) => {
    if (!confirm(`Excluir tarefa "${a.subject}"?`)) return;
    const { error } = await supabase.from("activities").delete().eq("id", a.id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else { toast({ title: "Tarefa excluída" }); refetch(); onChanged(); }
  };

  const addNote = async () => {
    if (!newNote.trim() || !deal || !user) return;
    const { error } = await supabase.from("notes").insert({
      deal_id: deal.id, author_id: user.id, content: newNote,
    });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      await supabase.from("deal_history").insert({
        deal_id: deal.id, event_type: "note_added", event_data: { preview: newNote.slice(0, 80) }, actor_id: user.id,
      });
      setNewNote("");
      refetch();
    }
  };

  const closeAs = async (type: "won" | "lost") => {
    if (!deal) return;
    const target = columns.find((c) => c.column_type === type);
    if (!target) {
      toast({ title: "Configure uma coluna do tipo " + type, variant: "destructive" });
      return;
    }
    moveTo(target.id);
  };

  if (!deal || !client) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-5xl">
          <div className="p-8 text-center text-muted-foreground">Carregando…</div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentCol = columns.find((c) => c.id === deal.column_id);
  const overdue = activities.filter((a) => a.status !== "completed" && a.scheduled_at && new Date(a.scheduled_at) < new Date());
  const pending = activities.filter((a) => a.status !== "completed" && !overdue.includes(a));
  const done = activities.filter((a) => a.status === "completed");

  const HISTORY_LABEL: Record<string, string> = {
    created: "Negócio criado", moved: "Movido de etapa", tag_added: "Tag adicionada",
    tag_removed: "Tag removida", activity_created: "Atividade criada",
    activity_completed: "Atividade concluída", value_changed: "Valor alterado",
    responsible_changed: "Responsável alterado", status_changed: "Status alterado",
    note_added: "Nota criada", custom_field_changed: "Campo alterado",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-[85vh]">
          {/* Sidebar */}
          <div className="border-r border-border p-4 overflow-y-auto bg-muted/20">
            <div className="flex flex-col items-center text-center mb-4">
              <Avatar className="h-16 w-16 mb-2">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">{initialsOf(client.name)}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">{client.name}</h3>
              {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
              <Badge
                className="mt-2"
                variant={deal.status === "won" ? "default" : deal.status === "lost" ? "destructive" : "secondary"}
              >
                {deal.status === "won" ? "Ganho" : deal.status === "lost" ? "Perdido" : "Em andamento"}
              </Badge>
              <div className="mt-3">
                <PlanBadge
                  clientId={client.id}
                  plan={(client.xplo_plan as XploPlan) ?? "basic"}
                  bonuses={(client.xplo_bonuses as XploBonus[]) ?? []}
                  size="sm"
                  onChanged={() => { refetch(); onChanged(); }}
                />
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Etapa atual</p>
                <p className="font-medium" style={{ color: currentCol?.color }}>{currentCol?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="font-medium text-primary">{formatBRL(deal.value_cents)}</p>
              </div>
              {client.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3" /> <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3 w-3" /> <span>{client.phone}</span>
                </div>
              )}
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button size="sm" variant="default" className="w-full" onClick={() => closeAs("won")}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Cliente fechado
              </Button>
              <Button size="sm" variant="outline" className="w-full" onClick={() => closeAs("lost")}>
                <XCircle className="h-4 w-4 mr-2" /> Cancelado
              </Button>
              <Button size="sm" variant="ghost" className="w-full" onClick={() => navigate(`/clients/${client.id}`)}>
                <ExternalLink className="h-4 w-4 mr-2" /> Ver onboarding completo
              </Button>
            </div>
          </div>

          {/* Right tabs */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold">{deal.name}</h2>
            </div>
            <Tabs defaultValue="negocios" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-3 w-fit">
                <TabsTrigger value="negocios">Negócios</TabsTrigger>
                <TabsTrigger value="atividades">Atividades</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
              </TabsList>

              {/* Negócios */}
              <TabsContent value="negocios" className="flex-1 overflow-y-auto p-6 mt-0">
                <div className="flex gap-2 flex-wrap mb-6">
                  {columns.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => moveTo(c.id)}
                      className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                        c.id === deal.column_id ? "text-white" : "bg-muted hover:bg-muted/70"
                      }`}
                      style={c.id === deal.column_id ? { backgroundColor: c.color, borderColor: c.color } : { borderColor: c.color }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <h4 className="font-semibold mb-2 text-sm">Checkpoints do processo XPLO</h4>
                {(() => {
                  const groups = new Map<string, { code: string; label: string; items: Activity[] }>();
                  const others: Activity[] = [];
                  for (const a of activities) {
                    if (a.checkpoint_code) {
                      const key = a.checkpoint_code;
                      if (!groups.has(key)) groups.set(key, { code: a.checkpoint_code, label: a.checkpoint_label || "", items: [] });
                      groups.get(key)!.items.push(a);
                    } else {
                      others.push(a);
                    }
                  }
                  const sorted = Array.from(groups.values()).sort((x, y) => x.code.localeCompare(y.code));
                  if (sorted.length === 0 && others.length === 0) {
                    return <p className="text-sm text-muted-foreground">Nenhuma tarefa. Defina o plano do cliente para gerar o processo automaticamente.</p>;
                  }
                  return (
                    <div className="space-y-4">
                      {sorted.map((g) => {
                        const done = g.items.filter((i) => i.status === "completed").length;
                        return (
                          <div key={g.code} className="border border-border rounded-md overflow-hidden">
                            <div className="flex items-center justify-between bg-muted/40 px-3 py-2">
                              <p className="text-sm font-semibold">{g.code} · {g.label}</p>
                              <span className="text-xs text-muted-foreground">{done}/{g.items.length}</span>
                            </div>
                            <div className="divide-y divide-border">
                              {g.items.map((a) => (
                                <div key={a.id} className="flex items-start gap-2 p-2">
                                  <Checkbox checked={a.status === "completed"} onCheckedChange={() => toggleActivity(a)} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className={`text-sm ${a.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{a.subject}</p>
                                      {a.required_plan === "pro" && (
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">Pro</span>
                                      )}
                                      {a.required_bonus && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-primary/30 text-primary">Bônus</span>
                                      )}
                                      {a.recurrence_days && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                          🔁 a cada {a.recurrence_days}d
                                        </span>
                                      )}
                                      {a.required_function && (
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${JOB_FUNCTION_COLORS[a.required_function]}`}>
                                          {JOB_FUNCTION_LABELS[a.required_function]}
                                        </span>
                                      )}
                                    </div>
                                    {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditActivity(a)} title="Editar">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteActivity(a)} title="Excluir">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {others.length > 0 && (
                        <div className="border border-border rounded-md overflow-hidden">
                          <div className="bg-muted/40 px-3 py-2"><p className="text-sm font-semibold">Outras tarefas</p></div>
                          <div className="divide-y divide-border">
                            {others.map((a) => (
                              <div key={a.id} className="flex items-start gap-2 p-2">
                                <Checkbox checked={a.status === "completed"} onCheckedChange={() => toggleActivity(a)} />
                                <p className={`text-sm flex-1 ${a.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{a.subject}</p>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditActivity(a)} title="Editar">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteActivity(a)} title="Excluir">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </TabsContent>

              {/* Atividades */}
              <TabsContent value="atividades" className="flex-1 overflow-y-auto p-6 mt-0">
                <div className="flex justify-end mb-4">
                  <Button size="sm" onClick={() => setActDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Criar atividade
                  </Button>
                </div>
                {[
                  { title: `🔴 Em atraso (${overdue.length})`, list: overdue },
                  { title: `🟠 Pendentes (${pending.length})`, list: pending },
                  { title: `🟣 Concluídas (${done.length})`, list: done },
                ].map((g) => (
                  <div key={g.title} className="mb-5">
                    <h4 className="text-sm font-semibold mb-2">{g.title}</h4>
                    <div className="space-y-2">
                      {g.list.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma.</p>}
                      {g.list.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 p-3 rounded-md border border-border">
                          <Checkbox checked={a.status === "completed"} onCheckedChange={() => toggleActivity(a)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{a.type}</Badge>
                              <p className="text-sm font-medium truncate">{a.subject}</p>
                            </div>
                            {a.scheduled_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Histórico */}
              <TabsContent value="historico" className="flex-1 overflow-y-auto p-6 mt-0">
                <div className="space-y-3">
                  {history.length === 0 && <p className="text-sm text-muted-foreground">Sem histórico.</p>}
                  {history.map((h) => (
                    <div key={h.id} className="flex gap-3 p-3 rounded-md bg-muted/30">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{HISTORY_LABEL[h.event_type] ?? h.event_type}</p>
                        {h.event_data?.preview && <p className="text-xs text-muted-foreground">{h.event_data.preview}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} · há {formatDistanceToNow(new Date(h.created_at), { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Notas */}
              <TabsContent value="notas" className="flex-1 overflow-y-auto p-6 mt-0">
                <div className="flex gap-2 mb-4">
                  <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Escreva uma nota interna…" rows={2} />
                  <Button onClick={addNote} disabled={!newNote.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {notes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma nota.</p>}
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 rounded-md bg-muted/30">
                      <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <ActivityFormDialog
          open={actDialog}
          onOpenChange={setActDialog}
          dealId={deal.id}
          clientId={deal.client_id}
          onCreated={() => { refetch(); onChanged(); }}
        />
      </DialogContent>
    </Dialog>
  );
}
