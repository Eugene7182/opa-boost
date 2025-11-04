-- Add storage_gb column to distinguish variants with same RAM
ALTER TABLE public.product_variants 
  ADD COLUMN storage_gb INTEGER NOT NULL DEFAULT 128 CHECK (storage_gb IN (64, 128, 256, 512, 1024));

-- Drop old unique constraint
ALTER TABLE public.product_variants 
  DROP CONSTRAINT IF EXISTS product_variants_product_id_memory_gb_key;

-- Add new unique constraint with both memory and storage
ALTER TABLE public.product_variants 
  ADD CONSTRAINT product_variants_product_id_memory_storage_key UNIQUE(product_id, memory_gb, storage_gb);