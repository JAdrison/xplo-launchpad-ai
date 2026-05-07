import { useEffect, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/utils";

interface Props {
  clientId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

const schema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(200),
  cnpj: z.string().trim().max(20).optional().or(z.literal("")),
  niche: z.string().trim().max(120).optional().or(z.literal("")),
  responsible_name: z.string().trim().max(200).optional().or(z.literal("")),
  responsible_cpf: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().max(255).email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  product_description: z.string().trim().max(2000).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormState = z.infer<typeof schema>;

const empty: FormState = {
  name: "", cnpj: "", niche: "", responsible_name: "", responsible_cpf: "",
  email: "", phone: "", product_description: "", notes: "",
};

export function EditClientDialog({ clientId, open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !clientId) return;
    setLoading(true);
    supabase.from("clients")
      .select("name, cnpj, niche, responsible_name, responsible_cpf, email, phone, product_description, notes")
      .eq("id", clientId).maybeSingle()
      .then(({ data, error }) => {
        if (error) toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
        else if (data) setForm({
          name: data.name ?? "",
          cnpj: data.cnpj ?? "",
          niche: data.niche ?? "",
          responsible_name: data.responsible_name ?? "",
          responsible_cpf: data.responsible_cpf ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          product_description: data.product_description ?? "",
          notes: data.notes ?? "",
        });
        setLoading(false);
      });
  }, [open, clientId]);

  const update = (k: keyof FormState, v: string) => {
    let val = v;
    if (k === "cnpj") val = maskCNPJ(v);
    else if (k === "responsible_cpf") val = maskCPF(v);
    else if (k === "phone") val = maskPhone(v);
    setForm((p) => ({ ...p, [k]: val }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Dados inválidos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v && String(v).trim() !== "" ? v : (k === "name" ? v : null)])
    );
    const { error } = await supabase.from("clients").update(payload).eq("id", clientId);
    setSaving(false);
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Cliente atualizado" });
      onSaved?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar dados do cliente</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline" /> Carregando…
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Empresa</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome do Cliente *</Label>
                  <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={form.cnpj ?? ""} onChange={(e) => update("cnpj", e.target.value)} placeholder="00.000.000/0000-00" disabled={saving} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="niche">Nicho / Segmento</Label>
                <Input id="niche" value={form.niche ?? ""} onChange={(e) => update("niche", e.target.value)} disabled={saving} />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Responsável</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="responsible_name">Nome</Label>
                  <Input id="responsible_name" value={form.responsible_name ?? ""} onChange={(e) => update("responsible_name", e.target.value)} disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="responsible_cpf">CPF</Label>
                  <Input id="responsible_cpf" value={form.responsible_cpf ?? ""} onChange={(e) => update("responsible_cpf", e.target.value)} placeholder="000.000.000-00" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} placeholder="(00) 00000-0000" disabled={saving} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product_description">Descrição do produto</Label>
              <Textarea id="product_description" rows={3} value={form.product_description ?? ""} onChange={(e) => update("product_description", e.target.value)} disabled={saving} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={3} value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} disabled={saving} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
