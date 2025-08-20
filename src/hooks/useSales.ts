
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
  was_vat_registered: boolean;
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
  const [processing, setProcessing] = useState(false);
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
    vatRegistered?: boolean
  ) => {
    if (processing) {
      console.log('Sale already in progress, skipping...');
      return null;
    }

    try {
      setProcessing(true);
      console.log('Starting sale process for:', compositionName);
      
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
            was_vat_registered: vatRegistered ?? false,
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

      console.log('Sale transaction created successfully:', transaction.id);

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
    } finally {
      setProcessing(false);
    }
  };

  const reverseTransaction = async (transactionId: string) => {
    if (processing) {
      console.log('Another operation in progress, skipping reverse...');
      return;
    }

    try {
      setProcessing(true);
      console.log('Starting transaction reversal for:', transactionId);

      // First, get the transaction details to ensure it exists and isn't already reversed
      const { data: existingTransaction, error: fetchError } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('is_reversed', false)
        .single();

      if (fetchError) {
        console.error('Error fetching transaction:', fetchError);
        throw new Error('Nie można znaleźć transakcji lub została już cofnięta');
      }

      if (!existingTransaction) {
        throw new Error('Transakcja nie istnieje lub została już cofnięta');
      }

      // Get all ingredient usage for this transaction
      const { data: ingredientUsage, error: usageError } = await supabase
        .from('transaction_ingredient_usage')
        .select('*')
        .eq('transaction_id', transactionId);

      if (usageError) {
        console.error('Error fetching ingredient usage:', usageError);
        throw usageError;
      }

      console.log('Found ingredient usage records:', ingredientUsage?.length || 0);

      // Mark transaction as reversed
      const { error: reverseError } = await supabase
        .from('sales_transactions')
        .update({ 
          is_reversed: true,
          reversed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (reverseError) {
        console.error('Error marking transaction as reversed:', reverseError);
        throw reverseError;
      }

      console.log('Transaction marked as reversed');

      // Restore ingredients to stock
      if (ingredientUsage && ingredientUsage.length > 0) {
        for (const usage of ingredientUsage) {
          console.log(`Restoring ${usage.quantity_used}${usage.unit} of ${usage.ingredient_name}`);
          
          // Convert to base unit for amount update
          const quantityInBaseUnit = convertToBaseUnit(usage.quantity_used, usage.unit);
          
          // Restore ingredient amount using the database function
          const { error: updateError } = await supabase.rpc('update_ingredient_amount', {
            ingredient_name: usage.ingredient_name,
            amount_change: quantityInBaseUnit // Positive value to add back to stock
          });

          if (updateError) {
            console.error('Error updating ingredient amount:', usage.ingredient_name, updateError);
            throw updateError;
          }

          // Create reversal movement record
          const { error: movementError } = await supabase
            .from('ingredient_movements')
            .insert({
              ingredient_name: usage.ingredient_name,
              movement_type: 'reversal',
              quantity_change: usage.quantity_used, // Positive value in original unit
              unit: usage.unit,
              reference_id: transactionId,
              reference_type: 'sale_reversal',
              notes: `Cofnięcie sprzedaży: ${existingTransaction.composition_name}`
            });

          if (movementError) {
            console.error('Error creating movement record:', usage.ingredient_name, movementError);
            throw movementError;
          }

          console.log(`Successfully restored ${usage.quantity_used}${usage.unit} of ${usage.ingredient_name}`);
        }
      }

      console.log('Transaction reversal completed successfully');

      toast({
        title: "Sukces",
        description: "Transakcja została cofnięta i składniki przywrócone do magazynu",
      });

      await loadTransactions(); // Refresh transactions list
    } catch (error) {
      console.error('Error reversing transaction:', error);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się cofnąć transakcji",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (processing) {
      console.log('Another operation in progress, skipping delete...');
      return;
    }

    try {
      setProcessing(true);
      console.log('Deleting transaction:', transactionId);

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
    } finally {
      setProcessing(false);
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
    saleDate?: Date,
    vatRegistered?: boolean
  ) => {
    if (processing) {
      console.log('Sale already in progress, skipping cart sale...');
      throw new Error('Sprzedaż już w toku, proszę czekać...');
    }

    try {
      setProcessing(true);
      console.log('Processing cart sale with items:', cartItems.length);
      
      // Validate that we have items to process
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Brak produktów do sprzedaży');
      }

      // Calculate total quantity and price
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      // Create composition name by combining all items
      const compositionName = cartItems.map(item => 
        `${item.quantity}x ${item.compositionName}${item.unitPrice > 0 ? ` [${item.unitPrice.toFixed(2)}zł]` : ''}`
      ).join(', ');

      console.log('Cart sale summary:', {
        totalQuantity,
        totalPrice,
        compositionName,
        itemCount: cartItems.length
      });

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

      // Prepare the transaction data with proper typing
      const transactionData = {
        composition_id: mainCompositionId,
        composition_name: compositionName,
        quantity: totalQuantity,
        unit_price: totalQuantity > 0 ? totalPrice / totalQuantity : 0, // Average unit price
        total_price: totalPrice,
        was_vat_registered: vatRegistered ?? false,
        buyer_name: buyerData.name || null,
        buyer_email: buyerData.email || null,
        buyer_phone: buyerData.phone || null,
        buyer_tax_id: buyerData.tax_id || null,
        buyer_address: buyerAddress,
        ...(saleDate && { created_at: saleDate.toISOString() })
      };

      console.log('Creating transaction with data:', transactionData);

      // Create the main transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }

      console.log('Transaction created successfully:', transaction.id);

      // Create ingredient usage records for all cart items
      const allIngredientUsage: Array<{
        transaction_id: string;
        ingredient_name: string;
        quantity_used: number;
        unit: string;
      }> = [];

      // Collect all ingredient usage from cart items
      cartItems.forEach((cartItem, itemIndex) => {
        console.log(`Processing cart item ${itemIndex + 1}:`, cartItem.compositionName);
        cartItem.ingredients.forEach(ingredient => {
          const totalUsed = ingredient.amount * cartItem.quantity;
          allIngredientUsage.push({
            transaction_id: transaction.id,
            ingredient_name: ingredient.name,
            quantity_used: totalUsed,
            unit: ingredient.unit
          });
          console.log(`- ${ingredient.name}: ${totalUsed}${ingredient.unit}`);
        });
      });

      console.log('Total ingredient usage records to create:', allIngredientUsage.length);

      // Insert ingredient usage records
      if (allIngredientUsage.length > 0) {
        const { error: usageError } = await supabase
          .from('transaction_ingredient_usage')
          .insert(allIngredientUsage);

        if (usageError) {
          console.error('Usage error:', usageError);
          throw usageError;
        }
        console.log('Ingredient usage records created successfully');
      }

      // Update ingredient amounts and create movements
      const ingredientUpdates: Record<string, { totalUsed: number; unit: string }> = {};
      
      // Aggregate ingredient usage by name
      allIngredientUsage.forEach(usage => {
        const key = usage.ingredient_name;
        if (!ingredientUpdates[key]) {
          ingredientUpdates[key] = { totalUsed: 0, unit: usage.unit };
        }
        ingredientUpdates[key].totalUsed += usage.quantity_used;
      });

      console.log('Aggregated ingredient updates:', Object.keys(ingredientUpdates).length);

      // Update ingredient amounts and create movement records
      for (const [ingredientName, { totalUsed, unit }] of Object.entries(ingredientUpdates)) {
        console.log(`Updating ${ingredientName}: -${totalUsed}${unit}`);
        
        // Convert to base unit for amount update
        const totalUsedInBaseUnit = convertToBaseUnit(totalUsed, unit);
        
        // Update ingredient amount (subtract from stock)
        const { error: updateError } = await supabase.rpc('update_ingredient_amount', {
          ingredient_name: ingredientName,
          amount_change: -totalUsedInBaseUnit // Negative value to subtract from stock
        });

        if (updateError) {
          console.error('Update error for', ingredientName, ':', updateError);
          throw updateError;
        }

        // Create movement record with original unit
        const { error: movementError } = await supabase
          .from('ingredient_movements')
          .insert({
            ingredient_name: ingredientName,
            movement_type: 'sale',
            quantity_change: -totalUsed, // Negative value in original unit
            unit: unit,
            reference_id: transaction.id,
            reference_type: 'sale_transaction',
            notes: `Sprzedaż: ${compositionName}`
          });

        if (movementError) {
          console.error('Movement error for', ingredientName, ':', movementError);
          throw movementError;
        }

        console.log(`Successfully updated ${ingredientName}`);
      }

      console.log('Cart sale completed successfully');

      // Refresh transactions list
      await loadTransactions();

      return transaction;
    } catch (error) {
      console.error('Error processing cart sale:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const refreshTransactions = async () => {
    await loadTransactions();
  };

  return {
    transactions,
    loading,
    processing,
    processSale,
    reverseTransaction,
    deleteTransaction,
    checkIngredientAvailability,
    processCartSale,
    refreshTransactions
  };
};
