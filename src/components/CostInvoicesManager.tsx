
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Trash2, Filter } from 'lucide-react';
import { useCostInvoices } from '@/hooks/useCostInvoices';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const CostInvoicesManager = () => {
  const { invoices, loading, uploadInvoice, downloadInvoice, deleteInvoice } = useCostInvoices();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Filtry
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

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
    { value: 12, label: 'Grudzień' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadInvoice(
      selectedFile,
      selectedMonth,
      selectedYear,
      description || undefined,
      amount ? parseFloat(amount) : undefined
    );

    // Reset form
    setSelectedFile(null);
    setDescription('');
    setAmount('');
    setIsUploadDialogOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeBadge = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <Badge variant="destructive">PDF</Badge>;
    if (mimeType.includes('image')) return <Badge variant="secondary">Obraz</Badge>;
    return <Badge variant="outline">Plik</Badge>;
  };

  // Filtruj faktury
  const filteredInvoices = invoices.filter(invoice => {
    const monthMatch = filterMonth === 'all' || invoice.invoice_month.toString() === filterMonth;
    const yearMatch = filterYear === 'all' || invoice.invoice_year.toString() === filterYear;
    return monthMatch && yearMatch;
  });

  // Pobierz unikalne lata z faktur
  const availableYears = [...new Set(invoices.map(inv => inv.invoice_year))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header z przyciskiem dodawania */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Faktury Kosztowe</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="w-4 h-4 mr-2" />
              Dodaj Fakturę
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dodaj Nową Fakturę</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Plik faktury</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Wybrany plik: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">Miesiąc</Label>
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

                <div>
                  <Label htmlFor="year">Rok</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Kwota (opcjonalne)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Opis (opcjonalny)</Label>
                <Textarea
                  id="description"
                  placeholder="Opis faktury..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile}
                className="w-full"
              >
                Prześlij Fakturę
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Miesiąc</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie miesiące</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rok</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie lata</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista faktur */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista Faktur ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Ładowanie faktur...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Brak faktur do wyświetlenia
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa pliku</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Miesiąc/Rok</TableHead>
                    <TableHead>Kwota</TableHead>
                    <TableHead>Rozmiar</TableHead>
                    <TableHead>Data dodania</TableHead>
                    <TableHead>Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.original_name}
                        {invoice.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {invoice.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getFileTypeBadge(invoice.mime_type)}
                      </TableCell>
                      <TableCell>
                        {months.find(m => m.value === invoice.invoice_month)?.label} {invoice.invoice_year}
                      </TableCell>
                      <TableCell>
                        {invoice.amount ? `${invoice.amount.toFixed(2)} zł` : '-'}
                      </TableCell>
                      <TableCell>{formatFileSize(invoice.file_size)}</TableCell>
                      <TableCell>
                        {new Date(invoice.created_at).toLocaleDateString('pl-PL')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadInvoice(invoice)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteInvoice(invoice)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CostInvoicesManager;
