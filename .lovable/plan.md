

# Atualização do Design System - XPLO STARTER

## Objetivo
Atualizar o sistema de cores para seguir o padrão do XPLO Metricas: fundo branco limpo, sidebar clara com destaques roxos nos pontos-chave, e cores de apoio (verde, vermelho, amarelo) para status.

---

## Mudanças no Design

### Paleta de Cores

| Elemento | Atual | Novo |
|----------|-------|------|
| Sidebar | Roxa sólida | Branca/clara |
| Item ativo sidebar | Roxo claro | Roxo suave com texto roxo |
| Background geral | Cinza claro | Branco/cinza muito claro |
| Botoes primarios | Roxo | Roxo (mantido) |
| Sucesso | - | Verde vivo |
| Alerta | - | Amarelo |
| Erro | Vermelho | Vermelho (ajustado) |

### Novas Cores de Apoio (HSL)
- **Success:** Verde vivo - `142 76% 45%`
- **Warning:** Amarelo - `45 93% 47%`
- **Destructive:** Vermelho - `0 84% 60%` (manter)

---

## Arquivos a Modificar

### 1. src/index.css
Atualizar variáveis CSS para:
- Sidebar com fundo branco
- Adicionar cores success e warning
- Manter roxo como cor primaria para acentos

### 2. tailwind.config.ts
Adicionar cores:
- `success` e `success-foreground`
- `warning` e `warning-foreground`

### 3. src/components/layout/AppSidebar.tsx
- Usar logo XPLO oficial (copiar imagem para o projeto)
- Estilizar sidebar com fundo branco
- Item ativo com fundo roxo claro e texto roxo

### 4. Copiar Logo
- Copiar `user-uploads://LOGO_ROXO_PNG-2.png` para `src/assets/logo-xplo.png`
- Importar e usar na sidebar

---

## Resultado Visual Esperado

```
+------------------+----------------------------------------+
|  [LOGO XPLO]     |  Dashboard                             |
|  Starter         |  Subtitulo da pagina                   |
|------------------|----------------------------------------|
|  Dashboard    <- |  +--------+ +--------+ +--------+      |
|  Clientes        |  | Card 1 | | Card 2 | | Card 3 |      |
|  Onboarding      |  +--------+ +--------+ +--------+      |
|  Gerador IA      |                                        |
|  Ativos          |  [Conteudo principal]                  |
|  Configuracoes   |                                        |
+------------------+----------------------------------------+

Legenda:
- Sidebar: fundo branco, borda direita cinza sutil
- Item ativo: fundo roxo claro, texto e icone roxo
- Cards: brancos com sombra suave
- Badges de status: verde/amarelo/vermelho
```

---

## Detalhes Tecnicos

### CSS Variables (Light Mode)
```css
/* Sidebar clara */
--sidebar-background: 0 0% 100%;
--sidebar-foreground: 260 10% 20%;
--sidebar-primary: 262 83% 58%;
--sidebar-primary-foreground: 0 0% 100%;
--sidebar-accent: 262 60% 95%;
--sidebar-accent-foreground: 262 83% 50%;
--sidebar-border: 260 15% 90%;

/* Cores de apoio */
--success: 142 76% 45%;
--success-foreground: 0 0% 100%;
--warning: 45 93% 47%;
--warning-foreground: 0 0% 10%;
```

### Tailwind Config
```ts
success: {
  DEFAULT: "hsl(var(--success))",
  foreground: "hsl(var(--success-foreground))",
},
warning: {
  DEFAULT: "hsl(var(--warning))",
  foreground: "hsl(var(--warning-foreground))",
},
```

