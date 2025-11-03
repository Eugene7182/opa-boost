-- Add storage capacity field to products table
ALTER TABLE public.products 
ADD COLUMN storage_capacity text;

COMMENT ON COLUMN public.products.storage_capacity IS 'Storage capacity in GB (e.g., 64, 128, 256, 512)';