import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2 } from "lucide-react";
import type { ClienteVendido, UserOption } from "@/hooks/useVendas";

interface ExistingClient {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: ClienteVendido | null;
  vendedores: UserOption[];
  sdrs: UserOption[];
  onSaved: () => void;
}

export function ClienteFormDialog({ open, onOpenChange, cliente, vendedores, sdrs, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    valor_mensal: "",
    valor_setup: "",
    vendedor_id: "",
    sdr_id: "",
    dia_vencimento: "1",
    observacoes: "",
  });

  const [existingClients, setExistingClients] = useState<ExistingClient[]>([]);
  const [selectedExistingId, setSelectedExistingId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setForm({
        nome: cliente?.nome ?? "",
        valor_mensal: cliente ? String(cliente.valor_mensal_cents / 100) : "",
        valor_setup: cliente ? String(cliente.valor_setup_cents / 100) : "",
        vendedor_id: cliente?.vendedor_id ?? "",
        sdr_id: cliente?.sdr_id ?? "",
        dia_vencimento: String(cliente?.dia_vencimento ?? 1),
        observacoes: cliente?.observacoes ?? "",
      });
      setSelectedExistingId("");
      if (!cliente) {
        supabase
          .from("clients")
          .select("id, name")
          .order("name", { ascending: true })
          .then(({ data }) => setExistingClients((data ?? []) as ExistingClient[]));
      }
    }
  }, [open, cliente]);

  const handleSelectExisting = (id: string) => {
    setSelectedExistingId(id);
    const c = existingClients.find((x) => x.id === id);
    if (c) setForm((f) => ({ ...f, nome: c.name }));
  };

  const handleSave = async () => {
    if (!form.nome.trim() || form.nome.trim().length < 2) {
      toast({ variant: "destructive", title: "Nome inválido", description: "Mínimo 2 caracteres" });
      return;
    }
    const valorMensal = parseFloat(form.valor_mensal);
    if (!valorMensal || valorMensal <= 0) {
      toast({ variant: "destructive", title: "Valor mensal inválido" });
      return;
    }
    const dia = parseInt(form.dia_vencimento, 10);
    if (!dia || dia < 1 || dia > 31) {
      toast({ variant: "destructive", title: "Dia de vencimento inválido", description: "1 a 31" });
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      valor_mensal_cents: Math.round(valorMensal * 100),
      valor_setup_cents: Math.round((parseFloat(form.valor_setup) || 0) * 100),
      vendedor_id: form.vendedor_id || null,
      sdr_id: form.sdr_id || null,
      dia_vencimento: dia,
      observacoes: form.observacoes.trim() || null,
    };
    const res = cliente
      ? await supabase.from("clientes_vendidos").update(payload).eq("id", cliente.id)
      : await supabase.from("clientes_vendidos").insert(payload);
    setSaving(false);
    if (res.error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: res.error.message });
      return;
    }
    toast({ title: cliente ? "Cliente atualizado" : "Cliente cadastrado" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente vendido"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!cliente && existingClients.length > 0 && (
            <>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Puxar de cliente existente
                </Label>
                <Select value={selectedExistingId || "none"} onValueChange={(v) => handleSelectExisting(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente já cadastrado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Cadastro manual —</SelectItem>
                    {existingClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Preenche o nome automaticamente. Você ainda precisa informar valores e responsáveis.</p>
              </div>
              <Separator />
            </>
          )}
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor mensal (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_mensal}
                onChange={(e) => setForm({ ...form, valor_mensal: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor setup (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_setup}
                onChange={(e) => setForm({ ...form, valor_setup: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Vendedor</Label>
              <Select value={form.vendedor_id || "none"} onValueChange={(v) => setForm({ ...form, vendedor_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nenhum —</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.user_id} value={v.user_id}>{v.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>SDR</Label>
              <Select value={form.sdr_id || "none"} onValueChange={(v) => setForm({ ...form, sdr_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nenhum —</SelectItem>
                  {sdrs.map((v) => (
                    <SelectItem key={v.user_id} value={v.user_id}>{v.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Dia de vencimento (1–31) *</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={form.dia_vencimento}
              onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
