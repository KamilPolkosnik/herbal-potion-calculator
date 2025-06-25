
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIngredient = async (name: string, amount: number) => {
    try {
      console.log('Updating ingredient:', name, amount);
      
      const { error } = await supabase
        .from('ingredients')
        .upsert({
          name,
          amount,
          price: prices[name] || 0,
          unit: name.includes('olejek') ? 'ml' : 'g'
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setIngredients(prev => ({ ...prev, [name]: amount }));
      console.log('Ingredient updated successfully');
    } catch (error) {
      console.error('Error updating ingredient:', error);
    }
  };

  const updatePrice = async (name: string, price: number) => {
    try {
      console.log('Updating price:', name, price);
      
      const { error } = await supabase
        .from('ingredients')
        .upsert({
          name,
          amount: ingredients[name] || 0,
          price,
          unit: name.includes('olejek') ? 'ml' : 'g'
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setPrices(prev => ({ ...prev, [name]: price }));
      console.log('Price updated successfully');
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
