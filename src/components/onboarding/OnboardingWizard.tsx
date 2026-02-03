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

// Import step components
import { StepCompany } from "./steps/StepCompany";
import { StepProduct } from "./steps/StepProduct";
import { StepPains } from "./steps/StepPains";
import { StepMarket } from "./steps/StepMarket";
import { StepPromise } from "./steps/StepPromise";
import { StepICPs } from "./steps/StepICPs";
import { StepReview } from "./steps/StepReview";

type Client = Tables<"clients">;

interface OnboardingWizardProps {
  clientId: string;
  isExternal?: boolean;
  onComplete?: () => void;
}

// NEW ORDER: Company > Product > Pains > Market > Promise > ICPs > Review
const STEPS = [
  { number: 1, name: "Empresa", description: "Nicho e regiões de atuação" },
  { number: 2, name: "Produto", description: "O que você oferece" },
  { number: 3, name: "Dores", description: "Dores e desejos do comprador" },
  { number: 4, name: "Mercado", description: "Faturamento, investimento e metas" },
  { number: 5, name: "Promessa", description: "Sua promessa de valor" },
  { number: 6, name: "Público", description: "Perfis de cliente ideal" },
  { number: 7, name: "Revisão", description: "Confirmar informações" },
];

const TOTAL_STEPS = STEPS.length;

export function OnboardingWizard({ clientId, isExternal = false, onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (step >= 1 && step <= TOTAL_STEPS) {
        setCurrentStep(step);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchClient();
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
      if (!isExternal) {
        navigate("/clients");
      }
      return;
    }

    setClient(data);
    setIsLoading(false);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      if (!isExternal) {
        setSearchParams({ client: clientId, step: newStep.toString() });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      if (!isExternal) {
        setSearchParams({ client: clientId, step: newStep.toString() });
      }
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

      if (onComplete) {
        onComplete();
      } else {
        navigate(`/clients/${clientId}`);
      }
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

  const handleSaveAndExit = async () => {
    toast({
      title: "Progresso salvo",
      description: "Você pode continuar mais tarde.",
    });
    
    if (!isExternal) {
      navigate(`/clients/${clientId}`);
    }
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

  if (!client) {
    return null;
  }

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepCompany clientId={clientId} onNext={handleNext} />;
      case 2:
        return <StepProduct clientId={clientId} onNext={handleNext} onPrevious={handlePrevious} />;
      case 3:
        return <StepPains clientId={clientId} onNext={handleNext} onPrevious={handlePrevious} />;
      case 4:
        return <StepMarket clientId={clientId} onNext={handleNext} onPrevious={handlePrevious} />;
      case 5:
        return <StepPromise clientId={clientId} onNext={handleNext} onPrevious={handlePrevious} />;
      case 6:
        return <StepICPs clientId={clientId} onNext={handleNext} onPrevious={handlePrevious} />;
      case 7:
        return (
          <StepReview 
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

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">
                  Etapa {currentStep} de {TOTAL_STEPS} - {STEPS[currentStep - 1].name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {STEPS[currentStep - 1].description}
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
            <div className="flex justify-between overflow-x-auto">
              {STEPS.map((step) => (
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
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}
