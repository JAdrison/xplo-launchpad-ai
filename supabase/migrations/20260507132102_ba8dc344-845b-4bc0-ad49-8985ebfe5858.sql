
-- 1. Tabela editável de templates de tarefas XPLO
CREATE TABLE public.xplo_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_code text NOT NULL,
  checkpoint_label text NOT NULL,
  template_key text NOT NULL UNIQUE,
  subject text NOT NULL,
  description text,
  required_plan public.xplo_plan,
  required_bonus public.xplo_bonus,
  required_function public.job_function,
  recurrence_days int,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  activity_type public.crm_activity_type NOT NULL DEFAULT 'lembrete',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_xplo_task_templates_checkpoint ON public.xplo_task_templates(checkpoint_code, sort_order);

ALTER TABLE public.xplo_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xplo_templates_select" ON public.xplo_task_templates
  FOR SELECT TO authenticated
  USING (public.has_crm_access(auth.uid()));

CREATE POLICY "xplo_templates_insert" ON public.xplo_task_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "xplo_templates_update" ON public.xplo_task_templates
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "xplo_templates_delete" ON public.xplo_task_templates
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_xplo_task_templates_updated_at
  BEFORE UPDATE ON public.xplo_task_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed inicial: 01-05 (do seed_xplo_template_tasks) + 06 manutenção
