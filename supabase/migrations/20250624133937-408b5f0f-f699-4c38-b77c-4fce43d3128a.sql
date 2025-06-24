
-- Vytvorenie tabuľky pre zložky a ich množstvá
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'g',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vytvorenie tabuľky pre kompozície/produkty
CREATE TABLE public.compositions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'bg-blue-500',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vytvorenie tabuľky pre recepty (zloženie kompozícií)
CREATE TABLE public.composition_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  composition_id UUID NOT NULL REFERENCES public.compositions(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'g',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexy pre lepší výkon
CREATE INDEX idx_ingredients_name ON public.ingredients(name);
CREATE INDEX idx_compositions_name ON public.compositions(name);
CREATE INDEX idx_composition_ingredients_composition_id ON public.composition_ingredients(composition_id);

-- RLS politiky - zatiaľ verejné prístupné
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composition_ingredients ENABLE ROW LEVEL SECURITY;

-- Politiky pre čítanie a zapisovanie (zatiaľ bez autentifikácie)
CREATE POLICY "Enable read access for all users" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.ingredients FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.compositions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.compositions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.compositions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.compositions FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.composition_ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.composition_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.composition_ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.composition_ingredients FOR DELETE USING (true);

-- Trigger pre aktualizáciu updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_compositions_updated_at BEFORE UPDATE ON public.compositions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
