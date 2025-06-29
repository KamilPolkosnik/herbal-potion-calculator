
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSummaryData = () => {
  const [rawMaterialsValue, setRawMaterialsValue] = useState(0);
  const [oilsValue, setOilsValue] = useState(0);
  const [othersValue, setOthersValue] = useState(0);
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
        setOthersValue(0);
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
      let othersVal = 0;

      ingredientsData?.forEach((ingredient) => {
        const amount = Number(ingredient.amount) || 0;
        const price = Number(ingredient.price) || 0;
        const totalValue = amount * price;

        console.log(`Ingredient: ${ingredient.name}, Amount: ${amount}, Price: ${price}, Total: ${totalValue}`);

        if (ingredient.name.toLowerCase().includes('olejek')) {
          // Olejki
          oilsVal += totalValue;
        } else if (ingredient.name.toLowerCase().includes('surowiec') || 
                   ingredient.name.toLowerCase().includes('glinka') ||
                   ingredient.name.toLowerCase().includes('soda') ||
                   ingredient.name.toLowerCase().includes('kwas') ||
                   ingredient.name.toLowerCase().includes('olej')) {
          // Surowce
          rawMaterialsVal += totalValue;
        } else {
          // Inne
          othersVal += totalValue;
        }
      });

      console.log('Summary values calculated:', { rawMaterialsVal, oilsVal, othersVal });

      setRawMaterialsValue(rawMaterialsVal);
      setOilsValue(oilsVal);
      setOthersValue(othersVal);
      setTotalValue(rawMaterialsVal + oilsVal + othersVal);
    } catch (error) {
      console.error('Error calculating summary values:', error);
      setRawMaterialsValue(0);
      setOilsValue(0);
      setOthersValue(0);
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
    othersValue,
    totalValue,
    loading,
    refreshSummary: calculateSummaryValues
  };
};
