
-- Aktualizuj jednostki dla składników kategorii "inne" w tabeli ingredients
-- na podstawie ich kategorii w composition_ingredients

UPDATE ingredients 
SET unit = 'szt' 
WHERE name IN (
  SELECT DISTINCT ingredient_name 
  FROM composition_ingredients 
  WHERE category = 'inne'
) AND unit != 'szt';

-- Dodatkowo zaktualizuj konkretne składniki które widzę w błędzie
UPDATE ingredients 
SET unit = 'szt' 
WHERE name IN ('metka', 'torba papierowa', 'torebka', 'Butelka') 
AND unit != 'szt';
