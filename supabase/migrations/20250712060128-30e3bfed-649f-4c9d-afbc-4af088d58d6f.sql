
-- Utwórz bucket do przechowywania faktur kosztowych
INSERT INTO storage.buckets (id, name, public)
VALUES ('cost-invoices', 'cost-invoices', false);

-- Utwórz tabelę do metadanych faktur kosztowych  
CREATE TABLE public.cost_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  invoice_month INTEGER NOT NULL,
  invoice_year INTEGER NOT NULL,
  description TEXT,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dodaj RLS dla tabeli cost_invoices
ALTER TABLE public.cost_invoices ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla cost_invoices
CREATE POLICY "Enable all access for cost_invoices" 
  ON public.cost_invoices 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Polityki dla storage bucket cost-invoices
CREATE POLICY "Allow authenticated users to upload cost invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cost-invoices' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view cost invoices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cost-invoices' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete cost invoices"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cost-invoices' AND auth.role() = 'authenticated');

-- Dodaj trigger do aktualizacji updated_at
CREATE TRIGGER update_cost_invoices_updated_at
  BEFORE UPDATE ON public.cost_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
