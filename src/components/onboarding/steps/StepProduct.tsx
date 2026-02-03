import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type SalesModel = Database["public"]["Enums"]["sales_model"];
import { ArrowLeft, ArrowRight, Loader2, X, Plus, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ClientProfile = Tables<"client_profile">;

interface StepProductProps {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

const SALES_MODELS = [
  { value: "b2b", label: "B2B (Empresa para Empresa)" },
  { value: "b2c", label: "B2C (Direto ao Consumidor)" },
  { value: "recurring", label: "Recorrente (Assinaturas)" },
  { value: "project", label: "Por Projeto" },
  { value: "hybrid", label: "Híbrido" },
];

export function StepProduct({ clientId, onNext, onPrevious }: StepProductProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(null);

  const [formData, setFormData] = useState({
    product_name: "",
    product_description: "",
    average_ticket: "",
    sales_model: "",
    differentiators: [] as string[],
    benefits: [] as string[],
    promotions: "",
  });

  const [newDifferentiator, setNewDifferentiator] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

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
        product_name: data.product_name || "",
        product_description: data.product_description || "",
        average_ticket: data.average_ticket || "",
        sales_model: data.sales_model || "",
        differentiators: data.differentiators || [],
        benefits: data.benefits || [],
        promotions: data.promotions || "",
      });
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDifferentiator = () => {
    if (newDifferentiator.trim() && formData.differentiators.length < 5) {
      setFormData((prev) => ({
        ...prev,
        differentiators: [...prev.differentiators, newDifferentiator.trim()],
      }));
      setNewDifferentiator("");
    }
  };

  const handleRemoveDifferentiator = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      differentiators: prev.differentiators.filter((_, i) => i !== index),
    }));
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && formData.benefits.length < 5) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.product_name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do produto/serviço.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const profileData = {
        client_id: clientId,
        product_name: formData.product_name.trim(),
        product_description: formData.product_description.trim() || null,
        average_ticket: formData.average_ticket.trim() || null,
        sales_model: (formData.sales_model || null) as SalesModel | null,
        differentiators: formData.differentiators.length > 0 ? formData.differentiators : null,
        benefits: formData.benefits.length > 0 ? formData.benefits : null,
        promotions: formData.promotions.trim() || null,
      };

      if (profile) {
        await supabase
          .from("client_profile")
          .update(profileData)
          .eq("id", profile.id);
      } else {
        await supabase.from("client_profile").insert(profileData);
      }

      toast({
        title: "Produto salvo",
        description: "Informações do produto atualizadas.",
      });

      onNext();
    } catch (error) {
      console.error("Error saving profile:", error);
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
          <Package className="h-5 w-5" />
          Sobre seu Produto/Serviço
        </CardTitle>
        <CardDescription>
          Descreva o que você oferece aos seus clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product_name">Nome do Produto/Serviço *</Label>
            <Input
              id="product_name"
              name="product_name"
              placeholder="Ex: Consultoria de Marketing Digital"
              value={formData.product_name}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="average_ticket">Ticket Médio</Label>
            <Input
              id="average_ticket"
              name="average_ticket"
              placeholder="Ex: R$ 2.000 - R$ 5.000"
              value={formData.average_ticket}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sales_model">Modelo de Venda</Label>
          <Select
            value={formData.sales_model}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, sales_model: value }))}
          >
            <SelectTrigger id="sales_model">
              <SelectValue placeholder="Selecione o modelo..." />
            </SelectTrigger>
            <SelectContent>
              {SALES_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_description">Descrição</Label>
          <Textarea
            id="product_description"
            name="product_description"
            placeholder="Descreva o que seu produto/serviço oferece..."
            value={formData.product_description}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {/* Diferenciais */}
        <div className="space-y-2">
          <Label>Diferenciais (até 5)</Label>
          <p className="text-xs text-muted-foreground">O que te diferencia da concorrência?</p>
          <div className="flex gap-2">
            <Input
              placeholder="Adicione um diferencial..."
              value={newDifferentiator}
              onChange={(e) => setNewDifferentiator(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDifferentiator();
                }
              }}
              disabled={formData.differentiators.length >= 5}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddDifferentiator}
              disabled={formData.differentiators.length >= 5 || !newDifferentiator.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.differentiators.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.differentiators.map((diff, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {diff}
                  <button
                    type="button"
                    onClick={() => handleRemoveDifferentiator(index)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Benefícios */}
        <div className="space-y-2">
          <Label>Benefícios (até 5)</Label>
          <p className="text-xs text-muted-foreground">Quais resultados ou vantagens o cliente obtém?</p>
          <div className="flex gap-2">
            <Input
              placeholder="Adicione um benefício..."
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddBenefit();
                }
              }}
              disabled={formData.benefits.length >= 5}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddBenefit}
              disabled={formData.benefits.length >= 5 || !newBenefit.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.benefits.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.benefits.map((benefit, index) => (
                <Badge key={index} variant="outline" className="gap-1">
                  {benefit}
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(index)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Promoções */}
        <div className="space-y-2">
          <Label htmlFor="promotions">Promoções Ativas (opcional)</Label>
          <Textarea
            id="promotions"
            name="promotions"
            placeholder="Descreva promoções ou ofertas especiais que você está realizando..."
            value={formData.promotions}
            onChange={handleChange}
            rows={2}
          />
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
