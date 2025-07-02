
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { convertToBaseUnit, areUnitsCompatible } from '@/utils/unitConverter';
import { useIngredientMovements } from './useIngredientMovements';

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
  const { recordMovement } = useIngredientMovements();

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
      const { data: currentIngredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('name, amount, unit');

      if (ingredientsError) throw ingredientsError;

      const { data: compositionIngredients, error: compositionError } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name, amount, unit')
        .eq('composition_id', compositionId);

      if (compositionError) throw compositionError;

      if (!compositionIngredients || compositionIngredients.length === 0) {
        return { available: false, missingIngredients: ['Brak składników w zestawie'] };
      }

      const availableAmounts: Record<string, { amount: number; unit: string }> = {};
      currentIngredients?.forEach(ingredient => {
        availableAmounts[ingredient.name] = {
          amount: ingredient.amount,
          unit: ingredient.unit
        };
      });

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

        if (!areUnitsCompatible(availableData.unit, ingredient.unit)) {
          console.warn(`Niezgodność jednostek dla ${ingredient.ingredient_name}: dostępne w ${availableData.unit}, wymagane w ${ingredient.unit}`);
          missingIngredients.push(
            `${ingredient.ingredient_name} (niezgodność jednostek: ${availableData.unit} vs ${ingredient.unit})`
          );
          continue;
        }

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

      const { available, missingIngredients } = await checkIngredientAvailability(compositionId, quantity);
      
      if (!available) {
        throw new Error(`Niewystarczające składniki: ${missingIngredients.join(', ')}`);
      }

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

      // NAPRAWKA: Ujednolicenie zapisu użycia składników
      const ingredientUsages = [];
      const ingredientUpdates = [];

      for (const ingredient of ingredients) {
        const totalUsedInOriginalUnit = ingredient.amount * quantity;
        const amountInBaseUnit = convertToBaseUnit(ingredient.amount, ingredient.unit);
        const totalUsedInBaseUnit = amountInBaseUnit * quantity;
        
        // Zapisz użycie w oryginalnych jednostkach (jak w recepturze)
        ingredientUsages.push({
          transaction_id: transaction.id,
          ingredient_name: ingredient.name,
          quantity_used: totalUsedInOriginalUnit,
          unit: ingredient.unit,
        });

        const { data: currentIngredient, error: fetchError } = await supabase
          .from('ingredients')
          .select('amount, unit')
          .eq('name', ingredient.name)
          .single();

        if (fetchError) {
          console.error('Error fetching ingredient:', fetchError);
          continue;
        }

        const currentAmountInBaseUnit = convertToBaseUnit(currentIngredient.amount, currentIngredient.unit);
        const newAmountInBaseUnit = Math.max(0, currentAmountInBaseUnit - totalUsedInBaseUnit);
        
        let newAmountInStorageUnit;
        if (currentIngredient.unit.toLowerCase().includes('krople') || currentIngredient.unit.toLowerCase().includes('kropli')) {
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
          newAmount: newAmountInStorageUnit,
          usedAmount: totalUsedInBaseUnit,
          unit: currentIngredient.unit
        });
      }

      if (ingredientUsages.length > 0) {
        const { error: usageError } = await supabase
          .from('transaction_ingredient_usage')
          .insert(ingredientUsages);

        if (usageError) throw usageError;
      }

      // Aktualizuj składniki i zapisz ruchy magazynowe
      for (const update of ingredientUpdates) {
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ amount: update.newAmount })
          .eq('name', update.name);

        if (updateError) {
          console.error('Error updating ingredient:', updateError);
          continue;
        }

        // Zapisz ruch magazynowy
        await recordMovement(
          update.name,
          'sale',
          -update.usedAmount, // Ujemna wartość dla sprzedaży
          update.unit,
          transaction.id,
          'sales_transaction',
          `Sprzedaż: ${compositionName} (${quantity} szt.)`
        );
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

      // NAPRAWKA: Zlikwiduj problem podwójnego zapisywania - zsumuj wszystkie składniki przed zapisaniem
      const consolidatedIngredientUsage: Record<string, { amount: number; unit: string }> = {};
      
      cartItems.forEach(item => {
        item.ingredients.forEach(ingredient => {
          const totalUsedInOriginalUnit = ingredient.amount * item.quantity;
          
          if (!consolidatedIngredientUsage[ingredient.name]) {
            consolidatedIngredientUsage[ingredient.name] = { amount: 0, unit: ingredient.unit };
          }
          consolidatedIngredientUsage[ingredient.name].amount += totalUsedInOriginalUnit;
        });
      });

      // Sprawdź dostępność dla całego koszyka
      const totalIngredientUsage: Record<string, { amount: number; unit: string }> = {};
      
      Object.entries(consolidatedIngredientUsage).forEach(([ingredientName, usage]) => {
        const amountInBaseUnit = convertToBaseUnit(usage.amount, usage.unit);
        totalIngredientUsage[ingredientName] = { amount: amountInBaseUnit, unit: 'ml' };
      });

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

      const totalCartValue = cartItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);

      const compositionNames = cartItems.map(item => 
        `${item.quantity}x ${item.compositionName} [${item.unitPrice.toFixed(2)}zł]`
      ).join(', ');
      
      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert({
          composition_id: cartItems[0].compositionId,
          composition_name: compositionNames,
          quantity: cartItems.reduce((total, item) => total + item.quantity, 0),
          unit_price: totalCartValue / cartItems.reduce((total, item) => total + item.quantity, 0),
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

      // NAPRAWKA: Zapisz użycie składników zsumowane, nie osobno dla każdego produktu
      const consolidatedUsages = Object.entries(consolidatedIngredientUsage).map(([ingredientName, usage]) => ({
        transaction_id: transaction.id,
        ingredient_name: ingredientName,
        quantity_used: usage.amount,
        unit: usage.unit,
      }));

      if (consolidatedUsages.length > 0) {
        const { error: usageError } = await supabase
          .from('transaction_ingredient_usage')
          .insert(consolidatedUsages);

        if (usageError) throw usageError;
      }

      // Aktualizuj składniki na podstawie zsumowanych użyć
      const ingredientUpdates = [];
      for (const [ingredientName, usage] of Object.entries(consolidatedIngredientUsage)) {
        const { data: currentIngredient, error: fetchError } = await supabase
          .from('ingredients')
          .select('amount, unit')
          .eq('name', ingredientName)
          .single();

        if (fetchError) {
          console.error('Error fetching ingredient:', fetchError);
          continue;
        }

        const usageInBaseUnit = convertToBaseUnit(usage.amount, usage.unit);
        const currentAmountInBaseUnit = convertToBaseUnit(currentIngredient.amount, currentIngredient.unit);
        const newAmountInBaseUnit = Math.max(0, currentAmountInBaseUnit - usageInBaseUnit);
        
        let newAmountInStorageUnit;
        if (currentIngredient.unit.toLowerCase().includes('krople') || currentIngredient.unit.toLowerCase().includes('kropli')) {
          newAmountInStorageUnit = newAmountInBaseUnit * 20;
        } else {
          newAmountInStorageUnit = newAmountInBaseUnit;
        }

        console.log(`Aktualizacja składnika ${ingredientName}:`, {
          currentAmount: currentIngredient.amount,
          currentUnit: currentIngredient.unit,
          currentInBaseUnit: currentAmountInBaseUnit,
          usedInBaseUnit: usageInBaseUnit,
          newInBaseUnit: newAmountInBaseUnit,
          newInStorageUnit: newAmountInStorageUnit
        });

        ingredientUpdates.push({
          name: ingredientName,
          newAmount: newAmountInStorageUnit,
          usedAmount: usageInBaseUnit,
          unit: currentIngredient.unit
        });
      }

      // Aktualizuj składniki i zapisz ruchy magazynowe
      for (const update of ingredientUpdates) {
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ amount: update.newAmount })
          .eq('name', update.name);

        if (updateError) {
          console.error('Error updating ingredient:', updateError);
          continue;
        }

        // Zapisz ruch magazynowy
        await recordMovement(
          update.name,
          'sale',
          -update.usedAmount, // Ujemna wartość dla sprzedaży
          update.unit,
          transaction.id,
          'cart_transaction',
          `Sprzedaż koszyka: ${cartItems.length} produktów`
        );
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

      // NAPRAWKA: Pobierz zapisane użycie składników (to co było faktycznie zapisane)
      const { data: usages, error: usagesError } = await supabase
        .from('transaction_ingredient_usage')
        .select('*')
        .eq('transaction_id', transactionId);

      if (usagesError) throw usagesError;

      console.log('Found usages to reverse:', usages);

      // Przywróć składniki na podstawie zapisanych użyć
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

        // NAPRAWKA: Konwertuj użytą ilość do jednostki bazowej
        const usageInBaseUnit = convertToBaseUnit(usage.quantity_used, usage.unit);
        
        // Konwertuj obecną ilość do jednostki bazowej
        const currentAmountInBaseUnit = convertToBaseUnit(currentIngredient.amount, currentIngredient.unit);
        
        // Dodaj z powrotem użytą ilość
        const restoredAmountInBaseUnit = currentAmountInBaseUnit + usageInBaseUnit;
        
        // Konwertuj z powrotem do jednostki przechowywania
        let restoredAmountInStorageUnit;
        if (currentIngredient.unit.toLowerCase().includes('krople') || currentIngredient.unit.toLowerCase().includes('kropli')) {
          restoredAmountInStorageUnit = restoredAmountInBaseUnit * 20;
        } else {
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
          continue;
        }

        // Zapisz ruch magazynowy dla cofnięcia
        await recordMovement(
          usage.ingredient_name,
          'reversal',
          usageInBaseUnit, // Dodatnia wartość dla cofnięcia
          currentIngredient.unit,
          transactionId,
          'transaction_reversal',
          `Cofnięcie transakcji: przywrócono ${usage.quantity_used} ${usage.unit}`
        );
      }

      // Oznacz transakcję jako cofniętą
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

      const { error: usageDeleteError } = await supabase
        .from('transaction_ingredient_usage')
        .delete()
        .eq('transaction_id', transactionId);

      if (usageDeleteError) throw usageDeleteError;

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
