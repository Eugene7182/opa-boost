-- Product variants (memory options)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  memory TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, memory)
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active variants"
ON public.product_variants FOR SELECT
USING (active = true);

CREATE POLICY "Admin and office can manage variants"
ON public.product_variants FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

-- Add variant to sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS product_variant_id UUID REFERENCES public.product_variants(id);

-- Sales plans
CREATE TABLE IF NOT EXISTS public.sales_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.regions(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_qty INTEGER NOT NULL DEFAULT 0,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promoters can view their plans"
ON public.sales_plans FOR SELECT
USING (promoter_id = auth.uid());

CREATE POLICY "Supervisors can manage plans in their region"
ON public.sales_plans FOR ALL
USING (
  has_role(auth.uid(), 'supervisor') AND 
  region_id = get_user_region_id(auth.uid())
);

CREATE POLICY "Office and admin can manage all plans"
ON public.sales_plans FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

-- Stock reminders
CREATE TABLE IF NOT EXISTS public.stock_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promoters can view their store reminders"
ON public.stock_reminders FOR SELECT
USING (
  has_role(auth.uid(), 'promoter') AND
  store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Supervisors can view reminders in their region"
ON public.stock_reminders FOR SELECT
USING (
  has_role(auth.uid(), 'supervisor') AND
  store_id IN (
    SELECT s.id FROM stores s
    JOIN offices o ON o.id = s.office_id
    JOIN profiles p ON p.region_id = o.region_id
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Office and admin can view all reminders"
ON public.stock_reminders FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

CREATE POLICY "System can manage reminders"
ON public.stock_reminders FOR ALL
USING (true);

-- Update inventories for variants and status
ALTER TABLE public.inventories ADD COLUMN IF NOT EXISTS product_variant_id UUID REFERENCES public.product_variants(id);
ALTER TABLE public.inventories ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE public.inventories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed'));

-- Focus campaigns
CREATE TABLE IF NOT EXISTS public.focus_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_required BOOLEAN NOT NULL DEFAULT false,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal_qty INTEGER,
  goal_amount NUMERIC,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.focus_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view focus campaigns"
ON public.focus_campaigns FOR SELECT
USING (true);

CREATE POLICY "Office and admin can manage focus campaigns"
ON public.focus_campaigns FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

-- Motivation rules (thresholds)
CREATE TABLE IF NOT EXISTS public.motivation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motivation_id UUID NOT NULL REFERENCES public.motivations(id) ON DELETE CASCADE,
  min_qty INTEGER NOT NULL,
  bonus NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.motivation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view motivation rules"
ON public.motivation_rules FOR SELECT
USING (true);

CREATE POLICY "Admin and office can manage motivation rules"
ON public.motivation_rules FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

-- Update profiles for settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suggestions_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trainer_region_ids UUID[];

-- Feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read feature flags"
ON public.feature_flags FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage feature flags"
ON public.feature_flags FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert AI assistant flag
INSERT INTO public.feature_flags (flag_name, enabled)
VALUES ('ai_assistant', false)
ON CONFLICT (flag_name) DO NOTHING;

-- Update chat_messages for audience
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS audience JSONB;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;

-- Message receipts
CREATE TABLE IF NOT EXISTS public.message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their receipts"
ON public.message_receipts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can manage receipts"
ON public.message_receipts FOR ALL
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_plans_updated_at
BEFORE UPDATE ON public.sales_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_focus_campaigns_updated_at
BEFORE UPDATE ON public.focus_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();