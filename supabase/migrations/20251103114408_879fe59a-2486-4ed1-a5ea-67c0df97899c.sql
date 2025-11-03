-- Add store_id to sales table to track which store the sale was made at
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Update RLS policy for promoters to only create sales at their assigned store
DROP POLICY IF EXISTS "Promoters can create their own sales" ON public.sales;

CREATE POLICY "Promoters can create sales at their assigned store"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = promoter_id AND
  store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Add policy for supervisors to view sales in their region
CREATE POLICY "Supervisors can view sales in their region"
ON public.sales
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'supervisor') AND
  store_id IN (
    SELECT s.id
    FROM stores s
    JOIN offices o ON o.id = s.office_id
    JOIN profiles p ON p.region_id = o.region_id
    WHERE p.id = auth.uid()
  )
);