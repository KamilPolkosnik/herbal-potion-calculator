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
  prices: Record<string, number>; // ceny brutto
  onPriceUpdate?: (ingredient: string, price: number) => void;
}

interface Composition {
  id: string;
  name: string;
  description: string;
  color: string;
  sale_price: number; // brutto
}

interface CompositionIngredient {
  ingredient_name: string;
  amount: number;
  unit: string;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ prices, onPriceUpdate }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [compositionIngredients, setCompositionIngredients] = useState<Record<string, CompositionIngredient[]>>({});
  const [ingredientUnits, setIngredientUnits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedQty = sessionStorage.getItem('shopping-list-quantities');
    const savedChecked = sessionStorage.getItem('shopping-list-checked');
    if (savedQty) setQuantities(JSON.parse(savedQty));
    if (savedChecked) setCheckedIngredients(JSON.parse(savedChecked));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('shopping-list-quantities', JSON.stringify(quantities));
  }, [quantities]);

  useEffect(() => {
    sessionStorage.setItem('shopping-list-checked', JSON.stringify(checkedIngredients));
  }, [checkedIngredients]);

  const loadCompositions = async () => {
    try {
      const { data: comps, error: compErr } = await supabase.from('compositions').select('*').order('name');
      if (compErr) throw compErr;
      const { data: compIngs, error: ingErr } = await supabase.from('composition_ingredients').select('*');
      if (ingErr) throw ingErr;

      // Load units logic (same as before)
      const unique = [...new Set(compIngs.map(i => i.ingredient_name))];
      const { data: unitsFromIng } = await supabase.from('ingredients').select('name, unit').in('name', unique);
      const { data: unitsFromComp } = await supabase.from('composition_ingredients').select('ingredient_name, unit').in('ingredient_name', unique);
      const unitsMap: Record<string, string> = {};
      unitsFromIng?.forEach(u => { unitsMap[u.name] = u.unit; });
      unitsFromComp?.forEach(u => { if (!unitsMap[u.ingredient_name]) unitsMap[u.ingredient_name] = u.unit; });
      unique.forEach(name => {
        if (!unitsMap[name]) {
          if (name.toLowerCase().includes('olejek')) unitsMap[name] = 'ml';
          else if (/worek|woreczek|pojemnik|etykieta|szt/.test(name.toLowerCase())) unitsMap[name] = 'szt';
          else unitsMap[name] = 'g';
        }
      });
      setIngredientUnits(unitsMap);

      const byComp: Record<string, CompositionIngredient[]> = {};
      compIngs.forEach(i => {
        if (!byComp[i.composition_id]) byComp[i.composition_id] = [];
        byComp[i.composition_id].push({ ingredient_name: i.ingredient_name, amount: i.amount, unit: i.unit });
      });

      setCompositions(comps);
      setCompositionIngredients(byComp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadCompositions(); }, []);

  const updateQty = (id: string, qty: number) => setQuantities({ ...quantities, [id]: qty });
  const toggleCheck = (name: string) => setCheckedIngredients(prev => ({ ...prev, [name]: !prev[name] }));
  const updatePrice = async (name: string, price: number) => { if (onPriceUpdate) await onPriceUpdate(name, price); };
  const getPrice = (name: string) => prices[name] ?? 0;

  // Calculate needed ingredients
  const needed: Record<string, number> = {};
  compositions.forEach(c => {
    const qty = quantities[c.id] || 0;
    if (qty > 0) {
      (compositionIngredients[c.id] || []).forEach(ing => {
        const unit = ingredientUnits[ing.ingredient_name] || ing.unit;
        let amt = ing.amount * qty;
        if (ing.unit === 'krople') amt = (ing.amount * qty) / 20;
        needed[ing.ingredient_name] = (needed[ing.ingredient_name] || 0) + amt;
      });
    }
  });

  // Categorize into herbs, oils, others
  const herbs: [string, number][] = [];
  const oils: [string, number][] = [];
  const others: [string, number][] = [];
  Object.entries(needed).forEach(([name, amt]) => {
    const unit = ingredientUnits[name] || 'g';
    if (unit === 'ml' && name.toLowerCase().includes('olejek')) oils.push([name, amt]);
    else if (unit === 'g') herbs.push([name, amt]);
    else others.push([name, amt]);
  });

  // Total cost (gross)
  const totalCost = Object.entries(needed).reduce((sum, [name, amt]) => {
    const price = getPrice(name);
    const unit = ingredientUnits[name] || 'g';
    if (unit === 'ml' && name.toLowerCase().includes('olejek')) return sum + calculateOilPrice(amt, price);
    if (unit === 'szt') return sum + amt * price;
    return sum + (amt * price) / 100;
  }, 0);

  // Potential revenue and profit (gross)
  const potentialRevenue = compositions.reduce((sum, c) => sum + ((quantities[c.id] || 0) * c.sale_price), 0);
  const grossProfit = potentialRevenue - totalCost;

  const clearAll = () => {
    setQuantities({}); setCheckedIngredients({});
    sessionStorage.removeItem('shopping-list-quantities');
    sessionStorage.removeItem('shopping-list-checked');
  };

  const generatePDF = () => {
    // existing PDF logic
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="text-lg">Ładowanie zestawów...</div></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-center text-blue-700">Lista Zakupów - Planowanie Zestawów</CardTitle>
            <Button onClick={clearAll} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2"/>Wyczyść
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {compositions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Brak zestawów. Dodaj w zakładce "Zarządzanie".</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {compositions.map(c => (
                <div key={c.id} className="p-4 border rounded-lg bg-white">
                  <div className={`${c.color} text-white p-3 rounded-lg mb-3`}>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm opacity-90">{c.description}</p>
                    <div className="text-xs mt-1 opacity-80">{c.sale_price.toFixed(2)} zł brutto</div>
                  </div>
                  <Label className="text-sm">Ilość zestawów</Label>
                  <Input type="number" min={0} value={quantities[c.id]||''}
                    onChange={e=>updateQty(c.id,parseInt(e.target.value)||0)}
                    className="mt-1" placeholder="0"/>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(needed).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-green-700">Podsumowanie Potrzebnych Składników</CardTitle>
              <Button onClick={generatePDF} className="bg-green-600 hover:bg-green-700">
                <FileDown className="w-4 h-4 mr-2"/>Generuj listę zakupów
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {herbs.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Surowce Ziołowe (g)</h3>
              <div className="space-y-2">
                {herbs.map(([ing, amt]) => (
                  <div key={ing} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ing] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`herb-${ing}`}
                        checked={checkedIngredients[ing]||false}
                        onCheckedChange={()=>toggleCheck(ing)}
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className={`capitalize text-sm ${checkedIngredients[ing] ? 'line-through text-gray-500' : ''}`}>{ing}</span>
                        <Badge variant="outline">{amt.toFixed(1)} g</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <Input type="number" step="0.01" value={getPrice(ing)} onChange={e=>updatePrice(ing,parseFloat(e.target.value)||0)} className="w-20 h-7 text-xs" placeholder="0.00"/>
                      <span className="text-xs text-gray-600">zł/100g</span>
                      <span className="text-sm text-gray-600 ml-auto">={( (amt * getPrice(ing)/100) ).toFixed(2)} zł</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>)}

            {oils.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Olejki Eteryczne (ml)</h3>
              <div className="space-y-2">
                {oils.map(([ing, amt]) => (
                  <div key={ing} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ing] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <Checkbox id={`oil-${ing}`} checked={checkedIngredients[ing]||false} onCheckedChange={()=>toggleCheck(ing)}/>
                      <div className="flex-1 flex justify-between items-center">
                        <span className={`capitalize text-sm ${checkedIngredients[ing] ? 'line-through text-gray-500' : ''}`}>{ing.replace('olejek ', '')}</span>
                        <Badge variant="outline">{amt.toFixed(1)} ml</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <Input type="number" step="0.01" value={getPrice(ing)} onChange={e=>updatePrice(ing,parseFloat(e.target.value)||0)} className="w-20 h-7 text-xs" placeholder="0.00"/>
                      <span className="text-xs text-gray-600">zł/10ml</span>
                      <span className="text-sm text-gray-600 ml-auto">={( calculateOilPrice(amt, getPrice(ing)) ).toFixed(2)} zł</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>)}

            {others.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Inne (szt)</h3>
              <div className="space-y-2">
                {others.map(([ing, amt]) => {
                  const unit = ingredientUnits[ing]||'szt';
                  const display = unit==='szt'?amt.toFixed(0):amt.toFixed(1);
                  return (
                    <div key={ing} className={`flex flex-col gap-2 p-3 rounded-lg border ${checkedIngredients[ing] ? 'bg-green-50 border-green-200':''} bg-gray-50 border-gray-200`}>
                      <div className="flex items-center gap-3">
                        <Checkbox id={`other-${ing}`} checked={checkedIngredients[ing]||false} onCheckedChange={()=>toggleCheck(ing)}/>
                        <div className="flex-1 flex justify-between items-center">
                          <span className={`capitalize text-sm ${checkedIngredients[ing] ? 'line-through text-gray-500':''}`}>{ing}</span>
                          <Badge variant="outline">{display} {unit}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <Input type="number" step="0.01" value={getPrice(ing)} onChange={e=>updatePrice(ing,parseFloat(e.target.value)||0)} className="w-20 h-7 text-xs" placeholder="0.00"/>
                        <span className="text-xs text-gray-600">zł/{unit}</span>
                        <span className="text-sm text-gray-600 ml-auto">={( (amt * getPrice(ing)) ).toFixed(2)} zł</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>)}

            <div className="mt-6 space-y-3">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-red-800">Całkowity koszt zakupów:</span>
                  <span className="text-2xl font-bold text-red-600">{totalCost.toFixed(2)} zł</span>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-800">Potencjalny przychód brutto:</span>
                  <span className="text-2xl font-bold text-green-600">{potentialRevenue.toFixed(2)} zł</span>
                </div>
              </div>

              {grossProfit >= 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-800">Potencjalny zysk brutto:</span>
                    <span className="text-2xl font-bold text-blue-600">{grossProfit.toFixed(2)} zł</span>
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
