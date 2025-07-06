
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface IngredientCategory {
  ingredient_name: string;
  category: string;
}

export const useIngredientCategories = (ingredients: string[], ingredientUnits: Record<string, string>) => {
  const [userCategories, setUserCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUserCategories = async () => {
      try {
        // Load categories from composition_ingredients where user explicitly set category
        const { data, error } = await supabase
          .from('composition_ingredients')
          .select('ingredient_name, unit')
          .in('ingredient_name', ingredients);

        if (error) {
          console.error('Error loading user categories:', error);
          return;
        }

        const categories: Record<string, string> = {};
        
        // Determine category based on unit used when adding to composition
        data?.forEach(item => {
          const ingredientName = item.ingredient_name;
          const unit = item.unit;
          
          // Check if this is a user-defined category based on unit
          if (unit === 'krople') {
            categories[ingredientName] = 'olejek';
          } else if (unit === 'szt.' || unit === 'szt' || unit === 'kpl.' || unit === 'kpl') {
            categories[ingredientName] = 'inne';
          } else if (unit === 'g') {
            categories[ingredientName] = 'zioło';
          }
        });

        console.log('Loaded user categories:', categories);
        setUserCategories(categories);
      } catch (error) {
        console.error('Error loading user categories:', error);
      }
    };

    if (ingredients.length > 0) {
      loadUserCategories();
    }
  }, [ingredients]);

  return useMemo(() => {
    const categorizeIngredients = (ingredients: string[]) => {
      const herbs: string[] = [];
      const oils: string[] = [];
      const others: string[] = [];

      ingredients.forEach(ingredient => {
        const unit = ingredientUnits[ingredient];
        const ingredientLower = ingredient.toLowerCase();
        
        console.log(`Categorizing ingredient: ${ingredient}, unit: ${unit}, user category: ${userCategories[ingredient]}`);
        
        // First check user-defined category
        if (userCategories[ingredient]) {
          const userCategory = userCategories[ingredient];
          if (userCategory === 'olejek') {
            oils.push(ingredient);
            console.log(`${ingredient} -> oils (user category: ${userCategory})`);
            return;
          } else if (userCategory === 'inne') {
            others.push(ingredient);
            console.log(`${ingredient} -> others (user category: ${userCategory})`);
            return;
          } else if (userCategory === 'zioło') {
            herbs.push(ingredient);
            console.log(`${ingredient} -> herbs (user category: ${userCategory})`);
            return;
          }
        }
        
        // Fall back to name-based detection
        if (ingredientLower.includes('olejek')) {
          oils.push(ingredient);
          console.log(`${ingredient} -> oils (by name)`);
        } else if (ingredientLower.includes('etykiet') || 
                   ingredientLower.includes('worek') || 
                   ingredientLower.includes('woreczek') || 
                   ingredientLower.includes('pojemnik') ||
                   ingredientLower.includes('naklejk') ||
                   ingredientLower.includes('opakow')) {
          others.push(ingredient);
          console.log(`${ingredient} -> others (by name)`);
        } else {
          // Fall back to unit-based detection
          if (unit === 'ml') {
            oils.push(ingredient);
            console.log(`${ingredient} -> oils (by unit ml)`);
          } else if (unit === 'szt.' || unit === 'szt' || unit === 'kpl.' || unit === 'kpl') {
            others.push(ingredient);
            console.log(`${ingredient} -> others (by unit ${unit})`);
          } else if (unit === 'g') {
            herbs.push(ingredient);
            console.log(`${ingredient} -> herbs (by unit g)`);
          } else {
            // Final fallback - domyślnie zioła
            herbs.push(ingredient);
            console.log(`${ingredient} -> herbs (fallback)`);
          }
        }
      });

      console.log('Final categorization:', { herbs, oils, others });
      return { herbs, oils, others };
    };

    return categorizeIngredients(ingredients);
  }, [ingredients, ingredientUnits, userCategories]);
};
