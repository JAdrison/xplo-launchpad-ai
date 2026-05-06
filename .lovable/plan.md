## Objetivo

Permitir que cada usuário do sistema tenha **uma ou mais funções operacionais** (Gestor de Tráfego, Designer, Copywriter, SDR, Vendedor, Contato com o Cliente, Gestor de Projetos, IA Specialist) e que **cada tarefa do CRM seja atribuída automaticamente** ao usuário responsável pela função correspondente no momento em que é criada (tanto pelo template do plano quanto pelas recorrências da Manutenção).

---

## 1. Banco de dados

### 1.1 Novo enum `job_function`
```
gestor_trafego | designer | copywriter | sdr | vendedor 
| contato_cliente | gestor_projetos | ia_specialist
```

### 1.2 Nova tabela `user_job_functions`
Relação N:N entre `auth.users` e `job_function` (um usuário pode ter várias funções).
- `user_id uuid` + `function job_function` (PK composta)
- RLS: admin gerencia; usuário vê as próprias.

### 1.3 Coluna nova em `activities`
- `required_function job_function NULL` — qual função deve executar a tarefa.

### 1.4 Função SQL `assign_activity_responsible()`
Trigger **BEFORE INSERT** em `activities`:
- Se `responsible_id` já vier preenchido → mantém.
- Senão, se `required_function` estiver setado → busca o **primeiro usuário ativo** com aquela função (ordem alfabética determinística, ignorando `pending`/`suspended`) e atribui em `responsible_id`.
- Senão → deixa NULL (sem responsável).

### 1.5 Atualizar `seed_maintenance_tasks` e o template do plano (Fase 1)
Cada tarefa do template e cada tarefa de Manutenção passa a declarar sua `required_function` (ex.: Instagram 30d → `designer`; Verificação tráfego → `gestor_trafego`; IA 15d → `ia_specialist`).

---

## 2. Mapeamento tarefa → função (default)

| Checkpoint | Tarefa | Função |
|---|---|---|
| 01 Cadastro | Validar contrato/pagamento | contato_cliente |
| 01 Cadastro | Coletar acessos (FB/IG/GMB) | contato_cliente |
| 02 Início | Onboarding com cliente | contato_cliente |
| 02 Início | Configurar BM/conta de anúncio | gestor_trafego |
| 03 Estratégia | ICP + Promessa + SWOT | gestor_projetos |
| 03 Estratégia | Roteiros e copies de anúncios | copywriter |
| 03 Estratégia | Criativos estáticos + vídeos | designer |
| 04 Tráfego | Subir campanhas | gestor_trafego |
| 04 Tráfego | Configurar pixel/eventos | gestor_trafego |
| 05 Entrega | Configurar XPLO Lab (Pro) | ia_specialist |
| 05 Entrega | Treinar IA com base do cliente (Pro) | ia_specialist |
| Bônus GMB | Otimizar Google Meu Negócio | gestor_trafego |
| Bônus Vitrine IG | Vitrine de Instagram | designer |
| 06 Manutenção | Instagram 30d | designer |
| 06 Manutenção | Verificação tráfego 7d | gestor_trafego |
| 06 Manutenção | Relatório quinzenal | gestor_trafego |
| 06 Manutenção | Trocar campanhas 30d | gestor_trafego |
| 06 Manutenção | Verificação IA 15d (Pro) | ia_specialist |

---

## 3. Interface

### 3.1 Tela `/admin/users` — gestão de funções
- Nova coluna **Funções** com chips coloridos por função.
- Botão **"Editar funções"** abre modal com checkboxes das 8 funções.
- Salvar → upsert em `user_job_functions`.

### 3.2 Modal do Deal (`DealDetailModal.tsx`)
- Cada tarefa já mostra responsável; adicionar **badge da função requerida** (`required_function`) ao lado do título quando presente.
- Avatar/nome do responsável continua clicável; permite reatribuir manualmente via dropdown filtrando por função.

### 3.3 `/crm/atividades`
- Filtro novo **"Função"** no topo.
- Exibe coluna "Responsável" + chip da função.

---

## 4. Lógica de fallback

- Se nenhum usuário tiver a função necessária no momento da criação → tarefa fica **sem responsável** + badge **"Sem responsável (função X)"** em destaque vermelho no modal do deal, para o admin atribuir manualmente.
- Quando admin atribuir um usuário àquela função depois, **não retroage** automaticamente (decisão consciente para evitar surpresas — admin pode usar o filtro "Sem responsável" para varrer).

---

## 5. Detalhes técnicos

**Migrations:**
1. `CREATE TYPE job_function AS ENUM (...)`
2. `CREATE TABLE user_job_functions (user_id uuid, function job_function, PRIMARY KEY (user_id, function))` + RLS
3. `ALTER TABLE activities ADD COLUMN required_function job_function`
4. `CREATE FUNCTION assign_activity_responsible()` + `CREATE TRIGGER BEFORE INSERT ON activities`
5. Atualizar `seed_maintenance_tasks` para incluir `required_function` na inserção.

**Frontend:**
- `src/lib/xploProcessTemplate.ts` — adicionar campo `requiredFunction` em cada tarefa template.
- `src/lib/syncDealTasks.ts` — propagar `required_function` no insert.
- `src/lib/jobFunctions.ts` (novo) — labels, cores e ícones das 8 funções.
- `src/components/admin/UserFunctionsModal.tsx` (novo).
- `src/pages/admin/Users.tsx` — coluna + botão.
- `src/components/crm/DealDetailModal.tsx` — badge da função + dropdown de reatribuição.
- `src/pages/crm/Atividades.tsx` — filtro por função.

**Memória:** salvar regra em `mem://crm/funcoes-responsaveis-tarefas`.
