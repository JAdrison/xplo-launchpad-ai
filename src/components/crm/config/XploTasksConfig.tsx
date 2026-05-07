import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { JOB_FUNCTIONS, JOB_FUNCTION_LABELS, type JobFunction } from "@/lib/jobFunctions";
import { BONUS_LABELS, type XploBonus, type XploPlan } from "@/lib/xploProcessTemplate";

interface Template {
  id: string;
  checkpoint_code: string;
  checkpoint_label: string;
  template_key: string;
  subject: string;
  description: string | null;
  required_plan: XploPlan | null;
  required_bonus: XploBonus | null;
  required_function: JobFunction | null;
  recurrence_days: number | null;
  sort_order: number;
  is_active: boolean;
}

const CHECKPOINTS: Array<{ code: string; label: string }> = [
  { code: "01", label: "Cadastro do cliente" },
  { code: "02", label: "Início do projeto" },
  { code: "03", label: "Estratégia de posicionamento" },
  { code: "04", label: "Configuração de tráfego" },
  { code: "05", label: "Entrega de resultado" },
  { code: "06", label: "Manutenção (recorrente)" },
];

const NONE = "__none__";

export function XploTasksConfig() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("xplo_task_templates" as any)
      .select("*")
      .order("checkpoint_code")
      .order("sort_order");
    if (error) toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    else setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, Template[]>();
    for (const t of items) {
      if (!m.has(t.checkpoint_code)) m.set(t.checkpoint_code, []);
      m.get(t.checkpoint_code)!.push(t);
    }
    return m;
  }, [items]);

  const toggleActive = async (t: Template) => {
    const { error } = await supabase
      .from("xplo_task_templates" as any)
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    load();
  };

  const remove = async (t: Template) => {
    if (!confirm(`Excluir "${t.subject}"? Tarefas já criadas em deals continuarão existindo.`)) return;
    const { error } = await supabase.from("xplo_task_templates" as any).delete().eq("id", t.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    load();
  };

  const save = async () => {
    if (!editing?.subject?.trim() || !editing.checkpoint_code) {
      return toast({ title: "Preencha assunto e checkpoint", variant: "destructive" });
    }
    const cp = CHECKPOINTS.find((c) => c.code === editing.checkpoint_code);
    const payload: any = {
      checkpoint_code: editing.checkpoint_code,
      checkpoint_label: cp?.label.replace(/ \(.*\)$/, "") ?? editing.checkpoint_code,
      subject: editing.subject.trim(),
      description: editing.description?.toString().trim() || null,
      required_plan: editing.required_plan ?? null,
      required_bonus: editing.required_bonus ?? null,
      required_function: editing.required_function ?? null,
      recurrence_days: editing.recurrence_days ?? null,
      is_active: editing.is_active ?? true,
      sort_order: editing.sort_order ?? 999,
      activity_type: "lembrete",
    };
    if (editing.id) {
      const { error } = await supabase.from("xplo_task_templates" as any).update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      payload.template_key =
        editing.template_key?.trim() ||
        `custom_${editing.checkpoint_code}_${Date.now().toString(36)}`;
      const { error } = await supabase.from("xplo_task_templates" as any).insert(payload);
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
    setEditing(null);
    toast({ title: "Tarefa salva", description: "Vale para próximas criações automáticas." });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Tarefas automáticas (XPLO)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Edite o template do processo XPLO. Alterações valem para a <strong>próxima vez</strong> que um deal entrar
          no checkpoint — tarefas já criadas em deals existentes não são alteradas nem removidas.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <Accordion type="multiple" defaultValue={["01"]} className="space-y-2">
            {CHECKPOINTS.map((cp) => {
              const list = grouped.get(cp.code) ?? [];
              return (
                <AccordionItem key={cp.code} value={cp.code} className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <Badge variant="outline" className="font-mono">{cp.code}</Badge>
                      <span className="font-medium">{cp.label}</span>
                      <span className="text-xs text-muted-foreground">({list.length} tarefas)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {list.map((t) => (
                        <div
                          key={t.id}
                          className={`rounded-lg border p-3 ${t.is_active ? "" : "opacity-50 bg-muted/30"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{t.subject}</span>
                                {t.required_plan === "pro" && (
                                  <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-[10px]">PRO</Badge>
                                )}
                                {t.required_bonus && (
                                  <Badge variant="outline" className="text-[10px]">Bônus: {BONUS_LABELS[t.required_bonus]}</Badge>
                                )}
                                {t.required_function && (
                                  <Badge variant="outline" className="text-[10px]">{JOB_FUNCTION_LABELS[t.required_function]}</Badge>
                                )}
                                {t.recurrence_days != null && (
                                  <Badge variant="outline" className="text-[10px]">Recorre {t.recurrence_days}d</Badge>
                                )}
                              </div>
                              {t.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                              <Button size="icon" variant="ghost" onClick={() => setEditing(t)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => remove(t)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          setEditing({
                            checkpoint_code: cp.code,
                            subject: "",
                            description: "",
                            is_active: true,
                            sort_order: list.length + 1,
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar tarefa
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div>
                  <Label>Checkpoint</Label>
                  <Select
                    value={editing.checkpoint_code}
                    onValueChange={(v) => setEditing({ ...editing, checkpoint_code: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHECKPOINTS.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.code} — {c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assunto *</Label>
                  <Input
                    value={editing.subject ?? ""}
                    onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    rows={3}
                    value={editing.description ?? ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Plano exigido</Label>
                    <Select
                      value={editing.required_plan ?? NONE}
                      onValueChange={(v) =>
                        setEditing({ ...editing, required_plan: v === NONE ? null : (v as XploPlan) })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— Qualquer plano —</SelectItem>
                        <SelectItem value="basic">Basic ou superior</SelectItem>
                        <SelectItem value="pro">Apenas Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bônus exigido</Label>
                    <Select
                      value={editing.required_bonus ?? NONE}
                      onValueChange={(v) =>
                        setEditing({ ...editing, required_bonus: v === NONE ? null : (v as XploBonus) })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— Nenhum —</SelectItem>
                        {(Object.keys(BONUS_LABELS) as XploBonus[]).map((b) => (
                          <SelectItem key={b} value={b}>{BONUS_LABELS[b]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Função responsável</Label>
                    <Select
                      value={editing.required_function ?? NONE}
                      onValueChange={(v) =>
                        setEditing({ ...editing, required_function: v === NONE ? null : (v as JobFunction) })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— Sem responsável —</SelectItem>
                        {JOB_FUNCTIONS.map((j) => (
                          <SelectItem key={j} value={j}>{JOB_FUNCTION_LABELS[j]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Recorrência (dias)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Apenas manutenção"
                      value={editing.recurrence_days ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          recurrence_days: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <Label className="text-sm">Tarefa ativa</Label>
                  <Switch
                    checked={editing.is_active ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
