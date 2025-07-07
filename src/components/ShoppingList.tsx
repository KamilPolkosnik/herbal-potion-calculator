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

      // Load units
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
        let amt = ing.amount * qty;
        if (ing.unit === 'krople') amt = (ing.amount * qty) / 20;
        needed[ing.ingredient_name] = (needed[ing.ingredient_name] || 0) + amt;
      });
    }
  });

  // Categorize ingredients
  const herbs: [string, number][] = [];
  const oils: [string, number][] = [];
  const others: [string, number][] = [];
  Object.entries(needed).forEach(([name, amt]) => {
    const unit = ingredientUnits[name] || 'g';
    if (unit === 'ml' && name.toLowerCase().includes('olejek')) oils.push([name, amt]);
    else if (unit === 'g') herbs.push([name, amt]);
    else others.push([name, amt]);
  });

  // Totals for cost & revenue
  const totalCost = Object.entries(needed).reduce((sum, [name, amt]) => {
    const price = getPrice(name);
    const unit = ingredientUnits[name] || 'g';
    if (unit === 'ml' && name.toLowerCase().includes('olejek')) return sum + calculateOilPrice(amt, price);
    if (unit === 'szt') return sum + amt * price;
    return sum + (amt * price) / 100;
  }, 0);
  const potentialRevenue = compositions.reduce((sum, c) => sum + ((quantities[c.id] || 0) * c.sale_price), 0);
  const grossProfit = potentialRevenue - totalCost;

  const clearAll = () => {
    setQuantities({}); setCheckedIngredients({});
    sessionStorage.removeItem('shopping-list-quantities');
    sessionStorage.removeItem('shopping-list-checked');
  };

  // Restore PDF generation logic
  const generatePDF = () => {
    if (Object.keys(needed).length === 0) {
      alert('Nie ma składników do wygenerowania listy zakupów. Ustaw ilości zestawów.');
      return;
    }
    const { herbs, oils, others } = ((): { herbs: [string, number][]; oils: [string, number][]; others: [string, number][] } => {
      const h: [string, number][] = [];
      const o: [string, number][] = [];
      const ot: [string, number][] = [];
      Object.entries(needed).forEach(([name, amt]) => {
        const unit = ingredientUnits[name] || 'g';
        if (unit === 'ml' && name.toLowerCase().includes('olejek')) o.push([name.replace('olejek ', ''), amt]);
        else if (unit === 'g') h.push([name, amt]);
        else ot.push([name, amt]);
      });
      return { herbs: h, oils: o, others: ot };
    })();

    const date = new Date().toLocaleDateString('pl-PL');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lista Zakupów</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#333} .header{text-align:center;margin-bottom:20px} .section{margin:20px 0} .section-title{font-size:18px;font-weight:bold;border-left:4px solid #4CAF50;padding:5px 10px;background:#E8F5E8} .ingredient{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #ddd}</style></head><body><div class="header"><h1>Lista Zakupów</h1><div>${date}</div></div>${herbs.length?`<div class="section"><div class="section-title">Surowce Ziołowe (g)</div>${herbs.map(([n,a])=>`<div class="ingredient"><span>${n}</span><span>${a.toFixed(1)} g</span></div>`).join('')}</div>`:''}${oils.length?`<div class="section"><div class="section-title">Olejki Eteryczne (ml)</div>${oils.map(([n,a])=>`<div class="ingredient"><span>${n}</span><span>${a.toFixed(1)} ml</span></div>`).join('')}</div>`:''}${others.length?`<div class="section"><div class="section-title">Inne (szt)</div>${others.map(([n,a])=>`<div class="ingredient"><span>${n}</span><span>${a.toFixed(unit==='szt'?0:1)} ${ingredientUnits[n]||'szt'}</span></div>`).join('')}</div>`:''}</body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  if (loading) return <div className="flex justify-center items-center p-8"><div className="text-lg">Ładowanie zestawów...</div></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader summaryAction="clear">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Lista Zakupów</CardTitle>
            <Button variant="outline" onClick={clearAll}><Trash2/> Wyczyść</Button>
          </div>
        </CardHeader>
        <CardContent>
          {compositions.map(c => (
            <div key={c.id} className="p-4 border mb-2 rounded-lg">
              <div className={`${c.color} p-2 text-white rounded-md`}>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <p>{c.sale_price.toFixed(2)} zł brutto</p>
              </div>
              <Label>Ilość zestawów</Label>
              <Input type="number" value={quantities[c.id]||''} onChange={e=>updateQty(c.id,parseInt(e.target.value)||0)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {Object.keys(needed).length>0 && (
        <Card>
          <CardHeader summaryAction="generate">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Podsumowanie</CardTitle>
              <Button onClick={generatePDF}><FileDown/> Generuj listę zakupów</Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* List ingredient sections here */}
            <div className="mt-4">
              <Badge>Surowce: {herbs.length}</Badge>
              <Badge>Olejki: {oils.length}</Badge>
              <Badge>Inne: {others.length}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShoppingList;
