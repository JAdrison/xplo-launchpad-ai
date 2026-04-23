import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pipelineId: string;
  columnsCount: number;
  onCreated?: () => void;
}

export function NewColumnDialog({ open, onOpenChange, pipelineId, columnsCount, onCreated }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  const [columnType, setColumnType] = useState<"normal" | "won" | "lost">("normal");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("pipeline_columns").insert({
      pipeline_id: pipelineId,
      name: name.trim(),
      color,
      column_type: columnType,
      sort_order: columnsCount,
    });
    setSaving(false);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setName("");
    setColor("#8B5CF6");
    setColumnType("normal");
    onOpenChange(false);
    onCreated?.();
    toast({ title: "Coluna criada" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova coluna</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Em negociação" /></div>
          <div>
            <Label>Tipo</Label>
            <Select value={columnType} onValueChange={(v) => setColumnType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="won">Ganho (encerra deal como ganho)</SelectItem>
                <SelectItem value="lost">Perdido (encerra deal como perdido)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Cor</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !name.trim()}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
