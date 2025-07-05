
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
          <div className="max-w-7xl mx-auto">
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
          </div>
        );

      case 'calculator':
        return (
          <div className="max-w-5xl mx-auto">
            <ProductCalculator ingredients={ingredients} prices={prices} />
          </div>
        );

      case 'management':
        return (
          <div className="max-w-6xl mx-auto">
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
          </div>
        );

      case 'shopping':
        return (
          <div className="max-w-4xl mx-auto">
            <ShoppingListWrapper />
          </div>
        );

      case 'sales':
        return (
          <div className="max-w-6xl mx-auto">
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
          </div>
        );

      case 'users':
        return (
          <div className="max-w-4xl mx-auto">
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
          </div>
        );

      case 'summary':
        return (
          <div className="max-w-7xl mx-auto w-full overflow-x-hidden space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
            {/* UES Report Generator - tylko dla administratorów */}
            {user?.role === 'admin' && (
              <div className="max-w-md mx-auto lg:max-w-lg">
                <Card className="w-full min-w-0">
                  <CardHeader className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-center text-purple-700 px-1 break-words">
                      Generator UES
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                    <div className="overflow-x-auto">
                      <UESReportGenerator />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Monthly Costs Manager - tylko dla administratorów */}
            {user?.role === 'admin' && (
              <div className="max-w-5xl mx-auto">
                <Card className="w-full min-w-0">
                  <CardHeader className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-center text-red-700 px-1 break-words">
                      Zarządzanie Kosztami Miesięcznymi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                    <div className="overflow-x-auto">
                      <MonthlyCostsManager />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sales Statistics - tylko dla administratorów */}
            {user?.role === 'admin' && (
              <div className="max-w-6xl mx-auto">
                <Card className="w-full min-w-0">
                  <CardHeader className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-center text-green-700 px-1 break-words">
                      Statystyki Sprzedaży
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                    <div className="overflow-x-auto">
                      <SalesStatistics />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Financial Summary - tylko dla administratorów */}
            {user?.role === 'admin' && (
              <div className="max-w-4xl mx-auto">
                <Card className="w-full min-w-0">
                  <CardHeader className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-center text-blue-700 px-1 break-words">
                      Podsumowanie Finansowe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                    {summaryLoading ? (
                      <div className="flex justify-center items-center p-4 sm:p-6 md:p-8">
                        <div className="text-xs sm:text-sm md:text-base text-center break-words">Ładowanie podsumowania...</div>
                      </div>
                    ) : (
                      <div className="w-full overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                          <div className="bg-green-100 p-2 sm:p-3 md:p-4 rounded-lg text-center min-w-0 overflow-hidden">
                            <h3 className="text-xs sm:text-sm md:text-base font-semibold text-green-800 mb-1 sm:mb-2 leading-tight break-words">
                              Wartość Surowców
                            </h3>
                            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-green-600 break-words">
                              {rawMaterialsValue.toFixed(2)} zł
                            </p>
                          </div>
                          
                          <div className="bg-blue-100 p-2 sm:p-3 md:p-4 rounded-lg text-center min-w-0 overflow-hidden">
                            <h3 className="text-xs sm:text-sm md:text-base font-semibold text-blue-800 mb-1 sm:mb-2 leading-tight break-words">
                              Wartość Olejków
                            </h3>
                            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-blue-600 break-words">
                              {oilsValue.toFixed(2)} zł
                            </p>
                          </div>
                          
                          <div className="bg-orange-100 p-2 sm:p-3 md:p-4 rounded-lg text-center min-w-0 overflow-hidden">
                            <h3 className="text-xs sm:text-sm md:text-base font-semibold text-orange-800 mb-1 sm:mb-2 leading-tight break-words">
                              Wartość Innych
                            </h3>
                            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-orange-600 break-words">
                              {othersValue.toFixed(2)} zł
                            </p>
                          </div>
                          
                          <div className="bg-purple-100 p-2 sm:p-3 md:p-4 rounded-lg text-center min-w-0 overflow-hidden">
                            <h3 className="text-xs sm:text-sm md:text-base font-semibold text-purple-800 mb-1 sm:mb-2 leading-tight break-words">
                              Wartość Całkowita
                            </h3>
                            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-purple-600 break-words">
                              {totalValue.toFixed(2)} zł
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Transactions List */}
            <div className="max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
              <TransactionsList onDataChange={refreshSummary} />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-3xl mx-auto">
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
          </div>
        );

      default:
        return <div className="text-center p-4">Nieznana zakładka</div>;
    }
  };

  return (
    <>
      <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <SidebarInset>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen overflow-x-hidden">
          <header className="flex h-12 sm:h-16 shrink-0 items-center gap-2 border-b bg-white/80 backdrop-blur-sm px-2 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 text-center px-2 min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-800 break-words">
                Zarządzanie Kompozycjami Ziołowymi
              </h1>
            </div>
          </header>
          <main className="p-1 sm:p-2 md:p-4 lg:p-6 overflow-x-hidden">
            <div className="w-full mx-auto space-y-2 sm:space-y-4 md:space-y-6 overflow-x-hidden">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
