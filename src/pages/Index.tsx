
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IngredientManager from '@/components/IngredientManager';
import ProductCalculator from '@/components/ProductCalculator';
import ShoppingList from '@/components/ShoppingList';
import { useIngredients } from '@/hooks/useIngredients';
import { Package, Calculator, TrendingUp, ShoppingCart } from 'lucide-react';

const Index = () => {
  const { ingredients, prices, loading } = useIngredients();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Načítavam aplikáciu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Package className="text-green-600" />
            Zarządzanie Kompozycjami Ziołowymi
          </h1>
          <p className="text-lg text-gray-600">
            System kontroli składników i kalkulacji dostępnych zestawów
          </p>
        </div>

        <Tabs defaultValue="ingredients" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              <Package size={18} />
              Składniki
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator size={18} />
              Kalkulator
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center gap-2">
              <ShoppingCart size={18} />
              Lista Zakupów
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <TrendingUp size={18} />
              Podsumowanie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center text-green-700">
                  Zarządzanie Składnikami i Cenami
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IngredientManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <ProductCalculator ingredients={ingredients} prices={prices} />
          </TabsContent>

          <TabsContent value="shopping" className="space-y-6">
            <ShoppingList prices={prices} />
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center text-blue-700">
                  Podsumowanie Finansowe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-100 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Wartość Surowców
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {Object.entries(ingredients)
                        .filter(([key]) => !key.includes('olejek'))
                        .reduce((sum, [key, amount]) => {
                          const numAmount = Number(amount) || 0;
                          const price = Number(prices[key]) || 0;
                          return sum + (numAmount * price / 100); // dzielimy przez 100 bo cena jest za 100g
                        }, 0)
                        .toFixed(2)} zł
                    </p>
                  </div>
                  
                  <div className="bg-blue-100 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      Wartość Olejków
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {Object.entries(ingredients)
                        .filter(([key]) => key.includes('olejek'))
                        .reduce((sum, [key, amount]) => {
                          const numAmount = Number(amount) || 0;
                          const price = Number(prices[key]) || 0;
                          return sum + (numAmount * price);
                        }, 0)
                        .toFixed(2)} zł
                    </p>
                  </div>
                  
                  <div className="bg-purple-100 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">
                      Wartość Całkowita
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {(Object.entries(ingredients)
                        .filter(([key]) => !key.includes('olejek'))
                        .reduce((sum, [key, amount]) => {
                          const numAmount = Number(amount) || 0;
                          const price = Number(prices[key]) || 0;
                          return sum + (numAmount * price / 100);
                        }, 0) +
                      Object.entries(ingredients)
                        .filter(([key]) => key.includes('olejek'))
                        .reduce((sum, [key, amount]) => {
                          const numAmount = Number(amount) || 0;
                          const price = Number(prices[key]) || 0;
                          return sum + (numAmount * price);
                        }, 0))
                        .toFixed(2)} zł
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
