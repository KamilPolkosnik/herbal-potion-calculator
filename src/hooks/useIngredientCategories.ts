
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
        
        // Normalizuj jednostkę (usuń kropki, spacje)
        const normalizedUnit = unit ? unit.toLowerCase().trim().replace('.', '') : '';
        
        // Olejki muszą mieć jednostkę "ml" I zawierać "olejek" w nazwie
        if (normalizedUnit === 'ml' && ingredient.toLowerCase().includes('olejek')) {
          oils.push(ingredient);
          console.log(`${ingredient} dodany do olejków (ml + nazwa zawiera 'olejek')`);
        } else if (normalizedUnit === 'szt' || normalizedUnit === 'sztuki' || normalizedUnit === 'pieces') {
          others.push(ingredient);
          console.log(`${ingredient} dodany do innych (${unit})`);
        } else if (normalizedUnit === 'g' || normalizedUnit === 'gram' || normalizedUnit === 'gramy') {
          herbs.push(ingredient);
          console.log(`${ingredient} dodany do ziół (${unit})`);
        } else {
          // Jeśli jednostka nie jest zdefiniowana lub nierozpoznana, użyj logiki fallback na podstawie nazwy
          console.log(`Jednostka nie zdefiniowana lub nierozpoznana dla ${ingredient} (${unit}), używam logiki fallback`);
          
          const lowerName = ingredient.toLowerCase();
          if (lowerName.includes('olejek')) {
            oils.push(ingredient);
            console.log(`${ingredient} dodany do olejków (fallback - nazwa zawiera 'olejek')`);
          } else if (lowerName.includes('worek') || 
                     lowerName.includes('woreczek') || 
                     lowerName.includes('pojemnik') ||
                     lowerName.includes('etykieta') ||
                     lowerName.includes('szt')) {
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
