
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { convertToBaseUnit } from '@/utils/unitConverter';

export interface Transaction {
  id: string;
  created_at: string;
  composition_id: string;
  composition_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_reversed: boolean;
  invoice_number: number;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_tax_id: string | null;
  buyer_address: string | null;
}

export type SalesTransaction = Transaction;

export interface BuyerData {
  name?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  street?: string;
  house_number?: string;
  apartment_number?: string;
  postal_code?: string;
  city?: string;
}

export const useSales = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować transakcji",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const processSale = async (
    compositionId: string,
    compositionName: string,
    quantity: number,
    unitPrice: number,
    buyerData: BuyerData = {},
    saleDate?: Date
  ) => {
    try {
      const totalPrice = quantity * unitPrice;

      let buyerAddress = null;
      if (buyerData.street || buyerData.house_number || buyerData.city || buyerData.postal_code) {
        const addressParts = [
          buyerData.street,
          buyerData.house_number,
          buyerData.apartment_number,
          buyerData.postal_code,
          buyerData.city
        ].filter(Boolean);
        buyerAddress = addressParts.join(', ');
      }

      const transactionData: any = {
        composition_id: compositionId,
        composition_name: compositionName,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        buyer_name: buyerData.name || null,
        buyer_email: buyerData.email || null,
        buyer_phone: buyerData.phone || null,
        buyer_tax_id: buyerData.tax_id || null,
        buyer_address: buyerAddress
      };

      if (saleDate) {
        transactionData.created_at = saleDate.toISOString();
      }

      const { data: transaction, error } = await supabase
        .from('sales_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukces",
        description: `Sprzedaż dla ${compositionName} została zarejestrowana`,
      });

      await loadTransactions();
      return transaction;
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zarejestrować sprzedaży",
        variant: "destructive",
      });
      return null;
    }
  };

  const reverseTransaction = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('sales_transactions')
        .update({ is_reversed: true })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Sukces",
        description: "Transakcja została cofnięta",
      });

      await loadTransactions();
    } catch (error) {
      console.error('Error reversing transaction:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się cofnąć transakcji",
        variant: "destructive",
      });
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('sales_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Sukces",
        description: "Transakcja została usunięta",
      });

      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć transakcji",
        variant: "destructive",
      });
    }
  };

  const checkIngredientAvailability = async (compositionId: string) => {
    try {
      const { data: compositionIngredients, error: compositionError } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name, amount, unit')
        .eq('composition_id', compositionId);

      if (compositionError) throw compositionError;

      if (!compositionIngredients || compositionIngredients.length === 0) {
        return { available: false, missingIngredients: ['Brak składników w zestawie'] };
      }

      const missingIngredients: string[] = [];

      for (const ingredient of compositionIngredients) {
        const { data: currentIngredient, error: ingredientError } = await supabase
          .from('ingredients')
          .select('amount, unit')
          .eq('name', ingredient.ingredient_name)
          .single();

        if (ingredientError) throw ingredientError;

        if (!currentIngredient) {
          missingIngredients.push(`${ingredient.ingredient_name} (składnik nie istnieje w bazie)`);
          continue;
        }

        if (currentIngredient.unit !== ingredient.unit) {
          console.warn(`Niezgodność jednostek dla ${ingredient.ingredient_name}: dostępne w ${currentIngredient.unit}, wymagane w ${ingredient.unit}`);
          missingIngredients.push(
            `${ingredient.ingredient_name} (niezgodność jednostek: ${currentIngredient.unit} vs ${ingredient.unit})`
          );
          continue;
        }

        if (currentIngredient.amount < ingredient.amount) {
          missingIngredients.push(
            `${ingredient.ingredient_name}: dostępne ${currentIngredient.amount}${currentIngredient.unit}, wymagane ${ingredient.amount}${ingredient.unit}`
          );
        }
      }

      const isAvailable = missingIngredients.length === 0;

      return {
        available: isAvailable,
        missingIngredients
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, missingIngredients: ['Błąd sprawdzania dostępności'] };
    }
  };

  const processCartSale = async (
    cartItems: Array<{
      compositionId: string;
      compositionName: string;
      quantity: number;
      unitPrice: number;
      ingredients: Array<{ name: string; amount: number; unit: string }>;
    }>,
    buyerData: BuyerData = {},
    saleDate?: Date
  ) => {
    try {
      console.log('Processing cart sale with items:', cartItems);
      console.log('Buyer data:', buyerData);
      console.log('Sale date:', saleDate);

      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      const compositionName = cartItems.map(item => 
        `${item.quantity}x ${item.compositionName}${item.unitPrice > 0 ? ` [${item.unitPrice.toFixed(2)}zł]` : ''}`
      ).join(', ');

      let buyerAddress = null;
      if (buyerData.street || buyerData.house_number || buyerData.city || buyerData.postal_code) {
        const addressParts = [
          buyerData.street,
          buyerData.house_number,
          buyerData.apartment_number,
          buyerData.postal_code,
          buyerData.city
        ].filter(Boolean);
        buyerAddress = addressParts.join(', ');
      }

      const mainCompositionId = cartItems[0].compositionId;

      const transactionData: any = {
        composition_id: mainCompositionId,
        composition_name: compositionName,
        quantity: totalQuantity,
        unit_price: totalPrice / totalQuantity,
        total_price: totalPrice,
        buyer_name: buyerData.name || null,
        buyer_email: buyerData.email || null,
        buyer_phone: buyerData.phone || null,
        buyer_tax_id: buyerData.tax_id || null,
        buyer_address: buyerAddress
      };

      if (saleDate) {
        transactionData.created_at = saleDate.toISOString();
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) throw transactionError;

      console.log('Transaction created:', transaction);

      const allIngredientUsage: Array<{
        transaction_id: string;
        ingredient_name: string;
        quantity_used: number;
        unit: string;
      }> = [];

      cartItems.forEach(cartItem => {
        cartItem.ingredients.forEach(ingredient => {
          const totalUsed = ingredient.amount * cartItem.quantity;
          allIngredientUsage.push({
            transaction_id: transaction.id,
            ingredient_name: ingredient.name,
            quantity_used: totalUsed,
            unit: ingredient.unit
          });
        });
      });

      if (allIngredientUsage.length > 0) {
        const { error: usageError } = await supabase
          .from('transaction_ingredient_usage')
          .insert(allIngredientUsage);

        if (usageError) throw usageError;
        console.log('Ingredient usage records created:', allIngredientUsage.length);
      }

      const ingredientUpdates: Record<string, { totalUsed: number; unit: string }> = {};
      
      allIngredientUsage.forEach(usage => {
        const key = usage.ingredient_name;
        if (!ingredientUpdates[key]) {
          ingredientUpdates[key] = { totalUsed: 0, unit: usage.unit };
        }
        ingredientUpdates[key].totalUsed += usage.quantity_used;
      });

      for (const [ingredientName, updateData] of Object.entries(ingredientUpdates)) {
        const { totalUsed, unit } = updateData;
        const totalUsedInBaseUnit = convertToBaseUnit(totalUsed, unit);
        
        const { error: updateError } = await supabase.rpc('update_ingredient_amount', {
          ingredient_name: ingredientName,
          amount_change: -totalUsedInBaseUnit
        });

        if (updateError) throw updateError;

        const { error: movementError } = await supabase
          .from('ingredient_movements')
          .insert({
            ingredient_name: ingredientName,
            movement_type: 'sale',
            quantity_change: -totalUsed,
            unit: unit,
            reference_id: transaction.id,
            reference_type: 'sale_transaction',
            notes: `Sprzedaż: ${compositionName}`
          });

        if (movementError) throw movementError;
      }

      console.log('Ingredient amounts updated for cart sale');

      await loadTransactions();

      return transaction;
    } catch (error) {
      console.error('Error processing cart sale:', error);
      throw error;
    }
  };

  const refreshTransactions = async () => {
    await loadTransactions();
  };

  return {
    transactions,
    loading,
    processSale,
    reverseTransaction,
    deleteTransaction,
    checkIngredientAvailability,
    processCartSale,
    refreshTransactions
  };
};
