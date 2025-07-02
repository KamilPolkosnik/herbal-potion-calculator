
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Save } from 'lucide-react';

interface IngredientCardProps {
  name: string;
  amount: number;
  price: number;
  unit: string;
  onAmountUpdate: (name: string, amount: number) => void;
  onPriceUpdate: (name: string, price: number) => void;
  compositionUsage?: Record<string, number>;
  warningThresholds?: {
    herbs: number;
    oils: number;
    others: number;
  };
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  name,
  amount,
  price,
  unit,
  onAmountUpdate,
  onPriceUpdate,
  compositionUsage,
  warningThresholds
}) => {
  const [localAmount, setLocalAmount] = useState(amount.toString());
  const [localPrice, setLocalPrice] = useState(price.toString());
  const [amountChanged, setAmountChanged] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);

  useEffect(() => {
    setLocalAmount(amount.toString());
    setAmountChanged(false);
  }, [amount]);

  useEffect(() => {
    setLocalPrice(price.toString());
    setPriceChanged(false);
  }, [price]);

  const handleAmountChange = (value: string) => {
    setLocalAmount(value);
    setAmountChanged(parseFloat(value) !== amount);
  };

  const handlePriceChange = (value: string) => {
    setLocalPrice(value);
    setPriceChanged(parseFloat(value) !== price);
  };

  const handleSaveAmount = () => {
    const newAmount = parseFloat(localAmount) || 0;
    onAmountUpdate(name, newAmount);
    setAmountChanged(false);
  };

  const handleSavePrice = () => {
    const newPrice = parseFloat(localPrice) || 0;
    onPriceUpdate(name, newPrice);
    setPriceChanged(false);
  };

  const getWarningThreshold = () => {
    if (!warningThresholds) return 0;
    
    if (unit === 'ml') {
      return warningThresholds.oils;
    } else if (unit === 'szt' || unit === 'kpl') {
      return warningThresholds.others;
    } else {
      return warningThresholds.herbs;
    }
  };

  const isLowStock = amount < getWarningThreshold();
  const usage = compositionUsage?.[name] || 0;

  return (
    <Card className={`p-4 ${isLowStock ? 'border-red-300 bg-red-50' : ''}`}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">{name}</h3>
          {isLowStock && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={localAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-sm"
                step="0.01"
              />
            </div>
            <span className="text-xs text-gray-500 min-w-[30px]">{unit}</span>
            <Button
              size="sm"
              variant={amountChanged ? "default" : "outline"}
              onClick={handleSaveAmount}
              disabled={!amountChanged}
              className="px-2"
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={localPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="text-sm"
                step="0.01"
              />
            </div>
            <span className="text-xs text-gray-500 min-w-[30px]">zł</span>
            <Button
              size="sm"
              variant={priceChanged ? "default" : "outline"}
              onClick={handleSavePrice}
              disabled={!priceChanged}
              className="px-2"
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {usage > 0 && (
          <div className="mt-2 pt-2 border-t">
            <Badge variant="secondary" className="text-xs">
              Użycie: {usage.toFixed(2)} {unit}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IngredientCard;
