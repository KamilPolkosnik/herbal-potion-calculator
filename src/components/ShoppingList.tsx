
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileDown, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateOilPrice } from '@/utils/unitConverter';

interface ShoppingListProps {
  prices: Record<string, number>;
  onPriceUpdate?: (ingredient: string, price: number) => void;
}

interface Composition {
  id: string;
  name: string;
  description: string;
  color: string;
  sale_price: number;
}

interface CompositionIngredient {
  ingredient_name: string;
  amount: number;
  unit: string;
}

const VAT_RATE = 0.23; // 23% VAT

const ShoppingList: React.FC<ShoppingListProps> = ({ prices, onPriceUpdate }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [compositionIngredients, setCompositionIngredients] = useState<Record<string, CompositionIngredient[]>>({});
  const [ingredientUnits, setIngredientUnits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  // Load shopping list state from sessionStorage
  useEffect(() => {
    const savedQuantities = sessionStorage.getItem('shopping-list-quantities');
    const savedCheckedIngredients = sessionStorage.getItem('shopping-list-checked');
    const savedLocalPrices = sessionStorage.getItem('shopping-list-prices');
    
    if (savedQuantities) {
      try {
        setQuantities(JSON.parse(savedQuantities));
      } catch (error) {
        console.error('Error parsing saved quantities:', error);
      }
    }
    
    if (savedCheckedIngredients) {
      try {
        setCheckedIngredients(JSON.parse(savedCheckedIngredients));
      } catch (error) {
        console.error('Error parsing saved checked ingredients:', error);
      }
    }
  }, []);

  // Save shopping list state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('shopping-list-quantities', JSON.stringify(quantities));
  }, [quantities]);

  useEffect(() => {
    sessionStorage.setItem('shopping-list-checked', JSON.stringify(checkedIngredients));
  }, [checkedIngredients]);

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

      // Load ingredient units from both tables
      const uniqueIngredients = [...new Set(ingredientsData?.map(item => item.ingredient_name) || [])];
      
      // Load units from ingredients table first (higher priority)
      const { data: ingredientUnitsFromIngredients, error: unitsError } = await supabase
        .from('ingredients')
        .select('name, unit')
        .in('name', uniqueIngredients);

      // Load units from composition_ingredients table
      const { data: ingredientUnitsFromComposition, error: compositionUnitsError } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name, unit')
        .in('ingredient_name', uniqueIngredients);

      const unitsMap: Record<string, string> = {};
      
      // First, add units from ingredients table (higher priority)
      if (!unitsError && ingredientUnitsFromIngredients) {
        ingredientUnitsFromIngredients.forEach(item => {
          unitsMap[item.name] = item.unit;
          console.log(`ShoppingList - Składnik z ingredients: ${item.name}, Jednostka: ${item.unit}`);
        });
      }

      // Then, add units from composition_ingredients for missing ingredients
      if (!compositionUnitsError && ingredientUnitsFromComposition) {
        ingredientUnitsFromComposition.forEach(item => {
          if (!unitsMap[item.ingredient_name]) {
            unitsMap[item.ingredient_name] = item.unit;
            console.log(`ShoppingList - Składnik z composition_ingredients: ${item.ingredient_name}, Jednostka: ${item.unit}`);
          }
        });
      }

      // Only use fallback logic for ingredients that have no unit in database
      uniqueIngredients.forEach(ingredientName => {
        if (!unitsMap[ingredientName]) {
          if (ingredientName.toLowerCase().includes('olejek')) {
            unitsMap[ingredientName] = 'ml';
          } else if (ingredientName.toLowerCase().includes('worek') || 
                     ingredientName.toLowerCase().includes('woreczek') || 
                     ingredientName.toLowerCase().includes('pojemnik') ||
                     ingredientName.toLowerCase().includes('etykieta') ||
                     ingredientName.toLowerCase().includes('szt')) {
            unitsMap[ingredientName] = 'szt';
          } else {
            unitsMap[ingredientName] = 'g';
          }
          console.log(`ShoppingList - Jednostka domyślna για ${ingredientName}: ${unitsMap[ingredientName]}`);
        }
      });

      setIngredientUnits(unitsMap);
      console.log('ShoppingList - Finalna mapa jednostek składników:', unitsMap);

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

  const toggleIngredientCheck = (ingredientName: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [ingredientName]: !prev[ingredientName]
    }));
  };

  const updatePrice = async (ingredientName: string, newPrice: number) => {
    console.log('ShoppingList - updating price:', ingredientName, newPrice);
    
    // Always update global price through parent component
    if (onPriceUpdate) {
      await onPriceUpdate(ingredientName, newPrice);
    }
  };

  const clearShoppingList = () => {
    setQuantities({});
    setCheckedIngredients({});
    sessionStorage.removeItem('shopping-list-quantities');
    sessionStorage.removeItem('shopping-list-checked');
  };

  // Use prices directly from props (no local state for prices)
  const getIngredientPrice = (ingredientName: string) => {
    return prices[ingredientName] ?? 0;
  };

  // Obliczanie potrzebnych składników
  const calculateNeededIngredients = () => {
    const needed: Record<string, number> = {};
    
    compositions.forEach((composition) => {
      const quantity = quantities[composition.id] || 0;
      if (quantity > 0) {
        const ingredientsList = compositionIngredients[composition.id] || [];
        
        ingredientsList.forEach((ingredient) => {
          const actualUnit = ingredientUnits[ingredient.ingredient_name] || ingredient.unit;
          
          if (ingredient.unit === 'krople') {
            // Przelicz krople na ml (20 kropel = 1ml)
            const mlNeeded = (ingredient.amount * quantity) / 20;
            needed[ingredient.ingredient_name] = (needed[ingredient.ingredient_name] || 0) + mlNeeded;
          } else if (actualUnit === 'szt') {
            // Dla sztuk
            needed[ingredient.ingredient_name] = (needed[ingredient.ingredient_name] || 0) + (ingredient.amount * quantity);
          } else {
            // Dla gramów i ml
            needed[ingredient.ingredient_name] = (needed[ingredient.ingredient_name] || 0) + (ingredient.amount * quantity);
          }
        });
      }
    });
    
    return needed;
  };

  const calculateNetPrice = (grossPrice: number) => {
    return grossPrice / (1 + VAT_RATE);
  };

  const calculateVATAmount = (grossPrice: number) => {
    return grossPrice - calculateNetPrice(grossPrice);
  };

  const categorizeIngredients = (neededIngredients: Record<string, number>) => {
    const herbs: [string, number][] = [];
    const oils: [string, number][] = [];
    const others: [string, number][] = [];

    Object.entries(neededIngredients).forEach(([ingredient, amount]) => {
      // Use the actual unit from the database instead of fallback logic
      const unit = ingredientUnits[ingredient] || 'g';
      
      console.log(`ShoppingList - Kategoryzuję składnik: ${ingredient}, jednostka: ${unit}`);
      
      // Olejki muszą mieć jednostkę "ml" I zawierać "olejek" w nazwie
      if (unit === 'ml' && ingredient.toLowerCase().includes('olejek')) {
        oils.push([ingredient, amount]);
        console.log(`ShoppingList - ${ingredient} dodany do olejków (ml + nazwa zawiera 'olejek')`);
      } else if (unit === 'g') {
        herbs.push([ingredient, amount]);
        console.log(`ShoppingList - ${ingredient} dodany do ziół (g)`);
      } else if (unit === 'szt' || unit === 'kpl') {
        others.push([ingredient, amount]);
        console.log(`ShoppingList - ${ingredient} dodany do innych (${unit})`);
      } else {
        // fallback for any other units
        others.push([ingredient, amount]);
        console.log(`ShoppingList - ${ingredient} dodany do innych (fallback - ${unit})`);
      }
    });

    console.log('ShoppingList - Wyniki kategoryzacji:', { herbs, oils, others });
    return { herbs, oils, others };
  };

  const generateShoppingListPDF = () => {
    const neededIngredients = calculateNeededIngredients();
    
    if (Object.keys(neededIngredients).length === 0) {
      alert('Nie ma składników do wygenerowania listy zakupów. Ustaw ilości zestawów.');
      return;
    }

    const { herbs, oils, others } = categorizeIngredients(neededIngredients);
    const currentDate = new Date().toLocaleDateString('pl-PL');
    
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Lista Zakupów</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333; 
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 15px;
        }
        .header h1 { 
            color: #2E7D32; 
            margin: 0; 
            font-size: 28px;
        }
        .date { 
            color: #666; 
            margin-top: 10px; 
            font-size: 14px;
        }
        .section { 
            margin: 30px 0; 
        }
        .section-title { 
            background-color: #E8F5E8; 
            padding: 10px 15px; 
            border-left: 4px solid #4CAF50;
            font-size: 18px; 
            font-weight: bold; 
            color: #2E7D32;
            margin-bottom: 15px;
        }
        .ingredients-list { 
            display: grid; 
            gap: 10px; 
        }
        .ingredient-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 12px 15px;
            border: 1px solid #ddd; 
            border-radius: 5px;
            background-color: #fafafa;
        }
        .ingredient-name { 
            font-weight: 500; 
            text-transform: capitalize;
            flex: 1;
        }
        .ingredient-amount { 
            font-weight: bold; 
            color: #2E7D32;
            min-width: 80px;
            text-align: right;
        }
        .checkbox { 
            width: 18px; 
            height: 18px; 
            margin-right: 15px;
            border: 2px solid #4CAF50;
        }
        .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        .summary {
            background-color: #f0f8f0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Lista Zakupów</h1>
        <div class="date">Wygenerowano: ${currentDate}</div>
    </div>
    
    <div class="summary">
        <strong>Łączna liczba składników: ${Object.keys(neededIngredients).length}</strong>
    </div>
    
    ${herbs.length > 0 ? `
    <div class="section">
        <div class="section-title">🌿 Surowce Ziołowe (g)</div>
        <div class="ingredients-list">
            ${herbs.map(([ingredient, amount]) => `
                <div class="ingredient-item">
                    <input type="checkbox" class="checkbox">
                    <span class="ingredient-name">${ingredient}</span>
                    <span class="ingredient-amount">${amount.toFixed(1)} g</span>
                </div>
              `).join('')}
        </div>
    </div>
    ` : ''}
    
    ${oils.length > 0 ? `
    <div class="section">
        <div class="section-title">🌸 Olejki Eteryczne (ml)</div>
        <div class="ingredients-list">
            ${oils.map(([ingredient, amount]) => `
                <div class="ingredient-item">
                    <input type="checkbox" class="checkbox">
                    <span class="ingredient-name">${ingredient.replace('olejek ', '')}</span>
                    <span class="ingredient-amount">${amount.toFixed(1)} ml</span>
                </div>
              `).join('')}
        </div>
    </div>
    ` : ''}
    
    ${others.length > 0 ? `
    <div class="section">
        <div class="section-title">📦 Inne (szt)</div>
        <div class="ingredients-list">
            ${others.map(([ingredient, amount]) => {
              const unit = ingredientUnits[ingredient] || 'szt';
              return `
                <div class="ingredient-item">
                    <input type="checkbox" class="checkbox">
                    <span class="ingredient-name">${ingredient}</span>
                    <span class="ingredient-amount">${amount.toFixed(unit === 'szt' ? 0 : 1)} ${unit}</span>
                </div>
              `;
            }).join('')}
        </div>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>Lista wygenerowana z systemu zarządzania kompozycjami ziołowymi</p>
    </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const neededIngredients = calculateNeededIngredients();
  const { herbs, oils, others } = categorizeIngredients(neededIngredients);
  
  // Oblicz całkowity koszt using global prices
  const totalCost = Object.entries(neededIngredients).reduce((sum, [ingredient, amount]) => {
    const price = getIngredientPrice(ingredient);
    const unit = ingredientUnits[ingredient] || 'g';
    
    if (unit === 'ml' && ingredient.toLowerCase().includes('olejek')) {
      // Olejki: cena w zł/10ml, konwertuj na ml
      return sum + calculateOilPrice(amount, price);
    } else if (unit === 'szt') {
      return sum + (amount * price); // sztuki
    } else {
      return sum + (amount * price / 100); // surowce - cena za 100g
    }
  }, 0);

  // Oblicz potencjalny przychód
  const totalPotentialRevenueGross = compositions.reduce((sum, composition) => {
    const quantity = quantities[composition.id] || 0;
    return sum + (quantity * composition.sale_price);
  }, 0);

  const totalPotentialRevenueNet = calculateNetPrice(totalPotentialRevenueGross);
  const totalVAT = calculateVATAmount(totalPotentialRevenueGross);

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
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-center text-blue-700">
              Lista Zakupów - Planowanie Zestawów
            </CardTitle>
            <Button 
              onClick={clearShoppingList} 
              variant="outline" 
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Wyczyść
            </Button>
          </div>
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
                    <div className="text-xs mt-1 opacity-80">
                      {composition.sale_price.toFixed(2)} zł brutto ({calculateNetPrice(composition.sale_price).toFixed(2)} zł netto)
                    </div>
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
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-green-700">
                Podsumowanie Potrzebnych Składników
              </CardTitle>
              <Button onClick={generateShoppingListPDF} className="bg-green-600 hover:bg-green-700">
                <FileDown className="w-4 h-4 mr-2" />
                Generuj listę zakupów
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {herbs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Surowce Ziołowe (g)</h3>
                  <div className="space-y-2">
                    {herbs.map(([ingredient, amount]) => (
                      <div key={ingredient} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ingredient] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`herb-${ingredient}`}
                            checked={checkedIngredients[ingredient] || false}
                            onCheckedChange={() => toggleIngredientCheck(ingredient)}
                          />
                          <div className="flex-1 flex justify-between items-center">
                            <span className={`capitalize text-sm ${checkedIngredients[ingredient] ? 'line-through text-gray-500' : ''}`}>
                              {ingredient}
                            </span>
                            <Badge variant="outline">{amount.toFixed(1)} g</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-6">
                          <Input
                            type="number"
                            step="0.01"
                            value={getIngredientPrice(ingredient)}
                            onChange={(e) => updatePrice(ingredient, parseFloat(e.target.value) || 0)}
                            className="w-20 h-7 text-xs"
                            placeholder="0.00"
                          />
                          <span className="text-xs text-gray-600">zł/100g</span>
                          <span className="text-sm text-gray-600 ml-auto">
                            = {((amount * getIngredientPrice(ingredient)) / 100).toFixed(2)} zł
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {oils.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Olejki Eteryczne (ml)</h3>
                  <div className="space-y-2">
                    {oils.map(([ingredient, amount]) => (
                      <div key={ingredient} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ingredient] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`oil-${ingredient}`}
                            checked={checkedIngredients[ingredient] || false}
                            onCheckedChange={() => toggleIngredientCheck(ingredient)}
                          />
                          <div className="flex-1 flex justify-between items-center">
                            <span className={`capitalize text-sm ${checkedIngredients[ingredient] ? 'line-through text-gray-500' : ''}`}>
                              {ingredient.replace('olejek ', '')}
                            </span>
                            <Badge variant="outline">{amount.toFixed(1)} ml</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-6">
                          <Input
                            type="number"
                            step="0.01"
                            value={getIngredientPrice(ingredient)}
                            onChange={(e) => updatePrice(ingredient, parseFloat(e.target.value) || 0)}
                            className="w-20 h-7 text-xs"
                            placeholder="0.00"
                          />
                          <span className="text-xs text-gray-600">zł/10ml</span>
                          <span className="text-sm text-gray-600 ml-auto">
                            = {calculateOilPrice(amount, getIngredientPrice(ingredient)).toFixed(2)} zł
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Inne (szt)</h3>
                  <div className="space-y-2">
                    {others.map(([ingredient, amount]) => {
                      const unit = ingredientUnits[ingredient] || 'szt';
                      const displayAmount = unit === 'szt' ? amount.toFixed(0) : amount.toFixed(1);
                      
                      return (
                        <div key={ingredient} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ingredient] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`other-${ingredient}`}
                              checked={checkedIngredients[ingredient] || false}
                              onCheckedChange={() => toggleIngredientCheck(ingredient)}
                            />
                            <div className="flex-1 flex justify-between items-center">
                              <span className={`capitalize text-sm ${checkedIngredients[ingredient] ? 'line-through text-gray-500' : ''}`}>
                                {ingredient}
                              </span>
                              <Badge variant="outline">{displayAmount} {unit}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            <Input
                              type="number"
                              step="0.01"
                              value={getIngredientPrice(ingredient)}
                              onChange={(e) => updatePrice(ingredient, parseFloat(e.target.value) || 0)}
                              className="w-20 h-7 text-xs"
                              placeholder="0.00"
                            />
                            <span className="text-xs text-gray-600">zł/{unit}</span>
                            <span className="text-sm text-gray-600 ml-auto">
                              = {(amount * getIngredientPrice(ingredient)).toFixed(2)} zł
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-red-800">Całkowity koszt zakupów:</span>
                  <span className="text-2xl font-bold text-red-600">{totalCost.toFixed(2)} zł</span>
                </div>
              </div>
              
              {totalPotentialRevenueGross > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-800">Potencjalny przychód brutto:</span>
                      <span className="text-2xl font-bold text-green-600">{totalPotentialRevenueGross.toFixed(2)} zł</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-green-700">
                      <span>Przychód netto:</span>
                      <span>{totalPotentialRevenueNet.toFixed(2)} zł</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-green-700">
                      <span>VAT (23%):</span>
                      <span>{totalVAT.toFixed(2)} zł</span>
                    </div>
                  </div>
                </div>
              )}
              
              {totalPotentialRevenueGross > totalCost && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-800">Potencjalny zysk brutto:</span>
                    <span className="text-2xl font-bold text-blue-600">{(totalPotentialRevenueGross - totalCost).toFixed(2)} zł</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShoppingList;
