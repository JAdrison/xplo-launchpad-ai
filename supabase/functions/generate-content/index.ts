import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AIConfig {
  source: "lovable" | "xplo" | "custom";
  provider: "gemini" | "openai";
  model: string;
  apiKey?: string;
}

// Tipos de tarefas estratégicas (cérebro) - usam GPT-5.2
const STRATEGIC_TASKS = [
  "generate-icps",
  "generate-pains", 
  "generate-buyer-pains",
  "generate-promise",
  "generate-swot",
  "generate-icp-document",
  "generate-offers-document",
  "generate-traffic-plan-document",
  "offer",
  "lp",
  "ads",
  "create-video-ad"
];

// ============================================================
// PROMPTS DO DOCUMENTO ICP — 1 por nicho
// ============================================================
const PROMPT_HOSPEDAGEM = `Você é um especialista em marketing para hospedagens do Brasil, treinado com a metodologia do Check-in Lotado — um método criado pela XPLO para ajudar donos de pousadas, chalés, casas de praia e apartamentos de temporada a lotar fins de semana comuns sem depender de feriados, sem baixar preço e sem depender de OTAs como Airbnb, Booking e Trivago.

O método parte de um diagnóstico central: a maioria das hospedagens só lota em feriado porque não tem método comercial — não porque falta demanda. Quem tem ICP definido, oferta clara, calendário planejado e campanha ativa vende qualquer final de semana.

---

SUA TAREFA

Você receberá os dados completos do onboarding de uma hospedagem (nome, localização, estrutura, diárias, SWOT, mercado e 3 blocos com perfis de clientes). Com base neles, gere um documento de ICP — Perfil do Cliente Ideal — formatado conforme o template abaixo.

REGRAS

- Linguagem simples, direta, sem jargão de marketing.
- Descrição humanizada: descreva o cliente ideal como se fosse uma pessoa real que você conhece.
- Use os dados reais do onboarding — não invente informações que não estão no contexto.
- Se algum campo do input estiver vazio ou genérico (ex: "teste"), use o senso comum de mercado de hospedagem para preencher de forma realista.
- Seja específico: evite descrições genéricas do tipo "pessoas que gostam de viajar". Detalhe comportamento, motivação e perfil.
- Priorize informações do Bloco 2 (cliente que quer atrair) sobre o Bloco 1 (quem recebe hoje). Use o Bloco 3 (quem evitar) para a seção "Quem não é seu cliente ideal".

---

DADOS DO ONBOARDING

[Nome da hospedagem]: {client_name}
[Tipo e localização]: {profile_type}, {profile_location}
[Estrutura]: {profile_units} unidades, {profile_comodidades}
[Diária média]: {profile_diaria}
[Diferenciais]: {profile_differentiators}
[Experiência oferecida]: {profile_experiencia}

[SWOT]
Pontos fortes do negócio: {swot_forcas_internas}
Pontos fracos do negócio: {swot_fraquezas_internas}
Pontos fortes da região: {swot_forcas_ambiente}
Pontos fracos da região: {swot_fraquezas_ambiente}

[Mercado]
Canais de demanda atuais: {market_demand_channels}
Concorrentes: {market_concorrentes}

[BLOCO 1 — Cliente que você mais recebe hoje]
{icp_bloco1}

[BLOCO 2 — Cliente que você quer atrair]
{icp_bloco2}

[BLOCO 3 — Cliente que você quer evitar]
{icp_bloco3}

---

TEMPLATE DE SAÍDA (siga EXATAMENTE este formato, incluindo emojis e títulos)

🎯 ICP DA [NOME DA HOSPEDAGEM]

👤 QUEM É SEU CLIENTE IDEAL
[Descrição em 3-4 linhas como se fosse uma pessoa real.]

📍 ORIGEM GEOGRÁFICA
[Cidade/região de onde vêm — isso define onde rodar os anúncios]

🎯 MOTIVAÇÃO PRINCIPAL
[O que move essa pessoa a reservar — descanso, romance, fuga, aventura...]

📱 COMPORTAMENTO DE COMPRA
[Como decide: antecipado ou última hora / Google ou Instagram / WhatsApp ou site direto]

💰 PERFIL DE TICKET
[Sensível a preço ou orientado por valor percebido]

🚫 QUEM NÃO É SEU CLIENTE IDEAL
[Perfil que não funciona — importante para não desperdiçar verba de anúncio]

✅ COMO USAR ESSE ICP
- Campanhas no Meta: segmente por localização ([cidade de origem]) + interesses ([motivação])
- Criativo do anúncio: fale diretamente com a dor e o desejo desse perfil
- Oferta: empacote a experiência que essa pessoa mais valoriza
- Atendimento: use a linguagem e o ritmo de quem decide [antecipado/rápido]

Retorne APENAS o documento formatado. Sem comentários antes ou depois.`;

const PROMPT_SAUDE = `Você é um especialista em marketing para clínicas e profissionais da saúde do Brasil, treinado com a metodologia da XPLO para ajudar médicos, dentistas, fisioterapeutas, psicólogos, nutricionistas e profissionais de estética a lotar a agenda com pacientes particulares qualificados — sem depender de convênio, sem baixar preço e sem ficar refém de indicação boca a boca.

O método parte de um diagnóstico central: a maioria dos profissionais de saúde vive agenda vazia porque não tem método comercial — não porque falta demanda. Quem tem ICP definido, posicionamento claro, presença digital ativa e campanha rodando lota a agenda.

---

SUA TAREFA

Você receberá os dados completos do onboarding de uma clínica ou profissional de saúde. Com base neles, gere um documento de ICP — Perfil do Paciente Ideal — formatado conforme o template abaixo.

REGRAS

- Linguagem simples, direta, sem jargão de marketing ou termos técnicos médicos desnecessários.
- Descrição humanizada: descreva o paciente ideal como se fosse uma pessoa real.
- Use os dados reais do onboarding — não invente.
- Se algum campo estiver vazio ou genérico, use o senso comum de mercado da área de saúde.
- Seja específico sobre comportamento de busca de tratamento, urgência, sensibilidade a preço e relação com convênio versus particular.
- Priorize o Bloco 2 (paciente que quer atrair) sobre o Bloco 1. Use o Bloco 3 para "Quem não é seu paciente ideal".

---

DADOS DO ONBOARDING

[Nome da clínica/profissional]: {client_name}
[Especialidade principal]: {profile_specialty}
[Localização]: {profile_location}
[Ticket médio]: {profile_ticket}
[Convênios aceitos]: {profile_convenios}
[Diferenciais]: {profile_differentiators}
[Tratamentos/procedimentos oferecidos]: {profile_treatments}
[Experiência do paciente]: {profile_experiencia}

[SWOT]
Pontos fortes do negócio: {swot_forcas_internas}
Pontos fracos do negócio: {swot_fraquezas_internas}
Oportunidades de mercado: {swot_forcas_ambiente}
Ameaças de mercado: {swot_fraquezas_ambiente}

[Mercado]
Canais de captação atuais: {market_demand_channels}
Concorrentes: {market_concorrentes}

[BLOCO 1 — Paciente que você mais atende hoje]
{icp_bloco1}

[BLOCO 2 — Paciente que você quer atrair]
{icp_bloco2}

[BLOCO 3 — Paciente que você quer evitar]
{icp_bloco3}

---

TEMPLATE DE SAÍDA (siga EXATAMENTE este formato, incluindo emojis e títulos)

🎯 ICP DA [NOME DA CLÍNICA / PROFISSIONAL]

👤 QUEM É SEU PACIENTE IDEAL
[Descrição em 3-4 linhas como se fosse uma pessoa real.]

📍 ORIGEM GEOGRÁFICA
[Cidade/bairros de onde vêm — define a área dos anúncios e o raio de atendimento]

🎯 MOTIVAÇÃO PRINCIPAL
[O que leva esse paciente a buscar atendimento — prevenção, dor, estética, saúde mental, acompanhamento contínuo]

📱 COMPORTAMENTO DE BUSCA
[Como pesquisa antes de agendar: Google / Instagram / Doctoralia / indicação / WhatsApp]

💰 PERFIL DE TICKET
[Convênio ou particular / sensível ou não a preço / valoriza resultado, urgência ou conveniência]

🚫 QUEM NÃO É SEU PACIENTE IDEAL
[Perfil que não funciona — importante para não desperdiçar verba de anúncio]

✅ COMO USAR ESSE ICP
- Campanhas no Meta: segmente por localização ([cidade/bairro]) + interesses ([motivação])
- Criativo do anúncio: fale diretamente com a dor e o desejo desse paciente
- Oferta: empacote o tratamento ou pacote que essa pessoa mais valoriza
- Atendimento: use a linguagem e o ritmo de quem decide [rápido/planejado]

Retorne APENAS o documento formatado. Sem comentários antes ou depois.`;

const PROMPT_GENERICO = `Você é um especialista em marketing digital no Brasil, treinado com a metodologia da XPLO para ajudar pequenos e médios negócios a construírem uma máquina de aquisição de clientes previsível — sem depender de marketplaces, sem baixar preço e sem depender de indicação.

O método parte de um diagnóstico central: a maioria dos negócios vende pouco porque não tem método comercial — não porque falta demanda. Quem tem ICP definido, oferta clara, canal de aquisição ativo e campanha rodando vende com previsibilidade.

---

SUA TAREFA

Você receberá os dados completos do onboarding de um negócio. Com base neles, gere um documento de ICP — Perfil do Cliente Ideal — formatado conforme o template abaixo.

REGRAS

- Linguagem simples, direta, sem jargão de marketing.
- Descrição humanizada: descreva o cliente ideal como se fosse uma pessoa real.
- Use os dados reais do onboarding — não invente.
- Se algum campo estiver vazio ou genérico, use o senso comum do nicho informado ({niche_label}).
- Adapte a linguagem ao tipo de negócio: B2B usa linguagem diferente de B2C; produto físico é diferente de serviço recorrente.
- Priorize o Bloco 2 sobre o Bloco 1. Use o Bloco 3 para "Quem não é seu cliente ideal".

---

DADOS DO ONBOARDING

[Nome do negócio]: {client_name}
[Nicho específico]: {niche_label}
[Produto/serviço principal]: {profile_product_name}
[Descrição]: {profile_product_description}
[Modelo de operação]: {profile_sales_model}
[Ticket médio]: {profile_ticket}
[Localização / área de atuação]: {profile_region}
[Diferenciais]: {profile_differentiators}
[Benefícios/resultados para o cliente]: {profile_benefits}

[SWOT]
Pontos fortes do negócio: {swot_forcas_internas}
Pontos fracos do negócio: {swot_fraquezas_internas}
Oportunidades externas: {swot_forcas_ambiente}
Ameaças externas: {swot_fraquezas_ambiente}

[Mercado]
Canais de aquisição atuais: {market_demand_channels}
Concorrentes: {market_concorrentes}

[BLOCO 1 — Cliente que você mais atende/vende hoje]
{icp_bloco1}

[BLOCO 2 — Cliente que você quer atrair]
{icp_bloco2}

[BLOCO 3 — Cliente que você quer evitar]
{icp_bloco3}

---

TEMPLATE DE SAÍDA (siga EXATAMENTE este formato, incluindo emojis e títulos)

🎯 ICP DE [NOME DO NEGÓCIO]

👤 QUEM É SEU CLIENTE IDEAL
[Descrição em 3-4 linhas como se fosse uma pessoa real.]

📍 ORIGEM GEOGRÁFICA
[Cidade/região de onde vêm. Para negócios online, define a geografia prioritária do targeting]

🎯 MOTIVAÇÃO PRINCIPAL
[O que leva esse cliente a buscar você — qual dor resolve, qual desejo realiza, qual transformação proporciona]

📱 COMPORTAMENTO DE COMPRA
[Como pesquisa e decide: antecipado ou impulso / Google ou redes sociais / compra direta ou consulta primeiro]

💰 PERFIL DE TICKET
[Sensível a preço ou orientado por valor percebido / compra recorrente ou pontual]

🚫 QUEM NÃO É SEU CLIENTE IDEAL
[Perfil que não funciona — importante para não desperdiçar verba de anúncio]

✅ COMO USAR ESSE ICP
- Campanhas no Meta: segmente por localização ([origem]) + interesses ([motivação])
- Criativo do anúncio: fale diretamente com a dor e o desejo desse perfil
- Oferta: empacote o produto/serviço do jeito que essa pessoa mais valoriza
- Atendimento: use a linguagem e o ritmo de quem decide [rápido/planejado]

Retorne APENAS o documento formatado. Sem comentários antes ou depois.`;

