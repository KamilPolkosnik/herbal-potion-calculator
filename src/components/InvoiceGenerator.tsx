
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
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
  const generatePDF = () => {
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
        .invoice-details { margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
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
                <th>Wartość brutto</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>${transaction.composition_name}</td>
                <td>${transaction.quantity} szt.</td>
                <td>${transaction.unit_price.toFixed(2)} zł</td>
                <td>${transaction.total_price.toFixed(2)} zł</td>
                <td>zw.</td>
                <td>${transaction.total_price.toFixed(2)} zł</td>
            </tr>
        </tbody>
    </table>
    
    <div class="total">
        <p>Razem do zapłaty: <strong>${transaction.total_price.toFixed(2)} zł</strong></p>
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
    <Button variant="outline" size="sm" onClick={generatePDF}>
      <FileText className="w-4 h-4 mr-1" />
      Faktura PDF
    </Button>
  );
};

export default InvoiceGenerator;
