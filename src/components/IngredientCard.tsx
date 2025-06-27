
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IngredientCardProps {
  ingredient: string;
  unit: string;
  amount: number;
  price: number;
  onAmountUpdate: (ingredient: string, value: number) => void;
  onPriceUpdate: (ingredient: string, value: number) => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  unit,
  amount,
  price,
  onAmountUpdate,
  onPriceUpdate
}) => {
  // Określ odpowiednią jednostkę ceny na podstawie jednostki produktu
  const getPriceUnit = (unit: string) => {
    if (unit === 'ml') {
      return 'zł/10ml';
    } else if (unit === 'szt.' || unit === 'szt') {
      return 'zł/szt';
    } else if (unit === 'kpl.' || unit === 'kpl') {
      return 'zł/kpl';
    } else {
      return 'zł/100g';
    }
  };

  const calculateValue = () => {
    if (unit === 'ml') {
      // Dla olejków: cena za 10ml, więc wartość = (ilość/10) * cena
      return (amount * price / 10).toFixed(2);
    } else if (unit === 'szt.' || unit === 'kpl.' || unit === 'szt' || unit === 'kpl') {
      // Dla sztuk/kompletów: wartość = ilość * cena
      return (amount * price).toFixed(2);
    } else {
      // Dla gramów: cena za 100g, więc wartość = (ilość/100) * cena
      return (amount * price / 100).toFixed(2);
    }
  };

  const actualPriceUnit = getPriceUnit(unit);

  return (
    <div className="space-y-2 p-4 border rounded-lg bg-white">
      <Label htmlFor={ingredient} className="text-sm font-medium capitalize">
        {ingredient}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-gray-500">Stan ({unit})</Label>
          <Input
            id={ingredient}
            type="number"
            value={amount || ''}
            onChange={(e) => onAmountUpdate(ingredient, parseFloat(e.target.value) || 0)}
            placeholder={`0 ${unit}`}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Cena ({actualPriceUnit})</Label>
          <Input
            type="number"
            step="0.01"
            value={price || ''}
            onChange={(e) => onPriceUpdate(ingredient, parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="h-8"
          />
        </div>
      </div>
      <div className="text-xs text-gray-600 text-center mt-2">
        Wartość: {calculateValue()} zł
      </div>
    </div>
  );
};

export default IngredientCard;
