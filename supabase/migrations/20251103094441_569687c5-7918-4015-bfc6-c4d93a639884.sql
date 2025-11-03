-- Create competitors table
CREATE TABLE public.competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create competitor_products table for tracking competitor product offerings
CREATE TABLE public.competitor_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category TEXT,
  estimated_price NUMERIC,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create competitor_tracking table for store-level competitor presence
CREATE TABLE public.competitor_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  presence_type TEXT NOT NULL CHECK (presence_type IN ('active', 'occasional', 'inactive')),
  promoter_count INTEGER DEFAULT 0 CHECK (promoter_count >= 0),
  notes TEXT,
  last_seen DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(competitor_id, store_id)
);

-- Add location coordinates to stores for mapping
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Enable RLS
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitors
CREATE POLICY "Admin and office can manage competitors"
  ON public.competitors FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Everyone can view active competitors"
  ON public.competitors FOR SELECT
  USING (active = true);

-- RLS Policies for competitor_products
CREATE POLICY "Admin and office can manage competitor products"
  ON public.competitor_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Everyone can view active competitor products"
  ON public.competitor_products FOR SELECT
  USING (active = true);

-- RLS Policies for competitor_tracking
CREATE POLICY "Admin and office can manage competitor tracking"
  ON public.competitor_tracking FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Supervisors can manage tracking in their region"
  ON public.competitor_tracking FOR ALL
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

CREATE POLICY "Promoters can view tracking at their store"
  ON public.competitor_tracking FOR SELECT
  USING (
    has_role(auth.uid(), 'promoter'::app_role)
    AND store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view competitor tracking"
  ON public.competitor_tracking FOR SELECT
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitor_products_updated_at
  BEFORE UPDATE ON public.competitor_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitor_tracking_updated_at
  BEFORE UPDATE ON public.competitor_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_competitor_products_competitor_id ON public.competitor_products(competitor_id);
CREATE INDEX idx_competitor_tracking_competitor_id ON public.competitor_tracking(competitor_id);
CREATE INDEX idx_competitor_tracking_store_id ON public.competitor_tracking(store_id);
CREATE INDEX idx_stores_coordinates ON public.stores(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;