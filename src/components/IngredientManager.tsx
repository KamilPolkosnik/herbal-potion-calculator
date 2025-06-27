
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIngredients } from '@/hooks/useIngredients';
import { useIngredientCategories } from '@/hooks/useIngredientCategories';
import IngredientInfoBox from './IngredientInfoBox';
import IngredientSection from './IngredientSection';
import EmptyIngredientsState from './EmptyIngredientsState';

interface IngredientManagerProps {
  onDataChange?: () => void | Promise<void>;
}

const IngredientManager: React.FC<IngredientManagerProps> = ({ onDataChange }) => {
  const { ingredients, prices, loading, updateIngredient, updatePrice, refreshData } = useIngredients();
  const [usedIngredients, setUsedIngredients] = useState<string[]>([]);
  const [ingredientUnits, setIngredientUnits] = useState<Record<string, string>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  const loadUsedIngredients = async () => {
    setLoadingIngredients(true);
    try {
      console.log('Ładowanie używanych składników...');
      
      // Pobierz wszystkie składniki używane w zestawach
      const { data: compositionIngredients, error } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name');
      
      if (error) {
        console.error('Błąd podczas ładowania składników z zestawów:', error);
        return;
      }

      const uniqueIngredients = [...new Set(compositionIngredients?.map(item => item.ingredient_name) || [])];
      console.log('Znalezione składniki w zestawach:', uniqueIngredients);
      setUsedIngredients(uniqueIngredients);

      // Pobierz jednostki dla każdego składnika z tabeli ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('name, unit')
        .in('name', uniqueIngredients);

      if (ingredientsError) {
        console.error('Błąd podczas ładowania jednostek składników:', ingredientsError);
        return;
      }

      const unitsMap: Record<string, string> = {};
      ingredientsData?.forEach(item => {
        unitsMap[item.name] = item.unit;
        console.log(`Składnik: ${item.name}, Jednostka: ${item.unit}`);
      });
      
      setIngredientUnits(unitsMap);
      console.log('Mapa jednostek składników:', unitsMap);
      
    } catch (error) {
      console.error('Błąd podczas ładowania składników:', error);
    } finally {
      setLoadingIngredients(false);
    }
  };

  useEffect(() => {
    loadUsedIngredients();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([loadUsedIngredients(), refreshData()]);
  };

  const handleIngredientUpdate = async (ingredient: string, value: number) => {
    await updateIngredient(ingredient, value);
    if (onDataChange) {
      await onDataChange();
    }
  };

  const handlePriceUpdate = async (ingredient: string, value: number) => {
    await updatePrice(ingredient, value);
    if (onDataChange) {
      await onDataChange();
    }
  };

  const { herbs, oils, others } = useIngredientCategories(usedIngredients, ingredientUnits);

  if (loading || loadingIngredients) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie danych...</div>
      </div>
    );
  }

  if (usedIngredients.length === 0) {
    return <EmptyIngredientsState onRefresh={handleRefresh} isLoading={loadingIngredients} />;
  }

  return (
    <div className="space-y-6">
      <IngredientInfoBox onRefresh={handleRefresh} isLoading={loadingIngredients} />
      
      <IngredientSection
        title="Surowce Ziołowe (g)"
        items={herbs}
        ingredients={ingredients}
        prices={prices}
        ingredientUnits={ingredientUnits}
        onAmountUpdate={handleIngredientUpdate}
        onPriceUpdate={handlePriceUpdate}
      />
      
      <IngredientSection
        title="Olejki Eteryczne (ml)"
        items={oils}
        ingredients={ingredients}
        prices={prices}
        ingredientUnits={ingredientUnits}
        onAmountUpdate={handleIngredientUpdate}
        onPriceUpdate={handlePriceUpdate}
      />
      
      <IngredientSection
        title="Inne (szt/kpl)"
        items={others}
        ingredients={ingredients}
        prices={prices}
        ingredientUnits={ingredientUnits}
        onAmountUpdate={handleIngredientUpdate}
        onPriceUpdate={handlePriceUpdate}
      />
    </div>
  );
};

export default IngredientManager;
