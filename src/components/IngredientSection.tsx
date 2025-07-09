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
}) => {
  return (
    <div>
      {ingredients.map(name => (
        <IngredientCard
          key={name}
          name={name}
          unit={ingredientUnits[name]}
          amount={ingredientAmounts[name]}
          price={ingredientPrices[name]}
          selectedCategory={ingredientCategories[name] || 'others'}
          onCategoryChange={onCategoryChange}
          onAmountUpdate={onAmountUpdate}
          onPriceUpdate={onPriceUpdate}
        />
      ))}
    </div>
  );
};


// src/components/IngredientManager.tsx
import React, { useState } from 'react';
import { useIngredientCategories } from '@/hooks/useIngredientCategories';
import { IngredientSection } from './IngredientSection';
import type { Category } from './IngredientCard';

interface IngredientManagerProps {
  allIngredients: string[];
  ingredientUnits: Record<string, string>;
  initialAmounts: Record<string, number>;
  initialPrices: Record<string, number>;
  thresholds?: {
    herbs_threshold: number;
    oils_threshold: number;
    others_threshold: number;
  };
}

export const IngredientManager: React.FC<IngredientManagerProps> = ({
  allIngredients,
  ingredientUnits,
  initialAmounts,
  initialPrices,
  thresholds,
}) => {
  const [ingredientCategories, setIngredientCategories] = useState<Record<string, Category>>({});
  const [amounts, setAmounts] = useState(initialAmounts);
  const [prices, setPrices] = useState(initialPrices);

  const handleCategoryChange = (name: string, category: Category) => {
    setIngredientCategories(prev => ({ ...prev, [name]: category }));
  };

  const handleAmountUpdate = (name: string, amount: number) => {
    setAmounts(prev => ({ ...prev, [name]: amount }));
  };

  const handlePriceUpdate = (name: string, price: number) => {
    setPrices(prev => ({ ...prev, [name]: price }));
  };

  // Filter logic as before, if any
  const filteredIngredients = allIngredients; // adjust if you have filters

  const { herbs, oils, others } = useIngredientCategories(
    filteredIngredients,
    ingredientCategories
  );

  const warningThresholds = thresholds
    ? {
        herbs: thresholds.herbs_threshold,
        oils: thresholds.oils_threshold,
        others: thresholds.others_threshold,
      }
    : undefined;

  return (
    <div>
      <h2>Zioła</h2>
      <IngredientSection
        ingredients={herbs}
        ingredientUnits={ingredientUnits}
        ingredientAmounts={amounts}
        ingredientPrices={prices}
        ingredientCategories={ingredientCategories}
        onCategoryChange={handleCategoryChange}
        onAmountUpdate={handleAmountUpdate}
        onPriceUpdate={handlePriceUpdate}
      />

      <h2>Olejki</h2>
      <IngredientSection
        ingredients={oils}
        ingredientUnits={ingredientUnits}
        ingredientAmounts={amounts}
        ingredientPrices={prices}
        ingredientCategories={ingredientCategories}
        onCategoryChange={handleCategoryChange}
        onAmountUpdate={handleAmountUpdate}
        onPriceUpdate={handlePriceUpdate}
      />

      <h2>Inne</h2>
      <IngredientSection
        ingredients={others}
        ingredientUnits={ingredientUnits}
        ingredientAmounts={amounts}
        ingredientPrices={prices}
        ingredientCategories={ingredientCategories}
        onCategoryChange={handleCategoryChange}
        onAmountUpdate={handleAmountUpdate}
        onPriceUpdate={handlePriceUpdate}
      />

      {/* You can still use warningThresholds where needed */}
    </div>
  );
};
