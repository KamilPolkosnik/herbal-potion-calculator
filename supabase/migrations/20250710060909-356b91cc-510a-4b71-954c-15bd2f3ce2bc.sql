
-- Add category column to composition_ingredients table
ALTER TABLE public.composition_ingredients 
ADD COLUMN category text NOT NULL DEFAULT 'zioło';

-- Update existing records to set categories based on unit (temporary fallback)
UPDATE public.composition_ingredients 
SET category = CASE 
    WHEN unit = 'krople' OR unit = 'ml' THEN 'olejek'
    WHEN unit = 'szt' OR unit = 'kpl' THEN 'inne'
    ELSE 'zioło'
END;
