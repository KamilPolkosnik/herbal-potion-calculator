
-- Dodaj pole do tabeli company_settings dla włączania/wyłączania generatora UES
ALTER TABLE public.company_settings 
ADD COLUMN show_ues_generator boolean NOT NULL DEFAULT true;
