

## Ações por oferta dentro do Banco de Ofertas

Hoje o banco é um único texto monolítico. Vamos quebrá-lo em **6 ofertas individuais**, cada uma com 3 ações: **habilitar/desabilitar**, **regenerar só ela**, e **excluir** (com opção de manter no documento).

### O que muda

#### 1. Estrutura — parser + estado por oferta

- Criar `src/lib/offerParser.ts` com:
  - `parseOfferBank(text)` → divide o texto em `{ header, offers: [{id, rawText, name, partLabel}], footer }` usando o marcador `[OFERTA N]` e os títulos `🗓️/🩺/🎁 BANCO DE OFERTAS — ...` para identificar a parte (Entrada / Continuidade etc).
  - `serializeOfferBank(parsed, { skipDisabled })` → reconstrói o texto, opcionalmente omitindo ofertas desabilitadas/excluídas (usado para PDF e cópia).
- Cada oferta extraída recebe um `id` estável (hash do índice + parte) para mapear no estado de habilitação.

#### 2. Banco — nova coluna `offer_states` em `client_offer_documents`

- `offer_states JSONB DEFAULT '{}'` armazena `{ [offerId]: { enabled: boolean, deleted: boolean } }`.
- Sem migração destrutiva — colunas existentes ficam intactas.

#### 3. UI — render por oferta dentro do card

Em `OfferBancoCard.tsx`, quando `generated_text` existir, em vez do `<div whitespace-pre-wrap>` único, renderizar:

- **Cabeçalho do banco** (texto antes da 1ª oferta) em bloco simples.
- Para cada oferta: um sub-card com:
  - Título da oferta (extraído da linha após `🏷️ NOME DA OFERTA`) + badge da parte (Entrada / Continuidade etc.).
  - Texto da oferta com `whitespace-pre-wrap`.
  - **Switch "Ativa"** (toggle enabled/disabled — desabilitada fica com opacidade reduzida e badge "Desativada").
  - Botão **🔄 Regenerar esta oferta** (loading individual).
  - Botão **🗑️ Excluir** (com AlertDialog). A exclusão marca `deleted: true` mas mantém visualmente como "Excluída — restaurar?" para permitir reverter, conforme pedido ("excluir também ou deixar lá").
- **Rodapé** (texto após a última oferta, ex.: "📋 COMO USAR ESSE BANCO") em bloco final.

#### 4. Backend — modo "regenerate-single-offer"

Em `supabase/functions/generate-content/index.ts`, no task `generate-offers-document`:

- Aceitar novos params: `regenerateOfferId?: string`, `existingText?: string`, `offerContext?: { partLabel, offerNumber, currentText }`.
- Quando recebido, montar prompt curto e direcionado: *"Aqui está o banco atual: \<texto\>. Reescreva APENAS a [OFERTA N] da parte \<X\>, mantendo o mesmo formato (🏷️ NOME, ✨ PROMESSA, 📦 O QUE INCLUI, 💰 CONDIÇÃO COMERCIAL, 👤 PARA QUEM É, ⏰ ESCASSEZ). Traga um ângulo/ocasião diferente da atual. Retorne só o bloco da oferta."*
- O frontend faz o splice: substitui a oferta pelo novo bloco no array, re-serializa e dá `update` no documento.
- Reusa `aiText()` e o mesmo modelo (GPT-5.2).

#### 5. Cópia, PDF e exportação respeitam estado

- **Copiar** e **PDF** chamam `serializeOfferBank` com `skipDisabled: true` (omitem desabilitadas e excluídas). Botão de copiar/PDF do banco completo continua existindo no nível do card.
- **Exclusão "soft"**: a oferta excluída fica oculta do PDF/cópia, mas aparece numa pequena seção "Ofertas removidas" no card com botão "Restaurar".
- O texto bruto (`generated_text`) **não é modificado** ao habilitar/desabilitar/excluir — só `offer_states` muda. Só é reescrito ao **regenerar individual** ou na edição manual existente.

#### 6. Edição manual — preservada

O modo "Editar" atual (textarea com o texto inteiro) continua funcionando como fallback para edição livre. Após salvar, o parser re-roda automaticamente.

### Detalhes técnicos

- **Robustez do parser**: se a IA não seguir exatamente o template, o parser cai num fallback que mostra o texto inteiro como hoje (sem quebrar a UI). Logamos um warning no console.
- **Estado local otimista**: toggles e exclusão atualizam UI imediatamente e fazem `update` em background; em erro, revertem com toast.
- **Modelo IA p/ regeneração unitária**: GPT-5.2 (mesmo usado no banco completo, para manter consistência de tom).
- **Sem nova tabela** — só uma coluna `offer_states` em `client_offer_documents`.

### Fora do escopo

- Não muda os 3 prompts por nicho.
- Não cria reordenação drag-and-drop entre ofertas (só ativa/desativa/exclui).
- Não toca no card de ICP nem nos cards de LP/Anúncios.

