
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { SalesTransaction } from '@/hooks/useSales';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import jsPDF from 'jspdf';

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
    const doc = new jsPDF();
    
    // Ustawienia czcionki
    doc.setFont('helvetica');
    
    // Nagłówek faktury
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`FAKTURA ${transactionNumber}`, 105, 25, { align: 'center' });
    
    // Data wystawienia
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const dateStr = format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: pl });
    doc.text(`Wystawiono dnia: ${dateStr}`, 20, 40);
    
    // Linia oddzielająca
    doc.line(20, 45, 190, 45);
    
    // Dane sprzedawcy i nabywcy w dwóch kolumnach
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprzedawca:', 20, 60);
    doc.text('Nabywca:', 110, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Sprzedawca
    let yPosSeller = 70;
    if (companySettings?.company_name) {
      doc.setFont('helvetica', 'bold');
      doc.text(companySettings.company_name, 20, yPosSeller);
      doc.setFont('helvetica', 'normal');
      yPosSeller += 6;
    }
    
    if (companySettings?.company_address) {
      doc.text(companySettings.company_address, 20, yPosSeller);
      yPosSeller += 5;
    }
    
    if (companySettings?.company_tax_id) {
      doc.text(`NIP: ${companySettings.company_tax_id}`, 20, yPosSeller);
      yPosSeller += 5;
    }
    
    if (companySettings?.company_phone) {
      doc.text(`Tel: ${companySettings.company_phone}`, 20, yPosSeller);
      yPosSeller += 5;
    }
    
    if (companySettings?.company_email) {
      doc.text(`Email: ${companySettings.company_email}`, 20, yPosSeller);
      yPosSeller += 5;
    }
    
    // Nabywca
    let yPosBuyer = 70;
    doc.setFont('helvetica', 'bold');
    doc.text(transaction.buyer_name || 'Klient indywidualny', 110, yPosBuyer);
    doc.setFont('helvetica', 'normal');
    yPosBuyer += 6;
    
    if (transaction.buyer_address) {
      doc.text(transaction.buyer_address, 110, yPosBuyer);
      yPosBuyer += 5;
    }
    
    if (transaction.buyer_tax_id) {
      doc.text(`NIP: ${transaction.buyer_tax_id}`, 110, yPosBuyer);
      yPosBuyer += 5;
    }
    
    if (transaction.buyer_phone) {
      doc.text(`Tel: ${transaction.buyer_phone}`, 110, yPosBuyer);
      yPosBuyer += 5;
    }
    
    if (transaction.buyer_email) {
      doc.text(`Email: ${transaction.buyer_email}`, 110, yPosBuyer);
      yPosBuyer += 5;
    }
    
    // Daty sprzedaży
    const datesY = Math.max(yPosSeller, yPosBuyer) + 15;
    doc.text(`Data wystawienia: ${dateStr}`, 20, datesY);
    doc.text(`Data sprzedaży: ${dateStr}`, 20, datesY + 6);
    
    // Tabela produktów
    const tableStartY = datesY + 20;
    
    // Nagłówek tabeli
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Rysowanie tabeli
    const tableHeaders = [
      { text: 'Lp.', x: 22, width: 12 },
      { text: 'Nazwa towaru/usługi', x: 34, width: 50 },
      { text: 'Ilość', x: 84, width: 15 },
      { text: 'Cena netto', x: 99, width: 22 },
      { text: 'Wartość netto', x: 121, width: 25 },
      { text: 'VAT', x: 146, width: 15 },
      { text: 'Wartość brutto', x: 161, width: 28 }
    ];
    
    // Nagłówek tabeli
    doc.rect(20, tableStartY, 170, 8);
    tableHeaders.forEach(header => {
      doc.text(header.text, header.x, tableStartY + 5.5);
    });
    
    // Obliczenia VAT
    const vatRate = 0.23;
    const grossValue = transaction.total_price;
    const netValue = grossValue / (1 + vatRate);
    const vatValue = grossValue - netValue;
    
    // Wiersz z produktem
    doc.setFont('helvetica', 'normal');
    const rowY = tableStartY + 8;
    doc.rect(20, rowY, 170, 8);
    
    doc.text('1', 22, rowY + 5.5);
    doc.text(transaction.composition_name.length > 25 ? 
             transaction.composition_name.substring(0, 25) + '...' : 
             transaction.composition_name, 34, rowY + 5.5);
    doc.text(`${transaction.quantity} szt.`, 84, rowY + 5.5);
    doc.text(`${(netValue / transaction.quantity).toFixed(2)} zł`, 99, rowY + 5.5);
    doc.text(`${netValue.toFixed(2)} zł`, 121, rowY + 5.5);
    doc.text('23%', 146, rowY + 5.5);
    doc.text(`${grossValue.toFixed(2)} zł`, 161, rowY + 5.5);
    
    // Podsumowanie
    const summaryY = rowY + 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PODSUMOWANIE:', 20, summaryY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Wartość netto: ${netValue.toFixed(2)} zł`, 20, summaryY + 10);
    doc.text(`VAT 23%: ${vatValue.toFixed(2)} zł`, 20, summaryY + 16);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Razem: ${grossValue.toFixed(2)} zł`, 20, summaryY + 22);
    
    // Dodatkowe informacje
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Sposób płatności: gotówka', 20, summaryY + 32);
    doc.text(`Termin płatności: ${dateStr}`, 20, summaryY + 38);
    
    // Dane bankowe (jeśli dostępne)
    if (companySettings?.bank_account) {
      doc.text('Dane do przelewu:', 20, summaryY + 48);
      doc.text(`Bank: ${companySettings.bank_name || 'PKO BP'}`, 20, summaryY + 54);
      doc.text(`Numer konta: ${companySettings.bank_account}`, 20, summaryY + 60);
    }
    
    // Stopka
    const footerY = summaryY + 75;
    doc.line(20, footerY, 190, footerY);
    doc.setFontSize(8);
    doc.text(`Wygenerowano: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: pl })}`, 20, footerY + 8);
    
    // Zapisz PDF
    doc.save(`faktura_${transactionNumber}.pdf`);
  };

  return (
    <Button variant="outline" size="sm" onClick={generatePDF}>
      <FileText className="w-4 h-4 mr-1" />
      Faktura PDF
    </Button>
  );
};

export default InvoiceGenerator;
