
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react';
import { useSales } from '@/hooks/useSales';

const SalesStatistics: React.FC = () => {
  const { transactions, loading } = useSales();

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie statystyk...</div>
      </div>
    );
  }

  // Calculate statistics for active (non-reversed) transactions
  const activeTransactions = transactions.filter(t => !t.is_reversed);
  
  const totalSales = activeTransactions.length;
  const totalRevenue = activeTransactions.reduce((sum, t) => sum + t.total_price, 0);
  const totalQuantity = activeTransactions.reduce((sum, t) => sum + t.quantity, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Get composition sales breakdown
  const compositionSales = activeTransactions.reduce((acc, transaction) => {
    const existing = acc.find(item => item.name === transaction.composition_name);
    if (existing) {
      existing.quantity += transaction.quantity;
      existing.revenue += transaction.total_price;
      existing.count += 1;
    } else {
      acc.push({
        name: transaction.composition_name,
        quantity: transaction.quantity,
        revenue: transaction.total_price,
        count: 1
      });
    }
    return acc;
  }, [] as Array<{ name: string; quantity: number; revenue: number; count: number }>);

  // Sort by revenue
  compositionSales.sort((a, b) => b.revenue - a.revenue);
  const topCompositions = compositionSales.slice(0, 5);

  // Recent transactions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentTransactions = activeTransactions.filter(
    t => new Date(t.created_at) >= sevenDaysAgo
  );
  const recentRevenue = recentTransactions.reduce((sum, t) => sum + t.total_price, 0);

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Łączna sprzedaż</p>
                <p className="text-2xl font-bold text-blue-600">{totalSales}</p>
                <p className="text-xs text-gray-500">transakcji</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Łączny przychód</p>
                <p className="text-2xl font-bold text-green-600">{totalRevenue.toFixed(2)} zł</p>
                <p className="text-xs text-gray-500">wszystkie transakcje</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sprzedane sztuki</p>
                <p className="text-2xl font-bold text-purple-600">{totalQuantity}</p>
                <p className="text-xs text-gray-500">wszystkich produktów</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Średnia wartość</p>
                <p className="text-2xl font-bold text-orange-600">{averageOrderValue.toFixed(2)} zł</p>
                <p className="text-xs text-gray-500">na transakcję</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ostatnie 7 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Transakcje:</span>
                <span className="font-semibold">{recentTransactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Przychód:</span>
                <span className="font-semibold text-green-600">{recentRevenue.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Średnia dzienna:</span>
                <span className="font-semibold">{(recentRevenue / 7).toFixed(2)} zł</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Zestawów</CardTitle>
          </CardHeader>
          <CardContent>
            {topCompositions.length > 0 ? (
              <div className="space-y-3">
                {topCompositions.map((comp, index) => (
                  <div key={comp.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm">{comp.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{comp.revenue.toFixed(2)} zł</div>
                      <div className="text-xs text-gray-500">{comp.quantity} szt.</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Brak danych sprzedaży</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesStatistics;
