
-- Dodaj kolumnę sale_price do tabeli compositions
ALTER TABLE public.compositions 
ADD COLUMN sale_price DECIMAL(10,2) DEFAULT 0;
