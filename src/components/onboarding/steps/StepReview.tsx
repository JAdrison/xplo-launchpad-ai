import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  Package, 
  Users, 
  AlertTriangle, 
  Target,
  Building2,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;
type ClientProfile = Tables<"client_profile">;
type ICP = Tables<"icps">;
type ICPPain = Tables<"icp_pains">;
type ClientPromise = Tables<"client_promise">;

interface StepReviewProps {
  clientId: string;
  onPrevious: () => void;
  onComplete: () => void;
  isCompleting: boolean;
}

interface ReviewData {
  client: Client | null;
  profile: ClientProfile | null;
  icps: ICP[];
  pains: ICPPain[];
  promise: ClientPromise | null;
}

const INVESTMENT_LABELS: Record<string, string> = {
  nenhum: "Nenhum investimento",
  ate_1k: "Até R$ 1.000",
  "1k_5k": "R$ 1.000 - R$ 5.000",
  "5k_10k": "R$ 5.000 - R$ 10.000",
  "10k_20k": "R$ 10.000 - R$ 20.000",
  acima_20k: "Acima de R$ 20.000",
};

const TEAM_SIZE_LABELS: Record<string, string> = {
  solo: "Só eu",
  "1_3": "1 a 3 pessoas",
  "4_10": "4 a 10 pessoas",
  acima_10: "Mais de 10 pessoas",
};

const SALES_MODEL_LABELS: Record<string, string> = {
  b2b: "B2B",
  b2c: "B2C",
  recurring: "Recorrente",
  project: "Por Projeto",
  hybrid: "Híbrido",
};

const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram/Redes Sociais",
  google_ads: "Google Ads",
  facebook_ads: "Facebook/Meta Ads",
  linkedin: "LinkedIn",
  indicacoes: "Indicações",
  eventos: "Eventos",
  organico: "Tráfego Orgânico/SEO",
  email: "E-mail Marketing",
};

export function StepReview({ clientId, onPrevious, onComplete, isCompleting }: StepReviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ReviewData>({
    client: null,
    profile: null,
    icps: [],
    pains: [],
    promise: null,
  });

  useEffect(() => {
    fetchAllData();
  }, [clientId]);

  const fetchAllData = async () => {
    const [clientRes, profileRes, icpsRes, promiseRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
      supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("icps").select("*").eq("client_id", clientId).order("sort_order"),
      supabase.from("client_promise").select("*").eq("client_id", clientId).maybeSingle(),
    ]);

    let pains: ICPPain[] = [];
    if (icpsRes.data && icpsRes.data.length > 0) {
      const icpIds = icpsRes.data.map((icp) => icp.id);
      const { data: painsData } = await supabase
        .from("icp_pains")
        .select("*")
        .in("icp_id", icpIds);
      pains = painsData || [];
    }

    setData({
      client: clientRes.data,
      profile: profileRes.data,
      icps: icpsRes.data || [],
      pains,
      promise: promiseRes.data,
    });

    setIsLoading(false);
  };

  const getChannelLabel = (channel: string) => {
    if (channel.startsWith("outro:")) {
      return channel.replace("outro:", "");
    }
    return CHANNEL_LABELS[channel] || channel;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Revisão Final
        </CardTitle>
        <CardDescription>
          Revise todas as informações antes de concluir o onboarding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Empresa */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4" />
            Empresa
          </h4>
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            {data.client?.niche && (
              <p className="text-sm">
                <span className="text-muted-foreground">Nicho:</span> {data.client.niche}
              </p>
            )}
            {data.profile?.region && (
              <p className="text-sm">
                <span className="text-muted-foreground">Região:</span> {data.profile.region}
              </p>
            )}
            {!data.client?.niche && !data.profile?.region && (
              <p className="text-sm text-muted-foreground italic">Não preenchido</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Produto */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Package className="h-4 w-4" />
            Produto/Serviço
          </h4>
          {data.profile ? (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="font-medium">{data.profile.product_name}</p>
              {data.profile.product_description && (
                <p className="text-sm text-muted-foreground">{data.profile.product_description}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {data.profile.average_ticket && (
                  <span className="text-muted-foreground">
                    Ticket: {data.profile.average_ticket}
                  </span>
                )}
                {data.profile.sales_model && (
                  <span className="text-muted-foreground">
                    Modelo: {SALES_MODEL_LABELS[data.profile.sales_model] || data.profile.sales_model}
                  </span>
                )}
              </div>
              {data.profile.differentiators && data.profile.differentiators.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {data.profile.differentiators.map((diff, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {diff}
                    </Badge>
                  ))}
                </div>
              )}
              {data.profile.benefits && data.profile.benefits.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {data.profile.benefits.map((benefit, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              )}
              {data.profile.promotions && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium">Promoções:</span> {data.profile.promotions}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Não preenchido</p>
          )}
        </div>

        <Separator />

        {/* ICPs */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Users className="h-4 w-4" />
            ICPs ({data.icps.length})
          </h4>
          {data.icps.length > 0 ? (
            <div className="space-y-3">
              {data.icps.map((icp) => (
                <div key={icp.id} className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-medium">{icp.name}</p>
                  {icp.segment && (
                    <p className="text-sm text-muted-foreground">Segmento: {icp.segment}</p>
                  )}
                  {icp.characteristics && (
                    <p className="text-sm text-muted-foreground">{icp.characteristics}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum ICP cadastrado</p>
          )}
        </div>

        <Separator />

        {/* Dores */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" />
            Dores Mapeadas
          </h4>
          {data.pains.length > 0 ? (
            <div className="space-y-3">
              {data.pains
                .filter((p) => p.main_pain)
                .map((pain) => {
                  const icp = data.icps.find((i) => i.id === pain.icp_id);
                  return (
                    <div key={pain.id} className="p-4 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {icp?.name || "ICP"}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{pain.main_pain}</p>
                      {pain.consequence && (
                        <p className="text-sm text-muted-foreground">{pain.consequence}</p>
                      )}
                      {pain.daily_impacts && pain.daily_impacts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pain.daily_impacts.map((impact, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {impact}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma dor cadastrada</p>
          )}
        </div>

        <Separator />

        {/* Mercado */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4" />
            Mercado
          </h4>
          {data.profile ? (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              {data.profile.demand_channels && data.profile.demand_channels.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Canais de demanda:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.profile.demand_channels.map((channel, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {getChannelLabel(channel)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {data.profile.monthly_investment && (
                  <span className="text-muted-foreground">
                    Investimento: {INVESTMENT_LABELS[data.profile.monthly_investment] || data.profile.monthly_investment}
                  </span>
                )}
                {data.profile.sales_team_size && (
                  <span className="text-muted-foreground">
                    Equipe: {TEAM_SIZE_LABELS[data.profile.sales_team_size] || data.profile.sales_team_size}
                  </span>
                )}
                {data.profile.revenue_goal && (
                  <span className="text-muted-foreground">
                    Meta: {data.profile.revenue_goal}
                  </span>
                )}
              </div>
              {!data.profile.demand_channels?.length && !data.profile.monthly_investment && 
               !data.profile.sales_team_size && !data.profile.revenue_goal && (
                <p className="text-sm text-muted-foreground italic">Não preenchido</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Não preenchido</p>
          )}
        </div>

        <Separator />

        {/* Promessa */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Target className="h-4 w-4" />
            Promessa de Valor
          </h4>
          {data.promise?.promise_text ? (
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="italic">"{data.promise.promise_text}"</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Não definida</p>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={onComplete} disabled={isCompleting} className="gap-2">
            {isCompleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Concluir Onboarding
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
