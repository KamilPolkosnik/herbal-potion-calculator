-- Critical Security Fixes Migration (Fixed)

-- 1. Create security definer function to safely check user roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.app_users WHERE id = auth.uid();
$$;

-- 2. Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role FROM public.app_users WHERE id = auth.uid()) = 'admin', false);
$$;

-- 3. Update app_users RLS policy to prevent privilege escalation
DROP POLICY IF EXISTS "Admins can manage all users" ON public.app_users;

CREATE POLICY "Admins can manage all users"
ON public.app_users
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 4. Enable RLS on company_settings table (CRITICAL - was missing)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policy for company_settings (admin only access)
CREATE POLICY "Only admins can access company settings"
ON public.company_settings
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 6. Enable RLS on warning_thresholds table (CRITICAL - was missing)
ALTER TABLE public.warning_thresholds ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policy for warning_thresholds (admin only access)
CREATE POLICY "Only admins can access warning thresholds"
ON public.warning_thresholds
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 8. Fix existing database function security (update without dropping)
CREATE OR REPLACE FUNCTION public.update_ingredient_amount(ingredient_name text, amount_change numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Zaktualizuj ilość składnika
    UPDATE public.ingredients 
    SET 
        amount = GREATEST(0, amount + amount_change),
        updated_at = now()
    WHERE name = ingredient_name;
    
    -- Jeśli składnik nie istnieje, utwórz go z domyślnymi wartościami
    IF NOT FOUND THEN
        INSERT INTO public.ingredients (name, amount, price, unit)
        VALUES (
            ingredient_name, 
            GREATEST(0, amount_change), 
            0,
            CASE 
                WHEN ingredient_name ILIKE '%olejek%' THEN 'ml'
                WHEN ingredient_name ILIKE '%worek%' OR ingredient_name ILIKE '%woreczek%' OR ingredient_name ILIKE '%pojemnik%' OR ingredient_name ILIKE '%etykieta%' THEN 'szt'
                ELSE 'g'
            END
        );
    END IF;
END;
$$;

-- 9. Fix update_updated_at_column function security (update without dropping)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;