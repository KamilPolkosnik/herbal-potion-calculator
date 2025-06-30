
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { convertToBaseUnit, areUnitsCompatible } from '@/utils/unitConverter';

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
  street?: string;
  house_number?: string;
  apartment_number?: string;
  postal_code?: string;
  city?: string;
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

  const checkIngredientAvailability = async (
    compositionId: string,
    quantity: number
  ): Promise<{ available: boolean; missingIngredients: string[] }> => {
    try {
      // Get current ingredient amounts from database
      const { data: currentIngredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('name, amount, unit');

      if (ingredientsError) throw ingredientsError;

      // Get composition ingredients with their units
      const { data: compositionIngredients, error: compositionError } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name, amount, unit')
        .eq('composition_id', compositionId);

      if (compositionError) throw compositionError;

      if (!compositionIngredients || compositionIngredients.length === 0) {
        return { available: false, missingIngredients: ['Brak składników w zestawie'] };
      }

      // Create a map of current ingredient amounts with their units
      const availableAmounts: Record<string, { amount: number; unit: string }> = {};
      currentIngredients?.forEach(ingredient => {
        availableAmounts[ingredient.name] = {
          amount: ingredient.amount,
          unit: ingredient.unit
        };
      });

      const missingIngredients: string[] = [];

      for (const ingredient of compositionIngredients) {
        const availableData = availableAmounts[ingredient.ingredient_name];
        
        if (!availableData) {
          missingIngredients.push(`${ingredient.ingredient_name} (składnik nie istnieje w bazie)`);
          continue;
        }

        // Check if units are compatible
        if (!areUnitsCompatible(availableData.unit, ingredient.unit)) {
          console.warn(`Niezgodność jednostek dla ${ingredient.ingredient_name}: dostępne w ${availableData.unit}, wymagane w ${ingredient.unit}`);
          missingIngredients.push(
            `${ingredient.ingredient_name} (niezgodność jednostek: ${availableData.unit} vs ${ingredient.unit})`
          );
          continue;
        }

        // Convert both amounts to base units for comparison
        const availableInBaseUnit = convertToBaseUnit(availableData.amount, availableData.unit);
        const requiredPerUnit = convertToBaseUnit(ingredient.amount, ingredient.unit);
        const totalRequiredInBaseUnit = requiredPerUnit * quantity;

        console.log(`Sprawdzanie składnika ${ingredient.ingredient_name}:`, {
          availableAmount: availableData.amount,
          availableUnit: availableData.unit,
          availableInBaseUnit,
          requiredPerUnit: ingredient.amount,
          requiredUnit: ingredient.unit,
          requiredPerUnitInBaseUnit: requiredPerUnit,
          totalRequiredInBaseUnit,
          quantity
        });

        if (totalRequiredInBaseUnit > availableInBaseUnit) {
          const shortageInBaseUnit = totalRequiredInBaseUnit - availableInBaseUnit;
          missingIngredients.push(
            `${ingredient.ingredient_name} (dostępne: ${availableData.amount}${availableData.unit}, potrzebne: ${(requiredPerUnit * quantity).toFixed(2)}ml, brakuje: ${shortageInBaseUnit.toFixed(2)}ml)`
          );
        }
      }

      return {
        available: missingIngredients.length === 0,
        missingIngredients
      };
    } catch (error) {
      console.error('Error checking ingredient availability:', error);
      return { available: false, missingIngredients: ['Błąd sprawdzania dostępności'] };
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

      // Check ingredient availability first
      const { available, missingIngredients } = await checkIngredientAvailability(compositionId, quantity);
      
      if (!available) {
        throw new Error(`Niewystarczające składniki: ${missingIngredients.join(', ')}`);
      }

      // Build full address from components
      let fullAddress = '';
      if (buyerData?.street || buyerData?.house_number || buyerData?.city) {
        const addressParts = [];
        if (buyerData?.street) {
          let streetPart = buyerData.street;
          if (buyerData?.house_number) {
            streetPart += ` ${buyerData.house_number}`;
            if (buyerData?.apartment_number) {
              streetPart += `/${buyerData.apartment_number}`;
            }
          }
          addressParts.push(streetPart);
        }
        if (buyerData?.postal_code && buyerData?.city) {
          addressParts.push(`${buyerData.postal_code} ${buyerData.city}`);
        } else if (buyerData?.city) {
          addressParts.push(buyerData.city);
        }
        fullAddress = addressParts.join(', ');
      }

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
          buyer_address: fullAddress || null,
          buyer_tax_id: buyerData?.tax_id || null,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      console.log('Transaction created:', transaction);

      // Process each ingredient with proper unit conversion
      const ingredientUsages = [];
      const ingredientUpdates = [];

      for (const ingredient of ingredients) {
        // Convert ingredient amount to base unit for calculation
        const amountInBaseUnit = convertToBaseUnit(ingredient.amount, ingredient.unit);
        const totalUsedInBaseUnit = amountInBaseUnit * quantity;
        
        // Record ingredient usage in original units
        ingredientUsages.push({
          transaction_id: transaction.id,
          ingredient_name: ingredient.name,
          quantity_used: ingredient.amount * quantity, // Store in original units
          unit: ingredient.unit,
        });

        // Get current ingredient data
        const { data: currentIngredient, error: fetchError } = await supabase
          .from('ingredients')
          .select('amount, unit')
          .eq('name', ingredient.name)
          .single();

        if (fetchError) {
          console.error('Error fetching ingredient:', fetchError);
          continue;
        }

        // Convert current amount to base unit
        const currentAmountInBaseUnit = convertToBaseUnit(currentIngredient.amount, currentIngredient.unit);
        const newAmountInBaseUnit = Math.max(0, currentAmountInBaseUnit - totalUsedInBaseUnit);
        
        // Convert back to storage unit
        let newAmountInStorageUnit;
        if (currentIngredient.unit.toLowerCase().includes('krople') || currentIngredient.unit.toLowerCase().includes('kropli')) {
          // If stored in drops, convert ml back to drops
          newAmountInStorageUnit = newAmountInBaseUnit * 20;
        } else {
          newAmountInStorageUnit = newAmountInBaseUnit;
        }

        console.log(`Aktualizacja składnika ${ingredient.name}:`, {
          currentAmount: currentIngredient.amount,
          currentUnit: currentIngredient.unit,
          currentInBaseUnit: currentAmountInBaseUnit,
          usedInBaseUnit: totalUsedInBaseUnit,
          newInBaseUnit: newAmountInBaseUnit,
          newInStorageUnit: newAmountInStorageUnit
        });

        ingredientUpdates.push({
          name: ingredient.name,
          newAmount: newAmountInStorageUnit
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

      // Restore ingredient amounts with proper unit conversion
      for (const usage of usages || []) {
        const { data: currentIngredient, error: fetchError } = await supabase
          .from('ingredients')
          .select('amount, unit')
          .eq('name', usage.ingredient_name)
          .single();

        if (fetchError) {
          console.error('Error fetching ingredient for reversal:', fetchError);
          continue;
        }

        // Convert usage amount to base unit
        const usageInBaseUnit = convertToBaseUnit(usage.quantity_used, usage.unit);
        
        // Convert current amount to base unit
        const currentAmountInBaseUnit = convertToBaseUnit(currentIngredient.amount, currentIngredient.unit);
        
        // Add back the used amount
        const restoredAmountInBaseUnit = currentAmountInBaseUnit + usageInBaseUnit;
        
        // Convert back to storage unit
        let restoredAmountInStorageUnit;
        if (currentIngredient.unit.toLowerCase().includes('krople') || currentIngredient.unit.toLowerCase().includes('kropli')) {
          // If stored in drops, convert ml back to drops
          restoredAmountInStorageUnit = restoredAmountInBaseUnit * 20;
        } else {
          restoredAmountInStorageUnit = restoredAmountInBaseUnit;
        }

        const { error: restoreError } = await supabase
          .from('ingredients')
          .update({ amount: restoredAmountInStorageUnit })
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

  const deleteTransaction = async (transactionId: string) => {
    try {
      console.log('Deleting transaction:', transactionId);

      // Delete ingredient usages first (foreign key constraint)
      const { error: usageDeleteError } = await supabase
        .from('transaction_ingredient_usage')
        .delete()
        .eq('transaction_id', transactionId);

      if (usageDeleteError) throw usageDeleteError;

      // Delete the transaction
      const { error: transactionDeleteError } = await supabase
        .from('sales_transactions')
        .delete()
        .eq('id', transactionId);

      if (transactionDeleteError) throw transactionDeleteError;

      console.log('Transaction deleted successfully');
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
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
    deleteTransaction,
    checkIngredientAvailability,
    refreshTransactions: loadTransactions
  };
};
