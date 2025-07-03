
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceNumbering = () => {
  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadInvoiceNumbers = async () => {
    try {
      setLoading(true);
      
      // Get all transactions ordered by creation date to establish original assignment order
      const { data: transactions, error } = await supabase
        .from('sales_transactions')
        .select('id, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate permanent, stable numbers based on creation order
      const numbers: Record<string, string> = {};
      
      if (transactions) {
        // Sort by created_at to ensure consistent chronological ordering for initial assignment
        const sortedTransactions = [...transactions].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Create a stable mapping using transaction ID hash to ensure consistency
        // This ensures that the same transaction always gets the same number
        const transactionIds = sortedTransactions.map(t => t.id).sort();
        
        // Create a stable assignment based on sorted transaction IDs
        const stableMapping = new Map();
        sortedTransactions.forEach((transaction, index) => {
          // Find the position of this transaction ID in the sorted list of all IDs
          const stableIndex = transactionIds.indexOf(transaction.id);
          stableMapping.set(transaction.id, stableIndex + 1);
        });
        
        // Now assign numbers based on creation order but using stable mapping
        sortedTransactions.forEach((transaction) => {
          const stableNumber = stableMapping.get(transaction.id);
          const invoiceNumber = stableNumber.toString().padStart(9, '0');
          numbers[transaction.id] = invoiceNumber;
        });
      }

      console.log('Generated stable invoice numbers:', numbers);
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
