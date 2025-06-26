
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import IngredientManager from '@/components/IngredientManager';
import ProductCalculator from '@/components/ProductCalculator';
import ShoppingList from '@/components/ShoppingList';
import CompositionManager from '@/components/CompositionManager';
import LoginPage from '@/components/LoginPage';
import AppSidebar from '@/components/AppSidebar';
import SalesManager from '@/components/SalesManager';
import TransactionsList from '@/components/TransactionsList';
import SalesStatistics from '@/components/SalesStatistics';
import CompanySettings from '@/components/CompanySettings';
import UserManagement from '@/components/UserManagement';
import { useIngredients } from '@/hooks/useIngredients';
import { useAuth } from '@/hooks/useAuth';
import { useSummaryData } from '@/hooks/useSummaryData';

const Index = () => {
  const [activeTab, setActiveTab] = useState('ingredients');
  const { ingredients, prices, loading, refreshData } = useIngredients();
  const { user, loading: authLoading } = useAuth();
  const { rawMaterialsValue, oilsValue, totalValue, loading: summaryLoading, refreshSummary } = useSummaryData();

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
    // Odśwież podsumowanie gdy przełączamy na zakładkę podsumowania
    if (value === 'summary') {
      refreshSummary();
    }
    // Add refresh for sales tab
    if (value === 'sales') {
      refreshData();
      refreshSummary();
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
              <IngredientManager onDataChange={refreshSummary} />
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
              <CompositionManager onDataChange={refreshSummary} />
            </CardContent>
          </Card>
        );

      case 'shopping':
        return <ShoppingList prices={prices} />;

      case 'sales':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-green-700">
                Sprzedaż Zestawów
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesManager onDataChange={refreshSummary} />
            </CardContent>
          </Card>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            {/* Sales Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center text-green-700">
                  Statystyki Sprzedaży
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalesStatistics />
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center text-blue-700">
                  Podsumowanie Finansowe
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="text-lg">Ładowanie podsumowania...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-100 p-6 rounded-lg text-center">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Wartość Surowców
                      </h3>
                      <p className="text-2xl font-bold text-green-600">
                        {rawMaterialsValue.toFixed(2)} zł
                      </p>
                    </div>
                    
                    <div className="bg-blue-100 p-6 rounded-lg text-center">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        Wartość Olejków
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {oilsValue.toFixed(2)} zł
                      </p>
                    </div>
                    
                    <div className="bg-purple-100 p-6 rounded-lg text-center">
                      <h3 className="text-lg font-semibold text-purple-800 mb-2">
                        Wartość Całkowita
                      </h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {totalValue.toFixed(2)} zł
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Transactions List */}
            <TransactionsList onDataChange={refreshSummary} />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center text-purple-700">
                  Ustawienia Firmy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CompanySettings />
              </CardContent>
            </Card>

            {user.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-blue-700">
                    Zarządzanie Użytkownikami
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            )}
          </div>
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
