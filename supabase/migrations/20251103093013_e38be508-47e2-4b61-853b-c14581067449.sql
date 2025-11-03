-- Этап 1: Фундамент БД для OPPO платформы
-- Организационная структура + роли + RLS политики

-- 1. Обновляем enum ролей (добавляем trainer)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'trainer';

-- 2. Создаем таблицу сетей (networks)
CREATE TABLE IF NOT EXISTS public.networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Создаем таблицу регионов (regions)
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID REFERENCES public.networks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(network_id, code)
);

-- 4. Создаем таблицу офисов (offices)
CREATE TABLE IF NOT EXISTS public.offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(region_id, code)
);

-- 5. Создаем таблицу магазинов (stores)
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(office_id, code)
);

-- 6. Расширяем таблицу profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS patronymic TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL;

-- 7. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_regions_network ON public.regions(network_id);
CREATE INDEX IF NOT EXISTS idx_offices_region ON public.offices(region_id);
CREATE INDEX IF NOT EXISTS idx_stores_office ON public.stores(office_id);
CREATE INDEX IF NOT EXISTS idx_profiles_store ON public.profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON public.profiles(region_id);

-- 8. Триггеры для updated_at
CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON public.networks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offices_updated_at
  BEFORE UPDATE ON public.offices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Enable RLS на всех таблицах
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 10. RLS политики для networks
CREATE POLICY "Admin and office can manage networks"
  ON public.networks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Everyone can view active networks"
  ON public.networks FOR SELECT
  USING (active = true);

-- 11. RLS политики для regions
CREATE POLICY "Admin and office can manage regions"
  ON public.regions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Supervisors can view their region"
  ON public.regions FOR SELECT
  USING (
    has_role(auth.uid(), 'supervisor'::app_role) 
    AND id IN (SELECT region_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Everyone can view active regions"
  ON public.regions FOR SELECT
  USING (active = true);

-- 12. RLS политики для offices
CREATE POLICY "Admin and office can manage offices"
  ON public.offices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Supervisors can view offices in their region"
  ON public.offices FOR SELECT
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND region_id IN (SELECT region_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Everyone can view active offices"
  ON public.offices FOR SELECT
  USING (active = true);

-- 13. RLS политики для stores
CREATE POLICY "Admin and office can manage stores"
  ON public.stores FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Supervisors can manage stores in their region"
  ON public.stores FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND office_id IN (
      SELECT o.id FROM public.offices o
      INNER JOIN public.profiles p ON p.region_id = o.region_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Supervisors can update stores in their region"
  ON public.stores FOR UPDATE
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND office_id IN (
      SELECT o.id FROM public.offices o
      INNER JOIN public.profiles p ON p.region_id = o.region_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view active stores"
  ON public.stores FOR SELECT
  USING (active = true);

-- 14. Обновляем RLS для profiles (расширенные права supervisor)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Supervisors can view profiles in their region"
  ON public.profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND region_id IN (SELECT region_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Supervisors can update promoter profiles in their region"
  ON public.profiles FOR UPDATE
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND region_id IN (SELECT region_id FROM public.profiles WHERE id = auth.uid())
    AND id IN (SELECT user_id FROM public.user_roles WHERE role = 'promoter'::app_role)
  );

CREATE POLICY "Admin and office can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Admin and office can update all profiles"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));