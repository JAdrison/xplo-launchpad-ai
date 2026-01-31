import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Check, 
  Package, 
  Users, 
  AlertTriangle, 
  Sparkles, 
  FileCheck,
  Plus,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface ProductData {
  product_name: string;
  product_description: string;
  differentiators: string[];
}

interface ICP {
  id?: string;
  name: string;
  segment: string;
  characteristics: string;
  current_situation: string;
}

interface ICPPain {
  icp_id: string;
  icp_name: string;
  main_pain: string;
  consequence: string;
  daily_impacts: string[];
}

interface FormData {
  product: ProductData;
  icps: ICP[];
  pains: ICPPain[];
  promise: string;
}

const STEPS = [
  { number: 1, name: "Produto", icon: Package, description: "Descreva seu produto/serviço" },
  { number: 2, name: "ICPs", icon: Users, description: "Defina seus clientes ideais" },
  { number: 3, name: "Dores", icon: AlertTriangle, description: "Mapeie as dores de cada ICP" },
  { number: 4, name: "Promessa", icon: Sparkles, description: "Crie sua promessa principal" },
  { number: 5, name: "Revisão", icon: FileCheck, description: "Revise e finalize" },
];

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clientId = searchParams.get("client");
  const stepParam = searchParams.get("step");

  const [client, setClient] = useState<Client | null>(null);
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam, 10) : 1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    product: { product_name: "", product_description: "", differentiators: [""] },
    icps: [{ name: "", segment: "", characteristics: "", current_situation: "" }],
    pains: [],
    promise: "",
  });

  // Carregar cliente e dados existentes
  useEffect(() => {
    if (clientId) {
      fetchClientData();
    } else {
      setIsLoading(false);
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      // Buscar cliente
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) {
        toast.error("Cliente não encontrado");
        navigate("/clients");
        return;
      }

      setClient(clientData);

      // Buscar profile existente
      const { data: profileData } = await supabase
        .from("client_profile")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();

      // Buscar ICPs existentes
      const { data: icpsData } = await supabase
        .from("icps")
        .select("*")
        .eq("client_id", clientId)
        .order("sort_order");

      // Buscar pains existentes
      const { data: painsData } = await supabase
        .from("icp_pains")
        .select("*, icps(name)")
        .eq("icps.client_id", clientId);

      // Buscar promessa existente
      const { data: promiseData } = await supabase
        .from("client_promise")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();

      // Popular formData com dados existentes
      setFormData({
        product: {
          product_name: profileData?.product_name || clientData.product_description || "",
          product_description: profileData?.product_description || "",
          differentiators: profileData?.differentiators?.length ? profileData.differentiators : [""],
        },
        icps: icpsData?.length 
          ? icpsData.map(icp => ({
              id: icp.id,
              name: icp.name,
              segment: icp.segment || "",
              characteristics: icp.characteristics || "",
              current_situation: icp.current_situation || "",
            }))
          : [{ name: "", segment: "", characteristics: "", current_situation: "" }],
        pains: painsData?.length
          ? painsData.map(pain => ({
              icp_id: pain.icp_id,
              icp_name: (pain.icps as any)?.name || "",
              main_pain: pain.main_pain || "",
              consequence: pain.consequence || "",
              daily_impacts: pain.daily_impacts || [""],
            }))
          : [],
        promise: promiseData?.promise_text || "",
      });

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do cliente");
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentStep = async () => {
    if (!clientId) return;
    setIsSaving(true);

    try {
      switch (currentStep) {
        case 1: // Produto
          // Upsert client_profile
          const { data: existingProfile } = await supabase
            .from("client_profile")
            .select("id")
            .eq("client_id", clientId)
            .maybeSingle();

          const profilePayload = {
            client_id: clientId,
            product_name: formData.product.product_name,
            product_description: formData.product.product_description,
            differentiators: formData.product.differentiators.filter(d => d.trim()),
          };

          if (existingProfile) {
            await supabase
              .from("client_profile")
              .update(profilePayload)
              .eq("id", existingProfile.id);
          } else {
            await supabase.from("client_profile").insert(profilePayload);
          }
          break;

        case 2: // ICPs
          // Deletar ICPs antigos e inserir novos
          await supabase.from("icps").delete().eq("client_id", clientId);
          
          const validIcps = formData.icps.filter(icp => icp.name.trim());
          if (validIcps.length > 0) {
            const { data: insertedIcps } = await supabase
              .from("icps")
              .insert(
                validIcps.map((icp, index) => ({
                  client_id: clientId,
                  name: icp.name,
                  segment: icp.segment || null,
                  characteristics: icp.characteristics || null,
                  current_situation: icp.current_situation || null,
                  sort_order: index,
                }))
              )
              .select();

            // Atualizar IDs nos ICPs
            if (insertedIcps) {
              setFormData(prev => ({
                ...prev,
                icps: insertedIcps.map(icp => ({
                  id: icp.id,
                  name: icp.name,
                  segment: icp.segment || "",
                  characteristics: icp.characteristics || "",
                  current_situation: icp.current_situation || "",
                })),
              }));

              // Inicializar pains para cada ICP se não existirem
              const existingPainIcpIds = new Set(formData.pains.map(p => p.icp_id));
              const newPains = insertedIcps
                .filter(icp => !existingPainIcpIds.has(icp.id))
                .map(icp => ({
                  icp_id: icp.id,
                  icp_name: icp.name,
                  main_pain: "",
                  consequence: "",
                  daily_impacts: [""],
                }));

              if (newPains.length > 0) {
                setFormData(prev => ({
                  ...prev,
                  pains: [...prev.pains.filter(p => insertedIcps.some(i => i.id === p.icp_id)), ...newPains],
                }));
              }
            }
          }
          break;

        case 3: // Dores
          // Para cada ICP, upsert suas dores
          for (const pain of formData.pains) {
            if (!pain.icp_id) continue;

            const { data: existingPain } = await supabase
              .from("icp_pains")
              .select("id")
              .eq("icp_id", pain.icp_id)
              .maybeSingle();

            const painPayload = {
              icp_id: pain.icp_id,
              main_pain: pain.main_pain || null,
              consequence: pain.consequence || null,
              daily_impacts: pain.daily_impacts.filter(d => d.trim()),
            };

            if (existingPain) {
              await supabase.from("icp_pains").update(painPayload).eq("id", existingPain.id);
            } else {
              await supabase.from("icp_pains").insert(painPayload);
            }
          }
          break;

        case 4: // Promessa
          const { data: existingPromise } = await supabase
            .from("client_promise")
            .select("id")
            .eq("client_id", clientId)
            .maybeSingle();

          const promisePayload = {
            client_id: clientId,
            promise_text: formData.promise || null,
            generated_by_ai: false,
          };

          if (existingPromise) {
            await supabase.from("client_promise").update(promisePayload).eq("id", existingPromise.id);
          } else {
            await supabase.from("client_promise").insert(promisePayload);
          }
          break;
      }

      toast.success("Progresso salvo!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar progresso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    await saveCurrentStep();
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Atualizar status do cliente para ppp_completed
      await supabase
        .from("clients")
        .update({ status: "ppp_completed" })
        .eq("id", clientId);

      toast.success("Onboarding PPP concluído com sucesso!");
      navigate(`/clients/${clientId}`);
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      toast.error("Erro ao finalizar onboarding");
    } finally {
      setIsSaving(false);
    }
  };

  // Estado: Sem cliente selecionado
  if (!clientId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Onboarding PPP</h1>
          <p className="text-muted-foreground">Processo de discovery em 5 etapas</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Selecione um cliente</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Para iniciar o onboarding PPP, primeiro selecione ou crie um cliente.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/clients">
                Ir para Clientes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado: Carregando
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progressPercent = (currentStep / 5) * 100;
  const currentStepInfo = STEPS[currentStep - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/clients/${clientId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                Onboarding PPP
              </h1>
              <p className="text-muted-foreground">{client?.name}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          Etapa {currentStep} de 5
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{currentStepInfo.name}</span>
              <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>
          </div>

          {/* Step indicators */}
          <div className="mt-6 flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? "text-primary" : isCompleted ? "text-primary/60" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                        ? "border-primary/60 bg-primary/10"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentStepInfo.icon className="h-5 w-5" />
            {currentStepInfo.name}
          </CardTitle>
          <CardDescription>{currentStepInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Produto */}
          {currentStep === 1 && (
            <StepProduct formData={formData} setFormData={setFormData} />
          )}

          {/* Step 2: ICPs */}
          {currentStep === 2 && (
            <StepICPs formData={formData} setFormData={setFormData} />
          )}

          {/* Step 3: Dores */}
          {currentStep === 3 && (
            <StepPains formData={formData} setFormData={setFormData} />
          )}

          {/* Step 4: Promessa */}
          {currentStep === 4 && (
            <StepPromise formData={formData} setFormData={setFormData} />
          )}

          {/* Step 5: Revisão */}
          {currentStep === 5 && (
            <StepReview formData={formData} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isSaving}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {currentStep < 5 ? (
          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Concluir Onboarding
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Produto
function StepProduct({ formData, setFormData }: { formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>> }) {
  const updateProduct = (field: keyof ProductData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      product: { ...prev.product, [field]: value },
    }));
  };

  const addDifferentiator = () => {
    setFormData(prev => ({
      ...prev,
      product: { ...prev.product, differentiators: [...prev.product.differentiators, ""] },
    }));
  };

  const updateDifferentiator = (index: number, value: string) => {
    const updated = [...formData.product.differentiators];
    updated[index] = value;
    updateProduct("differentiators", updated);
  };

  const removeDifferentiator = (index: number) => {
    if (formData.product.differentiators.length > 1) {
      const updated = formData.product.differentiators.filter((_, i) => i !== index);
      updateProduct("differentiators", updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product_name">Nome do Produto/Serviço</Label>
        <Input
          id="product_name"
          placeholder="Ex: Consultoria de Marketing Digital"
          value={formData.product.product_name}
          onChange={(e) => updateProduct("product_name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_description">Descrição detalhada</Label>
        <Textarea
          id="product_description"
          placeholder="Descreva o que você vende, como funciona, qual problema resolve..."
          rows={4}
          value={formData.product.product_description}
          onChange={(e) => updateProduct("product_description", e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Diferenciais</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDifferentiator}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        {formData.product.differentiators.map((diff, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Diferencial ${index + 1}`}
              value={diff}
              onChange={(e) => updateDifferentiator(index, e.target.value)}
            />
            {formData.product.differentiators.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeDifferentiator(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 2: ICPs
function StepICPs({ formData, setFormData }: { formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>> }) {
  const addICP = () => {
    if (formData.icps.length < 3) {
      setFormData(prev => ({
        ...prev,
        icps: [...prev.icps, { name: "", segment: "", characteristics: "", current_situation: "" }],
      }));
    }
  };

  const updateICP = (index: number, field: keyof ICP, value: string) => {
    const updated = [...formData.icps];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, icps: updated }));
  };

  const removeICP = (index: number) => {
    if (formData.icps.length > 1) {
      const updated = formData.icps.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, icps: updated }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Defina até 3 perfis de cliente ideal (ICP)
        </p>
        {formData.icps.length < 3 && (
          <Button type="button" variant="outline" size="sm" onClick={addICP}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar ICP
          </Button>
        )}
      </div>

      {formData.icps.map((icp, index) => (
        <Card key={index} className="border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">ICP {index + 1}</CardTitle>
              {formData.icps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeICP(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome/Persona</Label>
                <Input
                  placeholder="Ex: Empresário João"
                  value={icp.name}
                  onChange={(e) => updateICP(index, "name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Input
                  placeholder="Ex: PMEs de tecnologia"
                  value={icp.segment}
                  onChange={(e) => updateICP(index, "segment", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Características</Label>
              <Textarea
                placeholder="Descreva as características desse perfil..."
                rows={2}
                value={icp.characteristics}
                onChange={(e) => updateICP(index, "characteristics", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Situação Atual</Label>
              <Textarea
                placeholder="Como está a situação atual desse perfil?"
                rows={2}
                value={icp.current_situation}
                onChange={(e) => updateICP(index, "current_situation", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Step 3: Dores
function StepPains({ formData, setFormData }: { formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>> }) {
  const validIcps = formData.icps.filter(icp => icp.name.trim());

  // Sincronizar pains com ICPs válidos
  useEffect(() => {
    const currentPainIcpIds = new Set(formData.pains.map(p => p.icp_id));
    const needsUpdate = validIcps.some(icp => icp.id && !currentPainIcpIds.has(icp.id));

    if (needsUpdate && validIcps.some(icp => icp.id)) {
      const updatedPains = validIcps
        .filter(icp => icp.id)
        .map(icp => {
          const existing = formData.pains.find(p => p.icp_id === icp.id);
          return existing || {
            icp_id: icp.id!,
            icp_name: icp.name,
            main_pain: "",
            consequence: "",
            daily_impacts: [""],
          };
        });
      setFormData(prev => ({ ...prev, pains: updatedPains }));
    }
  }, [validIcps]);

  const updatePain = (icpId: string, field: keyof ICPPain, value: string | string[]) => {
    const updated = formData.pains.map(pain =>
      pain.icp_id === icpId ? { ...pain, [field]: value } : pain
    );
    setFormData(prev => ({ ...prev, pains: updated }));
  };

  const addImpact = (icpId: string) => {
    const updated = formData.pains.map(pain =>
      pain.icp_id === icpId
        ? { ...pain, daily_impacts: [...pain.daily_impacts, ""] }
        : pain
    );
    setFormData(prev => ({ ...prev, pains: updated }));
  };

  const updateImpact = (icpId: string, index: number, value: string) => {
    const updated = formData.pains.map(pain => {
      if (pain.icp_id === icpId) {
        const impacts = [...pain.daily_impacts];
        impacts[index] = value;
        return { ...pain, daily_impacts: impacts };
      }
      return pain;
    });
    setFormData(prev => ({ ...prev, pains: updated }));
  };

  const removeImpact = (icpId: string, index: number) => {
    const updated = formData.pains.map(pain => {
      if (pain.icp_id === icpId && pain.daily_impacts.length > 1) {
        return { ...pain, daily_impacts: pain.daily_impacts.filter((_, i) => i !== index) };
      }
      return pain;
    });
    setFormData(prev => ({ ...prev, pains: updated }));
  };

  if (formData.pains.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Salve os ICPs na etapa anterior para mapear as dores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Mapeie as principais dores e frustrações de cada ICP
      </p>

      {formData.pains.map((pain) => (
        <Card key={pain.icp_id} className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {pain.icp_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dor Principal</Label>
              <Textarea
                placeholder="Qual é a maior dor/frustração desse perfil?"
                rows={2}
                value={pain.main_pain}
                onChange={(e) => updatePain(pain.icp_id, "main_pain", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Consequência</Label>
              <Textarea
                placeholder="O que acontece se essa dor não for resolvida?"
                rows={2}
                value={pain.consequence}
                onChange={(e) => updatePain(pain.icp_id, "consequence", e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Impactos no dia a dia</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addImpact(pain.icp_id)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {pain.daily_impacts.map((impact, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Impacto ${index + 1}`}
                    value={impact}
                    onChange={(e) => updateImpact(pain.icp_id, index, e.target.value)}
                  />
                  {pain.daily_impacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImpact(pain.icp_id, index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Step 4: Promessa
function StepPromise({ formData, setFormData }: { formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium mb-2">💡 Dica para criar sua promessa</h4>
        <p className="text-sm text-muted-foreground">
          Uma boa promessa conecta as dores mapeadas com a transformação que seu produto oferece.
          Seja específico e mensurável quando possível.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="promise">Promessa Principal</Label>
        <Textarea
          id="promise"
          placeholder="Ex: Ajudamos empresários de tecnologia a dobrar suas vendas em 90 dias, mesmo que nunca tenham investido em marketing digital..."
          rows={6}
          value={formData.promise}
          onChange={(e) => setFormData(prev => ({ ...prev, promise: e.target.value }))}
        />
      </div>

      {/* Resumo das dores para referência */}
      {formData.pains.length > 0 && (
        <div className="space-y-3">
          <Label>Dores mapeadas (referência)</Label>
          <div className="space-y-2">
            {formData.pains.map((pain) => (
              <div key={pain.icp_id} className="rounded border p-3 text-sm">
                <span className="font-medium">{pain.icp_name}:</span>{" "}
                <span className="text-muted-foreground">{pain.main_pain || "Não definida"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 5: Revisão
function StepReview({ formData }: { formData: FormData }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <h4 className="font-medium text-primary mb-2">✓ Revisão Final</h4>
        <p className="text-sm text-muted-foreground">
          Revise todas as informações antes de concluir o onboarding PPP.
        </p>
      </div>

      {/* Produto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Nome:</span>{" "}
            <span className="text-muted-foreground">{formData.product.product_name || "—"}</span>
          </div>
          <div>
            <span className="font-medium">Descrição:</span>{" "}
            <span className="text-muted-foreground">{formData.product.product_description || "—"}</span>
          </div>
          <div>
            <span className="font-medium">Diferenciais:</span>{" "}
            <span className="text-muted-foreground">
              {formData.product.differentiators.filter(d => d.trim()).join(", ") || "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ICPs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            ICPs ({formData.icps.filter(i => i.name.trim()).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.icps.filter(i => i.name.trim()).map((icp, index) => (
            <div key={index} className="rounded border p-3 text-sm">
              <div className="font-medium">{icp.name}</div>
              {icp.segment && (
                <div className="text-muted-foreground">Segmento: {icp.segment}</div>
              )}
            </div>
          ))}
          {formData.icps.filter(i => i.name.trim()).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum ICP definido</p>
          )}
        </CardContent>
      </Card>

      {/* Dores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Dores Mapeadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.pains.filter(p => p.main_pain.trim()).map((pain) => (
            <div key={pain.icp_id} className="rounded border p-3 text-sm">
              <div className="font-medium">{pain.icp_name}</div>
              <div className="text-muted-foreground">{pain.main_pain}</div>
            </div>
          ))}
          {formData.pains.filter(p => p.main_pain.trim()).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma dor mapeada</p>
          )}
        </CardContent>
      </Card>

      {/* Promessa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Promessa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {formData.promise || <span className="text-muted-foreground">Nenhuma promessa definida</span>}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
