
-- 1) Mover deals de colunas legadas para "01 Cadastro"
UPDATE public.deals
SET column_id = '22c78a39-8ea1-4ad1-93f8-32db2b464b1e'
WHERE column_id IN (
  '3b31e6fc-b0af-48e4-aa37-db4c021c9888', -- Onboarding
  '8ef9be6d-0f70-4e79-89d7-c5c535338c76', -- Contrato
  '83d9479c-4ad3-4afb-9d05-e635bb5c7c5e'  -- Em Execução
);

-- 2) Apagar colunas legadas
DELETE FROM public.pipeline_columns
WHERE id IN (
  '3b31e6fc-b0af-48e4-aa37-db4c021c9888',
  '8ef9be6d-0f70-4e79-89d7-c5c535338c76',
  '83d9479c-4ad3-4afb-9d05-e635bb5c7c5e'
);

-- 3) Função que semeia as tarefas do template XPLO de um checkpoint específico
CREATE OR REPLACE FUNCTION public.seed_xplo_template_tasks(
  _deal_id uuid,
  _client_id uuid,
  _checkpoint text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan public.xplo_plan;
  v_bonuses public.xplo_bonus[];
BEGIN
  SELECT xplo_plan, xplo_bonuses INTO v_plan, v_bonuses
  FROM public.clients WHERE id = _client_id;

  -- Insere todas as tarefas do checkpoint que ainda não existem
  INSERT INTO public.activities(
    deal_id, client_id, type, subject, description,
    checkpoint_code, checkpoint_label, template_key,
    required_plan, required_bonus, required_function,
    status, auto_generated
  )
  SELECT _deal_id, _client_id, 'lembrete'::public.crm_activity_type,
         t.subject, t.description, _checkpoint, t.label, t.key,
         t.required_plan, t.required_bonus, t.required_function,
         'pending'::public.crm_activity_status, true
  FROM (VALUES
    -- 01 Cadastro
    ('01','Cadastro do cliente','cad_grupo_wa','Criar grupo no WhatsApp','Criar grupo com o cliente e equipe responsável pelo projeto.',NULL::public.xplo_plan,NULL::public.xplo_bonus,'contato_cliente'::public.job_function),
    ('01','Cadastro do cliente','cad_msg_inicial','Enviar mensagem inicial','Boas-vindas ao cliente e apresentação do próximo passo.',NULL,NULL,'contato_cliente'),
    ('01','Cadastro do cliente','cad_enviar_onboarding','Enviar onboarding','Enviar link do Xplo Starter para coleta de dados e acessos.',NULL,NULL,'contato_cliente'),
    ('01','Cadastro do cliente','cad_cadastrar_crm','Cadastrar no CRM','Criar ficha do cliente no CRM com dados básicos e plano contratado.',NULL,NULL,'gestor_projetos'),
    ('01','Cadastro do cliente','cad_cadastrar_xplo_lab','Cadastrar no Xplo Lab','Adicionar cliente ao ambiente interno de gestão de projetos.',NULL,NULL,'gestor_projetos'),
    ('01','Cadastro do cliente','cad_cadastrar_xplo_starter','Cadastrar no Xplo Starter','Criar perfil no Xplo Starter para geração do doc de onboarding.',NULL,NULL,'gestor_projetos'),
    ('01','Cadastro do cliente','cad_assinar_contrato','Assinar contrato','Enviar contrato para assinatura e confirmar recebimento.',NULL,NULL,'contato_cliente'),
    ('01','Cadastro do cliente','cad_confirmar_boleto','Confirmar boleto','Verificar pagamento ou emitir boletos com +2 dias de vencimento.',NULL,NULL,'contato_cliente'),
    -- 02 Início
    ('02','Início do projeto','ini_enviar_onboarding_grupo','Enviar onboarding Xplo Starter no grupo','Compartilhar o doc gerado pelo Xplo Starter no grupo do cliente.',NULL,NULL,'contato_cliente'),
    ('02','Início do projeto','ini_kickoff','Agendar reunião de kickoff','Marcar horário para apresentar oferta, estratégia de anúncios e jornada de compra.',NULL,NULL,'contato_cliente'),
    ('02','Início do projeto','ini_material_grafico','Solicitar material gráfico','Pedir fotos, vídeos e materiais visuais ao cliente.',NULL,NULL,'designer'),
    ('02','Início do projeto','ini_logomarca','Solicitar logomarca','Solicitar logo em alta resolução, PNG com fundo transparente preferencial.',NULL,NULL,'designer'),
    ('02','Início do projeto','ini_onboarding_ia','Onboarding I.A','Realizar onboarding 02 para configuração da inteligência artificial do cliente.','pro',NULL,'ia_specialist'),
    -- 03 Estratégia
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
    -- 04 Tráfego
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
    -- 05 Entrega
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
$$;

-- 4) Trigger que dispara seed quando o deal entra numa coluna 01-05
CREATE OR REPLACE FUNCTION public.seed_tasks_on_checkpoint_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_chk text;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.column_id IS DISTINCT FROM OLD.column_id) THEN
    SELECT checkpoint_code INTO v_chk FROM public.pipeline_columns WHERE id = NEW.column_id;
    IF v_chk IN ('01','02','03','04','05') THEN
      PERFORM public.seed_xplo_template_tasks(NEW.id, NEW.client_id, v_chk);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_xplo_tasks ON public.deals;
CREATE TRIGGER trg_seed_xplo_tasks
  AFTER INSERT OR UPDATE OF column_id ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.seed_tasks_on_checkpoint_change();

-- 5) Backfill: semear tarefas do "01 Cadastro" para todos os deals que estão lá agora
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT d.id, d.client_id
    FROM public.deals d
    JOIN public.pipeline_columns pc ON pc.id = d.column_id
    WHERE pc.checkpoint_code = '01'
  LOOP
    PERFORM public.seed_xplo_template_tasks(r.id, r.client_id, '01');
  END LOOP;
END$$;
