-- Create market_shares table for tracking market share data
CREATE TABLE public.market_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  our_sales NUMERIC NOT NULL DEFAULT 0 CHECK (our_sales >= 0),
  competitor_sales NUMERIC NOT NULL DEFAULT 0 CHECK (competitor_sales >= 0),
  market_share_percent NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN (our_sales + competitor_sales) > 0 
      THEN (our_sales / (our_sales + competitor_sales)) * 100 
      ELSE 0 
    END
  ) STORED,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create inventories table for tracking product stock levels
CREATE TABLE public.inventories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- Enable RLS
ALTER TABLE public.market_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for market_shares
CREATE POLICY "Admin and office can manage market shares"
  ON public.market_shares FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Supervisors can view market shares in their region"
  ON public.market_shares FOR SELECT
  USING (
    has_role(auth.uid(), 'supervisor'::app_role) 
    AND region_id IN (
      SELECT region_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view market shares"
  ON public.market_shares FOR SELECT
  USING (true);

-- RLS Policies for inventories
CREATE POLICY "Admin and office can manage inventories"
  ON public.inventories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Supervisors can manage inventories in their region"
  ON public.inventories FOR ALL
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND store_id IN (
      SELECT s.id 
      FROM public.stores s
      JOIN public.offices o ON o.id = s.office_id
      JOIN public.profiles p ON p.region_id = o.region_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Promoters can view inventories at their store"
  ON public.inventories FOR SELECT
  USING (
    has_role(auth.uid(), 'promoter'::app_role)
    AND store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view inventories"
  ON public.inventories FOR SELECT
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_market_shares_updated_at
  BEFORE UPDATE ON public.market_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventories_updated_at
  BEFORE UPDATE ON public.inventories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_market_shares_product_id ON public.market_shares(product_id);
CREATE INDEX idx_market_shares_region_id ON public.market_shares(region_id);
CREATE INDEX idx_market_shares_store_id ON public.market_shares(store_id);
CREATE INDEX idx_market_shares_period ON public.market_shares(period_start, period_end);
CREATE INDEX idx_inventories_product_id ON public.inventories(product_id);
CREATE INDEX idx_inventories_store_id ON public.inventories(store_id);