
-- 1) Przełącznik VAT w ustawieniach firmy
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS is_vat_registered boolean NOT NULL DEFAULT false;

-- 2) Numeracja rachunków

-- Sekwencja do numerów rachunków
CREATE SEQUENCE IF NOT EXISTS public.receipt_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Kolumna na numer rachunku (nullable – nadawany dopiero przy generowaniu)
ALTER TABLE public.sales_transactions
ADD COLUMN IF NOT EXISTS receipt_number bigint;

-- Unikalność numerów rachunków (po nadaniu)
CREATE UNIQUE INDEX IF NOT EXISTS sales_transactions_receipt_number_unique
ON public.sales_transactions (receipt_number)
WHERE receipt_number IS NOT NULL;

-- 3) Funkcja RPC do atomowego przypisania numeru rachunku
CREATE OR REPLACE FUNCTION public.assign_receipt_number(p_transaction_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_number bigint;
BEGIN
  -- Nadaj numer tylko jeśli brak; zwróć istniejący jeśli już nadany
  UPDATE public.sales_transactions
  SET receipt_number = COALESCE(receipt_number, nextval('public.receipt_number_seq'))
  WHERE id = p_transaction_id
  RETURNING receipt_number INTO v_number;

  RETURN v_number;
END;
$$;