// ============================================================
// PROMPTS DO BANCO DE OFERTAS — 1 por nicho
// ============================================================
const OFFER_PROMPT_HOSPEDAGEM = `Você é um especialista em marketing para hospedagens do Brasil, treinado com a metodologia do Check-in Lotado — método da XPLO para ajudar donos de pousadas, chalés, casas de praia e apartamentos de temporada a lotar fins de semana comuns e dias de semana sem depender de feriados, sem baixar preço indiscriminadamente e sem depender de OTAs.

---

CONTEXTO DO MÉTODO

O Check-in Lotado ensina que oferta não é "temos disponibilidade". Oferta é quando você empacota a experiência com promessa clara, condição especial, escassez real e chamada para ação.

Para final de semana: a oferta compete com outras hospedagens — precisa de diferenciação e valor percebido alto, sem necessariamente reduzir o preço.

Para dias de semana: a demanda é naturalmente menor, então a oferta precisa criar um motivo. Aqui entra uma condição comercial estratégica — desconto ou benefício que justifique a saída em dia útil, sem destruir a percepção de valor da hospedagem.

---

SUA TAREFA

Você receberá os dados completos do onboarding de uma hospedagem. Com base neles, gere um BANCO DE OFERTAS com 3 ofertas para final de semana e 3 ofertas para dias de semana, seguindo os formatos abaixo.

REGRAS

- Linguagem simples, direta, sem jargão de marketing.
- Use os dados reais do onboarding — não invente comodidades ou experiências que não existem.
- Se algum campo estiver vazio ou genérico, use o senso comum de mercado de hospedagem para preencher de forma realista.
- Nomes das ofertas devem ser criativos, sensoriais e comunicar a experiência.
- Cada promessa deve em 1-2 linhas fazer o hóspede se imaginar vivendo aquilo.

---

DADOS DO ONBOARDING

[Nome da hospedagem]: {client_name}
[Tipo e localização]: {profile_type}, {profile_location}
[Estrutura]: {profile_units} unidades, {profile_comodidades}
[Diária média]: {profile_diaria}
[Diferenciais]: {profile_differentiators}
[Experiência oferecida]: {profile_experiencia}

[SWOT]
Pontos fortes: {swot_forcas_internas}
Pontos fracos: {swot_fraquezas_internas}
Oportunidades da região: {swot_forcas_ambiente}
Desafios da região: {swot_fraquezas_ambiente}

[Mercado]
Canais de demanda: {market_demand_channels}

[ICP — use para personalizar as ofertas]
{icp_generated_text}

---

PARTE 1 — BANCO DE OFERTAS PARA FINAL DE SEMANA

Gere 3 ofertas usando EXATAMENTE este formato para cada uma:

🗓️ BANCO DE OFERTAS — FINAL DE SEMANA

[OFERTA 1]
🏷️ NOME DA OFERTA
[Nome criativo que comunica a experiência]

✨ PROMESSA
[1-2 linhas sensoriais]

📦 O QUE INCLUI
[Diária + extras disponíveis na hospedagem]

💰 CONDIÇÃO COMERCIAL
[Para final de semana NÃO aplicar desconto na diária. Agregar valor.]

👤 PARA QUEM É
[Perfil do ICP que essa oferta atinge]

⏰ ESCASSEZ
[Limite real e específico]

---

[Repita para OFERTA 2 e OFERTA 3, variando o tipo de experiência — ex: uma para casais, uma para famílias, uma para grupos pequenos]

---

PARTE 2 — BANCO DE OFERTAS PARA DIAS DE SEMANA

Antes de gerar, escolha a condição comercial mais adequada usando estes CRITÉRIOS:

- Hospedagem premium + ICP pouco sensível a preço → "Compre 2 diárias e ganhe a 3ª"
- Hospedagem com ticket médio → 15% de desconto OU "compre 2 ganhe 1"
- Destino de baixa demanda na semana + ICP sensível a preço → 20% de desconto
- Hospedagem familiar ou para grupos → 10% de desconto com experiência incluída

🗓️ BANCO DE OFERTAS — DIAS DE SEMANA (segunda a quinta)

[Para cada uma das 3 ofertas, use o mesmo formato da Parte 1, mas com a condição comercial adequada ao perfil]

[EM CADA OFERTA, adicione após a CONDIÇÃO COMERCIAL uma linha:
🎯 POR QUE ESSA CONDIÇÃO: "Sugeri [X] porque [motivo ligado ao perfil da hospedagem]."]

---

FECHAMENTO

Após as 6 ofertas, adicione:

📋 COMO USAR ESSE BANCO

- Use uma oferta por vez nos seus anúncios — não rode todas ao mesmo tempo
- Combine escassez real com data específica
- No WhatsApp, abra a conversa com a promessa + o que inclui, depois apresente a condição
- Para Stories: pegue a promessa e transforme em uma frase única, sensorial

Retorne APENAS o documento formatado. Sem comentários antes ou depois.`;

const OFFER_PROMPT_SAUDE = `Você é um especialista em marketing para clínicas e profissionais da saúde do Brasil, treinado com a metodologia da XPLO para ajudar médicos, dentistas, fisioterapeutas, psicólogos, nutricionistas e profissionais de estética a lotar a agenda com pacientes particulares qualificados.

---

CONTEXTO DO MÉTODO

A XPLO ensina que oferta na saúde não é "marque sua consulta". Oferta é quando você empacota um resultado com promessa clara (o que o paciente vai ter), condição estratégica, escassez real (agenda limitada) e chamada para ação.

Para primeira consulta / avaliação / diagnóstico: a oferta precisa quebrar a barreira da primeira vinda — reduzir o atrito de decisão sem queimar o ticket.

Para tratamento contínuo / pacote / recorrência: a oferta precisa criar motivo para o paciente se comprometer com o plano completo em vez de sessões avulsas.

---

SUA TAREFA

Você receberá os dados completos do onboarding de uma clínica ou profissional de saúde. Com base neles, gere um BANCO DE OFERTAS com 3 ofertas de entrada e 3 ofertas de continuidade.

REGRAS

- Linguagem simples, direta, sem jargão médico desnecessário.
- Use os dados reais do onboarding — não invente tratamentos ou especialidades que não foram informados.
- Se algum campo estiver vazio ou genérico, use o senso comum da especialidade para preencher de forma realista.
- Nomes das ofertas devem ser claros e humanizados.
- Respeite as diretrizes éticas do CFM/conselhos: NÃO use termos como "garantia de resultado", "milagre", "antes e depois" chamativo, "melhor profissional", "único" ou promessas absolutas de cura. Use "acompanhamento completo", "abordagem personalizada", "plano individualizado".

---

DADOS DO ONBOARDING

[Nome da clínica/profissional]: {client_name}
[Especialidade principal]: {profile_specialty}
[Localização]: {profile_location}
[Ticket médio]: {profile_ticket}
[Convênios aceitos]: {profile_convenios}
[Diferenciais]: {profile_differentiators}
[Tratamentos/procedimentos oferecidos]: {profile_treatments}
[Experiência do paciente]: {profile_experiencia}

[SWOT]
Pontos fortes: {swot_forcas_internas}
Pontos fracos: {swot_fraquezas_internas}
Oportunidades de mercado: {swot_forcas_ambiente}
Ameaças de mercado: {swot_fraquezas_ambiente}

[Mercado]
Canais de captação: {market_demand_channels}

[ICP — use para personalizar as ofertas]
{icp_generated_text}

---

PARTE 1 — BANCO DE OFERTAS DE ENTRADA (Primeira consulta / Avaliação)

Gere 3 ofertas usando EXATAMENTE este formato para cada uma:

🩺 BANCO DE OFERTAS — ENTRADA / PRIMEIRA CONSULTA

[OFERTA 1]
🏷️ NOME DA OFERTA
✨ PROMESSA
[Foco no diagnóstico e plano de tratamento, NÃO em cura]
📦 O QUE INCLUI
💰 CONDIÇÃO COMERCIAL
[Valor promocional, bônus, ou condição de fechamento]
👤 PARA QUEM É
⏰ ESCASSEZ
[Vagas semanais reais, data limite ou janela de atendimento]

---

[Repita para OFERTA 2 e OFERTA 3, variando o tipo de entrada]

---

PARTE 2 — BANCO DE OFERTAS DE CONTINUIDADE (Pacotes e Tratamentos)

Antes de gerar, escolha a condição comercial mais adequada usando estes CRITÉRIOS:

- Ticket alto + ICP pouco sensível a preço + tratamento longo → "Plano completo com 10% de desconto + 1 sessão bônus"
- Ticket médio + ICP equilibrado → Pacote fechado com desconto de 15% vs sessão avulsa
- Tratamento recorrente → Plano de fidelidade / pacote de N sessões com condição especial
- Tratamento estético com resultado progressivo → Pacote "jornada completa" com 20% de desconto
- Público sensível a preço → Pacote com parcelamento facilitado

🩺 BANCO DE OFERTAS — CONTINUIDADE / PACOTES

[Para cada uma das 3 ofertas, use o mesmo formato da Parte 1, adaptado ao tratamento/pacote]

[EM CADA OFERTA, adicione após a CONDIÇÃO COMERCIAL uma linha:
🎯 POR QUE ESSA CONDIÇÃO: "Sugeri [X] porque [motivo ligado ao perfil do paciente e do tratamento]."]

---

FECHAMENTO

📋 COMO USAR ESSE BANCO

- Ofertas de entrada servem para anúncios de captação (Meta, Google)
- Ofertas de continuidade são para conversão dentro da consulta
- No Instagram, use as ofertas de entrada em stories e posts de pauta
- No WhatsApp pós-avaliação, apresente a oferta de continuidade com calma — explique o plano antes do preço
- Respeite sempre as diretrizes éticas do seu conselho

Retorne APENAS o documento formatado. Sem comentários antes ou depois.`;

