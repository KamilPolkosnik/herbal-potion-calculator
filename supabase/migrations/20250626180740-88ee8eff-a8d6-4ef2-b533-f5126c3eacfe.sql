
-- Create a table for sales transactions
CREATE TABLE public.sales_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  composition_id UUID NOT NULL REFERENCES public.compositions(id) ON DELETE CASCADE,
  composition_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_reversed BOOLEAN NOT NULL DEFAULT false,
  reversed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create index for better performance
CREATE INDEX idx_sales_transactions_composition_id ON public.sales_transactions(composition_id);
CREATE INDEX idx_sales_transactions_created_at ON public.sales_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Enable read access for all users" ON public.sales_transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.sales_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.sales_transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.sales_transactions FOR DELETE USING (true);

-- Create a table to track ingredient usage in transactions
CREATE TABLE public.transaction_ingredient_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.sales_transactions(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_transaction_ingredient_usage_transaction_id ON public.transaction_ingredient_usage(transaction_id);

-- Enable RLS
ALTER TABLE public.transaction_ingredient_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON public.transaction_ingredient_usage FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.transaction_ingredient_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.transaction_ingredient_usage FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.transaction_ingredient_usage FOR DELETE USING (true);
