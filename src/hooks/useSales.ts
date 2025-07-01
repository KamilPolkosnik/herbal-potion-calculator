
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
    quantity: number,
    cartItems: Array<{
      compositionId: string;
      quantity: number;
      ingredients: Array<{ name: string; amount: number; unit: string }>;
    }> = []
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

      // Calculate total reserved amounts from cart
      const reservedAmounts: Record<string, number> = {};
      cartItems.forEach(cartItem => {
        cartItem.ingredients.forEach(ingredient => {
          const amountInBaseUnit = convertToBaseUnit(ingredient.amount, ingredient.unit);
          const totalUsedInBaseUnit = amountInBaseUnit * cartItem.quantity;
          
          if (!reservedAmounts[ingredient.name]) {
            reservedAmounts[ingredient.name] = 0;
          }
          reservedAmounts[ingredient.name] += totalUsedInBaseUnit;
        });
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
        const reservedForThisIngredient = reservedAmounts[ingredient.ingredient_name] || 0;
        const effectiveAvailable = availableInBaseUnit - reservedForThisIngredient;

        console.log(`Sprawdzanie składnika ${ingredient.ingredient_name}:`, {
          availableAmount: availableData.amount,
          availableUnit: availableData.unit,
          availableInBaseUnit,
          reservedInBaseUnit: reservedForThisIngredient,
          effectiveAvailable,
          requiredPerUnit: ingredient.amount,
          requiredUnit: ingredient.unit,
          requiredPerUnitInBaseUnit: requiredPerUnit,
          totalRequiredInBaseUnit,
          quantity
        });

        if (totalRequiredInBaseUnit > effectiveAvailable) {
          const shortageInBaseUnit = totalRequiredInBaseUnit - effectiveAvailable;
          const statusText = reservedForThisIngredient > 0 ? 
            `dostępne: ${effectiveAvailable.toFixed(2)}ml, w rezerwacji: ${reservedForThisIngredient.toFixed(2)}ml` : 
            `dostępne: ${availableData.amount}${availableData.unit}`;
          
          missingIngredients.push(
            `${ingredient.ingredient_name} (${statusText}, potrzebne: ${(requiredPerUnit * quantity).toFixed(2)}ml, brakuje: ${shortageInBaseUnit.toFixed(2)}ml)`
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

  const processCartSale = async (
    cartItems: Array<{
      compositionId: string;
      compositionName: string;
      quantity: number;
      unitPrice: number;
      ingredients: Array<{ name: string; amount: number; unit: string }>;
    }>,
    buyerData?: BuyerData
  ) => {
    try {
      console.log('Processing cart sale:', { cartItems, buyerData });

      // Sprawdź dostępność składników dla całego koszyka
      const totalIngredientUsage: Record<string, { amount: number; unit: string }> = {};
      
      // Zsumuj użycie składników z całego koszyka
      cartItems.forEach(item => {
        item.ingredients.forEach(ingredient => {
          const amountInBaseUnit = convertToBaseUnit(ingredient.amount, ingredient.unit);
          const totalUsedInBaseUnit = amountInBaseUnit * item.quantity;
          
          if (!totalIngredientUsage[ingredient.name]) {
            totalIngredientUsage[ingredient.name] = { amount: 0, unit: 'ml' };
          }
          totalIngredientUsage[ingredient.name].amount += totalUsedInBaseUnit;
        });
      });

      // Sprawdź dostępność dla zsumowanych składników
      const { data: currentIngredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('name, amount, unit');

      if (ingredientsError) throw ingredientsError;

      const availableAmounts: Record<string, { amount: number; unit: string }> = {};
      currentIngredients?.forEach(ingredient => {
        availableAmounts[ingredient.name] = {
          amount: ingredient.amount,
          unit: ingredient.unit
        };
      });

      const missingIngredients: string[] = [];
      
      Object.entries(totalIngredientUsage).forEach(([ingredientName, usage]) => {
        const availableData = availableAmounts[ingredientName];
        
        if (!availableData) {
          missingIngredients.push(`${ingredientName} (składnik nie istnieje w bazie)`);
          return;
        }

        const availableInBaseUnit = convertToBaseUnit(availableData.amount, availableData.unit);
        
        if (usage.amount > availableInBaseUnit) {
          const shortageInBaseUnit = usage.amount - availableInBaseUnit;
          missingIngredients.push(
            `${ingredientName} (dostępne: ${availableData.amount}${availableData.unit}, potrzebne: ${usage.amount.toFixed(2)}ml, brakuje: ${shortageInBaseUnit.toFixed(2)}ml)`
          );
        }
      });

      if (missingIngredients.length > 0) {
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

      // Oblicz łączną wartość koszyka
      const totalCartValue = cartItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);

      // NAPRAWKA: Dodaj ceny do nazw produktów dla poprawnych obliczeń VAT na fakturze
      const compositionNames = cartItems.map(item => 
        `${item.quantity}x ${item.compositionName} [${item.unitPrice.toFixed(2)}zł]`
      ).join(', ');
      
      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert({
          composition_id: cartItems[0].compositionId, // Używamy ID pierwszego produktu jako referencję
          composition_name: compositionNames, // Łączymy nazwy wszystkich produktów z cenami
          quantity: cartItems.reduce((total, item) => total + item.quantity, 0), // Suma wszystkich ilości
          unit_price: totalCartValue / cartItems.reduce((total, item) => total + item.quantity, 0), // Średnia cena jednostkowa
          total_price: totalCartValue,
          buyer_name: buyerData?.name || null,
          buyer_email: buyerData?.email || null,
          buyer_phone: buyerData?.phone || null,
          buyer_address: fullAddress || null,
          buyer_tax_id: buyerData?.tax_id || null,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      console.log('Cart transaction created:', transaction);

      // Przetwórz wszystkie składniki z koszyka
      const allIngredientUsages = [];
      const ingredientUpdates = [];

      cartItems.forEach(item => {
        item.ingredients.forEach(ingredient => {
          const amountInBaseUnit = convertToBaseUnit(ingredient.amount, ingredient.unit);
          const totalUsedInBaseUnit = amountInBaseUnit * item.quantity;
          
          // Zapisz użycie składnika w oryginalnych jednostkach
          allIngredientUsages.push({
            transaction_id: transaction.id,
            ingredient_name: ingredient.name,
            quantity_used: ingredient.amount * item.quantity,
            unit: ingredient.unit,
          });

          // Znajdź istniejący update dla tego składnika lub utwórz nowy
          let existingUpdate = ingredientUpdates.find(update => update.name === ingredient.name);
          if (!existingUpdate) {
            existingUpdate = {
              name: ingredient.name,
              totalUsedInBaseUnit: 0
            };
            ingredientUpdates.push(existingUpdate);
          }
          existingUpdate.totalUsedInBaseUnit += totalUsedInBaseUnit;
        });
      });

      // Wstaw rekordy użycia składników
      if (allIngredientUsages.length > 0) {
        const { error: usageError } = await supabase
          .from('transaction_ingredient_usage')
          .insert(allIngredientUsages);

        if (usageError) throw usageError;
      }

      // Aktualizuj ilości składników
      for (const update of ingredientUpdates) {
        const { data: currentIngredient, error: fetchError } = await supabase
          .from('ingredients')
          .select('amount, unit')
          .eq('name', update.name)
          .single();

        if (fetchError) {
          console.error('Error fetching ingredient:', fetchError);
          continue;
        }

        const currentAmountInBaseUnit = convertToBaseUnit(currentIngredient.amount, currentIngredient.unit);
        const newAmountInBaseUnit = Math.max(0, currentAmountInBaseUnit - update.totalUsedInBaseUnit);
        
        let newAmountInStorageUnit;
        if (currentIngredient.unit.toLowerCase().includes('krople') || currentIngredient.unit.toLowerCase().includes('kropli')) {
          newAmountInStorageUnit = newAmountInBaseUnit * 20;
        } else {
          newAmountInStorageUnit = newAmountInBaseUnit;
        }

        console.log(`Aktualizacja składnika ${update.name}:`, {
          currentAmount: currentIngredient.amount,
          currentUnit: currentIngredient.unit,
          currentInBaseUnit: currentAmountInBaseUnit,
          usedInBaseUnit: update.totalUsedInBaseUnit,
          newInBaseUnit: newAmountInBaseUnit,
          newInStorageUnit: newAmountInStorageUnit
        });

        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ amount: newAmountInStorageUnit })
          .eq('name', update.name);

        if (updateError) {
          console.error('Error updating ingredient:', updateError);
        }
      }

      console.log('Cart sale processed successfully');
      await loadTransactions();
      return transaction;
    } catch (error) {
      console.error('Error processing cart sale:', error);
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

        // NAPRAWKA: Konwertuj ilość użytą do jednostki bazowej
        const usageInBaseUnit = convertToBaseUnit(usage.quantity_used, usage.unit);
        
        // Konwertuj obecną ilość do jednostki bazowej
        const currentAmountInBaseUnit = convertToBaseUnit(currentIngredient.amount, currentIngredient.unit);
        
        // Dodaj z powrotem użytą ilość
        const restoredAmountInBaseUnit = currentAmountInBaseUnit + usageInBaseUnit;
        
        // Konwertuj z powrotem do jednostki przechowywania
        let restoredAmountInStorageUnit;
        if (currentIngredient.unit.toLowerCase().includes('krople') || currentIngredient.unit.toLowerCase().includes('kropli')) {
          // Jeśli przechowywane w kroplach, konwertuj ml z powrotem na krople
          restoredAmountInStorageUnit = restoredAmountInBaseUnit * 20;
        } else {
          // Jeśli przechowywane w ml lub innych jednostkach
          restoredAmountInStorageUnit = restoredAmountInBaseUnit;
        }

        console.log(`Cofanie dla składnika ${usage.ingredient_name}:`, {
          usageAmount: usage.quantity_used,
          usageUnit: usage.unit,
          usageInBaseUnit,
          currentAmount: currentIngredient.amount,
          currentUnit: currentIngredient.unit,
          currentInBaseUnit: currentAmountInBaseUnit,
          restoredInBaseUnit: restoredAmountInBaseUnit,
          restoredInStorageUnit: restoredAmountInStorageUnit
        });

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
    processCartSale,
    reverseTransaction,
    deleteTransaction,
    checkIngredientAvailability,
    refreshTransactions: loadTransactions
  };
};
