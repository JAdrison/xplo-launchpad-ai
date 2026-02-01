
# Implementacao: Sistema de 2 Opcoes + Refazer + Editar Manual + Ativos

## Resumo da Implementacao

Este plano implementa o sistema completo de geracao de ofertas com 2 opcoes por campo, permitindo selecao multipla, edicao manual e regeneracao automatica.

---

## 1. Migracao do Banco de Dados

Adicionar colunas para armazenar opcoes geradas e selecionadas:

```sql
ALTER TABLE offers_hormozi ADD COLUMN IF NOT EXISTS generated_options jsonb;
ALTER TABLE offers_hormozi ADD COLUMN IF NOT EXISTS selected_options jsonb;
```

---

## 2. Atualizar Edge Function (generate-content)

**Arquivo:** `supabase/functions/generate-content/index.ts`

**Alteracoes:**
- Modificar o prompt para gerar 2 opcoes para cada campo da oferta
- Adicionar handler para `type: "refresh-field"` para regenerar um campo especifico
- Novo schema de resposta com objeto `options`

**Novo formato de resposta:**
```json
{
  "options": {
    "promise": ["Opcao 1...", "Opcao 2..."],
    "unique_mechanism": ["Opcao 1...", "Opcao 2..."],
    "guarantee": ["Opcao 1...", "Opcao 2..."],
    "proof": ["Opcao 1...", "Opcao 2..."],
    "risk_reversal": ["Opcao 1...", "Opcao 2..."],
    "main_cta": ["Opcao 1...", "Opcao 2..."]
  },
  "value_stack": [...],
  "demand_plan": {...}
}
```

---

## 3. Criar Componente EditableOptionCard

**Arquivo:** `src/components/generator/EditableOptionCard.tsx`

**Funcionalidades:**
- Card com checkbox para selecao
- Icone de canetinha (Pencil) para ativar modo edicao
- Textarea inline quando em modo edicao
- Icone de check para salvar edicao
- Estilo verde (border-primary + bg-primary/10) quando selecionado

---

## 4. Criar Componente OfferOptionsSelector

**Arquivo:** `src/components/generator/OfferOptionsSelector.tsx`

**Funcionalidades:**
- Renderiza secoes para cada campo (Promessa, Mecanismo, etc)
- Cada secao tem botao "Refazer" e "Salvar"
- Mostra 2 cards EditableOptionCard por campo
- Gerencia estado de selecao (pode selecionar 1 ou 2)
- Botao Refazer chama Edge Function para regenerar campo especifico

---

## 5. Atualizar GeneratedContentViewer

**Arquivo:** `src/components/generator/GeneratedContentViewer.tsx`

**Alteracoes:**
- Integrar OfferOptionsSelector na visualizacao de ofertas
- Passar opcoes geradas e callback de selecao
- Manter visualizacao do Plano de Demanda (Parte 2)
- Adicionar logica para salvar selecoes no banco

---

## 6. Implementar Pagina de Ativos

**Arquivo:** `src/pages/Assets.tsx`

**Funcionalidades:**
- Buscar todos os clientes com seus assets
- Contar ofertas, landing pages e anuncios por cliente
- Filtro por cliente (Select dropdown)
- Cards agrupados por cliente com contadores
- Links para visualizar cada tipo de asset

---

## Ordem de Implementacao

1. Executar migracao do banco de dados
2. Atualizar Edge Function com novo prompt e handler de refresh
3. Criar EditableOptionCard.tsx
4. Criar OfferOptionsSelector.tsx
5. Atualizar GeneratedContentViewer.tsx
6. Implementar Assets.tsx

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar colunas generated_options e selected_options |
| `supabase/functions/generate-content/index.ts` | Modificar prompt + adicionar refresh-field |
| `src/components/generator/EditableOptionCard.tsx` | CRIAR - Card editavel com selecao |
| `src/components/generator/OfferOptionsSelector.tsx` | CRIAR - Seletor de opcoes por campo |
| `src/components/generator/GeneratedContentViewer.tsx` | MODIFICAR - Integrar novos componentes |
| `src/pages/Assets.tsx` | MODIFICAR - Implementar listagem completa |

