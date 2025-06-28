
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

const IngredientSection: React.FC<IngredientSectionProps> = ({
  title,
  items,
  ingredients,
  prices,
  ingredientUnits,
  onAmountUpdate,
  onPriceUpdate,
  compositionUsage
}) => {
  if (items.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((ingredient) => {
            const unit = ingredientUnits[ingredient] || 'g';
            
            return (
              <IngredientCard
                key={ingredient}
                ingredient={ingredient}
                unit={unit}
                amount={ingredients[ingredient] || 0}
                price={prices[ingredient] || 0}
                onAmountUpdate={onAmountUpdate}
                onPriceUpdate={onPriceUpdate}
                compositionUsage={compositionUsage[ingredient] || []}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default IngredientSection;
