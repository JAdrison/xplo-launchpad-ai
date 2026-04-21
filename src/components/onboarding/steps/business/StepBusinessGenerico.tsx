import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Building, Loader2 } from "lucide-react";
import { TagInput } from "../../shared/TagInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

const OPERATION_MODELS = [
  { v: "produto_fisico", l: "Produto físico" },
  { v: "servico", l: "Serviço" },
  { v: "assinatura", l: "Assinatura" },
  { v: "curso", l: "Curso" },
  { v: "consultoria", l: "Consultoria" },
  { v: "hibrido", l: "Híbrido" },
];

export function StepBusinessGenerico({ clientId, onNext, onPrevious }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [form, setForm] = useState({
    product: "",
    operation_model: "",
    locations: [] as string[],
    ticket: "",
    differentiators: [] as string[],
    products_list: [] as string[],
    experiencia: "",
    extras: "",
    promotions: "",
  });

  useEffect(() => { void load(); }, [clientId]);

  const load = async () => {
    const { data } = await supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle();
    if (data) {
      const pd: any = (data as any).profile_data || {};
      setProfileId(data.id);
      setForm({
        product: pd.product || data.product_name || "",
        operation_model: pd.operation_model || "",
        locations: pd.locations || data.region || [],
        ticket: pd.ticket || data.average_ticket || "",
        differentiators: data.differentiators || [],
        products_list: pd.products_list || data.benefits || [],
        experiencia: pd.experiencia || "",
        extras: pd.extras || "",
        promotions: data.promotions || "",
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.product.trim() || !form.operation_model || form.locations.length === 0 || !form.ticket.trim() || form.differentiators.length === 0 || form.products_list.length === 0 || !form.experiencia.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha produto, modelo, localização, ticket, diferenciais, produtos e experiência.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const profile_data = {
        product: form.product,
        operation_model: form.operation_model,
        locations: form.locations,
        ticket: form.ticket,
        products_list: form.products_list,
        experiencia: form.experiencia,
        extras: form.extras,
      };
      const payload = {
        profile_data,
        region: form.locations,
        differentiators: form.differentiators,
        benefits: form.products_list,
        average_ticket: form.ticket,
        promotions: form.promotions.trim() || null,
        product_name: form.product,
        product_description: form.experiencia,
      };
      if (profileId) {
        await supabase.from("client_profile").update(payload).eq("id", profileId);
      } else {
        await supabase.from("client_profile").insert({ client_id: clientId, ...payload });
      }
      toast({ title: "Dados do negócio salvos" });
      onNext();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Card><CardContent className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Sobre o seu negócio</CardTitle>
        <CardDescription>Vamos entender o que você vende e como entrega valor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>O que você vende / oferece *</Label>
            <Input value={form.product} onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))} placeholder="💡 Produto principal ou serviço central" />
          </div>
          <div className="space-y-2">
            <Label>Modelo de operação *</Label>
            <Select value={form.operation_model} onValueChange={(v) => setForm((p) => ({ ...p, operation_model: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{OPERATION_MODELS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Localização / área de atuação *</Label>
          <TagInput value={form.locations} onChange={(v) => setForm((p) => ({ ...p, locations: v }))} placeholder='💡 Ex: Cidade, estado OU "Brasil inteiro" / "Online"' />
        </div>

        <div className="space-y-2">
          <Label>Ticket médio *</Label>
          <Input value={form.ticket} onChange={(e) => setForm((p) => ({ ...p, ticket: e.target.value }))} placeholder="💡 Ex: R$ 150 a R$ 500" />
        </div>

        <div className="space-y-2">
          <Label>Diferenciais do negócio * (até 5)</Label>
          <TagInput value={form.differentiators} onChange={(v) => setForm((p) => ({ ...p, differentiators: v }))} placeholder="💡 O que te diferencia da concorrência" max={5} />
        </div>

        <div className="space-y-2">
          <Label>Principais produtos / serviços *</Label>
          <TagInput value={form.products_list} onChange={(v) => setForm((p) => ({ ...p, products_list: v }))} placeholder="💡 Lista do seu catálogo" />
        </div>

        <div className="space-y-2">
          <Label>Como é a experiência do cliente com você? *</Label>
          <Textarea rows={3} value={form.experiencia} onChange={(e) => setForm((p) => ({ ...p, experiencia: e.target.value }))} placeholder="💡 O que ele sente, vive, recebe" />
        </div>

        <div className="space-y-2">
          <Label>O que entrega além do produto/serviço principal?</Label>
          <Textarea rows={2} value={form.extras} onChange={(e) => setForm((p) => ({ ...p, extras: e.target.value }))} placeholder="💡 Pós-venda, garantia, brindes, acompanhamento" />
        </div>

        <div className="space-y-2">
          <Label>Promoções ou pacotes ativos</Label>
          <Textarea rows={2} value={form.promotions} onChange={(e) => setForm((p) => ({ ...p, promotions: e.target.value }))} />
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="gap-2"><ArrowLeft className="h-4 w-4" /> Anterior</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Próximo <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
