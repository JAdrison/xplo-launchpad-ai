import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Template = { id: string; name: string; type: string; default_subject: string | null; default_description: string | null; default_duration_minutes: number | null };

interface Props {
  inDialog?: boolean;
  onChanged?: () => void;
}

export function TemplatesConfig({ inDialog = false, onChanged }: Props) {
  const [items, setItems] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);

  const fetch = async () => {
    const { data } = await supabase.from("activity_templates").select("*").order("name");
    setItems((data ?? []) as Template[]);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.type) return;
    const payload = {
      name: editing.name,
      type: editing.type as any,
      default_subject: editing.default_subject ?? null,
      default_description: editing.default_description ?? null,
      default_duration_minutes: editing.default_duration_minutes ?? null,
    };
    const op = editing.id
      ? supabase.from("activity_templates").update(payload).eq("id", editing.id)
      : supabase.from("activity_templates").insert(payload);
    const { error } = await op;
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setEditing(null);
    fetch();
    onChanged?.();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir template?")) return;
    await supabase.from("activity_templates").delete().eq("id", id);
    fetch();
    onChanged?.();
  };

  const body = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} template(s)</p>
        <Button size="sm" onClick={() => setEditing({ name: "", type: "lembrete" })}><Plus className="mr-2 h-4 w-4" />Novo template</Button>
      </div>
      {items.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{t.name}</span>
              <Badge variant="secondary">{t.type}</Badge>
              {t.default_duration_minutes && <Badge variant="outline">{t.default_duration_minutes}min</Badge>}
            </div>
            {t.default_subject && <div className="text-xs text-muted-foreground mt-1">{t.default_subject}</div>}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum template.</p>}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar template" : "Novo template"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={editing?.type} onValueChange={(v) => setEditing({ ...editing!, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lembrete">Lembrete</SelectItem>
                  <SelectItem value="mensagem">Mensagem</SelectItem>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Assunto padrão</Label><Input value={editing?.default_subject ?? ""} onChange={(e) => setEditing({ ...editing!, default_subject: e.target.value })} /></div>
            <div><Label>Descrição padrão</Label><Textarea value={editing?.default_description ?? ""} onChange={(e) => setEditing({ ...editing!, default_description: e.target.value })} /></div>
            <div><Label>Duração (min)</Label><Input type="number" value={editing?.default_duration_minutes ?? ""} onChange={(e) => setEditing({ ...editing!, default_duration_minutes: e.target.value ? Number(e.target.value) : null })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (inDialog) return body;
  return (
    <Card>
      <CardHeader><CardTitle>Templates de atividade</CardTitle></CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
