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

// Export SalesTransaction as alias for backward compatibility
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
    buyerData: BuyerData = {}
  ) => {
    try {
      const totalPrice = quantity * unitPrice;

      // Create buyer address if address components exist
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

      const { data: transaction, error } = await supabase
        .from('sales_transactions')
        .insert([
          {
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
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukces",
        description: `Sprzedaż dla ${compositionName} została zarejestrowana`,
      });

      await loadTransactions(); // Refresh transactions list
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

      await loadTransactions(); // Refresh transactions list
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

      await loadTransactions(); // Refresh transactions list
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

        // Check if units are compatible - both should be ml for oils now
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

      // Calculate total quantity and price
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      // Create composition name by combining all items
      const compositionName = cartItems.map(item => 
        `${item.quantity}x ${item.compositionName}${item.unitPrice > 0 ? ` [${item.unitPrice.toFixed(2)}zł]` : ''}`
      ).join(', ');

      // Create buyer address if address components exist
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

      // Use the first composition ID for the main transaction
      const mainCompositionId = cartItems[0].compositionId;

      // Insert the transaction record with custom date if provided
      const transactionInsert: any = {
        composition_id: mainCompositionId,
        composition_name: compositionName,
        quantity: totalQuantity,
        unit_price: totalPrice / totalQuantity, // Average unit price
        total_price: totalPrice,
        buyer_name: buyerData.name || null,
        buyer_email: buyerData.email || null,
        buyer_phone: buyerData.phone || null,
        buyer_tax_id: buyerData.tax_id || null,
        buyer_address: buyerAddress
      };

      if (saleDate) {
        transactionInsert.created_at = saleDate.toISOString();
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert(transactionInsert)
        .select()
        .single();

      if (transactionError) throw transactionError;

      console.log('Transaction created:', transaction);

      // Create ingredient usage records for all cart items
      const allIngredientUsage: Array<{
        transaction_id: string;
        ingredient_name: string;
        quantity_used: number;
        unit: string;
      }> = [];

      // Collect all ingredient usage from cart items
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

      // Insert ingredient usage records
      if (allIngredientUsage.length > 0) {
        const { error: usageError } = await supabase
          .from('transaction_ingredient_usage')
          .insert(allIngredientUsage);

        if (usageError) throw usageError;
        console.log('Ingredient usage records created:', allIngredientUsage.length);
      }

      // Update ingredient amounts and create movements
      const ingredientUpdates: Record<string, { totalUsed: number; unit: string }> = {};
      
      // Aggregate ingredient usage
      allIngredientUsage.forEach(usage => {
        const key = usage.ingredient_name;
        if (!ingredientUpdates[key]) {
          ingredientUpdates[key] = { totalUsed: 0, unit: usage.unit };
        }
        ingredientUpdates[key].totalUsed += usage.quantity_used;
      });

      // Update ingredient amounts and create movement records
      for (const [ingredientName, { totalUsed, unit }] of Object.entries(ingredientUpdates)) {
        // Convert to base unit for amount update
        const totalUsedInBaseUnit = convertToBaseUnit(totalUsed, unit);
        
        // Update ingredient amount
        const { error: updateError } = await supabase.rpc('update_ingredient_amount', {
          ingredient_name: ingredientName,
          amount_change: -totalUsedInBaseUnit
        });

        if (updateError) throw updateError;

        // Create movement record with original unit
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

      // Refresh transactions list
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
