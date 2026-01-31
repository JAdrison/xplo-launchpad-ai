import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ICP {
  id: string;
  name: string;
}

interface StepGenerateOfferProps {
  clientId: string;
  icps: ICP[];
  onOfferGenerated: () => void;
}

export function StepGenerateOffer({ clientId, icps, onOfferGenerated }: StepGenerateOfferProps) {
  const [selectedIcpId, setSelectedIcpId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!selectedIcpId) {
      toast.error("Selecione um ICP para gerar a oferta");
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch PPP data for the selected ICP
      const [profileRes, icpRes, painRes, promiseRes, clientRes] = await Promise.all([
        supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("icps").select("*").eq("id", selectedIcpId).maybeSingle(),
        supabase.from("icp_pains").select("*").eq("icp_id", selectedIcpId).maybeSingle(),
        supabase.from("client_promise").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("clients").select("niche").eq("id", clientId).maybeSingle(),
      ]);

      const pppData = {
        profile: profileRes.data,
        icps: icpRes.data ? [icpRes.data] : [],
        pains: painRes.data ? [painRes.data] : [],
        promise: promiseRes.data,
        niche: clientRes.data?.niche || null,
      };

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "offer",
          clientId,
          icpId: selectedIcpId,
          pppData,
        },
      });

      if (error) {
        console.error("Error generating offer:", error);
        toast.error("Erro ao gerar oferta");
      } else {
        toast.success("Oferta gerada com sucesso!");
        setIsGenerated(true);
        onOfferGenerated();
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro ao gerar oferta");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerated) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Oferta Gerada com Sucesso!</h3>
          <p className="text-muted-foreground mt-2">
            Sua oferta foi criada com um plano estratégico completo de geração de demanda,
            priorizando Facebook/Meta Ads.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setIsGenerated(false);
            setSelectedIcpId("");
          }}
        >
          Gerar Outra Oferta
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Opcional:</strong> Gere uma oferta com IA baseada nas informações do PPP.
          Você pode pular esta etapa e gerar ofertas depois no Gerador IA.
        </p>
      </div>

      {/* Informação sobre a IA Estrategista */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h4 className="font-medium">IA Estrategista de Demanda</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          A IA irá analisar automaticamente o contexto do seu negócio e criar um 
          <strong> Plano Estratégico de Geração de Demanda</strong> completo, incluindo:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
          <li><strong>Facebook/Meta Ads</strong> como canal principal (nosso forte)</li>
          <li>Canais complementares integrados e sinérgicos</li>
          <li>Funil de aquisição completo (TOFU, MOFU, BOFU)</li>
          <li>Cronograma de implementação sugerido</li>
          <li>Estimativas de orçamento relativo por canal</li>
        </ul>
      </div>

      {/* Seleção de ICP */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Selecione o ICP para esta oferta
        </Label>
        <Select value={selectedIcpId} onValueChange={setSelectedIcpId}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um ICP..." />
          </SelectTrigger>
          <SelectContent>
            {icps.map((icp) => (
              <SelectItem key={icp.id} value={icp.id}>
                {icp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Cada oferta é gerada especificamente para um ICP. Você pode gerar ofertas para outros ICPs depois.
        </p>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!selectedIcpId || isGenerating}
        className="w-full gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando Oferta + Plano de Demanda...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Gerar Oferta com IA Estrategista
          </>
        )}
      </Button>
    </div>
  );
}
