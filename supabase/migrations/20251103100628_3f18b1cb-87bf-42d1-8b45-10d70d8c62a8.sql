-- Add admin-only policies for role management
CREATE POLICY "Admins can assign roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update organizational structure tables to require authentication
-- Drop public access policies
DROP POLICY IF EXISTS "Everyone can view active networks" ON public.networks;
DROP POLICY IF EXISTS "Everyone can view active regions" ON public.regions;
DROP POLICY IF EXISTS "Everyone can view active offices" ON public.offices;
DROP POLICY IF EXISTS "Everyone can view active stores" ON public.stores;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can view networks"
  ON public.networks FOR SELECT
  USING (active = true AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view regions"
  ON public.regions FOR SELECT
  USING (active = true AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view offices"
  ON public.offices FOR SELECT
  USING (active = true AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view stores"
  ON public.stores FOR SELECT
  USING (active = true AND auth.role() = 'authenticated');

-- Add comment to RoleGuard explaining security model
COMMENT ON TABLE public.user_roles IS 'User roles table. Client-side RoleGuard is for UX only - actual security is enforced by RLS policies on all tables.';