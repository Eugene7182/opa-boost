-- Create network_product_bonuses table
CREATE TABLE IF NOT EXISTS public.network_product_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  base_bonus NUMERIC NOT NULL CHECK (base_bonus >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(network_id, product_variant_id)
);

ALTER TABLE public.network_product_bonuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and office can manage network bonuses" ON public.network_product_bonuses;
CREATE POLICY "Admin and office can manage network bonuses"
  ON public.network_product_bonuses FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

DROP POLICY IF EXISTS "Everyone can view active network bonuses" ON public.network_product_bonuses;
CREATE POLICY "Everyone can view active network bonuses"
  ON public.network_product_bonuses FOR SELECT
  USING (active = true);

-- Create plan_bonus_tiers table
CREATE TABLE IF NOT EXISTS public.plan_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  min_percent NUMERIC NOT NULL CHECK (min_percent >= 0 AND min_percent <= 500),
  max_percent NUMERIC CHECK (max_percent IS NULL OR (max_percent >= 0 AND max_percent <= 500)),
  bonus_amount NUMERIC NOT NULL CHECK (bonus_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_bonus_tiers_norm 
  ON public.plan_bonus_tiers(network_id, min_percent, COALESCE(max_percent, -1));

ALTER TABLE public.plan_bonus_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and office can manage plan bonus tiers" ON public.plan_bonus_tiers;
CREATE POLICY "Admin and office can manage plan bonus tiers"
  ON public.plan_bonus_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

DROP POLICY IF EXISTS "Everyone can view plan bonus tiers" ON public.plan_bonus_tiers;
CREATE POLICY "Everyone can view plan bonus tiers"
  ON public.plan_bonus_tiers FOR SELECT
  USING (true);

-- Create promoter_plans table
CREATE TABLE IF NOT EXISTS public.promoter_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  month_start DATE NOT NULL,
  target_qty INTEGER NOT NULL CHECK (target_qty >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promoter_id, network_id, month_start)
);

ALTER TABLE public.promoter_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and office can manage promoter plans" ON public.promoter_plans;
CREATE POLICY "Admin and office can manage promoter plans"
  ON public.promoter_plans FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

DROP POLICY IF EXISTS "Supervisors can manage plans in their region" ON public.promoter_plans;
CREATE POLICY "Supervisors can manage plans in their region"
  ON public.promoter_plans FOR ALL
  USING (
    has_role(auth.uid(), 'supervisor') AND
    promoter_id IN (
      SELECT p.id FROM profiles p
      WHERE p.region_id = get_user_region_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Promoters can view their plans" ON public.promoter_plans;
CREATE POLICY "Promoters can view their plans"
  ON public.promoter_plans FOR SELECT
  USING (promoter_id = auth.uid());

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and office can manage campaigns" ON public.campaigns;
CREATE POLICY "Admin and office can manage campaigns"
  ON public.campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

DROP POLICY IF EXISTS "Everyone can view active campaigns" ON public.campaigns;
CREATE POLICY "Everyone can view active campaigns"
  ON public.campaigns FOR SELECT
  USING (active = true);

-- Create campaign_bonus_rules table
CREATE TABLE IF NOT EXISTS public.campaign_bonus_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  threshold_qty INTEGER NOT NULL CHECK (threshold_qty > 0),
  extra_per_sale NUMERIC NOT NULL CHECK (extra_per_sale >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_bonus_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and office can manage campaign rules" ON public.campaign_bonus_rules;
CREATE POLICY "Admin and office can manage campaign rules"
  ON public.campaign_bonus_rules FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

DROP POLICY IF EXISTS "Everyone can view campaign rules" ON public.campaign_bonus_rules;
CREATE POLICY "Everyone can view campaign rules"
  ON public.campaign_bonus_rules FOR SELECT
  USING (true);

-- Create user_invites table
CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  role app_role NOT NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and office can manage invites" ON public.user_invites;
CREATE POLICY "Admin and office can manage invites"
  ON public.user_invites FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

DROP POLICY IF EXISTS "Supervisors can manage invites in their region" ON public.user_invites;
CREATE POLICY "Supervisors can manage invites in their region"
  ON public.user_invites FOR ALL
  USING (
    has_role(auth.uid(), 'supervisor') AND
    region_id = get_user_region_id(auth.uid())
  );

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_network_product_bonuses_updated_at ON public.network_product_bonuses;
CREATE TRIGGER update_network_product_bonuses_updated_at
  BEFORE UPDATE ON public.network_product_bonuses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_promoter_plans_updated_at ON public.promoter_plans;
CREATE TRIGGER update_promoter_plans_updated_at
  BEFORE UPDATE ON public.promoter_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();