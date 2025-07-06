
import { useMemo } from 'react';

export const useIngredientCategories = (ingredients: string[], ingredientUnits: Record<string, string>) => {
  return useMemo(() => {
    const categorizeIngredients = (ingredients: string[]) => {
      const herbs: string[] = [];
      const oils: string[] = [];
      const others: string[] = [];

      ingredients.forEach(ingredient => {
        const unit = ingredientUnits[ingredient];
        const ingredientLower = ingredient.toLowerCase();
        
        console.log(`Categorizing ingredient: ${ingredient}, unit: ${unit}`);
        
        // Najpierw sprawdź nazwę składnika
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
          // Następnie sprawdź jednostkę
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
            // Fallback - domyślnie zioła
            herbs.push(ingredient);
            console.log(`${ingredient} -> herbs (fallback)`);
          }
        }
      });

      console.log('Final categorization:', { herbs, oils, others });
      return { herbs, oils, others };
    };

    return categorizeIngredients(ingredients);
  }, [ingredients, ingredientUnits]);
};
