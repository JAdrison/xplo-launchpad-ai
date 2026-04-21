import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Package,
  BarChart3,
  TrendingUp,
  Users,
  Play,
  Pencil,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  DollarSign,
  RotateCcw,
  Target,
  Hotel,
  Stethoscope,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PDFExportButton } from "@/components/export/PDFExportButton";
import { humanizeKey, formatValue } from "@/components/onboarding/shared/fieldLabels";
import { Lock, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Client = Tables<"clients">;
type ClientProfile = Tables<"client_profile">;
type ClientSwot = Tables<"client_swot">;
type ClientIcp = Tables<"client_icp">;

interface OnboardingData {
  profile: ClientProfile | null;
  swot: ClientSwot | null;
  icp: ClientIcp | null;
}

interface OnboardingX1SectionProps {
  client: Client;
  onStatusChange?: () => void;
}

const STEPS = [
  { name: "Cadastro", icon: Building2 },
  { name: "Negócio", icon: Package },
  { name: "Diagnóstico", icon: BarChart3 },
  { name: "Mercado", icon: TrendingUp },
  { name: "Cliente", icon: Users },
  { name: "Revisão", icon: CheckCircle },
];

const NICHE_ICON: Record<string, typeof Hotel> = {
  hospedagem: Hotel,
  saude: Stethoscope,
  generico: Building,
};

const RESET_CHECKPOINTS = [
  { id: "cadastro", label: "Cadastro", description: "Dados do negócio, responsável e financeiro", icon: Building2 },
  { id: "negocio", label: "Sobre o Negócio", description: "Tipo, diferenciais, ticket e experiência", icon: Package },
  { id: "swot", label: "Diagnóstico (SWOT)", description: "Forças, fraquezas, oportunidades e ameaças", icon: BarChart3 },
  { id: "mercado", label: "Mercado", description: "Canais, concorrentes e acessos", icon: TrendingUp },
  { id: "cliente", label: "Perfil do Cliente", description: "Quem você atende, quer atrair e evitar", icon: Users },
];

export function OnboardingX1Section({ client, onStatusChange }: OnboardingX1SectionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetCheckpoints, setResetCheckpoints] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    profile: null,
    swot: null,
    icp: null,
  });

  const fetchOnboardingData = useCallback(async () => {
    setIsLoading(true);
    const [profileRes, swotRes, icpRes] = await Promise.all([
      supabase.from("client_profile").select("*").eq("client_id", client.id).maybeSingle(),
      supabase.from("client_swot").select("*").eq("client_id", client.id).maybeSingle(),
      supabase.from("client_icp").select("*").eq("client_id", client.id).maybeSingle(),
    ]);
    setData({
      profile: profileRes.data ?? null,
      swot: swotRes.data ?? null,
      icp: icpRes.data ?? null,
    });
    setIsLoading(false);
  }, [client.id]);

  useEffect(() => {
    void fetchOnboardingData();
  }, [fetchOnboardingData, refreshKey]);

  // ============= Progress (6 etapas + Etapa 0 nicho) =============
  const checkpointStatus = () => {
    const profileData = (data.profile as any)?.profile_data || {};
    const marketData = (data.profile as any)?.market_data || {};
    const swotOk = !!(
      data.swot &&
      ((data.swot.forcas_internas_tags?.length ?? 0) > 0 ||
        (data.swot.fraquezas_internas_tags?.length ?? 0) > 0)
    );
    const icpOk = !!(
      data.icp &&
      (Object.keys((data.icp.bloco1_data as any) || {}).length > 0 ||
        Object.keys((data.icp.bloco2_data as any) || {}).length > 0)
    );

    return {
      cadastro: !!(client.cnpj || client.responsible_name || data.profile?.current_revenue),
      negocio: !!(
        Object.keys(profileData).length > 0 ||
        data.profile?.product_description ||
        (data.profile?.differentiators?.length ?? 0) > 0
      ),
      swot: swotOk,
      mercado: !!(
        Object.keys(marketData).length > 0 ||
        data.profile?.instagram_login ||
        data.profile?.facebook_login ||
        data.profile?.local_competitor_1
      ),
      cliente: icpOk,
      revisao: ["ppp_completed", "offer_generated", "assets_generated"].includes(client.status),
    };
  };

  const calculateProgress = () => {
    const cs = checkpointStatus();
    const completed = Object.values(cs).filter(Boolean).length;
    const total = 6;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const getCurrentStep = () => {
    const cs = checkpointStatus();
    if (!client.niche_type) return 0;
    if (!cs.cadastro) return 1;
    if (!cs.negocio) return 2;
    if (!cs.swot) return 3;
    if (!cs.mercado) return 4;
    if (!cs.cliente) return 5;
    return 6;
  };

  // ============= Actions =============
  const handleStartOnboarding = async () => {
    setIsStarting(true);
    if (client.status === "draft") {
      await supabase.from("clients").update({ status: "ppp_in_progress" }).eq("id", client.id);
      onStatusChange?.();
    }
    navigate(`/onboarding?client=${client.id}`);
  };

  const handleContinueOnboarding = () => {
    const step = getCurrentStep();
    navigate(`/onboarding?client=${client.id}&step=${step}`);
  };

  const handleEditOnboarding = () => {
    navigate(`/onboarding?client=${client.id}&step=1`);
  };

  const handleResetOnboarding = async () => {
    if (resetCheckpoints.length === 0) {
      toast.error("Selecione pelo menos um checkpoint para reiniciar.");
      return;
    }
    setIsResetting(true);
    try {
      const profileId = data.profile?.id;

      // Cadastro
      if (resetCheckpoints.includes("cadastro")) {
        await supabase
          .from("clients")
          .update({
            cnpj: null,
            responsible_name: null,
            responsible_cpf: null,
            email: null,
            phone: null,
          })
          .eq("id", client.id);
        if (profileId) {
          await supabase
            .from("client_profile")
            .update({
              current_revenue: null,
              monthly_investment: null,
              initial_traffic_investment: null,
              revenue_goal: null,
              whatsapp_number: null,
            })
            .eq("id", profileId);
        }
      }

      // Negócio (Etapa 2)
      if (resetCheckpoints.includes("negocio") && profileId) {
        await supabase
          .from("client_profile")
          .update({
            product_name: null,
            product_description: null,
            differentiators: null,
            benefits: null,
            promotions: null,
            average_ticket: null,
            region: null,
            profile_data: {},
          })
          .eq("id", profileId);
      }

      // SWOT (Etapa 3)
      if (resetCheckpoints.includes("swot")) {
        await supabase.from("client_swot").delete().eq("client_id", client.id);
      }

      // Mercado (Etapa 4)
      if (resetCheckpoints.includes("mercado") && profileId) {
        await supabase
          .from("client_profile")
          .update({
            market_data: {},
            instagram_link: null,
            instagram_login: null,
            instagram_password: null,
            facebook_login: null,
            facebook_password: null,
            local_competitor_1: null,
            local_competitor_2: null,
            inspiration_company_1: null,
            google_my_business: null,
            demand_channels: null,
          })
          .eq("id", profileId);
      }

      // Cliente / ICP (Etapa 5)
      if (resetCheckpoints.includes("cliente")) {
        await supabase.from("client_icp").delete().eq("client_id", client.id);
      }

      const allReset =
        ["cadastro", "negocio", "swot", "mercado", "cliente"].every((cp) =>
          resetCheckpoints.includes(cp),
        );
      if (allReset) {
        await supabase.from("clients").update({ status: "draft" }).eq("id", client.id);
      } else if (
        resetCheckpoints.includes("swot") ||
        resetCheckpoints.includes("cliente")
      ) {
        await supabase.from("clients").update({ status: "ppp_in_progress" }).eq("id", client.id);
      }

      const names = resetCheckpoints
        .map((cp) => RESET_CHECKPOINTS.find((c) => c.id === cp)?.label)
        .filter(Boolean)
        .join(", ");
      toast.success(`Checkpoints reiniciados: ${names}`);
      setIsResetDialogOpen(false);
      setResetCheckpoints([]);
      setRefreshKey((k) => k + 1);
      onStatusChange?.();
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      toast.error("Erro ao reiniciar checkpoints. Tente novamente.");
    } finally {
      setIsResetting(false);
    }
  };

  const toggleCheckpoint = (checkpoint: string) => {
    setResetCheckpoints((prev) =>
      prev.includes(checkpoint)
        ? prev.filter((cp) => cp !== checkpoint)
        : [...prev, checkpoint],
    );
  };

  const toggleAllCheckpoints = () => {
    if (resetCheckpoints.length === RESET_CHECKPOINTS.length) {
      setResetCheckpoints([]);
    } else {
      setResetCheckpoints(RESET_CHECKPOINTS.map((c) => c.id));
    }
  };

  const { completed, total, percentage } = calculateProgress();
  const isDraft = client.status === "draft";
  const isInProgress = client.status === "ppp_in_progress";
  const isCompleted = ["ppp_completed", "offer_generated", "assets_generated"].includes(client.status);
  const hasData = !!(data.profile || data.swot || data.icp || client.niche_type);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // PDF content (mantém compatibilidade básica com template existente)
  const profileData = (data.profile as any)?.profile_data || {};
  const marketData = (data.profile as any)?.market_data || {};
  const pdfContent = {
    client: {
      cnpj: client.cnpj,
      responsible_name: client.responsible_name,
      responsible_cpf: client.responsible_cpf,
      email: client.email,
      phone: client.phone,
    },
    company: {
      niche: client.niche_label || client.niche_type || client.niche,
      regions: data.profile?.region || [],
    },
    product: {
      name: data.profile?.product_name || profileData.type || profileData.specialty || profileData.product || null,
      description: data.profile?.product_description || null,
      average_ticket: data.profile?.average_ticket || null,
      sales_model: data.profile?.sales_model || null,
      differentiators: data.profile?.differentiators || [],
      benefits: data.profile?.benefits || [],
      promotions: data.profile?.promotions || null,
      profile_data: profileData,
    },
    swot: data.swot
      ? {
          forcas_internas: { tags: data.swot.forcas_internas_tags || [], text: data.swot.forcas_internas_text || "" },
          fraquezas_internas: { tags: data.swot.fraquezas_internas_tags || [], text: data.swot.fraquezas_internas_text || "" },
          forcas_ambiente: { tags: data.swot.forcas_ambiente_tags || [], text: data.swot.forcas_ambiente_text || "" },
          fraquezas_ambiente: { tags: data.swot.fraquezas_ambiente_tags || [], text: data.swot.fraquezas_ambiente_text || "" },
        }
      : null,
    market: {
      current_revenue: data.profile?.current_revenue || null,
      monthly_investment: data.profile?.monthly_investment || null,
      initial_traffic_investment: data.profile?.initial_traffic_investment || null,
      demand_channels: data.profile?.demand_channels || [],
      revenue_goal: data.profile?.revenue_goal || null,
      sales_team_size: data.profile?.sales_team_size || null,
      market_data: marketData,
      instagram_link: data.profile?.instagram_link || null,
      instagram_login: data.profile?.instagram_login || null,
      instagram_password: data.profile?.instagram_password || null,
      facebook_login: data.profile?.facebook_login || null,
      facebook_password: data.profile?.facebook_password || null,
      whatsapp_number: data.profile?.whatsapp_number || null,
      google_my_business: data.profile?.google_my_business || null,
      local_competitor_1: data.profile?.local_competitor_1 || null,
      local_competitor_2: data.profile?.local_competitor_2 || null,
      inspiration_company_1: data.profile?.inspiration_company_1 || null,
      inspiration_company_2: data.profile?.inspiration_company_2 || null,
    },
    icp: data.icp
      ? {
          bloco1: data.icp.bloco1_data,
          bloco2: data.icp.bloco2_data,
          bloco3: data.icp.bloco3_data,
        }
      : null,
  };

  const cs = checkpointStatus();
  const NicheIcon = client.niche_type ? NICHE_ICON[client.niche_type] : Building;
  const nicheLabel = client.niche_label || (client.niche_type
    ? client.niche_type === "hospedagem" ? "Hospedagem" : client.niche_type === "saude" ? "Área da Saúde" : "Outro"
    : null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Onboarding X1
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasData && (
              <PDFExportButton
                type="onboarding"
                clientName={client.name}
                content={pdfContent as any}
                createdAt={client.created_at}
                size="icon"
              />
            )}
            {isCompleted && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Concluído
              </Badge>
            )}
            {isInProgress && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Em andamento
              </Badge>
            )}
            {isDraft && !hasData && <Badge variant="secondary">Não iniciado</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nicho */}
        {nicheLabel && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
            <NicheIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Nicho:</span>
            <span className="text-sm text-muted-foreground">{nicheLabel}</span>
          </div>
        )}

        {/* Progresso */}
        {(hasData || !isDraft) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {completed} de {total} etapas
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between mt-1">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const ids = ["cadastro", "negocio", "swot", "mercado", "cliente", "revisao"];
                const done = (cs as any)[ids[index]];
                return (
                  <div
                    key={step.name}
                    className={`flex flex-col items-center gap-1 ${done ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <StepIcon className="h-4 w-4" />
                    <span className="text-xs hidden sm:block">{step.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumo */}
        {hasData && (
          <>
            <Separator />

            {/* Cadastro */}
            {(client.cnpj || client.responsible_name || data.profile?.current_revenue) && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4" />
                  Cadastro
                </h4>
                {client.responsible_name && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Responsável:</span> {client.responsible_name}
                  </p>
                )}
                {data.profile?.current_revenue && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium text-foreground">Faturamento:</span>{" "}
                    {data.profile.current_revenue}
                  </p>
                )}
                {data.profile?.initial_traffic_investment && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium text-foreground">Investimento inicial:</span> R${" "}
                    {data.profile.initial_traffic_investment}
                  </p>
                )}
              </div>
            )}

            {/* Negócio */}
            {(Object.keys(profileData).length > 0 ||
              (data.profile?.differentiators?.length ?? 0) > 0 ||
              data.profile?.product_description) && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4" />
                  Sobre o Negócio
                </h4>
                {(profileData.type || profileData.specialty || profileData.product) && (
                  <p className="text-foreground font-medium">
                    {profileData.type || profileData.specialty || profileData.product}
                  </p>
                )}
                {data.profile?.product_description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {data.profile.product_description}
                  </p>
                )}
                {(data.profile?.differentiators?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.profile!.differentiators!.map((diff, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {diff}
                      </Badge>
                    ))}
                  </div>
                )}
                {(data.profile?.region?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 items-center">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {data.profile!.region!.map((r, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SWOT */}
            {data.swot && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4" />
                  Diagnóstico (SWOT)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-medium text-foreground">💪 Forças internas</p>
                    <p className="text-muted-foreground">
                      {(data.swot.forcas_internas_tags?.length ?? 0)} itens
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">🔧 Fraquezas internas</p>
                    <p className="text-muted-foreground">
                      {(data.swot.fraquezas_internas_tags?.length ?? 0)} itens
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">🌤️ Forças do ambiente</p>
                    <p className="text-muted-foreground">
                      {(data.swot.forcas_ambiente_tags?.length ?? 0)} itens
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">⚠️ Fraquezas do ambiente</p>
                    <p className="text-muted-foreground">
                      {(data.swot.fraquezas_ambiente_tags?.length ?? 0)} itens
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mercado */}
            {(Object.keys(marketData).length > 0 ||
              data.profile?.instagram_login ||
              data.profile?.facebook_login) && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Mercado e Acessos
                </h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {data.profile?.instagram_login && (
                    <p>
                      <span className="font-medium text-foreground">Instagram:</span>{" "}
                      {data.profile.instagram_login}
                    </p>
                  )}
                  {data.profile?.facebook_login && (
                    <p>
                      <span className="font-medium text-foreground">Facebook:</span>{" "}
                      {data.profile.facebook_login}
                    </p>
                  )}
                  {data.profile?.whatsapp_number && (
                    <p>
                      <span className="font-medium text-foreground">WhatsApp:</span>{" "}
                      {data.profile.whatsapp_number}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Perfil do Cliente (ICP 3 blocos) */}
            {data.icp && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Perfil do Cliente
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Bloco 1 — Quem você atende hoje{" "}
                    {Object.keys((data.icp.bloco1_data as any) || {}).length > 0 ? "✓" : ""}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Bloco 2 — Cliente dos sonhos{" "}
                    {Object.keys((data.icp.bloco2_data as any) || {}).length > 0 ? "✓" : ""}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Bloco 3 — Quem evitar{" "}
                    {Object.keys((data.icp.bloco3_data as any) || {}).length > 0 ? "✓" : ""}
                  </li>
                </ul>
              </div>
            )}
          </>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-3 pt-2">
          {isDraft && !hasData && (
            <Button onClick={handleStartOnboarding} disabled={isStarting} className="gap-2">
              {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Iniciar Onboarding
            </Button>
          )}

          {isInProgress && (
            <>
              <Button onClick={handleContinueOnboarding} className="gap-2">
                <Play className="h-4 w-4" />
                Continuar Onboarding
              </Button>
              {hasData && (
                <Button variant="outline" onClick={handleEditOnboarding} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </>
          )}

          {isCompleted && (
            <Button variant="outline" onClick={handleEditOnboarding} className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar Onboarding
            </Button>
          )}

          {isDraft && hasData && (
            <>
              <Button onClick={handleContinueOnboarding} className="gap-2">
                <Play className="h-4 w-4" />
                Continuar
              </Button>
              <Button variant="outline" onClick={handleEditOnboarding} className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </>
          )}

          {hasData && (
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </Button>
          )}
        </div>

        {/* Dialog de reset */}
        <AlertDialog
          open={isResetDialogOpen}
          onOpenChange={(open) => {
            setIsResetDialogOpen(open);
            if (!open) setResetCheckpoints([]);
          }}
        >
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Reiniciar Checkpoints</AlertDialogTitle>
              <AlertDialogDescription>
                Selecione quais etapas do onboarding você deseja reiniciar. Os dados selecionados
                serão apagados permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 py-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <Label className="text-sm font-medium">Selecionar checkpoints</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllCheckpoints}
                  className="text-xs h-7"
                >
                  {resetCheckpoints.length === RESET_CHECKPOINTS.length
                    ? "Desmarcar todos"
                    : "Selecionar todos"}
                </Button>
              </div>

              {RESET_CHECKPOINTS.map((checkpoint) => {
                const Icon = checkpoint.icon;
                return (
                  <div
                    key={checkpoint.id}
                    className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleCheckpoint(checkpoint.id)}
                  >
                    <Checkbox
                      id={checkpoint.id}
                      checked={resetCheckpoints.includes(checkpoint.id)}
                      onCheckedChange={() => toggleCheckpoint(checkpoint.id)}
                    />
                    <div className="flex-1 space-y-0.5">
                      <Label
                        htmlFor={checkpoint.id}
                        className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {checkpoint.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{checkpoint.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {resetCheckpoints.length > 0 && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <strong>Atenção:</strong> {resetCheckpoints.length} checkpoint(s) será(ão)
                reiniciado(s). Esta ação não pode ser desfeita.
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetOnboarding}
                disabled={isResetting || resetCheckpoints.length === 0}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reiniciando...
                  </>
                ) : (
                  `Reiniciar ${resetCheckpoints.length > 0 ? `(${resetCheckpoints.length})` : ""}`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
