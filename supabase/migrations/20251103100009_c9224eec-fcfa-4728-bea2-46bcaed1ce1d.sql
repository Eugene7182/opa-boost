-- Create SECURITY DEFINER function to get user's region_id without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_region_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT region_id FROM public.profiles WHERE id = _user_id
$$;

-- Drop existing recursive policies on profiles
DROP POLICY IF EXISTS "Supervisors can view profiles in their region" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can update promoter profiles in their region" ON public.profiles;

-- Recreate policies using the SECURITY DEFINER function
CREATE POLICY "Supervisors can view profiles in their region"
  ON public.profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND region_id = public.get_user_region_id(auth.uid())
  );

CREATE POLICY "Supervisors can update promoter profiles in their region"
  ON public.profiles FOR UPDATE
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND region_id = public.get_user_region_id(auth.uid())
    AND id IN (
      SELECT user_id FROM user_roles WHERE role = 'promoter'::app_role
    )
  );

-- Drop and recreate recursive policy on offices
DROP POLICY IF EXISTS "Supervisors can view offices in their region" ON public.offices;

CREATE POLICY "Supervisors can view offices in their region"
  ON public.offices FOR SELECT
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND region_id = public.get_user_region_id(auth.uid())
  );