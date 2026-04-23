---
name: CRM Fase 3 - Contatos e Configurações
description: Página /crm/contatos (tabela + busca + exportar CSV) e /crm/config (CRUD pipelines, tags, custom_fields, activity_templates)
type: feature
---
- /crm/contatos: tabela única consolidando clients + último deal (pipeline/etapa/valor/status) + última activity. Busca local por nome/telefone/email/pipeline. Exportar CSV (BOM UTF-8). Link para /clients/:id.
- /crm/config com 4 abas:
  1. Pipelines: CRUD em pipelines (nome, descrição, cor). Excluir cascateia colunas/deals.
  2. Tags: CRUD em tags com chip colorido.
  3. Campos customizáveis: CRUD em custom_fields (entity_type deal/client, field_type text/number/select/multi_select/date/checkbox, required).
  4. Templates de atividade: CRUD em activity_templates (type, default_subject, default_description, default_duration_minutes).
- Sidebar: itens "Contatos" e "CRM Config" adicionados após "Atividades".
