

## Diferenciais e Comodidades — Sugestões clicáveis + adição livre

### O que muda

Em **Diferenciais da hospedagem** e **Comodidades e estrutura** (etapa 2A — Hospedagem), o usuário passa a ver uma **lista de chips sugeridos** clicáveis. Clicar adiciona à seleção; clicar novamente remove. O `TagInput` continua disponível abaixo para digitar qualquer item extra.

Também corrijo o label "Diferenciais da hospedagem * (até 5)" que ficou desatualizado — remover o "(até 5)" já que removemos o limite.

### Listas de sugestões

**Diferenciais da hospedagem** (subjetivo, posicionamento):
- Vista para o mar
- Vista para a serra
- Pé na areia
- Piscina privativa
- Piscina aquecida
- Pet-friendly
- Café da manhã incluso
- Romântico para casais
- Ideal para famílias
- Ambiente para grupos
- Localização privilegiada
- Atendimento personalizado
- Decoração temática
- Contato com a natureza
- Estrutura para home-office

**Comodidades e estrutura** (objetivo, infraestrutura):
- Wi-Fi
- Ar-condicionado
- TV
- Frigobar
- Cozinha equipada
- Churrasqueira
- Estacionamento
- Piscina
- Hidromassagem
- Sauna
- Academia
- Área de lazer
- Espaço kids
- Lavanderia
- Berço disponível
- Acessibilidade
- Recepção 24h

### Como funciona o componente

```text
┌─ Sugestões (clique para adicionar) ─────────────┐
│ [Vista mar] [Piscina] [Pet-friendly] [+ ...]    │  ← chips outline
│ [Café incluso ✓] [Romântico ✓]                  │  ← selecionado = preenchido
└─────────────────────────────────────────────────┘
┌─ Adicionar outro ───────────────────────────────┐
│ [input.....................]  [+]               │
└─────────────────────────────────────────────────┘
Tags ativas: [Café incluso ×] [Romântico ×] [Sauna privativa ×]
```

- Chips sugeridos: clique alterna entre **adicionar** e **remover** da lista de tags
- Item adicionado pelo input livre vira tag normal e (se coincidir com sugestão) marca o chip como ativo
- Mesma lista de tags final — armazenamento sem mudança no banco

### Mudanças técnicas

1. **Novo componente** `src/components/onboarding/shared/SuggestedTagInput.tsx`
   - Props: `value`, `onChange`, `placeholder`, `suggestions: string[]`
   - Renderiza grid de chips de sugestão acima do `TagInput` existente
   - Toggle por clique; reusa input de texto livre

2. **Editar** `src/components/onboarding/steps/business/StepBusinessHospedagem.tsx`
   - Importar `SuggestedTagInput`
   - Trocar `TagInput` por `SuggestedTagInput` nos campos `differentiators` e `comodidades`, passando as listas acima
   - Corrigir label "Diferenciais da hospedagem *" (remover "(até 5)" se houver resíduo)

### Fora do escopo

- Saúde e Genérico continuam com `TagInput` simples (podem receber o mesmo tratamento depois se você quiser)
- Banco de dados não muda