INSERT INTO public.xplo_task_templates (checkpoint_code, checkpoint_label, template_key, subject, description, required_plan, required_bonus, required_function, recurrence_days, sort_order, activity_type)
VALUES
  -- Checkpoint 01
  ('01','Cadastro do cliente','cad_grupo_wa','Criar grupo no WhatsApp','Criar grupo com o cliente e equipe responsável pelo projeto.',NULL,NULL,'contato_cliente',NULL,1,'lembrete'),
  ('01','Cadastro do cliente','cad_msg_inicial','Enviar mensagem inicial','Boas-vindas ao cliente e apresentação do próximo passo.',NULL,NULL,'contato_cliente',NULL,2,'lembrete'),
  ('01','Cadastro do cliente','cad_enviar_onboarding','Enviar onboarding','Enviar link do Xplo Starter para coleta de dados e acessos.',NULL,NULL,'contato_cliente',NULL,3,'lembrete'),
  ('01','Cadastro do cliente','cad_cadastrar_crm','Cadastrar no CRM','Criar ficha do cliente no CRM com dados básicos e plano contratado.',NULL,NULL,'gestor_projetos',NULL,4,'lembrete'),
  ('01','Cadastro do cliente','cad_cadastrar_xplo_lab','Cadastrar no Xplo Lab','Adicionar cliente ao ambiente interno de gestão de projetos.',NULL,NULL,'gestor_projetos',NULL,5,'lembrete'),
  ('01','Cadastro do cliente','cad_cadastrar_xplo_starter','Cadastrar no Xplo Starter','Criar perfil no Xplo Starter para geração do doc de onboarding.',NULL,NULL,'gestor_projetos',NULL,6,'lembrete'),
  ('01','Cadastro do cliente','cad_assinar_contrato','Assinar contrato','Enviar contrato para assinatura e confirmar recebimento.',NULL,NULL,'contato_cliente',NULL,7,'lembrete'),
  ('01','Cadastro do cliente','cad_confirmar_boleto','Confirmar boleto','Verificar pagamento ou emitir boletos com +2 dias de vencimento.',NULL,NULL,'contato_cliente',NULL,8,'lembrete'),
  -- Checkpoint 02
  ('02','Início do projeto','ini_enviar_onboarding_grupo','Enviar onboarding Xplo Starter no grupo','Compartilhar o doc gerado pelo Xplo Starter no grupo do cliente.',NULL,NULL,'contato_cliente',NULL,1,'lembrete'),
  ('02','Início do projeto','ini_kickoff','Agendar reunião de kickoff','Marcar horário para apresentar oferta, estratégia de anúncios e jornada de compra.',NULL,NULL,'contato_cliente',NULL,2,'lembrete'),
  ('02','Início do projeto','ini_material_grafico','Solicitar material gráfico','Pedir fotos, vídeos e materiais visuais ao cliente.',NULL,NULL,'designer',NULL,3,'lembrete'),
  ('02','Início do projeto','ini_logomarca','Solicitar logomarca','Solicitar logo em alta resolução, PNG com fundo transparente preferencial.',NULL,NULL,'designer',NULL,4,'lembrete'),
  ('02','Início do projeto','ini_onboarding_ia','Onboarding I.A','Realizar onboarding 02 para configuração da inteligência artificial do cliente.','pro',NULL,'ia_specialist',NULL,5,'lembrete'),
  -- Checkpoint 03
  ('03','Estratégia de posicionamento','est_insumos','Levantar insumos do onboarding inicial','Coletar SWOT, ICP e oferta definidos no onboarding para basear a estratégia.',NULL,NULL,'gestor_projetos',NULL,1,'lembrete'),
  ('03','Estratégia de posicionamento','est_pontos_fortes','Mapear pontos fortes de identificação','Identificar elementos fortes do local e da região: paisagem, arquitetura, clima, cultura e experiências.',NULL,NULL,'gestor_projetos',NULL,2,'lembrete'),
  ('03','Estratégia de posicionamento','est_posicionamento','Definir posicionamento ideal','Criar a frase central que define como o negócio será percebido e vendido.',NULL,NULL,'copywriter',NULL,3,'lembrete'),
  ('03','Estratégia de posicionamento','est_traducao_comunicacao','Traduzir posicionamento em comunicação','Definir o que evitar e o que usar em posts, site, anúncios, bio e materiais.',NULL,NULL,'copywriter',NULL,4,'lembrete'),
  ('03','Estratégia de posicionamento','est_design_system','Criar Design System da marca','Definir paleta de cores, tipografia, identidade visual, atmosfera e estilo fotográfico.',NULL,NULL,'designer',NULL,5,'lembrete'),
  ('03','Estratégia de posicionamento','est_foto_perfil','Planejar foto de perfil','Definir foto marcante, máscara na cor principal com 50% de transparência e logomarca.',NULL,NULL,'designer',NULL,6,'lembrete'),
  ('03','Estratégia de posicionamento','est_bio','Criar biografia estratégica','Montar nome, tipo de negócio, ponto forte, localização, CTA e link do site.',NULL,NULL,'copywriter',NULL,7,'lembrete'),
  ('03','Estratégia de posicionamento','est_destaques','Organizar destaques estratégicos','Definir destaques principais do Instagram.',NULL,NULL,'designer',NULL,8,'lembrete'),
  ('03','Estratégia de posicionamento','est_destaques_conteudo','Detalhar conteúdo dos destaques','Especificar estrutura, ofertas, experiências, depoimentos e contato.',NULL,NULL,'copywriter',NULL,9,'lembrete'),
  ('03','Estratégia de posicionamento','est_posts_fixados','Definir posts fixados','Planejar 3 posts: desejo imediato, layout/lifestyle e prova social.',NULL,NULL,'copywriter',NULL,10,'lembrete'),
  ('03','Estratégia de posicionamento','est_oferta_icp','Consolidar oferta e ICP','Usar o onboarding para alinhar oferta, público ideal e argumentos comerciais.',NULL,NULL,'gestor_projetos',NULL,11,'lembrete'),
  ('03','Estratégia de posicionamento','est_musical','Definir direção musical da marca','Selecionar 3 estilos musicais conectados com temperatura, localização, ICP e estética.',NULL,NULL,'designer',NULL,12,'lembrete'),
  ('03','Estratégia de posicionamento','est_ensaio_foto','Criar direção para ensaio fotográfico','Definir estilo, poses, cenários, cores, ângulos e situações para captação.',NULL,NULL,'designer',NULL,13,'lembrete'),
  ('03','Estratégia de posicionamento','est_plano_conteudo','Criar plano inicial de conteúdo','Definir pilares: Experiência & Lifestyle, Estrutura, Lazer, Reels e Stories.',NULL,NULL,'copywriter',NULL,14,'lembrete'),
  -- Checkpoint 04
  ('04','Configuração de tráfego','trf_pagina_facebook','Configurar página do Facebook','Criar ou acessar a página do Facebook vinculada ao negócio.',NULL,NULL,'gestor_trafego',NULL,1,'lembrete'),
  ('04','Configuração de tráfego','trf_conectar_instagram','Conectar Instagram à página','Vincular conta do Instagram à página do Facebook no Business Manager.',NULL,NULL,'gestor_trafego',NULL,2,'lembrete'),
  ('04','Configuração de tráfego','trf_conta_anuncios','Configurar conta de anúncios','Criar ou acessar a conta de anúncios no Meta Ads e vincular ao BM da XPLO.',NULL,NULL,'gestor_trafego',NULL,3,'lembrete'),
  ('04','Configuração de tráfego','trf_conectar_wa_ads','Conectar WhatsApp à conta de anúncios','Vincular o número de WhatsApp Business à conta de anúncios.',NULL,NULL,'gestor_trafego',NULL,4,'lembrete'),
  ('04','Configuração de tráfego','trf_wa_business','Configurar WhatsApp Business','Configurar perfil e conectar na plataforma de automação.',NULL,NULL,'gestor_trafego',NULL,5,'lembrete'),
  ('04','Configuração de tráfego','trf_doc_anuncios','Criar documento de anúncios','Escrever ângulos de dor e sonho para os criativos e enviar no grupo.',NULL,NULL,'copywriter',NULL,6,'lembrete'),
  ('04','Configuração de tráfego','trf_criativos_video','Criar criativos — 3 vídeos','Produzir 3 vídeos de anúncio com roteiros baseados nos ângulos aprovados.',NULL,NULL,'designer',NULL,7,'lembrete'),
  ('04','Configuração de tráfego','trf_criativos_estatico','Criar criativos — 4 estáticos','Produzir 4 artes estáticas para anúncios, feed e stories.',NULL,NULL,'designer',NULL,8,'lembrete'),
  ('04','Configuração de tráfego','trf_fase_teste','Subir fase de teste','4 anúncios: 2 vídeos + 2 estáticos, orçamento igual entre todos.',NULL,NULL,'gestor_trafego',NULL,9,'lembrete'),
  ('04','Configuração de tráfego','trf_lapidacao','Lapidação (7 dias)','Retirar os 2–3 piores resultados, concentrar orçamento nos melhores e ajustar campanha.',NULL,NULL,'gestor_trafego',NULL,10,'lembrete'),
  ('04','Configuração de tráfego','trf_configurar_crm','Configurar CRM','Configurar o CRM do cliente com campos e etapas da jornada de compra.','pro',NULL,'gestor_projetos',NULL,11,'lembrete'),
  ('04','Configuração de tráfego','trf_conectar_wa_crm','Conectar WhatsApp ao CRM','Integrar o número de WhatsApp Business ao CRM para gestão de leads.','pro',NULL,'gestor_projetos',NULL,12,'lembrete'),
  -- Checkpoint 05
  ('05','Entrega de resultado','ent_site_lovable','Criar site no Lovable','Montar página de captura ou site institucional na plataforma Lovable.',NULL,NULL,'designer',NULL,1,'lembrete'),
  ('05','Entrega de resultado','ent_gmn','Configurar Google Meu Negócio','Criar ou otimizar o perfil do negócio no Google Meu Negócio.',NULL,'google_my_business','gestor_trafego',NULL,2,'lembrete'),
  ('05','Entrega de resultado','ent_vitrine_ig','Montar vitrine do Instagram','Criar os 9 posts iniciais: 3 vídeos + 6 imagens. Definir os 3 fixados.',NULL,'instagram_showcase','designer',NULL,3,'lembrete'),
  ('05','Entrega de resultado','ent_post_fixado_1','Post fixado 1 — método/produto','Vídeo explicando o diferencial e ponto forte do negócio.',NULL,'instagram_showcase','designer',NULL,4,'lembrete'),
  ('05','Entrega de resultado','ent_post_fixado_2','Post fixado 2 — autoridade','Vídeo de cliente falando sobre confiança e boa experiência.',NULL,'instagram_showcase','designer',NULL,5,'lembrete'),
  ('05','Entrega de resultado','ent_post_fixado_3','Post fixado 3 — oferta','Vídeo explicando como funciona para o cliente contratar.',NULL,'instagram_showcase','designer',NULL,6,'lembrete'),
  ('05','Entrega de resultado','ent_ia_sdr','Configurar I.A (SDR 24/7)','Ativar e treinar a IA para qualificação e follow-up automático de leads.','pro',NULL,'ia_specialist',NULL,7,'lembrete'),
  -- Checkpoint 06 manutenção
  ('06','Manutenção','maint_ig_30d','Programar 30 dias de Instagram','Feed: 2 vídeos curtos e 6 estáticos. Stories: 8 (pode repetir conteúdos de meses anteriores).',NULL,NULL,NULL,30,1,'lembrete'),
  ('06','Manutenção','maint_trf_verificacao_7d','Verificação de resultado de tráfego','Checar performance dos anúncios e ajustar segmentação/criativos se necessário.',NULL,NULL,NULL,7,2,'lembrete'),
  ('06','Manutenção','maint_trf_relatorio_15d','Entrega de relatório de resultado (quinzenal)','Enviar ao cliente o relatório de tráfego do período.',NULL,NULL,NULL,15,3,'lembrete'),
  ('06','Manutenção','maint_trf_troca_30d','Trocar campanhas de tráfego','Renovar criativos e ângulos das campanhas de tráfego.',NULL,NULL,NULL,30,4,'lembrete'),
  ('06','Manutenção','maint_ia_15d','Verificar fechamento, atendimento e Follow Up (I.A)','Auditar conversas, qualificação e follow-ups feitos pela IA.','pro',NULL,NULL,15,5,'lembrete')