const OFFER_PROMPT_GENERICO = `Você é um especialista em marketing digital no Brasil, treinado com a metodologia da XPLO para ajudar pequenos e médios negócios a construírem uma máquina de aquisição de clientes previsível.

---

CONTEXTO DO MÉTODO

A XPLO ensina que oferta não é "entre em contato". Oferta é quando você empacota a solução com promessa clara, condição estratégica (por que agora), escassez real (limite) e chamada para ação.

Para venda de entrada (primeira compra): a oferta precisa quebrar a barreira da decisão sem queimar a margem.

Para venda recorrente ou de alto valor: a oferta precisa criar motivo para o cliente se comprometer com o plano maior ou com a compra recorrente.

---

SUA TAREFA

Você receberá os dados completos do onboarding de um negócio. Com base neles, gere um BANCO DE OFERTAS com 3 ofertas de entrada e 3 ofertas de valor.

REGRAS

- Linguagem simples, direta, sem jargão de marketing.
- Use os dados reais do onboarding — não invente produtos, serviços ou diferenciais que não existem.
- Se algum campo estiver vazio ou genérico, use o senso comum do nicho informado ({niche_label}) para preencher de forma realista.
- Adapte a linguagem ao tipo de negócio: B2B vs B2C; produto físico vs serviço recorrente; curso vs consultoria.
- Nomes das ofertas devem ser criativos e comunicar o benefício central.

---

DADOS DO ONBOARDING

[Nome do negócio]: {client_name}
[Nicho específico]: {niche_label}
[Produto/serviço principal]: {profile_product_name}
[Descrição]: {profile_product_description}
[Modelo de operação]: {profile_sales_model}
[Ticket médio]: {profile_ticket}
[Localização / área de atuação]: {profile_region}
[Diferenciais]: {profile_differentiators}
[Benefícios/resultados para o cliente]: {profile_benefits}

[SWOT]
Pontos fortes: {swot_forcas_internas}
Pontos fracos: {swot_fraquezas_internas}
Oportunidades externas: {swot_forcas_ambiente}
Ameaças externas: {swot_fraquezas_ambiente}

[Mercado]
Canais de aquisição: {market_demand_channels}

[ICP — use para personalizar as ofertas]
{icp_generated_text}

---

PARTE 1 — BANCO DE OFERTAS DE ENTRADA (Primeira compra / Primeiro contato)

Gere 3 ofertas usando EXATAMENTE este formato para cada uma:

🎁 BANCO DE OFERTAS — ENTRADA / PRIMEIRA COMPRA

[OFERTA 1]
🏷️ NOME DA OFERTA
✨ PROMESSA
📦 O QUE INCLUI
💰 CONDIÇÃO COMERCIAL
[Valor de entrada reduzido, bônus, frete grátis, trial, ou condição de fechamento]
👤 PARA QUEM É
⏰ ESCASSEZ

---

[Repita para OFERTA 2 e OFERTA 3, variando o tipo de entrada]

---

PARTE 2 — BANCO DE OFERTAS DE VALOR (Recorrência / Pacote / Upsell)

Antes de gerar, escolha a condição comercial mais adequada usando estes CRITÉRIOS:

- Ticket alto + ICP pouco sensível a preço → "Plano completo com bônus exclusivo + desconto de 10%"
- Ticket médio + ICP equilibrado → Pacote fechado com 15% de desconto vs avulsas
- Negócio recorrente → Plano anual com 2 meses grátis OU fidelidade com benefícios progressivos
- Produto físico → "Compre 2 e leve 3" OU combo estratégico
- Curso / infoproduto → Pacote com mentorias extras + acesso vitalício a atualizações
- Público sensível a preço → Parcelamento facilitado + entrada reduzida

🎁 BANCO DE OFERTAS — VALOR / RECORRÊNCIA

[Para cada uma das 3 ofertas, use o mesmo formato da Parte 1, adaptado ao pacote/plano]

[EM CADA OFERTA, adicione após a CONDIÇÃO COMERCIAL uma linha:
🎯 POR QUE ESSA CONDIÇÃO: "Sugeri [X] porque [motivo ligado ao perfil do cliente e do negócio]."]

---

FECHAMENTO

📋 COMO USAR ESSE BANCO

- Ofertas de entrada servem para anúncios de captação (Meta, Google)
- Ofertas de valor são para conversão em upsell ou renovação
- No WhatsApp, comece pela promessa e pelo que inclui; apresente a condição depois
- Para Stories: transforme a promessa em uma frase única e forte
- Rode uma oferta por vez em cada canal — não sobreponha

Retorne APENAS o documento formatado. Sem comentários antes ou depois.`;

// ============================================================
// PROMPTS DO PLANO DE DEMANDA — 1 por nicho
// ============================================================
const TRAFFIC_PLAN_PROMPT_HOSPEDAGEM = `Você é um estrategista de tráfego pago, especialista em marketing para hospedagens do Brasil. Você foi treinado com a metodologia do Check-in Lotado — método da XPLO que ajuda hospedagens a lotar fins de semana sem depender de OTAs.

Você PENSA como estrategista, não como redator. Seu output é ACIONÁVEL — o dono da hospedagem precisa conseguir implementar o plano nos próximos 7 dias. Você é DIRETO. Cada palavra precisa justificar sua presença no documento.

---

PRINCÍPIOS NÃO-NEGOCIÁVEIS

- A ESTRATÉGIA PRINCIPAL é SEMPRE Meta Ads com 2 campanhas: 1 TESTE (5 criativos) + 1 REMARKETING.
- As outras estratégias (Google, Instagram orgânico, WhatsApp) são SUGESTÕES COMPLEMENTARES — cards curtos, nunca detalhadas ao nível da principal.
- Nada de parágrafos corridos longos. Use listas, bullets curtos, bold em métricas.
- Nada de jargão vazio. Seja concreto.
- Output final precisa caber em uma tela — não em 3 páginas de PDF.

---

DADOS DO ONBOARDING

[Nome]: {client_name}
[Tipo e localização]: {profile_data.type}, {profile_data.location}
[Diária média]: {profile_data.diaria}
[Diferenciais]: {profile_data.differentiators}
[Experiência]: {profile_data.experiencia}

[Mercado]
Canais atuais: {market.demand_channels}
Ocupação: {market.ocupacao}
Dificuldades: {market.dificuldade}
Investimento inicial: {financial.initial_traffic_investment}

[ICP]
{icp.generated_icp_text}

[OFERTAS GERADAS]
{offers.generated_text}

---

TEMPLATE DE SAÍDA (siga EXATAMENTE — sem acréscimos, sem supressões)

📊 PLANO DE DEMANDA — [NOME DA HOSPEDAGEM]

🎯 DIAGNÓSTICO
[3-4 linhas MÁXIMO. Problema real + oportunidade central + ângulo estratégico vencedor.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ESTRATÉGIA PRINCIPAL — META ADS
[70% do budget = R$ X,XX baseado em {financial.initial_traffic_investment}]

▸ CAMPANHA 1 — TESTE (60% dessa verba)

Objetivo: Mensagens no WhatsApp OU Conversões
Público: [1 público ÚNICO baseado no ICP — geo + interesse + faixa etária.]
Exclusões: [2–3 exclusões práticas.]

5 criativos para testar (1 ângulo por criativo):
1. [Ângulo + formato]
2. [...]
3. [...]
4. [...]
5. [...]

Oferta ancorada: [Nome da oferta do banco que faz mais sentido para tráfego frio]
CTA: [Único e direto]

▸ CAMPANHA 2 — REMARKETING (40% dessa verba)

Objetivo: Mensagens no WhatsApp
Público: [Lista concreta — engajamento IG 30d, visitantes site 14d, vídeo-views 50%+.]
Exclusões: [Quem já enviou mensagem nos últimos 7 dias.]

Ângulo: [Prova social ou urgência.]
3 criativos vencedores: [Top 3 CTR da Campanha 1 após 7 dias.]
Oferta ancorada: [Oferta com escassez]

📊 KPIs para validar a campanha
- CPL máximo: R$ X–Y
- Taxa de resposta no WhatsApp: Y%
- Taxa de conversão (lead → reserva): Y%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 ESTRATÉGIAS COMPLEMENTARES (sugestões — 30% do budget somadas)

🔍 GOOGLE ADS — Captura de intenção (15%)
[3 linhas MÁX.]

📱 INSTAGRAM ORGÂNICO — Prova viva (10%)
[3 linhas MÁX.]

💬 WHATSAPP — Motor de conversão (5%)
[3 linhas MÁX.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 CRONOGRAMA — 3 SEMANAS

SEMANA 1 — SETUP
[2–3 linhas.]

SEMANA 2 — TESTE
[2–3 linhas.]

SEMANA 3 — OTIMIZAÇÃO E ESCALA
[2–3 linhas.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ALERTAS ESTRATÉGICOS
[2–3 bullets CRÍTICOS baseados em SWOT/mercado.]

Retorne APENAS o documento formatado. Sem comentários antes ou depois. Sem introdução. Sem despedida.`;

const TRAFFIC_PLAN_PROMPT_SAUDE = `Você é um estrategista de tráfego pago, especialista em marketing para clínicas e profissionais da saúde do Brasil. Treinado com a metodologia da XPLO para ajudar médicos, dentistas, fisioterapeutas, psicólogos, nutricionistas e profissionais de estética a lotar a agenda com pacientes particulares qualificados.

Você PENSA como estrategista, não como redator. Output ACIONÁVEL para implementar nos próximos 7 dias. Você é DIRETO.

---

PRINCÍPIOS NÃO-NEGOCIÁVEIS

- ESTRATÉGIA PRINCIPAL é SEMPRE Meta Ads com 2 campanhas: 1 TESTE (5 criativos) + 1 REMARKETING.
- Google Search tem peso relevante em saúde — mas continua sendo SUGESTÃO complementar.
- RESPEITAR ética CFM/CRO/conselhos: nunca prometer cura, resultado garantido, "melhor profissional", antes/depois chamativo.
- Bullets curtos. Bold em métricas. Output em uma tela.

---

DADOS DO ONBOARDING

[Nome]: {client_name}
[Especialidade]: {profile_data.specialty}
[Localização]: {profile_data.location}
[Ticket médio]: {profile_data.ticket_medio}
[Tipo de atendimento]: {profile_data.attendance_types}
[Convênios]: {profile_data.convenios}
[Diferenciais]: {profile_data.differentiators}
[Tratamentos]: {profile_data.treatments}

[Mercado]
Canais atuais: {market.demand_channels}
Volume pacientes: {market.volume_pacientes}
Dificuldades: {market.dificuldade}
Investimento inicial: {financial.initial_traffic_investment}

[ICP]
{icp.generated_icp_text}

[OFERTAS GERADAS]
{offers.generated_text}

---

TEMPLATE DE SAÍDA (siga EXATAMENTE)

📊 PLANO DE DEMANDA — [NOME DA CLÍNICA / PROFISSIONAL]

🎯 DIAGNÓSTICO
[3-4 linhas MÁXIMO.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ESTRATÉGIA PRINCIPAL — META ADS
[70% do budget = R$ X,XX]

▸ CAMPANHA 1 — TESTE (60% dessa verba)

Objetivo: Mensagens no WhatsApp OU Formulário com qualificação
Público: [1 público ÚNICO — geo + interesse em dor/tratamento + faixa etária.]
Exclusões: [Profissionais da mesma área + pacientes já convertidos.]

5 criativos para testar:
1. [Ângulo + formato]
2. [...]
3. [...]
4. [...]
5. [...]

Oferta ancorada: [Oferta de ENTRADA do banco — primeira consulta/avaliação]
CTA: [Ex: "Agende pelo WhatsApp"]

▸ CAMPANHA 2 — REMARKETING (40% dessa verba)

Objetivo: Mensagens no WhatsApp
Público: [Engajamento IG 30d + visitantes site 14d + vídeo-views 50%+ + form aberto não enviado.]
Exclusões: [Quem já agendou nos últimos 30 dias.]

Ângulo: [Prova social profissional + urgência de agenda.]
3 criativos vencedores: [Top 3 CTR da Campanha 1.]
Oferta ancorada: [Entrada com urgência de agenda]

📊 KPIs
- CPL máximo: R$ X–Y
- Taxa de comparecimento: Y%+
- Taxa de conversão em pacote: Y%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 ESTRATÉGIAS COMPLEMENTARES (30% do budget somadas)

🔍 GOOGLE ADS — Captura de urgência (20%)
[3 linhas MÁX.]

📱 INSTAGRAM ORGÂNICO — Prova e autoridade (5%)
[3 linhas MÁX.]

💬 WHATSAPP — Fechamento (5%)
[3 linhas MÁX.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 CRONOGRAMA — 3 SEMANAS

SEMANA 1 — SETUP
[2–3 linhas.]

SEMANA 2 — TESTE
[2–3 linhas.]

SEMANA 3 — OTIMIZAÇÃO E ESCALA
[2–3 linhas.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ALERTAS ESTRATÉGICOS
[2–3 bullets CRÍTICOS — incluir alerta sobre ética CFM/CRO.]

Retorne APENAS o documento formatado. Sem comentários antes ou depois.`;

