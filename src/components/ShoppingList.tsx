import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileDown, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateOilPrice } from '@/utils/unitConverter';
import { useIngredientCategoriesFromDB } from '@/hooks/useIngredientCategoriesFromDB';

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
  const [showByComposition, setShowByComposition] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHerbs, setShowHerbs] = useState(true);
  const [showOils, setShowOils] = useState(true);
  const [showOthers, setShowOthers] = useState(true);

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
        .select('ingredient_name, unit, category')
        .in('ingredient_name', uniqueIngredients);

      const unitsMap: Record<string, string> = {};
      
      // Dla każdego składnika, najpierw sprawdź kategorię z composition_ingredients
      uniqueIngredients.forEach(ingredientName => {
        // Znajdź kategorię składnika z composition_ingredients
        const categoryData = ingredientUnitsFromComposition?.find(item => item.ingredient_name === ingredientName);
        
        if (categoryData) {
          // Użyj kategorii do określenia jednostki - ma pierwszeństwo
          switch (categoryData.category) {
            case 'olejek':
              unitsMap[ingredientName] = 'ml';
              break;
            case 'inne':
              unitsMap[ingredientName] = 'szt';
              break;
            default: // 'zioło'
              unitsMap[ingredientName] = 'g';
              break;
          }
          console.log(`ShoppingList - Jednostka na podstawie kategorii dla ${ingredientName}: ${unitsMap[ingredientName]} (kategoria: ${categoryData.category})`);
        } else {
          // Jeśli nie ma kategorii, sprawdź jednostkę z tabeli ingredients
          const ingredientData = ingredientUnitsFromIngredients?.find(item => item.name === ingredientName);
          if (ingredientData) {
            unitsMap[ingredientName] = ingredientData.unit;
            console.log(`ShoppingList - Jednostka z tabeli ingredients dla ${ingredientName}: ${unitsMap[ingredientName]}`);
          } else {
            // Fallback do starej logiki jeśli składnik nie istnieje w żadnej tabeli
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
            console.log(`ShoppingList - Jednostka domyślna dla ${ingredientName}: ${unitsMap[ingredientName]}`);
          }
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

  // Obliczanie potrzebnych składników z podziałem na zestawy
  const calculateNeededIngredientsByComposition = () => {
    const neededByComposition: Record<string, { composition: Composition; ingredients: Record<string, number> }> = {};
    
    compositions.forEach((composition) => {
      const quantity = quantities[composition.id] || 0;
      if (quantity > 0) {
        const ingredientsList = compositionIngredients[composition.id] || [];
        const ingredientsNeeded: Record<string, number> = {};
        
        ingredientsList.forEach((ingredient) => {
          const actualUnit = ingredientUnits[ingredient.ingredient_name] || ingredient.unit;
          
          if (ingredient.unit === 'krople') {
            // Przelicz krople na ml (20 kropel = 1ml)
            const mlNeeded = (ingredient.amount * quantity) / 20;
            ingredientsNeeded[ingredient.ingredient_name] = mlNeeded;
          } else if (actualUnit === 'szt') {
            // Dla sztuk
            ingredientsNeeded[ingredient.ingredient_name] = ingredient.amount * quantity;
          } else {
            // Dla gramów i ml
            ingredientsNeeded[ingredient.ingredient_name] = ingredient.amount * quantity;
          }
        });
        
        if (Object.keys(ingredientsNeeded).length > 0) {
          neededByComposition[composition.id] = {
            composition,
            ingredients: ingredientsNeeded
          };
        }
      }
    });
    
    return neededByComposition;
  };

  const calculateNetPrice = (grossPrice: number) => {
    return grossPrice / (1 + VAT_RATE);
  };

  const calculateVATAmount = (grossPrice: number) => {
    return grossPrice - calculateNetPrice(grossPrice);
  };

  // Filtrowanie zestawów po nazwie
  const filteredCompositions = compositions.filter(composition =>
    composition.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Oblicz potrzebne składniki
  const neededIngredients = calculateNeededIngredients();
  const neededIngredientsArray = Object.keys(neededIngredients);
  const neededByComposition = calculateNeededIngredientsByComposition();
  
  // Użyj hooka do kategoryzacji składników na podstawie bazy danych
  const { herbs, oils, others } = useIngredientCategoriesFromDB(neededIngredientsArray);

  // Filtruj składniki według włączonych kategorii
  const filteredHerbs = showHerbs ? herbs : [];
  const filteredOils = showOils ? oils : [];
  const filteredOthers = showOthers ? others : [];

  const generateShoppingListPDF = () => {
    if (Object.keys(neededIngredients).length === 0) {
      alert('Nie ma składników do wygenerowania listy zakupów. Ustaw ilości zestawów.');
      return;
    }

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
            margin: 15px; 
            color: #333; 
            line-height: 1.4;
            font-size: 12px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .header h1 { 
            color: #2E7D32; 
            margin: 0; 
            font-size: 20px;
        }
        .date { 
            color: #666; 
            margin-top: 8px; 
            font-size: 11px;
        }
        .section { 
            margin: 20px 0; 
        }
        .section-title { 
            background-color: #E8F5E8; 
            padding: 8px 12px; 
            border-left: 4px solid #4CAF50;
            font-size: 14px; 
            font-weight: bold; 
            color: #2E7D32;
            margin-bottom: 10px;
        }
        .ingredients-list { 
            display: grid; 
            gap: 6px; 
        }
        .ingredient-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 8px 12px;
            border: 1px solid #ddd; 
            border-radius: 4px;
            background-color: #fafafa;
            font-size: 11px;
        }
        .ingredient-name { 
            font-weight: 500; 
            text-transform: capitalize;
            flex: 1;
        }
        .ingredient-amount { 
            font-weight: bold; 
            color: #2E7D32;
            min-width: 60px;
            text-align: right;
        }
        .checkbox { 
            width: 14px; 
            height: 14px; 
            margin-right: 10px;
            border: 2px solid #4CAF50;
        }
        .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 10px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .summary {
            background-color: #f0f8f0;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
            text-align: center;
            font-size: 12px;
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
    
    ${filteredHerbs.length > 0 ? `
    <div class="section">
        <div class="section-title">🌿 Surowce Ziołowe (g)</div>
        <div class="ingredients-list">
            ${filteredHerbs.map((ingredient) => `
                <div class="ingredient-item">
                    <input type="checkbox" class="checkbox">
                    <span class="ingredient-name">${ingredient}</span>
                    <span class="ingredient-amount">${neededIngredients[ingredient].toFixed(1)} g</span>
                </div>
              `).join('')}
        </div>
    </div>
    ` : ''}
    
    ${filteredOils.length > 0 ? `
    <div class="section">
        <div class="section-title">🌸 Olejki Eteryczne (ml)</div>
        <div class="ingredients-list">
            ${filteredOils.map((ingredient) => `
                <div class="ingredient-item">
                    <input type="checkbox" class="checkbox">
                    <span class="ingredient-name">${ingredient.replace('olejek ', '')}</span>
                    <span class="ingredient-amount">${neededIngredients[ingredient].toFixed(1)} ml</span>
                </div>
              `).join('')}
        </div>
    </div>
    ` : ''}
    
    ${filteredOthers.length > 0 ? `
    <div class="section">
        <div class="section-title">📦 Inne (szt)</div>
        <div class="ingredients-list">
            ${filteredOthers.map((ingredient) => {
              const unit = ingredientUnits[ingredient] || 'szt';
              const amount = neededIngredients[ingredient]; 
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
      {/* Pole wyszukiwania */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-green-700">Wyszukiwanie Zestawów</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Wyszukaj zestaw po nazwie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

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
          {filteredCompositions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'Nie znaleziono zestawów pasujących do wyszukiwania.' : 'Brak zestawów. Dodaj nowe zestawy w zakładce "Zarządzanie".'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredCompositions.map((composition) => (
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
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-by-composition"
                    checked={showByComposition}
                    onCheckedChange={(checked) => setShowByComposition(checked === true)}
                  />
                  <Label htmlFor="show-by-composition" className="text-sm">
                    Podział na zestawy
                  </Label>
                </div>
                <Button onClick={generateShoppingListPDF} className="bg-green-600 hover:bg-green-700">
                  <FileDown className="w-4 h-4 mr-2" />
                  Generuj listę zakupów
                </Button>
              </div>
            </div>
            
            {/* Filtry kategorii składników */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-herbs"
                  checked={showHerbs}
                  onCheckedChange={(checked) => setShowHerbs(checked === true)}
                />
                <Label htmlFor="show-herbs" className="text-sm">
                  🌿 Zioła
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-oils"
                  checked={showOils}
                  onCheckedChange={(checked) => setShowOils(checked === true)}
                />
                <Label htmlFor="show-oils" className="text-sm">
                  🌸 Olejki
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-others"
                  checked={showOthers}
                  onCheckedChange={(checked) => setShowOthers(checked === true)}
                />
                <Label htmlFor="show-others" className="text-sm">
                  📦 Inne
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showByComposition ? (
              // Widok z podziałem na zestawy z kategoriami
              <div className="space-y-6">
                {Object.entries(neededByComposition).map(([compositionId, { composition, ingredients }]) => (
                  <div key={compositionId} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`${composition.color} w-4 h-4 rounded`}></div>
                      <h3 className="font-semibold text-lg">{composition.name}</h3>
                      <Badge variant="outline">{quantities[compositionId]} szt.</Badge>
                    </div>
                    
                    {/* Kategoryzowane składniki dla danego zestawu */}
                    <div className="space-y-4">
                      {/* Zioła */}
                      {showHerbs && Object.entries(ingredients).some(([ingredientName]) => herbs.includes(ingredientName)) && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            🌿 <span>Surowce Ziołowe (g)</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(ingredients)
                              .filter(([ingredientName]) => herbs.includes(ingredientName))
                              .map(([ingredientName, amount]) => {
                                const unit = ingredientUnits[ingredientName] || 'g';
                                const displayAmount = unit === 'szt' ? amount.toFixed(0) : amount.toFixed(1);
                                
                                return (
                                  <div key={ingredientName} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ingredientName] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        id={`comp-${compositionId}-${ingredientName}`}
                                        checked={checkedIngredients[ingredientName] || false}
                                        onCheckedChange={() => toggleIngredientCheck(ingredientName)}
                                      />
                                      <div className="flex-1 flex justify-between items-center">
                                        <span className={`capitalize text-sm ${checkedIngredients[ingredientName] ? 'line-through text-gray-500' : ''}`}>
                                          {ingredientName}
                                        </span>
                                        <Badge variant="outline">{displayAmount} {unit}</Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-6">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={getIngredientPrice(ingredientName)}
                                        onChange={(e) => updatePrice(ingredientName, parseFloat(e.target.value) || 0)}
                                        className="w-20 h-7 text-xs"
                                        placeholder="0.00"
                                      />
                                      <span className="text-xs text-gray-600">zł/100g</span>
                                      <span className="text-sm text-gray-600 ml-auto">
                                        = {((amount * getIngredientPrice(ingredientName)) / 100).toFixed(2)} zł
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                      
                      {/* Olejki */}
                      {showOils && Object.entries(ingredients).some(([ingredientName]) => oils.includes(ingredientName)) && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            🌸 <span>Olejki Eteryczne (ml)</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(ingredients)
                              .filter(([ingredientName]) => oils.includes(ingredientName))
                              .map(([ingredientName, amount]) => {
                                const unit = ingredientUnits[ingredientName] || 'ml';
                                const displayAmount = unit === 'szt' ? amount.toFixed(0) : amount.toFixed(1);
                                
                                return (
                                  <div key={ingredientName} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ingredientName] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        id={`comp-${compositionId}-${ingredientName}`}
                                        checked={checkedIngredients[ingredientName] || false}
                                        onCheckedChange={() => toggleIngredientCheck(ingredientName)}
                                      />
                                      <div className="flex-1 flex justify-between items-center">
                                        <span className={`capitalize text-sm ${checkedIngredients[ingredientName] ? 'line-through text-gray-500' : ''}`}>
                                          {ingredientName.replace('olejek ', '')}
                                        </span>
                                        <Badge variant="outline">{displayAmount} {unit}</Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-6">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={getIngredientPrice(ingredientName)}
                                        onChange={(e) => updatePrice(ingredientName, parseFloat(e.target.value) || 0)}
                                        className="w-20 h-7 text-xs"
                                        placeholder="0.00"
                                      />
                                      <span className="text-xs text-gray-600">zł/10ml</span>
                                      <span className="text-sm text-gray-600 ml-auto">
                                        = {calculateOilPrice(amount, getIngredientPrice(ingredientName)).toFixed(2)} zł
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Inne */}
                      {showOthers && Object.entries(ingredients).some(([ingredientName]) => others.includes(ingredientName)) && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            📦 <span>Inne</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(ingredients)
                              .filter(([ingredientName]) => others.includes(ingredientName))
                              .map(([ingredientName, amount]) => {
                                const unit = ingredientUnits[ingredientName] || 'szt';
                                const displayAmount = unit === 'szt' ? amount.toFixed(0) : amount.toFixed(1);
                                
                                return (
                                  <div key={ingredientName} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ingredientName] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        id={`comp-${compositionId}-${ingredientName}`}
                                        checked={checkedIngredients[ingredientName] || false}
                                        onCheckedChange={() => toggleIngredientCheck(ingredientName)}
                                      />
                                      <div className="flex-1 flex justify-between items-center">
                                        <span className={`capitalize text-sm ${checkedIngredients[ingredientName] ? 'line-through text-gray-500' : ''}`}>
                                          {ingredientName}
                                        </span>
                                        <Badge variant="outline">{displayAmount} {unit}</Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-6">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={getIngredientPrice(ingredientName)}
                                        onChange={(e) => updatePrice(ingredientName, parseFloat(e.target.value) || 0)}
                                        className="w-20 h-7 text-xs"
                                        placeholder="0.00"
                                      />
                                      <span className="text-xs text-gray-600">zł/{unit}</span>
                                      <span className="text-sm text-gray-600 ml-auto">
                                        = {(amount * getIngredientPrice(ingredientName)).toFixed(2)} zł
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Widok zsumowany (istniejący kod)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHerbs.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Surowce Ziołowe (g)</h3>
                    <div className="space-y-2">
                      {filteredHerbs.map((ingredient) => {
                        const amount = neededIngredients[ingredient];
                        return (
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
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {filteredOils.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Olejki Eteryczne (ml)</h3>
                    <div className="space-y-2">
                      {filteredOils.map((ingredient) => {
                        const amount = neededIngredients[ingredient];
                        return (
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
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredOthers.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Inne</h3>
                    <div className="space-y-2">
                      {filteredOthers.map((ingredient) => {
                        const unit = ingredientUnits[ingredient] || 'szt';
                        const amount = neededIngredients[ingredient];
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
            )}
            
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
