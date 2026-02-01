

# Sistema de Seleção de Opções + Refazer + Editar Manual + Ativos

## Resumo

A IA vai gerar 2 opções para cada campo da Oferta Hormozi. O usuário pode selecionar UMA ou AMBAS as opções. Pode clicar em "Refazer" para gerar novas opções automaticamente, ou usar a "canetinha" para editar o texto manualmente.

---

## Parte 1: Sistema de 2 Opções com Seleção Múltipla

### Campos com 2 Opções

| Campo | Descrição |
|-------|-----------|
| promise | 2 versões da promessa principal |
| unique_mechanism | 2 versões do mecanismo único |
| guarantee | 2 tipos de garantia |
| proof | 2 sugestões de prova social |
| risk_reversal | 2 versões de reversão de risco |
| main_cta | 2 versões do CTA |

### Interface de Seleção

```text
+----------------------------------------------------------+
| Promessa Principal                    [Refazer] [Salvar] |
|----------------------------------------------------------|
|                                                          |
| [x] +------------------------------------------------+   |
|     | Economize até 30% na conta de luz sem          | [✎]
|     | instalar nada na sua casa                      |   |
|     +------------------------------------------------+   |
|                       Card verde quando selecionado      |
|                                                          |
| [x] +------------------------------------------------+   |
|     | Reduza sua fatura de energia e contribua       | [✎]
|     | para um planeta mais sustentável               |   |
|     +------------------------------------------------+   |
|                                                          |
+----------------------------------------------------------+

[x] = Checkbox para selecionar (pode marcar 1 ou 2)
[✎] = Ícone de canetinha para editar manualmente
```

---

## Parte 2: Botão Refazer (Simples, sem prompt)

### Comportamento

- Usuário clica em "Refazer"
- IA gera automaticamente 2 novas opções para aquele campo
- Substitui as opções anteriores
- SEM caixa de diálogo ou prompt customizado

```text
Clique em "Refazer"
        |
        v
[Loading: Gerando novas opções...]
        |
        v
Novas 2 opções aparecem automaticamente
```

---

## Parte 3: Edição Manual com Canetinha

### Comportamento

- Cada opção tem um ícone de "canetinha" (Pencil)
- Ao clicar, o texto vira editável (textarea)
- Usuário edita manualmente
- Clica fora ou pressiona Enter para salvar
- SEM uso de IA

```text
Estado normal:
+------------------------------------------------+
| Economize até 30% na conta de luz sem          | [✎]
| instalar nada na sua casa                      |
+------------------------------------------------+

Após clicar na canetinha:
+------------------------------------------------+
| [Textarea editável com o texto]                | [✓]
| ______________________________________________ |
+------------------------------------------------+

Após salvar:
+------------------------------------------------+
| Texto editado pelo usuário                     | [✎]
+------------------------------------------------+
```

---

## Parte 4: Página de Ativos

A página de Ativos exibirá todos os conteúdos gerados agrupados por cliente:

```text
+----------------------------------------------------------+
| Ativos                                                    |
|----------------------------------------------------------|
|                                                          |
| Filtrar: [Todos os clientes ▼]                           |
|                                                          |
| +------------------------------------------------------+ |
| | XPLO Solar                                           | |
| |------------------------------------------------------| |
| | Ofertas (1) | Landing Pages (3) | Anúncios (5)       | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-content/index.ts` | Alterar prompt para gerar 2 opções por campo |
| `src/components/generator/GeneratedContentViewer.tsx` | Interface de seleção + refazer + editar |
| `src/components/generator/OfferOptionsSelector.tsx` | Novo componente para cards de opções |
| `src/components/generator/EditableOptionCard.tsx` | Novo componente para card editável |
| `src/pages/Assets.tsx` | Implementar listagem de todos os ativos |

### Migração de Banco de Dados

```sql
ALTER TABLE offers_hormozi ADD COLUMN generated_options jsonb;
ALTER TABLE offers_hormozi ADD COLUMN selected_options jsonb;
```

---

## Detalhes Técnicos

### 1. Componente EditableOptionCard

```text
Props:
- text: string
- isSelected: boolean
- onSelect: () => void
- onEdit: (newText: string) => void

Estados:
- isEditing: boolean (modo visualização ou edição)

UI:
- Checkbox para seleção
- Texto da opção
- Ícone de canetinha (Pencil) para editar
- Quando editando: textarea + ícone de check (salvar)
- Card selecionado: border-primary + bg-primary/10
```

### 2. Botão Refazer por Campo

Cada seção (Promessa, Mecanismo, etc) terá seu próprio botão "Refazer" que:
- Chama a Edge Function com `type: "refresh-field"`
- Passa o campo específico (ex: `field: "promise"`)
- Retorna 2 novas opções apenas para aquele campo
- Loading state enquanto regenera

### 3. Fluxo Completo

```text
1. Gerar Oferta
   └── IA retorna 2 opções para cada campo

2. Para cada campo, usuário pode:
   ├── Selecionar opção 1, 2, ou ambas (checkbox)
   ├── Clicar "Refazer" → IA gera 2 novas opções
   └── Clicar "✎" → Edita texto manualmente

3. Clicar "Salvar Seleções"
   └── Campos selecionados vão para o documento final
```

---

## Benefícios

- Refazer é simples: um clique gera novas opções
- Edição manual dá controle total sem depender da IA
- Seleção múltipla permite combinar opções
- Interface clara e intuitiva
- Página de Ativos centraliza toda a produção

