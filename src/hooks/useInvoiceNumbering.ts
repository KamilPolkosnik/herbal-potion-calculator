
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceNumbering = () => {
  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadInvoiceNumbers = async () => {
    try {
      setLoading(true);
      
      // Get all transactions ordered by creation date to establish chronological order
      const { data: transactions, error } = await supabase
        .from('sales_transactions')
        .select('id, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate stable numbers based on chronological order
      const numbers: Record<string, string> = {};
      
      if (transactions) {
        // Sort by created_at to ensure consistent chronological ordering
        const sortedTransactions = [...transactions].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Assign sequential numbers based on chronological position
        sortedTransactions.forEach((transaction, index) => {
          const invoiceNumber = (index + 1).toString().padStart(9, '0');
          numbers[transaction.id] = invoiceNumber;
        });
      }

      console.log('Generated invoice numbers:', numbers);
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
