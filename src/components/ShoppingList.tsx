
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useIngredients } from '@/hooks/useIngredients';
import { useIngredientCategories } from '@/hooks/useIngredientCategories';

interface ShoppingItem {
  name: string;
  neededAmount: number;
  currentAmount: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
}

interface ShoppingListProps {
  warningThresholds?: {
    herbs: number;
    oils: number;
    others: number;
  };
}

const ShoppingList: React.FC<ShoppingListProps> = ({ warningThresholds }) => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const { ingredients, prices, updatePrice } = useIngredients();

  // Prepare ingredient names and units for the categorization hook
  const ingredientNames = shoppingItems.map(item => item.name);
  const ingredientUnits = shoppingItems.reduce((acc, item) => {
    acc[item.name] = item.unit;
    return acc;
  }, {} as Record<string, string>);

  const { herbs, oils, others } = useIngredientCategories(ingredientNames, ingredientUnits);

  const loadShoppingList = async () => {
    setLoading(true);
    try {
      const { data: compositions, error: compositionsError } = await supabase
        .from('compositions')
        .select('id, name');

      if (compositionsError) {
        console.error('Error loading compositions:', compositionsError);
        return;
      }

      let allIngredients: { name: string; amount: number; unit: string; compositionName: string }[] = [];

      for (const composition of compositions || []) {
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('composition_ingredients')
          .select('ingredient_name, amount, unit')
          .eq('composition_id', composition.id);

        if (ingredientsError) {
          console.error('Error loading ingredients for composition:', ingredientsError);
          continue;
        }

        if (ingredientsData) {
          allIngredients = allIngredients.concat(ingredientsData.map(item => ({
            name: item.ingredient_name,
            amount: item.amount,
            unit: item.unit,
            compositionName: composition.name
          })));
        }
      }

      const shoppingListItems: ShoppingItem[] = [];
      const aggregatedIngredients: Record<string, { neededAmount: number; unit: string }> = {};

      for (const ingredient of allIngredients) {
        const { name, amount, unit } = ingredient;

        if (aggregatedIngredients[name]) {
          aggregatedIngredients[name].neededAmount += amount;
        } else {
          aggregatedIngredients[name] = { neededAmount: amount, unit: unit };
        }
      }

      for (const ingredientName in aggregatedIngredients) {
        const neededAmount = aggregatedIngredients[ingredientName].neededAmount;
        const unit = aggregatedIngredients[ingredientName].unit;
        const currentAmount = ingredients[ingredientName] || 0;
        const pricePerUnit = prices[ingredientName] || 0;
        const neededBuyAmount = Math.max(0, neededAmount - currentAmount);
        const totalCost = neededBuyAmount * pricePerUnit;

        shoppingListItems.push({
          name: ingredientName,
          neededAmount: neededAmount,
          currentAmount: currentAmount,
          unit: unit,
          pricePerUnit: pricePerUnit,
          totalCost: totalCost
        });
      }

      setShoppingItems(shoppingListItems);
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = (name: string) => {
    setCheckedItems(prev => {
      const newCheckedItems = new Set(prev);
      if (newCheckedItems.has(name)) {
        newCheckedItems.delete(name);
      } else {
        newCheckedItems.add(name);
      }
      return newCheckedItems;
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadShoppingList();
    setLoading(false);
  };

  const handleCustomAmountChange = (name: string, value: number) => {
    setCustomAmounts(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceUpdate = async (ingredient: string, price: number) => {
    console.log('ShoppingList - updating price:', ingredient, price);
    await updatePrice(ingredient, price);
  };

  const calculateTotalCost = () => {
    let total = 0;
    for (const item of shoppingItems) {
      const buyAmount = customAmounts[item.name] !== undefined ? customAmounts[item.name] : Math.max(0, item.neededAmount - item.currentAmount);
      total += buyAmount * item.pricePerUnit;
    }
    return total;
  };

  useEffect(() => {
    loadShoppingList();
  }, [ingredients, warningThresholds]);

  const renderCategorySection = (title: string, items: string[], categoryItems: ShoppingItem[], unit: string, threshold?: number) => {
    if (categoryItems.length === 0) return null;

    return (
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {title}
          {threshold !== undefined && (
            <span className="text-sm text-gray-500 ml-2">
              (Próg ostrzegawczy: {threshold}{unit})
            </span>
          )}
        </h3>
        <div className="space-y-2">
          {categoryItems.map(item => (
            <div key={item.name} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`check-${item.name}`}
                  checked={checkedItems.has(item.name)}
                  onCheckedChange={() => handleCheck(item.name)}
                />
                <label
                  htmlFor={`check-${item.name}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {item.name}
                </label>
                <Badge variant="outline">
                  Potrzeba: {item.neededAmount} {item.unit}
                </Badge>
                <Badge variant="secondary">
                  Obecnie: {item.currentAmount} {item.unit}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Cena za jednostkę"
                  className="w-24"
                  value={item.pricePerUnit}
                  onChange={(e) => handlePriceUpdate(item.name, parseFloat(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  placeholder="Ilość do kupienia"
                  className="w-24"
                  value={customAmounts[item.name] !== undefined ? customAmounts[item.name] : Math.max(0, item.neededAmount - item.currentAmount)}
                  onChange={(e) => handleCustomAmountChange(item.name, parseFloat(e.target.value))}
                />
                <Button variant="destructive" size="icon" disabled={!checkedItems.has(item.name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const herbItems = shoppingItems.filter(item => herbs.includes(item.name));
  const oilItems = shoppingItems.filter(item => oils.includes(item.name));
  const otherItems = shoppingItems.filter(item => others.includes(item.name));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Lista Zakupów</CardTitle>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p>Ładowanie listy zakupów...</p>
        ) : (
          <>
            {renderCategorySection(
              "Surowce Ziołowe (g)", 
              herbs, 
              herbItems, 
              "g", 
              warningThresholds?.herbs
            )}

            {renderCategorySection(
              "Olejki Eteryczne (ml)", 
              oils, 
              oilItems, 
              "ml", 
              warningThresholds?.oils
            )}

            {renderCategorySection(
              "Inne (szt/kpl)", 
              others, 
              otherItems, 
              "szt/kpl", 
              warningThresholds?.others
            )}

            {shoppingItems.length === 0 && <p>Brak składników do wyświetlenia na liście zakupów.</p>}

            <div className="mt-4">
              <h4 className="text-lg font-semibold">Podsumowanie</h4>
              <p>
                Całkowity kosztorys: {calculateTotalCost().toFixed(2)} zł
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ShoppingList;
