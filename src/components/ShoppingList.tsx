
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Composition {
  id: string;
  name: string;
  description: string | null;
  sale_price: number | null;
  color: string | null;
}

interface ShoppingPlan {
  composition: Composition;
  quantity: number;
  totalCost: number;
}

const ShoppingList: React.FC = () => {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [shoppingPlan, setShoppingPlan] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadCompositions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('compositions')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading compositions:', error);
        return;
      }

      setCompositions(data || []);
    } catch (error) {
      console.error('Error loading compositions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompositions();
  }, []);

  const handleQuantityChange = (compositionId: string, quantity: number) => {
    setShoppingPlan(prev => ({
      ...prev,
      [compositionId]: Math.max(0, quantity)
    }));
  };

  const calculateTotalCost = () => {
    return compositions.reduce((total, composition) => {
      const quantity = shoppingPlan[composition.id] || 0;
      const price = composition.sale_price || 0;
      return total + (quantity * price);
    }, 0);
  };

  const calculateNettoPrice = (bruttoPrice: number) => {
    return bruttoPrice / 1.23;
  };

  const calculateVAT = (bruttoPrice: number) => {
    return bruttoPrice - calculateNettoPrice(bruttoPrice);
  };

  const totalBrutto = calculateTotalCost();
  const totalNetto = calculateNettoPrice(totalBrutto);
  const totalVAT = calculateVAT(totalBrutto);

  const generateShoppingListPDF = () => {
    // Tu będzie implementacja generowania PDF
    console.log('Generowanie PDF listy zakupów...');
  };

  const clearShoppingList = () => {
    setShoppingPlan({});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Lista Zakupów - Planowanie Zestawów</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={clearShoppingList}
              disabled={Object.values(shoppingPlan).every(q => q === 0)}
            >
              Wyczyść
            </Button>
            <Button variant="outline" onClick={loadCompositions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Odśwież
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p>Ładowanie zestawów...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compositions.map(composition => {
                const quantity = shoppingPlan[composition.id] || 0;
                const price = composition.sale_price || 0;
                const totalPrice = quantity * price;
                const nettoPrice = calculateNettoPrice(price);

                return (
                  <Card 
                    key={composition.id} 
                    className={`${composition.color || 'bg-blue-500'} text-white`}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-1">{composition.name}</h3>
                      <p className="text-sm opacity-90 mb-2">
                        {composition.description || 'Brak opisu'}
                      </p>
                      <p className="text-sm mb-3">
                        {price.toFixed(2)} zł brutto ({nettoPrice.toFixed(2)} zł netto)
                      </p>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Ilość zestawów
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(composition.id, parseInt(e.target.value) || 0)}
                          className="bg-white text-black"
                          placeholder="0"
                        />
                        {quantity > 0 && (
                          <p className="text-sm font-medium">
                            Koszt: {totalPrice.toFixed(2)} zł
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {compositions.length === 0 && (
              <p>Brak dostępnych zestawów do planowania.</p>
            )}

            {/* Podsumowanie kosztów */}
            <div className="mt-8 space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-red-800">
                  Całkowity koszt zakupów: {totalBrutto.toFixed(2)} zł
                </h4>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-green-800 mb-2">
                  Potencjalny przychód brutto: {totalBrutto.toFixed(2)} zł
                </h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Przychód netto: {totalNetto.toFixed(2)} zł</p>
                  <p>VAT (23%): {totalVAT.toFixed(2)} zł</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-800">
                  Potencjalny zysk netto: {totalNetto.toFixed(2)} zł
                </h4>
              </div>

              {totalBrutto > 0 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={generateShoppingListPDF}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Generuj listę zakupów
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ShoppingList;
