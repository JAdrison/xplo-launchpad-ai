

## Revisão final e PDF completos — com tudo que foi respondido

### Objetivo

Tanto a tela de **Revisão Final** (etapa 6) quanto o **PDF de Onboarding X1** passarão a mostrar **100% das respostas** do cliente, incluindo dados sensíveis (senhas Instagram/Facebook). Hoje os dois estão incompletos: a tela mostra só um resumo curto e o PDF foi feito para a estrutura antiga, ignorando SWOT, perfil por nicho (`profile_data`), mercado por nicho (`market_data`) e os 3 blocos de ICP novos.

### Aviso importante (LGPD)

Por segurança, nossa regra atual mascara senhas. Você está pedindo para **exibi-las em texto puro**, tanto na tela quanto no PDF. Vou seguir o pedido, mas adicionarei:
- Um **alerta visual** de confidencialidade no topo da revisão e do PDF ("Documento confidencial — contém credenciais de acesso").
- Marca d'água "CONFIDENCIAL" no rodapé de cada seção sensível do PDF.

Se preferir manter as senhas mascaradas e mostrar só nos olhos clicando em "revelar", me avise antes que eu implemente.

### O que muda

#### 1. Tela: `StepReviewV2.tsx` (etapa 6 do wizard)

Reescrever a revisão para mostrar **todas** as respostas, organizadas por etapa do wizard, no mesmo idioma das perguntas:

- **Etapa 1 — Cadastro**: nome do negócio, nicho, CNPJ, responsável, CPF, e-mail, telefone, faturamento atual, investimento inicial em tráfego.
- **Etapa 2 — Sobre o negócio**: percorre dinamicamente todos os campos de `profile_data` (varia por nicho: hospedagem, saúde, genérico) — tipo, localização, unidades, diária, diferenciais, comodidades, experiência, especialidade, ticket, etc. Mostra também `product_name`, `product_description`, `differentiators`, `benefits`, `promotions`, `average_ticket`, `sales_model`.
- **Etapa 3 — Diagnóstico (SWOT)**: 4 quadrantes com tags + texto livre, usando os títulos por nicho ("Ponto forte da hospedagem", etc.).
- **Etapa 4 — Mercado e acessos**: faturamento, investimento mensal, meta, canais de demanda, equipe; concorrentes 1/2 (nome + motivo); inspirações 1/2; **acessos Meta Ads**: Instagram link, login, **senha em texto puro**, Facebook login, **senha em texto puro**, WhatsApp, Google Meu Negócio; e todo o `market_data` extra do nicho.
- **Etapa 5 — Perfil dos principais clientes**: 3 blocos completos (`bloco1_data`, `bloco2_data`, `bloco3_data`) com todos os campos preenchidos (motivação, perfil, comportamento, o que evitar, etc.).
- Banner de aviso "Documento confidencial" no topo.

Componente auxiliar interno `RenderJSON` para listar pares chave→valor de objetos `profile_data`/`market_data`/`bloco*_data`, com labels amigáveis (mapa de tradução pt-BR, fallback para a chave bruta) e tratamento de arrays/strings.

#### 2. PDF: `OnboardingPDFTemplate.tsx`

Reescrever para receber a mesma estrutura nova que `OnboardingX1Section.tsx` já monta em `pdfContent` (props: `client`, `company`, `product`, `swot`, `market` com `market_data`, `icp` com 3 blocos). Seções:

1. Capa + aviso "Documento confidencial — contém credenciais"
2. Cadastro (todos os campos)
3. Sobre o negócio (product + todo `profile_data` por nicho)
4. Diagnóstico SWOT (4 quadrantes: tags + texto)
5. Mercado e investimento (revenue, meta, canais, equipe + `market_data` extra)
6. Concorrentes e inspirações
7. **Redes sociais e acessos Meta Ads** — exibir senhas em texto puro + selo "CONFIDENCIAL"
8. Perfil dos clientes — 3 blocos completos com todas as chaves
9. Promessa (se existir)
10. Rodapé com data e nota de confidencialidade

Reaproveita o estilo atual (logo XPLO em todas as páginas, margens, `pageBreakInside`).

#### 3. Ajuste em `OnboardingX1Section.tsx`

O `pdfContent` já existe mas está incompleto. Adicionar ao objeto `market`:
- `instagram_link`, `instagram_login`, `instagram_password`
- `facebook_login`, `facebook_password`
- `whatsapp_number`, `google_my_business`
- `local_competitor_1/2`, `inspiration_company_1/2`

E acrescentar `profile_data` cru ao objeto `product` (para o template iterar campos por nicho).

### Detalhes técnicos

- **Sem migração de banco** — todos os dados já existem nas tabelas `clients`, `client_profile`, `client_swot`, `client_icp`.
- Campo `market_data` e `profile_data` são `jsonb` livres → renderização dinâmica via `Object.entries` + dicionário de labels (`LABELS_PT`) para chaves conhecidas (`type`, `units`, `diaria`, `experiencia`, `differentiators`, `comodidades`, `motivacao`, etc.); chaves desconhecidas caem para `humanize(key)`.
- Senhas: removidas as funções `mask()` e a nota "por segurança não exibimos senhas". Em vez disso, badge vermelho "Confidencial".
- PDF mantém `react-to-pdf` com layout A4.

### Fora do escopo

- Não muda o fluxo de salvar/concluir.
- Não muda o estilo visual geral da plataforma.
- Não cria histórico/versão do PDF.

