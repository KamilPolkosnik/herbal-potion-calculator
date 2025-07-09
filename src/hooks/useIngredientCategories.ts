import { useMemo } from 'react';

type Category = 'herbs' | 'oils' | 'others';

export const useIngredientCategories = (
  ingredients: string[],
  userMapping: Record<string, Category>
) => {
  return useMemo(() => {
    const herbs: string[] = [];
    const oils: string[] = [];
    const others: string[] = [];

    ingredients.forEach(ingredient => {
      const category = userMapping[ingredient];
      if (category === 'herbs') {
        herbs.push(ingredient);
      } else if (category === 'oils') {
        oils.push(ingredient);
      } else if (category === 'others') {
        others.push(ingredient);
      }
      // If there's no mapping, the ingredient is simply skipped
    });

    return { herbs, oils, others };
  }, [ingredients, userMapping]);
};
