import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Pencil, Trash2, Eye, EyeOff, Instagram, Facebook, Shield, TrendingUp, DollarSign, Target, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientPipelineBar } from "@/components/client/ClientPipelineBar";
import { useToast } from "@/hooks/use-toast";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OnboardingX1Section } from "@/components/client/OnboardingX1Section";
import { OnboardingLinkSection } from "@/components/client/OnboardingLinkSection";
import { AIGenerationSection } from "@/components/client/AIGenerationSection";
import { GeneratedAssetsSection } from "@/components/client/GeneratedAssetsSection";
import { PlanBadge } from "@/components/client/PlanBadge";
import type { XploBonus, XploPlan } from "@/lib/xploProcessTemplate";
type Client = Tables<"clients">;

const STATUS_LABELS: Record<Client["status"], string> = {
  draft: "Rascunho",
  ppp_in_progress: "Onboarding em andamento",
  ppp_completed: "Onboarding concluído",
  offer_generated: "Oferta gerada",
  assets_generated: "Assets gerados",
  archived: "Arquivado",
};

const STATUS_VARIANTS: Record<Client["status"], "default" | "secondary" | "outline"> = {
  draft: "secondary",
  ppp_in_progress: "outline",
  ppp_completed: "default",
  offer_generated: "default",
  assets_generated: "default",
  archived: "secondary",
};

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [clientProfile, setClientProfile] = useState<{
    instagram_link?: string | null;
    instagram_login?: string | null;
    instagram_password?: string | null;
    facebook_login?: string | null;
    facebook_password?: string | null;
    initial_traffic_investment?: string | null;
    monthly_investment?: string | null;
    current_revenue?: string | null;
    revenue_goal?: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInstagramPassword, setShowInstagramPassword] = useState(false);
  const [showFacebookPassword, setShowFacebookPassword] = useState(false);
  const [showXploLabPassword, setShowXploLabPassword] = useState(false);
  const [isXploLabOpen, setIsXploLabOpen] = useState(false);
  const [isSavingXploLab, setIsSavingXploLab] = useState(false);
  const [showXploLabPasswordInput, setShowXploLabPasswordInput] = useState(false);
  const [xploLabForm, setXploLabForm] = useState({ login: "", password: "" });
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [showSocialIgPwd, setShowSocialIgPwd] = useState(false);
  const [showSocialFbPwd, setShowSocialFbPwd] = useState(false);
  const [socialForm, setSocialForm] = useState({
    instagram_link: "",
    instagram_login: "",
    instagram_password: "",
    facebook_login: "",
    facebook_password: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    responsible_name: "",
    responsible_cpf: "",
    email: "",
    phone: "",
    niche: "",
    product_description: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchClient() {
      if (!id) return;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching client:", error);
        toast({
          title: "Erro ao carregar cliente",
          description: "Não foi possível carregar os dados do cliente.",
          variant: "destructive",
        });
      } else if (data) {
        setClient(data);
        setFormData({
          name: data.name,
          cnpj: data.cnpj ? maskCNPJ(data.cnpj.replace(/\D/g, "")) : "",
          responsible_name: data.responsible_name || "",
          responsible_cpf: data.responsible_cpf ? maskCPF(data.responsible_cpf.replace(/\D/g, "")) : "",
          email: data.email || "",
          phone: data.phone ? maskPhone(data.phone.replace(/\D/g, "")) : "",
          niche: data.niche || "",
          product_description: data.product_description || "",
          notes: data.notes || "",
        });
        setXploLabForm({
          login: (data as any).xplo_lab_login || "",
          password: (data as any).xplo_lab_password || "",
        });
        const { data: profileData } = await supabase
          .from("client_profile")
          .select("instagram_link, instagram_login, instagram_password, facebook_login, facebook_password, initial_traffic_investment, monthly_investment, current_revenue, revenue_goal")
          .eq("client_id", id)
          .maybeSingle();

        if (profileData) {
          setClientProfile(profileData);
        }
      }
      setIsLoading(false);
    }

    fetchClient();
  }, [id, toast]);

  const handleUpdate = async () => {
    if (!id || !formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, preencha o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("clients")
      .update({
        name: formData.name.trim(),
        cnpj: formData.cnpj.trim() || null,
        responsible_name: formData.responsible_name.trim() || null,
        responsible_cpf: formData.responsible_cpf.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        niche: formData.niche.trim() || null,
        product_description: formData.product_description.trim() || null,
        notes: formData.notes.trim() || null,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating client:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os dados do cliente.",
        variant: "destructive",
      });
    } else {
      setClient((prev) =>
        prev
          ? {
              ...prev,
              name: formData.name.trim(),
              cnpj: formData.cnpj.trim() || null,
              responsible_name: formData.responsible_name.trim() || null,
              responsible_cpf: formData.responsible_cpf.trim() || null,
              email: formData.email.trim() || null,
              phone: formData.phone.trim() || null,
              niche: formData.niche.trim() || null,
              product_description: formData.product_description.trim() || null,
              notes: formData.notes.trim() || null,
            }
          : null
      );
      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram salvos com sucesso.",
      });
      setIsEditOpen(false);
    }

    setIsSaving(false);
  };

  const handleSaveXploLab = async () => {
    if (!id) return;
    setIsSavingXploLab(true);
    const { error } = await supabase
      .from("clients")
      .update({
        xplo_lab_login: xploLabForm.login.trim() || null,
        xplo_lab_password: xploLabForm.password.trim() || null,
      } as any)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao salvar credenciais",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setClient((prev) =>
        prev
          ? ({
              ...prev,
              xplo_lab_login: xploLabForm.login.trim() || null,
              xplo_lab_password: xploLabForm.password.trim() || null,
            } as any)
          : prev
      );
      toast({
        title: "Credenciais salvas",
        description: "Acesso XPLO LAB atualizado com sucesso.",
      });
      setIsXploLabOpen(false);
    }
    setIsSavingXploLab(false);
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
      setIsDeleting(false);
    } else {
      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido com sucesso.",
      });
      navigate("/clients");
    }
  };

  const handleRefreshClient = async () => {
    if (!id) return;
    
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    
    if (data) {
      setClient(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-semibold">Cliente não encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              O cliente que você está procurando não existe ou foi removido.
            </p>
            <Button asChild className="mt-6">
              <Link to="/clients">Voltar para lista de clientes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/clients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {client.name}
              </h1>
              <PlanBadge
                clientId={client.id}
                plan={(((client as any).xplo_plan as XploPlan) ?? "basic")}
                bonuses={(((client as any).xplo_bonuses as XploBonus[]) ?? [])}
                onChanged={(plan, bonuses) =>
                  setClient((prev) =>
                    prev ? ({ ...prev, xplo_plan: plan, xplo_bonuses: bonuses } as any) : prev
                  )
                }
              />
              <Badge variant={STATUS_VARIANTS[client.status]}>
                {STATUS_LABELS[client.status]}
              </Badge>
            </div>
            {client.niche && (
              <p className="text-muted-foreground">{client.niche}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline do CRM */}
      <ClientPipelineBar clientId={client.id} />

      {/* Informações do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados da Empresa */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Dados da Empresa</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="text-foreground">{client.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                <p className="text-foreground">{client.cnpj || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nicho</p>
                <p className="text-foreground">{client.niche || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-foreground">{STATUS_LABELS[client.status]}</p>
              </div>
            </div>
          </div>

          {/* Dados do Responsável */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Dados do Responsável</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="text-foreground">{client.responsible_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPF</p>
                <p className="text-foreground">{client.responsible_cpf || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                <p className="text-foreground">{client.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="text-foreground">{client.phone || "—"}</p>
              </div>
            </div>
          </div>

          {/* Produto */}
          {client.product_description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Produto / Serviço</h4>
              <p className="text-foreground whitespace-pre-wrap">{client.product_description}</p>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Criado em</p>
              <p className="text-foreground">
                {format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          {client.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notas</p>
              <p className="text-foreground whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acesso XPLO LAB (interno — somente admins/funcionários XPLO) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Acesso XPLO LAB
              <Badge variant="secondary" className="ml-2 text-xs">Interno</Badge>
            </CardTitle>
            <Dialog open={isXploLabOpen} onOpenChange={setIsXploLabOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-3.5 w-3.5" />
                  {(client as any).xplo_lab_login || (client as any).xplo_lab_password
                    ? "Editar credenciais"
                    : "Adicionar credenciais"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Credenciais XPLO LAB</DialogTitle>
                  <DialogDescription>
                    Login e senha de acesso ao XPLO LAB deste cliente. Visível apenas para a equipe XPLO — nunca exibido no onboarding.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="xplo-lab-login">Login</Label>
                    <Input
                      id="xplo-lab-login"
                      autoComplete="off"
                      value={xploLabForm.login}
                      onChange={(e) => setXploLabForm((p) => ({ ...p, login: e.target.value }))}
                      placeholder="usuario@xplo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xplo-lab-password">Senha</Label>
                    <div className="flex gap-2">
                      <Input
                        id="xplo-lab-password"
                        type={showXploLabPasswordInput ? "text" : "password"}
                        autoComplete="new-password"
                        value={xploLabForm.password}
                        onChange={(e) => setXploLabForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowXploLabPasswordInput((v) => !v)}
                      >
                        {showXploLabPasswordInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsXploLabOpen(false)} disabled={isSavingXploLab}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveXploLab} disabled={isSavingXploLab}>
                    {isSavingXploLab ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {(client as any).xplo_lab_login || (client as any).xplo_lab_password ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Login</p>
                <p className="text-foreground font-mono">{(client as any).xplo_lab_login || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Senha</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-foreground">
                    {(client as any).xplo_lab_password
                      ? showXploLabPassword
                        ? (client as any).xplo_lab_password
                        : "••••••••"
                      : "—"}
                  </p>
                  {(client as any).xplo_lab_password && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowXploLabPassword(!showXploLabPassword)}
                    >
                      {showXploLabPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma credencial cadastrada. Use o botão acima para adicionar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Credenciais Meta Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Acesso às Redes Sociais (Meta Ads)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {clientProfile && (clientProfile.instagram_login || clientProfile.facebook_login) ? (
            <>
              {/* Instagram */}
              {(clientProfile.instagram_link || clientProfile.instagram_login) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {clientProfile.instagram_link && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Link</p>
                        <a 
                          href={clientProfile.instagram_link.startsWith('http') ? clientProfile.instagram_link : `https://${clientProfile.instagram_link}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {clientProfile.instagram_link}
                        </a>
                      </div>
                    )}
                    {clientProfile.instagram_login && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Login</p>
                        <p className="text-foreground">{clientProfile.instagram_login}</p>
                      </div>
                    )}
                    {clientProfile.instagram_password && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Senha</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-foreground">
                            {showInstagramPassword ? clientProfile.instagram_password : "••••••••"}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => setShowInstagramPassword(!showInstagramPassword)}
                          >
                            {showInstagramPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Facebook */}
              {clientProfile.facebook_login && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Login</p>
                      <p className="text-foreground">{clientProfile.facebook_login}</p>
                    </div>
                    {clientProfile.facebook_password && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Senha</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-foreground">
                            {showFacebookPassword ? clientProfile.facebook_password : "••••••••"}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => setShowFacebookPassword(!showFacebookPassword)}
                          >
                            {showFacebookPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Não cadastrado</p>
          )}
        </CardContent>
      </Card>

      {/* Investimento em Tráfego */}
      {clientProfile && (clientProfile.initial_traffic_investment || clientProfile.monthly_investment || clientProfile.current_revenue || clientProfile.revenue_goal) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Investimento em Tráfego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {clientProfile.initial_traffic_investment && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <DollarSign className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Invest. inicial tráfego</p>
                    <p className="font-semibold text-foreground">R$ {clientProfile.initial_traffic_investment}</p>
                  </div>
                </div>
              )}
              {clientProfile.monthly_investment && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <DollarSign className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Investimento mensal</p>
                    <p className="font-semibold text-foreground">R$ {clientProfile.monthly_investment}</p>
                  </div>
                </div>
              )}
              {clientProfile.current_revenue && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Faturamento atual</p>
                    <p className="font-semibold text-foreground">R$ {clientProfile.current_revenue}</p>
                  </div>
                </div>
              )}
              {clientProfile.revenue_goal && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Target className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Meta de faturamento</p>
                    <p className="font-semibold text-foreground">R$ {clientProfile.revenue_goal}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de Onboarding X1 */}
      <OnboardingX1Section client={client} onStatusChange={handleRefreshClient} />

      {/* Link para Cliente preencher Onboarding */}
      <OnboardingLinkSection clientId={client.id} clientName={client.name} />

      {/* Seção de Geração com IA */}
      <AIGenerationSection client={client} onGenerated={handleRefreshClient} />

      {/* Seção de Conteúdos Gerados */}
      <GeneratedAssetsSection clientId={client.id} clientName={client.name} />


      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Cliente</DialogTitle>
                <DialogDescription>
                  Atualize as informações do cliente abaixo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {/* Dados da Empresa */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Dados da Empresa</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome *</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cnpj">CNPJ</Label>
                      <Input
                        id="edit-cnpj"
                        value={formData.cnpj}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cnpj: maskCNPJ(e.target.value) }))
                        }
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-niche">Nicho</Label>
                    <Input
                      id="edit-niche"
                      value={formData.niche}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, niche: e.target.value }))
                      }
                      placeholder="Ex: Tecnologia, Saúde, Educação"
                    />
                  </div>
                </div>

                {/* Dados do Responsável */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Dados do Responsável</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-responsible_name">Nome</Label>
                      <Input
                        id="edit-responsible_name"
                        value={formData.responsible_name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, responsible_name: e.target.value }))
                        }
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-responsible_cpf">CPF</Label>
                      <Input
                        id="edit-responsible_cpf"
                        value={formData.responsible_cpf}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, responsible_cpf: maskCPF(e.target.value) }))
                        }
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">E-mail</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Telefone</Label>
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: maskPhone(e.target.value) }))
                        }
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>

                {/* Produto */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Produto / Serviço</h4>
                  <div className="space-y-2">
                    <Label htmlFor="edit-product_description">Descrição do Produto</Label>
                    <Textarea
                      id="edit-product_description"
                      value={formData.product_description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, product_description: e.target.value }))
                      }
                      placeholder="Descreva o produto ou serviço principal"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notas</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Observações sobre o cliente"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdate} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete AlertDialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Deletar Cliente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o cliente "{client.name}"? Esta
                  ação não pode ser desfeita e todos os dados associados serão
                  removidos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
