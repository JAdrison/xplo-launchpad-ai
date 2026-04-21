import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

// New multi-niche steps
import { StepNicheSelection } from "./StepNicheSelection";
import { StepRegistration } from "./steps/StepRegistration";
import { StepBusinessHospedagem } from "./steps/business/StepBusinessHospedagem";
import { StepBusinessSaude } from "./steps/business/StepBusinessSaude";
import { StepBusinessGenerico } from "./steps/business/StepBusinessGenerico";
import { StepSWOT } from "./steps/StepSWOT";
import { StepMarketByNiche } from "./steps/market/StepMarketByNiche";
import { StepClientProfile } from "./steps/StepClientProfile";
import { StepReviewV2 } from "./steps/StepReviewV2";
import type { NicheType } from "./shared/nicheLabels";

type Client = Tables<"clients">;

interface OnboardingWizardProps {
  clientId: string;
  isExternal?: boolean;
  onComplete?: () => void;
}

// New structure: Etapa 0 (nicho) + 6 etapas
const STEPS = [
  { number: 0, name: "Nicho", description: "Selecione o tipo do seu negócio" },
  { number: 1, name: "Cadastro", description: "Dados do negócio e responsável" },
  { number: 2, name: "Negócio", description: "Sobre o que você oferece" },
  { number: 3, name: "Diagnóstico", description: "O que é bom e o que pode melhorar" },
  { number: 4, name: "Mercado", description: "Como você vende hoje" },
  { number: 5, name: "Cliente", description: "Quem é o seu cliente" },
  { number: 6, name: "Revisão", description: "Confirmar informações" },
];

const TOTAL_STEPS = 7; // 0..6

export function OnboardingWizard({ clientId, isExternal = false, onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam !== null) {
      const step = parseInt(stepParam, 10);
      if (!isNaN(step) && step >= 0 && step <= 6) {
        setCurrentStep(step);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    void fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchClient = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Erro ao carregar cliente",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
      if (!isExternal) navigate("/clients");
      setIsLoading(false);
      return;
    }

    setClient(data);

    // Force Etapa 0 if niche not yet selected
    if (!data.niche_type && currentStep > 0) {
      setCurrentStep(0);
      if (!isExternal) setSearchParams({ client: clientId, step: "0" });
    }

    setIsLoading(false);
  };

  const updateStepInUrl = (step: number) => {
    if (!isExternal) {
      setSearchParams({ client: clientId, step: step.toString() });
    }
  };

  const handleNext = async () => {
    // Refresh client after step 0 to pick up niche
    if (currentStep === 0) {
      await fetchClient();
    }
    if (currentStep < 6) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateStepInUrl(newStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      updateStepInUrl(newStep);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await supabase
        .from("clients")
        .update({ status: "ppp_completed" })
        .eq("id", clientId);

      toast({
        title: "Onboarding concluído!",
        description: "Todas as informações foram salvas com sucesso.",
      });

      if (onComplete) onComplete();
      else navigate(`/clients/${clientId}`);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Erro ao finalizar",
        description: "Não foi possível salvar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndExit = () => {
    toast({ title: "Progresso salvo", description: "Você pode continuar mais tarde." });
    if (!isExternal) navigate(`/clients/${clientId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!client) return null;

  const niche = (client.niche_type as NicheType | null) ?? null;
  // Visible step index (1-based for header display: Etapa X de 6); etapa 0 is shown as "Início"
  const displayStepIndex = currentStep === 0 ? 0 : currentStep;
  const progress = currentStep === 0 ? 0 : (currentStep / 6) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepNicheSelection
            clientId={clientId}
            initialNiche={niche}
            initialLabel={client.niche_label}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <StepRegistration
            clientId={clientId}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 2: {
        if (!niche) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Selecione primeiro o nicho do negócio na Etapa 0.
                </p>
              </CardContent>
            </Card>
          );
        }
        if (niche === "hospedagem") {
          return <StepBusinessHospedagem clientId={clientId} onNext={handleNext} onPrevious={handlePrevious} />;
        }
        if (niche === "saude") {
          return <StepBusinessSaude clientId={clientId} onNext={handleNext} onPrevious={handlePrevious} />;
        }
        return <StepBusinessGenerico clientId={clientId} onNext={handleNext} onPrevious={handlePrevious} />;
      }
      case 3:
        return (
          <StepSWOT
            clientId={clientId}
            niche={niche ?? "generico"}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <StepMarketByNiche
            clientId={clientId}
            niche={niche ?? "generico"}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <StepClientProfile
            clientId={clientId}
            niche={niche ?? "generico"}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <StepReviewV2
            clientId={clientId}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            isCompleting={isSaving}
          />
        );
      default:
        return null;
    }
  };

  // Build the visible progress map for steps 1-6
  const VISIBLE_STEPS = STEPS.filter((s) => s.number > 0);
  const currentMeta = STEPS.find((s) => s.number === currentStep);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">
                  {currentStep === 0
                    ? "Etapa Inicial — Seleção de Nicho"
                    : `Etapa ${displayStepIndex} de 6 - ${currentMeta?.name}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentMeta?.description}
                </p>
              </div>
              {isExternal && (
                <Button variant="outline" size="sm" onClick={handleSaveAndExit} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar e Sair
                </Button>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            {currentStep > 0 && (
              <div className="flex justify-between overflow-x-auto">
                {VISIBLE_STEPS.map((step) => (
                  <div
                    key={step.number}
                    className={`flex items-center gap-1 text-xs whitespace-nowrap ${
                      step.number < currentStep
                        ? "text-primary"
                        : step.number === currentStep
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border flex items-center justify-center text-xs">
                        {step.number}
                      </span>
                    )}
                    <span className="hidden sm:inline">{step.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}
