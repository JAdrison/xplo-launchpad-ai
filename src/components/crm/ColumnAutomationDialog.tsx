import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { PipelineColumn } from "@/hooks/useCrm";

interface Automation {
  id: string;
  column_id: string;
  activity_type: "lembrete" | "mensagem" | "ligacao" | "email";
  subject: string;
  description: string | null;
  days_after_entry: number;
  default_duration_minutes: number | null;
  sort_order: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  column: PipelineColumn | null;
  onSaved?: () => void;
}

const TYPE_LABELS = {
  lembrete: "Lembrete",
  mensagem: "Mensagem",
  ligacao: "Ligação",
  email: "E-mail",
} as const;

export function ColumnAutomationDialog({ open, onOpenChange, column, onSaved }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !column) return;
    setEnabled(column.automation_enabled);
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("column_automations")
        .select("*")
        .eq("column_id", column.id)
        .order("sort_order");
      if (error) {
        toast({ title: "Erro ao carregar automações", description: error.message, variant: "destructive" });
      } else {
        setItems((data ?? []) as Automation[]);
      }
      setLoading(false);
    })();
  }, [open, column]);

  const addItem = () => {
    if (!column) return;
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        column_id: column.id,
        activity_type: "lembrete",
        subject: "",
        description: "",
        days_after_entry: 0,
        default_duration_minutes: null,
        sort_order: prev.length,
      },
    ]);
  };

  const updateItem = (idx: number, patch: Partial<Automation>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!column) return;
    const invalid = items.find((it) => !it.subject.trim());
    if (invalid) {
      toast({ title: "Preencha o assunto de todas as tarefas", variant: "destructive" });
      return;
    }
    setSaving(true);

    // 1. Update column.automation_enabled
    const { error: colErr } = await supabase
      .from("pipeline_columns")
      .update({ automation_enabled: enabled })
      .eq("id", column.id);

    if (colErr) {
      toast({ title: "Erro ao salvar coluna", description: colErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // 2. Replace automations: delete existing, insert current
    const { error: delErr } = await supabase
      .from("column_automations")
      .delete()
      .eq("column_id", column.id);

    if (delErr) {
      toast({ title: "Erro ao limpar automações antigas", description: delErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    if (items.length) {
      const payload = items.map((it, i) => ({
        column_id: column.id,
        activity_type: it.activity_type,
        subject: it.subject.trim(),
        description: it.description?.trim() || null,
        days_after_entry: it.days_after_entry,
        default_duration_minutes: it.default_duration_minutes,
        sort_order: i,
      }));
      const { error: insErr } = await supabase.from("column_automations").insert(payload);
      if (insErr) {
        toast({ title: "Erro ao salvar tarefas", description: insErr.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast({ title: "Automações salvas" });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automação — {column?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-sm font-medium">Automação ativa</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quando um negócio entrar nesta coluna, as tarefas abaixo serão criadas automaticamente.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
          ) : (
            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                  Nenhuma tarefa automática configurada.
                </p>
              )}

              {items.map((it, idx) => (
                <div key={it.id} className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Tarefa #{idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={it.activity_type}
                        onValueChange={(v) => updateItem(idx, { activity_type: v as Automation["activity_type"] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_LABELS).map(([k, label]) => (
                            <SelectItem key={k} value={k}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Dias após entrada</Label>
                      <Input
                        type="number"
                        min={0}
                        value={it.days_after_entry}
                        onChange={(e) => updateItem(idx, { days_after_entry: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Assunto *</Label>
                    <Input
                      value={it.subject}
                      onChange={(e) => updateItem(idx, { subject: e.target.value })}
                      placeholder="Ex: Mensagem de boas-vindas"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Descrição</Label>
                    <Textarea
                      rows={2}
                      value={it.description ?? ""}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                    />
                  </div>

                  <div className="w-1/2">
                    <Label className="text-xs">Duração padrão (min)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={it.default_duration_minutes ?? ""}
                      onChange={(e) =>
                        updateItem(idx, {
                          default_duration_minutes: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar tarefa automática
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
