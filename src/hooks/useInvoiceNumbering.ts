
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceNumbering = () => {
  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadInvoiceNumbers = async () => {
    try {
      setLoading(true);
      
      // Get all transactions ordered by creation date to establish original order
      const { data: transactions, error } = await supabase
        .from('sales_transactions')
        .select('id, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate numbers based on UUID to ensure stability
      const numbers: Record<string, string> = {};
      
      if (transactions) {
        // Create a map of transaction IDs with their chronological position
        const sortedTransactionIds = transactions.map(t => t.id);
        
        // For each transaction, generate a stable number based on its position in the chronological order
        sortedTransactionIds.forEach((transactionId, index) => {
          const invoiceNumber = (index + 1).toString().padStart(9, '0');
          numbers[transactionId] = invoiceNumber;
        });
      }

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
