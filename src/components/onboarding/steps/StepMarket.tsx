import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ClientProfile = Tables<"client_profile">;

interface StepMarketProps {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

const DEMAND_CHANNELS = [
  { id: "instagram", label: "Instagram/Redes Sociais" },
  { id: "google_ads", label: "Google Ads" },
  { id: "facebook_ads", label: "Facebook/Meta Ads" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "indicacoes", label: "Indicações" },
  { id: "eventos", label: "Eventos" },
  { id: "organico", label: "Tráfego Orgânico/SEO" },
  { id: "email", label: "E-mail Marketing" },
];

const INVESTMENT_OPTIONS = [
  { value: "nenhum", label: "Nenhum investimento" },
  { value: "ate_1k", label: "Até R$ 1.000" },
  { value: "1k_5k", label: "R$ 1.000 - R$ 5.000" },
  { value: "5k_10k", label: "R$ 5.000 - R$ 10.000" },
  { value: "10k_20k", label: "R$ 10.000 - R$ 20.000" },
  { value: "acima_20k", label: "Acima de R$ 20.000" },
];

const TEAM_SIZE_OPTIONS = [
  { value: "solo", label: "Só eu" },
  { value: "1_3", label: "1 a 3 pessoas" },
  { value: "4_10", label: "4 a 10 pessoas" },
  { value: "acima_10", label: "Mais de 10 pessoas" },
];

export function StepMarket({ clientId, onNext, onPrevious }: StepMarketProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(null);

  const [formData, setFormData] = useState({
    demand_channels: [] as string[],
    other_channel: "",
    monthly_investment: "",
    sales_team_size: "",
    revenue_goal: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [clientId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("client_profile")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setFormData({
        demand_channels: data.demand_channels || [],
        other_channel: "",
        monthly_investment: data.monthly_investment || "",
        sales_team_size: data.sales_team_size || "",
        revenue_goal: data.revenue_goal || "",
      });
    }
    setIsLoading(false);
  };

  const handleChannelChange = (channelId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      demand_channels: checked
        ? [...prev.demand_channels, channelId]
        : prev.demand_channels.filter((c) => c !== channelId),
    }));
  };

  const handleAddOtherChannel = () => {
    if (formData.other_channel.trim()) {
      setFormData((prev) => ({
        ...prev,
        demand_channels: [...prev.demand_channels, `outro:${formData.other_channel.trim()}`],
        other_channel: "",
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const profileData = {
        demand_channels: formData.demand_channels.length > 0 ? formData.demand_channels : null,
        monthly_investment: formData.monthly_investment || null,
        sales_team_size: formData.sales_team_size || null,
        revenue_goal: formData.revenue_goal.trim() || null,
      };

      if (profile) {
        await supabase
          .from("client_profile")
          .update(profileData)
          .eq("id", profile.id);
      } else {
        await supabase
          .from("client_profile")
          .insert({ client_id: clientId, ...profileData });
      }

      toast({
        title: "Dados de mercado salvos",
        description: "Informações atualizadas com sucesso.",
      });

      onNext();
    } catch (error) {
      console.error("Error saving market data:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Sobre seu Mercado
        </CardTitle>
        <CardDescription>
          Informações sobre como você atrai clientes e suas metas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Canais de Demanda */}
        <div className="space-y-3">
          <Label>Como você gera clientes hoje? (selecione quantos quiser)</Label>
          <div className="grid grid-cols-2 gap-3">
            {DEMAND_CHANNELS.map((channel) => (
              <div key={channel.id} className="flex items-center space-x-2">
                <Checkbox
                  id={channel.id}
                  checked={formData.demand_channels.includes(channel.id)}
                  onCheckedChange={(checked) => 
                    handleChannelChange(channel.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={channel.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {channel.label}
                </label>
              </div>
            ))}
          </div>
          
          {/* Other channel input */}
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Outro canal..."
              value={formData.other_channel}
              onChange={(e) => setFormData((prev) => ({ ...prev, other_channel: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddOtherChannel();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddOtherChannel}
              disabled={!formData.other_channel.trim()}
            >
              Adicionar
            </Button>
          </div>
          
          {/* Show other channels added */}
          {formData.demand_channels
            .filter((c) => c.startsWith("outro:"))
            .map((c) => (
              <div key={c} className="text-sm text-muted-foreground">
                + {c.replace("outro:", "")}
              </div>
            ))}
        </div>

        {/* Investimento Mensal */}
        <div className="space-y-2">
          <Label htmlFor="monthly_investment">Investimento Mensal em Marketing</Label>
          <Select
            value={formData.monthly_investment}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, monthly_investment: value }))}
          >
            <SelectTrigger id="monthly_investment">
              <SelectValue placeholder="Selecione uma faixa..." />
            </SelectTrigger>
            <SelectContent>
              {INVESTMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tamanho da Equipe */}
        <div className="space-y-2">
          <Label htmlFor="sales_team_size">Tamanho da Equipe de Vendas</Label>
          <Select
            value={formData.sales_team_size}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, sales_team_size: value }))}
          >
            <SelectTrigger id="sales_team_size">
              <SelectValue placeholder="Selecione o tamanho..." />
            </SelectTrigger>
            <SelectContent>
              {TEAM_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Meta de Faturamento */}
        <div className="space-y-2">
          <Label htmlFor="revenue_goal">Meta de Faturamento Mensal</Label>
          <Input
            id="revenue_goal"
            placeholder="Ex: R$ 50.000 ou R$ 100.000"
            value={formData.revenue_goal}
            onChange={(e) => setFormData((prev) => ({ ...prev, revenue_goal: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Qual faturamento mensal você deseja alcançar?
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
