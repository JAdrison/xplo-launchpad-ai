---
name: Funções operacionais e atribuição automática
description: Enum job_function, tabela user_job_functions, coluna activities.required_function e trigger que atribui responsible_id automaticamente
type: feature
---

# Funções operacionais (job_function)

## Enum
`gestor_trafego, designer, copywriter, sdr, vendedor, contato_cliente, gestor_projetos, ia_specialist`
Espelhado em `src/lib/jobFunctions.ts` (labels, cores, ícones lucide).

## Tabelas
- `user_job_functions(user_id, job_function)` — N:N (admin gerencia, usuários CRM leem).
- `activities.required_function` — função necessária para executar a tarefa.

## Trigger
`trg_assign_activity_responsible` (BEFORE INSERT em activities):
- Se `responsible_id` é NULL e `required_function` está setado, escolhe o primeiro usuário
  ativo (admin/user) que tenha aquela função em `user_job_functions` (ORDER BY created_at).

## UI
- `/admin/users` exibe `<UserJobFunctionsManager>` para cada usuário ativo (admin gerencia,
  master é read-only). Componente em `src/components/admin/UserJobFunctionsManager.tsx`.
- `DealDetailModal` mostra badge da função requerida em cada atividade do checkpoint.

## Templates
Tarefas automáticas (`seed_maintenance_tasks`, `handle_activity_completion` recorrentes) ainda
**não** preenchem `required_function` por padrão — adicionar caso a caso conforme o time evoluir
(ex: tráfego → `gestor_trafego`, design → `designer`, IA → `ia_specialist`).
