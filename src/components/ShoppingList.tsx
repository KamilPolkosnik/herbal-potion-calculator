
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { compositions } from '@/data/compositions';

interface ShoppingListProps {
  prices: Record<string, number>;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ prices }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (compositionName: string, quantity: number) => {
    setQuantities({ ...quantities, [compositionName]: quantity });
  };

  // Obliczanie potrzebnych składników
  const calculateNeededIngredients = () => {
    const needed: Record<string, number> = {};
    
    compositions.forEach((composition) => {
      const quantity = quantities[composition.name] || 0;
      if (quantity > 0) {
        // Dodaj surowce
        Object.entries(composition.herbs).forEach(([herb, amount]) => {
          needed[herb] = (needed[herb] || 0) + (amount * quantity);
        });
        
        // Dodaj olejki (przelicz krople na ml)
        Object.entries(composition.oils).forEach(([oil, drops]) => {
          const mlNeeded = (drops * quantity) / 20; // 20 kropel = 1ml
          needed[oil] = (needed[oil] || 0) + mlNeeded;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center text-blue-700">
            Lista Zakupów - Planowanie Zestawów
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {compositions.map((composition) => (
              <div key={composition.name} className="p-4 border rounded-lg bg-white">
                <div className={`${composition.color} text-white p-3 rounded-lg mb-3`}>
                  <h3 className="font-semibold">{composition.name}</h3>
                  <p className="text-sm opacity-90">{composition.description}</p>
                </div>
                <div>
                  <Label className="text-sm">Ilość zestawów</Label>
                  <Input
                    type="number"
                    min="0"
                    value={quantities[composition.name] || ''}
                    onChange={(e) => updateQuantity(composition.name, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
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
