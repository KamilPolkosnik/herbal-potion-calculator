
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info, circle-alert } from 'lucide-react';

interface IngredientCardProps {
  ingredient: string;
  unit: string;
  amount: number;
  price: number;
  onAmountUpdate: (ingredient: string, value: number) => void;
  onPriceUpdate: (ingredient: string, value: number) => void;
  compositionUsage?: Array<{
    id: string;
    name: string;
    amount: number;
    unit: string;
  }>;
  warningThreshold?: number;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  unit,
  amount,
  price,
  onAmountUpdate,
  onPriceUpdate,
  compositionUsage = [],
  warningThreshold = 0
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
  const isLowStock = warningThreshold > 0 && amount < warningThreshold;

  return (
    <div className={`space-y-2 p-4 border rounded-lg ${isLowStock ? 'bg-red-50 border-red-300' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={ingredient} className="text-sm font-medium capitalize">
            {ingredient}
          </Label>
          {isLowStock && (
            <circle-alert className="h-4 w-4 text-red-600" title={`Niski stan! Poniżej ${warningThreshold} ${unit}`} />
          )}
        </div>
        {compositionUsage.length > 0 && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Info className="h-4 w-4 text-blue-500 cursor-help" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Użyty w zestawach:</h4>
                <div className="space-y-1">
                  {compositionUsage.map((usage) => (
                    <div key={usage.id} className="text-xs text-gray-600">
                      <span className="font-medium">{usage.name}</span>
                      <span className="ml-2 text-gray-500">
                        ({usage.amount} {usage.unit})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-gray-500">Stan ({unit})</Label>
          <Input
            id={ingredient}
            type="number"
            value={amount || ''}
            onChange={(e) => onAmountUpdate(ingredient, parseFloat(e.target.value) || 0)}
            placeholder={`0 ${unit}`}
            className={`h-8 ${isLowStock ? 'border-red-400 focus:border-red-500' : ''}`}
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
        {isLowStock && (
          <div className="text-red-600 font-medium mt-1">
            ⚠️ Niski stan! (poniżej {warningThreshold} {unit})
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientCard;
