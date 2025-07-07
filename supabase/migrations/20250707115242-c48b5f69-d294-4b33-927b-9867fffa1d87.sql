
-- Aktualizuj jednostkę dla "Olejek citronella" w tabeli composition_ingredients na "ml"
UPDATE composition_ingredients 
SET 
  unit = 'ml',
  amount = amount / 20  -- konwersja kropel na ml (20 kropel = 1ml)
WHERE 
  ingredient_name = 'Olejek citronella' 
  AND unit = 'krople';

-- Aktualizuj jednostkę dla "Olejek citronella" w tabeli ingredients na "ml"
UPDATE ingredients 
SET 
  unit = 'ml',
  amount = amount / 20  -- konwersja kropel na ml (20 kropel = 1ml)
WHERE 
  name = 'Olejek citronella' 
  AND unit = 'krople';

-- Upewnij się, że wszystkie olejki mają jednostkę "ml"
UPDATE composition_ingredients 
SET unit = 'ml'
WHERE 
  ingredient_name ILIKE '%olejek%' 
  AND unit != 'ml';

UPDATE ingredients 
SET unit = 'ml'
WHERE 
  name ILIKE '%olejek%' 
  AND unit != 'ml';
