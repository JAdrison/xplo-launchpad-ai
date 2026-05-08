
-- clientes_vendidos
CREATE TABLE public.clientes_vendidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor_mensal_cents bigint NOT NULL DEFAULT 0,
  valor_setup_cents bigint NOT NULL DEFAULT 0,
  vendedor_id uuid,
  sdr_id uuid,
  dia_vencimento int NOT NULL DEFAULT 1 CHECK (dia_vencimento BETWEEN 1 AND 31),
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes_vendidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_clientes_vendidos" ON public.clientes_vendidos
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_clientes_vendidos" ON public.clientes_vendidos
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_clientes_vendidos" ON public.clientes_vendidos
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_clientes_vendidos" ON public.clientes_vendidos
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_clientes_vendidos_updated
  BEFORE UPDATE ON public.clientes_vendidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pagamentos_clientes
CREATE TABLE public.pagamentos_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes_vendidos(id) ON DELETE CASCADE,
  mes int NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano int NOT NULL,
  pago_em timestamptz NOT NULL DEFAULT now(),
  valor_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, mes, ano)
);
ALTER TABLE public.pagamentos_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_pagamentos_clientes" ON public.pagamentos_clientes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_pagamentos_clientes" ON public.pagamentos_clientes
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_pagamentos_clientes" ON public.pagamentos_clientes
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_pagamentos_clientes" ON public.pagamentos_clientes
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- gastos_anuncios
CREATE TABLE public.gastos_anuncios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes int NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano int NOT NULL,
  valor_cents bigint NOT NULL DEFAULT 0,
  leads_manual int,
  reunioes_manual int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mes, ano)
);
ALTER TABLE public.gastos_anuncios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_gastos_anuncios" ON public.gastos_anuncios
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_gastos_anuncios" ON public.gastos_anuncios
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_gastos_anuncios" ON public.gastos_anuncios
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_gastos_anuncios" ON public.gastos_anuncios
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_gastos_anuncios_updated
  BEFORE UPDATE ON public.gastos_anuncios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_clientes_vendidos_created_at ON public.clientes_vendidos(created_at);
CREATE INDEX idx_pagamentos_mes_ano ON public.pagamentos_clientes(ano, mes);
