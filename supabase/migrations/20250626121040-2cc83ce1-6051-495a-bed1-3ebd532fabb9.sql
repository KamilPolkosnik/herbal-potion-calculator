
-- Usuwamy wszystkie istniejące dane
DELETE FROM composition_ingredients;
DELETE FROM compositions;

-- Dodajemy kompozycje
INSERT INTO compositions (name, description, color) VALUES 
('Wieczorny Spokój', 'dla relaksu', 'bg-purple-600'),
('Iskra Namiętności', 'dla libido', 'bg-red-600'),
('Źródło Witalności', 'dla ogólnego zdrowia', 'bg-green-600'),
('Tarcza Odporności', 'dla wzmocnienia odporności', 'bg-blue-600'),
('Morska Głębina', 'detoks i oczyszczenie', 'bg-teal-600'),
('Regeneracja Mięśni', 'po wysiłku fizycznym', 'bg-orange-600'),
('Rytuał Piękna', 'pielęgnacja skóry', 'bg-pink-600');

-- Dodajemy składniki dla Wieczorny Spokój
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'kwiaty lawendy', 40, 'g' FROM compositions c WHERE c.name = 'Wieczorny Spokój';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'kwiaty rumianku', 20, 'g' FROM compositions c WHERE c.name = 'Wieczorny Spokój';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'liście melisy', 20, 'g' FROM compositions c WHERE c.name = 'Wieczorny Spokój';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'nagietek', 20, 'g' FROM compositions c WHERE c.name = 'Wieczorny Spokój';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek lawendowy', 8, 'krople' FROM compositions c WHERE c.name = 'Wieczorny Spokój';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek ylang', 7, 'krople' FROM compositions c WHERE c.name = 'Wieczorny Spokój';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek pomarańczowy', 5, 'krople' FROM compositions c WHERE c.name = 'Wieczorny Spokój';

-- Dodajemy składniki dla Iskra Namiętności
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'kozłek lekarski', 35, 'g' FROM compositions c WHERE c.name = 'Iskra Namiętności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'korzeń maca', 30, 'g' FROM compositions c WHERE c.name = 'Iskra Namiętności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'płatki róży', 20, 'g' FROM compositions c WHERE c.name = 'Iskra Namiętności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'kwiaty hibiskusa', 15, 'g' FROM compositions c WHERE c.name = 'Iskra Namiętności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek ylang', 12, 'krople' FROM compositions c WHERE c.name = 'Iskra Namiętności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek paczuli', 8, 'krople' FROM compositions c WHERE c.name = 'Iskra Namiętności';

-- Dodajemy składniki dla Źródło Witalności
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'liście pokrzywy', 25, 'g' FROM compositions c WHERE c.name = 'Źródło Witalności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'ziele skrzypu polnego', 25, 'g' FROM compositions c WHERE c.name = 'Źródło Witalności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'liście brzozy', 20, 'g' FROM compositions c WHERE c.name = 'Źródło Witalności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'liście mięty pieprzowej', 10, 'g' FROM compositions c WHERE c.name = 'Źródło Witalności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'korzeń machy', 20, 'g' FROM compositions c WHERE c.name = 'Źródło Witalności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek eukaliptusowy', 12, 'krople' FROM compositions c WHERE c.name = 'Źródło Witalności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek citronella', 8, 'krople' FROM compositions c WHERE c.name = 'Źródło Witalności';

-- Dodajemy składniki dla Tarcza Odporności
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'kwiaty czarnego bzu', 30, 'g' FROM compositions c WHERE c.name = 'Tarcza Odporności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'kwiaty lipy', 20, 'g' FROM compositions c WHERE c.name = 'Tarcza Odporności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'ziele jeżówki', 20, 'g' FROM compositions c WHERE c.name = 'Tarcza Odporności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'pokrzywa', 20, 'g' FROM compositions c WHERE c.name = 'Tarcza Odporności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'hibiskus', 10, 'g' FROM compositions c WHERE c.name = 'Tarcza Odporności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek z drzewka herbacianego', 10, 'krople' FROM compositions c WHERE c.name = 'Tarcza Odporności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek rozmarynowy', 4, 'krople' FROM compositions c WHERE c.name = 'Tarcza Odporności';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek pomarańczowy', 6, 'krople' FROM compositions c WHERE c.name = 'Tarcza Odporności';

-- Dodajemy składniki dla Morska Głębina
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'spirulina sproszkowana', 15, 'g' FROM compositions c WHERE c.name = 'Morska Głębina';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'sól morska', 30, 'g' FROM compositions c WHERE c.name = 'Morska Głębina';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'suszone algi kelp', 20, 'g' FROM compositions c WHERE c.name = 'Morska Głębina';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'ziele skrzypu polnego', 20, 'g' FROM compositions c WHERE c.name = 'Morska Głębina';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'eukaliptus', 15, 'g' FROM compositions c WHERE c.name = 'Morska Głębina';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek morski świat', 20, 'krople' FROM compositions c WHERE c.name = 'Morska Głębina';

-- Dodajemy składniki dla Regeneracja Mięśni
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'kora wierzby białej', 30, 'g' FROM compositions c WHERE c.name = 'Regeneracja Mięśni';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'kwiat nagietka', 20, 'g' FROM compositions c WHERE c.name = 'Regeneracja Mięśni';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'mięta pieprzowa', 10, 'g' FROM compositions c WHERE c.name = 'Regeneracja Mięśni';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'liście szałwii muszkatołowej', 20, 'g' FROM compositions c WHERE c.name = 'Regeneracja Mięśni';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'lawenda', 20, 'g' FROM compositions c WHERE c.name = 'Regeneracja Mięśni';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek lawendowy', 7, 'krople' FROM compositions c WHERE c.name = 'Regeneracja Mięśni';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek rozmarynowy', 7, 'krople' FROM compositions c WHERE c.name = 'Regeneracja Mięśni';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek z drzewka herbacianego', 7, 'krople' FROM compositions c WHERE c.name = 'Regeneracja Mięśni';

-- Dodajemy składniki dla Rytuał Piękna
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'płatki nagietka', 20, 'g' FROM compositions c WHERE c.name = 'Rytuał Piękna';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'rumian rzymski', 20, 'g' FROM compositions c WHERE c.name = 'Rytuał Piękna';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'płatki róży', 20, 'g' FROM compositions c WHERE c.name = 'Rytuał Piękna';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'skrzyp polny', 20, 'g' FROM compositions c WHERE c.name = 'Rytuał Piękna';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'suszony aloes', 20, 'g' FROM compositions c WHERE c.name = 'Rytuał Piękna';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek paczuli', 8, 'krople' FROM compositions c WHERE c.name = 'Rytuał Piękna';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek rozmarynowy', 7, 'krople' FROM compositions c WHERE c.name = 'Rytuał Piękna';
INSERT INTO composition_ingredients (composition_id, ingredient_name, amount, unit) 
SELECT c.id, 'olejek z drzewka herbacianego', 5, 'krople' FROM compositions c WHERE c.name = 'Rytuał Piękna';
