

## Banco de Ofertas — 3 prompts por nicho (substitui Oferta Hormozi)

Adicionar um novo gerador **"Oferta — Banco de Ofertas"** que produz, via GPT-5.2, um documento com **6 ofertas** (3 de entrada + 3 de continuidade) personalizadas pelo ICP gerado. Padrão idêntico ao card de ICP recém-implementado: texto formatado, salvo em tabela própria, com Editar/Regenerar/Copiar/PDF.

### Arquitetura — espelhar o padrão do ICP

| ICP (já feito)              | Banco de Ofertas (novo)            |
|-----------------------------|------------------------------------|
| `client_icp_documents`      | `client_offer_documents`           |
| `ICPDocumentCard.tsx`       | `OfferBancoCard.tsx`               |
| `generate-icp-document`     | `generate-offers-document`         |
| `ICPPDFTemplate.tsx`        | `OfferBancoPDFTemplate.tsx`        |
| 3 prompts por nicho         | 3 prompts por nicho                |

### O que será feito

#### 1. Banco — nova tabela `client_offer_documents`

Migration com mesma estrutura/RLS do `client_icp_documents`: `id`, `client_id`, `name` (default "Banco de Ofertas"), `generated_text`, `generated_by_ai`, `generated_at`, `sort_order`, timestamps. Permite múltiplos bancos por cliente (ex.: variações).

A tabela legada `offers_hormozi` é **mantida** (histórico, LPs e Ads referenciam `offer_id`). Apenas para de ser exibida no novo card.

#### 2. Backend — novo task `generate-offers-document`

Em `supabase/functions/generate-content/index.ts`:

- Adicionar `"generate-offers-document"` a `STRATEGIC_TASKS` (GPT-5.2).
- 3 constantes de prompt: `OFFER_PROMPT_HOSPEDAGEM`, `OFFER_PROMPT_SAUDE`, `OFFER_PROMPT_GENERICO` (textos exatos do briefing).
- **Pré-requisito**: ler `client_icp_documents` (mais recente) ou `client_icp.generated_icp_text`. Se vazio, retornar `400` com `{ error: "ICP_REQUIRED" }`.
- Reutilizar helpers existentes (`interpolate`, `fmtVal`, `fmtBlock`, `aiText`) para popular `{client_name}`, `{profile_data.*}`, `{swot.*}`, `{market.*}`, `{niche_label}` e `{icp.generated_icp_text}`.
- Selecionar prompt por `clients.niche_type` (fallback `generico`).
- Suporte a `documentId` (regenerar) e `variationHint` (igual ao ICP, para múltiplos bancos).
- Upsert em `client_offer_documents`.

#### 3. Frontend — novo card `OfferBancoCard`

Criar `src/components/client/OfferBancoCard.tsx` (clone adaptado do `ICPDocumentCard`):

- Lista os documentos de banco existentes; botão **"+ Novo Banco de Ofertas"** com diálogo (nome + dica de variação opcional).
- **Bloqueio inteligente**: se o cliente ainda não tem ICP (`client_icp_documents` vazio E `client_icp.generated_icp_text` vazio), botão fica desabilitado com tooltip *"Gere primeiro o ICP — a oferta é personalizada por ele"*.
- Estado de loading: *"Montando seu banco de ofertas..."*.
- Render do texto com `whitespace-pre-wrap` + emojis preservados.
- Ações por documento: ✏️ Editar, 🔄 Regenerar, 📋 Copiar, 🗑️ Remover, 📄 PDF (via `OfferBancoPDFTemplate.tsx`).

#### 4. Atualizar `AIGenerationSection.tsx`

- **Remover** o item `"offer"` (Oferta Hormozi) do grid `generationItems` — sobram **Landing Page** e **Anúncios** (grid `sm:grid-cols-2`).
- Renderizar `<OfferBancoCard />` logo abaixo de `<ICPDocumentCard />` (ordem: ICP → Banco de Ofertas → grid LP/Ads).
- A geração legada de Oferta Hormozi continua acessível via `/generator` para clientes antigos (não quebra LPs/Ads existentes).

#### 5. PDF de Onboarding

Em `OnboardingPDFTemplate.tsx`: adicionar prop opcional `generatedOffersText?: string | null` e renderizar **Seção 8 — Banco de Ofertas** (após Seção 7 ICP) com mesmo estilo (`white-space: pre-wrap`, fundo off-white). Em `OnboardingX1Section.tsx` e `PDFExportButton.tsx`: buscar o banco mais recente de `client_offer_documents` e repassar.

### Detalhes técnicos

- **Modelo IA**: GPT-5.2 via Lovable AI Gateway (já roteado pelo `STRATEGIC_TASKS`).
- **Saída**: texto puro formatado (não JSON) — usar `aiText()` existente.
- **Mapeamento de variáveis dinâmicas**: campos não previstos em `profile_data`/`market_data` (ex.: `comodidades`, `experiencia`, `treatments`, `volume_pacientes`) são acessados via lookup seguro `?? "—"`. Quando ausentes, o prompt instrui a IA a usar senso comum do nicho.
- **Sem foreign keys** (padrão atual do projeto), com RLS `public` espelhando `client_icp_documents`.
- **Memory update**: criar `mem://ia/banco-ofertas-3-nichos` e atualizar Core para refletir que "Oferta" agora é Banco de Ofertas (não mais Hormozi no card de IA).

### Fora do escopo

- Não excluir `offers_hormozi` nem migrar dados (mantém compatibilidade com LPs/Ads existentes que usam `offer_id`).
- Não mudar prompts de ICP, LP ou Ads.
- Não criar abas separadas (Final de Semana / Dias de Semana) — render unificado em texto formatado, igual ao ICP, para manter simplicidade e consistência visual. As seções já vêm visualmente separadas pelos emojis e títulos do prompt.

