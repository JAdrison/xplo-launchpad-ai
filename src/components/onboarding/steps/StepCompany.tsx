import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;
type ClientProfile = Tables<"client_profile">;

interface StepCompanyProps {
  clientId: string;
  onNext: () => void;
}

export function StepCompany({ clientId, onNext }: StepCompanyProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newRegion, setNewRegion] = useState("");
  
  const [formData, setFormData] = useState({
    niche: "",
    regions: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    const [clientRes, profileRes] = await Promise.all([
      supabase.from("clients").select("niche").eq("id", clientId).maybeSingle(),
      supabase.from("client_profile").select("region").eq("client_id", clientId).maybeSingle(),
    ]);

    setFormData({
      niche: clientRes.data?.niche || "",
      regions: profileRes.data?.region || [],
    });

    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddRegion = () => {
    if (newRegion.trim() && !formData.regions.includes(newRegion.trim())) {
      setFormData((prev) => ({
        ...prev,
        regions: [...prev.regions, newRegion.trim()],
      }));
      setNewRegion("");
    }
  };

  const handleRemoveRegion = (regionToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      regions: prev.regions.filter((r) => r !== regionToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.niche.trim()) {
      toast({
        title: "Nicho obrigatório",
        description: "Por favor, informe o nicho/segmento de atuação.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update client niche
      await supabase
        .from("clients")
        .update({ niche: formData.niche.trim() })
        .eq("id", clientId);

      // Check if profile exists and upsert region
      const { data: existingProfile } = await supabase
        .from("client_profile")
        .select("id")
        .eq("client_id", clientId)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from("client_profile")
          .update({ region: formData.regions.length > 0 ? formData.regions : null })
          .eq("client_id", clientId);
      } else {
        await supabase
          .from("client_profile")
          .insert({ client_id: clientId, region: formData.regions.length > 0 ? formData.regions : null });
      }

      toast({
        title: "Dados salvos",
        description: "Informações da empresa atualizadas.",
      });

      onNext();
    } catch (error) {
      console.error("Error saving company data:", error);
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
          <Building2 className="h-5 w-5" />
          Sobre sua Empresa
        </CardTitle>
        <CardDescription>
          Informações básicas sobre seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="niche">Nicho/Segmento de Atuação *</Label>
            <Input
              id="niche"
              name="niche"
              placeholder="Ex: Academias, Clínicas, Restaurantes, E-commerce..."
              value={formData.niche}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              Qual é o mercado principal em que sua empresa atua?
            </p>
          </div>

          <div className="space-y-2">
            <Label>Região de Atuação</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Zona Sul de SP, Florianópolis, Santa Catarina..."
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRegion();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRegion}
                disabled={!newRegion.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Informe bairros, cidades ou estados onde você atua. Adicione uma região por vez.
            </p>
            
            {formData.regions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.regions.map((region, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {region}
                    <button
                      type="button"
                      onClick={() => handleRemoveRegion(region)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
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
