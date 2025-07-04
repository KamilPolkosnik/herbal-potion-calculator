import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIngredients } from '@/hooks/useIngredients';
import { useIngredientCategories } from '@/hooks/useIngredientCategories';
import { useIngredientCompositions } from '@/hooks/useIngredientCompositions';
import { useWarningThresholds } from '@/hooks/useWarningThresholds';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IngredientFilters from './IngredientFilters';
import IngredientInfoBox from './IngredientInfoBox';
import IngredientSection from './IngredientSection';
import EmptyIngredientsState from './EmptyIngredientsState';
import IngredientMovementHistory from './IngredientMovementHistory';

interface IngredientManagerProps {
  onDataChange?: () => void | Promise<void>;
}

const IngredientManager: React.FC<IngredientManagerProps> = ({ onDataChange }) => {
  const { ingredients, prices, loading, updateIngredient, updatePrice, refreshData } = useIngredients();
  const { compositionUsage, loading: compositionLoading, refreshCompositionUsage } = useIngredientCompositions();
  const { thresholds, loading: thresholdsLoading } = useWarningThresholds();
  const [usedIngredients, setUsedIngredients] = useState<string[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<string[]>([]);
  const [ingredientUnits, setIngredientUnits] = useState<Record<string, string>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [filters, setFilters] = useState({ searchTerm: '', selectedComposition: '', lowStock: false });

  // Convert compositionUsage to the format expected by IngredientSection
  const convertCompositionUsage = (usage: typeof compositionUsage): Record<string, number> => {
    const converted: Record<string, number> = {};
    Object.entries(usage).forEach(([ingredientName, compositions]) => {
      const totalUsage = compositions.reduce((sum, comp) => sum + comp.amount, 0);
      converted[ingredientName] = totalUsage;
    });
    return converted;
  };

  const loadUsedIngredients = async () => {
    setLoadingIngredients(true);
    try {
      console.log('Ładowanie używanych składników...');
      
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

      uniqueIngredients.forEach(ingredientName => {
        if (!unitsMap[ingredientName]) {
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

  useEffect(() => {
    loadUsedIngredients();
    refreshCompositionUsage();
  }, []);

  useEffect(() => {
    if (usedIngredients.length === 0) return;

    const applyFiltersSync = async () => {
      let filtered = [...usedIngredients];

      if (filters.searchTerm) {
        filtered = filtered.filter(ingredient =>
          ingredient.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }

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

      if (filters.lowStock && thresholds) {
        filtered = filtered.filter(ingredient => {
          const currentAmount = ingredients[ingredient] || 0;
          const unit = ingredientUnits[ingredient] || 'g';
          
          let threshold = 0;
          if (unit === 'ml') {
            threshold = thresholds.oils_threshold;
          } else if (unit === 'szt' || unit === 'kpl') {
            threshold = thresholds.others_threshold;
          } else {
            threshold = thresholds.herbs_threshold;
          }
          
          return currentAmount < threshold;
        });
      }

      setFilteredIngredients(filtered);
    };

    applyFiltersSync();
  }, [usedIngredients, filters.searchTerm, filters.selectedComposition, filters.lowStock, ingredients, thresholds, ingredientUnits]);

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

  const handleFilterChange = (newFilters: { searchTerm: string; selectedComposition: string; lowStock: boolean }) => {
    setFilters(newFilters);
  };

  const { herbs, oils, others } = useIngredientCategories(filteredIngredients, ingredientUnits);

  const warningThresholds = thresholds ? {
    herbs: thresholds.herbs_threshold,
    oils: thresholds.oils_threshold,
    others: thresholds.others_threshold
  } : undefined;

  const convertedCompositionUsage = convertCompositionUsage(compositionUsage);

  if (loading || loadingIngredients || compositionLoading || thresholdsLoading) {
    return (
      <div className="flex justify-center items-center p-4 sm:p-8">
        <div className="text-base sm:text-lg text-center">Ładowanie danych...</div>
      </div>
    );
  }

  if (usedIngredients.length === 0) {
    return <EmptyIngredientsState onRefresh={handleRefresh} isLoading={loadingIngredients} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="ingredients" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="ingredients" className="text-xs sm:text-sm py-2">Składniki</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm py-2">Historia Ruchów</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ingredients" className="space-y-4 sm:space-y-6 mt-4">
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
            compositionUsage={{}} // Remove usage display
            warningThresholds={warningThresholds}
          />
          
          <IngredientSection
            title="Olejki Eteryczne (ml)"
            items={oils}
            ingredients={ingredients}
            prices={prices}
            ingredientUnits={ingredientUnits}
            onAmountUpdate={handleIngredientUpdate}
            onPriceUpdate={handlePriceUpdate}
            compositionUsage={{}} // Remove usage display
            warningThresholds={warningThresholds}
          />
          
          <IngredientSection
            title="Inne (szt/kpl)"
            items={others}
            ingredients={ingredients}
            prices={prices}
            ingredientUnits={ingredientUnits}
            onAmountUpdate={handleIngredientUpdate}
            onPriceUpdate={handlePriceUpdate}
            compositionUsage={{}} // Remove usage display
            warningThresholds={warningThresholds}
          />
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <IngredientMovementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IngredientManager;
