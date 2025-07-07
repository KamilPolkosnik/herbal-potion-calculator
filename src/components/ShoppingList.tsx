
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Package, Calculator } from 'lucide-react';

interface ShoppingListProps {
  prices: Record<string, number>;
  onPriceUpdate: (ingredient: string, price: number) => void;
}

interface Composition {
  id: string;
  name: string;
  sale_price: number;
}

interface CompositionIngredient {
  ingredient_name: string;
  amount: number;
  unit: string;
}

interface ShoppingItem {
  ingredient_name: string;
  total_amount: number;
  unit: string;
  current_price: number;
  estimated_cost: number;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ prices, onPriceUpdate }) => {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [ingredients, setIngredients] = useState<Record<string, CompositionIngredient[]>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Pobierz zestawy
      const { data: compositionsData, error: compositionsError } = await supabase
        .from('compositions')
        .select('*')
        .order('name');

      if (compositionsError) throw compositionsError;

      // Pobierz składniki zestawów
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('composition_ingredients')
        .select('*');

      if (ingredientsError) throw ingredientsError;

      // Grupuj składniki według composition_id
      const ingredientsByComposition: Record<string, CompositionIngredient[]> = {};
      ingredientsData?.forEach((ingredient) => {
        if (!ingredientsByComposition[ingredient.composition_id]) {
          ingredientsByComposition[ingredient.composition_id] = [];
        }
        ingredientsByComposition[ingredient.composition_id].push({
          ingredient_name: ingredient.ingredient_name,
          amount: ingredient.amount,
          unit: ingredient.unit
        });
      });

      setCompositions(compositionsData || []);
      setIngredients(ingredientsByComposition);

      // Inicjalizuj ilości na 1 dla każdego zestawu
      const initialQuantities: Record<string, number> = {};
      compositionsData?.forEach(comp => {
        initialQuantities[comp.id] = 1;
      });
      setQuantities(initialQuantities);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCostPerSet = (compositionId: string) => {
    const ingredientsList = ingredients[compositionId] || [];
    let totalCost = 0;
    
    console.log(`ShoppingList - Obliczanie kosztu dla zestawu ${compositionId}:`);
    
    for (const ingredient of ingredientsList) {
      const price = prices[ingredient.ingredient_name] || 0;
      let ingredientCost = 0;
      
      console.log(`- Składnik: ${ingredient.ingredient_name}`);
      console.log(`  Ilość potrzebna: ${ingredient.amount} ${ingredient.unit}`);
      console.log(`  Cena składnika: ${price} zł`);
      
      if (ingredient.unit === 'krople') {
        // Przelicz krople na ml: 20 kropel = 1ml
        const mlNeeded = ingredient.amount / 20;
        ingredientCost = mlNeeded * price;
        console.log(`  Przeliczenie: ${ingredient.amount} kropli = ${mlNeeded} ml`);
        console.log(`  Koszt: ${mlNeeded} ml × ${price} zł/ml = ${ingredientCost} zł`);
      } else if (ingredient.unit === 'g') {
        // NAPRAWKA: Sprawdźmy czy cena jest za 1g czy za 100g
        // Prawdopodobnie cena jest wprowadzana za 100g
        ingredientCost = (ingredient.amount * price) / 100;
        console.log(`  Koszt: ${ingredient.amount}g × ${price} zł/100g = ${ingredientCost} zł`);
      } else if (ingredient.unit === 'szt') {
        // Dla sztuk - cena bezpośrednio
        ingredientCost = ingredient.amount * price;
        console.log(`  Koszt: ${ingredient.amount} szt × ${price} zł/szt = ${ingredientCost} zł`);
      } else {
        // Domyślnie - cena bezpośrednio
        ingredientCost = ingredient.amount * price;
        console.log(`  Koszt (domyślnie): ${ingredient.amount} × ${price} = ${ingredientCost} zł`);
      }
      
      totalCost += ingredientCost;
      console.log(`  Koszt składnika: ${ingredientCost} zł`);
    }
    
    console.log(`ShoppingList - Całkowity koszt zestawu: ${totalCost} zł`);
    return totalCost;
  };

  const updateQuantity = (compositionId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [compositionId]: Math.max(0, quantity) }));
  };

  const generateShoppingList = () => {
    const shoppingItems: Record<string, ShoppingItem> = {};

    // Przejdź przez wszystkie zestawy i ich ilości
    Object.entries(quantities).forEach(([compositionId, quantity]) => {
      if (quantity > 0) {
        const ingredientsList = ingredients[compositionId] || [];
        
        ingredientsList.forEach(ingredient => {
          const totalNeeded = ingredient.amount * quantity;
          const key = `${ingredient.ingredient_name}_${ingredient.unit}`;
          
          if (shoppingItems[key]) {
            shoppingItems[key].total_amount += totalNeeded;
          } else {
            const price = prices[ingredient.ingredient_name] || 0;
            let estimatedCost = 0;
            
            // Obliczanie kosztu zgodnie z jednostką
            if (ingredient.unit === 'krople') {
              const mlNeeded = totalNeeded / 20;
              estimatedCost = mlNeeded * price;
            } else if (ingredient.unit === 'g') {
              estimatedCost = (totalNeeded * price) / 100; // Cena za 100g
            } else {
              estimatedCost = totalNeeded * price;
            }
            
            shoppingItems[key] = {
              ingredient_name: ingredient.ingredient_name,
              total_amount: totalNeeded,
              unit: ingredient.unit,
              current_price: price,
              estimated_cost: estimatedCost
            };
          }
        });
      }
    });

    const shoppingArray = Object.values(shoppingItems);
    const total = shoppingArray.reduce((sum, item) => sum + item.estimated_cost, 0);
    
    setShoppingList(shoppingArray);
    setTotalCost(total);
  };

  const handlePriceChange = async (ingredient: string, newPrice: number) => {
    console.log('ShoppingList - aktualizacja ceny:', ingredient, newPrice);
    await onPriceUpdate(ingredient, newPrice);
    // Przelicz listę zakupów po zmianie ceny
    generateShoppingList();
  };

  useEffect(() => {
    generateShoppingList();
  }, [quantities, ingredients, prices]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie danych...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sekcja wyboru zestawów */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Wybór Zestawów do Zakupu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compositions.map((composition) => {
              const costPerSet = calculateCostPerSet(composition.id);
              const quantity = quantities[composition.id] || 0;
              const totalCostForComposition = costPerSet * quantity;
              
              return (
                <div key={composition.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{composition.name}</h3>
                    <Badge variant="secondary">
                      {composition.sale_price?.toFixed(2) || '0.00'} zł
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Koszt produkcji: </span>
                      <span className="text-red-600 font-bold">
                        {costPerSet.toFixed(2)} zł
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Zysk na sztuce: </span>
                      <span className={`font-bold ${(composition.sale_price || 0) - costPerSet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {((composition.sale_price || 0) - costPerSet).toFixed(2)} zł
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => updateQuantity(composition.id, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">sztuk</span>
                  </div>
                  
                  {quantity > 0 && (
                    <div className="mt-2 text-sm font-medium text-blue-600">
                      Łączny koszt: {totalCostForComposition.toFixed(2)} zł
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista zakupów */}
      {shoppingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Lista Zakupów
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shoppingList.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium capitalize">{item.ingredient_name}</h4>
                    <p className="text-sm text-gray-600">
                      Potrzebne: {item.total_amount} {item.unit}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cena za jednostkę:</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.current_price}
                          onChange={(e) => handlePriceChange(item.ingredient_name, parseFloat(e.target.value) || 0)}
                          className="w-20 text-right"
                        />
                        <span className="text-sm text-gray-500">
                          zł/{item.unit === 'g' ? '100g' : item.unit}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Szacowany koszt:</p>
                      <p className="font-bold text-green-600">
                        {item.estimated_cost.toFixed(2)} zł
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Łączny szacowany koszt:</span>
                <span className="text-green-600">{totalCost.toFixed(2)} zł</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shoppingList.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calculator className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              Wybierz zestawy powyżej, aby wygenerować listę zakupów
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShoppingList;
