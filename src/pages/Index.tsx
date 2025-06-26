
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import IngredientManager from '@/components/IngredientManager';
import ProductCalculator from '@/components/ProductCalculator';
import ShoppingList from '@/components/ShoppingList';
import CompositionManager from '@/components/CompositionManager';
import LoginPage from '@/components/LoginPage';
import AppSidebar from '@/components/AppSidebar';
import { useIngredients } from '@/hooks/useIngredients';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [activeTab, setActiveTab] = useState('ingredients');
  const { ingredients, prices, loading, refreshData } = useIngredients();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Ładowanie aplikacji...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={() => window.location.reload()} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Ładowanie danych...</div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Odśwież dane gdy przełączamy na zakładki które wymagają aktualnych danych
    if (value === 'calculator' || value === 'management') {
      refreshData();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'ingredients':
        return (
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
        );

      case 'calculator':
        return <ProductCalculator ingredients={ingredients} prices={prices} />;

      case 'management':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-blue-700">
                Zarządzanie Zestawami
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompositionManager />
            </CardContent>
          </Card>
        );

      case 'shopping':
        return <ShoppingList prices={prices} />;

      case 'summary':
        return (
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
        );

      default:
        return <div>Nieznana zakładka</div>;
    }
  };

  return (
    <>
      <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <SidebarInset>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 backdrop-blur-sm px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold text-gray-800">
                Zarządzanie Kompozycjami Ziołowymi
              </h1>
            </div>
          </header>
          <main className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
