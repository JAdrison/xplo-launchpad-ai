import { Navigate, useSearchParams } from "react-router-dom";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client");

  // Sem cliente selecionado: mandar para o Workspace
  if (!clientId) return <Navigate to="/workspace" replace />;

  return <OnboardingWizard clientId={clientId} />;
}
