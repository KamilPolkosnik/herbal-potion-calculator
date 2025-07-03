
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

      // Generate stable numbers based on creation order
      const numbers: Record<string, string> = {};
      
      if (transactions) {
        // Each transaction gets a number based on its chronological position
        // This ensures that once assigned, the number never changes
        transactions.forEach((transaction, index) => {
          const invoiceNumber = (index + 1).toString().padStart(9, '0');
          numbers[transaction.id] = invoiceNumber;
        });
      }

      console.log('Generated chronological invoice numbers:', numbers);
      setInvoiceNumbers(numbers);
    } catch (error) {
      console.error('Error loading invoice numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceNumber = (transactionId: string): string => {
    const number = invoiceNumbers[transactionId];
    console.log(`Getting invoice number for ${transactionId}: ${number || '000000000'}`);
    return number || '000000000';
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
