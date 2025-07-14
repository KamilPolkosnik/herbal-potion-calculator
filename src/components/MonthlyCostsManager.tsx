import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Download, Filter } from 'lucide-react';
import { useMonthlyCosts, MonthlyCost } from '@/hooks/useMonthlyCosts';
import { useSummaryData } from '@/hooks/useSummaryData';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const MonthlyCostsManager: React.FC = () => {
  const { costs, loading, addCost, updateCost, deleteCost, fetchCosts } = useMonthlyCosts();
  const { refreshSummary } = useSummaryData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<MonthlyCost | null>(null);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: 'inne',
    cost_month: new Date().getMonth() + 1,
    cost_year: new Date().getFullYear()
  });

  const categories = [
    { value: 'materiały', label: 'Materiały' },
    { value: 'transport', label: 'Transport' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'administracja', label: 'Administracja' },
    { value: 'podatki', label: 'Podatki' },
    { value: 'ubezpieczenia', label: 'Ubezpieczenia' },
    { value: 'energia', label: 'Energia' },
    { value: 'inne', label: 'Inne' }
  ];

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

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();
    
    costs.forEach(cost => years.add(cost.cost_year));
    years.add(currentYear);
    
    return Array.from(years).sort((a, b) => b - a);
  }, [costs]);

  const filteredCosts = useMemo(() => {
    return costs.filter(cost => {
      if (filterYear && cost.cost_year !== filterYear) return false;
      if (filterMonth && cost.cost_month !== filterMonth) return false;
      return true;
    });
  }, [costs, filterYear, filterMonth]);

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const categoryTotals = filteredCosts.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      category: 'inne',
      cost_month: new Date().getMonth() + 1,
      cost_year: new Date().getFullYear()
    });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.amount) return;

    const success = await addCost({
      name: formData.name,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      cost_month: formData.cost_month,
      cost_year: formData.cost_year
    });

    if (success) {
      setIsAddDialogOpen(false);
      resetForm();
      await refreshSummary();
    }
  };

  const handleEdit = (cost: MonthlyCost) => {
    setEditingCost(cost);
    setFormData({
      name: cost.name,
      description: cost.description || '',
      amount: cost.amount.toString(),
      category: cost.category,
      cost_month: cost.cost_month,
      cost_year: cost.cost_year
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCost || !formData.name || !formData.amount) return;

    const success = await updateCost(editingCost.id, {
      name: formData.name,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      cost_month: formData.cost_month,
      cost_year: formData.cost_year
    });

    if (success) {
      setIsEditDialogOpen(false);
      setEditingCost(null);
      resetForm();
      await refreshSummary();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteCost(id);
    if (success) {
      await refreshSummary();
    }
  };

  const generateReport = () => {
    const reportData = {
      period: filterMonth 
        ? `${months.find(m => m.value === filterMonth)?.label} ${filterYear}`
        : `Rok ${filterYear}`,
      totalCosts,
      costs: filteredCosts,
      categoryTotals
    };

    const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Raport Kosztów - ${reportData.period}</title>
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
        .costs-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .costs-table th, .costs-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        .costs-table th { background-color: #f2f2f2; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">RAPORT KOSZTÓW</div>
        <div class="period">${reportData.period}</div>
    </div>
    
    <div class="summary">
        <h3>Podsumowanie</h3>
        <table class="summary-table">
            <tr>
                <td><strong>Łączne koszty:</strong></td>
                <td class="number-cell">${reportData.totalCosts.toFixed(2)} zł</td>
            </tr>
            <tr>
                <td><strong>Liczba pozycji:</strong></td>
                <td class="number-cell">${reportData.costs.length}</td>
            </tr>
        </table>
    </div>

    ${Object.keys(reportData.categoryTotals).length > 0 ? `
    <div class="category-summary">
        <h3>Koszty według kategorii</h3>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Kategoria</th>
                    <th>Kwota</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(reportData.categoryTotals).map(([category, amount]) => `
                <tr>
                    <td>${categories.find(c => c.value === category)?.label || category}</td>
                    <td class="number-cell">${amount.toFixed(2)} zł</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${reportData.costs.length > 0 ? `
    <div class="costs-section">
        <h3>Szczegółowe Koszty</h3>
        <table class="costs-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Nazwa</th>
                    <th>Opis</th>
                    <th>Kategoria</th>
                    <th>Kwota</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.costs.map(cost => `
                <tr>
                    <td>${cost.cost_month}/${cost.cost_year}</td>
                    <td>${cost.name}</td>
                    <td>${cost.description || '-'}</td>
                    <td>${categories.find(c => c.value === cost.category)?.label || cost.category}</td>
                    <td class="number-cell">${cost.amount.toFixed(2)} zł</td>
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

  const applyFilters = () => {
    fetchCosts(filterYear, filterMonth || undefined);
  };

  const clearFilters = () => {
    setFilterYear(new Date().getFullYear());
    setFilterMonth(new Date().getMonth() + 1);
    fetchCosts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-2 sm:p-4">
        <div className="text-xs sm:text-sm">Ładowanie kosztów...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden space-y-2 sm:space-y-4 p-1 sm:p-2">
      {/* Filters and Actions */}
      <Card className="w-full min-w-0">
        <CardHeader className="px-1 py-2 sm:px-3 sm:py-3">
          <CardTitle className="text-xs sm:text-sm break-words">Filtry i Działania</CardTitle>
        </CardHeader>
        <CardContent className="px-1 py-1 sm:px-3 sm:py-2">
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
              <div className="w-full min-w-0">
                <Label className="text-xs">Rok</Label>
                <Select value={filterYear.toString()} onValueChange={(value) => setFilterYear(parseInt(value))}>
                  <SelectTrigger className="w-full text-xs h-8">
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
              
              <div className="w-full min-w-0">
                <Label className="text-xs">Miesiąc</Label>
                <Select value={filterMonth?.toString() || 'all'} onValueChange={(value) => setFilterMonth(value === 'all' ? null : parseInt(value))}>
                  <SelectTrigger className="w-full text-xs h-8">
                    <SelectValue placeholder="Wszystkie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <Button onClick={applyFilters} className="w-full flex items-center justify-center gap-1 text-xs h-8">
                <Filter className="w-3 h-3 shrink-0" />
                <span>Filtruj</span>
              </Button>
              
              <Button onClick={clearFilters} variant="outline" className="w-full text-xs h-8">
                Wyczyść filtry
              </Button>
              
              <Button onClick={generateReport} className="w-full flex items-center justify-center gap-1 text-xs h-8">
                <Download className="w-3 h-3 shrink-0" />
                <span>Raport PDF</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2">
        <Card className="w-full min-w-0">
          <CardContent className="p-2 sm:p-4">
            <div className="text-center">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 break-words">Łączne Koszty</h3>
              <p className="text-sm sm:text-xl font-bold text-red-600 break-words">{totalCosts.toFixed(2)} zł</p>
              <p className="text-xs text-gray-500">{filteredCosts.length} pozycji</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full min-w-0">
          <CardContent className="p-2 sm:p-4">
            <div className="text-center">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 break-words">Okres</h3>
              <p className="text-xs sm:text-base font-semibold text-blue-600 break-words">
                {filterMonth 
                  ? `${months.find(m => m.value === filterMonth)?.label} ${filterYear}`
                  : `Rok ${filterYear}`}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full min-w-0">
          <CardContent className="p-2 sm:p-4">
            <div className="text-center">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 break-words">Średni Koszt</h3>
              <p className="text-xs sm:text-base font-semibold text-orange-600 break-words">
                {filteredCosts.length > 0 ? (totalCosts / filteredCosts.length).toFixed(2) : '0.00'} zł
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Cost Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full flex items-center justify-center gap-1 text-xs h-8">
            <Plus className="w-3 h-3 shrink-0" />
            <span>Dodaj Koszt</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Dodaj Nowy Koszt</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label htmlFor="name" className="text-xs">Nazwa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nazwa kosztu"
                className="text-xs h-8"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-xs">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opcjonalny opis"
                className="text-xs min-h-[60px]"
              />
            </div>
            
            <div>
              <Label htmlFor="amount" className="text-xs">Kwota *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="text-xs h-8"
              />
            </div>
            
            <div>
              <Label className="text-xs">Kategoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div>
                <Label className="text-xs">Miesiąc</Label>
                <Select value={formData.cost_month.toString()} onValueChange={(value) => setFormData({ ...formData, cost_month: parseInt(value) })}>
                  <SelectTrigger className="text-xs h-8">
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
                <Label className="text-xs">Rok</Label>
                <Input
                  type="number"
                  value={formData.cost_year}
                  onChange={(e) => setFormData({ ...formData, cost_year: parseInt(e.target.value) })}
                  className="text-xs h-8"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1 pt-2">
              <Button onClick={handleAdd} disabled={!formData.name || !formData.amount} className="w-full text-xs h-8">
                Dodaj Koszt
              </Button>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full text-xs h-8">
                Anuluj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Cost Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Edytuj Koszt</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label htmlFor="edit-name" className="text-xs">Nazwa *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nazwa kosztu"
                className="text-xs h-8"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description" className="text-xs">Opis</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opcjonalny opis"
                className="text-xs min-h-[60px]"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-amount" className="text-xs">Kwota *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="text-xs h-8"
              />
            </div>
            
            <div>
              <Label className="text-xs">Kategoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div>
                <Label className="text-xs">Miesiąc</Label>
                <Select value={formData.cost_month.toString()} onValueChange={(value) => setFormData({ ...formData, cost_month: parseInt(value) })}>
                  <SelectTrigger className="text-xs h-8">
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
                <Label className="text-xs">Rok</Label>
                <Input
                  type="number"
                  value={formData.cost_year}
                  onChange={(e) => setFormData({ ...formData, cost_year: parseInt(e.target.value) })}
                  className="text-xs h-8"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1 pt-2">
              <Button onClick={handleUpdate} disabled={!formData.name || !formData.amount} className="text-xs h-8">
                Zapisz Zmiany
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-xs h-8">
                Anuluj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Costs Table */}
      <Card className="w-full min-w-0">
        <CardHeader className="px-1 py-2 sm:px-3 sm:py-3">
          <CardTitle className="text-xs sm:text-sm break-words">Lista Kosztów</CardTitle>
        </CardHeader>
        <CardContent className="px-1 py-1 sm:px-3 sm:py-2">
          {filteredCosts.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium px-1 w-[80px]">Nazwa</TableHead>
                      <TableHead className="text-xs font-medium px-1 hidden sm:table-cell w-[80px]">Opis</TableHead>
                      <TableHead className="text-xs font-medium px-1 w-[60px]">Kategoria</TableHead>
                      <TableHead className="text-xs font-medium px-1 hidden md:table-cell w-[60px]">Okres</TableHead>
                      <TableHead className="text-xs font-medium px-1 text-right w-[50px]">Kwota</TableHead>
                      <TableHead className="text-xs font-medium px-1 hidden lg:table-cell w-[60px]">Utworzono</TableHead>
                      <TableHead className="text-xs font-medium px-1 w-[50px]">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium text-xs px-1">
                          <div className="max-w-[70px] truncate break-words">
                            {cost.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs px-1 hidden sm:table-cell">
                          <div className="max-w-[70px] truncate break-words">
                            {cost.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs px-1">
                          <span className="px-1 py-0.5 bg-gray-100 rounded text-xs break-words">
                            {categories.find(c => c.value === cost.category)?.label || cost.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs px-1 hidden md:table-cell">
                          {months.find(m => m.value === cost.cost_month)?.label} {cost.cost_year}
                        </TableCell>
                        <TableCell className="text-xs font-semibold px-1 text-right">
                          {cost.amount.toFixed(2)} zł
                        </TableCell>
                        <TableCell className="text-xs px-1 hidden lg:table-cell">
                          {format(new Date(cost.created_at), 'dd.MM.yyyy', { locale: pl })}
                        </TableCell>
                        <TableCell className="px-1">
                          <div className="flex flex-col gap-0.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(cost)}
                              className="text-xs px-1 py-0.5 h-5 w-full"
                            >
                              <Edit className="w-2.5 h-2.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-xs px-1 py-0.5 h-5 w-full">
                                  <Trash2 className="w-2.5 h-2.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[95vw] max-w-sm mx-auto">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-sm">Potwierdź usunięcie</AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs break-words">
                                    Czy na pewno chcesz usunąć koszt "{cost.name}"? Ta operacja nie może być cofnięta.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex flex-col gap-1">
                                  <AlertDialogCancel className="w-full text-xs h-8">Anuluj</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(cost.id)} className="w-full text-xs h-8">
                                    Usuń
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-xs break-words">
              Brak kosztów w wybranym okresie
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyCostsManager;
