
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import IngredientManager from "@/components/IngredientManager";
import CompositionManager from "@/components/CompositionManager";
import SalesManager from "@/components/SalesManager";
import TransactionsList from "@/components/TransactionsList";
import SalesStatistics from "@/components/SalesStatistics";
import MonthlyCostsManager from "@/components/MonthlyCostsManager";
import UESReportGenerator from "@/components/UESReportGenerator";
import CompanySettings from "@/components/CompanySettings";
import UserManagement from "@/components/UserManagement";
import ShoppingListWrapper from "@/components/ShoppingListWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useSummaryData } from "@/hooks/useSummaryData";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useState, useEffect } from "react";

const Index = () => {
  const { user } = useAuth();
  const { 
    rawMaterialsValue, 
    oilsValue, 
    othersValue, 
    totalValue, 
    totalSales, 
    monthlyCosts, 
    estimatedProfit, 
    loading, 
    refreshSummary 
  } = useSummaryData();
  const { settings: companySettings, loading: settingsLoading } = useCompanySettings();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('summary');

  const handleDataChange = () => {
    refreshSummary();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    const handleRefreshSummary = () => {
      refreshSummary();
    };

    const handleRefreshSalesStatistics = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('refreshSummary', handleRefreshSummary);
    window.addEventListener('refreshSalesStatistics', handleRefreshSalesStatistics);

    return () => {
      window.removeEventListener('refreshSummary', handleRefreshSummary);
      window.removeEventListener('refreshSalesStatistics', handleRefreshSalesStatistics);
    };
  }, [refreshSummary]);

  if (!user) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ingredients':
        return <IngredientManager />;
      case 'compositions':
        return <CompositionManager />;
      case 'sales':
        return <SalesManager onDataChange={handleDataChange} />;
      case 'shopping':
        return <ShoppingListWrapper />;
      case 'settings':
        return <CompanySettings />;
      case 'users':
        return user?.role === 'admin' ? <UserManagement /> : null;
      case 'management':
        return (
          <div className="space-y-4">
            <MonthlyCostsManager onDataChange={handleDataChange} />
            <TransactionsList onDataChange={handleDataChange} />
          </div>
        );
      case 'summary':
      default:
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Statistics */}
            <div className="w-full">
              <SalesStatistics key={refreshTrigger} />
            </div>

            {/* Monthly Costs */}
            <div className="w-full">
              <MonthlyCostsManager onDataChange={handleDataChange} />
            </div>

            {/* Financial Summary */}
            <div className="w-full">
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center">
                    Podsumowanie Finansowe
                  </h2>
                  {loading ? (
                    <div className="flex justify-center items-center py-6 sm:py-8">
                      <div className="text-base sm:text-lg">Ładowanie danych...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                      <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800 text-sm sm:text-base mb-1 sm:mb-2">Surowce Ziołowe</h3>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 break-words">
                          {rawMaterialsValue.toFixed(2)} zł
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                        <h3 className="font-semibold text-purple-800 text-sm sm:text-base mb-1 sm:mb-2">Olejki Eteryczne</h3>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 break-words">
                          {oilsValue.toFixed(2)} zł
                        </p>
                      </div>
                      <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
                        <h3 className="font-semibold text-orange-800 text-sm sm:text-base mb-1 sm:mb-2">Inne</h3>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 break-words">
                          {othersValue.toFixed(2)} zł
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 text-sm sm:text-base mb-1 sm:mb-2">Wartość Składników</h3>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 break-words">
                          {totalValue.toFixed(2)} zł
                        </p>
                      </div>
                      <div className="bg-emerald-50 p-3 sm:p-4 rounded-lg border border-emerald-200">
                        <h3 className="font-semibold text-emerald-800 text-sm sm:text-base mb-1 sm:mb-2">Całkowita Sprzedaż</h3>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 break-words">
                          {totalSales.toFixed(2)} zł
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
                        <h3 className="font-semibold text-red-800 text-sm sm:text-base mb-1 sm:mb-2">Koszty Miesięczne</h3>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 break-words">
                          {monthlyCosts.toFixed(2)} zł
                        </p>
                      </div>
                      <div className={`p-3 sm:p-4 rounded-lg border ${estimatedProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className={`font-semibold text-sm sm:text-base mb-1 sm:mb-2 ${estimatedProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          Szacunkowy Zysk
                        </h3>
                        <p className={`text-lg sm:text-xl md:text-2xl font-bold break-words ${estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {estimatedProfit.toFixed(2)} zł
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* UES Generator */}
            {!settingsLoading && companySettings?.show_ues_generator && (
              <div className="w-full">
                <UESReportGenerator />
              </div>
            )}

            {/* Transactions History */}
            <div className="w-full">
              <TransactionsList onDataChange={handleDataChange} />
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-full mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
