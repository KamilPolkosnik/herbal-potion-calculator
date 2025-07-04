
-- Utwórz tabelę dla kosztów miesięcznych
CREATE TABLE public.monthly_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'inne',
  cost_month INTEGER NOT NULL CHECK (cost_month >= 1 AND cost_month <= 12),
  cost_year INTEGER NOT NULL CHECK (cost_year >= 2020 AND cost_year <= 2100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dodaj RLS policies
ALTER TABLE public.monthly_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for monthly_costs" 
  ON public.monthly_costs 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Dodaj trigger dla updated_at
CREATE TRIGGER update_monthly_costs_updated_at
  BEFORE UPDATE ON public.monthly_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Dodaj indeks dla szybkiego wyszukiwania po dacie
CREATE INDEX idx_monthly_costs_date ON public.monthly_costs(cost_year, cost_month);
