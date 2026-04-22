

## Novo Documento: ICP — Definição do Cliente Ideal (3 prompts por nicho)

Adicionar um quarto card de geração de IA — **"ICP — Cliente Ideal"** — junto com Oferta, LP e Anúncios. Ele gera um documento textual formatado (com emojis e seções), salvo em `client_icp.generated_icp_text`, com prompt específico por nicho (Hospedagem / Saúde / Genérico) e usando GPT‑5.2.

### O que será feito

#### 1. Backend — novo tipo no edge function `generate-content`

Adicionar `type: "generate-icp-document"` em `supabase/functions/generate-content/index.ts`:

- Incluir `"generate-icp-document"` no array `STRATEGIC_TASKS` (dispara GPT‑5.2 automaticamente).
- Buscar do banco: `clients` (nome, niche_type, niche_label), `client_profile` (profile_data, market_data, demand_channels, competitors, inspirations, current_revenue, etc.), `client_swot` (4 quadrantes), `client_icp` (bloco1/2/3_data).
- Selecionar prompt baseado em `niche_type`: `hospedagem` / `saude` / `generico`. Os 3 prompts do briefing são salvos como constantes (`PROMPT_HOSPEDAGEM`, `PROMPT_SAUDE`, `PROMPT_GENERICO`).
- Substituir as variáveis `{client_name}`, `{profile_data.xxx}`, `{swot.xxx}`, `{market.xxx}`, `{icp.bloco1_data}` etc. pelos valores reais (helper `interpolate(template, vars)` com fallback `"—"` para campos vazios).
- Importante: este prompt **não** retorna JSON — retorna texto formatado puro. Para isso, fazer chamada direta ao gateway sem `response_format: json_object` (criar função `aiText()` paralela ao `ai()` existente, retornando string).
- Salvar em `client_icp` (upsert por `client_id`): `generated_icp_text`, `generated_by_ai = true`, `generated_at = now()`.
- Retornar `{ success: true, text: "..." }`.

#### 2. Frontend — card "ICP" em `AIGenerationSection.tsx`

- Adicionar quarto item no `generationItems`: ícone `Target` (lucide), nome "ICP — Cliente Ideal", descrição "Documento estratégico do perfil de cliente ideal".
- Mudar grid de `sm:grid-cols-3` para `sm:grid-cols-2 lg:grid-cols-4`.
- Em vez de navegar para `/generator`, este card abre/expande inline um sub-componente novo `ICPDocumentCard` que:
  - Botão **"+ Gerar"** chama `supabase.functions.invoke("generate-content", { body: { type: "generate-icp-document", clientId, aiConfig }})`.
  - Estado de loading com spinner + texto "Gerando seu ICP..."
  - Após geração, renderiza o texto em card off-white (`bg-muted/30`), preservando quebras de linha e emojis (via `whitespace-pre-wrap`).
  - Botões: ✏️ **Editar manualmente** (abre Textarea editável e salva no campo), 🔄 **Regenerar** (refaz chamada), 📋 **Copiar** (clipboard), 📄 **Baixar PDF** (gera PDF dedicado só do ICP via `react-to-pdf`, layout simples com logo XPLO).
  - Carrega `generated_icp_text` existente do `client_icp` no mount.

#### 3. Integração com o PDF de Onboarding

- Em `OnboardingPDFTemplate.tsx`: adicionar nova prop opcional `generatedIcpText?: string | null`.
- Quando presente, renderizar **Seção 7 — ICP — Cliente Ideal** (após "5. Perfil dos Principais Clientes" e antes de "6. Promessa", renumerando "6. Promessa" → "7. Promessa" se ICP existir, ou manter ICP como "7" depois de Promessa). **Decisão**: ICP vai como **seção final 7**, após Promessa (mais natural — fecha o documento estratégico).
- Renderizar `generatedIcpText` com `white-space: pre-wrap` mantendo emojis e estrutura.
- Em `OnboardingX1Section.tsx`: ler `client_icp.generated_icp_text` no fetch e passar para `<PDFExportButton>` → `OnboardingPDFTemplate`.
- Atualizar `PDFExportButton.tsx` para repassar a nova prop.

### Detalhes técnicos

- **Modelo IA**: GPT‑5.2 via Lovable AI Gateway (já configurado em `STRATEGIC_TASKS`).
- **Mapeamento dinâmico de variáveis**: como `profile_data` é um `jsonb` livre que varia por nicho, usar acesso seguro `data?.profile_data?.[chave] ?? "—"`. Para arrays (ex: `differentiators`, `comodidades`), juntar com `.join(", ")`. Para objetos (ex: `bloco1_data`), serializar como bloco de "chave: valor" linha por linha (reaproveitando `humanizeKey`/`formatValue` de `fieldLabels.ts`).
- **Sem nova migração**: o campo `client_icp.generated_icp_text` (text) e `generated_by_ai` (bool), `generated_at` (timestamp) já existem na tabela.
- **Fallback de niche**: se `niche_type` for null, usar prompt genérico.
- **Reuso PDF**: o botão "Baixar PDF" do card de ICP usa `react-to-pdf` igual aos outros exports, com template novo simples `ICPPDFTemplate.tsx` (logo + título + texto formatado).

### Fora do escopo

- Não muda os 3 prompts existentes (`generate-icps`, `generate-promise`, etc.).
- Não muda o fluxo de wizard de onboarding nem a tabela `icps` (legada).
- Não cria histórico/versionamento do texto gerado (apenas substitui).

