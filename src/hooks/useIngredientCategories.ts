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

    ingredients.forEach(ing => {
      switch (userMapping[ing]) {
        case 'herbs':
          herbs.push(ing);
          break;
        case 'oils':
          oils.push(ing);
          break;
        case 'others':
          others.push(ing);
          break;
        default:
          others.push(ing);
      }
    });

    return { herbs, oils, others };
  }, [ingredients, userMapping]);
};
