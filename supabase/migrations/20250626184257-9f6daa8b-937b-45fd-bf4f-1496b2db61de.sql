
-- Dodaj kolumny dla danych kupującego do tabeli sales_transactions
ALTER TABLE public.sales_transactions ADD COLUMN buyer_name TEXT;
ALTER TABLE public.sales_transactions ADD COLUMN buyer_email TEXT;
ALTER TABLE public.sales_transactions ADD COLUMN buyer_phone TEXT;
ALTER TABLE public.sales_transactions ADD COLUMN buyer_address TEXT;
ALTER TABLE public.sales_transactions ADD COLUMN buyer_tax_id TEXT;

-- Utwórz tabelę dla ustawień firmy
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_tax_id TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  bank_account TEXT,
  bank_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dodaj trigger dla updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Wstaw domyślne ustawienia firmy
INSERT INTO public.company_settings (company_name, company_address, company_email) 
VALUES ('Moja Firma', 'Adres firmy', 'kontakt@mojafirma.pl');
