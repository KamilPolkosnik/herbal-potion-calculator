
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
      // Pobierz wszystkie składniki z tabeli ingredients
      const { data: ingredientsData, error: dataError } = await supabase
        .from('ingredients')
        .select('*');

      if (dataError) throw dataError;

      if (!ingredientsData || ingredientsData.length === 0) {
        setRawMaterialsValue(0);
        setOilsValue(0);
        setOthersValue(0);
        setTotalValue(0);
        return;
      }

      let rawMaterialsVal = 0;
      let oilsVal = 0;
      let othersVal = 0;

      ingredientsData.forEach((ingredient) => {
        const amount = Number(ingredient.amount) || 0;
        const price = Number(ingredient.price) || 0;
        let totalValue = 0;

        console.log(`Ingredient: ${ingredient.name}, Amount: ${amount}, Price: ${price}, Unit: ${ingredient.unit}`);

        if (ingredient.name.toLowerCase().includes('olejek')) {
          // Olejki eteryczne: cena za 10ml, więc wartość = (ilość/10) * cena
          totalValue = (amount / 10) * price;
          oilsVal += totalValue;
        } else if (ingredient.name.toLowerCase().includes('surowiec') || 
                   ingredient.name.toLowerCase().includes('glinka') ||
                   ingredient.name.toLowerCase().includes('soda') ||
                   ingredient.name.toLowerCase().includes('kwas') ||
                   ingredient.name.toLowerCase().includes('olej') ||
                   ingredient.name.toLowerCase().includes('nagietek') ||
                   ingredient.name.toLowerCase().includes('róż') ||
                   ingredient.name.toLowerCase().includes('kwiat')) {
          // Surowce ziołowe: cena za 100g, więc wartość = (ilość/100) * cena
          totalValue = (amount / 100) * price;
          rawMaterialsVal += totalValue;
        } else {
          // Inne (szt/kpl): wartość = ilość * cena
          totalValue = amount * price;
          othersVal += totalValue;
        }

        console.log(`Calculated value for ${ingredient.name}: ${totalValue.toFixed(2)} zł`);
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
