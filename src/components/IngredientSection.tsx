
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IngredientCard from './IngredientCard';

interface IngredientSectionProps {
  title: string;
  items: string[];
  ingredients: Record<string, number>;
  prices: Record<string, number>;
  ingredientUnits: Record<string, string>;
  onAmountUpdate: (name: string, amount: number) => void;
  onPriceUpdate: (name: string, price: number) => void;
  compositionUsage?: Record<string, number>;
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
  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((ingredient) => (
            <IngredientCard
              key={ingredient}
              name={ingredient}
              amount={ingredients[ingredient] || 0}
              price={prices[ingredient] || 0}
              unit={ingredientUnits[ingredient] || 'g'}
              onAmountUpdate={onAmountUpdate}
              onPriceUpdate={onPriceUpdate}
              compositionUsage={compositionUsage}
              warningThresholds={warningThresholds}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IngredientSection;
