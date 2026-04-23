---
name: CRM Fase 3 - Contatos e Configurações
description: Página /crm consolidada com abas Kanban/Atividades/Contatos + menu Configurar (Pipelines, Tags, Campos, Templates) em diálogos. Botões + Pipeline e + Coluna no header.
type: feature
---
- /crm é o ponto único de entrada. Header com 2 linhas:
  1. Tabs [Kanban] [Atividades] [Contatos] + menu "⚙ Configurar" (DropdownMenu) com 4 ações que abrem Dialog modal: Pipelines, Tags, Campos customizáveis, Templates de atividade.
  2. (Apenas na aba Kanban) Seletor de pipeline, [+ Pipeline] (abre dialog Pipelines), [+ Coluna] (NewColumnDialog cria pipeline_columns com sort_order=columns.length), busca, [+ Negócio].
- Componentes config extraídos em src/components/crm/config/{Pipelines,Tags,Fields,Templates}Config.tsx — cada um aceita prop inDialog para renderizar sem Card wrapper.
- CrmActivitiesView e CrmContactsView são exports nomeados reaproveitáveis; os defaults em /crm/atividades, /crm/contatos e /crm/config continuam funcionando para deep-linking, mas saíram do menu lateral.
- Sidebar enxuta: apenas "CRM" (não há mais Atividades/Contatos/CRM Config como itens de primeiro nível).
- Sincronização: ao salvar config (qualquer tab), chama refetch() do Kanban e refetchPipelines.
