

# Adicionar Opcao de Reiniciar Onboarding

## Resumo

Adicionar um botao "Reiniciar Onboarding" no card de Onboarding X1 que permite ao usuario apagar todos os dados preenchidos e recomegar o processo do zero.

---

## UX Proposta

O botao sera exibido apenas quando o cliente tiver dados de onboarding preenchidos (qualquer status). Ao clicar, um dialogo de confirmacao sera exibido alertando que todos os dados serao perdidos. Apos a confirmacao, os dados serao apagados e o cliente sera redirecionado para a primeira etapa.

---

## Alteracoes

### Arquivo: src/components/client/OnboardingX1Section.tsx

**1. Adicionar imports necessarios**
- Importar `RotateCcw` do lucide-react para o icone
- Importar `AlertDialog` e componentes relacionados de "@/components/ui/alert-dialog"

**2. Adicionar estados de controle**
- `isResetDialogOpen`: Controle do dialogo de confirmacao
- `isResetting`: Estado de loading durante a exclusao

**3. Criar funcao handleResetOnboarding**
A funcao ira deletar dados de todas as tabelas relacionadas ao onboarding na ordem correta (respeitando foreign keys):

```text
Ordem de exclusao:
1. icp_pains (depende de icps)
2. offers_hormozi (depende de icps)
3. ads (depende de offers_hormozi)
4. landing_pages (depende de offers_hormozi)
5. icps (depende de clients)
6. client_promise (depende de clients)
7. client_profile (depende de clients)
8. Atualizar status do cliente para "draft"
9. Limpar niche do cliente (campo da tabela clients)
```

**4. Adicionar dialogo de confirmacao**
Um AlertDialog com mensagem de aviso clara:
- Titulo: "Reiniciar Onboarding?"
- Descricao: Aviso de que todos os dados serao perdidos permanentemente (ICPs, promessa, mercado, etc)
- Botoes: "Cancelar" e "Sim, Reiniciar" (com variante destrutiva)

**5. Adicionar botao na secao de acoes**
O botao aparecera quando `hasData` for true (dados existentes), com estilo outline e icone de reset.

---

## Fluxo de Dados

```text
[Usuario clica "Reiniciar"]
        |
        v
[Dialogo de confirmacao abre]
        |
        v
[Usuario confirma]
        |
        v
[Delete cascade nos dados]
        |
        v
[Status volta para "draft"]
        |
        v
[Callback onStatusChange() atualiza a pagina]
        |
        v
[Toast de sucesso]
```

---

## Componentes UI Utilizados

| Componente | Uso |
|------------|-----|
| AlertDialog | Confirmacao antes de deletar |
| Button | Botao "Reiniciar Onboarding" |
| RotateCcw | Icone do botao |
| Loader2 | Icone de loading durante exclusao |

---

## Seguranca

A exclusao sera feita apenas para o `client_id` especifico, respeitando as RLS policies existentes. A ordem de exclusao respeita as foreign keys para evitar erros de constraint.

---

## Arquivo a Modificar

| Arquivo | Tipo de Mudanca |
|---------|-----------------|
| `src/components/client/OnboardingX1Section.tsx` | Adicionar dialogo, estados, funcao de reset e botao |

