// Template universal do processo operacional XPLO (baseado em Hospedagens).
// Cada tarefa tem `key` único usado para idempotência (template_key).
// `requiredPlan: "pro"` => só entra para clientes Pro.
// `requiredBonus: "..."` => só entra se o cliente tiver esse bônus marcado.

export type XploPlan = "basic" | "pro";
export type XploBonus = "google_my_business" | "instagram_showcase";

export interface XploTaskTemplate {
  key: string;
  subject: string;
  description: string;
  requiredPlan?: XploPlan;
  requiredBonus?: XploBonus;
}

export interface XploCheckpoint {
  code: string;        // "01" .. "05"
  label: string;
  tasks: XploTaskTemplate[];
}

export const XPLO_PROCESS_TEMPLATE: XploCheckpoint[] = [
  {
    code: "01",
    label: "Cadastro do cliente",
    tasks: [
      { key: "cad_grupo_wa", subject: "Criar grupo no WhatsApp", description: "Criar grupo com o cliente e equipe responsável pelo projeto." },
      { key: "cad_msg_inicial", subject: "Enviar mensagem inicial", description: "Boas-vindas ao cliente e apresentação do próximo passo." },
      { key: "cad_enviar_onboarding", subject: "Enviar onboarding", description: "Enviar link do Xplo Starter para coleta de dados e acessos." },
      { key: "cad_cadastrar_crm", subject: "Cadastrar no CRM", description: "Criar ficha do cliente no CRM com dados básicos e plano contratado." },
      { key: "cad_cadastrar_xplo_lab", subject: "Cadastrar no Xplo Lab", description: "Adicionar cliente ao ambiente interno de gestão de projetos." },
      { key: "cad_cadastrar_xplo_starter", subject: "Cadastrar no Xplo Starter", description: "Criar perfil no Xplo Starter para geração do doc de onboarding." },
      { key: "cad_assinar_contrato", subject: "Assinar contrato", description: "Enviar contrato para assinatura e confirmar recebimento." },
      { key: "cad_confirmar_boleto", subject: "Confirmar boleto", description: "Verificar pagamento ou emitir boletos com +2 dias de vencimento." },
    ],
  },
  {
    code: "02",
    label: "Início do projeto",
    tasks: [
      { key: "ini_enviar_onboarding_grupo", subject: "Enviar onboarding Xplo Starter no grupo", description: "Compartilhar o doc gerado pelo Xplo Starter no grupo do cliente." },
      { key: "ini_kickoff", subject: "Agendar reunião de kickoff", description: "Marcar horário para apresentar oferta, estratégia de anúncios e jornada de compra." },
      { key: "ini_material_grafico", subject: "Solicitar material gráfico", description: "Pedir fotos, vídeos e materiais visuais ao cliente." },
      { key: "ini_logomarca", subject: "Solicitar logomarca", description: "Solicitar logo em alta resolução, PNG com fundo transparente preferencial." },
      { key: "ini_onboarding_ia", subject: "Onboarding I.A", description: "Realizar onboarding 02 para configuração da inteligência artificial do cliente.", requiredPlan: "pro" },
    ],
  },
  {
    code: "03",
    label: "Estratégia de posicionamento",
    tasks: [
      { key: "est_insumos", subject: "Levantar insumos do onboarding inicial", description: "Coletar SWOT, ICP e oferta definidos no onboarding para basear a estratégia." },
      { key: "est_pontos_fortes", subject: "Mapear pontos fortes de identificação", description: "Identificar elementos fortes do local e da região: paisagem, arquitetura, clima, cultura e experiências." },
      { key: "est_posicionamento", subject: "Definir posicionamento ideal", description: "Criar a frase central que define como o negócio será percebido e vendido." },
      { key: "est_traducao_comunicacao", subject: "Traduzir posicionamento em comunicação", description: "Definir o que evitar e o que usar em posts, site, anúncios, bio e materiais." },
      { key: "est_design_system", subject: "Criar Design System da marca", description: "Definir paleta de cores, tipografia, identidade visual, atmosfera e estilo fotográfico." },
      { key: "est_foto_perfil", subject: "Planejar foto de perfil", description: "Definir foto marcante, máscara na cor principal com 50% de transparência e logomarca." },
      { key: "est_bio", subject: "Criar biografia estratégica", description: "Montar nome, tipo de negócio, ponto forte, localização, CTA e link do site." },
      { key: "est_destaques", subject: "Organizar destaques estratégicos", description: "Definir destaques principais do Instagram." },
      { key: "est_destaques_conteudo", subject: "Detalhar conteúdo dos destaques", description: "Especificar estrutura, ofertas, experiências, depoimentos e contato." },
      { key: "est_posts_fixados", subject: "Definir posts fixados", description: "Planejar 3 posts: desejo imediato, layout/lifestyle e prova social." },
      { key: "est_oferta_icp", subject: "Consolidar oferta e ICP", description: "Usar o onboarding para alinhar oferta, público ideal e argumentos comerciais." },
      { key: "est_musical", subject: "Definir direção musical da marca", description: "Selecionar 3 estilos musicais conectados com temperatura, localização, ICP e estética." },
      { key: "est_ensaio_foto", subject: "Criar direção para ensaio fotográfico", description: "Definir estilo, poses, cenários, cores, ângulos e situações para captação." },
      { key: "est_plano_conteudo", subject: "Criar plano inicial de conteúdo", description: "Definir pilares: Experiência & Lifestyle, Estrutura, Lazer, Reels e Stories." },
    ],
  },
  {
    code: "04",
    label: "Configuração de tráfego",
    tasks: [
      { key: "trf_pagina_facebook", subject: "Configurar página do Facebook", description: "Criar ou acessar a página do Facebook vinculada ao negócio." },
      { key: "trf_conectar_instagram", subject: "Conectar Instagram à página", description: "Vincular conta do Instagram à página do Facebook no Business Manager." },
      { key: "trf_conta_anuncios", subject: "Configurar conta de anúncios", description: "Criar ou acessar a conta de anúncios no Meta Ads e vincular ao BM da XPLO." },
      { key: "trf_conectar_wa_ads", subject: "Conectar WhatsApp à conta de anúncios", description: "Vincular o número de WhatsApp Business à conta de anúncios." },
      { key: "trf_wa_business", subject: "Configurar WhatsApp Business", description: "Configurar perfil e conectar na plataforma de automação." },
      { key: "trf_doc_anuncios", subject: "Criar documento de anúncios", description: "Escrever ângulos de dor e sonho para os criativos e enviar no grupo." },
      { key: "trf_criativos_video", subject: "Criar criativos — 3 vídeos", description: "Produzir 3 vídeos de anúncio com roteiros baseados nos ângulos aprovados." },
      { key: "trf_criativos_estatico", subject: "Criar criativos — 4 estáticos", description: "Produzir 4 artes estáticas para anúncios, feed e stories." },
      { key: "trf_fase_teste", subject: "Subir fase de teste", description: "4 anúncios: 2 vídeos + 2 estáticos, orçamento igual entre todos." },
      { key: "trf_lapidacao", subject: "Lapidação (7 dias)", description: "Retirar os 2–3 piores resultados, concentrar orçamento nos melhores e ajustar campanha." },
      { key: "trf_configurar_crm", subject: "Configurar CRM", description: "Configurar o CRM do cliente com campos e etapas da jornada de compra.", requiredPlan: "pro" },
      { key: "trf_conectar_wa_crm", subject: "Conectar WhatsApp ao CRM", description: "Integrar o número de WhatsApp Business ao CRM para gestão de leads.", requiredPlan: "pro" },
    ],
  },
  {
    code: "05",
    label: "Entrega de resultado",
    tasks: [
      { key: "ent_site_lovable", subject: "Criar site no Lovable", description: "Montar página de captura ou site institucional na plataforma Lovable." },
      { key: "ent_gmn", subject: "Configurar Google Meu Negócio", description: "Criar ou otimizar o perfil do negócio no Google Meu Negócio.", requiredBonus: "google_my_business" },
      { key: "ent_vitrine_ig", subject: "Montar vitrine do Instagram", description: "Criar os 9 posts iniciais: 3 vídeos + 6 imagens. Definir os 3 fixados.", requiredBonus: "instagram_showcase" },
      { key: "ent_post_fixado_1", subject: "Post fixado 1 — método/produto", description: "Vídeo explicando o diferencial e ponto forte do negócio.", requiredBonus: "instagram_showcase" },
      { key: "ent_post_fixado_2", subject: "Post fixado 2 — autoridade", description: "Vídeo de cliente falando sobre confiança e boa experiência.", requiredBonus: "instagram_showcase" },
      { key: "ent_post_fixado_3", subject: "Post fixado 3 — oferta", description: "Vídeo explicando como funciona para o cliente contratar.", requiredBonus: "instagram_showcase" },
      { key: "ent_ia_sdr", subject: "Configurar I.A (SDR 24/7)", description: "Ativar e treinar a IA para qualificação e follow-up automático de leads.", requiredPlan: "pro" },
    ],
  },
];

export function tasksForPlan(plan: XploPlan, bonuses: XploBonus[]) {
  const result: Array<XploTaskTemplate & { code: string; label: string }> = [];
  for (const cp of XPLO_PROCESS_TEMPLATE) {
    for (const t of cp.tasks) {
      if (t.requiredPlan === "pro" && plan !== "pro") continue;
      if (t.requiredBonus && !bonuses.includes(t.requiredBonus)) continue;
      result.push({ ...t, code: cp.code, label: cp.label });
    }
  }
  return result;
}

export const BONUS_LABELS: Record<XploBonus, string> = {
  google_my_business: "Google Meu Negócio",
  instagram_showcase: "Vitrine Instagram",
};
