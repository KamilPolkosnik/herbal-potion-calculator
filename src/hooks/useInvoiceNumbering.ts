
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceNumbering = () => {
  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadInvoiceNumbers = async () => {
    try {
      setLoading(true);
      
      // Get all transactions ordered by creation date
      const { data: transactions, error } = await supabase
        .from('sales_transactions')
        .select('id, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate sequential numbers based on chronological order
      const numbers: Record<string, string> = {};
      transactions?.forEach((transaction, index) => {
        const invoiceNumber = (index + 1).toString().padStart(9, '0');
        numbers[transaction.id] = invoiceNumber;
      });

      setInvoiceNumbers(numbers);
    } catch (error) {
      console.error('Error loading invoice numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceNumber = (transactionId: string): string => {
    return invoiceNumbers[transactionId] || '000000000';
  };

  useEffect(() => {
    loadInvoiceNumbers();
  }, []);

  return {
    invoiceNumbers,
    loading,
    getInvoiceNumber,
    refreshInvoiceNumbers: loadInvoiceNumbers
  };
};
