
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSummaryData = () => {
  const [rawMaterialsValue, setRawMaterialsValue] = useState(0);
  const [oilsValue, setOilsValue] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  const calculateSummaryValues = async () => {
    try {
      // Pobierz tylko składniki używane w zestawach
      const { data: usedIngredients, error: ingredientsError } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name');

      if (ingredientsError) throw ingredientsError;

      if (!usedIngredients || usedIngredients.length === 0) {
        setRawMaterialsValue(0);
        setOilsValue(0);
        setTotalValue(0);
        return;
      }

      // Pobierz unikalne nazwy składników
      const uniqueIngredientNames = [...new Set(usedIngredients.map(item => item.ingredient_name))];

      // Pobierz dane składników tylko dla tych używanych w zestawach
      const { data: ingredientsData, error: dataError } = await supabase
        .from('ingredients')
        .select('*')
        .in('name', uniqueIngredientNames);

      if (dataError) throw dataError;

      let rawMaterialsVal = 0;
      let oilsVal = 0;

      ingredientsData?.forEach((ingredient) => {
        const amount = Number(ingredient.amount) || 0;
        const price = Number(ingredient.price) || 0;

        if (ingredient.name.includes('olejek')) {
          // Olejki - cena za ml
          oilsVal += amount * price;
        } else {
          // Surowce - cena za 100g
          rawMaterialsVal += (amount * price) / 100;
        }
      });

      setRawMaterialsValue(rawMaterialsVal);
      setOilsValue(oilsVal);
      setTotalValue(rawMaterialsVal + oilsVal);
    } catch (error) {
      console.error('Error calculating summary values:', error);
      setRawMaterialsValue(0);
      setOilsValue(0);
      setTotalValue(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateSummaryValues();
  }, []);

  return {
    rawMaterialsValue,
    oilsValue,
    totalValue,
    loading,
    refreshSummary: calculateSummaryValues
  };
};
