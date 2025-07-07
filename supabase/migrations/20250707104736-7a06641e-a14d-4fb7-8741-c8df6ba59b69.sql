
-- Migracja: Zunifikowanie jednostek olejków na "ml"
-- Krok 1: Aktualizacja tabeli composition_ingredients - konwersja kropel na ml
UPDATE composition_ingredients 
SET 
  unit = 'ml',
  amount = amount / 20  -- 1ml = 20 kropel, więc krople/20 = ml
WHERE 
  unit = 'krople' 
  AND (ingredient_name ILIKE '%olejek%' OR ingredient_name ILIKE '%oil%');

-- Krok 2: Aktualizacja tabeli ingredients - konwersja kropel na ml
UPDATE ingredients 
SET 
  unit = 'ml',
  amount = amount / 20  -- 1ml = 20 kropel, więc krople/20 = ml
WHERE 
  unit = 'krople' 
  AND (name ILIKE '%olejek%' OR name ILIKE '%oil%');

-- Krok 3: Upewnienie się, że wszystkie olejki mają jednostkę "ml"
UPDATE composition_ingredients 
SET unit = 'ml'
WHERE 
  unit != 'ml' 
  AND (ingredient_name ILIKE '%olejek%' OR ingredient_name ILIKE '%oil%');

UPDATE ingredients 
SET unit = 'ml'
WHERE 
  unit != 'ml' 
  AND (name ILIKE '%olejek%' OR name ILIKE '%oil%');
