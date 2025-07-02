
-- Utwórz enum dla typów ruchów magazynowych
CREATE TYPE public.movement_type AS ENUM ('purchase', 'sale', 'reversal', 'adjustment');

-- Utwórz tabelę dla historii ruchów magazynowych
CREATE TABLE public.ingredient_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ingredient_name TEXT NOT NULL,
    movement_type movement_type NOT NULL,
    quantity_change NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Włącz Row Level Security
ALTER TABLE public.ingredient_movements ENABLE ROW LEVEL SECURITY;

-- Utwórz polityki RLS
CREATE POLICY "Enable read access for all users" ON public.ingredient_movements FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.ingredient_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.ingredient_movements FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.ingredient_movements FOR DELETE USING (true);

-- Utwórz indeks dla szybszego wyszukiwania
CREATE INDEX idx_ingredient_movements_name ON public.ingredient_movements(ingredient_name);
CREATE INDEX idx_ingredient_movements_created_at ON public.ingredient_movements(created_at DESC);
CREATE INDEX idx_ingredient_movements_reference ON public.ingredient_movements(reference_id, reference_type);
