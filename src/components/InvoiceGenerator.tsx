
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Copy } from 'lucide-react';
import { SalesTransaction } from '@/hooks/useSales';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface InvoiceGeneratorProps {
  transaction: SalesTransaction;
  companySettings: CompanySettings | null;
  transactionNumber: string;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ 
  transaction, 
  companySettings, 
  transactionNumber 
}) => {
  const convertToWords = (amount: number): string => {
    const units = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
    const teens = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
    const tens = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
    const hundreds = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];
    
    if (amount === 0) return 'zero złotych';
    
    const wholePart = Math.floor(amount);
    const fractionalPart = Math.round((amount - wholePart) * 100);
    
    let result = '';
    
    if (wholePart >= 1000) {
      const thousands = Math.floor(wholePart / 1000);
      if (thousands === 1) {
        result += 'tysiąc ';
      } else {
        result += convertHundreds(thousands) + ' tysięcy ';
      }
    }
    
    const remainder = wholePart % 1000;
    if (remainder > 0) {
      result += convertHundreds(remainder) + ' ';
    }
    
    // Dodaj złotych
    if (wholePart === 1) {
      result += 'złoty';
    } else if (wholePart % 10 >= 2 && wholePart % 10 <= 4 && (wholePart % 100 < 10 || wholePart % 100 >= 20)) {
      result += 'złote';
    } else {
      result += 'złotych';
    }
    
    // Dodaj grosze jeśli są
    if (fractionalPart > 0) {
      result += ' ' + fractionalPart.toString().padStart(2, '0') + '/100';
    }
    
    return result.trim();
    
    function convertHundreds(num: number): string {
      let str = '';
      
      if (num >= 100) {
        str += hundreds[Math.floor(num / 100)] + ' ';
        num %= 100;
      }
      
      if (num >= 20) {
        str += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        str += teens[num - 10] + ' ';
        num = 0;
      }
      
      if (num > 0) {
        str += units[num] + ' ';
      }
      
      return str.trim();
    }
  };

  const generatePDF = (isOriginal: boolean = true) => {
    console.log('Attempting to generate PDF, isOriginal:', isOriginal);
    
    const vatRate = 0.23;
    const totalGrossAmount = transaction.total_price;
    const totalNetAmount = totalGrossAmount / (1 + vatRate);
    const totalVatAmount = totalGrossAmount - totalNetAmount;
    const amountInWords = convertToWords(totalGrossAmount);

    // Parse composition names to handle multiple items
    const isMultipleItems = transaction.composition_name.includes(',');
    
    let items = [];
    
    if (isMultipleItems) {
      // NAPRAWKA: Dla sprzedaży koszyka, ekstraktuj rzeczywiste ceny z composition_name
      const compositionParts = transaction.composition_name.split(', ');
      
      // Sprawdź, czy w nazwie kompozycji są ukryte ceny (format: "1x Nazwa [29.99zł]")
      const itemsWithPrices = compositionParts.map(part => {
        const matchWithPrice = part.match(/^(\d+)x (.+) \[(\d+(?:\.\d{2})?)zł\]$/);
        if (matchWithPrice) {
          return {
            name: matchWithPrice[2],
            quantity: parseInt(matchWithPrice[1]),
            unitPrice: parseFloat(matchWithPrice[3])
          };
        }
        
        // Fallback do starego formatu
        const match = part.match(/^(\d+)x (.+)$/);
        if (match) {
          return {
            name: match[2],
            quantity: parseInt(match[1]),
            unitPrice: transaction.unit_price // Użyj średniej ceny jako fallback
          };
        }
        
        return {
          name: part,
          quantity: 1,
          unitPrice: transaction.unit_price
        };
      });
      
      items = itemsWithPrices;
    } else {
      items = [{
        name: transaction.composition_name,
        quantity: transaction.quantity,
        unitPrice: transaction.unit_price
      }];
    }

    console.log('Invoice calculations for items:', items);

    const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Faktura ${transactionNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .company-info, .buyer-info { width: 45%; }
        .invoice-title { text-align: center; font-size: 24px; font-weight: bold; margin: 30px 0; }
        .original-mark { text-align: center; font-size: 14px; margin-bottom: 20px; }
        .invoice-details { margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .items-table .number-cell { text-align: right; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .amount-in-words { margin-top: 15px; font-size: 14px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h3>Sprzedawca:</h3>
            <p><strong>${companySettings?.company_name || 'Nazwa firmy'}</strong></p>
            ${companySettings?.company_address ? `<p>${companySettings.company_address}</p>` : ''}
            ${companySettings?.company_tax_id ? `<p>NIP: ${companySettings.company_tax_id}</p>` : ''}
            ${companySettings?.company_phone ? `<p>Tel: ${companySettings.company_phone}</p>` : ''}
            ${companySettings?.company_email ? `<p>Email: ${companySettings.company_email}</p>` : ''}
        </div>
        <div class="buyer-info">
            <h3>Nabywca:</h3>
            ${transaction.buyer_name ? `<p><strong>${transaction.buyer_name}</strong></p>` : '<p>Klient indywidualny</p>'}
            ${transaction.buyer_address ? `<p>${transaction.buyer_address}</p>` : ''}
            ${transaction.buyer_tax_id ? `<p>NIP: ${transaction.buyer_tax_id}</p>` : ''}
            ${transaction.buyer_phone ? `<p>Tel: ${transaction.buyer_phone}</p>` : ''}
            ${transaction.buyer_email ? `<p>Email: ${transaction.buyer_email}</p>` : ''}
        </div>
    </div>
    
    <div class="invoice-title">FAKTURA ${transactionNumber}</div>
    <div class="original-mark">${isOriginal ? 'ORYGINAŁ' : 'KOPIA'}</div>
    
    <div class="invoice-details">
        <p><strong>Data wystawienia:</strong> ${format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: pl })}</p>
        <p><strong>Data sprzedaży:</strong> ${format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: pl })}</p>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>Lp.</th>
                <th>Nazwa towaru/usługi</th>
                <th>Ilość</th>
                <th>Cena netto</th>
                <th>Wartość netto</th>
                <th>VAT</th>
                <th>Kwota podatku</th>
                <th>Wartość brutto</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item, index) => {
              // NAPRAWKA: Użyj rzeczywistej ceny jednostkowej każdego produktu
              const itemGrossAmount = item.unitPrice * item.quantity;
              const itemNetAmount = itemGrossAmount / (1 + vatRate);
              const itemVatAmount = itemGrossAmount - itemNetAmount;
              const unitNetPrice = itemNetAmount / item.quantity;
              
              console.log(`Item ${item.name}:`, {
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                itemGrossAmount,
                itemNetAmount,
                itemVatAmount,
                unitNetPrice
              });
              
              return `
              <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity} szt.</td>
                  <td class="number-cell">${unitNetPrice.toFixed(2)} zł</td>
                  <td class="number-cell">${itemNetAmount.toFixed(2)} zł</td>
                  <td class="number-cell">23%</td>
                  <td class="number-cell">${itemVatAmount.toFixed(2)} zł</td>
                  <td class="number-cell">${itemGrossAmount.toFixed(2)} zł</td>
              </tr>
              `;
            }).join('')}
        </tbody>
        <tfoot>
            <tr style="font-weight: bold;">
                <td colspan="4">RAZEM:</td>
                <td class="number-cell">${totalNetAmount.toFixed(2)} zł</td>
                <td></td>
                <td class="number-cell">${totalVatAmount.toFixed(2)} zł</td>
                <td class="number-cell">${totalGrossAmount.toFixed(2)} zł</td>
            </tr>
        </tfoot>
    </table>
    
    <div class="total">
        <p>Razem do zapłaty: <strong>${totalGrossAmount.toFixed(2)} zł</strong></p>
        <div class="amount-in-words">
            <p><strong>Słownie:</strong> ${amountInWords}</p>
        </div>
    </div>
    
    ${companySettings?.bank_account ? `
    <div class="footer">
        <p><strong>Dane do przelewu:</strong></p>
        <p>Bank: ${companySettings.bank_name || 'Nazwa banku'}</p>
        <p>Numer konta: ${companySettings.bank_account}</p>
    </div>
    ` : ''}
</body>
</html>
    `;

    console.log('Attempting to open print window...');
    
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        console.log('Print window opened successfully');
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        
        // Add a slight delay before printing to ensure content is loaded
        setTimeout(() => {
          printWindow.print();
        }, 100);
      } else {
        console.error('Print window was blocked by popup blocker');
        alert('Popup został zablokowany. Proszę zezwolić na wyskakujące okna dla tej strony, aby móc drukować faktury.');
      }
    } catch (error) {
      console.error('Error opening print window:', error);
      alert('Wystąpił błąd podczas otwierania okna druku. Sprawdź ustawienia przeglądarki.');
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => generatePDF(true)}
        className="w-full text-xs px-1 py-1 h-6 min-w-0"
      >
        <FileText className="w-3 h-3 mr-1 shrink-0" />
        <span className="truncate">Oryginał</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => generatePDF(false)}
        className="w-full text-xs px-1 py-1 h-6 min-w-0"
      >
        <Copy className="w-3 h-3 mr-1 shrink-0" />
        <span className="truncate">Kopia</span>
      </Button>
    </div>
  );
};

export default InvoiceGenerator;
