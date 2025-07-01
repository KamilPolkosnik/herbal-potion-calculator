
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileBarChart } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const UESReportGenerator: React.FC = () => {
  const { transactions } = useSales();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generate available years from transactions
  const availableYears = React.useMemo(() => {
    if (!transactions.length) return [new Date().getFullYear()];
    
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const year = new Date(transaction.created_at).getFullYear();
      years.add(year);
    });
    
    years.add(new Date().getFullYear());
    
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const generateUESReport = () => {
    // Filter transactions for selected year (only active transactions)
    const yearTransactions = transactions
      .filter(t => !t.is_reversed && new Date(t.created_at).getFullYear() === selectedYear)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (yearTransactions.length === 0) {
      alert('Brak transakcji w wybranym roku');
      return;
    }

    // Generate transaction numbers and calculate cumulative amounts
    let cumulativeAmount = 0;
    const reportData = yearTransactions.map((transaction, index) => {
      cumulativeAmount += transaction.total_price;
      
      // Generate chronological transaction number
      const chronologicalNumber = (index + 1).toString().padStart(9, '0');
      
      return {
        lp: index + 1,
        date: format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: pl }),
        documentNumber: chronologicalNumber,
        grossAmount: transaction.total_price,
        cumulativeAmount: cumulativeAmount
      };
    });

    const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Uproszczony Rejestr Sprzedaży - ${selectedYear}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .year { font-size: 16px; color: #666; margin-bottom: 20px; }
        .register-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .register-table th, .register-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .register-table th { background-color: #f2f2f2; font-weight: bold; }
        .number-cell { text-align: right; }
        .center-cell { text-align: center; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
        .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd; }
        .summary h3 { margin-top: 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">UPROSZCZONY REJESTR SPRZEDAŻY</div>
        <div class="year">Rok ${selectedYear}</div>
    </div>
    
    <table class="register-table">
        <thead>
            <tr>
                <th class="center-cell">Lp.</th>
                <th class="center-cell">Data sprzedaży</th>
                <th class="center-cell">Numer dokumentu sprzedaży</th>
                <th class="center-cell">Kwota sprzedaży brutto</th>
                <th class="center-cell">Kwota sprzedaży brutto narastająco</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.map(row => `
            <tr>
                <td class="center-cell">${row.lp}</td>
                <td class="center-cell">${row.date}</td>
                <td class="center-cell">${row.documentNumber}</td>
                <td class="number-cell">${row.grossAmount.toFixed(2)} zł</td>
                <td class="number-cell">${row.cumulativeAmount.toFixed(2)} zł</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="summary">
        <h3>Podsumowanie za rok ${selectedYear}</h3>
        <p><strong>Liczba transakcji:</strong> ${reportData.length}</p>
        <p><strong>Łączna kwota sprzedaży brutto:</strong> ${cumulativeAmount.toFixed(2)} zł</p>
    </div>
    
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

  return (
    <div className="flex items-center gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rok dla UES:</label>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
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
      
      <Button onClick={generateUESReport} className="flex items-center gap-2 mt-6">
        <FileBarChart className="w-4 h-4" />
        Wygeneruj UES
      </Button>
    </div>
  );
};

export default UESReportGenerator;
