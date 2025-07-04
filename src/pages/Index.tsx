
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import IngredientManager from '@/components/IngredientManager';
import ProductCalculator from '@/components/ProductCalculator';
import ShoppingListWrapper from '@/components/ShoppingListWrapper';
import CompositionManager from '@/components/CompositionManager';
import LoginPage from '@/components/LoginPage';
import AppSidebar from '@/components/AppSidebar';
import SalesManager from '@/components/SalesManager';
import TransactionsList from '@/components/TransactionsList';
import SalesStatistics from '@/components/SalesStatistics';
import CompanySettings from '@/components/CompanySettings';
import UserManagement from '@/components/UserManagement';
import UESReportGenerator from '@/components/UESReportGenerator';
import { useIngredients } from '@/hooks/useIngredients';
import { useAuth } from '@/hooks/useAuth';
import { useSummaryData } from '@/hooks/useSummaryData';
import MonthlyCostsManager from '@/components/MonthlyCostsManager';

const Index = () => {
  const [activeTab, setActiveTab] = useState('ingredients');
  const { ingredients, prices, loading, refreshData } = useIngredients();
  const { user, loading: authLoading } = useAuth();
  const { rawMaterialsValue, oilsValue, othersValue, totalValue, loading: summaryLoading, refreshSummary } = useSummaryData();

  // Nasłuchuj zdarzenia odświeżania podsumowania
  useEffect(() => {
    const handleRefreshSummary = () => {
      refreshSummary();
    };

    window.addEventListener('refreshSummary', handleRefreshSummary);
    
    return () => {
      window.removeEventListener('refreshSummary', handleRefreshSummary);
    };
  }, [refreshSummary]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-xl sm:text-2xl text-gray-600 text-center">Ładowanie aplikacji...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={() => window.location.reload()} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-xl sm:text-2xl text-gray-600 text-center">Ładowanie danych...</div>
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
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-green-700 px-2">
                Zarządzanie Składnikami i Cenami
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
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
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-blue-700 px-2">
                Zarządzanie Zestawami
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <CompositionManager onDataChange={refreshSummary} />
            </CardContent>
          </Card>
        );

      case 'shopping':
        return <ShoppingListWrapper />;

      case 'sales':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-green-700 px-2">
                Sprzedaż Zestawów
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <SalesManager onDataChange={refreshSummary} />
            </CardContent>
          </Card>
        );

      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-blue-700 px-2">
                Zarządzanie Użytkownikami
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <UserManagement />
            </CardContent>
          </Card>
        );

      case 'summary':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* UES Report Generator - tylko dla administratorów */}
            {user?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-purple-700 px-2">
                    Generator UES
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <UESReportGenerator />
                </CardContent>
              </Card>
            )}

            {/* Monthly Costs Manager - tylko dla administratorów */}
            {user?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-red-700 px-2">
                    Zarządzanie Kosztami Miesięcznymi
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <MonthlyCostsManager />
                </CardContent>
              </Card>
            )}

            {/* Sales Statistics - tylko dla administratorów */}
            {user?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-green-700 px-2">
                    Statystyki Sprzedaży
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <SalesStatistics />
                </CardContent>
              </Card>
            )}

            {/* Financial Summary - tylko dla administratorów */}
            {user?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-blue-700 px-2">
                    Podsumowanie Finansowe
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {summaryLoading ? (
                    <div className="flex justify-center items-center p-4 sm:p-8">
                      <div className="text-base sm:text-lg text-center">Ładowanie podsumowania...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
                      <div className="bg-green-100 p-4 sm:p-6 rounded-lg text-center">
                        <h3 className="text-sm sm:text-lg font-semibold text-green-800 mb-2">
                          Wartość Surowców
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-green-600">
                          {rawMaterialsValue.toFixed(2)} zł
                        </p>
                      </div>
                      
                      <div className="bg-blue-100 p-4 sm:p-6 rounded-lg text-center">
                        <h3 className="text-sm sm:text-lg font-semibold text-blue-800 mb-2">
                          Wartość Olejków
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600">
                          {oilsValue.toFixed(2)} zł
                        </p>
                      </div>
                      
                      <div className="bg-orange-100 p-4 sm:p-6 rounded-lg text-center">
                        <h3 className="text-sm sm:text-lg font-semibold text-orange-800 mb-2">
                          Wartość Innych
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-orange-600">
                          {othersValue.toFixed(2)} zł
                        </p>
                      </div>
                      
                      <div className="bg-purple-100 p-4 sm:p-6 rounded-lg text-center">
                        <h3 className="text-sm sm:text-lg font-semibold text-purple-800 mb-2">
                          Wartość Całkowita
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-purple-600">
                          {totalValue.toFixed(2)} zł
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Transactions List */}
            <TransactionsList onDataChange={refreshSummary} />
          </div>
        );

      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-center text-purple-700 px-2">
                Ustawienia Firmy
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <CompanySettings />
            </CardContent>
          </Card>
        );

      default:
        return <div className="text-center p-4">Nieznana zakładka</div>;
    }
  };

  return (
    <>
      <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <SidebarInset>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
          <header className="flex h-12 sm:h-16 shrink-0 items-center gap-2 border-b bg-white/80 backdrop-blur-sm px-2 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 text-center px-2">
              <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-800">
                Zarządzanie Kompozycjami Ziołowymi
              </h1>
            </div>
          </header>
          <main className="p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
