import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Trash2, Filter, Eye } from 'lucide-react';
import { useCostInvoices } from '@/hooks/useCostInvoices';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

const CostInvoicesManager = () => {
  const { invoices, loading, uploadInvoice, downloadInvoice, previewInvoice, deleteInvoice } = useCostInvoices();
  const isMobile = useIsMobile();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Filtry - ustaw domyślnie aktualny miesiąc i rok
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState<string>((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState<string>(currentDate.getFullYear().toString());

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
    <div className="space-y-4 p-2 md:p-6">
      {/* Header z przyciskiem dodawania */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Faktury Kosztowe</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm">
              <Upload className="w-4 h-4 mr-2" />
              Dodaj Fakturę
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-2">
            <DialogHeader>
              <DialogTitle>Dodaj Nową Fakturę</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file" className="text-sm">Plik faktury</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileSelect}
                  className="text-sm"
                />
                {selectedFile && (
                  <p className="text-xs text-gray-600 mt-1">
                    Wybrany plik: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month" className="text-sm">Miesiąc</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="text-sm">
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
                  <Label htmlFor="year" className="text-sm">Rok</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="text-sm">
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
                <Label htmlFor="amount" className="text-sm">Kwota (opcjonalne)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm">Opis (opcjonalny)</Label>
                <Textarea
                  id="description"
                  placeholder="Opis faktury..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-sm min-h-[80px]"
                />
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile}
                className="w-full text-sm"
              >
                Prześlij Fakturę
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-4 h-4" />
            Filtry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Miesiąc</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="text-sm">
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
              <Label className="text-sm">Rok</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="text-sm">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Lista Faktur ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {loading ? (
            <div className="text-center py-8 text-sm">Ładowanie faktur...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Brak faktur do wyświetlenia
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm px-2 md:px-4">Nazwa pliku</TableHead>
                    {!isMobile && <TableHead className="text-xs md:text-sm">Typ</TableHead>}
                    <TableHead className="text-xs md:text-sm px-2 md:px-4">Miesiąc/Rok</TableHead>
                    {!isMobile && <TableHead className="text-xs md:text-sm">Kwota</TableHead>}
                    {!isMobile && <TableHead className="text-xs md:text-sm">Rozmiar</TableHead>}
                    {!isMobile && <TableHead className="text-xs md:text-sm">Data dodania</TableHead>}
                    <TableHead className="text-xs md:text-sm px-2 md:px-4">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium px-2 md:px-4">
                        <div className="text-xs md:text-sm truncate max-w-[120px] md:max-w-none">
                          {invoice.original_name}
                        </div>
                        {invoice.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-[120px] md:max-w-none">
                            {invoice.description}
                          </div>
                        )}
                        {isMobile && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {getFileTypeBadge(invoice.mime_type)}
                            {invoice.amount && (
                              <Badge variant="outline" className="text-xs">
                                {invoice.amount.toFixed(2)} zł
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {getFileTypeBadge(invoice.mime_type)}
                        </TableCell>
                      )}
                      <TableCell className="px-2 md:px-4">
                        <div className="text-xs md:text-sm">
                          {months.find(m => m.value === invoice.invoice_month)?.label} {invoice.invoice_year}
                        </div>
                      </TableCell>
                      {!isMobile && (
                        <>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.amount ? `${invoice.amount.toFixed(2)} zł` : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatFileSize(invoice.file_size)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(invoice.created_at).toLocaleDateString('pl-PL')}
                            </div>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="px-2 md:px-4">
                        <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => previewInvoice(invoice)}
                            className="text-xs p-1 md:p-2"
                          >
                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
                            {!isMobile && <span className="ml-1">Podgląd</span>}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadInvoice(invoice)}
                            className="text-xs p-1 md:p-2"
                          >
                            <Download className="w-3 h-3 md:w-4 md:h-4" />
                            {!isMobile && <span className="ml-1">Pobierz</span>}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteInvoice(invoice)}
                            className="text-xs p-1 md:p-2"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            {!isMobile && <span className="ml-1">Usuń</span>}
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
