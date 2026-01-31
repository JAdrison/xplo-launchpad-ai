

# Visualizacao e Edicao de Onboarding PPP por Cliente

## Problema Identificado
1. A pagina de detalhes do cliente nao exibe informacoes do onboarding (ICPs, dores, promessa)
2. O botao "Iniciar Onboarding" so aparece para clientes com status `draft`
3. Nao ha como continuar ou editar um onboarding em andamento ou concluido
4. Os dados do onboarding nao estao sendo exibidos na pagina do cliente

---

## Solucao

Adicionar uma secao completa de **Onboarding PPP** na pagina de detalhes do cliente que:
- Mostra o progresso/resumo dos dados ja preenchidos
- Permite iniciar, continuar ou editar o onboarding a qualquer momento
- Exibe ICPs, dores e promessa de forma organizada

---

## Interface Proposta

```text
+----------------------------------------------------------+
|  XPLO SOLAR LTDA                     [PPP em andamento]   |
|----------------------------------------------------------|
|                                                           |
|  INFORMACOES DO CLIENTE (card existente)                  |
|  ...                                                      |
|                                                           |
|  +-----------------------------------------------------+  |
|  | ONBOARDING PPP                                      |  |
|  |-----------------------------------------------------|  |
|  |                                                      |  |
|  |  Status: Em andamento                               |  |
|  |  Progresso: 2 de 5 etapas                           |  |
|  |                                                      |  |
|  |  PRODUTO                                            |  |
|  |  Nome: Sistema de Gestao Solar                      |  |
|  |  Descricao: Plataforma para monitoramento...        |  |
|  |                                                      |  |
|  |  ICPs DEFINIDOS (2)                                 |  |
|  |  - Empresas de energia renovavel                    |  |
|  |  - Instaladores de paineis solares                  |  |
|  |                                                      |  |
|  |  PROMESSA                                           |  |
|  |  (Ainda nao definida)                               |  |
|  |                                                      |  |
|  |  [ Continuar Onboarding ]  [ Editar Onboarding ]    |  |
|  +-----------------------------------------------------+  |
|                                                           |
+----------------------------------------------------------+
```

---

## Logica de Exibicao

| Status do Cliente | Botao Principal | Botao Secundario |
|-------------------|-----------------|------------------|
| `draft` | Iniciar Onboarding | - |
| `ppp_in_progress` | Continuar Onboarding | Editar Onboarding |
| `ppp_completed` | - | Editar Onboarding |
| outros | - | Ver Onboarding |

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/ClientDetails.tsx` | Adicionar secao de Onboarding PPP com dados e acoes |

---

## Funcionalidades a Implementar

### 1. Carregar Dados do Onboarding
Buscar dados relacionados ao cliente:
- `client_profile`: nome do produto, descricao, diferenciais
- `icps`: lista de ICPs definidos
- `icp_pains`: dores mapeadas para cada ICP
- `client_promise`: promessa principal

### 2. Exibir Resumo do Onboarding
Card com:
- Indicador de progresso (baseado nos dados preenchidos)
- Resumo dos dados de produto
- Lista de ICPs com contagem
- Promessa (se existir)

### 3. Acoes Contextuais
- **Iniciar**: Para clientes `draft`, navega para `/onboarding?client=id`
- **Continuar**: Para `ppp_in_progress`, navega para onboarding na etapa atual
- **Editar**: Para qualquer status, permite voltar ao wizard para alteracoes

---

## Estrutura do Codigo

```typescript
// Novos estados para dados do onboarding
const [onboardingData, setOnboardingData] = useState({
  profile: null,
  icps: [],
  pains: [],
  promise: null,
});

// Buscar dados do onboarding junto com o cliente
const fetchOnboardingData = async (clientId: string) => {
  const [profileRes, icpsRes, painsRes, promiseRes] = await Promise.all([
    supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
    supabase.from("icps").select("*").eq("client_id", clientId).order("sort_order"),
    supabase.from("icp_pains").select("*, icps(name)"),
    supabase.from("client_promise").select("*").eq("client_id", clientId).maybeSingle(),
  ]);
  
  // Popular estado
};

// Calcular progresso
const calculateProgress = () => {
  let completed = 0;
  if (onboardingData.profile?.product_name) completed++;
  if (onboardingData.icps.length > 0) completed++;
  if (onboardingData.pains.some(p => p.main_pain)) completed++;
  if (onboardingData.promise?.promise_text) completed++;
  return completed;
};
```

---

## Beneficios

- Visibilidade completa do progresso do onboarding
- Facil acesso para continuar ou editar a qualquer momento
- Resumo rapido dos dados ja preenchidos
- Fluxo intuitivo baseado no status do cliente

