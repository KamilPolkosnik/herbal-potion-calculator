import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, Package, BarChart3, TrendingDown, FileText, Download } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useIngredients } from '@/hooks/useIngredients';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { calculateOilPrice, convertToBaseUnit } from '@/utils/unitConverter';

const SalesStatistics: React.FC = () => {
  const { transactions, loading, refreshTransactions } = useSales();
  const { ingredients, prices } = useIngredients();
  const [compositionIngredients, setCompositionIngredients] = useState<Record<string, any[]>>({});
  const [ingredientUnits, setIngredientUnits] = useState<Record<string, string>>({});
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');

  // Load composition ingredients and units
  useEffect(() => {
    const loadCompositionData = async () => {
      try {
        // Load composition ingredients
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('composition_ingredients')
          .select('*');

        if (ingredientsError) throw ingredientsError;

        // Group ingredients by composition_id
        const ingredientsByComposition: Record<string, any[]> = {};
        ingredientsData?.forEach((ingredient) => {
          if (!ingredientsByComposition[ingredient.composition_id]) {
            ingredientsByComposition[ingredient.composition_id] = [];
          }
          ingredientsByComposition[ingredient.composition_id].push(ingredient);
        });

        setCompositionIngredients(ingredientsByComposition);

        // Load ingredient units
        const uniqueIngredients = [...new Set(ingredientsData?.map(item => item.ingredient_name) || [])];
        
        const { data: ingredientUnitsFromIngredients, error: unitsError } = await supabase
          .from('ingredients')
          .select('name, unit')
          .in('name', uniqueIngredients);

        const unitsMap: Record<string, string> = {};
        
        if (!unitsError && ingredientUnitsFromIngredients) {
          ingredientUnitsFromIngredients.forEach(item => {
            unitsMap[item.name] = item.unit;
          });
        }

        // Add fallback units for missing ingredients
        uniqueIngredients.forEach(ingredientName => {
          if (!unitsMap[ingredientName]) {
            if (ingredientName.toLowerCase().includes('olejek')) {
              unitsMap[ingredientName] = 'ml';
            } else if (ingredientName.toLowerCase().includes('worek') || 
                       ingredientName.toLowerCase().includes('woreczek') || 
                       ingredientName.toLowerCase().includes('pojemnik') ||
                       ingredientName.toLowerCase().includes('etykieta')) {
              unitsMap[ingredientName] = 'szt';
            } else {
              unitsMap[ingredientName] = 'g';
            }
          }
        });

        setIngredientUnits(unitsMap);
      } catch (error) {
        console.error('Error loading composition data:', error);
      }
    };

    loadCompositionData();
  }, []);

  // Nasłuchuj zdarzenia odświeżania statystyk sprzedaży
  useEffect(() => {
    const handleRefreshSalesStatistics = () => {
      refreshTransactions();
    };

    window.addEventListener('refreshSalesStatistics', handleRefreshSalesStatistics);
    
    return () => {
      window.removeEventListener('refreshSalesStatistics', handleRefreshSalesStatistics);
    };
  }, [refreshTransactions]);

  const months = [
    { value: 1, label: 'Styczeń' },
    { value: 2, label: 'Luty' },
    { value: 3, label: 'Marzec' },
    { value: 4, label: 'Kwiecień' },
    { value: 5, label: 'Maj' },
    { value: 6, label: 'Czerwiec' },
    { value: 7, label: 'Lipiec' },
    { value: 8, label: 'Sierpień' },
    { value: 9, label: 'Wrzesień' },
    { value: 10, label: 'Październik' },
    { value: 11, label: 'Listopad' },
    { value: 12, label: 'Grudzień' }
  ];

  // Generate available years from transactions
  const availableYears = useMemo(() => {
    if (!transactions.length) return [currentDate.getFullYear()];
    
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const year = new Date(transaction.created_at).getFullYear();
      years.add(year);
    });
    
    // Add current year if not present
    years.add(currentDate.getFullYear());
    
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentDate]);

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];

    const activeTransactions = transactions.filter(t => !t.is_reversed);
    
    if (reportType === 'yearly') {
      return activeTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.created_at);
        return transactionDate.getFullYear() === selectedYear;
      });
    } else {
      return activeTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.created_at);
        return transactionDate.getFullYear() === selectedYear && 
               transactionDate.getMonth() + 1 === selectedMonth;
      });
    }
  }, [transactions, selectedMonth, selectedYear, reportType]);

  // Parse composition name to extract individual products
  const parseCompositionName = (compositionName: string, totalPrice: number) => {
    const products: Array<{ name: string; quantity: number; price: number }> = [];
    
    // Check if it's a multi-item transaction (contains commas and price info)
    if (compositionName.includes(',') && compositionName.includes('[') && compositionName.includes('zł]')) {
      const parts = compositionName.split(', ');
      
      parts.forEach(part => {
        const match = part.match(/^(\d+)x (.+) \[(\d+(?:\.\d{2})?)zł\]$/);
        if (match) {
          const quantity = parseInt(match[1]);
          const name = match[2];
          const price = parseFloat(match[3]);
          
          products.push({
            name,
            quantity,
            price: price * quantity // Total price for this product
          });
        }
      });
    } else {
      // Single product transaction
      products.push({
        name: compositionName,
        quantity: 1,
        price: totalPrice
      });
    }
    
    return products;
  };

  const generateReport = () => {
    const reportData = {
      period: reportType === 'monthly' 
        ? `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
        : `Rok ${selectedYear}`,
      totalSales: filteredTransactions.length,
      totalRevenue: filteredTransactions.reduce((sum, t) => sum + t.total_price, 0),
      totalQuantity: filteredTransactions.reduce((sum, t) => sum + t.quantity, 0),
      transactions: filteredTransactions
    };

    // Get composition sales breakdown with proper parsing
    const compositionSales = filteredTransactions.reduce((acc, transaction) => {
      const products = parseCompositionName(transaction.composition_name, transaction.total_price);
      
      products.forEach(product => {
        const existing = acc.find(item => item.name === product.name);
        if (existing) {
          existing.quantity += product.quantity;
          existing.revenue += product.price;
          existing.count += 1;
        } else {
          acc.push({
            name: product.name,
            quantity: product.quantity,
            revenue: product.price,
            count: 1
          });
        }
      });
      
      return acc;
    }, [] as Array<{ name: string; quantity: number; revenue: number; count: number }>);

    compositionSales.sort((a, b) => b.revenue - a.revenue);

    // Generate PDF report
    const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Raport Sprzedaży - ${reportData.period}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .period { font-size: 16px; color: #666; }
        .summary { margin: 20px 0; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .summary-table th { background-color: #f2f2f2; }
        .number-cell { text-align: right; }
        .transactions-section { margin-top: 30px; }
        .transactions-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .transactions-table th, .transactions-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        .transactions-table th { background-color: #f2f2f2; }
        .compositions-section { margin-top: 30px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">RAPORT SPRZEDAŻY</div>
        <div class="period">${reportData.period}</div>
    </div>
    
    <div class="summary">
        <h3>Podsumowanie</h3>
        <table class="summary-table">
            <tr>
                <td><strong>Liczba transakcji:</strong></td>
                <td class="number-cell">${reportData.totalSales}</td>
            </tr>
            <tr>
                <td><strong>Łączny przychód:</strong></td>
                <td class="number-cell">${reportData.totalRevenue.toFixed(2)} zł</td>
            </tr>
            <tr>
                <td><strong>Łączna ilość:</strong></td>
                <td class="number-cell">${reportData.totalQuantity} szt.</td>
            </tr>
            <tr>
                <td><strong>Średnia wartość transakcji:</strong></td>
                <td class="number-cell">${reportData.totalSales > 0 ? (reportData.totalRevenue / reportData.totalSales).toFixed(2) : 0} zł</td>
            </tr>
        </table>
    </div>

    ${compositionSales.length > 0 ? `
    <div class="compositions-section">
        <h3>Top Zestawy</h3>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Lp.</th>
                    <th>Nazwa Zestawu</th>
                    <th>Ilość</th>
                    <th>Przychód</th>
                </tr>
            </thead>
            <tbody>
                ${compositionSales.map((comp, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${comp.name}</td>
                    <td class="number-cell">${comp.quantity} szt.</td>
                    <td class="number-cell">${comp.revenue.toFixed(2)} zł</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${reportData.transactions.length > 0 ? `
    <div class="transactions-section">
        <h3>Szczegółowe Transakcje</h3>
        <table class="transactions-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Zestaw</th>
                    <th>Kupujący</th>
                    <th>Ilość</th>
                    <th>Cena jedn.</th>
                    <th>Łącznie</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.transactions.map(t => `
                <tr>
                    <td>${format(new Date(t.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}</td>
                    <td>${t.composition_name}</td>
                    <td>${t.buyer_name || 'Klient indywidualny'}</td>
                    <td class="number-cell">${t.quantity} szt.</td>
                    <td class="number-cell">${t.unit_price.toFixed(2)} zł</td>
                    <td class="number-cell">${t.total_price.toFixed(2)} zł</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>Wygenerowano: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: pl })}</p>
    </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie statystyk...</div>
      </div>
    );
  }

  // Calculate statistics for filtered transactions
  const totalSales = filteredTransactions.length;
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total_price, 0);
  const totalQuantity = filteredTransactions.reduce((sum, t) => sum + t.quantity, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Calculate real cost of ingredients used in sold compositions
  const calculateTransactionCost = (transaction: any) => {
    const compositionId = transaction.composition_id;
    const quantity = transaction.quantity;
    
    // Get ingredients for this composition
    const ingredients = compositionIngredients[compositionId] || [];
    
    let totalCost = 0;
    
    console.log(`SalesStatistics - Calculating cost for composition: ${transaction.composition_name} (${quantity} szt.)`);
    
    ingredients.forEach(ingredient => {
      const ingredientName = ingredient.ingredient_name;
      let amount = ingredient.amount * quantity; // Total amount needed for this quantity
      const price = prices[ingredientName] || 0;
      const compositionUnit = ingredient.unit; // Unit from composition
      const ingredientUnit = ingredientUnits[ingredientName] || 'g'; // Unit from ingredients table
      
      console.log(`SalesStatistics - Składnik: ${ingredientName}`);
      console.log(`  - Ilość z kompozycji: ${amount} ${compositionUnit}`);
      console.log(`  - Jednostka w ingredients: ${ingredientUnit}`);
      console.log(`  - Cena: ${price}`);
      
      // Check if this is an essential oil and needs unit conversion
      const isOil = ingredientName.toLowerCase().includes('olejek');
      
      if (compositionUnit === 'krople' && ingredientUnit === 'ml' && isOil) {
        // Convert drops to ml for oils
        const convertedAmount = convertToBaseUnit(amount, compositionUnit);
        console.log(`  - Konwersja z ${amount} kropli na ${convertedAmount} ml`);
        amount = convertedAmount;
      }
      
      // Calculate cost based on unit type (same logic as in ShoppingList)
      let cost = 0;
      if (isOil && ingredientUnit === 'ml') {
        // Essential oils: price per 10ml, convert to ml
        cost = calculateOilPrice(amount, price);
        console.log(`  - Olejek: koszt = ${cost.toFixed(4)} zł (${amount}ml × ${price}/10ml)`);
      } else if (ingredientUnit === 'szt') {
        // Pieces: direct multiplication
        cost = amount * price;
        console.log(`  - Sztuki: koszt = ${cost.toFixed(4)} zł (${amount} × ${price})`);
      } else {
        // Herbs and others: price per 100g
        cost = (amount * price) / 100;
        console.log(`  - Zioła: koszt = ${cost.toFixed(4)} zł (${amount} × ${price}/100)`);
      }
      
      totalCost += cost;
    });
    
    console.log(`SalesStatistics - Łączny koszt transakcji ${transaction.composition_name} (${quantity} szt.): ${totalCost.toFixed(2)} zł`);
    return totalCost;
  };

  const totalCosts = filteredTransactions.reduce((sum, transaction) => {
    const transactionCost = calculateTransactionCost(transaction);
    return sum + transactionCost;
  }, 0);

  const totalProfit = totalRevenue - totalCosts;

  // Get composition sales breakdown with proper parsing for multi-item transactions
  const compositionSales = filteredTransactions.reduce((acc, transaction) => {
    const products = parseCompositionName(transaction.composition_name, transaction.total_price);
    
    products.forEach(product => {
      const existing = acc.find(item => item.name === product.name);
      if (existing) {
        existing.quantity += product.quantity;
        existing.revenue += product.price;
        existing.count += 1;
      } else {
        acc.push({
          name: product.name,
          quantity: product.quantity,
          revenue: product.price,
          count: 1
        });
      }
    });
    
    return acc;
  }, [] as Array<{ name: string; quantity: number; revenue: number; count: number }>);

  // Sort by revenue
  compositionSales.sort((a, b) => b.revenue - a.revenue);
  const topCompositions = compositionSales.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Filters and Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtry i Raport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Typ raportu</label>
              <Select value={reportType} onValueChange={(value: 'monthly' | 'yearly') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Miesięczny</SelectItem>
                  <SelectItem value="yearly">Roczny</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reportType === 'monthly' && (
              <div>
                <label className="block text-sm font-medium mb-2">Miesiąc</label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Rok</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={generateReport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Generuj Raport PDF
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Wyświetlane statystyki: {reportType === 'monthly' 
                ? `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                : `Rok ${selectedYear}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <p className="text-xs text-gray-500">w okresie</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Szacunkowy koszt</p>
                <p className="text-2xl font-bold text-red-600">{totalCosts.toFixed(2)} zł</p>
                <p className="text-xs text-gray-500">koszt składników</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Szacunkowy dochód</p>
                <p className="text-2xl font-bold text-emerald-600">{totalProfit.toFixed(2)} zł</p>
                <p className="text-xs text-gray-500">przychód - koszt</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
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
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance and Top Compositions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Podsumowanie Okresu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Transakcje:</span>
                <span className="font-semibold">{totalSales}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Przychód:</span>
                <span className="font-semibold text-green-600">{totalRevenue.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Łączna ilość:</span>
                <span className="font-semibold">{totalQuantity} szt.</span>
              </div>
              {reportType === 'monthly' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Średnia dzienna:</span>
                  <span className="font-semibold">{(totalRevenue / new Date(selectedYear, selectedMonth, 0).getDate()).toFixed(2)} zł</span>
                </div>
              )}
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
              <p className="text-gray-500 text-center py-4">Brak danych sprzedaży w wybranym okresie</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesStatistics;
