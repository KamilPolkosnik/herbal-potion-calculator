
import React from 'react';
import IngredientCard from './IngredientCard';

interface IngredientSectionProps {
  title: string;
  items: string[];
  ingredients: Record<string, number>;
  prices: Record<string, number>;
  ingredientUnits: Record<string, string>;
  onAmountUpdate: (ingredient: string, value: number) => void;
  onPriceUpdate: (ingredient: string, value: number) => void;
  compositionUsage: Record<string, Array<{
    id: string;
    name: string;
    amount: number;
    unit: string;
  }>>;
  warningThresholds?: {
    herbs: number;
    oils: number;
    others: number;
  };
}

const IngredientSection: React.FC<IngredientSectionProps> = ({
  title,
  items,
  ingredients,
  prices,
  ingredientUnits,
  onAmountUpdate,
  onPriceUpdate,
  compositionUsage,
  warningThresholds
}) => {
  if (items.length === 0) return null;

  const getWarningThreshold = (ingredient: string) => {
    if (!warningThresholds) return 0;
    
    const unit = ingredientUnits[ingredient] || 'g';
    
    if (unit === 'ml') {
      return warningThresholds.oils;
    } else if (unit === 'szt' || unit === 'kpl') {
      return warningThresholds.others;
    } else {
      return warningThresholds.herbs;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((ingredient) => (
          <IngredientCard
            key={ingredient}
            ingredient={ingredient}
            unit={ingredientUnits[ingredient] || 'g'}
            amount={ingredients[ingredient] || 0}
            price={prices[ingredient] || 0}
            onAmountUpdate={onAmountUpdate}
            onPriceUpdate={onPriceUpdate}
            compositionUsage={compositionUsage[ingredient] || []}
            warningThreshold={getWarningThreshold(ingredient)}
          />
        ))}
      </div>
    </div>
  );
};

export default IngredientSection;
