import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Tag = { id: string; name: string; color: string; pipeline_id: string | null };

interface Props {
  inDialog?: boolean;
  onChanged?: () => void;
}

export function TagsConfig({ inDialog = false, onChanged }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [editing, setEditing] = useState<Partial<Tag> | null>(null);

  const fetch = async () => {
    const { data } = await supabase.from("tags").select("*").order("name");
    setTags((data ?? []) as Tag[]);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!editing?.name) return;
    const payload = { name: editing.name, color: editing.color || "#8B5CF6" };
    const op = editing.id
      ? supabase.from("tags").update(payload).eq("id", editing.id)
      : supabase.from("tags").insert(payload);
    const { error } = await op;
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setEditing(null);
    fetch();
    onChanged?.();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir tag?")) return;
    await supabase.from("tags").delete().eq("id", id);
    fetch();
    onChanged?.();
  };

  const body = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tags.length} tag(s)</p>
        <Button size="sm" onClick={() => setEditing({ name: "", color: "#8B5CF6" })}><Plus className="mr-2 h-4 w-4" />Nova tag</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-full border px-3 py-1">
            <div className="h-3 w-3 rounded-full" style={{ background: t.color }} />
            <span className="text-sm">{t.name}</span>
            <button onClick={() => setEditing(t)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
            <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-sm text-muted-foreground py-4 w-full text-center">Nenhuma tag.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar tag" : "Nova tag"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div><Label>Cor</Label><Input type="color" value={editing?.color ?? "#8B5CF6"} onChange={(e) => setEditing({ ...editing!, color: e.target.value })} className="h-10 w-20" /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (inDialog) return body;
  return (
    <Card>
      <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