const TRAFFIC_PLAN_PROMPT_GENERICO = `Você é um estrategista de tráfego pago, especialista em marketing digital no Brasil. Treinado com a metodologia da XPLO para ajudar pequenos e médios negócios a construírem uma máquina de aquisição previsível.

Você PENSA como estrategista, não como redator. Output ACIONÁVEL nos próximos 7 dias. Você é DIRETO.

---

PRINCÍPIOS NÃO-NEGOCIÁVEIS

- ESTRATÉGIA PRINCIPAL é SEMPRE Meta Ads com 2 campanhas: 1 TESTE (5 criativos) + 1 REMARKETING.
- ADAPTE a linguagem ao tipo de negócio: B2B ≠ B2C, produto ≠ serviço.
- Estratégias complementares são SUGESTÕES CURTAS — nunca detalhadas ao nível da principal.
- Bullets curtos. Bold em métricas. Output em uma tela.

---

DADOS DO ONBOARDING

[Nome]: {client_name}
[Nicho]: {niche_label}
[Produto/serviço]: {profile_data.product_name}
[Modelo]: {profile_data.sales_model}
[Ticket]: {profile_data.average_ticket}
[Localização]: {profile_data.region}
[Diferenciais]: {profile_data.differentiators}
[Benefícios]: {profile_data.benefits}

[Mercado]
Canais atuais: {market.demand_channels}
Volume: {market.volume}
Dificuldades: {market.dificuldade}
Investimento inicial: {financial.initial_traffic_investment}

[ICP]
{icp.generated_icp_text}

[OFERTAS GERADAS]
{offers.generated_text}

---

TEMPLATE DE SAÍDA (siga EXATAMENTE)

📊 PLANO DE DEMANDA — [NOME DO NEGÓCIO]

🎯 DIAGNÓSTICO
[3-4 linhas MÁXIMO.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ESTRATÉGIA PRINCIPAL — META ADS
[70% do budget = R$ X,XX]

▸ CAMPANHA 1 — TESTE (60% dessa verba)

Objetivo: [Mensagens no WhatsApp / Formulário / Conversão no site — escolher o mais adequado]
Público: [1 público ÚNICO baseado no ICP.]
Exclusões: [2–3 exclusões práticas.]

5 criativos para testar:
1. [Adequar ao tipo de negócio]
2. [...]
3. [...]
4. [...]
5. [...]

Oferta ancorada: [Oferta de ENTRADA do banco]
CTA: [Único e direto]

▸ CAMPANHA 2 — REMARKETING (40% dessa verba)

Objetivo: [Canal de conversão]
Público: [Engajamento IG 30d + visitantes site 14d + vídeo-views 50%+.]
Exclusões: [Convertidos nos últimos 30 dias.]

Ângulo: [Prova social / urgência / reforço da oferta.]
3 criativos vencedores: [Top 3 CTR da Campanha 1.]
Oferta ancorada: [Oferta para público quente]

📊 KPIs
- CPL máximo: R$ X–Y
- Taxa de conversão: Y%
- CAC máximo: R$ X (se aplicável)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 ESTRATÉGIAS COMPLEMENTARES (30% do budget somadas)

[Escolher as 3 mais relevantes para o nicho.]

🔍 GOOGLE ADS — Captura de intenção ([X]%)
[3 linhas MÁX.]

📱 INSTAGRAM ORGÂNICO — Construção de autoridade ([X]%)
[3 linhas MÁX.]

💬 WHATSAPP / EMAIL — Conversão ([X]%)
[3 linhas MÁX.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 CRONOGRAMA — 3 SEMANAS

SEMANA 1 — SETUP
[2–3 linhas.]

SEMANA 2 — TESTE
[2–3 linhas.]

SEMANA 3 — OTIMIZAÇÃO E ESCALA
[2–3 linhas.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ALERTAS ESTRATÉGICOS
[2–3 bullets CRÍTICOS baseados no contexto do negócio.]

Retorne APENAS o documento formatado. Sem comentários antes ou depois.`;

function fmtVal(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.filter(Boolean).join(", ") : "—";
  if (typeof v === "object") {
    const entries = Object.entries(v).filter(([_, val]) => val !== null && val !== undefined && val !== "");
    if (!entries.length) return "—";
    return entries.map(([k, val]) => `${k}: ${fmtVal(val)}`).join(" • ");
  }
  return String(v);
}

function fmtBlock(data: any): string {
  if (!data || typeof data !== "object") return "—";
  const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== "");
  if (!entries.length) return "—";
  return entries.map(([k, v]) => `- ${k}: ${fmtVal(v)}`).join("\n");
}

function fmtCompetitors(c1: any, c2: any): string {
  const parts: string[] = [];
  if (c1?.name) parts.push(`${c1.name}${c1.reason ? ` (${c1.reason})` : ""}`);
  if (c2?.name) parts.push(`${c2.name}${c2.reason ? ` (${c2.reason})` : ""}`);
  return parts.length ? parts.join("; ") : "—";
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "—");
}

async function aiText(config: AIConfig, sys: string, usr: string, t = 0.7): Promise<string> {
  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;
  let isGeminiDirect = false;

  if (config.source === "custom" && config.apiKey) {
    if (config.provider === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
      headers = { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" };
      body = { model: config.model, messages: [{ role: "system", content: sys }, { role: "user", content: usr }], temperature: t };
    } else {
      isGeminiDirect = true;
      url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      headers = { "Content-Type": "application/json" };
      body = { contents: [{ parts: [{ text: `${sys}\n\n${usr}` }] }], generationConfig: { temperature: t } };
    }
  } else {
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("No LOVABLE_API_KEY configured");
    url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers = { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" };
    body = {
      model: config.model || "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      temperature: t,
    };
  }

  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!r.ok) {
    const st = r.status;
    const errorText = await r.text();
    console.error(`[AI Text] Error ${st}:`, errorText.substring(0, 500));
    throw { status: st, message: st === 429 ? "Rate limit exceeded" : st === 402 ? "Payment required" : `Error ${st}` };
  }
  const d = await r.json();
  const content = isGeminiDirect
    ? (d.candidates?.[0]?.content?.parts?.[0]?.text || "")
    : (d.choices?.[0]?.message?.content || "");
  if (!content) throw new Error("No AI content returned");
  return content.trim();
}

// Seleção automática de modelo baseada no tipo de tarefa
function selectModelForTask(type: string, aiConfig: AIConfig): AIConfig {
  // Se usuário escolheu API própria, respeita a escolha
  if (aiConfig.source === "custom") {
    return aiConfig;
  }
  
  // Se usuário escolheu Lovable padrão (modelo único), respeita
  if (aiConfig.source === "lovable") {
    return aiConfig;
  }
  
  // Arquitetura XPLO: seleção automática baseada no tipo de tarefa
  if (aiConfig.source === "xplo") {
    if (STRATEGIC_TASKS.includes(type)) {
      console.log(`[AI] XPLO Architecture: Using strategic model (GPT-5.2) for ${type}`);
      return {
        source: "lovable",
        provider: "openai",
        model: "openai/gpt-5.2"
      };
    } else {
      console.log(`[AI] XPLO Architecture: Using operational model (Gemini Flash) for ${type}`);
      return {
        source: "lovable",
        provider: "gemini",
        model: "google/gemini-3-flash-preview"
      };
    }
  }
  
  return aiConfig;
}

interface PPPData {
  profile: {
    product_name?: string | null;
    product_description?: string | null;
    differentiators?: string[] | null;
    benefits?: string[] | null;
    main_pain?: string | null;
    secondary_pain?: string | null;
    daily_impacts?: string[] | null;
    desire_1?: string | null;
    desire_2?: string | null;
    region?: string[] | null;
  } | null;
  icps: Array<{ id: string; name: string; profession?: string | null; age?: string | null; gender?: string | null; reason_needs_solution?: string | null; segment?: string | null; current_situation?: string | null; }>;
  pains: Array<{ icp_id: string; main_pain: string | null; secondary_pain?: string | null; daily_impacts: string[] | null; desire_1?: string | null; desire_2?: string | null; icps: { name: string } | null; }>;
  promise: { promise_text: string | null; } | null;
  niche?: string | null;
}

interface ReqBody {
  type: string; 
  clientId: string; 
  pppData?: PPPData; 
  icpId?: string; 
  offerId?: string; 
  field?: string; 
  lpVariant?: string;
  adId?: string; 
  adType?: string; 
  currentContent?: Record<string, unknown>; 
  instruction?: string;
  aiConfig?: AIConfig;
  bankOfferText?: string;
  bankOfferDocumentId?: string;
  bankOfferId?: string;
}

function buildCtx(p: PPPData): string {
  let s = '';
  if (p.niche) s += `Nicho: ${p.niche}\n`;
  if (p.profile?.product_name) s += `Produto: ${p.profile.product_name}\n`;
  if (p.profile?.product_description) s += `Descrição: ${p.profile.product_description}\n`;
  if (p.profile?.differentiators?.length) s += `Diferenciais: ${p.profile.differentiators.join(', ')}\n`;
  if (p.icps?.length) s += `ICPs: ${p.icps.map(i => i.name).join(', ')}\n`;
  if (p.promise?.promise_text) s += `Promessa: ${p.promise.promise_text}\n`;
  return s;
}

function extractJson(text: string): unknown {
  // Try code block first
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return JSON.parse(codeBlock[1]);
  // Try to find JSON object or array in text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return JSON.parse(jsonMatch[1]);
  // Last resort: try parsing as-is
  return JSON.parse(text);
}

function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    return JSON.stringify(value);
  }
  return '';
}

function extractVisualNotes(res: Record<string, unknown>): string {
  const notes: string[] = [];
  const fields = ['hook', 'problem', 'why_bad', 'solution', 'cta'];
  
  for (const f of fields) {
    if (typeof res[f] === 'object' && res[f] !== null) {
      const vn = (res[f] as Record<string, unknown>).visual_notes;
      if (vn) notes.push(`${f.toUpperCase()}: ${extractText(vn)}`);
    }
  }
  
  if (res.visual_notes) {
    notes.push(extractText(res.visual_notes));
  }
  
  return notes.join('\n\n') || '';
}

