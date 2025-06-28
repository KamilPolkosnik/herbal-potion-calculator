
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
    
    // Nagłówek
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`FAKTURA ${transactionNumber}`, 105, 30, { align: 'center' });
    
    // Data wystawienia
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: pl });
    doc.text(`Wystawiono dnia: ${dateStr}`, 20, 50);
    
    // Dane sprzedawcy
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprzedawca:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    let yPos = 80;
    doc.text(companySettings?.company_name || 'Nazwa firmy', 20, yPos);
    yPos += 7;
    
    if (companySettings?.company_address) {
      doc.text(companySettings.company_address, 20, yPos);
      yPos += 7;
    }
    
    if (companySettings?.company_tax_id) {
      doc.text(`NIP: ${companySettings.company_tax_id}`, 20, yPos);
      yPos += 7;
    }
    
    if (companySettings?.company_phone) {
      doc.text(`Tel: ${companySettings.company_phone}`, 20, yPos);
      yPos += 7;
    }
    
    if (companySettings?.company_email) {
      doc.text(`Email: ${companySettings.company_email}`, 20, yPos);
      yPos += 7;
    }
    
    // Dane nabywcy
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Nabywca:', 110, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    yPos = 80;
    doc.text(transaction.buyer_name || 'Klient indywidualny', 110, yPos);
    yPos += 7;
    
    if (transaction.buyer_address) {
      doc.text(transaction.buyer_address, 110, yPos);
      yPos += 7;
    }
    
    if (transaction.buyer_tax_id) {
      doc.text(`NIP: ${transaction.buyer_tax_id}`, 110, yPos);
      yPos += 7;
    }
    
    if (transaction.buyer_phone) {
      doc.text(`Tel: ${transaction.buyer_phone}`, 110, yPos);
      yPos += 7;
    }
    
    if (transaction.buyer_email) {
      doc.text(`Email: ${transaction.buyer_email}`, 110, yPos);
      yPos += 7;
    }
    
    // Daty
    const tableStartY = Math.max(yPos + 20, 130);
    doc.text(`Data wystawienia: ${dateStr}`, 20, tableStartY);
    doc.text(`Data sprzedaży: ${dateStr}`, 20, tableStartY + 7);
    
    // Tabela z towarami
    const tableY = tableStartY + 20;
    
    // Nagłówki tabeli
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.rect(20, tableY, 170, 10);
    doc.text('Lp.', 25, tableY + 7);
    doc.text('Nazwa towaru/usługi', 35, tableY + 7);
    doc.text('Ilość', 90, tableY + 7);
    doc.text('Cena netto', 105, tableY + 7);
    doc.text('Wartość netto', 125, tableY + 7);
    doc.text('VAT', 150, tableY + 7);
    doc.text('Wartość brutto', 165, tableY + 7);
    
    // Obliczenia VAT (założenie: 23% VAT dla większości produktów kosmetycznych)
    const vatRate = 0.23;
    const netValue = transaction.total_price / (1 + vatRate);
    const vatValue = transaction.total_price - netValue;
    const grossValue = transaction.total_price;
    
    // Wiersz z towarem
    doc.setFont('helvetica', 'normal');
    const rowY = tableY + 10;
    doc.rect(20, rowY, 170, 10);
    doc.text('1', 25, rowY + 7);
    doc.text(transaction.composition_name.substring(0, 20), 35, rowY + 7);
    doc.text(`${transaction.quantity} szt.`, 90, rowY + 7);
    doc.text(`${(netValue / transaction.quantity).toFixed(2)} zł`, 105, rowY + 7);
    doc.text(`${netValue.toFixed(2)} zł`, 125, rowY + 7);
    doc.text('23%', 150, rowY + 7);
    doc.text(`${grossValue.toFixed(2)} zł`, 165, rowY + 7);
    
    // Podsumowanie
    const summaryY = rowY + 20;
    doc.setFont('helvetica', 'bold');
    doc.text('PODSUMOWANIE', 20, summaryY);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Wartość netto: ${netValue.toFixed(2)} zł`, 20, summaryY + 10);
    doc.text(`VAT 23%: ${vatValue.toFixed(2)} zł`, 20, summaryY + 17);
    doc.text(`Razem: ${grossValue.toFixed(2)} zł`, 20, summaryY + 24);
    
    // Sposób płatności
    doc.text('Sposób płatności: gotówka', 20, summaryY + 35);
    doc.text(`Termin płatności: ${dateStr}`, 20, summaryY + 42);
    
    // Dane bankowe (jeśli dostępne)
    if (companySettings?.bank_account) {
      doc.text('Dane do przelewu:', 20, summaryY + 55);
      doc.text(`Bank: ${companySettings.bank_name || 'Nazwa banku'}`, 20, summaryY + 62);
      doc.text(`Numer konta: ${companySettings.bank_account}`, 20, summaryY + 69);
    }
    
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
