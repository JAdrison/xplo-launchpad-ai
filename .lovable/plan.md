# Refatoração "ICP" para "Perfil dos Principais Clientes"

## ✅ IMPLEMENTADO

Substituímos a terminologia técnica "ICP" por uma linguagem mais acessível focada em **"quem já compra de você"**.

### Alterações no Banco de Dados

Adicionadas 3 novas colunas à tabela `icps`:
- `who_is` (TEXT) - Quem é esse cliente?
- `when_seeks` (TEXT) - Em que momento ele te procura?
- `is_ideal` (TEXT, check: 'ideal', 'good_not_ideal', 'no_more')

O campo `reason_needs_solution` foi reutilizado como "Por que compra de você?" na UI.

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `StepICPs.tsx` | Nova UI com campos naturais e RadioGroup para "is_ideal" |
| `OnboardingPDFTemplate.tsx` | Título "PERFIS DOS PRINCIPAIS CLIENTES" + novos campos |
| `Generator.tsx` | Labels "Perfil de Cliente" substituindo "ICP" |
| `StepGenerateOffer.tsx` | Labels "perfil de cliente" substituindo "ICP" |
| `OnboardingDashboard.tsx` | Contador mostra "Perfil(s)" em vez de "ICP(s)" |
| `OnboardingX1Section.tsx` | Mapeamento de dados para PDF atualizado |
| `generate-content/index.ts` | Prompt de IA atualizado para nova estrutura |

### Nova Estrutura de Campos

| Campo | Label | Placeholder |
|-------|-------|-------------|
| `name` | "Nome do Perfil" | "Ex: Dono de empresa solar residencial" |
| `who_is` | "Quem é esse cliente?" | "O que ele faz, como trabalha..." |
| `when_seeks` | "Em que momento ele te procura hoje?" | "O que normalmente está acontecendo..." |
| `why_buys` | "Por que esse cliente compra de você?" | "Motivo real: preço, rapidez..." |
| `is_ideal` | "Esse é um cliente que você quer atrair mais?" | Radio: Sim/Bom mas não ideal/Não quer mais |
