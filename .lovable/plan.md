
# Remover Modo Escuro (Dark Mode)

## O Que Sera Feito

Remover o botao de alternar tema escuro/claro do header e garantir que o app sempre fique no modo claro.

## Alteracoes

### 1. `src/components/layout/AppHeader.tsx`
- Remover a importacao do `useTheme` e dos icones `Moon` e `Sun`
- Remover a chamada do hook `useTheme`
- Remover o botao de alternar tema (o bloco com Moon/Sun)

### 2. `src/hooks/use-theme.tsx`
- Simplificar o hook para sempre retornar "light" como tema fixo, ou remover o arquivo completamente
- Como o `sonner.tsx` tambem usa um `useTheme` (de `next-themes`), nao ha conflito

### 3. `src/index.css`
- Remover todo o bloco `.dark { ... }` com as variaveis CSS do tema escuro, ja que nao sera mais utilizado

## Resultado

- O botao de lua/sol no canto superior direito sera removido
- O app ficara permanentemente no modo claro
- O layout do header ficara mais limpo
