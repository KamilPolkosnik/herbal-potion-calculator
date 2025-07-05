
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceNumbering = () => {
  const [nextCorrectionNumber, setNextCorrectionNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const getNextCorrectionNumber = async (): Promise<string> => {
    try {
      // Pobierz wszystkie transakcje cofnięte, posortowane według reversed_at
      const { data: reversedTransactions, error } = await supabase
        .from('sales_transactions')
        .select('id, reversed_at')
        .eq('is_reversed', true)
        .not('reversed_at', 'is', null)
        .order('reversed_at', { ascending: true });

      if (error) throw error;

      // Numer korekty to liczba cofniętych transakcji + 1
      const correctionNumber = (reversedTransactions?.length || 0) + 1;
      
      return `K/${correctionNumber.toString().padStart(9, '0')}`;
    } catch (error) {
      console.error('Error getting next correction number:', error);
      return `K/${Date.now().toString().padStart(9, '0')}`;
    }
  };

  const loadNextCorrectionNumber = async () => {
    try {
      const { data: reversedTransactions, error } = await supabase
        .from('sales_transactions')
        .select('id')
        .eq('is_reversed', true)
        .not('reversed_at', 'is', null);

      if (error) throw error;

      setNextCorrectionNumber((reversedTransactions?.length || 0) + 1);
    } catch (error) {
      console.error('Error loading next correction number:', error);
      setNextCorrectionNumber(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNextCorrectionNumber();
  }, []);

  return {
    nextCorrectionNumber,
    loading,
    getNextCorrectionNumber,
    refreshCorrectionNumber: loadNextCorrectionNumber
  };
};
