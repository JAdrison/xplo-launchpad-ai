-- 1. Helper: prazo em dias por checkpoint
CREATE OR REPLACE FUNCTION public.checkpoint_due_days(_chk text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _chk
    WHEN '01' THEN 3
    WHEN '02' THEN 5
    WHEN '03' THEN 10
    WHEN '04' THEN 10
    WHEN '05' THEN 7
    ELSE NULL
  END
$$;

-- 2. Atualizar seed_xplo_template_tasks para preencher scheduled_at
CREATE OR REPLACE FUNCTION public.seed_xplo_template_tasks(_deal_id uuid, _client_id uuid, _checkpoint text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan public.xplo_plan;
  v_bonuses public.xplo_bonus[];
  v_entered timestamptz;
  v_due_days int;
  v_scheduled timestamptz;
BEGIN
  SELECT xplo_plan, xplo_bonuses INTO v_plan, v_bonuses
  FROM public.clients WHERE id = _client_id;

  SELECT entered_current_column_at INTO v_entered
  FROM public.deals WHERE id = _deal_id;

  v_due_days := public.checkpoint_due_days(_checkpoint);
  IF v_due_days IS NOT NULL THEN
    v_scheduled := COALESCE(v_entered, now()) + (v_due_days || ' days')::interval;
  ELSE
    v_scheduled := NULL;
  END IF;

  INSERT INTO public.activities(
    deal_id, client_id, type, subject, description,
    checkpoint_code, checkpoint_label, template_key,
    required_plan, required_bonus, required_function,
    scheduled_at,
    status, auto_generated
  )
  SELECT _deal_id, _client_id, 'lembrete'::public.crm_activity_type,
         t.subject, t.description, _checkpoint, t.label, t.key,
         t.required_plan, t.required_bonus, t.required_function,
         v_scheduled,
         'pending'::public.crm_activity_status, true
  FROM (VALUES
    ('01','Cadastro do cliente','cad_grupo_wa','Criar grupo no WhatsApp','Criar grupo com o cliente e equipe responsável pelo projeto.',NULL::public.xplo_plan,NULL::public.xplo_bonus,'contato_cliente'::public.job_function),
    ('01','Cadastro do cliente','cad_msg_inicial','Enviar mensagem inicial','Boas-vindas ao cliente e apresentação do próximo passo.',NULL,NULL,'contato_cliente'),
    ('01','Cadastro do cliente','cad_enviar_onboarding','Enviar onboarding','Enviar link do Xplo Starter para coleta de dados e acessos.',NULL,NULL,'contato_cliente'),
    ('01','Cadastro do cliente','cad_cadastrar_crm','Cadastrar no CRM','Criar ficha do cliente no CRM com dados básicos e plano contratado.',NULL,NULL,'gestor_projetos'),
    ('01','Cadastro do cliente','cad_cadastrar_xplo_lab','Cadastrar no Xplo Lab','Adicionar cliente ao ambiente interno de gestão de projetos.',NULL,NULL,'gestor_projetos'),
    ('01','Cadastro do cliente','cad_cadastrar_xplo_starter','Cadastrar no Xplo Starter','Criar perfil no Xplo Starter para geração do doc de onboarding.',NULL,NULL,'gestor_projetos'),
    ('01','Cadastro do cliente','cad_assinar_contrato','Assinar contrato','Enviar contrato para assinatura e confirmar recebimento.',NULL,NULL,'contato_cliente'),
    ('01','Cadastro do cliente','cad_confirmar_boleto','Confirmar boleto','Verificar pagamento ou emitir boletos com +2 dias de vencimento.',NULL,NULL,'contato_cliente'),
    ('02','Início do projeto','ini_enviar_onboarding_grupo','Enviar onboarding Xplo Starter no grupo','Compartilhar o doc gerado pelo Xplo Starter no grupo do cliente.',NULL,NULL,'contato_cliente'),
    ('02','Início do projeto','ini_kickoff','Agendar reunião de kickoff','Marcar horário para apresentar oferta, estratégia de anúncios e jornada de compra.',NULL,NULL,'contato_cliente'),
    ('02','Início do projeto','ini_material_grafico','Solicitar material gráfico','Pedir fotos, vídeos e materiais visuais ao cliente.',NULL,NULL,'designer'),
    ('02','Início do projeto','ini_logomarca','Solicitar logomarca','Solicitar logo em alta resolução, PNG com fundo transparente preferencial.',NULL,NULL,'designer'),
    ('02','Início do projeto','ini_onboarding_ia','Onboarding I.A','Realizar onboarding 02 para configuração da inteligência artificial do cliente.','pro',NULL,'ia_specialist'),
    ('03','Estratégia de posicionamento','est_insumos','Levantar insumos do onboarding inicial','Coletar SWOT, ICP e oferta definidos no onboarding para basear a estratégia.',NULL,NULL,'gestor_projetos'),
    ('03','Estratégia de posicionamento','est_pontos_fortes','Mapear pontos fortes de identificação','Identificar elementos fortes do local e da região: paisagem, arquitetura, clima, cultura e experiências.',NULL,NULL,'gestor_projetos'),
    ('03','Estratégia de posicionamento','est_posicionamento','Definir posicionamento ideal','Criar a frase central que define como o negócio será percebido e vendido.',NULL,NULL,'copywriter'),
    ('03','Estratégia de posicionamento','est_traducao_comunicacao','Traduzir posicionamento em comunicação','Definir o que evitar e o que usar em posts, site, anúncios, bio e materiais.',NULL,NULL,'copywriter'),
    ('03','Estratégia de posicionamento','est_design_system','Criar Design System da marca','Definir paleta de cores, tipografia, identidade visual, atmosfera e estilo fotográfico.',NULL,NULL,'designer'),
    ('03','Estratégia de posicionamento','est_foto_perfil','Planejar foto de perfil','Definir foto marcante, máscara na cor principal com 50% de transparência e logomarca.',NULL,NULL,'designer'),
    ('03','Estratégia de posicionamento','est_bio','Criar biografia estratégica','Montar nome, tipo de negócio, ponto forte, localização, CTA e link do site.',NULL,NULL,'copywriter'),
    ('03','Estratégia de posicionamento','est_destaques','Organizar destaques estratégicos','Definir destaques principais do Instagram.',NULL,NULL,'designer'),
    ('03','Estratégia de posicionamento','est_destaques_conteudo','Detalhar conteúdo dos destaques','Especificar estrutura, ofertas, experiências, depoimentos e contato.',NULL,NULL,'copywriter'),
    ('03','Estratégia de posicionamento','est_posts_fixados','Definir posts fixados','Planejar 3 posts: desejo imediato, layout/lifestyle e prova social.',NULL,NULL,'copywriter'),
    ('03','Estratégia de posicionamento','est_oferta_icp','Consolidar oferta e ICP','Usar o onboarding para alinhar oferta, público ideal e argumentos comerciais.',NULL,NULL,'gestor_projetos'),
    ('03','Estratégia de posicionamento','est_musical','Definir direção musical da marca','Selecionar 3 estilos musicais conectados com temperatura, localização, ICP e estética.',NULL,NULL,'designer'),
    ('03','Estratégia de posicionamento','est_ensaio_foto','Criar direção para ensaio fotográfico','Definir estilo, poses, cenários, cores, ângulos e situações para captação.',NULL,NULL,'designer'),
    ('03','Estratégia de posicionamento','est_plano_conteudo','Criar plano inicial de conteúdo','Definir pilares: Experiência & Lifestyle, Estrutura, Lazer, Reels e Stories.',NULL,NULL,'copywriter'),
    ('04','Configuração de tráfego','trf_pagina_facebook','Configurar página do Facebook','Criar ou acessar a página do Facebook vinculada ao negócio.',NULL,NULL,'gestor_trafego'),
    ('04','Configuração de tráfego','trf_conectar_instagram','Conectar Instagram à página','Vincular conta do Instagram à página do Facebook no Business Manager.',NULL,NULL,'gestor_trafego'),
    ('04','Configuração de tráfego','trf_conta_anuncios','Configurar conta de anúncios','Criar ou acessar a conta de anúncios no Meta Ads e vincular ao BM da XPLO.',NULL,NULL,'gestor_trafego'),
    ('04','Configuração de tráfego','trf_conectar_wa_ads','Conectar WhatsApp à conta de anúncios','Vincular o número de WhatsApp Business à conta de anúncios.',NULL,NULL,'gestor_trafego'),
    ('04','Configuração de tráfego','trf_wa_business','Configurar WhatsApp Business','Configurar perfil e conectar na plataforma de automação.',NULL,NULL,'gestor_trafego'),
    ('04','Configuração de tráfego','trf_doc_anuncios','Criar documento de anúncios','Escrever ângulos de dor e sonho para os criativos e enviar no grupo.',NULL,NULL,'copywriter'),
    ('04','Configuração de tráfego','trf_criativos_video','Criar criativos — 3 vídeos','Produzir 3 vídeos de anúncio com roteiros baseados nos ângulos aprovados.',NULL,NULL,'designer'),
    ('04','Configuração de tráfego','trf_criativos_estatico','Criar criativos — 4 estáticos','Produzir 4 artes estáticas para anúncios, feed e stories.',NULL,NULL,'designer'),
    ('04','Configuração de tráfego','trf_fase_teste','Subir fase de teste','4 anúncios: 2 vídeos + 2 estáticos, orçamento igual entre todos.',NULL,NULL,'gestor_trafego'),
    ('04','Configuração de tráfego','trf_lapidacao','Lapidação (7 dias)','Retirar os 2–3 piores resultados, concentrar orçamento nos melhores e ajustar campanha.',NULL,NULL,'gestor_trafego'),
    ('04','Configuração de tráfego','trf_configurar_crm','Configurar CRM','Configurar o CRM do cliente com campos e etapas da jornada de compra.','pro',NULL,'gestor_projetos'),
    ('04','Configuração de tráfego','trf_conectar_wa_crm','Conectar WhatsApp ao CRM','Integrar o número de WhatsApp Business ao CRM para gestão de leads.','pro',NULL,'gestor_projetos'),
    ('05','Entrega de resultado','ent_site_lovable','Criar site no Lovable','Montar página de captura ou site institucional na plataforma Lovable.',NULL,NULL,'designer'),
    ('05','Entrega de resultado','ent_gmn','Configurar Google Meu Negócio','Criar ou otimizar o perfil do negócio no Google Meu Negócio.',NULL,'google_my_business'::public.xplo_bonus,'gestor_trafego'),
    ('05','Entrega de resultado','ent_vitrine_ig','Montar vitrine do Instagram','Criar os 9 posts iniciais: 3 vídeos + 6 imagens. Definir os 3 fixados.',NULL,'instagram_showcase'::public.xplo_bonus,'designer'),
    ('05','Entrega de resultado','ent_post_fixado_1','Post fixado 1 — método/produto','Vídeo explicando o diferencial e ponto forte do negócio.',NULL,'instagram_showcase'::public.xplo_bonus,'designer'),
    ('05','Entrega de resultado','ent_post_fixado_2','Post fixado 2 — autoridade','Vídeo de cliente falando sobre confiança e boa experiência.',NULL,'instagram_showcase'::public.xplo_bonus,'designer'),
    ('05','Entrega de resultado','ent_post_fixado_3','Post fixado 3 — oferta','Vídeo explicando como funciona para o cliente contratar.',NULL,'instagram_showcase'::public.xplo_bonus,'designer'),
    ('05','Entrega de resultado','ent_ia_sdr','Configurar I.A (SDR 24/7)','Ativar e treinar a IA para qualificação e follow-up automático de leads.','pro',NULL,'ia_specialist')
  ) AS t(code, label, key, subject, description, required_plan, required_bonus, required_function)
  WHERE t.code = _checkpoint
    AND (t.required_plan IS NULL OR t.required_plan = v_plan OR (t.required_plan = 'basic' AND v_plan = 'pro'))
    AND (t.required_bonus IS NULL OR t.required_bonus = ANY(COALESCE(v_bonuses, ARRAY[]::public.xplo_bonus[])))
    AND NOT EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.deal_id = _deal_id AND a.template_key = t.key
    );
END;
$function$;

-- 3. Backfill: tarefas pendentes sem scheduled_at
UPDATE public.activities a
SET scheduled_at = d.entered_current_column_at + (public.checkpoint_due_days(a.checkpoint_code) || ' days')::interval
FROM public.deals d
WHERE a.deal_id = d.id
  AND a.scheduled_at IS NULL
  AND a.status = 'pending'
  AND a.checkpoint_code IN ('01','02','03','04','05');

UPDATE public.activities
SET scheduled_at = created_at + (recurrence_days || ' days')::interval
WHERE scheduled_at IS NULL
  AND status = 'pending'
  AND recurrence_days IS NOT NULL;