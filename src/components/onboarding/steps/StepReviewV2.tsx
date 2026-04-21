import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, Loader2, ShieldAlert, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { humanizeKey, formatValue } from "../shared/fieldLabels";

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

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="rounded-lg border p-4 space-y-2 text-sm">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: any }) => (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className="col-span-2 break-words">{formatValue(value)}</span>
    </div>
  );

  const RenderJSON = ({ data }: { data: Record<string, any> | null | undefined }) => {
    if (!data || Object.keys(data).length === 0) {
      return <p className="text-muted-foreground italic">Não preenchido</p>;
    }
    return (
      <>
        {Object.entries(data).map(([k, v]) => (
          <Field key={k} label={humanizeKey(k)} value={v} />
        ))}
      </>
    );
  };

  const profileData = (profile?.profile_data as Record<string, any>) || {};
  const marketData = (profile?.market_data as Record<string, any>) || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Revisão Final</CardTitle>
        <CardDescription>Confira tudo antes de concluir o onboarding.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Documento confidencial</AlertTitle>
          <AlertDescription>
            Esta revisão e o PDF gerado contêm credenciais de acesso (Instagram/Facebook) em texto puro.
            Compartilhe apenas com pessoas autorizadas.
          </AlertDescription>
        </Alert>

        {/* Etapa 1 — Cadastro */}
        <Section title="Etapa 1 — Cadastro">
          <Field label="Nome do negócio" value={client?.name} />
          <Field label="Nicho" value={client?.niche_label || client?.niche_type || client?.niche} />
          <Field label="CNPJ" value={client?.cnpj} />
          <Field label="Responsável" value={client?.responsible_name} />
          <Field label="CPF do responsável" value={client?.responsible_cpf} />
          <Field label="E-mail" value={client?.email} />
          <Field label="Telefone" value={client?.phone} />
          <Field label="Faturamento atual" value={profile?.current_revenue} />
          <Field label="Investimento inicial em tráfego" value={profile?.initial_traffic_investment ? `R$ ${profile.initial_traffic_investment}` : null} />
        </Section>

        {/* Etapa 2 — Sobre o negócio */}
        <Section title="Etapa 2 — Sobre o negócio">
          <Field label="Nome do produto/serviço" value={profile?.product_name} />
          <Field label="Descrição" value={profile?.product_description} />
          <Field label="Diferenciais" value={profile?.differentiators} />
          <Field label="Benefícios" value={profile?.benefits} />
          <Field label="Promoções" value={profile?.promotions} />
          <Field label="Ticket médio" value={profile?.average_ticket} />
          <Field label="Modelo de venda" value={profile?.sales_model} />
          <Field label="Região(ões)" value={profile?.region} />
          <Separator className="my-2" />
          <p className="text-xs text-muted-foreground">Campos específicos do nicho:</p>
          <RenderJSON data={profileData} />
        </Section>

        {/* Etapa 3 — Diagnóstico SWOT */}
        <Section title="Etapa 3 — Diagnóstico (Pontos fortes e fracos)">
          {swot ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { k: "💪 Ponto forte do negócio", t: swot.forcas_internas_tags, x: swot.forcas_internas_text },
                { k: "🔧 Ponto fraco do negócio", t: swot.fraquezas_internas_tags, x: swot.fraquezas_internas_text },
                { k: "🌤️ Ponto forte da região", t: swot.forcas_ambiente_tags, x: swot.forcas_ambiente_text },
                { k: "⚠️ Ponto fraco da região", t: swot.fraquezas_ambiente_tags, x: swot.fraquezas_ambiente_text },
              ].map((q) => (
                <div key={q.k} className="rounded-md border p-3 space-y-2">
                  <div className="font-medium text-xs">{q.k}</div>
                  <div className="flex flex-wrap gap-1">
                    {(q.t || []).map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    {(!q.t || q.t.length === 0) && <span className="text-xs text-muted-foreground">Sem tags</span>}
                  </div>
                  {q.x && <p className="text-xs text-muted-foreground">{q.x}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground italic">Não preenchido</p>}
        </Section>

        {/* Etapa 4 — Mercado e acessos */}
        <Section title="Etapa 4 — Mercado e investimento">
          <Field label="Faturamento atual" value={profile?.current_revenue} />
          <Field label="Meta de faturamento" value={profile?.revenue_goal} />
          <Field label="Investimento mensal em marketing" value={profile?.monthly_investment} />
          <Field label="Investimento inicial em tráfego" value={profile?.initial_traffic_investment} />
          <Field label="Tamanho da equipe de vendas" value={profile?.sales_team_size} />
          <Field label="Canais de demanda" value={profile?.demand_channels} />
          <Separator className="my-2" />
          <p className="text-xs text-muted-foreground">Concorrentes e inspirações:</p>
          <Field label="Concorrente 1 — Nome" value={profile?.local_competitor_1?.name} />
          <Field label="Concorrente 1 — Motivo" value={profile?.local_competitor_1?.reason} />
          <Field label="Concorrente 2 — Nome" value={profile?.local_competitor_2?.name} />
          <Field label="Concorrente 2 — Motivo" value={profile?.local_competitor_2?.reason} />
          <Field label="Inspiração 1 — Nome" value={profile?.inspiration_company_1?.name} />
          <Field label="Inspiração 1 — Motivo" value={profile?.inspiration_company_1?.reason} />
          <Field label="Inspiração 2 — Nome" value={profile?.inspiration_company_2?.name} />
          <Field label="Inspiração 2 — Motivo" value={profile?.inspiration_company_2?.reason} />
          {Object.keys(marketData).length > 0 && (
            <>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">Campos específicos do nicho:</p>
              <RenderJSON data={marketData} />
            </>
          )}
        </Section>

        <Section title="Acessos Meta Ads (Instagram / Facebook / WhatsApp)">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-3 w-3 text-destructive" />
            <Badge variant="destructive" className="text-[10px]">CONFIDENCIAL</Badge>
          </div>
          <Field label="Instagram (link)" value={profile?.instagram_link} />
          <Field label="Instagram — login" value={profile?.instagram_login} />
          <Field label="Instagram — senha" value={profile?.instagram_password} />
          <Field label="Facebook — login" value={profile?.facebook_login} />
          <Field label="Facebook — senha" value={profile?.facebook_password} />
          <Field label="WhatsApp comercial" value={profile?.whatsapp_number} />
          <Field label="Google Meu Negócio" value={profile?.google_my_business} />
        </Section>

        {/* Etapa 5 — Perfil dos clientes */}
        <Section title="Etapa 5 — Perfil dos principais clientes">
          <div className="space-y-4">
            <div className="rounded-md border p-3">
              <div className="font-medium text-sm mb-2">Bloco 1 — Cliente que você mais quer</div>
              <RenderJSON data={icp?.bloco1_data as Record<string, any>} />
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium text-sm mb-2">Bloco 2 — Cliente bom, mas não ideal</div>
              <RenderJSON data={icp?.bloco2_data as Record<string, any>} />
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium text-sm mb-2">Bloco 3 — Cliente que você quer evitar</div>
              <RenderJSON data={icp?.bloco3_data as Record<string, any>} />
            </div>
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
