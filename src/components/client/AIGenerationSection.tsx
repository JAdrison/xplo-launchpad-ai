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
  Eye,
  Plus,
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
  offerCount: number;
  lpCount: number;
  adsCount: number;
}

export function AIGenerationSection({ client, onGenerated }: AIGenerationSectionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<GenerationStatus>({
    hasOffer: false,
    hasLandingPage: false,
    hasAds: false,
    offerCount: 0,
    lpCount: 0,
    adsCount: 0,
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
      supabase.from("offers_hormozi").select("id", { count: "exact" }).eq("client_id", client.id),
      supabase.from("landing_pages").select("id", { count: "exact" }).eq("client_id", client.id),
      supabase.from("ads").select("id", { count: "exact" }).eq("client_id", client.id),
    ]);

    setStatus({
      hasOffer: (offersRes.count || 0) > 0,
      hasLandingPage: (lpsRes.count || 0) > 0,
      hasAds: (adsRes.count || 0) > 0,
      offerCount: offersRes.count || 0,
      lpCount: lpsRes.count || 0,
      adsCount: adsRes.count || 0,
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
      count: status.offerCount,
    },
    {
      id: "lp" as const,
      icon: Layout,
      name: "Landing Page",
      description: "Crie seções de LP com variantes (Direta, Consultiva, Agressiva)",
      generated: status.hasLandingPage,
      count: status.lpCount,
    },
    {
      id: "ads" as const,
      icon: Video,
      name: "Anúncios",
      description: "Gere scripts de anúncio e headlines para suas campanhas",
      generated: status.hasAds,
      count: status.adsCount,
    },
  ];

  const allGenerated = status.hasOffer && status.hasLandingPage && status.hasAds;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Geração com IA
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
                    <Badge variant="secondary" className="text-xs">
                      {item.count}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <Button
                  variant={item.generated ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleGoToGenerator(item.id)}
                  className="mt-auto gap-2"
                >
                  {item.generated ? (
                    <>
                      <Eye className="h-3 w-3" />
                      Ver Gerados
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Gerar
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
