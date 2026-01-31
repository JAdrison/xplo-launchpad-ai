

# Correção da Aba Onboarding PPP e Gerador IA

## Problemas Identificados

### 1. Aba Onboarding PPP Vazia
A página `/onboarding` só mostra um card pedindo para selecionar cliente quando acessada diretamente pelo menu. Não existe uma listagem dos onboardings.

### 2. Gerador IA Não Funcional
A página `/generator` apenas exibe um card estático que redireciona para configurações. Não há funcionalidade real de geração.

### 3. Falta de Geração com IA nos Detalhes do Cliente
Após concluir o PPP, não há como gerar ofertas/LPs/anúncios a partir dos dados coletados.

---

## Solução Proposta

### Parte 1: Refatorar Página de Onboarding PPP

Transformar `/onboarding` em uma listagem de todos os clientes com seus status de onboarding:

```text
+----------------------------------------------------------+
|  Onboarding PPP                                           |
|  Acompanhe o processo de discovery dos seus clientes      |
|----------------------------------------------------------|
|                                                           |
|  [Tabs: Todos | Em andamento | Concluídos | Pendentes]    |
|                                                           |
|  +-----------------------------------------------------+  |
|  | XPLO SOLAR LTDA                    [PPP Concluído]  |  |
|  | Produto: Assinatura de energia                      |  |
|  | ICPs: 1 | Promessa: Definida                        |  |
|  | [Ver Detalhes] [Editar PPP] [Gerar com IA]          |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  +-----------------------------------------------------+  |
|  | Adrison Magalhaes                  [Em andamento]   |  |
|  | Progresso: 40% (2 de 5 etapas)                      |  |
|  | [Continuar Onboarding]                              |  |
|  +-----------------------------------------------------+  |
|                                                           |
+----------------------------------------------------------+
```

### Parte 2: Refatorar Página Gerador IA

Transformar `/generator` em uma ferramenta de geração baseada em clientes que concluíram o PPP:

```text
+----------------------------------------------------------+
|  Gerador IA                                               |
|  Gere ofertas, LPs e anúncios com IA                      |
|----------------------------------------------------------|
|                                                           |
|  Selecione um cliente:                                    |
|  [Dropdown: Clientes com PPP concluído]                   |
|                                                           |
|  +-----------------------------------------------------+  |
|  | O que deseja gerar?                                 |  |
|  |-----------------------------------------------------|  |
|  |  [ ] Oferta Hormozi                                 |  |
|  |  [ ] Landing Page                                   |  |
|  |  [ ] Anúncios (Scripts + Headlines)                 |  |
|  |                                                      |  |
|  |  [Gerar com IA]                                     |  |
|  +-----------------------------------------------------+  |
|                                                           |
+----------------------------------------------------------+
```

### Parte 3: Adicionar Ações de IA nos Detalhes do Cliente

Para clientes com `ppp_completed`:
- Botão "Gerar Oferta com IA"
- Botão "Gerar LP com IA"
- Botão "Gerar Anúncios com IA"

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Onboarding.tsx` | Refatorar para exibir listagem de onboardings quando sem parâmetro `client` |
| `src/pages/Generator.tsx` | Implementar seleção de cliente e opções de geração |
| `src/pages/ClientDetails.tsx` | Adicionar seção de geração IA para clientes com PPP concluído |

---

## Detalhamento Técnico

### Onboarding.tsx - Nova Estrutura

Quando acessado SEM parâmetro `client`:
1. Buscar todos os clientes com dados de onboarding (join com `client_profile`, `icps`, `client_promise`)
2. Exibir cards com progresso de cada cliente
3. Filtros por status (tabs)
4. Ações contextuais por status

Quando acessado COM parâmetro `client`:
- Manter o wizard atual de 5 etapas

### Generator.tsx - Nova Funcionalidade

1. Dropdown para selecionar cliente (apenas os com `ppp_completed` ou superior)
2. Checkboxes para tipo de geração
3. Botão de gerar que chama a API de IA (usando Lovable AI)
4. Exibir resultado e salvar nas tabelas correspondentes

### ClientDetails.tsx - Seção de Geração

Para clientes com `ppp_completed`:
- Card "Gerar com IA"
- Botões para cada tipo de geração
- Indicador se já foi gerado

---

## Fluxo de Dados para Geração com IA

```text
client_profile + icps + icp_pains + client_promise
                    |
                    v
            [Edge Function: generate-offer]
                    |
                    v
              offers_hormozi (salvar)
                    |
                    v
            [Edge Function: generate-lp]
                    |
                    v
              landing_pages (salvar)
                    |
                    v
            [Edge Function: generate-ads]
                    |
                    v
                 ads (salvar)
```

---

## Benefícios

- Visibilidade completa de todos os onboardings em andamento
- Fluxo direto para gerar conteúdo após PPP concluído
- Múltiplos pontos de acesso para geração (menu Gerador IA ou detalhes do cliente)
- Integração com Lovable AI (sem necessidade de API key externa)

