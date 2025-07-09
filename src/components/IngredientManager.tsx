import React, { useState } from 'react';
import { useIngredientCategories, Category } from '@/hooks/useIngredientCategories';
import { IngredientSection } from './IngredientSection';

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

  const filteredIngredients = allIngredients;

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
    <>
      <section>
        <h2 className="text-xl font-bold mb-2">Surowce ziołowe</h2>
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
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Olejki</h2>
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
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Inne</h2>
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
      </section>
    </>
  );
};