
# Implementação do Wizard de Onboarding PPP

## Problema
A página de Onboarding não processa o parâmetro `client` da URL e não possui o wizard de etapas implementado.

---

## Solução

Criar um wizard completo de 5 etapas para o processo PPP:

```text
+----------------------------------------------------------+
|  Onboarding PPP - Empresa ABC                            |
|  Etapa 1 de 5: Produto                                    |
|----------------------------------------------------------|
|                                                           |
|  Progresso: [=====>                    ] 20%              |
|                                                           |
|  +-----------------------------------------------------+  |
|  | DESCRIÇÃO DO PRODUTO                                |  |
|  |-----------------------------------------------------|  |
|  |                                                      |  |
|  |  O que você vende?                                   |  |
|  |  [ Textarea para descrição do produto ]              |  |
|  |                                                      |  |
|  |  Qual problema resolve?                              |  |
|  |  [ Textarea ]                                        |  |
|  |                                                      |  |
|  |  Qual o diferencial?                                 |  |
|  |  [ Textarea ]                                        |  |
|  |                                                      |  |
|  +-----------------------------------------------------+  |
|                                                           |
|                      [Anterior]  [Próximo ->]             |
+----------------------------------------------------------+
```

---

## Etapas do Wizard

| Etapa | Nome | Descrição |
|-------|------|-----------|
| 1 | Produto | Descrição do produto/serviço, problema que resolve, diferencial |
| 2 | ICPs | Definir até 3 perfis de cliente ideal |
| 3 | Dores | Mapear dores e frustrações de cada ICP |
| 4 | Promessa | Criar a promessa principal baseada nas dores |
| 5 | Revisão | Revisar tudo antes de concluir |

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Onboarding.tsx` | Refatorar completamente |

---

## Funcionalidades

### 1. Leitura do Cliente
- Captura o parâmetro `client` da URL usando `useSearchParams`
- Busca os dados do cliente no Supabase
- Exibe nome do cliente no cabeçalho

### 2. Navegação entre Etapas
- Barra de progresso visual
- Botões "Anterior" e "Próximo"
- Validação antes de avançar

### 3. Salvamento Automático
- Salva dados no banco conforme o usuário avança
- Atualiza status do cliente ao concluir

### 4. Estados
- Loading: Enquanto busca dados do cliente
- Sem cliente: Se não houver parâmetro na URL
- Wizard: Exibe a etapa atual

---

## Estrutura do Componente

```typescript
// Estados principais
const [searchParams] = useSearchParams();
const clientId = searchParams.get("client");

const [client, setClient] = useState<Client | null>(null);
const [currentStep, setCurrentStep] = useState(1);
const [isLoading, setIsLoading] = useState(true);

// Dados do wizard
const [formData, setFormData] = useState({
  product: { description: "", problem: "", differentiator: "" },
  icps: [],
  pains: [],
  promise: "",
});

// Carregar cliente
useEffect(() => {
  if (clientId) {
    fetchClient(clientId);
  }
}, [clientId]);
```

---

## Benefícios

- Fluxo guiado passo a passo
- Dados salvos progressivamente
- Integração com dados existentes do cliente
- Barra de progresso visual para orientar o usuário
