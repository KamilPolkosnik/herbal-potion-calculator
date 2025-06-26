
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface ShoppingListProps {
  prices: Record<string, number>;
}

interface Composition {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface CompositionIngredient {
  ingredient_name: string;
  amount: number;
  unit: string;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ prices }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [compositionIngredients, setCompositionIngredients] = useState<Record<string, CompositionIngredient[]>>({});
  const [loading, setLoading] = useState(true);

  const loadCompositions = async () => {
    try {
      const { data: compositionsData, error: compositionsError } = await supabase
        .from('compositions')
        .select('*')
        .order('name');

      if (compositionsError) throw compositionsError;

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
      setCompositionIngredients(ingredientsByComposition);
    } catch (error) {
      console.error('Error loading compositions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompositions();
  }, []);

  const updateQuantity = (compositionId: string, quantity: number) => {
    setQuantities({ ...quantities, [compositionId]: quantity });
  };

  // Obliczanie potrzebnych składników
  const calculateNeededIngredients = () => {
    const needed: Record<string, number> = {};
    
    compositions.forEach((composition) => {
      const quantity = quantities[composition.id] || 0;
      if (quantity > 0) {
        const ingredientsList = compositionIngredients[composition.id] || [];
        
        ingredientsList.forEach((ingredient) => {
          if (ingredient.unit === 'krople') {
            // Przelicz krople na ml (20 kropel = 1ml)
            const mlNeeded = (ingredient.amount * quantity) / 20;
            needed[ingredient.ingredient_name] = (needed[ingredient.ingredient_name] || 0) + mlNeeded;
          } else {
            // Dla gramów
            needed[ingredient.ingredient_name] = (needed[ingredient.ingredient_name] || 0) + (ingredient.amount * quantity);
          }
        });
      }
    });
    
    return needed;
  };

  const neededIngredients = calculateNeededIngredients();
  
  // Oblicz całkowity koszt
  const totalCost = Object.entries(neededIngredients).reduce((sum, [ingredient, amount]) => {
    const price = prices[ingredient] || 0;
    if (ingredient.includes('olejek')) {
      return sum + (amount * price); // olejki w ml
    } else {
      return sum + (amount * price / 100); // surowce - cena za 100g
    }
  }, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie zestawów...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center text-blue-700">
            Lista Zakupów - Planowanie Zestawów
          </CardTitle>
        </CardHeader>
        <CardContent>
          {compositions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Brak zestawów. Dodaj nowe zestawy w zakładce "Zarządzanie".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {compositions.map((composition) => (
                <div key={composition.id} className="p-4 border rounded-lg bg-white">
                  <div className={`${composition.color} text-white p-3 rounded-lg mb-3`}>
                    <h3 className="font-semibold">{composition.name}</h3>
                    <p className="text-sm opacity-90">{composition.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Ilość zestawów</Label>
                    <Input
                      type="number"
                      min="0"
                      value={quantities[composition.id] || ''}
                      onChange={(e) => updateQuantity(composition.id, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(neededIngredients).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-green-700">
              Podsumowanie Potrzebnych Składników
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Surowce Ziołowe</h3>
                <div className="space-y-2">
                  {Object.entries(neededIngredients)
                    .filter(([ingredient]) => !ingredient.includes('olejek'))
                    .map(([ingredient, amount]) => (
                      <div key={ingredient} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="capitalize text-sm">{ingredient}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{amount.toFixed(1)} g</Badge>
                          <span className="text-sm text-gray-600">
                            {((amount * (prices[ingredient] || 0)) / 100).toFixed(2)} zł
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Olejki Eteryczne</h3>
                <div className="space-y-2">
                  {Object.entries(neededIngredients)
                    .filter(([ingredient]) => ingredient.includes('olejek'))
                    .map(([ingredient, amount]) => (
                      <div key={ingredient} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="capitalize text-sm">{ingredient.replace('olejek ', '')}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{amount.toFixed(1)} ml</Badge>
                          <span className="text-sm text-gray-600">
                            {(amount * (prices[ingredient] || 0)).toFixed(2)} zł
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-blue-800">Całkowity koszt zakupów:</span>
                <span className="text-2xl font-bold text-blue-600">{totalCost.toFixed(2)} zł</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShoppingList;
