
-- Aktualizuj jednostkę dla "Etykieta" w tabeli ingredients na "szt"
UPDATE ingredients 
SET unit = 'szt' 
WHERE name = 'Etykieta' AND unit = 'g';

-- Sprawdź czy są inne składniki typu "inne" z nieprawidłowymi jednostkami
UPDATE ingredients 
SET unit = 'szt' 
WHERE (name ILIKE '%worek%' OR name ILIKE '%woreczek%' OR name ILIKE '%pojemnik%' OR name ILIKE '%etykieta%') 
AND unit != 'szt';
