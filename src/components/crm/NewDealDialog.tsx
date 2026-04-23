import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { parseBRLToCents } from "@/lib/crmFormat";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pipelineId: string;
  initialColumnId: string;
  onCreated: () => void;
}

interface ClientLite { id: string; name: string; }

export function NewDealDialog({ open, onOpenChange, pipelineId, initialColumnId, onCreated }: Props) {
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [name, setName] = useState("");
  const [valueStr, setValueStr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("clients").select("id, name").order("name").then(({ data }) => {
      setClients((data ?? []) as ClientLite[]);
    });
    setClientId("");
    setName("");
    setValueStr("");
  }, [open]);

  const handleClientChange = (id: string) => {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c && !name) setName(c.name);
  };

  const submit = async () => {
    if (!clientId) {
      toast({ title: "Selecione um cliente", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("deals").insert({
      client_id: clientId,
      pipeline_id: pipelineId,
      column_id: initialColumnId,
      name: name || "Negócio",
      value_cents: parseBRLToCents(valueStr),
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar negócio", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Negócio criado" });
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo negócio</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome do negócio</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Projeto Tráfego Pago" />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input value={valueStr} onChange={(e) => setValueStr(e.target.value)} placeholder="1500,00" inputMode="decimal" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
