---
name: Credenciais XPLO LAB por cliente
description: Campos xplo_lab_login/xplo_lab_password em clients — uso interno admin/funcionário, nunca aparecem no onboarding
type: feature
---
- Colunas `xplo_lab_login` e `xplo_lab_password` em `public.clients`.
- Editáveis e visíveis APENAS em `/clients/:id` (Card "Acesso XPLO LAB" com badge "Interno").
- NUNCA exibir, coletar ou referenciar no onboarding interno (`OnboardingWizard`) nem no externo (`OnboardingExternal` / token público).
- Senha sempre mascarada por padrão (`••••••••`) com botão olho para revelar (LGPD).
- Diálogo dedicado de edição com inputs `autoComplete="off"` / `new-password`.
