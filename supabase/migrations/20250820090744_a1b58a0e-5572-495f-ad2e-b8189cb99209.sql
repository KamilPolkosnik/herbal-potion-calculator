-- Add column to remember VAT registration status at time of sale
ALTER TABLE public.sales_transactions 
ADD COLUMN was_vat_registered boolean NOT NULL DEFAULT false;

-- Update existing transactions based on current company settings
UPDATE public.sales_transactions 
SET was_vat_registered = (
  SELECT COALESCE(is_vat_registered, false) 
  FROM public.company_settings 
  LIMIT 1
);