async function ai(config: AIConfig, sys: string, usr: string, t = 0.7) {
  const fullSys = `${sys}\n\nIMPORTANTE: Responda APENAS com JSON válido. Sem explicações, sem texto antes ou depois. Apenas o JSON puro.`;
  
  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;
  let isGeminiDirect = false;

  if (config.source === "custom" && config.apiKey) {
    if (config.provider === "openai") {
      // OpenAI API direta
      url = "https://api.openai.com/v1/chat/completions";
      headers = { 
        "Authorization": `Bearer ${config.apiKey}`, 
        "Content-Type": "application/json" 
      };
      body = {
        model: config.model,
        messages: [
          { role: "system", content: fullSys },
          { role: "user", content: usr }
        ],
        temperature: t,
        response_format: { type: "json_object" }
      };
      console.log(`[AI] Using custom OpenAI API with model: ${config.model}`);
    } else {
      // Google Gemini API direta
      isGeminiDirect = true;
      url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      headers = { "Content-Type": "application/json" };
      body = {
        contents: [{ parts: [{ text: `${fullSys}\n\n${usr}` }] }],
        generationConfig: { 
          temperature: t,
          responseMimeType: "application/json"
        }
      };
      console.log(`[AI] Using custom Gemini API with model: ${config.model}`);
    }
  } else {
    // Lovable AI Gateway (padrão)
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("No LOVABLE_API_KEY configured");
    
    url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers = { 
      "Authorization": `Bearer ${KEY}`, 
      "Content-Type": "application/json" 
    };
    body = {
      model: config.model || "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: fullSys },
        { role: "user", content: usr }
      ],
      temperature: t,
      response_format: { type: "json_object" }
    };
    console.log(`[AI] Using Lovable AI Gateway with model: ${config.model || "google/gemini-2.5-flash"}`);
  }

  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const st = r.status;
    const errorText = await r.text();
    console.error(`[AI] Error ${st}:`, errorText.substring(0, 500));
    throw { 
      status: st, 
      message: st === 429 ? "Rate limit exceeded" : st === 402 ? "Payment required" : st === 401 ? "Invalid API key" : `Error ${st}` 
    };
  }

  const d = await r.json();
  
  // Extrair conteúdo baseado no provedor
  let content: string;
  if (isGeminiDirect) {
    content = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    content = d.choices?.[0]?.message?.content || "";
  }
  
  if (!content) throw new Error("No AI content returned");
  
  console.log('[AI] Response length:', content.length);
  
  try {
    return extractJson(content);
  } catch (e) {
    console.error('[AI] Failed to parse JSON, raw content:', content.substring(0, 500));
    throw new Error('Invalid JSON from AI');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const b = await req.json() as ReqBody;
    const { type, clientId, pppData, icpId, offerId, field, lpVariant, aiConfig, bankOfferText, bankOfferDocumentId, bankOfferId } = b;
    console.log(`[generate-content] ${type} for ${clientId}`);
    
    // Usar config recebida ou padrão XPLO (arquitetura dual)
    const baseConfig: AIConfig = aiConfig || {
      source: "xplo",
      provider: "gemini", 
      model: "google/gemini-2.5-flash"
    };
    
    // Aplicar seleção automática de modelo baseada no tipo de tarefa
    const config = selectModelForTask(type, baseConfig);
    
    const ctx = pppData ? buildCtx(pppData) : '';
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (type === "refine-ad") {
      const { adType, currentContent: c, instruction } = b;
      if (!c || !instruction) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const p = adType === "video" ? `Refine vídeo:\nHOOK: ${c.hook}\nPROBLEMA: ${c.problem}\nPOR QUE: ${c.why_bad}\nSOLUÇÃO: ${c.solution}\nCTA: ${c.cta}\n\nInstrução: ${instruction}\nJSON: {"hook":"","problem":"","why_bad":"","solution":"","cta":"","duration":"","visual_notes":""}`
        : `Refine estático:\nHEADLINE: ${c.headline}\nSUBHEADLINE: ${c.subheadline}\nCOPY: ${c.body_text}\nCTA: ${c.cta}\n\nInstrução: ${instruction}\nJSON: {"headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}`;
      const res = await ai(config, 'Copywriter.', p);
      return new Response(JSON.stringify({ success: true, refinedContent: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === "refresh-field" && field && offerId) {
      const { data: o } = await supabase.from('offers_hormozi').select('*').eq('id', offerId).single();
      if (!o) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const res = await ai(config, 'Hormozi copywriter.', `${ctx}\nGere 2 opções para ${field}.\nJSON: {"options":["op1","op2"]}`, 0.8);
      const opts = res.options;
      const go = (o.generated_options as Record<string, string[]>) || {};
      go[field] = opts;
      const so = (o.selected_options as Record<string, number[]>) || {};
      so[field] = [0];
      await supabase.from('offers_hormozi').update({ generated_options: go, selected_options: so, [field]: opts[0] }).eq('id', offerId);
      return new Response(JSON.stringify({ success: true, options: opts }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let sys = '', prompt = '';
    if (type === "offer") {
      sys = `Você é um estrategista de marketing sênior especialista no método Hormozi ($100M Offers) e em geração de demanda via Facebook/Meta Ads. Sua função é criar ofertas irresistíveis E um plano completo e detalhado de geração de demanda. Cada campo deve ter conteúdo rico e detalhado (mínimo 2-3 frases por campo). O plano de demanda deve ser prático, específico para o nicho do cliente e pronto para implementação.`;
      prompt = `${ctx}

Crie uma oferta Hormozi completa com 2 opções por campo E um plano de geração de demanda DETALHADO e EXTENSO.

IMPORTANTE: Cada campo do plano de demanda deve ter conteúdo rico e detalhado. Não use respostas curtas de 1 linha. Escreva parágrafos completos com estratégias específicas para o nicho.

JSON com a seguinte estrutura EXATA:
{
  "options": {
    "promise": ["opção 1 detalhada", "opção 2 detalhada"],
    "unique_mechanism": ["opção 1 detalhada", "opção 2 detalhada"],
    "guarantee": ["opção 1 detalhada", "opção 2 detalhada"],
    "proof": ["opção 1 detalhada", "opção 2 detalhada"],
    "risk_reversal": ["opção 1 detalhada", "opção 2 detalhada"],
    "main_cta": ["opção 1 detalhada", "opção 2 detalhada"]
  },
  "value_stack": [
    {"name": "Item de valor 1", "perceived_value": "R$ X.XXX"},
    {"name": "Item de valor 2", "perceived_value": "R$ X.XXX"},
    {"name": "Item de valor 3", "perceived_value": "R$ X.XXX"}
  ],
  "demand_plan": {
    "context_analysis": {
      "niche": "Análise detalhada do nicho, tendências de mercado, oportunidades e ameaças (mínimo 3 frases)",
      "icp_profile": "Perfil comportamental completo do ICP: como consome conteúdo, onde busca soluções, gatilhos de compra, objeções principais (mínimo 3 frases)",
      "key_insight": "Insight estratégico principal que diferencia esta campanha - a grande sacada que vai fazer o público parar e prestar atenção (mínimo 2 frases)",
      "market_challenges": "Principais desafios e objeções do mercado que a campanha precisa superar (mínimo 2 frases)"
    },
    "primary_strategy": {
      "channel": "Facebook/Meta Ads",
      "campaign_type": "Tipo de campanha detalhado (ex: Conversão com otimização para leads qualificados via formulário nativo)",
      "audiences": [
        {"name": "Nome do público 1", "geo": "Região geográfica", "source": "Interesse/Lookalike/Custom", "exclusions": "Exclusões aplicadas"},
        {"name": "Nome do público 2", "geo": "Região geográfica", "source": "Interesse/Lookalike/Custom", "exclusions": "Exclusões aplicadas"},
        {"name": "Nome do público 3", "geo": "Região geográfica", "source": "Interesse/Lookalike/Custom", "exclusions": "Exclusões aplicadas"}
      ],
      "creative_types": ["Vídeo UGC", "Carrossel de dor", "Imagem estática com headline forte", "Vídeo depoimento"],
      "budget_percentage": 60,
      "expected_cpl": "R$ XX,XX - estimativa baseada no nicho",
      "kpis": ["CPA alvo", "ROAS esperado", "Taxa de conversão LP", "CTR mínimo"]
    },
    "complementary_strategies": [
      {
        "channel": "Instagram Orgânico",
        "role": "Descrição detalhada do papel deste canal na estratégia geral - como ele complementa os ads pagos (mínimo 2 frases)",
        "integration": "Como este canal se integra com o Facebook Ads - fluxo específico de retargeting e nutrição (mínimo 2 frases)",
        "budget_percentage": 15,
        "tactics": "Táticas específicas: tipos de conteúdo, frequência de postagem, formatos prioritários"
      },
      {
        "channel": "Google Ads (Search)",
        "role": "Papel de captura de demanda ativa - como capturar quem já está buscando a solução (mínimo 2 frases)",
        "integration": "Integração com Meta Ads para capturar leads que pesquisam após ver os anúncios (mínimo 2 frases)",
        "budget_percentage": 20,
        "tactics": "Palavras-chave principais, tipos de campanha, estratégia de lances"
      },
      {
        "channel": "Email Marketing / WhatsApp",
        "role": "Nutrição e conversão de leads capturados - como transformar leads frios em clientes (mínimo 2 frases)",
        "integration": "Sequência de follow-up automatizada pós-captura via ads (mínimo 2 frases)",
        "budget_percentage": 5,
        "tactics": "Sequência de emails, scripts de WhatsApp, automações"
      }
    ],
    "acquisition_funnel": {
      "tofu": {
        "objective": "Objetivo detalhado do topo de funil - gerar consciência e atrair público frio (mínimo 2 frases)",
        "channels": "Canais específicos utilizados nesta etapa",
        "message": "Tipo de mensagem e abordagem - foco em dor ou curiosidade (mínimo 2 frases)",
        "metrics": "Métricas de sucesso: CPM, alcance, frequência, CTR",
        "content_types": "Tipos de conteúdo: vídeos curtos, carrosséis educativos, posts de dor"
      },
      "mofu": {
        "objective": "Objetivo do meio de funil - nutrir e qualificar leads (mínimo 2 frases)",
        "channels": "Canais específicos utilizados nesta etapa",
        "message": "Mensagem focada em autoridade e prova social (mínimo 2 frases)",
        "metrics": "Métricas: taxa de engajamento, leads capturados, custo por lead",
        "content_types": "Tipos de conteúdo: cases, depoimentos, webinars, materiais ricos"
      },
      "bofu": {
        "objective": "Objetivo do fundo de funil - converter leads em clientes (mínimo 2 frases)",
        "channels": "Canais específicos utilizados nesta etapa",
        "message": "Mensagem com urgência, escassez e oferta direta (mínimo 2 frases)",
        "metrics": "Métricas: taxa de conversão, CPA, ROAS, ticket médio",
        "content_types": "Tipos de conteúdo: ofertas diretas, remarketing agressivo, comparativos"
      }
    },
    "channel_synergies": [
      "Sinergia 1: Descrição detalhada de como dois canais trabalham juntos para potencializar resultados (mínimo 2 frases)",
      "Sinergia 2: Descrição detalhada (mínimo 2 frases)",
      "Sinergia 3: Descrição detalhada (mínimo 2 frases)",
      "Sinergia 4: Descrição detalhada (mínimo 2 frases)"
    ],
    "implementation_timeline": {
      "week_1_2": "Semanas 1-2: Setup completo - criação de contas, pixels, públicos, criativos iniciais, configuração de automações. Detalhamento das ações dia a dia.",
      "week_3_4": "Semanas 3-4: Lançamento e otimização - início das campanhas, testes A/B de criativos e públicos, ajuste de lances e orçamentos. Análise dos primeiros dados.",
      "week_5_8": "Semanas 5-8: Escala e refinamento - escalar campanhas vencedoras, cortar perdedoras, expandir para novos públicos, implementar canais complementares. Meta de ROAS."
    }
  }
}`;
    } else if (type === "lp") {
      sys = `Copywriter LP ${lpVariant || 'direta'}.`;
      prompt = `${ctx}\nCrie LP.\nJSON: {"hero":{"headline":"","subheadline":"","cta_button":""},"problem_agitation":{"problems":[]},"solution":{},"benefits":[],"how_it_works":{"steps":[]},"social_proof":{"testimonials":[],"stats":[]},"guarantee":{},"value_stack":{"items":[]},"faq":[],"final_cta":{}}`;
    } else if (type === "generate-icps") {
      sys = 'Estrategista de perfis de clientes.';
      prompt = `Nicho: ${pppData?.niche}
Produto: ${pppData?.profile?.product_name}
Descrição: ${pppData?.profile?.product_description}
Dor principal: ${pppData?.profile?.main_pain}
Desejo: ${pppData?.profile?.desire_1}
Promessa: ${pppData?.promise?.promise_text || ''}

Gere 3 perfis de clientes que compram esse produto.

JSON: {"profiles":[{
  "name": "Nome do perfil (ex: Dono de empresa solar residencial)",
  "who_is": "Quem é, o que faz, como trabalha, como decide compras",
  "when_seeks": "Em que momento procura esse tipo de solução",
  "why_buys": "Motivo real pelo qual compra (preço, rapidez, confiança, etc)",
  "is_ideal": "ideal"
}]}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, profiles: res.profiles }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-pains") {
      sys = 'Mapeador dores.';
      prompt = `${ctx}\nPara cada ICP, identifique dores.\nJSON: {"pains":[{"icp_name":"","main_pain":"","secondary_pain":"","daily_impacts":[],"desire_1":"","desire_2":""}]}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, pains: res.pains }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-buyer-pains") {
      sys = 'Mapeador dores comprador.';
      prompt = `${ctx}\nIdentifique dores do comprador.\nJSON: {"pains":{"main_pain":"","secondary_pain":"","daily_impacts":[],"desire_1":"","desire_2":""}}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, pains: res.pains }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-promise") {
      sys = 'Copywriter Hormozi. Fórmula: [QUEM] consegue [DESEJO] em [PRAZO] sem [DOR].';
      prompt = `${ctx}\nCrie promessa.\nJSON: {"promise":""}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, promise: res.promise }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-swot") {
      // Buscar contexto do cliente (nicho + dados da Etapa 2)
      const niche = (b as any).niche as string | undefined;
      const { data: cli } = await supabase.from('clients').select('niche_type, niche_label, name').eq('id', clientId).maybeSingle();
      const { data: prof } = await supabase.from('client_profile').select('*').eq('client_id', clientId).maybeSingle();
      const effectiveNiche = niche || cli?.niche_type || 'generico';

      const profileData = (prof as any)?.profile_data || {};
      const ctxParts: string[] = [];
      ctxParts.push(`Negócio: ${cli?.name || 'cliente'}`);
      ctxParts.push(`Nicho: ${cli?.niche_label || effectiveNiche}`);
      if ((prof as any)?.region?.length) ctxParts.push(`Localização: ${(prof as any).region.join(', ')}`);
      if ((prof as any)?.differentiators?.length) ctxParts.push(`Diferenciais: ${(prof as any).differentiators.join(', ')}`);
      if ((prof as any)?.average_ticket) ctxParts.push(`Ticket médio: ${(prof as any).average_ticket}`);
      if ((prof as any)?.product_description) ctxParts.push(`Experiência/Descrição: ${(prof as any).product_description}`);
      if (profileData.type) ctxParts.push(`Tipo: ${profileData.type}`);
      if (profileData.units) ctxParts.push(`Unidades: ${profileData.units}`);
      if (profileData.specialty) ctxParts.push(`Especialidade: ${profileData.specialty}`);
      if (profileData.treatments?.length) ctxParts.push(`Tratamentos: ${profileData.treatments.join(', ')}`);
      if (profileData.products_list?.length) ctxParts.push(`Produtos: ${profileData.products_list.join(', ')}`);
      if (profileData.operation_model) ctxParts.push(`Modelo: ${profileData.operation_model}`);
      if (profileData.comodidades?.length) ctxParts.push(`Comodidades: ${profileData.comodidades.join(', ')}`);

      const swotCtx = ctxParts.join('\n');

      const examplesByNiche: Record<string, string> = {
        hospedagem: `Exemplos para HOSPEDAGEM:
- Forças internas: vista única, localização privilegiada, atendimento pessoal, café da manhã caseiro
- Fraquezas internas: fotos ruins, site desatualizado, poucas avaliações online, baixa presença em OTAs
- Forças do ambiente: crescimento do turismo regional, alta temporada, feriadões, novo aeroporto
- Fraquezas do ambiente: concorrência de Airbnb, baixa temporada, dependência de OTAs, sazonalidade`,
        saude: `Exemplos para ÁREA DA SAÚDE:
- Forças internas: formação sólida, equipamentos modernos, pacientes fiéis, atendimento humanizado
- Fraquezas internas: pouca presença no Instagram, agenda mal organizada, sem prontuário digital
- Forças do ambiente: aumento da demanda por saúde mental, bairro em expansão, novos planos de saúde
- Fraquezas do ambiente: muitos profissionais na mesma região, concorrência em preço, baixa indicação`,
        generico: `Exemplos para o nicho geral:
- Forças internas: qualidade do produto, entrega rápida, atendimento próximo, marca reconhecida
- Fraquezas internas: processo de venda desorganizado, estoque irregular, equipe pequena
- Forças do ambiente: crescimento do setor, mudança no comportamento do consumidor, marketplaces ativos
- Fraquezas do ambiente: concorrência grande, sazonalidade forte, instabilidade econômica`,
      };

      sys = `Você é um consultor estratégico brasileiro especialista em diagnóstico SWOT para pequenos negócios. Gere análises práticas, específicas e em linguagem simples (sem jargão corporativo). Cada item deve ser CURTO (3-6 palavras), concreto e útil. Adapte ao nicho informado.`;
      prompt = `Contexto do negócio:
${swotCtx}

${examplesByNiche[effectiveNiche] || examplesByNiche.generico}

Gere uma análise SWOT prática e específica para ESTE negócio. 
- 3 a 5 tags por quadrante (curtas, em linguagem simples)
- 1 frase de detalhamento por quadrante (até 200 caracteres)

JSON exato:
{
  "swot": {
    "forcas_internas": { "tags": ["tag1","tag2","tag3"], "text": "frase de detalhamento" },
    "fraquezas_internas": { "tags": ["tag1","tag2","tag3"], "text": "frase de detalhamento" },
    "forcas_ambiente": { "tags": ["tag1","tag2","tag3"], "text": "frase de detalhamento" },
    "fraquezas_ambiente": { "tags": ["tag1","tag2","tag3"], "text": "frase de detalhamento" }
  }
}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, swot: (res as any).swot }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-icp-document") {
      const documentId: string | undefined = b.documentId;
      const documentName: string | undefined = b.documentName;
      const variationHint: string | undefined = b.variationHint;

      // Buscar todos os dados necessários
      const [{ data: cli }, { data: prof }, { data: swotRow }, { data: icpRow }] = await Promise.all([
        supabase.from('clients').select('name, niche_type, niche_label').eq('id', clientId).maybeSingle(),
        supabase.from('client_profile').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_swot').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_icp').select('*').eq('client_id', clientId).maybeSingle(),
      ]);

      if (!cli) {
        return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const niche = (cli.niche_type as string) || 'generico';
      const profileData: Record<string, any> = ((prof as any)?.profile_data) || {};
      const marketData: Record<string, any> = ((prof as any)?.market_data) || {};

      const swotJoin = (tags: string[] | null | undefined, text: string | null | undefined) => {
        const t = (tags || []).filter(Boolean).join(", ");
        const parts = [t, text].filter(Boolean);
        return parts.length ? parts.join(" — ") : "—";
      };

      const vars: Record<string, string> = {
        client_name: cli.name || "—",
        niche_label: cli.niche_label || niche,
        // hospedagem
        profile_type: fmtVal(profileData.type || profileData.tipo),
        profile_location: fmtVal(profileData.location || profileData.localizacao || (prof as any)?.region),
        profile_units: fmtVal(profileData.units || profileData.unidades || profileData.rooms),
        profile_comodidades: fmtVal(profileData.comodidades || profileData.amenities),
        profile_diaria: fmtVal(profileData.diaria || profileData.daily_rate || (prof as any)?.average_ticket),
        profile_experiencia: fmtVal(profileData.experiencia || profileData.experience || (prof as any)?.product_description),
        // saude
        profile_specialty: fmtVal(profileData.specialty || profileData.especialidade),
        profile_ticket: fmtVal(profileData.ticket_medio || (prof as any)?.average_ticket),
        profile_convenios: fmtVal(profileData.convenios),
        profile_treatments: fmtVal(profileData.treatments || profileData.procedimentos),
        // generico
        profile_product_name: fmtVal((prof as any)?.product_name || profileData.product_name),
        profile_product_description: fmtVal((prof as any)?.product_description || profileData.product_description),
        profile_sales_model: fmtVal((prof as any)?.sales_model),
        profile_region: fmtVal((prof as any)?.region),
        profile_benefits: fmtVal((prof as any)?.benefits),
        // shared
        profile_differentiators: fmtVal((prof as any)?.differentiators),
        // swot
        swot_forcas_internas: swotJoin(swotRow?.forcas_internas_tags, swotRow?.forcas_internas_text),
        swot_fraquezas_internas: swotJoin(swotRow?.fraquezas_internas_tags, swotRow?.fraquezas_internas_text),
        swot_forcas_ambiente: swotJoin(swotRow?.forcas_ambiente_tags, swotRow?.forcas_ambiente_text),
        swot_fraquezas_ambiente: swotJoin(swotRow?.fraquezas_ambiente_tags, swotRow?.fraquezas_ambiente_text),
        // market
        market_demand_channels: fmtVal((prof as any)?.demand_channels),
        market_concorrentes: fmtCompetitors((prof as any)?.local_competitor_1, (prof as any)?.local_competitor_2),
        // icp blocos
        icp_bloco1: fmtBlock((icpRow as any)?.bloco1_data),
        icp_bloco2: fmtBlock((icpRow as any)?.bloco2_data),
        icp_bloco3: fmtBlock((icpRow as any)?.bloco3_data),
      };

      const template = niche === "hospedagem" ? PROMPT_HOSPEDAGEM
        : niche === "saude" ? PROMPT_SAUDE
        : PROMPT_GENERICO;

      let finalPrompt = interpolate(template, vars);

      // Se for um ICP adicional/variação, adicionar instrução para diferenciar
      if (variationHint || (documentName && documentName !== "ICP Principal")) {
        const hint = variationHint || `Foque este ICP em: "${documentName}". Gere um perfil diferente do ICP principal, explorando outro ângulo do público-alvo.`;
        finalPrompt += `\n\n---\n\nINSTRUÇÃO ADICIONAL — VARIAÇÃO DE ICP\n${hint}\n\nImportante: este é um ICP COMPLEMENTAR. Não repita o perfil do ICP principal. Explore um segmento, comportamento ou motivação diferente que também faça sentido para este negócio.`;
      }

      const generatedText = await aiText(config, "Você é um especialista em marketing digital brasileiro.", finalPrompt, 0.7);
      const nowIso = new Date().toISOString();

      // Atualiza documento existente OU cria um novo na nova tabela
      let savedId = documentId;
      if (documentId) {
        await supabase.from('client_icp_documents').update({
          generated_icp_text: generatedText,
          generated_by_ai: true,
          generated_at: nowIso,
          ...(documentName ? { name: documentName } : {}),
        }).eq('id', documentId);
      } else {
        // Calcular sort_order = max + 1
        const { data: existing } = await supabase
          .from('client_icp_documents')
          .select('sort_order')
          .eq('client_id', clientId)
          .order('sort_order', { ascending: false })
          .limit(1);
        const nextOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1;

        const { data: created } = await supabase.from('client_icp_documents').insert({
          client_id: clientId,
          name: documentName || (nextOrder === 0 ? "ICP Principal" : `ICP ${nextOrder + 1}`),
          generated_icp_text: generatedText,
          generated_by_ai: true,
          generated_at: nowIso,
          sort_order: nextOrder,
        }).select('id').maybeSingle();
        savedId = created?.id;
      }

      // Mantém compat: também atualiza o campo legacy em client_icp (primeiro doc)
      if (!documentId) {
        if (icpRow) {
          await supabase.from('client_icp').update({
            generated_icp_text: generatedText,
            generated_by_ai: true,
            generated_at: nowIso,
          }).eq('client_id', clientId);
        } else {
          await supabase.from('client_icp').insert({
            client_id: clientId,
            generated_icp_text: generatedText,
            generated_by_ai: true,
            generated_at: nowIso,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, text: generatedText, documentId: savedId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-offers-document") {
      const documentId: string | undefined = b.documentId;
      const documentName: string | undefined = b.documentName;
      const variationHint: string | undefined = b.variationHint;
      const regenerateOfferId: string | undefined = b.regenerateOfferId;
      const offerContext: { partLabel?: string; offerNumber?: number; currentText?: string; existingFullText?: string } | undefined = b.offerContext;

      // Buscar dados necessários
      const [{ data: cli }, { data: prof }, { data: swotRow }, { data: icpDocs }, { data: icpLegacy }] = await Promise.all([
        supabase.from('clients').select('name, niche_type, niche_label').eq('id', clientId).maybeSingle(),
        supabase.from('client_profile').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_swot').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_icp_documents').select('generated_icp_text, name, sort_order').eq('client_id', clientId).order('sort_order', { ascending: true }),
        supabase.from('client_icp').select('generated_icp_text').eq('client_id', clientId).maybeSingle(),
      ]);

      if (!cli) {
        return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Pré-requisito: ICP precisa existir
      const icpsList = (icpDocs || []).filter((d: any) => d?.generated_icp_text);
      const icpCombined = icpsList.length
        ? icpsList.map((d: any) => `### ${d.name}\n${d.generated_icp_text}`).join("\n\n---\n\n")
        : (icpLegacy?.generated_icp_text || "");

      if (!icpCombined) {
        return new Response(JSON.stringify({ error: 'ICP_REQUIRED', message: 'Gere primeiro o ICP — a oferta é personalizada por ele.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ===== Modo: regenerar UMA oferta específica =====
      if (regenerateOfferId && offerContext && documentId) {
        const partLabel = offerContext.partLabel || "Geral";
        const offerNum = offerContext.offerNumber || 1;
        const currentText = (offerContext.currentText || "").trim();
        const fullText = (offerContext.existingFullText || "").trim();

        const userInstruction: string = (b.userInstruction || "").trim();
        const singleSys = "Você é um especialista em marketing de oferta no Brasil. Reescreva APENAS o bloco de UMA oferta específica, mantendo rigorosamente o formato original.";
        const singlePrompt = `Abaixo está o BANCO DE OFERTAS atual deste cliente (para contexto):\n\n${fullText}\n\n---\n\nReescreva APENAS a [OFERTA ${offerNum}] da parte "${partLabel}". O bloco atual dessa oferta é:\n\n${currentText}\n\n---\n\nREGRAS OBRIGATÓRIAS:\n- Retorne SOMENTE o bloco da oferta, começando com a linha "[OFERTA ${offerNum}]" exatamente assim.\n- Mantenha o mesmo formato visual: 🏷️ NOME DA OFERTA, ✨ PROMESSA, 📦 O QUE INCLUI, 💰 CONDIÇÃO COMERCIAL, 👤 PARA QUEM É, ⏰ ESCASSEZ (use os mesmos emojis e títulos que aparecem nas outras ofertas).\n- ${userInstruction ? `INSTRUÇÃO DO USUÁRIO (PRIORITÁRIA — siga à risca): ${userInstruction}` : "Traga um ÂNGULO/OCASIÃO/PROPOSTA DIFERENTE da oferta atual e que não conflite com as outras ofertas do banco."}\n- Mantenha consistência de tom, nicho e ICP.\n- NÃO escreva nenhum texto antes ou depois do bloco. NÃO adicione explicações.`;

        const newBlock = await aiText(config, singleSys, singlePrompt, 0.8);

        return new Response(JSON.stringify({ success: true, offerBlock: newBlock.trim(), offerId: regenerateOfferId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const niche = (cli.niche_type as string) || 'generico';
      const profileData: Record<string, any> = ((prof as any)?.profile_data) || {};

      const swotJoin = (tags: string[] | null | undefined, text: string | null | undefined) => {
        const t = (tags || []).filter(Boolean).join(", ");
        const parts = [t, text].filter(Boolean);
        return parts.length ? parts.join(" — ") : "—";
      };

      const vars: Record<string, string> = {
        client_name: cli.name || "—",
        niche_label: cli.niche_label || niche,
        // hospedagem
        profile_type: fmtVal(profileData.type || profileData.tipo),
        profile_location: fmtVal(profileData.location || profileData.localizacao || (prof as any)?.region),
        profile_units: fmtVal(profileData.units || profileData.unidades || profileData.rooms),
        profile_comodidades: fmtVal(profileData.comodidades || profileData.amenities),
        profile_diaria: fmtVal(profileData.diaria || profileData.daily_rate || (prof as any)?.average_ticket),
        profile_experiencia: fmtVal(profileData.experiencia || profileData.experience || (prof as any)?.product_description),
        // saude
        profile_specialty: fmtVal(profileData.specialty || profileData.especialidade),
        profile_ticket: fmtVal(profileData.ticket_medio || (prof as any)?.average_ticket),
        profile_convenios: fmtVal(profileData.convenios),
        profile_treatments: fmtVal(profileData.treatments || profileData.procedimentos),
        // generico
        profile_product_name: fmtVal((prof as any)?.product_name || profileData.product_name),
        profile_product_description: fmtVal((prof as any)?.product_description || profileData.product_description),
        profile_sales_model: fmtVal((prof as any)?.sales_model),
        profile_region: fmtVal((prof as any)?.region),
        profile_benefits: fmtVal((prof as any)?.benefits),
        // shared
        profile_differentiators: fmtVal((prof as any)?.differentiators),
        // swot
        swot_forcas_internas: swotJoin(swotRow?.forcas_internas_tags, swotRow?.forcas_internas_text),
        swot_fraquezas_internas: swotJoin(swotRow?.fraquezas_internas_tags, swotRow?.fraquezas_internas_text),
        swot_forcas_ambiente: swotJoin(swotRow?.forcas_ambiente_tags, swotRow?.forcas_ambiente_text),
        swot_fraquezas_ambiente: swotJoin(swotRow?.fraquezas_ambiente_tags, swotRow?.fraquezas_ambiente_text),
        // market
        market_demand_channels: fmtVal((prof as any)?.demand_channels),
        // icp
        icp_generated_text: icpCombined,
      };

      const template = niche === "hospedagem" ? OFFER_PROMPT_HOSPEDAGEM
        : niche === "saude" ? OFFER_PROMPT_SAUDE
        : OFFER_PROMPT_GENERICO;

      let finalPrompt = interpolate(template, vars);

      // Variação opcional
      if (variationHint || (documentName && documentName !== "Banco de Ofertas")) {
        const hint = variationHint || `Foque este banco em: "${documentName}". Gere ofertas com ângulo diferente do banco principal.`;
        finalPrompt += `\n\n---\n\nINSTRUÇÃO ADICIONAL — VARIAÇÃO\n${hint}\n\nImportante: este é um banco COMPLEMENTAR. Não repita as ofertas do banco principal. Explore outro ângulo, segmento ou momento de campanha.`;
      }

      const generatedText = await aiText(config, "Você é um especialista em marketing de oferta no Brasil, focado em conversão real.", finalPrompt, 0.7);
      const nowIso = new Date().toISOString();

      let savedId = documentId;
      if (documentId) {
        await supabase.from('client_offer_documents').update({
          generated_text: generatedText,
          generated_by_ai: true,
          generated_at: nowIso,
          ...(documentName ? { name: documentName } : {}),
        }).eq('id', documentId);
      } else {
        const { data: existing } = await supabase
          .from('client_offer_documents')
          .select('sort_order')
          .eq('client_id', clientId)
          .order('sort_order', { ascending: false })
          .limit(1);
        const nextOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1;

        const { data: created } = await supabase.from('client_offer_documents').insert({
          client_id: clientId,
          name: documentName || (nextOrder === 0 ? "Banco de Ofertas" : `Banco de Ofertas ${nextOrder + 1}`),
          generated_text: generatedText,
          generated_by_ai: true,
          generated_at: nowIso,
          sort_order: nextOrder,
        }).select('id').maybeSingle();
        savedId = created?.id;
      }

      return new Response(JSON.stringify({ success: true, text: generatedText, documentId: savedId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-traffic-plan-document") {
      const documentId: string | undefined = b.documentId;
      const documentName: string | undefined = b.documentName;
      const userInstruction: string = (b.userInstruction || "").trim();

      const [{ data: cli }, { data: prof }, { data: swotRow }, { data: icpDocs }, { data: icpLegacy }, { data: offerDocs }] = await Promise.all([
        supabase.from('clients').select('name, niche_type, niche_label').eq('id', clientId).maybeSingle(),
        supabase.from('client_profile').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_swot').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_icp_documents').select('generated_icp_text, name, sort_order').eq('client_id', clientId).order('sort_order', { ascending: true }),
        supabase.from('client_icp').select('generated_icp_text').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_offer_documents').select('generated_text, name, sort_order').eq('client_id', clientId).order('sort_order', { ascending: true }),
      ]);

      if (!cli) {
        return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Pré-requisitos
      const icpsList = (icpDocs || []).filter((d: any) => d?.generated_icp_text);
      const icpCombined = icpsList.length
        ? icpsList.map((d: any) => `### ${d.name}\n${d.generated_icp_text}`).join("\n\n---\n\n")
        : (icpLegacy?.generated_icp_text || "");
      if (!icpCombined) {
        return new Response(JSON.stringify({ error: 'ICP_REQUIRED', message: 'Gere primeiro o ICP.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const offersList = (offerDocs || []).filter((d: any) => d?.generated_text);
      if (!offersList.length) {
        return new Response(JSON.stringify({ error: 'OFFERS_REQUIRED', message: 'Gere primeiro o Banco de Ofertas.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const offersCombined = offersList
        .map((d: any) => `### ${d.name}\n${d.generated_text}`)
        .join("\n\n---\n\n");

      const niche = (cli.niche_type as string) || 'generico';
      const profileData: Record<string, any> = ((prof as any)?.profile_data) || {};
      const marketData: Record<string, any> = ((prof as any)?.market_data) || {};

      const vars: Record<string, string> = {
        client_name: cli.name || "—",
        niche_label: cli.niche_label || niche,
        // hospedagem
        "profile_data.type": fmtVal(profileData.type || profileData.tipo),
        "profile_data.location": fmtVal(profileData.location || profileData.localizacao || (prof as any)?.region),
        "profile_data.diaria": fmtVal(profileData.diaria || profileData.daily_rate || (prof as any)?.average_ticket),
        "profile_data.differentiators": fmtVal((prof as any)?.differentiators),
        "profile_data.experiencia": fmtVal(profileData.experiencia || profileData.experience || (prof as any)?.product_description),
        // saude
        "profile_data.specialty": fmtVal(profileData.specialty || profileData.especialidade),
        "profile_data.ticket_medio": fmtVal(profileData.ticket_medio || (prof as any)?.average_ticket),
        "profile_data.attendance_types": fmtVal(profileData.attendance_types || profileData.tipos_atendimento),
        "profile_data.convenios": fmtVal(profileData.convenios),
        "profile_data.treatments": fmtVal(profileData.treatments || profileData.procedimentos),
        // generico
        "profile_data.product_name": fmtVal((prof as any)?.product_name || profileData.product_name),
        "profile_data.sales_model": fmtVal((prof as any)?.sales_model),
        "profile_data.average_ticket": fmtVal((prof as any)?.average_ticket),
        "profile_data.region": fmtVal((prof as any)?.region),
        "profile_data.benefits": fmtVal((prof as any)?.benefits),
        // market
        "market.demand_channels": fmtVal((prof as any)?.demand_channels),
        "market.ocupacao": fmtVal(marketData.ocupacao || marketData.occupation),
        "market.dificuldade": fmtVal(marketData.dificuldade || marketData.difficulty),
        "market.volume_pacientes": fmtVal(marketData.volume_pacientes || marketData.patient_volume),
        "market.volume": fmtVal(marketData.volume),
        // financial
        "financial.initial_traffic_investment": fmtVal((prof as any)?.initial_traffic_investment),
        // icp + offers
        "icp.generated_icp_text": icpCombined,
        "offers.generated_text": offersCombined,
      };

      const template = niche === "hospedagem" ? TRAFFIC_PLAN_PROMPT_HOSPEDAGEM
        : niche === "saude" ? TRAFFIC_PLAN_PROMPT_SAUDE
        : TRAFFIC_PLAN_PROMPT_GENERICO;

      // Interpolate dotted vars manually then fall through normal interpolate for {single_word}
      let finalPrompt = template;
      for (const [k, v] of Object.entries(vars)) {
        const re = new RegExp("\\{" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\}", "g");
        finalPrompt = finalPrompt.replace(re, v);
      }

      if (userInstruction) {
        finalPrompt += `\n\n---\n\nINSTRUÇÃO DO USUÁRIO (PRIORITÁRIA — siga à risca): ${userInstruction}`;
      }

      const generatedText = await aiText(
        config,
        "Você é um estrategista sênior de tráfego pago no Brasil. Escreva planos acionáveis, diretos e enxutos. Nunca acrescente comentários fora do template.",
        finalPrompt,
        0.7,
      );

      const nowIso = new Date().toISOString();
      let savedId = documentId;
      if (documentId) {
        await supabase.from('client_traffic_plan_documents').update({
          generated_text: generatedText,
          generated_by_ai: true,
          generated_at: nowIso,
          ...(documentName ? { name: documentName } : {}),
        }).eq('id', documentId);
      } else {
        const { data: existing } = await supabase
          .from('client_traffic_plan_documents')
          .select('sort_order')
          .eq('client_id', clientId)
          .order('sort_order', { ascending: false })
          .limit(1);
        const nextOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1;

        const { data: created } = await supabase.from('client_traffic_plan_documents').insert({
          client_id: clientId,
          name: documentName || (nextOrder === 0 ? "Plano de Demanda" : `Plano de Demanda ${nextOrder + 1}`),
          generated_text: generatedText,
          generated_by_ai: true,
          generated_at: nowIso,
          sort_order: nextOrder,
        }).select('id').maybeSingle();
        savedId = created?.id;
      }

      return new Response(JSON.stringify({ success: true, text: generatedText, documentId: savedId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "create-video-ad") {
      const { instruction } = b;
      if (!instruction || !clientId) {
        return new Response(JSON.stringify({ error: 'Missing instruction or clientId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Fetch client context
      const { data: profile } = await supabase.from('client_profile').select('*').eq('client_id', clientId).maybeSingle();
      const { data: promise } = await supabase.from('client_promise').select('*').eq('client_id', clientId).maybeSingle();
      const { data: client } = await supabase.from('clients').select('niche').eq('id', clientId).maybeSingle();
      
      // Build context
      let adCtx = '';
      if (client?.niche) adCtx += `Nicho: ${client.niche}\n`;
      if (profile?.product_name) adCtx += `Produto: ${profile.product_name}\n`;
      if (profile?.product_description) adCtx += `Descrição: ${profile.product_description}\n`;
      if (profile?.main_pain) adCtx += `Dor principal: ${profile.main_pain}\n`;
      if (profile?.desire_1) adCtx += `Desejo: ${profile.desire_1}\n`;
      if (promise?.promise_text) adCtx += `Promessa: ${promise.promise_text}\n`;
      
      const videoSys = 'Copywriter especialista em anúncios de vídeo para redes sociais. Estrutura: HOOK (captura atenção nos primeiros 3s), PROBLEMA (identifica a dor), POR QUE É RUIM (agita o problema), SOLUÇÃO (apresenta o produto), CTA (chamada para ação). Duração 20-60s.';
      const videoPrompt = `${adCtx}\n\nInstrução do usuário: ${instruction}\n\nIMPORTANTE: Retorne APENAS strings simples em cada campo, NÃO objetos.\nRetorne visual_notes como um único campo com todas as notas visuais combinadas.\n\nJSON (valores devem ser strings, não objetos):\n{\n  "video_type": "tipo do vídeo",\n  "duration": "duração em segundos",\n  "hook": "texto do hook",\n  "problem": "texto do problema",\n  "why_bad": "texto de por que é ruim",\n  "solution": "texto da solução",\n  "cta": "texto do CTA",\n  "visual_notes": "todas as notas visuais combinadas"\n}`;
      
      const videoRes = await ai(config, videoSys, videoPrompt, 0.8) as Record<string, unknown>;
      
      // Insert into database with text extraction for robustness
      const { data: newAd, error: insertError } = await supabase.from('ads').insert({
        client_id: clientId,
        asset_type: 'video_ad',
        video_type: extractText(videoRes.video_type) || 'Personalizado',
        video_hook: extractText(videoRes.hook),
        video_problem: extractText(videoRes.problem),
        video_why_bad: extractText(videoRes.why_bad),
        video_solution: extractText(videoRes.solution),
        video_cta: extractText(videoRes.cta),
        video_duration: extractText(videoRes.duration),
        video_visual_notes: extractVisualNotes(videoRes),
        headline: extractText(videoRes.video_type) || 'Anúncio Personalizado'
      }).select().single();
      
      if (insertError) throw insertError;
      
      return new Response(JSON.stringify({ success: true, ad: newAd }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "ads") {
      let oCtx = '', vOid: string | null = null;
      if (bankOfferText && bankOfferText.trim()) {
        // Novo fluxo: oferta vem do Banco de Ofertas (texto rico completo)
        vOid = null;
        oCtx = `OFERTA BASE (do Banco de Ofertas):\n${bankOfferText.trim()}`;
        console.log(`[generate-content] ads using bankOfferId=${bankOfferId} doc=${bankOfferDocumentId}`);
      } else if (offerId) {
        // Fluxo legado: tabela offers_hormozi
        const { data: o } = await supabase.from('offers_hormozi').select('*').eq('id', offerId).maybeSingle();
        if (o) { vOid = offerId; oCtx = `Oferta: ${o.promise || ''}`; }
      }
      const bp = pppData?.profile ? `Dor: ${pppData.profile.main_pain || ''}\nDesejos: ${pppData.profile.desire_1 || ''}\nRegião: ${pppData.profile.region?.join(', ') || ''}` : '';
      sys = `Ads expert brasileiro. Crie 6 anúncios de vídeo:
- 5 vídeos criativos com estilos variados (20-80s cada)
- 1 vídeo OBRIGATÓRIO tipo "question_box" (Caixinha de Perguntas)

IMPORTANTE SOBRE O FORMATO "CAIXINHA DE PERGUNTAS":
Este é um formato de ANÚNCIO ONLINE PAGO para Facebook/Meta Ads. NÃO é um story de Instagram.
O HOOK deve simular uma PERGUNTA REAL enviada por uma pessoa do público-alvo, como se alguém tivesse mandado essa dúvida numa caixinha de perguntas.
A pergunta deve ser:
- Escrita em PRIMEIRA PESSOA, linguagem coloquial e informal (como um comentário de WhatsApp ou rede social)
- Sobre um TEMA COTIDIANO que muitas pessoas do público-alvo realmente têm
- ESPONTÂNEA e SINCERA — NÃO pode parecer marketing disfarçado ou headline de vendas
Exemplos de BOAS perguntas de hook:
- "Minha conta de luz tá vindo absurda, alguém sabe se energia solar realmente compensa?"
- "Tô com uma dor nas costas há semanas, será que é coluna ou músculo?"
- "Meu filho não quer comer nada, alguém já passou por isso?"
- "Gente, meu cachorro não para de se coçar, será que é alergia?"
- "Alguém mais tem problema com infiltração no banheiro?"
Exemplos de perguntas RUINS (NUNCA usar):
- "Você sabia que nosso produto resolve seu problema?" (marketing disfarçado)
- "Quer economizar 50% na conta de luz?" (headline de vendas, não dúvida real)
- "Descubra como resolver X" (tom de anúncio, não de pessoa real)
As seções seguintes (Problema, Por que é Ruim, Solução, CTA) devem RESPONDER essa dúvida de forma natural, como se fosse um especialista respondendo a pergunta de um seguidor.

Cada vídeo: 5 seções (HOOK, PROBLEMA, POR QUE É RUIM, SOLUÇÃO, CTA).
+ 10 anúncios estáticos (5 baseados em dor, 5 baseados em desejo).`;
      prompt = `${ctx}\n${oCtx}\n${bp}

REGRAS DO 6º VÍDEO (question_box):
- video_type DEVE ser "question_box"
- O HOOK deve ser uma DÚVIDA REAL escrita em primeira pessoa, com linguagem coloquial e sincera, sobre um problema cotidiano do público-alvo
- NÃO pode ser uma pergunta retórica de vendas — deve parecer que uma pessoa real mandou essa dúvida
- O restante do roteiro responde essa dúvida naturalmente, guiando para o produto

JSON: {"video_scripts":[
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"question_box","title":"Caixinha de Perguntas","duration":"","hook":"[PERGUNTA DO COTIDIANO]","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""}
],"static_ads":{"pain_based":[{"angle":"pain","focus":"","headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}],"desire_based":[{"angle":"desire","focus":"","headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}]}}`;
      const res = await ai(config, sys, prompt);
      if (vOid) await supabase.from('ads').delete().eq('offer_id', vOid);
      else await supabase.from('ads').delete().eq('client_id', clientId).is('offer_id', null);
      for (const v of res.video_scripts || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'video_ad', video_type: v.video_type, video_hook: v.hook, video_problem: v.problem, video_why_bad: v.why_bad, video_solution: v.solution, video_cta: v.cta, video_duration: v.duration, video_visual_notes: v.visual_notes, ad_angle: v.video_type, headline: v.title });
      for (const a of res.static_ads?.pain_based || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'static_ad', angle: a.angle, focus: a.focus, headline: a.headline, subheadline: a.subheadline, body_text: a.body_text, eliminators: a.eliminators, cta: a.cta, visual_suggestion: a.visual_suggestion, ad_angle: `${a.angle}_${a.focus}` });
      for (const a of res.static_ads?.desire_based || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'static_ad', angle: a.angle, focus: a.focus, headline: a.headline, subheadline: a.subheadline, body_text: a.body_text, eliminators: a.eliminators, cta: a.cta, visual_suggestion: a.visual_suggestion, ad_angle: `${a.angle}_${a.focus}` });
      return new Response(JSON.stringify({ success: true, data: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await ai(config, sys, prompt);
    if (type === "offer") {
      const opts = res.options || {};
      const { data: ins, error } = await supabase.from('offers_hormozi').insert({
        client_id: clientId, icp_id: icpId || null, promise: opts.promise?.[0], unique_mechanism: opts.unique_mechanism?.[0],
        guarantee: opts.guarantee?.[0], proof: opts.proof?.[0], risk_reversal: opts.risk_reversal?.[0], main_cta: opts.main_cta?.[0],
        value_stack: res.value_stack, demand_generation_strategies: res.demand_plan, generated_options: opts,
        selected_options: { promise: [0], unique_mechanism: [0], guarantee: [0], proof: [0], risk_reversal: [0], main_cta: [0] },
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: res, offer: ins }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "lp") {
      await supabase.from('landing_pages').insert({ client_id: clientId, variant: lpVariant || "direct", sections: res });
    }
    return new Response(JSON.stringify({ success: true, data: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[generate-content] Error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Error' }), { status: e.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
