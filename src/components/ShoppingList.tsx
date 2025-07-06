import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useIngredients } from '@/hooks/useIngredients';

interface ShoppingItem {
  name: string;
  neededAmount: number;
  currentAmount: number;
  unit: string;
  userCategory?: string;
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
  const [userCategories, setUserCategories] = useState<Record<string, string>>({});
  const { ingredients, prices } = useIngredients();

  const loadUserCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name, unit');

      if (error) {
        console.error('Error loading user categories:', error);
        return;
      }

      const categories: Record<string, string> = {};
      
      data?.forEach(item => {
        const ingredientName = item.ingredient_name;
        const unit = item.unit;
        
        if (unit === 'krople') {
          categories[ingredientName] = 'olejek';
        } else if (unit === 'szt.' || unit === 'szt' || unit === 'kpl.' || unit === 'kpl') {
          categories[ingredientName] = 'inne';
        } else if (unit === 'g') {
          categories[ingredientName] = 'zioło';
        }
      });

      console.log('Shopping list loaded user categories:', categories);
      setUserCategories(categories);
    } catch (error) {
      console.error('Error loading user categories:', error);
    }
  };

  const categorizeIngredient = (ingredientName: string, unit: string): 'herbs' | 'oils' | 'others' => {
    console.log(`Shopping list - categorizing: ${ingredientName}, unit: ${unit}, user category: ${userCategories[ingredientName]}`);
    
    // First check user-defined category
    if (userCategories[ingredientName]) {
      const userCategory = userCategories[ingredientName];
      if (userCategory === 'olejek') {
        console.log(`${ingredientName} -> oils (user category)`);
        return 'oils';
      } else if (userCategory === 'inne') {
        console.log(`${ingredientName} -> others (user category)`);
        return 'others';
      } else if (userCategory === 'zioło') {
        console.log(`${ingredientName} -> herbs (user category)`);
        return 'herbs';
      }
    }

    const ingredientLower = ingredientName.toLowerCase();
    
    // Fall back to name-based detection
    if (ingredientLower.includes('olejek')) {
      console.log(`${ingredientName} -> oils (by name)`);
      return 'oils';
    } else if (ingredientLower.includes('etykiet') || 
               ingredientLower.includes('worek') || 
               ingredientLower.includes('woreczek') || 
               ingredientLower.includes('pojemnik') ||
               ingredientLower.includes('naklejk') ||
               ingredientLower.includes('opakow')) {
      console.log(`${ingredientName} -> others (by name)`);
      return 'others';
    } else {
      // Fall back to unit-based detection
      if (unit === 'ml') {
        console.log(`${ingredientName} -> oils (by unit ml)`);
        return 'oils';
      } else if (unit === 'szt' || unit === 'kpl') {
        console.log(`${ingredientName} -> others (by unit ${unit})`);
        return 'others';
      } else {
        console.log(`${ingredientName} -> herbs (by unit g or fallback)`);
        return 'herbs';
      }
    }
  };

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
          totalCost: totalCost,
          userCategory: userCategories[ingredientName]
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
    await loadUserCategories();
    await loadShoppingList();
    setLoading(false);
  };

  const handleCustomAmountChange = (name: string, value: number) => {
    setCustomAmounts(prev => ({ ...prev, [name]: value }));
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
    const initializeData = async () => {
      await loadUserCategories();
      await loadShoppingList();
    };
    
    initializeData();
  }, [ingredients, warningThresholds]);

  const herbs = shoppingItems.filter(item => categorizeIngredient(item.name, item.unit) === 'herbs');
  const oils = shoppingItems.filter(item => categorizeIngredient(item.name, item.unit) === 'oils');
  const others = shoppingItems.filter(item => categorizeIngredient(item.name, item.unit) === 'others');

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
            {herbs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Surowce Ziołowe (g)
                  {warningThresholds?.herbs !== undefined && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Próg ostrzegawczy: {warningThresholds.herbs}g)
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {herbs.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox
                          id={`check-${item.name}`}
                          checked={checkedItems.has(item.name)}
                          onCheckedChange={() => handleCheck(item.name)}
                        />
                        <label
                          htmlFor={`check-${item.name}`}
                          className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.name}
                        </label>
                        <Badge variant="outline" className="ml-2">
                          Potrzeba: {item.neededAmount} {item.unit}
                        </Badge>
                        <Badge variant="secondary" className="ml-2">
                          Obecnie: {item.currentAmount} {item.unit}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Input
                          type="number"
                          placeholder="Ilość do kupienia"
                          className="w-24 mr-2"
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
            )}

            {oils.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Olejki Eteryczne (ml)
                  {warningThresholds?.oils !== undefined && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Próg ostrzegawczy: {warningThresholds.oils}ml)
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {oils.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox
                          id={`check-${item.name}`}
                          checked={checkedItems.has(item.name)}
                          onCheckedChange={() => handleCheck(item.name)}
                        />
                        <label
                          htmlFor={`check-${item.name}`}
                          className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.name}
                        </label>
                        <Badge variant="outline" className="ml-2">
                          Potrzeba: {item.neededAmount} {item.unit}
                        </Badge>
                        <Badge variant="secondary" className="ml-2">
                          Obecnie: {item.currentAmount} {item.unit}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Input
                          type="number"
                          placeholder="Ilość do kupienia"
                          className="w-24 mr-2"
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
            )}

            {others.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Inne (szt/kpl)
                  {warningThresholds?.others !== undefined && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Próg ostrzegawczy: {warningThresholds.others}szt/kpl)
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {others.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox
                          id={`check-${item.name}`}
                          checked={checkedItems.has(item.name)}
                          onCheckedChange={() => handleCheck(item.name)}
                        />
                        <label
                          htmlFor={`check-${item.name}`}
                          className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.name}
                        </label>
                        <Badge variant="outline" className="ml-2">
                          Potrzeba: {item.neededAmount} {item.unit}
                        </Badge>
                        <Badge variant="secondary" className="ml-2">
                          Obecnie: {item.currentAmount} {item.unit}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Input
                          type="number"
                          placeholder="Ilość do kupienia"
                          className="w-24 mr-2"
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
