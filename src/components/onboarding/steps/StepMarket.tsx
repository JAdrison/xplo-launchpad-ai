import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Loader2, TrendingUp, Users, Shield, Instagram, Facebook } from "lucide-react";
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

const CURRENT_REVENUE_OPTIONS = [
  { value: "ate_10k", label: "Até R$ 10.000" },
  { value: "10k_30k", label: "R$ 10.000 - R$ 30.000" },
  { value: "30k_50k", label: "R$ 30.000 - R$ 50.000" },
  { value: "50k_100k", label: "R$ 50.000 - R$ 100.000" },
  { value: "100k_200k", label: "R$ 100.000 - R$ 200.000" },
  { value: "acima_200k", label: "Acima de R$ 200.000" },
];

const INVESTMENT_OPTIONS = [
  { value: "nenhum", label: "Nenhum investimento" },
  { value: "ate_1k", label: "Até R$ 1.000" },
  { value: "1k_5k", label: "R$ 1.000 - R$ 5.000" },
  { value: "5k_10k", label: "R$ 5.000 - R$ 10.000" },
  { value: "10k_20k", label: "R$ 10.000 - R$ 20.000" },
  { value: "acima_20k", label: "Acima de R$ 20.000" },
];

const TRAFFIC_INVESTMENT_OPTIONS = [
  { value: "1000", label: "R$ 1.000" },
  { value: "1500", label: "R$ 1.500" },
  { value: "2000", label: "R$ 2.000" },
  { value: "5000", label: "R$ 5.000" },
  { value: "outro", label: "Outro valor" },
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
  const [showCustomTrafficInput, setShowCustomTrafficInput] = useState(false);
  const [customTrafficValue, setCustomTrafficValue] = useState("");

  const [formData, setFormData] = useState({
    demand_channels: [] as string[],
    other_channel: "",
    current_revenue: "",
    monthly_investment: "",
    initial_traffic_investment: "",
    sales_team_size: "",
    revenue_goal: "",
    instagram_link: "",
    instagram_login: "",
    instagram_password: "",
    facebook_login: "",
    facebook_password: "",
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
      const savedTrafficInv = data.initial_traffic_investment || "";
      const isCustom = savedTrafficInv && !TRAFFIC_INVESTMENT_OPTIONS.some(o => o.value === savedTrafficInv);
      
      setFormData({
        demand_channels: data.demand_channels || [],
        other_channel: "",
        current_revenue: data.current_revenue || "",
        monthly_investment: data.monthly_investment || "",
        initial_traffic_investment: isCustom ? "outro" : savedTrafficInv,
        sales_team_size: data.sales_team_size || "",
        revenue_goal: data.revenue_goal || "",
        instagram_link: (data as any).instagram_link || "",
        instagram_login: (data as any).instagram_login || "",
        instagram_password: (data as any).instagram_password || "",
        facebook_login: (data as any).facebook_login || "",
        facebook_password: (data as any).facebook_password || "",
      });

      if (isCustom) {
        setShowCustomTrafficInput(true);
        setCustomTrafficValue(savedTrafficInv);
      }
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

  const handleTrafficInvestmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, initial_traffic_investment: value }));
    if (value === "outro") {
      setShowCustomTrafficInput(true);
    } else {
      setShowCustomTrafficInput(false);
      setCustomTrafficValue("");
    }
  };

  // Calculate estimated leads
  const estimatedLeads = useMemo(() => {
    let investment = 0;
    
    if (formData.initial_traffic_investment === "outro" && customTrafficValue) {
      investment = parseFloat(customTrafficValue.replace(/\D/g, "")) || 0;
    } else if (formData.initial_traffic_investment && formData.initial_traffic_investment !== "outro") {
      investment = parseFloat(formData.initial_traffic_investment) || 0;
    }

    if (investment > 0) {
      const minLeads = Math.floor(investment / 15);
      const maxLeads = Math.floor(investment / 7);
      return { min: minLeads, max: maxLeads, investment };
    }
    return null;
  }, [formData.initial_traffic_investment, customTrafficValue]);

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const trafficInvestment = formData.initial_traffic_investment === "outro" 
        ? customTrafficValue 
        : formData.initial_traffic_investment;

      const profileData = {
        demand_channels: formData.demand_channels.length > 0 ? formData.demand_channels : null,
        current_revenue: formData.current_revenue || null,
        monthly_investment: formData.monthly_investment || null,
        initial_traffic_investment: trafficInvestment || null,
        sales_team_size: formData.sales_team_size || null,
        revenue_goal: formData.revenue_goal.trim() || null,
        instagram_link: formData.instagram_link.trim() || null,
        instagram_login: formData.instagram_login.trim() || null,
        instagram_password: formData.instagram_password || null,
        facebook_login: formData.facebook_login.trim() || null,
        facebook_password: formData.facebook_password || null,
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
          Faturamento, investimento em marketing e metas
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

        {/* Faturamento Atual */}
        <div className="space-y-2">
          <Label htmlFor="current_revenue">Faturamento Mensal Atual</Label>
          <Select
            value={formData.current_revenue}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, current_revenue: value }))}
          >
            <SelectTrigger id="current_revenue">
              <SelectValue placeholder="Selecione uma faixa..." />
            </SelectTrigger>
            <SelectContent>
              {CURRENT_REVENUE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Investimento Mensal (Atual) */}
        <div className="space-y-2">
          <Label htmlFor="monthly_investment">Investimento Mensal em Marketing (Atual)</Label>
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

        {/* Investimento Inicial em Tráfego */}
        <div className="space-y-3">
          <Label>Quanto vai investir inicialmente em tráfego?</Label>
          <div className="flex flex-wrap gap-2">
            {TRAFFIC_INVESTMENT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={formData.initial_traffic_investment === option.value ? "default" : "outline"}
                onClick={() => handleTrafficInvestmentChange(option.value)}
                size="sm"
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {showCustomTrafficInput && (
            <Input
              placeholder="Digite o valor (ex: 3000)"
              value={customTrafficValue}
              onChange={(e) => setCustomTrafficValue(e.target.value)}
              className="mt-2"
            />
          )}

          {/* Lead Estimation Card */}
          {estimatedLeads && (
            <div className="p-4 rounded-lg border bg-primary/5 space-y-2 mt-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Estimativa de Leads</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Com R$ {estimatedLeads.investment.toLocaleString('pt-BR')}, você pode gerar de{" "}
                <span className="font-semibold text-foreground">{estimatedLeads.min} a {estimatedLeads.max} leads</span>
              </p>
              <p className="text-xs text-muted-foreground">
                (CPL estimado: R$ 7 a R$ 15)
              </p>
            </div>
          )}
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

        {/* Meta Ads Credentials Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-primary" />
            <Facebook className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Acesso às Redes Sociais (Meta Ads)</h3>
          </div>

          <Alert className="bg-muted/50">
            <AlertDescription>
              O tráfego pago será realizado através do <strong>Meta Ads</strong> (Facebook/Instagram). 
              Para configurar e gerenciar suas campanhas, precisamos do acesso às suas contas.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="instagram_link">Link do Instagram</Label>
            <Input
              id="instagram_link"
              placeholder="@usuario ou https://instagram.com/usuario"
              value={formData.instagram_link}
              onChange={(e) => setFormData((prev) => ({ ...prev, instagram_link: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instagram_login">Login do Instagram</Label>
              <Input
                id="instagram_login"
                placeholder="E-mail ou usuário"
                value={formData.instagram_login}
                onChange={(e) => setFormData((prev) => ({ ...prev, instagram_login: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_password">Senha do Instagram</Label>
              <Input
                id="instagram_password"
                type="password"
                placeholder="••••••••"
                value={formData.instagram_password}
                onChange={(e) => setFormData((prev) => ({ ...prev, instagram_password: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebook_login">Login do Facebook</Label>
              <Input
                id="facebook_login"
                placeholder="E-mail ou usuário"
                value={formData.facebook_login}
                onChange={(e) => setFormData((prev) => ({ ...prev, facebook_login: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook_password">Senha do Facebook</Label>
              <Input
                id="facebook_password"
                type="password"
                placeholder="••••••••"
                value={formData.facebook_password}
                onChange={(e) => setFormData((prev) => ({ ...prev, facebook_password: e.target.value }))}
              />
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Conformidade com a LGPD:</strong> Suas credenciais são protegidas por criptografia e 
              armazenadas de forma segura. Não compartilhamos seus dados com terceiros e utilizamos 
              apenas para a gestão das suas campanhas de tráfego pago.
            </AlertDescription>
          </Alert>
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
