
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SalesTransaction {
  id: string;
  composition_id: string;
  composition_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  is_reversed: boolean;
  reversed_at: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_address: string | null;
  buyer_tax_id: string | null;
}

export interface IngredientUsage {
  id: string;
  transaction_id: string;
  ingredient_name: string;
  quantity_used: number;
  unit: string;
  created_at: string;
}

export interface BuyerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
}

export const useSales = () => {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const processSale = async (
    compositionId: string,
    compositionName: string,
    quantity: number,
    unitPrice: number,
    ingredients: Array<{ name: string; amount: number; unit: string }>,
    buyerData?: BuyerData
  ) => {
    try {
      console.log('Processing sale:', { compositionId, compositionName, quantity, unitPrice, buyerData });

      // Start transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert({
          composition_id: compositionId,
          composition_name: compositionName,
          quantity,
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
          buyer_name: buyerData?.name || null,
          buyer_email: buyerData?.email || null,
          buyer_phone: buyerData?.phone || null,
          buyer_address: buyerData?.address || null,
          buyer_tax_id: buyerData?.tax_id || null,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      console.log('Transaction created:', transaction);

      // Process each ingredient
      const ingredientUsages = [];
      const ingredientUpdates = [];

      for (const ingredient of ingredients) {
        const totalUsed = ingredient.amount * quantity;
        
        // Record ingredient usage
        ingredientUsages.push({
          transaction_id: transaction.id,
          ingredient_name: ingredient.name,
          quantity_used: totalUsed,
          unit: ingredient.unit,
        });

        // Prepare ingredient update
        const { data: currentIngredient, error: fetchError } = await supabase
          .from('ingredients')
          .select('amount')
          .eq('name', ingredient.name)
          .single();

        if (fetchError) {
          console.error('Error fetching ingredient:', fetchError);
          continue;
        }

        const newAmount = Math.max(0, (currentIngredient?.amount || 0) - totalUsed);
        ingredientUpdates.push({
          name: ingredient.name,
          newAmount
        });
      }

      // Insert ingredient usages
      if (ingredientUsages.length > 0) {
        const { error: usageError } = await supabase
          .from('transaction_ingredient_usage')
          .insert(ingredientUsages);

        if (usageError) throw usageError;
      }

      // Update ingredient amounts
      for (const update of ingredientUpdates) {
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ amount: update.newAmount })
          .eq('name', update.name);

        if (updateError) {
          console.error('Error updating ingredient:', updateError);
        }
      }

      console.log('Sale processed successfully');
      await loadTransactions();
      return transaction;
    } catch (error) {
      console.error('Error processing sale:', error);
      throw error;
    }
  };

  const reverseTransaction = async (transactionId: string) => {
    try {
      console.log('Reversing transaction:', transactionId);

      // Get ingredient usages for this transaction
      const { data: usages, error: usagesError } = await supabase
        .from('transaction_ingredient_usage')
        .select('*')
        .eq('transaction_id', transactionId);

      if (usagesError) throw usagesError;

      // Restore ingredient amounts
      for (const usage of usages || []) {
        const { data: currentIngredient, error: fetchError } = await supabase
          .from('ingredients')
          .select('amount')
          .eq('name', usage.ingredient_name)
          .single();

        if (fetchError) {
          console.error('Error fetching ingredient for reversal:', fetchError);
          continue;
        }

        const restoredAmount = (currentIngredient?.amount || 0) + usage.quantity_used;

        const { error: restoreError } = await supabase
          .from('ingredients')
          .update({ amount: restoredAmount })
          .eq('name', usage.ingredient_name);

        if (restoreError) {
          console.error('Error restoring ingredient:', restoreError);
        }
      }

      // Mark transaction as reversed
      const { error: reverseError } = await supabase
        .from('sales_transactions')
        .update({ 
          is_reversed: true, 
          reversed_at: new Date().toISOString() 
        })
        .eq('id', transactionId);

      if (reverseError) throw reverseError;

      console.log('Transaction reversed successfully');
      await loadTransactions();
    } catch (error) {
      console.error('Error reversing transaction:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    transactions,
    loading,
    processSale,
    reverseTransaction,
    refreshTransactions: loadTransactions
  };
};
