
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  pendingAmount?: number;
  pendingPrice?: number;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  name,
  amount,
  price,
  unit,
  onAmountUpdate,
  onPriceUpdate,
  warningThresholds,
  pendingAmount,
  pendingPrice
}) => {
  const [localAmount, setLocalAmount] = useState((pendingAmount ?? amount).toString());
  const [localPrice, setLocalPrice] = useState((pendingPrice ?? price).toString());
  const [compositions, setCompositions] = useState<Array<{ name: string; amount: number }>>([]);

  useEffect(() => {
    setLocalAmount((pendingAmount ?? amount).toString());
  }, [amount, pendingAmount]);

  useEffect(() => {
    setLocalPrice((pendingPrice ?? price).toString());
  }, [price, pendingPrice]);

  useEffect(() => {
    const loadCompositions = async () => {
      try {
        const { data, error } = await supabase
          .from('composition_ingredients')
          .select(`
            amount,
            unit,
            compositions:composition_id (
              name
            )
          `)
          .eq('ingredient_name', name);

        if (error) throw error;

        const compositionData = data?.map(item => ({
          name: (item.compositions as any)?.name || 'Unknown',
          amount: item.amount
        })) || [];

        setCompositions(compositionData);
      } catch (error) {
        console.error('Error loading compositions:', error);
      }
    };

    loadCompositions();
  }, [name]);

  const handleAmountChange = (value: string) => {
    setLocalAmount(value);
    const numValue = parseFloat(value) || 0;
    onAmountUpdate(name, numValue);
  };

  const handlePriceChange = (value: string) => {
    setLocalPrice(value);
    const numValue = parseFloat(value) || 0;
    onPriceUpdate(name, numValue);
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

  return (
    <Card className={`p-4 ${isLowStock ? 'border-red-300 bg-red-50' : ''}`}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{name}</h3>
            {compositions.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">Używany w zestawach:</p>
                      {compositions.map((comp, index) => (
                        <p key={index} className="text-sm">
                          {comp.name}: {comp.amount} {unit}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IngredientCard;
