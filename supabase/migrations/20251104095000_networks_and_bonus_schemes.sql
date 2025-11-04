-- Create networks table
CREATE TABLE public.networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add network_id to profiles
ALTER TABLE public.profiles
ADD COLUMN network_id UUID REFERENCES public.networks(id);

-- Modify bonus_schemes table to support network-specific schemes
ALTER TABLE public.bonus_schemes
ADD COLUMN network_id UUID REFERENCES public.networks(id);

-- Create network_promoters table for managing promoter assignments
CREATE TABLE public.network_promoters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(network_id, promoter_id)
);

-- Add RLS policies for networks
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active networks"
  ON public.networks FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Admin and office can manage networks"
  ON public.networks FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'office')
  );

-- Add RLS policies for network_promoters
ALTER TABLE public.network_promoters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promoters can view their own network assignments"
  ON public.network_promoters FOR SELECT
  USING (promoter_id = auth.uid());

CREATE POLICY "Admin and office can manage network assignments"
  ON public.network_promoters FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'office')
  );

-- Add trigger for updated_at
CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON public.networks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_promoters_updated_at
  BEFORE UPDATE ON public.network_promoters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Modify sales table to include network context
ALTER TABLE public.sales
ADD COLUMN network_id UUID REFERENCES public.networks(id);

-- Update sales policies to include network context
DROP POLICY IF EXISTS "Promoters can view their own sales" ON public.sales;
CREATE POLICY "Promoters can view their own sales"
  ON public.sales FOR SELECT
  USING (
    auth.uid() = promoter_id AND
    EXISTS (
      SELECT 1 FROM public.network_promoters
      WHERE promoter_id = auth.uid()
      AND network_id = sales.network_id
      AND active = TRUE
    )
  );

-- Function to calculate bonus based on network-specific schemes
CREATE OR REPLACE FUNCTION public.calculate_sale_bonus(
  _product_id UUID,
  _network_id UUID,
  _quantity INT,
  _total_amount DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bonus DECIMAL;
BEGIN
  SELECT
    CASE
      WHEN bs.bonus_percent IS NOT NULL THEN
        _total_amount * (bs.bonus_percent / 100)
      ELSE 0
    END
  INTO bonus
  FROM bonus_schemes bs
  WHERE bs.product_id = _product_id
    AND bs.network_id = _network_id
    AND bs.active = TRUE
    AND bs.start_date <= NOW()
    AND (bs.end_date IS NULL OR bs.end_date > NOW())
    AND bs.min_quantity <= _quantity
  ORDER BY bs.bonus_percent DESC
  LIMIT 1;

  RETURN COALESCE(bonus, 0);
END;
$$;