-- Create retail_prices table for price history
CREATE TABLE public.retail_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL CHECK (price >= 0),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create kef_schemes table for coefficient schemes
CREATE TABLE public.kef_schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coefficient NUMERIC NOT NULL CHECK (coefficient > 0),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create kef_endings table for tracking scheme endings
CREATE TABLE public.kef_endings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kef_scheme_id UUID NOT NULL REFERENCES public.kef_schemes(id) ON DELETE CASCADE,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  ended_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.retail_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kef_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kef_endings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retail_prices
CREATE POLICY "Admin and office can manage retail prices"
  ON public.retail_prices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Everyone can view active retail prices"
  ON public.retail_prices FOR SELECT
  USING (active = true);

-- RLS Policies for kef_schemes
CREATE POLICY "Admin and office can manage kef schemes"
  ON public.kef_schemes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Everyone can view active kef schemes"
  ON public.kef_schemes FOR SELECT
  USING (active = true);

-- RLS Policies for kef_endings
CREATE POLICY "Admin and office can manage kef endings"
  ON public.kef_endings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Everyone can view kef endings"
  ON public.kef_endings FOR SELECT
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_retail_prices_updated_at
  BEFORE UPDATE ON public.retail_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kef_schemes_updated_at
  BEFORE UPDATE ON public.kef_schemes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_retail_prices_product_id ON public.retail_prices(product_id);
CREATE INDEX idx_retail_prices_active ON public.retail_prices(active);
CREATE INDEX idx_kef_schemes_product_id ON public.kef_schemes(product_id);
CREATE INDEX idx_kef_schemes_region_id ON public.kef_schemes(region_id);
CREATE INDEX idx_kef_schemes_active ON public.kef_schemes(active);
CREATE INDEX idx_kef_endings_scheme_id ON public.kef_endings(kef_scheme_id);