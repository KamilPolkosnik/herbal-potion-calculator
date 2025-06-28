import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown, DollarSign, Package, BarChart3, TrendingUp, Download } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useIngredients } from '@/hooks/useIngredients';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import jsPDF from 'jspdf';

const SalesStatistics: React.FC = () => {
  const { transactions, loading } = useSales();
  const { ingredients, prices } = useIngredients();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');

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

  const generateReport = () => {
    const reportData = {
      period: reportType === 'monthly' 
        ? `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
        : `Rok ${selectedYear}`,
      totalSales: filteredTransactions.length,
      totalRevenue: filteredTransactions.reduce((sum, t) => sum + t.total_price, 0),
      totalQuantity: filteredTransactions.reduce((sum, t) => sum + t.quantity, 0),
      transactions: filteredTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    };

    const doc = new jsPDF();
    
    // Nagłówek raportu
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`RAPORT SPRZEDAŻY - ${reportData.period}`, 105, 20, { align: 'center' });
    
    // Linia oddzielająca
    doc.line(20, 25, 190, 25);
    
    // Podsumowanie
    doc.setFontSize(12);
    doc.text('PODSUMOWANIE:', 20, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Ramka dla podsumowania
    doc.rect(20, 45, 170, 30);
    
    doc.text(`Liczba transakcji: ${reportData.totalSales}`, 25, 53);
    doc.text(`Łączny przychód: ${reportData.totalRevenue.toFixed(2)} zł`, 25, 59);
    doc.text(`Łączna ilość sprzedanych produktów: ${reportData.totalQuantity} szt.`, 25, 65);
    doc.text(`Średnia wartość transakcji: ${reportData.totalSales > 0 ? (reportData.totalRevenue / reportData.totalSales).toFixed(2) : '0.00'} zł`, 25, 71);
    
    // Szczegółowe transakcje
    if (reportData.transactions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SZCZEGÓŁOWE TRANSAKCJE:', 20, 90);
      
      // Nagłówek tabeli transakcji
      doc.setFontSize(8);
      doc.rect(20, 95, 170, 8);
      doc.text('Data', 22, 100);
      doc.text('Produkt', 45, 100);
      doc.text('Ilość', 100, 100);
      doc.text('Cena jedn.', 120, 100);
      doc.text('Łącznie', 145, 100);
      doc.text('Kupujący', 165, 100);
      
      // Initialize variables for pagination
      let yPos = 103;
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setFont('helvetica', 'normal');
      
      reportData.transactions.forEach((transaction, index) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
          
          // Powtórz nagłówek tabeli na nowej stronie
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.rect(20, yPos, 170, 8);
          doc.text('Data', 22, yPos + 5);
          doc.text('Produkt', 45, yPos + 5);
          doc.text('Ilość', 100, yPos + 5);
          doc.text('Cena jedn.', 120, yPos + 5);
          doc.text('Łącznie', 145, yPos + 5);
          doc.text('Kupujący', 165, yPos + 5);
          yPos += 8;
          doc.setFont('helvetica', 'normal');
        }
        
        doc.rect(20, yPos, 170, 6);
        
        const dateStr = format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: pl });
        const productName = transaction.composition_name.length > 20 ? 
                           transaction.composition_name.substring(0, 20) + '...' : 
                           transaction.composition_name;
        const buyerName = (transaction.buyer_name || 'Klient ind.').length > 15 ? 
                         (transaction.buyer_name || 'Klient ind.').substring(0, 15) + '...' : 
                         (transaction.buyer_name || 'Klient ind.');
        
        doc.text(dateStr, 22, yPos + 4);
        doc.text(productName, 45, yPos + 4);
        doc.text(`${transaction.quantity}`, 100, yPos + 4);
        doc.text(`${transaction.unit_price.toFixed(2)} zł`, 120, yPos + 4);
        doc.text(`${transaction.total_price.toFixed(2)} zł`, 145, yPos + 4);
        doc.text(buyerName, 165, yPos + 4);
        
        yPos += 6;
      });
      
      // Dodaj przestrzeń przed stopką
      yPos += 10;
      
      // Stopka - check if we need new page
      if (yPos > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.line(20, yPos, 190, yPos);
      doc.setFontSize(8);
      doc.text(`Wygenerowano: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: pl })}`, 20, yPos + 8);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Brak transakcji w wybranym okresie.', 20, 100);
      
      // Add footer for no transactions case
      const footerY = 110;
      doc.line(20, footerY, 190, footerY);
      doc.setFontSize(8);
      doc.text(`Wygenerowano: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: pl })}`, 20, footerY + 8);
    }
    
    // Zapisz PDF
    const fileName = `raport_sprzedazy_${reportType}_${selectedYear}${reportType === 'monthly' ? `_${selectedMonth.toString().padStart(2, '0')}` : ''}.pdf`;
    doc.save(fileName);
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

  const totalCosts = filteredTransactions.reduce((sum, transaction) => {
    return sum + (transaction.total_price * 0.3);
  }, 0);

  const totalProfit = totalRevenue - totalCosts;

  const compositionSales = filteredTransactions.reduce((acc, transaction) => {
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
