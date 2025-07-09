import React from 'react';
import { IngredientCard, Category } from './IngredientCard';

interface IngredientSectionProps {
  ingredients: string[];
  ingredientUnits: Record<string, string>;
  ingredientAmounts: Record<string, number>;
  ingredientPrices: Record<string, number>;
  ingredientCategories: Record<string, Category>;
  onCategoryChange: (name: string, category: Category) => void;
  onAmountUpdate: (name: string, amount: number) => void;
  onPriceUpdate: (name: string, price: number) => void;
}

export const IngredientSection: React.FC<IngredientSectionProps> = ({
  ingredients,
  ingredientUnits,
  ingredientAmounts,
  ingredientPrices,
  ingredientCategories,
  onCategoryChange,
  onAmountUpdate,
  onPriceUpdate,
}) => (
  <div>
    {ingredients.map(name => (
      <IngredientCard
        key={name}
        name={name}
        unit={ingredientUnits[name]}
        amount={ingredientAmounts[name]}
        price={ingredientPrices[name]}
        selectedCategory={ingredientCategories[name]}
        onCategoryChange={onCategoryChange}
        onAmountUpdate={onAmountUpdate}
        onPriceUpdate={onPriceUpdate}
      />
    ))}
  </div>
);
