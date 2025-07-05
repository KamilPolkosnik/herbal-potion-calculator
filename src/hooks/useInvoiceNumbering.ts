
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceNumbering = () => {
  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadInvoiceNumbers = async () => {
    try {
      setLoading(true);
      
      // Get all transactions with their assigned invoice numbers
      const { data: transactions, error } = await supabase
        .from('sales_transactions')
        .select('id, invoice_number');

      if (error) throw error;

      // Map transaction IDs to their invoice numbers
      const numbers: Record<string, string> = {};
      
      if (transactions) {
        transactions.forEach((transaction) => {
          // Format invoice number with leading zeros
          const invoiceNumber = transaction.invoice_number.toString().padStart(9, '0');
          numbers[transaction.id] = invoiceNumber;
        });
      }

      console.log('Loaded invoice numbers from database:', numbers);
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
