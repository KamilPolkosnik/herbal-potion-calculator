
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIngredients } from '@/hooks/useIngredients';

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
      const { data, error } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name');
      
      if (error) {
        console.error('Error loading used ingredients:', error);
      } else {
        const uniqueIngredients = [...new Set(data?.map(item => item.ingredient_name) || [])];
        setUsedIngredients(uniqueIngredients);

        // Load units for each ingredient
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('ingredients')
          .select('name, unit')
          .in('name', uniqueIngredients);

        if (!ingredientsError && ingredientsData) {
          const unitsMap: Record<string, string> = {};
          ingredientsData.forEach(item => {
            unitsMap[item.name] = item.unit;
          });
          setIngredientUnits(unitsMap);
        }
      }
    } catch (error) {
      console.error('Error loading used ingredients:', error);
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

  const categorizeIngredients = (ingredients: string[]) => {
    const herbs: string[] = [];
    const oils: string[] = [];
    const others: string[] = [];

    ingredients.forEach(ingredient => {
      const unit = ingredientUnits[ingredient] || 'g';
      
      if (unit === 'ml') {
        oils.push(ingredient);
      } else if (unit === 'g') {
        herbs.push(ingredient);
      } else if (unit === 'szt') {
        others.push(ingredient);
      } else {
        // fallback for any other units
        others.push(ingredient);
      }
    });

    return { herbs, oils, others };
  };

  if (loading || loadingIngredients) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie danych...</div>
      </div>
    );
  }

  if (usedIngredients.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Brak składników</h3>
          <Button variant="outline" onClick={handleRefresh} disabled={loadingIngredients}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingIngredients ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>
        <p className="text-gray-500">
          Nie ma jeszcze żadnych składników w zestawach. Dodaj składniki do zestawów w zakładce "Zarządzanie", a potem będziesz mógł zarządzać ich stanami i cenami tutaj.
        </p>
      </div>
    );
  }

  const { herbs, oils, others } = categorizeIngredients(usedIngredients);

  const renderIngredientSection = (items: string[], title: string, unit: string, priceUnit: string) => {
    if (items.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-gray-700">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((ingredient) => {
              const actualUnit = ingredientUnits[ingredient] || unit;
              const actualPriceUnit = actualUnit === 'szt' ? 'zł/szt' : 
                                     actualUnit === 'ml' ? 'zł/ml' : 'zł/100g';
              
              return (
                <div key={ingredient} className="space-y-2 p-4 border rounded-lg bg-white">
                  <Label htmlFor={ingredient} className="text-sm font-medium capitalize">
                    {ingredient}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">Stan ({actualUnit})</Label>
                      <Input
                        id={ingredient}
                        type="number"
                        value={ingredients[ingredient] || ''}
                        onChange={(e) => handleIngredientUpdate(ingredient, parseFloat(e.target.value) || 0)}
                        placeholder={`0 ${actualUnit}`}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Cena ({actualPriceUnit})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={prices[ingredient] || ''}
                        onChange={(e) => handlePriceUpdate(ingredient, parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 text-center mt-2">
                    Wartość: {actualUnit === 'szt' 
                      ? ((ingredients[ingredient] || 0) * (prices[ingredient] || 0)).toFixed(2)
                      : actualUnit === 'ml' 
                        ? ((ingredients[ingredient] || 0) * (prices[ingredient] || 0)).toFixed(2)
                        : ((ingredients[ingredient] || 0) * (prices[ingredient] || 0) / 100).toFixed(2)} zł
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="bg-blue-50 p-4 rounded-lg flex-1 mr-4">
          <h3 className="font-semibold text-blue-800 mb-2">Informacja o przeliczniku olejków:</h3>
          <p className="text-blue-700">200 kropel = 10 ml olejku eterycznego</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loadingIngredients}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingIngredients ? 'animate-spin' : ''}`} />
          Odśwież
        </Button>
      </div>
      
      {renderIngredientSection(herbs, 'Surowce Ziołowe (g)', 'g', 'zł/100g')}
      {renderIngredientSection(oils, 'Olejki Eteryczne (ml)', 'ml', 'zł/ml')}
      {renderIngredientSection(others, 'Inne (szt)', 'szt', 'zł/szt')}
    </div>
  );
};

export default IngredientManager;
