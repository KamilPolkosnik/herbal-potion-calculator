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
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const MonthlyCostsManager: React.FC = () => {
  const { costs, loading, addCost, updateCost, deleteCost, fetchCosts } = useMonthlyCosts();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<MonthlyCost | null>(null);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(null);

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

  // Generate available years from costs
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();
    
    costs.forEach(cost => years.add(cost.cost_year));
    years.add(currentYear);
    
    return Array.from(years).sort((a, b) => b - a);
  }, [costs]);

  // Filter costs based on selected year/month
  const filteredCosts = useMemo(() => {
    return costs.filter(cost => {
      if (filterYear && cost.cost_year !== filterYear) return false;
      if (filterMonth && cost.cost_month !== filterMonth) return false;
      return true;
    });
  }, [costs, filterYear, filterMonth]);

  // Calculate totals
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
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCost(id);
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
    setFilterMonth(null);
    fetchCosts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie kosztów...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtry i Działania</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label>Rok</Label>
              <Select value={filterYear.toString()} onValueChange={(value) => setFilterYear(parseInt(value))}>
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
            
            <div>
              <Label>Miesiąc</Label>
              <Select value={filterMonth?.toString() || 'all'} onValueChange={(value) => setFilterMonth(value === 'all' ? null : parseInt(value))}>
                <SelectTrigger>
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
            
            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtruj
            </Button>
            
            <Button onClick={clearFilters} variant="outline">
              Wyczyść filtry
            </Button>
            
            <Button onClick={generateReport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Raport PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700">Łączne Koszty</h3>
              <p className="text-3xl font-bold text-red-600">{totalCosts.toFixed(2)} zł</p>
              <p className="text-sm text-gray-500">{filteredCosts.length} pozycji</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700">Okres</h3>
              <p className="text-xl font-semibold text-blue-600">
                {filterMonth 
                  ? `${months.find(m => m.value === filterMonth)?.label} ${filterYear}`
                  : `Rok ${filterYear}`}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700">Średni Koszt</h3>
              <p className="text-xl font-semibold text-orange-600">
                {filteredCosts.length > 0 ? (totalCosts / filteredCosts.length).toFixed(2) : '0.00'} zł
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Cost Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Dodaj Koszt
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj Nowy Koszt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nazwa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nazwa kosztu"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opcjonalny opis"
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Kwota *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label>Kategoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Miesiąc</Label>
                <Select value={formData.cost_month.toString()} onValueChange={(value) => setFormData({ ...formData, cost_month: parseInt(value) })}>
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
                <Label>Rok</Label>
                <Input
                  type="number"
                  value={formData.cost_year}
                  onChange={(e) => setFormData({ ...formData, cost_year: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAdd} disabled={!formData.name || !formData.amount}>
                Dodaj Koszt
              </Button>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Anuluj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Cost Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj Koszt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nazwa *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nazwa kosztu"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Opis</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opcjonalny opis"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-amount">Kwota *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label>Kategoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Miesiąc</Label>
                <Select value={formData.cost_month.toString()} onValueChange={(value) => setFormData({ ...formData, cost_month: parseInt(value) })}>
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
                <Label>Rok</Label>
                <Input
                  type="number"
                  value={formData.cost_year}
                  onChange={(e) => setFormData({ ...formData, cost_year: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdate} disabled={!formData.name || !formData.amount}>
                Zapisz Zmiany
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Anuluj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Kosztów</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Opis</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Okres</TableHead>
                  <TableHead className="text-right">Kwota</TableHead>
                  <TableHead>Utworzono</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.name}</TableCell>
                    <TableCell>{cost.description || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {categories.find(c => c.value === cost.category)?.label || cost.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {months.find(m => m.value === cost.cost_month)?.label} {cost.cost_year}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {cost.amount.toFixed(2)} zł
                    </TableCell>
                    <TableCell>
                      {format(new Date(cost.created_at), 'dd.MM.yyyy', { locale: pl })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cost)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Potwierdź usunięcie</AlertDialogTitle>
                              <AlertDialogDescription>
                                Czy na pewno chcesz usunąć koszt "{cost.name}"? Ta operacja nie może być cofnięta.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anuluj</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cost.id)}>
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              Brak kosztów w wybranym okresie
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyCostsManager;
