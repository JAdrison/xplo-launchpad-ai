import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Loader2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
export default function ClientNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do cliente.",
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
          product_description: formData.product_description.trim() || null,
          notes: formData.notes.trim() || null,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Cliente criado!",
        description: `${formData.name} foi adicionado com sucesso.`,
      });

      navigate("/clients");
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Erro ao criar cliente",
        description: "Ocorreu um erro ao salvar o cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/clients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Novo Cliente</h1>
          <p className="text-muted-foreground">Cadastre um novo cliente para iniciar o onboarding</p>
        </div>
      </div>

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacidade dos Dados:</strong> Os dados pessoais coletados (CNPJ, CPF, e-mail, etc) serão utilizados exclusivamente para elaboração de contrato e cadastro na plataforma de envio de boletos.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>
            Preencha os dados básicos do cliente. Você poderá adicionar mais detalhes durante o onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados da Empresa */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Dados da Empresa</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Cliente *</Label>
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
                  <Label htmlFor="responsible_name">Nome do Responsável</Label>
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
                  <Label htmlFor="email">E-mail</Label>
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

            {/* Produto */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Produto / Serviço</h3>
              <div className="space-y-2">
                <Label htmlFor="product_description">Descrição do Produto</Label>
                <Textarea
                  id="product_description"
                  name="product_description"
                  placeholder="Descreva o produto ou serviço principal do cliente..."
                  value={formData.product_description}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={3}
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Anotações iniciais sobre o cliente..."
                value={formData.notes}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link to="/clients">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Criar Cliente
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
