

# Sistema de Link Externo para Onboarding de Clientes (Atualizado)

## Resumo

Criar um sistema de links publicos que permite:
1. Enviar um link para o cliente criar seu proprio cadastro inicial
2. **NOVO**: Apos o cadastro, dar opcao de finalizar OU iniciar o onboarding imediatamente
3. Enviar um link exclusivo para o cliente preencher o Onboarding X1
4. Adicionar aviso sobre uso dos dados pessoais no cadastro

---

## Fluxo do Sistema (Atualizado)

```text
FLUXO 1 - CADASTRO INICIAL COM OPCAO
+----------------------------------------------------------+
|  Link Publico: /register                                 |
|                                                          |
|  1. Cliente preenche dados basicos                       |
|     - Nome da Empresa, CNPJ                              |
|     - Responsavel (Nome, CPF, Email, Tel)                |
|     - Nicho                                              |
|                                                          |
|  2. [Aviso de privacidade]                               |
|                                                          |
|  3. APOS SUCESSO - TELA DE ESCOLHA:                      |
|     +------------------------------------------------+   |
|     |  Cadastro Realizado!                           |   |
|     |                                                |   |
|     |  O que voce gostaria de fazer agora?           |   |
|     |                                                |   |
|     |  +--------------------+ +--------------------+ |   |
|     |  | FINALIZAR          | | INICIAR ONBOARDING | |   |
|     |  |                    | |                    | |   |
|     |  | [Icone Check]      | | [Icone Rocket]     | |   |
|     |  |                    | |                    | |   |
|     |  | Pronto! Nossa      | | Ja quero preencher | |   |
|     |  | equipe entrara em  | | as informacoes do  | |   |
|     |  | contato em breve.  | | meu negocio agora. | |   |
|     |  +--------------------+ +--------------------+ |   |
|     +------------------------------------------------+   |
|                                                          |
|  Se escolher FINALIZAR:                                  |
|     -> Tela de sucesso final                             |
|     -> Status: draft                                     |
|                                                          |
|  Se escolher INICIAR ONBOARDING:                         |
|     -> Redireciona para wizard PPP                       |
|     -> Status: ppp_in_progress                           |
+----------------------------------------------------------+
```

---

## Estados da Pagina de Registro

| Estado | Descricao |
|--------|-----------|
| `form` | Formulario de cadastro (inicial) |
| `choice` | Tela de escolha apos cadastro bem-sucedido |
| `success` | Tela final se escolher "Finalizar" |
| `onboarding` | Wizard PPP integrado (se escolher "Iniciar") |

---

## Estrutura de Dados

### Nova tabela: `client_tokens`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| client_id | uuid | FK para clients |
| token | text | Token unico para acesso |
| type | enum | 'onboarding' (futuramente outros) |
| expires_at | timestamp | Data de expiracao (7 dias) |
| used_at | timestamp | Quando foi utilizado |
| created_at | timestamp | Data de criacao |

---

## Novas Rotas

| Rota | Tipo | Descricao |
|------|------|-----------|
| `/register` | Publica | Formulario de auto-cadastro + wizard opcional |
| `/onboarding/external/:token` | Publica | Wizard PPP externo via link exclusivo |

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/ClientRegister.tsx` | Pagina publica de auto-cadastro com opcao de onboarding |
| `src/pages/OnboardingExternal.tsx` | Wizard PPP externo para cliente via token |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Adicionar rotas publicas fora do AppLayout |
| `src/pages/ClientDetails.tsx` | Adicionar botao para gerar/copiar link do onboarding |
| `src/pages/ClientNew.tsx` | Adicionar aviso sobre uso dos dados |

---

## Pagina de Auto-Cadastro (/register) - Detalhada

### Estado 1: Formulario (form)
```text
+----------------------------------------------------------+
|  [Logo XPLO]                                             |
|                                                          |
|  Cadastro Inicial                                        |
|  Preencha seus dados para comecar                        |
|                                                          |
|  +----------------------------------------------------+  |
|  | [Icone Info - Azul]                                |  |
|  | Os dados pessoais (CNPJ, CPF, etc) serao usados    |  |
|  | apenas para questoes de contrato e cadastro na     |  |
|  | plataforma de envio de boletos.                    |  |
|  +----------------------------------------------------+  |
|                                                          |
|  | Dados da Empresa                                   |  |
|  | Nome da Empresa *  [________________]              |  |
|  | CNPJ              [________________]              |  |
|  | Nicho/Segmento    [________________]              |  |
|  |                                                    |  |
|  | Dados do Responsavel                               |  |
|  | Nome *            [________________]              |  |
|  | CPF               [________________]              |  |
|  | Email *           [________________]              |  |
|  | Telefone          [________________]              |  |
|  |                                                    |  |
|  | [x] Li e concordo com os termos de uso dos dados   |  |
|  |                                                    |  |
|  |                      [Enviar Cadastro]             |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

