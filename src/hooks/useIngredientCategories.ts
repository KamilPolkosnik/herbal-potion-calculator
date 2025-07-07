
import { useMemo } from 'react';

export const useIngredientCategories = (ingredients: string[], ingredientUnits: Record<string, string>) => {
  return useMemo(() => {
    const categorizeIngredients = (ingredients: string[]) => {
      const herbs: string[] = [];
      const oils: string[] = [];
      const others: string[] = [];

      ingredients.forEach(ingredient => {
        // Użyj rzeczywistej jednostki z bazy danych
        const unit = ingredientUnits[ingredient];
        
        console.log(`Kategoryzuję składnik: ${ingredient}, jednostka: ${unit}`);
        
        // Olejki muszą mieć jednostkę "ml" I zawierać "olejek" w nazwie
        if (unit === 'ml' && ingredient.toLowerCase().includes('olejek')) {
          oils.push(ingredient);
          console.log(`${ingredient} dodany do olejków (ml + nazwa zawiera 'olejek')`);
        } else if (unit === 'szt' || unit === 'kpl') {
          others.push(ingredient);
          console.log(`${ingredient} dodany do innych (${unit})`);
        } else if (unit === 'g') {
          herbs.push(ingredient);
          console.log(`${ingredient} dodany do ziół (g)`);
        } else {
          // Jeśli jednostka nie jest zdefiniowana, użyj logiki fallback
          console.log(`Jednostka nie zdefiniowana dla ${ingredient}, używam logiki fallback`);
          if (ingredient.toLowerCase().includes('olejek')) {
            oils.push(ingredient);
            console.log(`${ingredient} dodany do olejków (fallback - nazwa zawiera 'olejek')`);
          } else if (ingredient.toLowerCase().includes('worek') || 
                     ingredient.toLowerCase().includes('woreczek') || 
                     ingredient.toLowerCase().includes('pojemnik') ||
                     ingredient.toLowerCase().includes('etykieta') ||
                     ingredient.toLowerCase().includes('szt')) {
            others.push(ingredient);
            console.log(`${ingredient} dodany do innych (fallback - nazwa zawiera słowo kluczowe)`);
          } else {
            herbs.push(ingredient);
            console.log(`${ingredient} dodany do ziół (fallback - domyślnie)`);
          }
        }
      });

      console.log('Wyniki kategoryzacji:', { herbs, oils, others });
      return { herbs, oils, others };
    };

    return categorizeIngredients(ingredients);
  }, [ingredients, ingredientUnits]);
};
