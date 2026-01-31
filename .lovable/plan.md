

# XPLO STARTER - Plano de Implementação

## Visão Geral
Ferramenta interna para onboarding de clientes da XPLO com fluxo linear: **Cadastro → PPP → Oferta → LP & Anúncios**. Mobile-first, sem login, com IA própria (OpenAI/Gemini).

---

## Fase 1: Fundação e Layout

### 1.1 Estrutura Base
- Layout responsivo com sidebar (drawer no mobile)
- Tema claro como padrão + toggle para escuro
- Cores XPLO: Roxo (#8B5CF6) como primária
- Logo XPLO na sidebar

### 1.2 Navegação
- Dashboard
- Clientes
- Onboarding PPP
- Gerador IA
- Ativos
- Configurações

### 1.3 Banco de Dados (Lovable Cloud)
Tabelas: clients, client_profile, icps, icp_pains, offers_hormozi, landing_pages, ads, versions

---

## Fase 2: Gestão de Clientes

### Lista de Clientes
- Tabela desktop / Cards mobile
- Nome, nicho, status, datas
- Ações: abrir, duplicar, arquivar

### Perfil do Cliente
- Abas: Resumo, Cadastro, PPP, ICPs, Oferta, LP, Anúncios, Histórico
- "Próximo passo sugerido" no topo
- Botões: Gerar com IA, Exportar, Duplicar

---

## Fase 3: Wizard de Onboarding PPP

### 5 Etapas com progresso visual

**1. Produto** - Nome, descrição, ticket, modelo de venda, diferenciais

**2. Público (ICP)** - Até 3 ICPs com nome, segmento, consciência, situação

**3. Problema** - Dor principal, impactos, consequências por ICP

**4. Promessa** - Campo manual + "Gerar com IA"

**5. Revisão** - Resumo + checklist + "Concluir PPP"

---

## Fase 4: Gerador IA

### Configuração
- Input para API Key (OpenAI/Gemini)
- Salvar em localStorage ou sessão

### Módulos
- Gerar Oferta Hormozi (promessa, mecanismo, prova, garantia, stack, CTA)
- Gerar LP Hormozi (3 variantes: Direta, Consultiva, Agressiva)
- Gerar Anúncios Ladeira (2 estáticos + 3 vídeos de 30s)

### Funcionalidades
- Botões de refinamento: "Mais direto", "Mais premium", "Gerar variações"
- Editor rico para editar outputs
- "Salvar no Perfil"

---

## Fase 5: Dashboard

- Cards: Total clientes, Em onboarding, PPP concluído, Ativos gerados
- Lista: Últimos clientes editados
- Atalhos: Novo cliente, Iniciar PPP, Gerar Oferta

---

## Fase 6: Histórico e Versionamento

- Toda geração IA cria versão
- Aba "Histórico" no perfil
- Restaurar versões anteriores

---

## Fluxo do Usuário

```
Criar Cliente → Wizard PPP (5 etapas) → Gerar Oferta → Gerar LP → Gerar Anúncios → Tudo no Perfil
```

---

## Entregáveis MVP

✅ Layout responsivo mobile-first
✅ Design XPLO (roxo, clean)
✅ CRUD de clientes
✅ Wizard PPP (5 etapas)
✅ Até 3 ICPs por cliente
✅ Oferta Hormozi via IA
✅ LP Hormozi (3 variantes)
✅ Anúncios Ladeira (2 estáticos + 3 vídeos)
✅ Histórico de versões
✅ Sem login, single-workspace

