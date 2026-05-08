# Integração Google Drive — Envio de PDFs

## Objetivo
Adicionar um botão **"Enviar para Drive"** ao lado dos botões de PDF já existentes nos documentos: **ICP, Banco de Ofertas, Plano de Demanda, Anúncios e Onboarding**. Cada PDF é salvo no **Drive da XPLO** (uma única conta Google conectada uma vez), dentro de uma **pasta numerada por cliente**, seguindo a sequência que você já usa hoje (`42 - Pousada Bela Vista`, `43 - Cliente Novo`, etc.).

## Estrutura no Drive
```
XPLO Starter/
├── 41 - Cliente Existente/      ← (já existe no seu Drive)
├── 42 - Pousada Bela Vista/     ← (próxima pasta criada automaticamente)
│   ├── ICP.pdf
│   ├── Banco-de-Ofertas.pdf
│   ├── Plano-de-Demanda-1.pdf
│   ├── Anuncios.pdf
│   └── Onboarding.pdf
├── 43 - Clínica Sorriso/
│   └── ...
```
- Pasta raiz fixa: `XPLO Starter` (criada automaticamente na 1ª vez se não existir).
- Subpasta com formato: `{numero} - {Nome do Cliente}`.
- Numeração detectada **automaticamente do Drive**: na primeira vez que um cliente é enviado, a função lista as pastas existentes em `XPLO Starter`, extrai o maior número via regex `^(\d+)\s*-\s*` e usa **maior + 1**.
- Arquivos com mesmo nome são **substituídos** (mantém o link, atualiza o conteúdo).

## O que vai mudar

### 1. Conexão Google Drive
Conectar o connector **Google Drive** uma única vez (fluxo do Lovable abre janela pra logar com a conta Google da XPLO). Os secrets `LOVABLE_API_KEY` e `GOOGLE_DRIVE_API_KEY` ficam disponíveis nas edge functions.

### 2. Tabela `client_drive_folders`
Cache do mapeamento cliente → pasta no Drive (evita listar tudo a cada envio):
- `client_id`, `drive_folder_id`, `drive_folder_name`, `client_number`, `drive_folder_url`, `created_at`.
- RLS: somente `has_crm_access` lê/escreve (mesmo padrão das outras tabelas).

### 3. Edge Function `upload-to-drive`
Recebe `{ clientId, fileName, pdfBase64 }` e faz:
1. Garante a pasta raiz `XPLO Starter` (busca, cria se não existir).
2. Busca a pasta do cliente em `client_drive_folders`. Se não tiver:
   - Lista pastas dentro de `XPLO Starter` no Drive.
   - Extrai o maior número existente (`^(\d+)\s*-\s*`).
   - Cria pasta `{maiorNumero + 1} - {NomeDoCliente}`.
   - Salva no `client_drive_folders`.
3. Procura arquivo com o mesmo nome dentro da pasta — se existir, **atualiza** (mesma URL); senão, **cria** (multipart upload).
4. Retorna `{ fileId, webViewLink, folderName }`.

Tudo via gateway: `https://connector-gateway.lovable.dev/google_drive/...`

### 4. Componente `<SendToDriveButton />`
Botão compartilhado:
- Gera o PDF localmente reutilizando o `react-to-pdf` já presente nos cards.
- Captura o blob → converte pra base64.
- Chama a edge function.
- Toast com link "Abrir no Drive" + nome da pasta criada (ex: `Salvo em "42 - Pousada Bela Vista"`).

### 5. Onde o botão será adicionado
- `TrafficPlanCard.tsx` — ao lado do PDF de cada plano.
- `OfferBancoCard.tsx` — ao lado do PDF do banco de ofertas.
- `ICPDocumentCard.tsx` — ao lado do PDF do ICP.
- `GeneratedAssetsSection.tsx` — no export de anúncios.
- Tela de Onboarding — no export do PDF completo.

## Detalhes técnicos
- Recomenda-se conectar o Drive da conta dedicada da agência (ex: `xplolabcreator@gmail.com`) — assim a pasta `XPLO Starter` já é a que você usa hoje.
- Se a pasta `XPLO Starter` já existir no seu Drive com as 41 pastas, a função vai detectá-las naturalmente e criar a próxima como `42 - ...`.
- Upload via `uploadType=multipart`, sobrescrita via `PATCH /upload/drive/v3/files/{fileId}?uploadType=media`.
- Numeração é **monotonica**: nunca reutiliza número de pasta deletada (o sistema sempre pega `max + 1`).

## Fora do escopo desta entrega
- Compartilhamento automático da pasta com o e-mail do cliente.
- Renumeração de clientes existentes.
- Sincronização bidirecional (Drive → app).

## Pré-requisito
Conectar o Google Drive da conta XPLO via connector Lovable — faço isso no primeiro passo da implementação, vai abrir uma janela pra você autorizar no Google.
