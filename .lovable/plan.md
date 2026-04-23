

## Card "Plano de Demanda" — 3 prompts por nicho

Adicionar um novo card **"Plano de Demanda"** na seção "Geração com IA" do detalhe do cliente, seguindo exatamente o mesmo padrão dos cards **ICP** e **Banco de Ofertas** já implementados: documento gerado em texto formatado via GPT-5.2, salvo em tabela própria, com Editar / Regenerar (com instrução) / Copiar / PDF / Excluir.

### O que muda

#### 1. Banco — nova tabela `client_traffic_plan_documents`

Espelho de `client_offer_documents`, sem migration destrutiva:

- `id`, `client_id`, `name` (default "Plano de Demanda"), `generated_text`, `generated_by_ai`, `generated_at`, `sort_order`, `created_at`, `updated_at`.
- RLS público (igual aos outros documentos do cliente).

#### 2. Backend — novo task em `generate-content/index.ts`

Adicionar `type === "generate-traffic-plan-document"`:

- **Validação obrigatória**: busca `client_icp_documents` (ou legado `client_icp`) E `client_offer_documents` com `generated_text`. Se faltar qualquer um → retorna erro estruturado (`ICP_REQUIRED` / `OFFERS_REQUIRED`) que o frontend traduz em toast.
- **Seleção do prompt por nicho**: lê `clients.niche_type` (`hospedagem` / `saude` / `generico`) e seleciona o prompt correspondente. Os 3 prompts ficam como constantes no topo do task (mesmo padrão dos prompts atuais de ICP/Ofertas).
- **Substituição de variáveis** `{client_name}`, `{profile_data.*}`, `{market.*}`, `{financial.initial_traffic_investment}`, `{icp.generated_icp_text}` (do ICP mais recente), `{offers.generated_text}` (do banco mais recente, já filtrado pelas ofertas ativas via `serializeOfferBank` adaptado server-side ou texto cru).
- **Modelo**: GPT-5.2 (consistente com os outros documentos estratégicos). Sem `response_format json` — saída é texto formatado direto.
- **Modo regeneração com instrução**: aceita `documentId` + `userInstruction` opcional. Quando vem instrução, é injetada como bloco prioritário no prompt: *"INSTRUÇÃO DO USUÁRIO (PRIORITÁRIA — siga à risca): {userInstruction}"* (mesmo padrão do Banco de Ofertas).
- Salva em `client_traffic_plan_documents` com `generated_by_ai=true` e `generated_at=now()`.

Os 3 prompts longos (Hospedagem / Saúde / Genérico) entram exatamente como descritos pelo usuário, com o template de saída obrigatório (Diagnóstico → Estratégia Principal Meta → Complementares → Cronograma 3 semanas → Alertas).

#### 3. Frontend — novo `TrafficPlanCard.tsx`

Espelho enxuto de `OfferBancoCard.tsx` (sem a complexidade de offer_states, já que aqui o documento é monolítico):

- Botão **"Novo Plano"** (com `Lock` + tooltip *"Gere o ICP e o Banco de Ofertas primeiro"* quando faltar dependência).
- Verificação de dependências no `load()`: consulta `client_icp_documents`/`client_icp` E `client_offer_documents`. Se faltar, botão desabilitado com mensagem específica.
- Diálogo "Novo Plano" com campo opcional **"Instrução de variação"** (textarea).
- Lista os documentos gerados com:
  - Texto renderizado em `whitespace-pre-wrap` (preserva os divisores `━━━` e emojis do template).
  - Botões: ✏️ **Editar** (textarea), 🔄 **Regenerar** (abre Dialog com campo de instrução, igual ao Banco de Ofertas), 📋 **Copiar**, 📄 **PDF**, 🗑️ **Excluir**.

Não vamos quebrar o documento em sub-cards individuais (não há ações por seção como no Banco de Ofertas) — o texto é exibido inteiro com a formatação visual já contida no próprio prompt.

#### 4. Integração no `AIGenerationSection.tsx`

Adicionar `<TrafficPlanCard />` entre `<OfferBancoCard />` e o card de Anúncios, refletindo a ordem estratégica recomendada: **ICP → Ofertas → Plano de Demanda → Anúncios**.

#### 5. Exportação PDF

- Novo `TrafficPlanPDFTemplate.tsx` (espelho de `OfferBancoPDFTemplate.tsx`) — render simples com `whitespace-pre-wrap`, logo XPLO no canto, margens padrão da memória de exportação.
- Atualizar `OnboardingPDFTemplate.tsx` para incluir uma nova seção **"Plano de Demanda"** após a seção de Ofertas, lendo o `generated_text` mais recente de `client_traffic_plan_documents`.

#### 6. Remoção do antigo editor de demanda

O componente `DemandPlanEditor.tsx` (acoplado a `offers_hormozi.demand_generation_strategies`) deixa de ser usado pelo novo fluxo. Como ele ainda é referenciado em `GeneratedContentViewer.tsx` para ofertas Hormozi legadas, mantemos o arquivo intacto **apenas para compatibilidade** com ofertas antigas — não há remoção, apenas o novo card passa a ser a fonte oficial.

### Detalhes técnicos

- **Migration**: criar tabela `client_traffic_plan_documents` (idempotente, com RLS público).
- **Sem mudança em prompts existentes** (ICP, Ofertas, Anúncios).
- **Resolução de variáveis no backend**: helper interno que mapeia `{caminho.aninhado}` para os campos reais de `client_profile.profile_data`, `client_profile.market_data`, `client_profile`, etc. Variáveis ausentes viram string vazia (não quebra o prompt).
- **Memória**: criar `mem://ia/plano-demanda-3-nichos` documentando os 3 prompts, dependência de ICP+Ofertas, modelo GPT-5.2 e estrutura única de output. Atualizar `mem://index.md`. Substitui em uso o antigo `mem://ia/consultoria-demanda` (que mantemos como referência histórica do Hormozi legado).

### Fora do escopo

- Não excluir `offers_hormozi` nem `DemandPlanEditor.tsx` (compat com ofertas antigas).
- Não criar quebra do plano em sub-cards editáveis seção-a-seção — render é texto formatado único, igual ao Banco de Ofertas no nível do documento.
- Não mudar prompts de ICP/Ofertas/Anúncios.
- Não tocar no fluxo de geração de Anúncios (que já usa o Banco de Ofertas como contexto).

