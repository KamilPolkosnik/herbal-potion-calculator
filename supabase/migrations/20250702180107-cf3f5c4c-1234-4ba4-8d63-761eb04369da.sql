
-- Add is_archived column to ingredient_movements table
ALTER TABLE public.ingredient_movements 
ADD COLUMN is_archived BOOLEAN DEFAULT false;
