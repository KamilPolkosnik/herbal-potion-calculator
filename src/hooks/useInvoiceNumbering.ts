
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceNumbering = () => {
  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});
  const [correctionNumbers, setCorrectionNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadInvoiceNumbers = async () => {
    try {
      setLoading(true);
      
      // Get all transactions with their assigned invoice numbers
      const { data: transactions, error } = await supabase
        .from('sales_transactions')
        .select('id, invoice_number, is_reversed');

      if (error) throw error;

      // Map transaction IDs to their invoice numbers
      const numbers: Record<string, string> = {};
      const correctionNums: Record<string, string> = {};
      
      if (transactions) {
        transactions.forEach((transaction) => {
          // Format regular invoice number with leading zeros
          const invoiceNumber = transaction.invoice_number.toString().padStart(9, '0');
          numbers[transaction.id] = invoiceNumber;
          
          // For now, we'll assign correction numbers when needed
          // This will be handled in assignCorrectionNumber function
        });
      }

      console.log('Loaded invoice numbers from database:', numbers);
      console.log('Loaded correction numbers from database:', correctionNums);
      setInvoiceNumbers(numbers);
      setCorrectionNumbers(correctionNums);
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

  const getCorrectionNumber = (transactionId: string): string => {
    const number = correctionNumbers[transactionId];
    console.log(`Getting correction number for ${transactionId}: ${number || 'K/000000000'}`);
    return number || 'K/000000000';
  };

  const assignCorrectionNumber = async (transactionId: string): Promise<string> => {
    try {
      // For now, we'll generate a simple sequential number
      // This should be replaced with proper database sequence when the column exists
      const existingNumbers = Object.values(correctionNumbers);
      const nextNumber = existingNumbers.length + 1;
      
      // Format the correction number
      const formattedNumber = `K/${nextNumber.toString().padStart(9, '0')}`;
      
      // Update local state
      setCorrectionNumbers(prev => ({
        ...prev,
        [transactionId]: formattedNumber
      }));
      
      return formattedNumber;
    } catch (error) {
      console.error('Error assigning correction number:', error);
      return 'K/000000000';
    }
  };

  useEffect(() => {
    loadInvoiceNumbers();
  }, []);

  return {
    invoiceNumbers,
    correctionNumbers,
    loading,
    getInvoiceNumber,
    getCorrectionNumber,
    assignCorrectionNumber,
    refreshInvoiceNumbers: loadInvoiceNumbers
  };
};
