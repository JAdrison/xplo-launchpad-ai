

## 1. Remover criação de Landing Page do site

A geração de LP some da UI, mas as LPs já criadas continuam visíveis (somente leitura/exclusão) para não perder histórico. A tabela `landing_pages` e os componentes de visualização ficam — só o **ato de gerar** é removido.

### O que sai da UI

- **`src/components/client/AIGenerationSection.tsx`**: remover o item `lp` do array `generationItems`. Sobra só **Anúncios** no grid (passa para `grid-cols-1`). Ajustar `allGenerated` para considerar apenas anúncios.
- **`src/pages/Generator.tsx`**: 
  - Remover toda a seção "Landing Page" do checklist (bloco com Checkbox `id="lp"`, RadioGroup de variantes Direta/Consultiva/Agressiva, e estado `selectedLpVariant`).
  - Remover `"lp"` do tipo `GenerationType` → fica `"offer" | "ads"`.
  - Remover lógica de envio `body.lpVariant` em `handleGenerate`.
  - Remover textos/toasts que mencionam "LP" ou "landing page".
- **`src/components/onboarding/PPPIntroCard.tsx`**: ajustar copy "ofertas, landing pages e anúncios" → "ofertas e anúncios".
- **`src/components/client/OnboardingX1Section.tsx`** (se referenciar geração de LP em CTAs): remover atalhos para gerar LP.

### O que fica (não mexe)

- **`GeneratedAssetsSection.tsx`** e **`GeneratedContentViewer.tsx`**: continuam listando LPs antigas com **Visualizar / Copiar / PDF / Excluir** — só não há mais botão "Gerar nova".
- Backend `generate-content` (`type === "lp"`): mantido por compatibilidade, apenas deixa de ser chamado pelo front.
- Tabela `landing_pages`, `LandingPageViewer`, `LandingPagePDFTemplate`: intactos.

---

## 2. Corrigir anúncios para funcionar com o novo Banco de Ofertas

### Diagnóstico

A geração de anúncios (`type === "ads"` em `generate-content/index.ts`, linhas 1453-1507) está acoplada à tabela legada `offers_hormozi`:

- O `Generator.tsx` mostra um dropdown "Selecione a oferta base" lendo de `offers_hormozi` (linhas 148-156). Como o usuário agora gera ofertas no novo card **Banco de Ofertas** (tabela `client_offer_documents`), esse dropdown fica **vazio** → o checkbox de Anúncios fica **desabilitado** com a mensagem *"Gere uma oferta primeiro"*, mesmo tendo acabado de gerar 6 ofertas no novo formato.
- No backend, mesmo se passasse um `offerId`, ele busca em `offers_hormozi` e monta contexto só com `o.promise` (uma frase curta), ignorando todo o conteúdo rico do Banco de Ofertas.

### Correção

**A. Frontend `Generator.tsx`**

- Substituir `fetchOffersForClient` para ler de `client_offer_documents` (id, name, generated_text, offer_states).
- Para cada documento, usar `parseOfferBank()` (já existe em `src/lib/offerParser.ts`) para listar as ofertas individuais ATIVAS (enabled=true, deleted=false).
- O dropdown "Selecione a oferta base" passa a mostrar opções no formato `"<Nome do Banco> — <Nome da oferta individual>"` (ex.: *"Banco de Ofertas — Pacote Romântico Fim de Semana"*). Cada opção carrega `{ documentId, offerId, rawText }`.
- O `selectedOfferId` vira `selectedBankOffer: { documentId, offerId, rawText } | null`.
- Habilitar o checkbox de Anúncios assim que houver pelo menos 1 documento de banco com ofertas ativas.
- No `handleGenerate`, enviar para a edge function: `bankOfferText: selectedBankOffer.rawText`, `bankOfferDocumentId`, `bankOfferId` (em vez do antigo `offerId`).

**B. Backend `supabase/functions/generate-content/index.ts` (bloco `type === "ads"`)**

- Aceitar novos params: `bankOfferText?: string`, `bankOfferDocumentId?: string`, `bankOfferId?: string`. Manter `offerId` legado como fallback.
- Quando `bankOfferText` chega: usar **o texto completo da oferta** (com promessa, mecanismo, o que inclui, condição, escassez) como `oCtx`, em vez do `o.promise`. Isso dá à IA muito mais contexto rico.
- `vOid` (variável usada para vincular `ads.offer_id`) fica `null` no caso novo (a tabela `ads` já tolera `offer_id` null — confirmado em `mem://arquitetura/resiliencia-ads`).
- A limpeza de anúncios antigos passa a usar `client_id + bankOfferId` quando aplicável: deletar de `ads` onde `client_id = X AND ad_angle_meta->>'bankOfferId' = Y` (ou simplesmente, se `vOid` null e há `bankOfferId`, deletar do cliente para regenerar limpo). Mais simples: continuar a limpeza por `client_id is_null offer_id` quando vier do novo fluxo.
- Salvar `bankOfferId` em uma coluna nova ou reutilizar campo existente para rastreio (mínimo: gravar `client_id` corretamente já basta para listagem funcionar).

**C. Texto e validação na UI**

- Mensagem de bloqueio do checkbox Anúncios atualizada: *"Gere o Banco de Ofertas primeiro"* (com link para o card no detalhe do cliente).
- Texto da seção: *"Selecione qual oferta do banco será a base dos anúncios"* (deixa claro que cada anúncio é por oferta individual, não pelo banco inteiro).

### Detalhes técnicos

- **Sem migration**: tudo é leitura do `client_offer_documents` + reuso do `parseOfferBank`. A tabela `ads` já aceita `offer_id` null.
- **Compatibilidade**: ofertas antigas em `offers_hormozi` continuam funcionando porque o backend mantém o branch `if (offerId)` legado.
- **Geração**: sem mudança nos prompts dos 6 vídeos + 10 estáticos (caixinha de perguntas etc.). Só muda **o contexto** que alimenta o prompt — fica mais rico.
- **Memory**: atualizar `mem://ia/configuracao-anuncios-hibridos` para refletir que a fonte da oferta agora é o Banco de Ofertas, e remover do Core qualquer menção a "Landing Page" como fluxo principal de geração.

### Fora do escopo

- Não excluir tabela `landing_pages` nem código de visualização/PDF de LPs antigas.
- Não migrar dados de `offers_hormozi` para `client_offer_documents`.
- Não mudar prompts de anúncios nem o fluxo de refinamento/criação individual de vídeos.

