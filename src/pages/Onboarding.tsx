import { useSearchParams } from "react-router-dom";
import { OnboardingDashboard } from "@/components/onboarding/OnboardingDashboard";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client");

  // Sem cliente selecionado: mostrar dashboard
  if (!clientId) {
    return <OnboardingDashboard />;
  }

  // Com cliente: usar wizard com 7 etapas
  return <OnboardingWizard clientId={clientId} />;
}
