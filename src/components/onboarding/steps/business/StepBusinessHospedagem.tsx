import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Hotel, Loader2 } from "lucide-react";
import { TagInput } from "../../shared/TagInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

const HOSP_TYPES = ["Pousada", "Chalé", "Casa de praia", "Casa de serra", "Apartamento de temporada", "Flat", "Hostel", "Hotel", "Outro"];

export function StepBusinessHospedagem({ clientId, onNext, onPrevious }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "",
    locations: [] as string[],
    units: "",
    diaria: "",
    differentiators: [] as string[],
    comodidades: [] as string[],
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
        type: pd.type || "",
        locations: pd.locations || data.region || [],
        units: pd.units || "",
        diaria: pd.diaria || data.average_ticket || "",
        differentiators: data.differentiators || [],
        comodidades: pd.comodidades || [],
        experiencia: pd.experiencia || "",
        extras: pd.extras || "",
        promotions: data.promotions || "",
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.type || form.locations.length === 0 || !form.units || !form.diaria.trim() || form.differentiators.length === 0 || !form.experiencia.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha tipo, localização, unidades, diária, diferenciais e experiência.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const profile_data = {
        type: form.type,
        locations: form.locations,
        units: form.units,
        diaria: form.diaria,
        comodidades: form.comodidades,
        experiencia: form.experiencia,
        extras: form.extras,
      };
      const payload = {
        profile_data,
        region: form.locations,
        differentiators: form.differentiators,
        average_ticket: form.diaria,
        promotions: form.promotions.trim() || null,
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
        <CardTitle className="flex items-center gap-2"><Hotel className="h-5 w-5" /> Sobre a sua hospedagem</CardTitle>
        <CardDescription>Vamos entender o que torna sua hospedagem especial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de hospedagem *</Label>
            <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{HOSP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Número de unidades / quartos *</Label>
            <Input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={form.units}
              onChange={(e) => setForm((p) => ({ ...p, units: e.target.value.replace(/\D/g, "") }))}
              placeholder="💡 Ex: 6"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Localização *</Label>
          <TagInput value={form.locations} onChange={(v) => setForm((p) => ({ ...p, locations: v }))} placeholder="💡 Ex: Canoa Quebrada, CE — Praia" />
        </div>

        <div className="space-y-2">
          <Label>Valor médio da diária *</Label>
          <Input value={form.diaria} onChange={(e) => setForm((p) => ({ ...p, diaria: e.target.value }))} placeholder="💡 Ex: R$ 450 fds / R$ 300 semana" />
        </div>

        <div className="space-y-2">
          <Label>Diferenciais da hospedagem * (até 5)</Label>
          <TagInput value={form.differentiators} onChange={(v) => setForm((p) => ({ ...p, differentiators: v }))} placeholder="💡 Ex: piscina privativa, café incluso, pet-friendly" max={5} />
        </div>

        <div className="space-y-2">
          <Label>Comodidades e estrutura</Label>
          <TagInput value={form.comodidades} onChange={(v) => setForm((p) => ({ ...p, comodidades: v }))} placeholder="💡 Ex: ar-cond, churrasqueira, internet, estacionamento" />
        </div>

        <div className="space-y-2">
          <Label>Experiência que o hóspede vai viver *</Label>
          <Textarea rows={3} value={form.experiencia} onChange={(e) => setForm((p) => ({ ...p, experiencia: e.target.value }))} placeholder="💡 Ex: descanso e desconexão, aventura na natureza, romance para casais" />
        </div>

        <div className="space-y-2">
          <Label>O que você entrega além da acomodação?</Label>
          <Textarea rows={2} value={form.extras} onChange={(e) => setForm((p) => ({ ...p, extras: e.target.value }))} placeholder="💡 Ex: café da manhã, passeios, transfers, kits especiais" />
        </div>

        <div className="space-y-2">
          <Label>Promoções ou pacotes ativos</Label>
          <Textarea rows={2} value={form.promotions} onChange={(e) => setForm((p) => ({ ...p, promotions: e.target.value }))} placeholder="💡 Ex: pacote casal, desconto semana inteira" />
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
