
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Copy } from 'lucide-react';
import { SalesTransaction } from '@/hooks/useSales';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CorrectionInvoiceGeneratorProps {
  transaction: SalesTransaction;
  companySettings: CompanySettings | null;
  transactionNumber: string;
  correctionNumber: string;
}

const CorrectionInvoiceGenerator: React.FC<CorrectionInvoiceGeneratorProps> = ({ 
  transaction, 
  companySettings, 
  transactionNumber,
  correctionNumber
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

  const generateCorrectionPDF = (isOriginal: boolean = true) => {
    const vatRate = 0.23;
    const totalGrossAmount = transaction.total_price;
    const totalNetAmount = totalGrossAmount / (1 + vatRate);
    const totalVatAmount = totalGrossAmount - totalNetAmount;
    const amountInWords = convertToWords(totalGrossAmount);

    // Parse composition names to handle multiple items
    const isMultipleItems = transaction.composition_name.includes(',');
    
    let items = [];
    
    if (isMultipleItems) {
      const compositionParts = transaction.composition_name.split(', ');
      
      const itemsWithPrices = compositionParts.map(part => {
        const matchWithPrice = part.match(/^(\d+)x (.+) \[(\d+(?:\.\d{2})?)zł\]$/);
        if (matchWithPrice) {
          return {
            name: matchWithPrice[2],
            quantity: parseInt(matchWithPrice[1]),
            unitPrice: parseFloat(matchWithPrice[3])
          };
        }
        
        const match = part.match(/^(\d+)x (.+)$/);
        if (match) {
          return {
            name: match[2],
            quantity: parseInt(match[1]),
            unitPrice: transaction.unit_price
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

    const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Faktura korygująca ${correctionNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .company-info, .buyer-info { width: 45%; }
        .invoice-title { text-align: center; font-size: 24px; font-weight: bold; margin: 30px 0; }
        .original-mark { text-align: center; font-size: 14px; margin-bottom: 20px; }
        .correction-info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; }
        .invoice-details { margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .items-table .number-cell { text-align: right; }
        .correction-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .correction-table th, .correction-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        .correction-table th { background-color: #ffe6e6; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .amount-in-words { margin-top: 15px; font-size: 14px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
        .correction-reason { margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; }
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
    
    <div class="invoice-title">FAKTURA KORYGUJĄCA ${correctionNumber}</div>
    <div class="original-mark">${isOriginal ? 'ORYGINAŁ' : 'KOPIA'}</div>
    
    <div class="correction-info">
        <p><strong>Faktura korygowana:</strong> ${transactionNumber}</p>
        <p><strong>Data faktury korygowanej:</strong> ${format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: pl })}</p>
    </div>
    
    <div class="invoice-details">
        <p><strong>Data wystawienia faktury korygującej:</strong> ${format(new Date(), 'dd.MM.yyyy', { locale: pl })}</p>
        <p><strong>Data sprzedaży:</strong> ${format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: pl })}</p>
    </div>
    
    <div class="correction-reason">
        <p><strong>Przyczyna korekty:</strong> Anulowanie sprzedaży - zwrot towaru</p>
    </div>

    <h3>Dane z faktury korygowanej:</h3>
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
              const itemGrossAmount = item.unitPrice * item.quantity;
              const itemNetAmount = itemGrossAmount / (1 + vatRate);
              const itemVatAmount = itemGrossAmount - itemNetAmount;
              const unitNetPrice = itemNetAmount / item.quantity;
              
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

    <h3>Korekta (różnice):</h3>
    <table class="correction-table">
        <thead>
            <tr>
                <th>Wartość netto</th>
                <th>Kwota podatku VAT</th>
                <th>Wartość brutto</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>-${totalNetAmount.toFixed(2)} zł</td>
                <td>-${totalVatAmount.toFixed(2)} zł</td>
                <td>-${totalGrossAmount.toFixed(2)} zł</td>
            </tr>
        </tbody>
    </table>
    
    <div class="total">
        <p>Kwota do zwrotu nabywcy: <strong>${totalGrossAmount.toFixed(2)} zł</strong></p>
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

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => generateCorrectionPDF(true)}
        className="w-full text-xs px-1 py-1 h-6 min-w-0 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
      >
        <FileText className="w-3 h-3 mr-1 shrink-0" />
        <span className="truncate">Korekta - Oryginał</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => generateCorrectionPDF(false)}
        className="w-full text-xs px-1 py-1 h-6 min-w-0 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
      >
        <Copy className="w-3 h-3 mr-1 shrink-0" />
        <span className="truncate">Korekta - Kopia</span>
      </Button>
    </div>
  );
};

export default CorrectionInvoiceGenerator;
