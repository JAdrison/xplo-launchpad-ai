import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Users,
  AlertTriangle,
  Target,
  Play,
  Pencil,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
}

interface OnboardingX1SectionProps {
  client: Client;
  onStatusChange?: () => void;
}

const STEPS = [
  { name: "Produto", icon: Package },
  { name: "ICPs", icon: Users },
  { name: "Dores", icon: AlertTriangle },
  { name: "Promessa", icon: Target },
  { name: "Revisão", icon: CheckCircle },
];

export function OnboardingX1Section({ client, onStatusChange }: OnboardingX1SectionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    profile: null,
    icps: [],
    pains: [],
    promise: null,
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
    });

    setIsLoading(false);
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 5;

    // Step 1: Produto
    if (onboardingData.profile?.product_name || onboardingData.profile?.product_description) {
      completed++;
    }

    // Step 2: ICPs
    if (onboardingData.icps.length > 0) {
      completed++;
    }

    // Step 3: Dores
    if (onboardingData.pains.some((p) => p.main_pain)) {
      completed++;
    }

    // Step 4: Promessa
    if (onboardingData.promise?.promise_text) {
      completed++;
    }

    // Step 5: Revisão (completado se status é ppp_completed ou posterior)
    if (["ppp_completed", "offer_generated", "assets_generated"].includes(client.status)) {
      completed++;
    }

    return { completed, total, percentage: (completed / total) * 100 };
  };

  const getCurrentStep = () => {
    if (!onboardingData.profile?.product_name && !onboardingData.profile?.product_description) {
      return 1;
    }
    if (onboardingData.icps.length === 0) {
      return 2;
    }
    if (!onboardingData.pains.some((p) => p.main_pain)) {
      return 3;
    }
    if (!onboardingData.promise?.promise_text) {
      return 4;
    }
    return 5;
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

  const { completed, total, percentage } = calculateProgress();
  const isDraft = client.status === "draft";
  const isInProgress = client.status === "ppp_in_progress";
  const isCompleted = ["ppp_completed", "offer_generated", "assets_generated"].includes(client.status);
  const hasData = onboardingData.profile || onboardingData.icps.length > 0 || onboardingData.promise;

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Onboarding X1
          </CardTitle>
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

            {/* ICPs */}
            {onboardingData.icps.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  ICPs Definidos ({onboardingData.icps.length})
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

            {/* Dores */}
            {onboardingData.pains.length > 0 && onboardingData.pains.some((p) => p.main_pain) && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Dores Mapeadas ({onboardingData.pains.filter((p) => p.main_pain).length})
                </h4>
                <ul className="space-y-1">
                  {onboardingData.pains
                    .filter((p) => p.main_pain)
                    .slice(0, 3)
                    .map((pain) => (
                      <li key={pain.id} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                        {pain.main_pain}
                      </li>
                    ))}
                  {onboardingData.pains.filter((p) => p.main_pain).length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      +{onboardingData.pains.filter((p) => p.main_pain).length - 3} mais...
                    </li>
                  )}
                </ul>
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
        </div>
      </CardContent>
    </Card>
  );
}
