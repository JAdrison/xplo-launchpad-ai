import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CustomField = { id: string; entity_type: "deal" | "client"; name: string; field_type: string; required: boolean };

interface Props {
  inDialog?: boolean;
  onChanged?: () => void;
}

export function FieldsConfig({ inDialog = false, onChanged }: Props) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [editing, setEditing] = useState<Partial<CustomField> | null>(null);

  const fetch = async () => {
    const { data } = await supabase.from("custom_fields").select("*").order("sort_order");
    setFields((data ?? []) as CustomField[]);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.entity_type || !editing.field_type) return;
    const payload = {
      name: editing.name,
      entity_type: editing.entity_type as "deal" | "client",
      field_type: editing.field_type as any,
      required: !!editing.required,
    };
    const op = editing.id
      ? supabase.from("custom_fields").update(payload).eq("id", editing.id)
      : supabase.from("custom_fields").insert(payload);
    const { error } = await op;
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setEditing(null);
    fetch();
    onChanged?.();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir campo?")) return;
    await supabase.from("custom_fields").delete().eq("id", id);
    fetch();
    onChanged?.();
  };

  const body = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{fields.length} campo(s)</p>
        <Button size="sm" onClick={() => setEditing({ name: "", entity_type: "deal", field_type: "text", required: false })}>
          <Plus className="mr-2 h-4 w-4" />Novo campo
        </Button>
      </div>
      {fields.map((f) => (
        <div key={f.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{f.entity_type === "deal" ? "Negócio" : "Cliente"}</Badge>
            <span className="font-medium">{f.name}</span>
            <Badge variant="secondary">{f.field_type}</Badge>
            {f.required && <Badge variant="destructive">obrigatório</Badge>}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => setEditing(f)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => del(f.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      {fields.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum campo customizado.</p>}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar campo" : "Novo campo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div>
              <Label>Aplica-se a</Label>
              <Select value={editing?.entity_type} onValueChange={(v) => setEditing({ ...editing!, entity_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deal">Negócio</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={editing?.field_type} onValueChange={(v) => setEditing({ ...editing!, field_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="select">Seleção</SelectItem>
                  <SelectItem value="multi_select">Multi-seleção</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editing?.required} onChange={(e) => setEditing({ ...editing!, required: e.target.checked })} />
              Campo obrigatório
            </label>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (inDialog) return body;
  return (
    <Card>
      <CardHeader><CardTitle>Campos customizáveis</CardTitle></CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
