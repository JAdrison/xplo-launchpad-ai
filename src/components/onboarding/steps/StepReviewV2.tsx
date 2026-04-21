import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  clientId: string;
  onPrevious: () => void;
  onComplete: () => void;
  isCompleting: boolean;
}

export function StepReviewV2({ clientId, onPrevious, onComplete, isCompleting }: Props) {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [swot, setSwot] = useState<any>(null);
  const [icp, setIcp] = useState<any>(null);

  useEffect(() => { void load(); }, [clientId]);

  const load = async () => {
    const [c, p, s, i] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
      supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("client_swot").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("client_icp").select("*").eq("client_id", clientId).maybeSingle(),
    ]);
    setClient(c.data);
    setProfile(p.data);
    setSwot(s.data);
    setIcp(i.data);
    setLoading(false);
  };

  if (loading) return <Card><CardContent className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

  const mask = (v: string | null) => v ? "••••••••" : "—";

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="rounded-lg border p-4 space-y-2 text-sm">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: any }) => (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className="col-span-2">{Array.isArray(value) ? value.join(", ") || "—" : value || "—"}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Revisão Final</CardTitle>
        <CardDescription>Confira tudo antes de concluir o onboarding.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section title="Cadastro">
          <Field label="Negócio" value={client?.name} />
          <Field label="Nicho" value={client?.niche_label || client?.niche} />
          <Field label="Responsável" value={client?.responsible_name} />
          <Field label="E-mail" value={client?.email} />
          <Field label="Telefone" value={client?.phone} />
          <Field label="Faturamento atual" value={profile?.current_revenue} />
          <Field label="Investimento inicial" value={profile?.initial_traffic_investment ? `R$ ${profile.initial_traffic_investment}` : null} />
        </Section>

        <Section title="Sobre o negócio">
          {profile?.profile_data && Object.entries(profile.profile_data as Record<string, any>).map(([k, v]) => (
            <Field key={k} label={k} value={Array.isArray(v) ? v : String(v)} />
          ))}
        </Section>

        <Section title="O que é bom e o que pode melhorar">
          {swot ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { k: "💪 Forças internas", t: swot.forcas_internas_tags, x: swot.forcas_internas_text },
                { k: "🔧 Fraquezas internas", t: swot.fraquezas_internas_tags, x: swot.fraquezas_internas_text },
                { k: "🌤️ Forças do ambiente", t: swot.forcas_ambiente_tags, x: swot.forcas_ambiente_text },
                { k: "⚠️ Fraquezas do ambiente", t: swot.fraquezas_ambiente_tags, x: swot.fraquezas_ambiente_text },
              ].map((q) => (
                <div key={q.k} className="rounded-md border p-3 space-y-2">
                  <div className="font-medium text-xs">{q.k}</div>
                  <div className="flex flex-wrap gap-1">
                    {(q.t || []).map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                  {q.x && <p className="text-xs text-muted-foreground">{q.x}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground">Não preenchido</p>}
        </Section>

        <Section title="Mercado e acessos">
          <Field label="Concorrente 1" value={profile?.local_competitor_1?.name} />
          <Field label="Concorrente 2" value={profile?.local_competitor_2?.name} />
          <Field label="Referência" value={profile?.inspiration_company_1?.name} />
          <Separator className="my-2" />
          <Field label="Instagram" value={profile?.instagram_login} />
          <Field label="Senha IG" value={mask(profile?.instagram_password)} />
          <Field label="Facebook" value={profile?.facebook_login} />
          <Field label="Senha FB" value={mask(profile?.facebook_password)} />
          <Field label="WhatsApp" value={profile?.whatsapp_number} />
        </Section>

        <Section title="Perfil dos clientes">
          <div className="space-y-2">
            <div><span className="font-medium">Bloco 1:</span> {(icp?.bloco1_data as any)?.motivacao || "—"}</div>
            <div><span className="font-medium">Bloco 2:</span> {(icp?.bloco2_data as any)?.motivacao || "—"}</div>
            <div><span className="font-medium">Bloco 3 (evitar):</span> {(icp?.bloco3_data as any)?.nao_funciona || "—"}</div>
          </div>
        </Section>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="gap-2"><ArrowLeft className="h-4 w-4" /> Anterior</Button>
          <Button onClick={onComplete} disabled={isCompleting} className="gap-2" size="lg">
            {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Concluir Onboarding <CheckCircle className="h-4 w-4" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
