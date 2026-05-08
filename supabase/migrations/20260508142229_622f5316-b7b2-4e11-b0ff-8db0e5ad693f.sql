DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'client_icp_documents',
    'client_offer_documents',
    'client_traffic_plan_documents',
    'client_icp',
    'offers_hormozi',
    'icps',
    'icp_pains',
    'ads',
    'landing_pages'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  END LOOP;
END $$;