### Estado 2: Tela de Escolha (choice)
```text
+----------------------------------------------------------+
|  [Logo XPLO]                                             |
|                                                          |
|  [Icone Check Verde]                                     |
|                                                          |
|  Cadastro Realizado!                                     |
|  Ola, [Nome]! Seu cadastro foi recebido.                 |
|                                                          |
|  O que voce gostaria de fazer agora?                     |
|                                                          |
|  +------------------------+  +------------------------+  |
|  |  FINALIZAR POR AGORA   |  |  INICIAR ONBOARDING    |  |
|  |                        |  |                        |  |
|  |  [Icone CheckCircle]   |  |  [Icone Rocket]        |  |
|  |                        |  |                        |  |
|  |  Pronto! Nossa equipe  |  |  Quero preencher as    |  |
|  |  entrara em contato    |  |  informacoes do meu    |  |
|  |  em breve.             |  |  negocio agora mesmo.  |  |
|  |                        |  |                        |  |
|  |  Tempo: ~1 min         |  |  Tempo: ~10 min        |  |
|  +------------------------+  +------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

### Estado 3: Sucesso Final (success)
```text
+----------------------------------------------------------+
|  [Logo XPLO]                                             |
|                                                          |
|  [Icone Check Grande Verde]                              |
|                                                          |
|  Tudo Certo!                                             |
|                                                          |
|  Obrigado, [Nome]!                                       |
|                                                          |
|  Seu cadastro foi recebido com sucesso.                  |
|  Nossa equipe entrara em contato em breve                |
|  para dar continuidade ao processo.                      |
|                                                          |
|  [Icone WhatsApp] Duvidas? Fale conosco                  |
|                                                          |
+----------------------------------------------------------+
```

### Estado 4: Onboarding Integrado (onboarding)
```text
+----------------------------------------------------------+
|  [Logo XPLO]                                             |
|                                                          |
|  Onboarding - [Nome da Empresa]                          |
|  Etapa 1 de 5 - Produto                                  |
|  [==================------] 20%                          |
|                                                          |
|  +----------------------------------------------------+  |
|  | [Conteudo do wizard - mesmo do interno]            |  |
|  | Produto, ICPs, Dores, Mercado, Promessa            |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [Salvar e Sair]            [Proximo]                    |
|                                                          |
+----------------------------------------------------------+
```

---

## Logica de Transicao de Estados

```typescript
// No ClientRegister.tsx
const [pageState, setPageState] = useState<"form" | "choice" | "success" | "onboarding">("form");
const [createdClientId, setCreatedClientId] = useState<string | null>(null);

const handleSubmit = async () => {
  // ... salvar cliente no banco
  const { data: client } = await supabase
    .from("clients")
    .insert({ ... })
    .select()
    .single();
  
  setCreatedClientId(client.id);
  setPageState("choice"); // Vai para tela de escolha
};

const handleFinish = () => {
  setPageState("success"); // Finalizar por agora
};

