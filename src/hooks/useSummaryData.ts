
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSummaryData = () => {
  const [rawMaterialsValue, setRawMaterialsValue] = useState(0);
  const [oilsValue, setOilsValue] = useState(0);
  const [othersValue, setOthersValue] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [monthlyCosts, setMonthlyCosts] = useState(0);
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  const calculateSummaryValues = async () => {
    try {
      // Pobierz wszystkie składniki z tabeli ingredients
      const { data: ingredientsData, error: dataError } = await supabase
        .from('ingredients')
        .select('*');

      if (dataError) throw dataError;

      // Pobierz wszystkie sprzedaże (tylko aktywne)
      const { data: salesData, error: salesError } = await supabase
        .from('sales_transactions')
        .select('total_price')
        .eq('is_reversed', false);

      if (salesError) throw salesError;

      // Pobierz koszty miesięczne za obecny miesiąc i rok
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const { data: costsData, error: costsError } = await supabase
        .from('monthly_costs')
        .select('amount')
        .eq('cost_month', currentMonth)
        .eq('cost_year', currentYear);

      if (costsError) throw costsError;

      let rawMaterialsVal = 0;
      let oilsVal = 0;
      let othersVal = 0;
      let totalSalesValue = 0;
      let totalCosts = 0;

      // Oblicz wartość składników
      if (ingredientsData && ingredientsData.length > 0) {
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
      }

      // Oblicz całkowitą sprzedaż
      if (salesData && salesData.length > 0) {
        totalSalesValue = salesData.reduce((sum, sale) => sum + (Number(sale.total_price) || 0), 0);
      }

      // Oblicz koszty miesięczne
      if (costsData && costsData.length > 0) {
        totalCosts = costsData.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);
      }

      // Oblicz szacunkowy zysk (sprzedaż - koszty miesięczne)
      const profit = totalSalesValue - totalCosts;

      console.log('Summary values calculated:', { 
        rawMaterialsVal, 
        oilsVal, 
        othersVal, 
        totalSalesValue, 
        totalCosts, 
        profit 
      });

      setRawMaterialsValue(rawMaterialsVal);
      setOilsValue(oilsVal);
      setOthersValue(othersVal);
      setTotalValue(rawMaterialsVal + oilsVal + othersVal);
      setTotalSales(totalSalesValue);
      setMonthlyCosts(totalCosts);
      setEstimatedProfit(profit);
    } catch (error) {
      console.error('Error calculating summary values:', error);
      setRawMaterialsValue(0);
      setOilsValue(0);
      setOthersValue(0);
      setTotalValue(0);
      setTotalSales(0);
      setMonthlyCosts(0);
      setEstimatedProfit(0);
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
    totalSales,
    monthlyCosts,
    estimatedProfit,
    loading,
    refreshSummary: calculateSummaryValues
  };
};
