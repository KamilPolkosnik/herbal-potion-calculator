
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIngredientMovements } from './useIngredientMovements';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  price: number;
  unit: string;
}

export const useIngredients = () => {
  const [ingredients, setIngredients] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { recordMovement } = useIngredientMovements();

  const loadIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*');

      if (error) throw error;

      const ingredientsData: Record<string, number> = {};
      const pricesData: Record<string, number> = {};

      data?.forEach((item: Ingredient) => {
        ingredientsData[item.name] = item.amount;
        pricesData[item.name] = item.price;
      });

      setIngredients(ingredientsData);
      setPrices(pricesData);
      console.log('useIngredients - loaded prices:', pricesData);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineUnit = async (name: string) => {
    try {
      // Najpierw sprawdź kategorię składnika z composition_ingredients
      const { data: categoryData, error: categoryError } = await supabase
        .from('composition_ingredients')
        .select('category')
        .eq('ingredient_name', name)
        .limit(1)
        .single();

      if (!categoryError && categoryData) {
        // Użyj kategorii do określenia jednostki
        switch (categoryData.category) {
          case 'olejek':
            return 'ml';
          case 'inne':
            return 'szt';
          default: // 'zioło'
            return 'g';
        }
      }

      // Jeśli nie znaleziono kategorii, sprawdź jednostkę z tabeli ingredients
      const { data: ingredientData, error: ingredientError } = await supabase
        .from('ingredients')
        .select('unit')
        .eq('name', name)
        .single();

      if (!ingredientError && ingredientData) {
        return ingredientData.unit;
      }

      // Fallback do starej logiki
      if (name.toLowerCase().includes('olejek')) {
        return 'ml';
      } else if (name.toLowerCase().includes('woreczek') || 
                 name.toLowerCase().includes('worek') || 
                 name.toLowerCase().includes('pojemnik') ||
                 name.toLowerCase().includes('etykieta') ||
                 name.toLowerCase().includes('metka') ||
                 name.toLowerCase().includes('torba') ||
                 name.toLowerCase().includes('torebka') ||
                 name.toLowerCase().includes('butelka')) {
        return 'szt';
      } else {
        return 'g';
      }
    } catch (error) {
      console.error('Error determining unit for ingredient:', name, error);
      return 'g'; // fallback
    }
  };

  const updateIngredient = async (name: string, amount: number) => {
    try {
      console.log('Updating ingredient:', name, amount);
      
      // Pobierz poprzednią wartość do obliczenia zmiany
      const previousAmount = ingredients[name] || 0;
      const quantityChange = amount - previousAmount;
      
      const { data: existingIngredient, error: fetchError } = await supabase
        .from('ingredients')
        .select('unit')
        .eq('name', name)
        .single();

      let unitToUse: string;
      if (existingIngredient && !fetchError) {
        unitToUse = existingIngredient.unit;
      } else {
        unitToUse = await determineUnit(name);
      }

      const { error } = await supabase
        .from('ingredients')
        .upsert({
          name,
          amount,
          price: prices[name] || 0,
          unit: unitToUse
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Zapisz ruch magazynowy jeśli była zmiana
      if (quantityChange !== 0) {
        await recordMovement(
          name,
          quantityChange > 0 ? 'purchase' : 'adjustment',
          quantityChange,
          unitToUse,
          undefined,
          'manual_update',
          `Ręczna aktualizacja: ${previousAmount} → ${amount}`
        );
      }

      setIngredients(prev => ({ ...prev, [name]: amount }));
      console.log('Ingredient updated successfully');
    } catch (error) {
      console.error('Error updating ingredient:', error);
    }
  };

  const updatePrice = async (name: string, price: number) => {
    try {
      console.log('useIngredients - updating price:', name, price);
      
      const { data: existingIngredient, error: fetchError } = await supabase
        .from('ingredients')
        .select('unit')
        .eq('name', name)
        .single();

      let unitToUse: string;
      if (existingIngredient && !fetchError) {
        unitToUse = existingIngredient.unit;
      } else {
        unitToUse = await determineUnit(name);
      }

      const { error } = await supabase
        .from('ingredients')
        .upsert({
          name,
          amount: ingredients[name] || 0,
          price,
          unit: unitToUse
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setPrices(prev => ({ ...prev, [name]: price }));
      console.log('useIngredients - price updated successfully, new prices state:', { ...prices, [name]: price });
      
      await loadIngredients();
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  return {
    ingredients,
    prices,
    loading,
    updateIngredient,
    updatePrice,
    refreshData: loadIngredients
  };
};
