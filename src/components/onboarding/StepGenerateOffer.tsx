import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Megaphone,
  Users,
  Share2,
  Mail,
  Search,
  Smartphone,
  Globe,
  UserPlus,
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

const DEMAND_CHANNELS = [
  { id: "meta_ads", label: "Meta Ads (Facebook/Instagram)", icon: Share2 },
  { id: "google_ads", label: "Google Ads", icon: Search },
  { id: "tiktok_ads", label: "TikTok Ads", icon: Smartphone },
  { id: "referral", label: "Programa de Indicação", icon: UserPlus },
  { id: "influencers", label: "Parceria com Influenciadores", icon: Users },
  { id: "outbound", label: "Outbound (Prospecção ativa)", icon: Megaphone },
  { id: "content_marketing", label: "Marketing de Conteúdo", icon: Globe },
  { id: "email_marketing", label: "Email Marketing", icon: Mail },
];

export function StepGenerateOffer({ clientId, icps, onOfferGenerated }: StepGenerateOfferProps) {
  const [selectedIcpId, setSelectedIcpId] = useState<string>("");
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const toggleChannel = (channelId: string) => {
    const newSet = new Set(selectedChannels);
    if (newSet.has(channelId)) {
      newSet.delete(channelId);
    } else {
      newSet.add(channelId);
    }
    setSelectedChannels(newSet);
  };

  const handleGenerate = async () => {
    if (!selectedIcpId) {
      toast.error("Selecione um ICP para gerar a oferta");
      return;
    }

    if (selectedChannels.size === 0) {
      toast.error("Selecione pelo menos um canal de geração de demanda");
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch PPP data for the selected ICP
      const [profileRes, icpRes, painRes, promiseRes] = await Promise.all([
        supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("icps").select("*").eq("id", selectedIcpId).maybeSingle(),
        supabase.from("icp_pains").select("*").eq("icp_id", selectedIcpId).maybeSingle(),
        supabase.from("client_promise").select("*").eq("client_id", clientId).maybeSingle(),
      ]);

      const pppData = {
        profile: profileRes.data,
        icps: icpRes.data ? [icpRes.data] : [],
        pains: painRes.data ? [painRes.data] : [],
        promise: promiseRes.data,
      };

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "offer",
          clientId,
          icpId: selectedIcpId,
          pppData,
          demandChannels: Array.from(selectedChannels),
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
            Sua oferta foi criada e inclui estratégias personalizadas para os canais selecionados.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setIsGenerated(false);
            setSelectedIcpId("");
            setSelectedChannels(new Set());
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

      <Separator />

      {/* Canais de Geração de Demanda */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Oportunidades de Geração de Demanda
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione os canais que você pretende usar. A IA irá sugerir estratégias específicas para cada um.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DEMAND_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isSelected = selectedChannels.has(channel.id);

            return (
              <div
                key={channel.id}
                className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => toggleChannel(channel.id)}
              >
                <Checkbox
                  id={channel.id}
                  checked={isSelected}
                  onCheckedChange={() => toggleChannel(channel.id)}
                />
                <Label
                  htmlFor={channel.id}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{channel.label}</span>
                </Label>
              </div>
            );
          })}
        </div>

        {selectedChannels.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Selecionados:</span>
            {Array.from(selectedChannels).map((channelId) => {
              const channel = DEMAND_CHANNELS.find((c) => c.id === channelId);
              return (
                <Badge key={channelId} variant="secondary">
                  {channel?.label}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      <Button
        onClick={handleGenerate}
        disabled={!selectedIcpId || selectedChannels.size === 0 || isGenerating}
        className="w-full gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando Oferta...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Gerar Oferta com IA
          </>
        )}
      </Button>
    </div>
  );
}
