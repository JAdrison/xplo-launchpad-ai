import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FileText,
  Layout,
  Video,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface AIGenerationSectionProps {
  client: Client;
  onGenerated?: () => void;
}

interface GenerationStatus {
  hasOffer: boolean;
  hasLandingPage: boolean;
  hasAds: boolean;
}

export function AIGenerationSection({ client, onGenerated }: AIGenerationSectionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<GenerationStatus>({
    hasOffer: false,
    hasLandingPage: false,
    hasAds: false,
  });

  const isPPPCompleted = ["ppp_completed", "offer_generated", "assets_generated"].includes(client.status);

  useEffect(() => {
    if (isPPPCompleted) {
      fetchGenerationStatus();
    } else {
      setIsLoading(false);
    }
  }, [client.id, isPPPCompleted]);

  const fetchGenerationStatus = async () => {
    const [offersRes, lpsRes, adsRes] = await Promise.all([
      supabase.from("offers_hormozi").select("id").eq("client_id", client.id).limit(1),
      supabase.from("landing_pages").select("id").eq("client_id", client.id).limit(1),
      supabase.from("ads").select("id").eq("client_id", client.id).limit(1),
    ]);

    setStatus({
      hasOffer: (offersRes.data?.length || 0) > 0,
      hasLandingPage: (lpsRes.data?.length || 0) > 0,
      hasAds: (adsRes.data?.length || 0) > 0,
    });
    setIsLoading(false);
  };

  const handleGoToGenerator = (type?: "offer" | "lp" | "ads") => {
    const params = new URLSearchParams({ client: client.id });
    if (type) {
      params.set("type", type);
    }
    navigate(`/generator?${params.toString()}`);
  };

  // Don't show if PPP is not completed
  if (!isPPPCompleted) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const generationItems = [
    {
      id: "offer" as const,
      icon: FileText,
      name: "Oferta Hormozi",
      description: "Gere uma oferta irresistível usando a metodologia Hormozi",
      generated: status.hasOffer,
    },
    {
      id: "lp" as const,
      icon: Layout,
      name: "Landing Page",
      description: "Crie seções de LP com variantes (Direta, Consultiva, Agressiva)",
      generated: status.hasLandingPage,
    },
    {
      id: "ads" as const,
      icon: Video,
      name: "Anúncios",
      description: "Gere scripts de anúncio e headlines para suas campanhas",
      generated: status.hasAds,
    },
  ];

  const allGenerated = status.hasOffer && status.hasLandingPage && status.hasAds;
  const someGenerated = status.hasOffer || status.hasLandingPage || status.hasAds;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Gerar com IA
            </CardTitle>
            <CardDescription>
              Use os dados do PPP para gerar ofertas, LPs e anúncios
            </CardDescription>
          </div>
          {allGenerated && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Tudo gerado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {generationItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  {item.generated && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <Button
                  variant={item.generated ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleGoToGenerator(item.id)}
                  className="mt-auto gap-2"
                >
                  {item.generated ? "Regenerar" : "Gerar"}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>

        {someGenerated && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleGoToGenerator()}
            >
              <Sparkles className="h-4 w-4" />
              Abrir Gerador Completo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
