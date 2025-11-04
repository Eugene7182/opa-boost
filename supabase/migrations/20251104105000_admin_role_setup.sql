-- Function to auto-assign admin role for specific email
CREATE OR REPLACE FUNCTION public.handle_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Автоматически назначаем роль admin для указанного email
  IF NEW.email = 'SENZOVE@mail.ru' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto admin role assignment
DROP TRIGGER IF EXISTS on_auth_user_created_admin_role ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_role();

-- In case the user already exists, ensure they have admin role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'SENZOVE@mail.ru'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'
    FROM auth.users
    WHERE email = 'SENZOVE@mail.ru'
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END
$$;