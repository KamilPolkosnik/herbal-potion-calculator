
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompositionUsage {
  [ingredientName: string]: Array<{
    id: string;
    name: string;
    amount: number;
    unit: string;
    category: string;
  }>;
}

export const useIngredientCompositions = () => {
  const [compositionUsage, setCompositionUsage] = useState<CompositionUsage>({});
  const [loading, setLoading] = useState(true);

  const loadCompositionUsage = async () => {
    try {
      setLoading(true);
      
      // Pobierz wszystkie składniki z zestawów wraz z informacjami o zestawach i kategorniach
      const { data, error } = await supabase
        .from('composition_ingredients')
        .select(`
          ingredient_name,
          amount,
          unit,
          category,
          compositions!inner(id, name)
        `);

      if (error) {
        throw error;
      }

      // Grupuj według nazwy składnika
      const usage: CompositionUsage = {};
      data?.forEach((item: any) => {
        const ingredientName = item.ingredient_name;
        if (!usage[ingredientName]) {
          usage[ingredientName] = [];
        }
        
        usage[ingredientName].push({
          id: item.compositions.id,
          name: item.compositions.name,
          amount: item.amount,
          unit: item.unit,
          category: item.category || 'zioło' // fallback dla starych danych
        });
      });

      setCompositionUsage(usage);
      console.log('Załadowano informacje o użyciu składników z kategoriami:', usage);
    } catch (error) {
      console.error('Błąd podczas ładowania informacji o użyciu składników:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompositionUsage();
  }, []);

  return {
    compositionUsage,
    loading,
    refreshCompositionUsage: loadCompositionUsage
  };
};
