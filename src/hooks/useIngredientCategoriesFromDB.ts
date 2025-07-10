
import { useMemo } from 'react';
import { useIngredientCompositions } from '@/hooks/useIngredientCompositions';

export const useIngredientCategoriesFromDB = (ingredients: string[]) => {
  const { compositionUsage, loading } = useIngredientCompositions();

  return useMemo(() => {
    const categorizeIngredients = (ingredients: string[]) => {
      const herbs: string[] = [];
      const oils: string[] = [];
      const others: string[] = [];

      ingredients.forEach(ingredient => {
        // Sprawdź czy składnik występuje w jakimś zestawie
        const compositionsForIngredient = compositionUsage[ingredient];
        
        if (compositionsForIngredient && compositionsForIngredient.length > 0) {
          // Użyj kategorii z pierwszego zestawu (wszystkie powinny być takie same dla danego składnika)
          const category = compositionsForIngredient[0].category;
          
          console.log(`Kategoryzuję składnik: ${ingredient}, kategoria z bazy: ${category}`);
          
          if (category === 'olejek') {
            oils.push(ingredient);
          } else if (category === 'inne') {
            others.push(ingredient);
          } else {
            herbs.push(ingredient); // domyślnie zioło
          }
        } else {
          // Składnik nie występuje w żadnym zestawie - użyj logiki fallback
          console.log(`Składnik ${ingredient} nie występuje w żadnym zestawie, używam logiki fallback`);
          
          const lowerName = ingredient.toLowerCase();
          if (lowerName.includes('olejek')) {
            oils.push(ingredient);
          } else if (lowerName.includes('worek') || 
                     lowerName.includes('woreczek') || 
                     lowerName.includes('pojemnik') ||
                     lowerName.includes('etykieta') ||
                     lowerName.includes('saszetka') ||
                     lowerName.includes('metka') ||
                     lowerName.includes('torebka')) {
            others.push(ingredient);
          } else {
            herbs.push(ingredient);
          }
        }
      });

      console.log('Wyniki kategoryzacji z bazy danych:', { herbs, oils, others });
      return { herbs, oils, others };
    };

    return categorizeIngredients(ingredients);
  }, [ingredients, compositionUsage]);
};
