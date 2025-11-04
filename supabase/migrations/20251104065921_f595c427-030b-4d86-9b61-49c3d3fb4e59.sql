-- Update product_variants structure to match requirements
ALTER TABLE public.product_variants 
  DROP COLUMN IF EXISTS memory;

ALTER TABLE public.product_variants 
  ADD COLUMN memory_gb INTEGER NOT NULL DEFAULT 128 CHECK (memory_gb IN (4, 6, 8, 12, 16, 64, 128, 256, 512, 1024));

ALTER TABLE public.product_variants 
  ADD COLUMN sku TEXT;

-- Drop existing unique constraint if any
ALTER TABLE public.product_variants 
  DROP CONSTRAINT IF EXISTS product_variants_product_id_memory_key;

-- Add new unique constraint
ALTER TABLE public.product_variants 
  ADD CONSTRAINT product_variants_product_id_memory_gb_key UNIQUE(product_id, memory_gb);