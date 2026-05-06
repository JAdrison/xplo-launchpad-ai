import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle2,
  MessageCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import logoXplo from "@/assets/logo-xplo.png";

// Import the onboarding wizard component
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

type Client = Tables<"clients">;

type PageState = "loading" | "invalid" | "onboarding" | "success";

interface TokenData {
  id: string;
  client_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
}

export default function OnboardingExternal() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [client, setClient] = useState<Client | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const fetchPatchedRef = useRef(false);

  // Injeta header `x-client-token` em todas as chamadas para o Supabase enquanto
  // a página de onboarding externo estiver montada. Isso permite que as RLS
  // `anon_token_*` validem o acesso anônimo via token de convite.
  useEffect(() => {
    if (!token || fetchPatchedRef.current) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.startsWith(supabaseUrl)) {
          const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
          headers.set("x-client-token", token);
          return originalFetch(input, { ...init, headers });
        }
      } catch {}
      return originalFetch(input, init);
    };
    fetchPatchedRef.current = true;
    return () => {
      window.fetch = originalFetch;
      fetchPatchedRef.current = false;
    };
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setPageState("invalid");
      return;
    }

    try {
      // Fetch and validate token
      const { data: tokenResult, error: tokenError } = await supabase
        .from("client_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (tokenError || !tokenResult) {
        setPageState("invalid");
        return;
      }

      // Check if token is expired
      if (new Date(tokenResult.expires_at) < new Date()) {
        setPageState("invalid");
        return;
      }

      // Check if token was already used
      if (tokenResult.used_at) {
        setPageState("invalid");
        return;
      }

      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", tokenResult.client_id)
        .maybeSingle();

      if (clientError || !clientData) {
        setPageState("invalid");
        return;
      }

      setTokenData(tokenResult);
      setClient(clientData);
      setPageState("onboarding");
    } catch (error) {
      console.error("Error validating token:", error);
      setPageState("invalid");
    }
  };

  const handleOnboardingComplete = async () => {
    if (tokenData) {
      // Mark token as used
      await supabase
        .from("client_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      // Update client status
      if (client) {
        await supabase
          .from("clients")
          .update({ status: "ppp_completed" })
          .eq("id", client.id);
      }
    }
    setPageState("success");
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <img src={logoXplo} alt="XPLO" className="h-12" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <img src={logoXplo} alt="XPLO" className="h-12" />
          </div>

          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Link Inválido ou Expirado</h1>
            <p className="text-muted-foreground mt-4">
              Este link não é mais válido. Entre em contato com nossa equipe para obter um novo link de acesso.
            </p>
          </div>

          <Button variant="outline" className="gap-2" asChild>
            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Falar com Suporte
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <img src={logoXplo} alt="XPLO" className="h-12" />
          </div>

          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Onboarding Concluído!</h1>
            <p className="text-muted-foreground mt-4">
              Obrigado por preencher todas as informações. Nossa equipe agora vai preparar sua estratégia personalizada.
            </p>
            <p className="text-muted-foreground mt-2">
              Em breve entraremos em contato.
            </p>
          </div>

          <Button variant="outline" className="gap-2" asChild>
            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Dúvidas? Fale conosco
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Onboarding wizard state
  if (pageState === "onboarding" && client) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <img src={logoXplo} alt="XPLO" className="h-8" />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{client.name}</p>
              <p className="text-xs text-muted-foreground">Onboarding X1</p>
            </div>
          </div>
        </header>

        {/* Wizard */}
        <main className="container mx-auto px-4 py-6">
          <OnboardingWizard 
            clientId={client.id} 
            isExternal={true}
            onComplete={handleOnboardingComplete}
          />
        </main>
      </div>
    );
  }

  return null;
}