const handleStartOnboarding = async () => {
  // Atualizar status para ppp_in_progress
  await supabase
    .from("clients")
    .update({ status: "ppp_in_progress" })
    .eq("id", createdClientId);
  
  setPageState("onboarding"); // Iniciar wizard
};
```

---

## Botao "Salvar e Sair" no Onboarding

Quando o cliente esta no wizard e precisa parar:
- Salva o progresso atual
- Gera um token de acesso automaticamente
- Mostra mensagem: "Seu progresso foi salvo. Voce recebera um link por email para continuar."
- Redireciona para tela de sucesso

---

## Link para Onboarding via Token (/onboarding/external/:token)

Para clientes que ja foram cadastrados e recebem o link depois:

```text
+----------------------------------------------------------+
|  [Logo XPLO]                                             |
|                                                          |
|  Onboarding - [Nome da Empresa]                          |
|  Etapa 1 de 5                                            |
|  [==================------] 20%                          |
|                                                          |
|  +----------------------------------------------------+  |
|  | [Wizard PPP - identico ao interno]                 |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [Salvar e Sair]            [Proximo]                    |
|                                                          |
+----------------------------------------------------------+
```

### Tela de Token Invalido
```text
+----------------------------------------------------------+
|  [Logo XPLO]                                             |
|                                                          |
|  [Icone Alerta]                                          |
|                                                          |
|  Link Invalido ou Expirado                               |
|                                                          |
|  Este link nao e mais valido.                            |
|  Entre em contato com nossa equipe para                  |
|  obter um novo link de acesso.                           |
|                                                          |
|  [WhatsApp: Falar com Suporte]                           |
|                                                          |
+----------------------------------------------------------+
```

---

## Aviso de Privacidade no Cadastro Interno

### Adicionar em ClientNew.tsx

```text
+----------------------------------------------------------+
|  [Icone Shield - Azul]                                   |
|  Privacidade dos Dados                                   |
|                                                          |
|  Os dados pessoais coletados (CNPJ, CPF, e-mail, etc)    |
|  serao utilizados exclusivamente para:                   |
|  - Elaboracao de contrato                                |
|  - Cadastro na plataforma de envio de boletos            |
+----------------------------------------------------------+
```

---

## Geracao de Link no ClientDetails.tsx

```text
+----------------------------------------------------------+
|  Onboarding X1                                           |
|  ...                                                     |
|                                                          |
|  Link para o Cliente                                     |
|  Envie este link para o cliente preencher o onboarding   |
|                                                          |
|  +----------------------------------------------------+  |
|  | https://...../onboarding/external/abc123  [Copiar] |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [Regenerar Link]  Expira em: 7 dias                     |
|                                                          |
+----------------------------------------------------------+
```

---

## Migracao do Banco de Dados

```sql
-- Criar enum para tipo de token
CREATE TYPE public.token_type AS ENUM ('onboarding');

-- Criar tabela de tokens
CREATE TABLE public.client_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  type token_type NOT NULL DEFAULT 'onboarding',
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indice para busca rapida por token
CREATE INDEX idx_client_tokens_token ON public.client_tokens(token);

-- RLS policies
ALTER TABLE public.client_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on client_tokens" ON public.client_tokens
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on client_tokens" ON public.client_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on client_tokens" ON public.client_tokens
  FOR UPDATE USING (true);
```

---

## Checklist de Implementacao

| Item | Descricao |
|------|-----------|
| Migracao | Criar tabela `client_tokens` |
| ClientRegister.tsx | Pagina publica com 4 estados (form, choice, success, onboarding) |
| OnboardingExternal.tsx | Wizard PPP via token |
| App.tsx | Adicionar rotas publicas |
| ClientDetails.tsx | Botao gerar/copiar link |
| ClientNew.tsx | Aviso sobre uso de dados |

---

## Resultado Esperado

1. **Cadastro Flexivel**: Cliente pode so cadastrar OU ja fazer o onboarding
2. **Experiencia Fluida**: Transicao suave entre cadastro e wizard
3. **Progresso Salvo**: "Salvar e Sair" gera link para continuar depois
4. **Transparencia**: Aviso claro sobre uso dos dados pessoais
5. **Links Exclusivos**: Token seguro para cada cliente

