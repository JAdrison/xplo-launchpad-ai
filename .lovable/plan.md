

# Adição de Credenciais Meta Ads e Conformidade LGPD

## Resumo

Adicionar campos para credenciais do Instagram/Facebook no onboarding (necessárias para gestão de tráfego via Meta Ads) e incluir avisos de conformidade com LGPD tanto no onboarding quanto no cadastro de clientes.

---

## Alterações Necessárias

### 1. Migração de Banco de Dados

Adicionar novos campos na tabela `client_profile` para armazenar as credenciais:

```sql
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS instagram_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instagram_login text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instagram_password text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS facebook_login text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS facebook_password text DEFAULT NULL;
```

---

### 2. StepMarket.tsx - Nova Seção de Credenciais Meta

Adicionar nova seção no formulário de Mercado com:

**Explicação do Contexto:**
```
O tráfego pago será feito através do Meta Ads (Facebook/Instagram). 
Para gerenciar suas campanhas, precisamos das credenciais de acesso às suas contas.
```

**Campos:**
- Link do Instagram (@ ou URL)
- Login do Instagram
- Senha do Instagram
- Login do Facebook
- Senha do Facebook

**Layout:**
```
+----------------------------------------------------------+
|  Acesso às Redes Sociais (Meta Ads)                      |
|                                                          |
|  +----------------------------------------------------+  |
|  | O tráfego pago será realizado através do Meta Ads  |  |
|  | (Facebook/Instagram). Para configurar e gerenciar  |  |
|  | suas campanhas, precisamos do acesso às contas.    |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Link do Instagram    [@usuario ou URL_______________]   |
|                                                          |
|  [Grid 2 colunas]                                        |
|  Login Instagram      [______________]                   |
|  Senha Instagram      [**************] (type=password)   |
|                                                          |
|  Login Facebook       [______________]                   |
|  Senha Facebook       [**************] (type=password)   |
|                                                          |
|  +----------------------------------------------------+  |
|  | 🔒 AVISO DE PRIVACIDADE (LGPD)                     |  |
|  | Suas credenciais são protegidas por criptografia e |  |
|  | armazenadas de forma segura. Não compartilhamos    |  |
|  | seus dados com terceiros e utilizamos apenas para  |  |
|  | a gestão das suas campanhas de tráfego pago.       |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

---

### 3. ClientNew.tsx - Aviso LGPD Aprimorado

Atualizar o alerta de privacidade existente para ser mais completo:

```
🔒 Conformidade com a LGPD

Os dados pessoais coletados (CNPJ, CPF, e-mail, telefone, etc) serão utilizados 
exclusivamente para:
• Elaboração de contrato
• Cadastro na plataforma de envio de boletos
• Comunicação sobre os serviços contratados

Seus dados são protegidos por criptografia e armazenados de forma segura. 
Não compartilhamos suas informações com terceiros sem o seu consentimento.
```

---

### 4. StepReview.tsx - Exibir Credenciais

Adicionar seção para mostrar as credenciais cadastradas (mascarando senhas):

```
Acesso Meta Ads
• Instagram: @usuario
• Login Instagram: email@exemplo.com
• Senha: ••••••••
• Login Facebook: email@exemplo.com  
• Senha: ••••••••
```

---

## Segurança e LGPD

| Aspecto | Implementação |
|---------|---------------|
| Armazenamento | Campos text no banco (Supabase usa TLS em trânsito) |
| Exibição | Senhas mascaradas com asteriscos na revisão |
| Aviso legal | Texto claro sobre uso exclusivo para gestão de tráfego |
| Consentimento | Implícito ao preencher o formulário |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Adicionar 5 campos de credenciais |
| `StepMarket.tsx` | Adicionar seção de credenciais Meta + aviso LGPD |
| `ClientNew.tsx` | Melhorar aviso de privacidade LGPD |
| `StepReview.tsx` | Exibir credenciais na revisão (senhas mascaradas) |

---

## Checklist

| # | Item |
|---|------|
| 1 | Migração SQL para campos de credenciais |
| 2 | StepMarket.tsx: Seção de credenciais Meta Ads |
| 3 | StepMarket.tsx: Aviso LGPD sobre senhas |
| 4 | ClientNew.tsx: Aviso LGPD melhorado |
| 5 | StepReview.tsx: Exibir credenciais (senhas mascaradas) |
| 6 | Testar fluxo completo interno e externo |

---

## Resultado Esperado

1. **Credenciais coletadas**: Instagram link, login/senha, Facebook login/senha
2. **Transparência LGPD**: Avisos claros sobre uso e proteção dos dados
3. **Segurança visual**: Senhas exibidas como asteriscos na revisão
4. **Contexto claro**: Explicação de que o tráfego é feito via Meta Ads

