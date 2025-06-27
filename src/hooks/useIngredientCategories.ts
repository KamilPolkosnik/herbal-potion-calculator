
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
      } else {
        // Domyślnie dla 'g' lub innych jednostek
        herbs.push(ingredient);
      }
    });

    console.log('Kategoryzacja wyników:', { herbs, oils, others });
    return { herbs, oils, others };
  };

  return categorizeIngredients(ingredients);
};
