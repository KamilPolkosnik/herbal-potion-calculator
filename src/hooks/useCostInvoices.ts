
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CostInvoice {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  invoice_month: number;
  invoice_year: number;
  description?: string;
  amount?: number;
  created_at: string;
  updated_at: string;
}

export const useCostInvoices = () => {
  const [invoices, setInvoices] = useState<CostInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cost_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching cost invoices:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać faktur kosztowych",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadInvoice = async (
    file: File,
    month: number,
    year: number,
    description?: string,
    amount?: number
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${year}/${month}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('cost-invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('cost_invoices')
        .insert({
          file_name: fileName,
          original_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          invoice_month: month,
          invoice_year: year,
          description,
          amount,
        });

      if (dbError) throw dbError;

      toast({
        title: "Sukces",
        description: "Faktura została przesłana",
      });

      await fetchInvoices();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać faktury",
        variant: "destructive",
      });
    }
  };

  const downloadInvoice = async (invoice: CostInvoice) => {
    try {
      const { data, error } = await supabase.storage
        .from('cost-invoices')
        .download(invoice.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = invoice.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać faktury",
        variant: "destructive",
      });
    }
  };

  const previewInvoice = async (invoice: CostInvoice) => {
    try {
      const { data, error } = await supabase.storage
        .from('cost-invoices')
        .download(invoice.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error previewing invoice:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się wyświetlić podglądu faktury",
        variant: "destructive",
      });
    }
  };

  const deleteInvoice = async (invoice: CostInvoice) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('cost-invoices')
        .remove([invoice.file_path]);

      if (storageError) throw storageError;

      // Delete record from database
      const { error: dbError } = await supabase
        .from('cost_invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) throw dbError;

      toast({
        title: "Sukces",
        description: "Faktura została usunięta",
      });

      await fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć faktury",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    loading,
    uploadInvoice,
    downloadInvoice,
    previewInvoice,
    deleteInvoice,
    refreshInvoices: fetchInvoices,
  };
};
