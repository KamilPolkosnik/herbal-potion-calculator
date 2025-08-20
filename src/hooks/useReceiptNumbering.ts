import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useReceiptNumbering = () => {
  const [receiptNumbers, setReceiptNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadReceiptNumbers = async () => {
    try {
      setLoading(true);
      
      // Get all transactions with their assigned receipt numbers
      const { data: transactions, error } = await supabase
        .from('sales_transactions')
        .select('id, receipt_number')
        .not('receipt_number', 'is', null);

      if (error) throw error;

      // Map transaction IDs to their receipt numbers
      const numbers: Record<string, string> = {};
      
      if (transactions) {
        transactions.forEach((transaction) => {
          // Format receipt number with leading zeros and R/ prefix
          const receiptNumber = `R/${transaction.receipt_number.toString().padStart(9, '0')}`;
          numbers[transaction.id] = receiptNumber;
        });
      }

      console.log('Loaded receipt numbers from database:', numbers);
      setReceiptNumbers(numbers);
    } catch (error) {
      console.error('Error loading receipt numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReceiptNumber = (transactionId: string): string => {
    const number = receiptNumbers[transactionId];
    console.log(`Getting receipt number for ${transactionId}: ${number || ''}`);
    return number || '';
  };

  const assignReceiptNumber = async (transactionId: string): Promise<string> => {
    try {
      console.log(`Assigning receipt number for transaction ${transactionId}`);
      
      // Call the RPC function to assign receipt number atomically
      const { data: receiptNumber, error } = await supabase
        .rpc('assign_receipt_number', { p_transaction_id: transactionId });

      if (error) throw error;

      // Format the receipt number
      const formattedNumber = `R/${receiptNumber.toString().padStart(9, '0')}`;
      
      console.log(`Assigned receipt number: ${formattedNumber}`);
      
      // Update local state
      setReceiptNumbers(prev => ({
        ...prev,
        [transactionId]: formattedNumber
      }));
      
      return formattedNumber;
    } catch (error) {
      console.error('Error assigning receipt number:', error);
      return 'R/000000000';
    }
  };

  useEffect(() => {
    loadReceiptNumbers();
  }, []);

  return {
    receiptNumbers,
    loading,
    getReceiptNumber,
    assignReceiptNumber,
    refreshReceiptNumbers: loadReceiptNumbers
  };
};