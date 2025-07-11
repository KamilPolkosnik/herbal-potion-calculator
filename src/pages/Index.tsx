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
import { useCompanySettings } from '@/hooks/useCompanySettings';
import MonthlyCostsManager from '@/components/MonthlyCostsManager';

const Index = () => {
  const [activeTab, setActiveTab] = useState('ingredients');
  const { ingredients, prices, loading, refreshData } = useIngredients();
  const { user, loading: authLoading } = useAuth();
  const { settings, refreshSettings } = useCompanySettings();
  const { 
    rawMaterialsValue, 
    oilsValue, 
    othersValue, 
    totalValue, 
    totalSales,
    monthlyCosts,
    estimatedCosts,
    estimatedProfit,
    loading: summaryLoading, 
    refreshSummary 
  } = useSummaryData();

  console.log('Index - Current user:', user);
  console.log('Index - Company settings:', settings);
  console.log('Index - Show UES generator:', settings?.show_ues_generator);
  console.log('Index - User role:', user?.role);

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

  // Nasłuchuj zdarzenia zmiany ustawień firmy
  useEffect(() => {
    const handleCompanySettingsUpdated = () => {
      console.log('Company settings updated, refreshing...');
      refreshSettings();
    };

    window.addEventListener('companySettingsUpdated', handleCompanySettingsUpdated);
    
    return () => {
      window.removeEventListener('companySettingsUpdated', handleCompanySettingsUpdated);
    };
  }, [refreshSettings]);

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
          <div className="w-full">
            <Card className="w-full">
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
          <div className="w-full">
            <ProductCalculator ingredients={ingredients} prices={prices} />
          </div>
        );

      case 'management':
        return (
          <div className="w-full">
            <Card className="w-full">
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
          <div className="w-full">
            <ShoppingListWrapper />
          </div>
        );

      case 'sales':
        return (
          <div className="w-full">
            <Card className="w-full">
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
          <div className="w-full">
            <Card className="w-full">
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
          <div className="w-full space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
            {/* Sales Statistics - na górze (tylko dla administratorów) */}
            {user?.role === 'admin' && (
              <div className="w-full">
                <Card className="w-full">
                  <CardHeader className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-center text-green-700 px-1 break-words">
                      Statystyki Sprzedaży
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                    <SalesStatistics />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Monthly Costs Manager - na drugiej pozycji (tylko dla administratorów) */}
            {user?.role === 'admin' && (
              <div className="w-full">
                <Card className="w-full">
                  <CardHeader className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-center text-red-700 px-1 break-words">
                      Zarządzanie Kosztami Miesięcznymi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                    <MonthlyCostsManager />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Financial Summary - na trzeciej pozycji (tylko dla administratorów) */}
            {user?.role === 'admin' && (
              <div className="w-full">
                <Card className="w-full">
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
                      <div className="flex justify-center">
                        <div className="w-full max-w-6xl">
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                            <div className="bg-emerald-100 p-2 sm:p-3 md:p-4 rounded-lg text-center min-w-0 overflow-hidden">
                              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-emerald-800 mb-1 sm:mb-2 leading-tight break-words">
                                Całkowita Sprzedaż
                              </h3>
                              <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-emerald-600 break-words">
                                {totalSales.toFixed(2)} zł
                              </p>
                            </div>

                            <div className="bg-blue-100 p-2 sm:p-3 md:p-4 rounded-lg text-center min-w-0 overflow-hidden">
                              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-blue-800 mb-1 sm:mb-2 leading-tight break-words">
                                Całkowity Dochód
                              </h3>
                              <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-blue-600 break-words">
                                {(totalSales - estimatedCosts).toFixed(2)} zł
                              </p>
                            </div>

                            <div className={`p-2 sm:p-3 md:p-4 rounded-lg text-center min-w-0 overflow-hidden ${estimatedProfit >= 0 ? 'bg-cyan-100' : 'bg-red-100'}`}>
                              <h3 className={`text-xs sm:text-sm md:text-base font-semibold mb-1 sm:mb-2 leading-tight break-words ${estimatedProfit >= 0 ? 'text-cyan-800' : 'text-red-800'}`}>
                                Całkowity Zysk
                              </h3>
                              <p className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold break-words ${estimatedProfit >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                                {estimatedProfit.toFixed(2)} zł
                              </p>
                            </div>
                          </div>
                          
                          {monthlyCosts > 0 && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800 text-center">
                                Koszty miesięczne za obecny miesiąc: <strong>{monthlyCosts.toFixed(2)} zł</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* UES Report Generator - na czwartej pozycji (tylko dla administratorów i jeśli włączone) */}
            {user?.role === 'admin' && settings?.show_ues_generator === true && (
              <div className="w-full">
                <Card className="w-full">
                  <CardHeader className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-center text-purple-700 px-1 break-words">
                      Generator UES
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                    <div className="flex justify-center">
                      <div className="w-full max-w-md">
                        <UESReportGenerator />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Transactions List - na końcu */}
            <div className="w-full">
              <TransactionsList onDataChange={refreshSummary} />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="w-full">
            <Card className="w-full">
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
            <div className="w-full space-y-2 sm:space-y-4 md:space-y-6 overflow-x-hidden">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
