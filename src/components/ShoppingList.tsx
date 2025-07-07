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

  useEffect(() => {
    const savedQuantities = sessionStorage.getItem('shopping-list-quantities');
    const savedChecked = sessionStorage.getItem('shopping-list-checked');
    if (savedQuantities) {
      try { setQuantities(JSON.parse(savedQuantities)); } catch {};
    }
    if (savedChecked) {
      try { setCheckedIngredients(JSON.parse(savedChecked)); } catch {};
    }
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

      const unique = [...new Set(compIngs.map(i => i.ingredient_name))];
      const { data: unitsFromIng } = await supabase.from('ingredients').select('name, unit').in('name', unique);
      const { data: unitsFromComp } = await supabase.from('composition_ingredients').select('ingredient_name, unit').in('ingredient_name', unique);
      const unitsMap: Record<string, string> = {};
      unitsFromIng?.forEach(u => unitsMap[u.name] = u.unit);
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

      setCompositions(comps || []);
      setCompositionIngredients(byComp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCompositions(); }, []);

  const updateQuantity = (id: string, qty: number) => setQuantities({ ...quantities, [id]: qty });
  const toggleIngredientCheck = (name: string) => setCheckedIngredients(prev => ({ ...prev, [name]: !prev[name] }));
  const updatePrice = async (name: string, price: number) => { if (onPriceUpdate) await onPriceUpdate(name, price); };
  const getIngredientPrice = (name: string) => prices[name] ?? 0;

  const calculateNeededIngredients = () => {
    const needed: Record<string, number> = {};
    compositions.forEach(c => {
      const qty = quantities[c.id] || 0;
      if (qty > 0) {
        (compositionIngredients[c.id] || []).forEach(ing => {
          let amt = ing.amount * qty;
          if (ing.unit === 'krople') amt = (ing.amount * qty) / 20;
          needed[ing.ingredient_name] = (needed[ing.ingredient_name] || 0) + amt;
        });
      }
    });
    return needed;
  };

  const calculateNetPrice = (gross: number) => gross / (1 + VAT_RATE);
  const calculateVATAmount = (gross: number) => gross - calculateNetPrice(gross);

  const categorizeIngredients = (needed: Record<string, number>) => {
    const herbs: [string, number][] = [], oils: [string, number][] = [], others: [string, number][] = [];
    Object.entries(needed).forEach(([n,a]) => {
      const unit = ingredientUnits[n] || 'g';
      if (unit === 'ml' && n.toLowerCase().includes('olejek')) oils.push([n,a]);
      else if (unit === 'g') herbs.push([n,a]);
      else others.push([n,a]);
    });
    return { herbs, oils, others };
  };

  const generateShoppingListPDF = () => {
    /* existing logic */
  };

  const neededIngredients = calculateNeededIngredients();
  const { herbs, oils, others } = categorizeIngredients(neededIngredients);

  const totalCost = Object.entries(neededIngredients).reduce((sum, [n,a]) => {
    const price = getIngredientPrice(n);
    const unit = ingredientUnits[n] || 'g';
    if (unit === 'ml' && n.toLowerCase().includes('olejek')) return sum + calculateOilPrice(a,price);
    if (unit === 'szt') return sum + a*price;
    return sum + (a*price)/100;
  }, 0);

  const totalPotentialRevenueGross = compositions.reduce((sum,c) => sum + (quantities[c.id]||0)*c.sale_price, 0);
  const totalPotentialRevenueNet = calculateNetPrice(totalPotentialRevenueGross);
  const totalVAT = calculateVATAmount(totalPotentialRevenueGross);

  if (loading) return <div className="flex justify-center items-center p-8"><div className="text-lg">Ładowanie zestawów...</div></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-center text-blue-700">Lista Zakupów - Planowanie Zestawów</CardTitle>
            <Button onClick={() => { setQuantities({}); setCheckedIngredients({}); sessionStorage.removeItem('shopping-list-quantities'); sessionStorage.removeItem('shopping-list-checked'); }} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-2"/>Wyczyść</Button>
          </div>
        </CardHeader>
        <CardContent>
          {compositions.length===0 ? <div className="text-center py-8"><p className="text-gray-500">Brak zestawów. Dodaj nowe zestawy w zakładce \"Zarządzanie\".</p></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {compositions.map(c => (
                <div key={c.id} className="p-4 border rounded-lg bg-white">
                  <div className={`${c.color} text-white p-3 rounded-lg mb-3`}><h3 className="font-semibold">{c.name}</h3><p className="text-sm opacity-90">{c.description}</p><div className="text-xs mt-1 opacity-80">{c.sale_price.toFixed(2)} zł brutto ({calculateNetPrice(c.sale_price).toFixed(2)} zł netto)</div></div>
                  <Label className="text-sm">Ilość zestawów</Label>
                  <Input type="number" min="0" value={quantities[c.id]||''} onChange={e=>updateQuantity(c.id,parseInt(e.target.value)||0)} placeholder="0" className="mt-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(neededIngredients).length>0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center"><CardTitle className="text-xl text-green-700">Podsumowanie Potrzebnych Składników</CardTitle><Button onClick={generateShoppingListPDF} className="bg-green-600 hover:bg-green-700"><FileDown className="w-4 h-4 mr-2"/>Generuj listę zakupów</Button></div>
          </CardHeader>
          <CardContent>
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-red-50 rounded-lg"><div className="flex justify-between items-center"><span className="text-lg font-semibold text-red-800">Całkowity koszt zakupów:</span><span className="text-2xl font-bold text-red-600">{totalCost.toFixed(2)} zł</span></div></div>
              {totalPotentialRevenueGross>0 && <div className="p-4 bg-green-50 rounded-lg"><div className="space-y-2"><div className="flex justify-between items-center"><span className="text-lg font-semibold text-green-800">Potencjalny przychód brutto:</span><span className="text-2xl font-bold text-green-600">{totalPotentialRevenueGross.toFixed(2)} zł</span></div><div className="flex justify-between items-center text-sm text-green-700"><span>Przychód netto:</span><span>{totalPotentialRevenueNet.toFixed(2)} zł</span></div><div className="flex justify-between items-center text-sm text-green-700"><span>VAT (23%):</span><span>{totalVAT.toFixed(2)} zł</span></div></div></div>}
              {totalPotentialRevenueNet>totalCost && <div className="p-4 bg-blue-50 rounded-lg"><div className="flex justify-between items-center"><span className="text-lg font-semibold text-blue-800">Potencjalny zysk brutto:</span><span className="text-2xl font-bold text-blue-600">{(totalPotentialRevenueNet - totalCost).toFixed(2)} zł</span></div></div>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShoppingList;
