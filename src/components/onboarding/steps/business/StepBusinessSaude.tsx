import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Stethoscope, Loader2 } from "lucide-react";
import { TagInput } from "../../shared/TagInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

const ATTENDANCE_TYPES = [
  { id: "presencial", label: "Presencial" },
  { id: "online", label: "Online (teleconsulta)" },
  { id: "domiciliar", label: "Domiciliar" },
];

export function StepBusinessSaude({ clientId, onNext, onPrevious }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [form, setForm] = useState({
    specialty: "",
    secondary_specialties: [] as string[],
    attendance_types: [] as string[],
    locations: [] as string[],
    ticket: "",
    convenios: [] as string[],
    differentiators: [] as string[],
    treatments: [] as string[],
    experiencia: "",
    professional_id: "",
    promotions: "",
  });

  useEffect(() => { void load(); }, [clientId]);

  const load = async () => {
    const { data } = await supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle();
    if (data) {
      const pd: any = (data as any).profile_data || {};
      setProfileId(data.id);
      setForm({
        specialty: pd.specialty || "",
        secondary_specialties: pd.secondary_specialties || [],
        attendance_types: pd.attendance_types || [],
        locations: pd.locations || data.region || [],
        ticket: pd.ticket || data.average_ticket || "",
        convenios: pd.convenios || [],
        differentiators: data.differentiators || [],
        treatments: pd.treatments || data.benefits || [],
        experiencia: pd.experiencia || "",
        professional_id: pd.professional_id || "",
        promotions: data.promotions || "",
      });
    }
    setIsLoading(false);
  };

  const toggleAttendance = (id: string, checked: boolean) => {
    setForm((p) => ({
      ...p,
      attendance_types: checked ? [...p.attendance_types, id] : p.attendance_types.filter((x) => x !== id),
    }));
  };

  const handleSubmit = async () => {
    if (!form.specialty.trim() || form.attendance_types.length === 0 || form.locations.length === 0 || !form.ticket.trim() || form.differentiators.length === 0 || form.treatments.length === 0 || !form.experiencia.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha especialidade, atendimento, localização, ticket, diferenciais, tratamentos e experiência.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const profile_data = {
        specialty: form.specialty,
        secondary_specialties: form.secondary_specialties,
        attendance_types: form.attendance_types,
        locations: form.locations,
        ticket: form.ticket,
        convenios: form.convenios,
        treatments: form.treatments,
        experiencia: form.experiencia,
        professional_id: form.professional_id,
      };
      const payload = {
        profile_data,
        region: form.locations,
        differentiators: form.differentiators,
        benefits: form.treatments,
        average_ticket: form.ticket,
        promotions: form.promotions.trim() || null,
        product_name: form.specialty,
        product_description: form.experiencia,
      };
      if (profileId) {
        await supabase.from("client_profile").update(payload).eq("id", profileId);
      } else {
        await supabase.from("client_profile").insert({ client_id: clientId, ...payload });
      }
      toast({ title: "Dados da clínica salvos" });
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
        <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Sobre a sua clínica / consultório</CardTitle>
        <CardDescription>Vamos entender como você atende e o que oferece.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Especialidade principal *</Label>
            <Input value={form.specialty} onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))} placeholder="💡 Ex: Odontologia, Fisioterapia, Psicologia" />
          </div>
          <div className="space-y-2">
            <Label>Ticket médio por consulta / procedimento *</Label>
            <Input value={form.ticket} onChange={(e) => setForm((p) => ({ ...p, ticket: e.target.value }))} placeholder="💡 Ex: R$ 300 consulta / R$ 2.500 tratamento" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Especialidades secundárias</Label>
          <TagInput value={form.secondary_specialties} onChange={(v) => setForm((p) => ({ ...p, secondary_specialties: v }))} placeholder="💡 Ex: implantodontia, harmonização orofacial" />
        </div>

        <div className="space-y-3">
          <Label>Tipo de atendimento *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ATTENDANCE_TYPES.map((a) => (
              <div key={a.id} className="flex items-center space-x-2">
                <Checkbox
                  id={a.id}
                  checked={form.attendance_types.includes(a.id)}
                  onCheckedChange={(c) => toggleAttendance(a.id, c as boolean)}
                />
                <label htmlFor={a.id} className="text-sm font-medium">{a.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Localização do consultório / clínica *</Label>
          <TagInput value={form.locations} onChange={(v) => setForm((p) => ({ ...p, locations: v }))} placeholder="💡 Ex: Fortaleza, CE — Aldeota" />
        </div>

        <div className="space-y-2">
          <Label>Convênios aceitos</Label>
          <TagInput value={form.convenios} onChange={(v) => setForm((p) => ({ ...p, convenios: v }))} placeholder="💡 Ex: SUS, Unimed, Bradesco Saúde, Particular" />
        </div>

        <div className="space-y-2">
          <Label>Diferenciais do atendimento * (até 5)</Label>
          <TagInput value={form.differentiators} onChange={(v) => setForm((p) => ({ ...p, differentiators: v }))} placeholder="💡 Ex: atendimento humanizado, tecnologia de ponta" max={5} />
        </div>

        <div className="space-y-2">
          <Label>Tratamentos / procedimentos oferecidos *</Label>
          <TagInput value={form.treatments} onChange={(v) => setForm((p) => ({ ...p, treatments: v }))} placeholder="💡 Ex: limpeza, clareamento, implante, botox" />
        </div>

        <div className="space-y-2">
          <Label>O que o paciente vive na experiência? *</Label>
          <Textarea rows={3} value={form.experiencia} onChange={(e) => setForm((p) => ({ ...p, experiencia: e.target.value }))} placeholder="💡 Ex: sensação de cuidado, tranquilidade antes do procedimento" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Registros profissionais</Label>
            <Input value={form.professional_id} onChange={(e) => setForm((p) => ({ ...p, professional_id: e.target.value }))} placeholder="💡 Ex: CRM, CRO, CRP, CREFITO" />
          </div>
          <div className="space-y-2">
            <Label>Promoções ou pacotes ativos</Label>
            <Textarea rows={2} value={form.promotions} onChange={(e) => setForm((p) => ({ ...p, promotions: e.target.value }))} placeholder="💡 Ex: pacote de limpeza semestral" />
          </div>
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
