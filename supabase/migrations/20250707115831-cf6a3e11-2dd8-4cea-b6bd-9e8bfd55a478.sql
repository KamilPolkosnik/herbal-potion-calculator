
-- Utwórz funkcję do aktualizacji ilości składników
CREATE OR REPLACE FUNCTION public.update_ingredient_amount(
    ingredient_name text,
    amount_change numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Nadaj uprawnienia do wykonywania funkcji
GRANT EXECUTE ON FUNCTION public.update_ingredient_amount(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ingredient_amount(text, numeric) TO anon;
