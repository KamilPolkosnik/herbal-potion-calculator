
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIngredients } from '@/hooks/useIngredients';
import { useIngredientCategories } from '@/hooks/useIngredientCategories';
import { useIngredientCompositions } from '@/hooks/useIngredientCompositions';
import IngredientFilters from './IngredientFilters';
import IngredientInfoBox from './IngredientInfoBox';
import IngredientSection from './IngredientSection';
import EmptyIngredientsState from './EmptyIngredientsState';

interface IngredientManagerProps {
  onDataChange?: () => void | Promise<void>;
}

const IngredientManager: React.FC<IngredientManagerProps> = ({ onDataChange }) => {
  const { ingredients, prices, loading, updateIngredient, updatePrice, refreshData } = useIngredients();
  const { compositionUsage, loading: compositionLoading, refreshCompositionUsage } = useIngredientCompositions();
  const [usedIngredients, setUsedIngredients] = useState<string[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<string[]>([]);
  const [ingredientUnits, setIngredientUnits] = useState<Record<string, string>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [filters, setFilters] = useState({ searchTerm: '', selectedComposition: '' });

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
        .select('name, unit');

      if (ingredientsError) {
        console.error('Błąd podczas ładowania jednostek składników:', ingredientsError);
        return;
      }

      const unitsMap: Record<string, string> = {};
      ingredientsData?.forEach(item => {
        unitsMap[item.name] = item.unit;
        console.log(`Składnik: ${item.name}, Jednostka: ${item.unit}`);
      });

      // Dodaj jednostki dla składników, które mogą nie być jeszcze w tabeli ingredients
      uniqueIngredients.forEach(ingredientName => {
        if (!unitsMap[ingredientName]) {
          // Określ jednostkę na podstawie nazwy składnika
          if (ingredientName.toLowerCase().includes('olejek')) {
            unitsMap[ingredientName] = 'ml';
          } else if (ingredientName.toLowerCase().includes('worek') || 
                     ingredientName.toLowerCase().includes('woreczek') || 
                     ingredientName.toLowerCase().includes('pojemnik')) {
            unitsMap[ingredientName] = 'szt';
          } else {
            unitsMap[ingredientName] = 'g';
          }
          console.log(`Jednostka domyślna dla ${ingredientName}: ${unitsMap[ingredientName]}`);
        }
      });
      
      setIngredientUnits(unitsMap);
      console.log('Mapa jednostek składników:', unitsMap);
      
    } catch (error) {
      console.error('Błąd podczas ładowania składników:', error);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const applyFilters = async () => {
    let filtered = [...usedIngredients];

    // Filtruj według nazwy składnika
    if (filters.searchTerm) {
      filtered = filtered.filter(ingredient =>
        ingredient.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Filtruj według wybranego zestawu
    if (filters.selectedComposition && filters.selectedComposition !== 'all') {
      try {
        const { data: compositionIngredients, error } = await supabase
          .from('composition_ingredients')
          .select('ingredient_name')
          .eq('composition_id', filters.selectedComposition);

        if (error) {
          console.error('Błąd podczas filtrowania według zestawu:', error);
          return;
        }

        const compositionIngredientNames = compositionIngredients?.map(item => item.ingredient_name) || [];
        filtered = filtered.filter(ingredient => compositionIngredientNames.includes(ingredient));
      } catch (error) {
        console.error('Błąd podczas filtrowania według zestawu:', error);
        return;
      }
    }

    setFilteredIngredients(filtered);
  };

  useEffect(() => {
    loadUsedIngredients();
    refreshCompositionUsage();
  }, []);

  useEffect(() => {
    if (usedIngredients.length > 0) {
      applyFilters();
    }
  }, [usedIngredients, filters]);

  const handleRefresh = async () => {
    await Promise.all([loadUsedIngredients(), refreshData(), refreshCompositionUsage()]);
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

  const handleFilterChange = (newFilters: { searchTerm: string; selectedComposition: string }) => {
    setFilters(newFilters);
  };

  const { herbs, oils, others } = useIngredientCategories(filteredIngredients, ingredientUnits);

  if (loading || loadingIngredients || compositionLoading) {
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
      <IngredientFilters onFilterChange={handleFilterChange} />
      
      <IngredientInfoBox onRefresh={handleRefresh} isLoading={loadingIngredients} />
      
      <IngredientSection
        title="Surowce Ziołowe (g)"
        items={herbs}
        ingredients={ingredients}
        prices={prices}
        ingredientUnits={ingredientUnits}
        onAmountUpdate={handleIngredientUpdate}
        onPriceUpdate={handlePriceUpdate}
        compositionUsage={compositionUsage}
      />
      
      <IngredientSection
        title="Olejki Eteryczne (ml)"
        items={oils}
        ingredients={ingredients}
        prices={prices}
        ingredientUnits={ingredientUnits}
        onAmountUpdate={handleIngredientUpdate}
        onPriceUpdate={handlePriceUpdate}
        compositionUsage={compositionUsage}
      />
      
      <IngredientSection
        title="Inne (szt/kpl)"
        items={others}
        ingredients={ingredients}
        prices={prices}
        ingredientUnits={ingredientUnits}
        onAmountUpdate={handleIngredientUpdate}
        onPriceUpdate={handlePriceUpdate}
        compositionUsage={compositionUsage}
      />
    </div>
  );
};

export default IngredientManager;
