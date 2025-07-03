
-- Dodaj kolumnę invoice_number do tabeli sales_transactions
ALTER TABLE public.sales_transactions 
ADD COLUMN invoice_number BIGINT;

-- Utwórz sekwencję dla numerów faktur
CREATE SEQUENCE public.invoice_number_seq START 1;

-- Przypisz numery istniejącym transakcjom w kolejności chronologicznej
WITH numbered_transactions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.sales_transactions
  ORDER BY created_at ASC
)
UPDATE public.sales_transactions 
SET invoice_number = numbered_transactions.row_num
FROM numbered_transactions 
WHERE public.sales_transactions.id = numbered_transactions.id;

-- Ustaw sekwencję na następny dostępny numer
SELECT setval('public.invoice_number_seq', (SELECT COALESCE(MAX(invoice_number), 0) + 1 FROM public.sales_transactions));

-- Ustaw domyślną wartość dla nowych rekordów
ALTER TABLE public.sales_transactions 
ALTER COLUMN invoice_number SET DEFAULT nextval('public.invoice_number_seq');

-- Dodaj ograniczenie NOT NULL po wypełnieniu istniejących danych
ALTER TABLE public.sales_transactions 
ALTER COLUMN invoice_number SET NOT NULL;

-- Dodaj unikalny indeks dla invoice_number
CREATE UNIQUE INDEX idx_sales_transactions_invoice_number 
ON public.sales_transactions(invoice_number);