ON CONFLICT (template_key) DO NOTHING;

-- 3. Reescreve seed_xplo_template_tasks lendo da tabela
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
  SELECT _deal_id, _client_id, t.activity_type,
         t.subject, t.description, t.checkpoint_code, t.checkpoint_label, t.template_key,
         t.required_plan, t.required_bonus, t.required_function,
         v_scheduled,
         'pending'::public.crm_activity_status, true
  FROM public.xplo_task_templates t
  WHERE t.checkpoint_code = _checkpoint
    AND t.is_active = true
    AND (t.required_plan IS NULL OR t.required_plan = v_plan OR (t.required_plan = 'basic' AND v_plan = 'pro'))
    AND (t.required_bonus IS NULL OR t.required_bonus = ANY(COALESCE(v_bonuses, ARRAY[]::public.xplo_bonus[])))
    AND NOT EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.deal_id = _deal_id AND a.template_key = t.template_key
    );
END;
$function$;

-- 4. Reescreve seed_maintenance_tasks lendo da tabela
CREATE OR REPLACE FUNCTION public.seed_maintenance_tasks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_chk text; v_plan public.xplo_plan;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    SELECT checkpoint_code INTO v_chk FROM public.pipeline_columns WHERE id = NEW.column_id;
    IF v_chk = 'maint_active' THEN
      SELECT xplo_plan INTO v_plan FROM public.clients WHERE id = NEW.client_id;

      INSERT INTO public.activities(
        deal_id, client_id, type, subject, description,
        checkpoint_code, checkpoint_label, template_key,
        required_plan, recurrence_days, scheduled_at, status, auto_generated
      )
      SELECT NEW.id, NEW.client_id, t.activity_type, t.subject, t.description,
             '06', 'Manutenção', t.template_key, t.required_plan, t.recurrence_days,
             now() + (t.recurrence_days || ' days')::interval, 'pending', true
      FROM public.xplo_task_templates t
      WHERE t.checkpoint_code = '06'
        AND t.is_active = true
        AND (t.required_plan IS NULL OR t.required_plan = v_plan)
        AND NOT EXISTS (
          SELECT 1 FROM public.activities a
          WHERE a.deal_id = NEW.id AND a.template_key = t.template_key
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Reescreve start_maintenance_for_deal lendo da tabela
CREATE OR REPLACE FUNCTION public.start_maintenance_for_deal(_deal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_client uuid; v_plan public.xplo_plan;
BEGIN
  SELECT client_id INTO v_client FROM public.deals WHERE id = _deal_id;
  IF v_client IS NULL THEN RETURN; END IF;
  SELECT xplo_plan INTO v_plan FROM public.clients WHERE id = v_client;

  INSERT INTO public.activities(
    deal_id, client_id, type, subject, description,
    checkpoint_code, checkpoint_label, template_key,
    required_plan, recurrence_days, scheduled_at, status, auto_generated
  )
  SELECT _deal_id, v_client, t.activity_type, t.subject, t.description,
         '06', 'Manutenção', t.template_key, t.required_plan, t.recurrence_days,
         now() + (t.recurrence_days || ' days')::interval, 'pending', true
  FROM public.xplo_task_templates t
  WHERE t.checkpoint_code = '06'
    AND t.is_active = true
    AND (t.required_plan IS NULL OR t.required_plan = v_plan)
    AND NOT EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.deal_id = _deal_id AND a.template_key = t.template_key
    );
END;
$function$;
