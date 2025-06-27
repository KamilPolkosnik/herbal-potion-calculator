
export const useIngredientCategories = (ingredients: string[], ingredientUnits: Record<string, string>) => {
  const categorizeIngredients = (ingredients: string[]) => {
    const herbs: string[] = [];
    const oils: string[] = [];
    const others: string[] = [];

    ingredients.forEach(ingredient => {
      const unit = ingredientUnits[ingredient];
      console.log(`Kategoryzowanie ${ingredient} z jednostką: ${unit}`);
      
      if (unit === 'ml') {
        oils.push(ingredient);
      } else if (unit === 'szt.' || unit === 'szt' || unit === 'kpl.' || unit === 'kpl') {
        others.push(ingredient);
      } else if (unit === 'g') {
        herbs.push(ingredient);
      } else {
        // Fallback logic based on ingredient name when unit is undefined
        if (ingredient.toLowerCase().includes('olejek')) {
          oils.push(ingredient);
          console.log(`Fallback: ${ingredient} przypisany do olejków`);
        } else if (ingredient.toLowerCase().includes('worek') || 
                   ingredient.toLowerCase().includes('woreczek') || 
                   ingredient.toLowerCase().includes('pojemnik') ||
                   ingredient.toLowerCase().includes('szt')) {
          others.push(ingredient);
          console.log(`Fallback: ${ingredient} przypisany do innych`);
        } else {
          herbs.push(ingredient);
          console.log(`Fallback: ${ingredient} przypisany do ziół`);
        }
      }
    });

    console.log('Kategoryzacja wyników:', { herbs, oils, others });
    return { herbs, oils, others };
  };

  return categorizeIngredients(ingredients);
};
