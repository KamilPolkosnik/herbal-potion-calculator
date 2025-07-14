
-- Add is_archived column to ingredient_movements if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredient_movements' 
        AND column_name = 'is_archived'
    ) THEN
        ALTER TABLE public.ingredient_movements ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;
END $$;
