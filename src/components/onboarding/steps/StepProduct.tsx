import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ClientProfile = Tables<"client_profile">;

interface StepProductProps {
  clientId: string;
  onNext: () => void;
}

export function StepProduct({ clientId, onNext }: StepProductProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(null);

  const [formData, setFormData] = useState({
    product_name: "",
    product_description: "",
    average_ticket: "",
    region: "",
    differentiators: [] as string[],
  });

  const [newDifferentiator, setNewDifferentiator] = useState("");

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
        region: data.region || "",
        differentiators: data.differentiators || [],
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
        region: formData.region.trim() || null,
        differentiators: formData.differentiators.length > 0 ? formData.differentiators : null,
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
        <CardTitle>Sobre seu Produto/Serviço</CardTitle>
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
          <Label htmlFor="product_description">Descrição</Label>
          <Textarea
            id="product_description"
            name="product_description"
            placeholder="Descreva o que seu produto/serviço oferece..."
            value={formData.product_description}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Região de Atuação</Label>
          <Input
            id="region"
            name="region"
            placeholder="Ex: Brasil, São Paulo, Nacional..."
            value={formData.region}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Diferenciais (até 5)</Label>
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

        <div className="flex justify-end pt-4">
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
