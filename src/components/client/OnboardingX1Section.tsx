import { useEffect, useState } from "react";
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
  Heart,
  TrendingUp,
  Target,
  Users,
  Play,
  Pencil,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PDFExportButton } from "@/components/export/PDFExportButton";

type Client = Tables<"clients">;
type ClientProfile = Tables<"client_profile">;
type ICP = Tables<"icps">;
type ICPPain = Tables<"icp_pains">;
type ClientPromise = Tables<"client_promise">;

interface OnboardingData {
  profile: ClientProfile | null;
  icps: ICP[];
  pains: ICPPain[];
  promise: ClientPromise | null;
  niche: string | null;
}

interface OnboardingX1SectionProps {
  client: Client;
  onStatusChange?: () => void;
}

const STEPS = [
  { name: "Empresa", icon: Building2 },
  { name: "Produto", icon: Package },
  { name: "Dores", icon: Heart },
  { name: "Mercado", icon: TrendingUp },
  { name: "Promessa", icon: Target },
  { name: "Público", icon: Users },
  { name: "Revisão", icon: CheckCircle },
];

export function OnboardingX1Section({ client, onStatusChange }: OnboardingX1SectionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetCheckpoints, setResetCheckpoints] = useState<string[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    profile: null,
    icps: [],
    pains: [],
    promise: null,
    niche: null,
  });

  useEffect(() => {
    fetchOnboardingData();
  }, [client.id]);

  const fetchOnboardingData = async () => {
    setIsLoading(true);

    const [profileRes, icpsRes, promiseRes] = await Promise.all([
      supabase
        .from("client_profile")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle(),
      supabase
        .from("icps")
        .select("*")
        .eq("client_id", client.id)
        .order("sort_order"),
      supabase
        .from("client_promise")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle(),
    ]);

    // Fetch pains for the ICPs
    let pains: ICPPain[] = [];
    if (icpsRes.data && icpsRes.data.length > 0) {
      const icpIds = icpsRes.data.map((icp) => icp.id);
      const { data: painsData } = await supabase
        .from("icp_pains")
        .select("*")
        .in("icp_id", icpIds);
      pains = painsData || [];
    }

    setOnboardingData({
      profile: profileRes.data,
      icps: icpsRes.data || [],
      pains,
      promise: promiseRes.data,
      niche: client.niche,
    });

    setIsLoading(false);
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 7;

    // Step 1: Empresa (niche ou region preenchidos)
    if (client.niche || (onboardingData.profile?.region && onboardingData.profile.region.length > 0)) {
      completed++;
    }

    // Step 2: Produto (product_name ou product_description)
    if (onboardingData.profile?.product_name || onboardingData.profile?.product_description) {
      completed++;
    }

    // Step 3: Dores (main_pain no profile - dores gerais do comprador)
    if (onboardingData.profile?.main_pain) {
      completed++;
    }

    // Step 4: Mercado (current_revenue ou monthly_investment ou initial_traffic_investment)
    if (
      onboardingData.profile?.current_revenue ||
      onboardingData.profile?.monthly_investment ||
      onboardingData.profile?.initial_traffic_investment
    ) {
      completed++;
    }

    // Step 5: Promessa
    if (onboardingData.promise?.promise_text) {
      completed++;
    }

    // Step 6: Público (ICPs cadastrados)
    if (onboardingData.icps.length > 0) {
      completed++;
    }

    // Step 7: Revisão (completado se status é ppp_completed ou posterior)
    if (["ppp_completed", "offer_generated", "assets_generated"].includes(client.status)) {
      completed++;
    }

    return { completed, total, percentage: (completed / total) * 100 };
  };

  const getCurrentStep = () => {
    // Etapa 1: Empresa
    if (!client.niche && !(onboardingData.profile?.region && onboardingData.profile.region.length > 0)) {
      return 1;
    }
    // Etapa 2: Produto
    if (!onboardingData.profile?.product_name && !onboardingData.profile?.product_description) {
      return 2;
    }
    // Etapa 3: Dores
    if (!onboardingData.profile?.main_pain) {
      return 3;
    }
    // Etapa 4: Mercado
    if (
      !onboardingData.profile?.current_revenue &&
      !onboardingData.profile?.monthly_investment &&
      !onboardingData.profile?.initial_traffic_investment
    ) {
      return 4;
    }
    // Etapa 5: Promessa
    if (!onboardingData.promise?.promise_text) {
      return 5;
    }
    // Etapa 6: Público (ICPs)
    if (onboardingData.icps.length === 0) {
      return 6;
    }
    // Etapa 7: Revisão
    return 7;
  };

  const handleStartOnboarding = async () => {
    setIsStarting(true);

    if (client.status === "draft") {
      await supabase
        .from("clients")
        .update({ status: "ppp_in_progress" })
        .eq("id", client.id);
      onStatusChange?.();
    }

    navigate(`/onboarding?client=${client.id}`);
  };

  const handleContinueOnboarding = () => {
    const currentStep = getCurrentStep();
    navigate(`/onboarding?client=${client.id}&step=${currentStep}`);
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
      // Reset Empresa (checkpoint 1)
      if (resetCheckpoints.includes("empresa")) {
        await supabase
          .from("clients")
          .update({ niche: null })
          .eq("id", client.id);

        // Also reset region in client_profile
        const { data: profile } = await supabase
          .from("client_profile")
          .select("id")
          .eq("client_id", client.id)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("client_profile")
            .update({ region: null })
            .eq("id", profile.id);
        }
      }

      // Reset Produto (checkpoint 2)
      if (resetCheckpoints.includes("produto")) {
        const { data: profile } = await supabase
          .from("client_profile")
          .select("id")
          .eq("client_id", client.id)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("client_profile")
            .update({
              product_name: null,
              product_description: null,
              differentiators: null,
              benefits: null,
              promotions: null,
              average_ticket: null,
            })
            .eq("id", profile.id);
        }
      }

      // Reset Dores (checkpoint 3)
      if (resetCheckpoints.includes("dores")) {
        const { data: profile } = await supabase
          .from("client_profile")
          .select("id")
          .eq("client_id", client.id)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("client_profile")
            .update({
              main_pain: null,
              secondary_pain: null,
              daily_impacts: null,
              desire_1: null,
              desire_2: null,
            })
            .eq("id", profile.id);
        }
      }

      // Reset Mercado (checkpoint 4)
      if (resetCheckpoints.includes("mercado")) {
        const { data: profile } = await supabase
          .from("client_profile")
          .select("id")
          .eq("client_id", client.id)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("client_profile")
            .update({
              current_revenue: null,
              monthly_investment: null,
              initial_traffic_investment: null,
              demand_channels: null,
              sales_model: null,
              sales_team_size: null,
              revenue_goal: null,
            })
            .eq("id", profile.id);
        }
      }

      // Reset Promessa (checkpoint 5)
      if (resetCheckpoints.includes("promessa")) {
        await supabase
          .from("client_promise")
          .delete()
          .eq("client_id", client.id);
      }

      // Reset Público/ICPs (checkpoint 6)
      if (resetCheckpoints.includes("publico")) {
        // Get ICP ids to delete related pains first
        const { data: icps } = await supabase
          .from("icps")
          .select("id")
          .eq("client_id", client.id);

        const icpIds = icps?.map((icp) => icp.id) || [];

        // Delete icp_pains first
        if (icpIds.length > 0) {
          await supabase
            .from("icp_pains")
            .delete()
            .in("icp_id", icpIds);
        }

        // Delete offers that reference these ICPs
        await supabase
          .from("offers_hormozi")
          .update({ icp_id: null })
          .in("icp_id", icpIds);

        // Delete icps
        await supabase
          .from("icps")
          .delete()
          .eq("client_id", client.id);
      }

      // If all main checkpoints are reset, set status back to draft
      const allMainCheckpoints = ["empresa", "produto", "dores", "mercado", "promessa", "publico"];
      const allSelected = allMainCheckpoints.every((cp) => resetCheckpoints.includes(cp));
      
      if (allSelected) {
        await supabase
          .from("clients")
          .update({ status: "draft" })
          .eq("id", client.id);
      } else if (resetCheckpoints.includes("publico") || resetCheckpoints.includes("promessa")) {
        // If ICPs or Promise are reset, move back to ppp_in_progress
        await supabase
          .from("clients")
          .update({ status: "ppp_in_progress" })
          .eq("id", client.id);
      }

      const checkpointNames = resetCheckpoints.map((cp) => {
        const names: Record<string, string> = {
          empresa: "Empresa",
          produto: "Produto",
          dores: "Dores",
          mercado: "Mercado",
          promessa: "Promessa",
          publico: "Público",
        };
        return names[cp];
      }).join(", ");

      toast.success(`Checkpoints reiniciados: ${checkpointNames}`);
      setIsResetDialogOpen(false);
      setResetCheckpoints([]);
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
        : [...prev, checkpoint]
    );
  };

  const toggleAllCheckpoints = () => {
    const allCheckpoints = ["empresa", "produto", "dores", "mercado", "promessa", "publico"];
    if (resetCheckpoints.length === allCheckpoints.length) {
      setResetCheckpoints([]);
    } else {
      setResetCheckpoints(allCheckpoints);
    }
  };

  const { completed, total, percentage } = calculateProgress();
  const isDraft = client.status === "draft";
  const isInProgress = client.status === "ppp_in_progress";
  const isCompleted = ["ppp_completed", "offer_generated", "assets_generated"].includes(client.status);
  const hasData = onboardingData.profile || onboardingData.icps.length > 0 || onboardingData.promise || client.niche;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Prepare PDF content
  const pdfContent = {
    product: {
      name: onboardingData.profile?.product_name || null,
      description: onboardingData.profile?.product_description || null,
      differentiators: onboardingData.profile?.differentiators || [],
    },
    icps: onboardingData.icps.map((icp) => ({
      name: icp.name,
      segment: icp.segment,
      characteristics: icp.characteristics,
      current_situation: icp.current_situation,
    })),
    pains: onboardingData.pains
      .filter((pain) => pain.main_pain)
      .map((pain) => {
        const icp = onboardingData.icps.find((i) => i.id === pain.icp_id);
        return {
          icp_name: icp?.name || "ICP",
          main_pain: pain.main_pain,
          consequence: pain.consequence,
          daily_impacts: pain.daily_impacts || [],
        };
      }),
    promise: onboardingData.promise?.promise_text || null,
  };

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
                content={pdfContent}
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
            {isDraft && !hasData && (
              <Badge variant="secondary">Não iniciado</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de Progresso */}
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
                const isStepCompleted = index < completed;
                return (
                  <div
                    key={step.name}
                    className={`flex flex-col items-center gap-1 ${
                      isStepCompleted ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                    <span className="text-xs hidden sm:block">{step.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumo dos Dados */}
        {hasData && (
          <>
            <Separator />

            {/* Empresa */}
            {(client.niche || (onboardingData.profile?.region && onboardingData.profile.region.length > 0)) && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4" />
                  Empresa
                </h4>
                {client.niche && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Nicho:</span> {client.niche}
                  </p>
                )}
                {onboardingData.profile?.region && onboardingData.profile.region.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                    {onboardingData.profile.region.map((region, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Produto */}
            {(onboardingData.profile?.product_name || onboardingData.profile?.product_description) && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4" />
                  Produto
                </h4>
                {onboardingData.profile.product_name && (
                  <p className="text-foreground font-medium">
                    {onboardingData.profile.product_name}
                  </p>
                )}
                {onboardingData.profile.product_description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {onboardingData.profile.product_description}
                  </p>
                )}
                {onboardingData.profile.differentiators && onboardingData.profile.differentiators.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {onboardingData.profile.differentiators.map((diff, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {diff}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dores */}
            {onboardingData.profile?.main_pain && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4" />
                  Dores do Comprador
                </h4>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                  {onboardingData.profile.main_pain}
                </p>
                {onboardingData.profile.secondary_pain && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 bg-destructive/60 rounded-full" />
                    {onboardingData.profile.secondary_pain}
                  </p>
                )}
              </div>
            )}

            {/* Mercado */}
            {(onboardingData.profile?.current_revenue ||
              onboardingData.profile?.monthly_investment ||
              onboardingData.profile?.initial_traffic_investment) && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Mercado
                </h4>
                <div className="space-y-1">
                  {onboardingData.profile?.current_revenue && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium text-foreground">Faturamento:</span>{" "}
                      {onboardingData.profile.current_revenue}
                    </p>
                  )}
                  {onboardingData.profile?.monthly_investment && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium text-foreground">Investimento mensal:</span>{" "}
                      {onboardingData.profile.monthly_investment}
                    </p>
                  )}
                  {onboardingData.profile?.initial_traffic_investment && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium text-foreground">Investimento inicial:</span> R${" "}
                      {onboardingData.profile.initial_traffic_investment}
                    </p>
                  )}
                </div>
                {onboardingData.profile?.demand_channels && onboardingData.profile.demand_channels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {onboardingData.profile.demand_channels.map((channel, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Promessa */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                Promessa
              </h4>
              {onboardingData.promise?.promise_text ? (
                <p className="text-sm text-foreground italic">
                  "{onboardingData.promise.promise_text}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">(Ainda não definida)</p>
              )}
            </div>

            {/* ICPs / Público */}
            {onboardingData.icps.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Público - ICPs ({onboardingData.icps.length})
                </h4>
                <ul className="space-y-1">
                  {onboardingData.icps.map((icp) => (
                    <li key={icp.id} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {icp.name}
                      {icp.segment && (
                        <span className="text-xs text-muted-foreground/70">
                          ({icp.segment})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-3 pt-2">
          {isDraft && !hasData && (
            <Button onClick={handleStartOnboarding} disabled={isStarting} className="gap-2">
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
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

          {/* Botão de Reiniciar - aparece quando há dados */}
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

        {/* Dialog de confirmação para reiniciar */}
        <AlertDialog open={isResetDialogOpen} onOpenChange={(open) => {
          setIsResetDialogOpen(open);
          if (!open) setResetCheckpoints([]);
        }}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Reiniciar Checkpoints</AlertDialogTitle>
              <AlertDialogDescription>
                Selecione quais etapas do onboarding você deseja reiniciar. Os dados selecionados serão apagados permanentemente.
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
                  {resetCheckpoints.length === 6 ? "Desmarcar todos" : "Selecionar todos"}
                </Button>
              </div>
              
              {[
                { id: "empresa", label: "Empresa", description: "Nicho e regiões de atuação", icon: Building2 },
                { id: "produto", label: "Produto", description: "Nome, descrição e diferenciais", icon: Package },
                { id: "dores", label: "Dores", description: "Dores e desejos do comprador", icon: Heart },
                { id: "mercado", label: "Mercado", description: "Faturamento, investimento e canais", icon: TrendingUp },
                { id: "promessa", label: "Promessa", description: "Promessa de transformação", icon: Target },
                { id: "publico", label: "Público (ICPs)", description: "Perfis de cliente ideal", icon: Users },
              ].map((checkpoint) => {
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
                      <p className="text-xs text-muted-foreground">
                        {checkpoint.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {resetCheckpoints.length > 0 && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <strong>Atenção:</strong> {resetCheckpoints.length} checkpoint(s) será(ão) reiniciado(s). Esta ação não pode ser desfeita.
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
