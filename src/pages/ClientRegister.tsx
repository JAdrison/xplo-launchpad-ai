import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Loader2, 
  CheckCircle2, 
  Rocket, 
  Clock,
  MessageCircle,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoXplo from "@/assets/logo-xplo.png";

type PageState = "form" | "choice" | "success" | "onboarding";

interface CreatedClient {
  id: string;
  name: string;
  responsible_name: string | null;
}

export default function ClientRegister() {
  const { toast } = useToast();
  const [pageState, setPageState] = useState<PageState>("form");
  const [createdClient, setCreatedClient] = useState<CreatedClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    responsible_name: "",
    responsible_cpf: "",
    email: "",
    phone: "",
    niche: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Apply masks based on field name
    let maskedValue = value;
    if (name === "responsible_cpf") {
      maskedValue = maskCPF(value);
    } else if (name === "cnpj") {
      maskedValue = maskCNPJ(value);
    } else if (name === "phone") {
      maskedValue = maskPhone(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: maskedValue }));
  };

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome da empresa.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.responsible_name.trim()) {
      toast({
        title: "Responsável obrigatório",
        description: "Por favor, informe o nome do responsável.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, informe o e-mail de contato.",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Termos obrigatórios",
        description: "Você precisa concordar com os termos de uso dos dados.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: formData.name.trim(),
          cnpj: formData.cnpj.trim() || null,
          responsible_name: formData.responsible_name.trim() || null,
          responsible_cpf: formData.responsible_cpf.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          niche: formData.niche.trim() || null,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedClient({
        id: data.id,
        name: data.name,
        responsible_name: data.responsible_name,
      });
      setPageState("choice");
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Erro ao criar cadastro",
        description: "Ocorreu um erro ao salvar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    setPageState("success");
  };

  const handleStartOnboarding = async () => {
    if (!createdClient) return;

    setIsLoading(true);
    try {
      await supabase
        .from("clients")
        .update({ status: "ppp_in_progress" })
        .eq("id", createdClient.id);

      // Redirect to external onboarding with a cryptographically random token (256 bits)
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, "0")).join("");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase.from("client_tokens").insert({
        client_id: createdClient.id,
        token,
        type: "onboarding",
        expires_at: expiresAt.toISOString(),
      });

      // Navigate to external onboarding
      window.location.href = `/onboarding/external/${token}`;
    } catch (error) {
      console.error("Error starting onboarding:", error);
      toast({
        title: "Erro ao iniciar",
        description: "Não foi possível iniciar o onboarding. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const displayName = createdClient?.responsible_name || createdClient?.name || "Cliente";

  // Form state
  if (pageState === "form") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img src={logoXplo} alt="XPLO" className="h-12" />
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Cadastro Inicial</h1>
            <p className="text-muted-foreground">Preencha seus dados para começar</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Data: {today}</span>
            </div>
          </div>

          {/* Privacy Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Os dados pessoais (CNPJ, CPF, etc) serão usados apenas para questões de contrato e cadastro na plataforma de envio de boletos.
            </AlertDescription>
          </Alert>

          {/* Form */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados da Empresa */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Dados da Empresa</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Empresa *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Empresa ABC Ltda"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        name="cnpj"
                        placeholder="00.000.000/0000-00"
                        value={formData.cnpj}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="niche">Nicho / Segmento</Label>
                    <Input
                      id="niche"
                      name="niche"
                      placeholder="Ex: Saúde, Tecnologia, E-commerce..."
                      value={formData.niche}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Dados do Responsável */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Dados do Responsável</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="responsible_name">Nome *</Label>
                      <Input
                        id="responsible_name"
                        name="responsible_name"
                        placeholder="Nome completo"
                        value={formData.responsible_name}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsible_cpf">CPF</Label>
                      <Input
                        id="responsible_cpf"
                        name="responsible_cpf"
                        placeholder="000.000.000-00"
                        value={formData.responsible_cpf}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="contato@empresa.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Li e concordo que meus dados serão utilizados conforme descrito acima
                  </Label>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Cadastro"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Choice state
  if (pageState === "choice") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img src={logoXplo} alt="XPLO" className="h-12" />
          </div>

          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Cadastro Realizado!</h1>
            <p className="text-muted-foreground">
              Olá, {displayName}! Seu cadastro foi recebido.
            </p>
          </div>

          {/* Question */}
          <p className="text-center text-foreground">
            O que você gostaria de fazer agora?
          </p>

          {/* Options */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card 
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={handleFinish}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-muted p-3">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle className="text-lg">Finalizar por Agora</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Pronto! Nossa equipe entrará em contato em breve.
                </CardDescription>
                <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Tempo: ~1 min
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary border-primary/20 bg-primary/5"
              onClick={handleStartOnboarding}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-primary/20 p-3">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg">Iniciar Onboarding</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Quero preencher as informações do meu negócio agora mesmo.
                </CardDescription>
                <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Tempo: ~10 min
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <img src={logoXplo} alt="XPLO" className="h-12" />
          </div>

          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
          </div>

          {/* Message */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tudo Certo!</h1>
            <p className="text-muted-foreground mt-2">
              Obrigado, {displayName}!
            </p>
            <p className="text-muted-foreground mt-4">
              Seu cadastro foi recebido com sucesso. Nossa equipe entrará em contato em breve para dar continuidade ao processo.
            </p>
          </div>

          {/* WhatsApp Link */}
          <Button variant="outline" className="gap-2" asChild>
            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Dúvidas? Fale conosco
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
