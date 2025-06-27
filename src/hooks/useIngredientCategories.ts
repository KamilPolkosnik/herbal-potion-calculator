
export const useIngredientCategories = (ingredients: string[], ingredientUnits: Record<string, string>) => {
  const categorizeIngredients = (ingredients: string[]) => {
    const herbs: string[] = [];
    const oils: string[] = [];
    const others: string[] = [];

    ingredients.forEach(ingredient => {
      // Use the actual unit from the database, not based on name
      const unit = ingredientUnits[ingredient];
      console.log(`Categorizing ${ingredient} with unit: ${unit}`);
      
      if (unit === 'ml') {
        oils.push(ingredient);
      } else if (unit === 'szt.' || unit === 'szt' || unit === 'kpl.') {
        others.push(ingredient);
      } else {
        // Default to herbs for 'g' or any other unit
        herbs.push(ingredient);
      }
    });

    return { herbs, oils, others };
  };

  return categorizeIngredients(ingredients);
};
