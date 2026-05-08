import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { MESES, formatBRL } from "@/lib/vendasFormat";
import type { GastoAnuncio } from "@/hooks/useVendas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ano: number;
  gastos: GastoAnuncio[];
  onSaved: () => void;
}

export function GastosAnunciosDialog({ open, onOpenChange, ano, gastos, onSaved }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [valor, setValor] = useState("");
  const [leads, setLeads] = useState("");
  const [reunioes, setReunioes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setEditing(null);
  }, [open]);

  const startEdit = (mes: number) => {
    const g = gastos.find((g) => g.mes === mes && g.ano === ano);
    setEditing(mes);
    setValor(g ? String(g.valor_cents / 100) : "");
    setLeads(g?.leads_manual != null ? String(g.leads_manual) : "");
    setReunioes(g?.reunioes_manual != null ? String(g.reunioes_manual) : "");
  };

  const save = async (mes: number) => {
    setSaving(true);
    const payload = {
      mes,
      ano,
      valor_cents: Math.round((parseFloat(valor) || 0) * 100),
      leads_manual: leads === "" ? null : parseInt(leads, 10),
      reunioes_manual: reunioes === "" ? null : parseInt(reunioes, 10),
    };
    const { error } = await supabase
      .from("gastos_anuncios")
      .upsert(payload, { onConflict: "mes,ano" });
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
      return;
    }
    toast({ title: "Gasto salvo" });
    setEditing(null);
    onSaved();
  };

  const totalAno = gastos.filter((g) => g.ano === ano).reduce((acc, g) => acc + g.valor_cents, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gastos em Anúncios — {ano}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          Total anual: <span className="font-semibold text-foreground">{formatBRL(totalAno)}</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y border rounded-md">
          {MESES.map((m, i) => {
            const mes = i + 1;
            const g = gastos.find((g) => g.mes === mes && g.ano === ano);
            const isEditing = editing === mes;
            return (
              <div key={mes} className="p-3 flex items-center gap-3">
                <div className="w-24 text-sm font-medium">{m}</div>
                {isEditing ? (
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Gasto</Label>
                      <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Leads</Label>
                      <Input type="number" placeholder="Auto" value={leads} onChange={(e) => setLeads(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Reuniões</Label>
                      <Input type="number" placeholder="0" value={reunioes} onChange={(e) => setReunioes(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm flex gap-4">
                    <span className="font-semibold">{formatBRL(g?.valor_cents ?? 0)}</span>
                    <span className="text-muted-foreground">Leads: {g?.leads_manual ?? "auto"}</span>
                    <span className="text-muted-foreground">Reuniões: {g?.reunioes_manual ?? 0}</span>
                  </div>
                )}
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button size="icon" variant="ghost" className="h-8 w-8" disabled={saving} onClick={() => save(mes)}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(mes)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
