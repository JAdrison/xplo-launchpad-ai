import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePipelines } from "@/hooks/useCrm";

interface Props {
  inDialog?: boolean;
  onChanged?: () => void;
}

export function PipelinesConfig({ inDialog = false, onChanged }: Props) {
  const { pipelines, refetch } = usePipelines();
  const [editing, setEditing] = useState<{ id?: string; name: string; description: string; color: string } | null>(null);

  const save = async () => {
    if (!editing?.name) return;
    if (editing.id) {
      const { error } = await supabase.from("pipelines").update({
        name: editing.name, description: editing.description, color: editing.color,
      }).eq("id", editing.id);
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("pipelines").insert({
        name: editing.name, description: editing.description, color: editing.color, sort_order: pipelines.length,
      });
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
    setEditing(null);
    refetch();
    onChanged?.();
    toast({ title: "Pipeline salvo" });
  };

  const del = async (id: string) => {
    if (!confirm("Excluir pipeline e todas as colunas/negócios? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("pipelines").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    refetch();
    onChanged?.();
  };

  const list = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pipelines.length} pipeline(s)</p>
        <Button size="sm" onClick={() => setEditing({ name: "", description: "", color: "#8B5CF6" })}>
          <Plus className="mr-2 h-4 w-4" /> Novo pipeline
        </Button>
      </div>
      {pipelines.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded" style={{ background: p.color }} />
            <div>
              <div className="font-medium">{p.name}</div>
              {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => setEditing({ id: p.id, name: p.name, description: p.description ?? "", color: p.color })}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => del(p.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {pipelines.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum pipeline. Crie o primeiro.</p>}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar pipeline" : "Novo pipeline"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing!, description: e.target.value })} /></div>
            <div><Label>Cor</Label><Input type="color" value={editing?.color ?? "#8B5CF6"} onChange={(e) => setEditing({ ...editing!, color: e.target.value })} className="h-10 w-20" /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (inDialog) return list;

  return (
    <Card>
      <CardHeader><CardTitle>Pipelines</CardTitle></CardHeader>
      <CardContent>{list}</CardContent>
    </Card>
  );
}
