
-- Usuń istniejące polityki dla storage bucket cost-invoices
DROP POLICY IF EXISTS "Allow all users to upload cost invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow all users to view cost invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow all users to delete cost invoices" ON storage.objects;

-- Utwórz nowe, bardziej permisywne polityki dla storage bucket cost-invoices
CREATE POLICY "Allow public upload to cost-invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cost-invoices');

CREATE POLICY "Allow public select from cost-invoices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cost-invoices');

CREATE POLICY "Allow public delete from cost-invoices"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cost-invoices');

-- Ustaw bucket jako publiczny
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cost-invoices';
