
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DollarSign, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { useMonthlyCosts, MonthlyCost } from '@/hooks/useMonthlyCosts';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface MonthlyCostsManagerProps {
  onDataChange?: () => void;
}

const MonthlyCostsManager: React.FC<MonthlyCostsManagerProps> = ({ onDataChange }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [newCost, setNewCost] = useState({
    name: '',
    description: '',
    amount: '',
    category: 'Koszty stałe',
    month: currentMonth.toString(),
    year: currentYear.toString(),
  });
  const [editingCost, setEditingCost] = useState<MonthlyCost | null>(null);

  const { costs, loading, fetchCosts, addCost, updateCost, deleteCost } = useMonthlyCosts();

  useEffect(() => {
    fetchCosts(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchCosts]);

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await addCost({
      name: newCost.name,
      description: newCost.description,
      amount: parseFloat(newCost.amount),
      category: newCost.category,
      cost_month: parseInt(newCost.month),
      cost_year: parseInt(newCost.year),
    });

    if (success) {
      setNewCost({
        name: '',
        description: '',
        amount: '',
        category: 'Koszty stałe',
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString(),
      });
      setIsAddDialogOpen(false);
      onDataChange?.();
    }
  };

  const handleUpdateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost) return;
    
    const success = await updateCost(editingCost.id, {
      name: editingCost.name,
      description: editingCost.description,
      amount: editingCost.amount,
      category: editingCost.category,
      cost_month: editingCost.cost_month,
      cost_year: editingCost.cost_year,
    });

    if (success) {
      setEditingCost(null);
      setIsEditDialogOpen(false);
      onDataChange?.();
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten koszt?')) {
      const success = await deleteCost(id);
      if (success) {
        onDataChange?.();
      }
    }
  };

  if (loading) {
    return <div className="text-center p-4">Ładowanie kosztów...</div>;
  }

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 mr-1" />
          Koszty Miesięczne
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[120px] text-xs">
              <SelectValue placeholder="Wybierz miesiąc" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {format(new Date(2000, month - 1, 1), 'MMMM', { locale: pl })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[80px] text-xs">
              <SelectValue placeholder="Wybierz rok" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <Plus className="w-3 h-3 mr-2" />
                Dodaj Koszt
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Dodaj nowy koszt</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCost} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nazwa
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    value={newCost.name}
                    onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Opis
                  </Label>
                  <Textarea
                    id="description"
                    value={newCost.description}
                    onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Kwota
                  </Label>
                  <Input
                    type="number"
                    id="amount"
                    value={newCost.amount}
                    onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Kategoria
                  </Label>
                  <Select onValueChange={(value) => setNewCost({ ...newCost, category: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Koszty stałe">Koszty stałe</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Inne">Inne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="month" className="text-right">
                    Miesiąc
                  </Label>
                  <Select onValueChange={(value) => setNewCost({ ...newCost, month: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Wybierz miesiąc" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {format(new Date(2000, month - 1, 1), 'MMMM', { locale: pl })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Rok
                  </Label>
                  <Select onValueChange={(value) => setNewCost({ ...newCost, year: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Wybierz rok" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Dodaj koszt</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Nazwa</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead className="text-right">Kwota</TableHead>
                <TableHead className="text-center">Miesiąc/Rok</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">{cost.name}</TableCell>
                  <TableCell>{cost.description}</TableCell>
                  <TableCell>{cost.category}</TableCell>
                  <TableCell className="text-right">{cost.amount.toFixed(2)} zł</TableCell>
                  <TableCell className="text-center">
                    {format(new Date(cost.cost_year, cost.cost_month - 1, 1), 'MMMM/yyyy', { locale: pl })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingCost(cost)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edytuj
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Edytuj koszt</DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (editingCost) {
                                handleUpdateCost(e);
                              }
                            }}
                            className="grid gap-4 py-4"
                          >
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                Nazwa
                              </Label>
                              <Input
                                type="text"
                                id="name"
                                value={editingCost?.name || ''}
                                onChange={(e) =>
                                  setEditingCost({ ...editingCost!, name: e.target.value })
                                }
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="description" className="text-right">
                                Opis
                              </Label>
                              <Textarea
                                id="description"
                                value={editingCost?.description || ''}
                                onChange={(e) =>
                                  setEditingCost({ ...editingCost!, description: e.target.value })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="amount" className="text-right">
                                Kwota
                              </Label>
                              <Input
                                type="number"
                                id="amount"
                                value={editingCost?.amount || ''}
                                onChange={(e) =>
                                  setEditingCost({
                                    ...editingCost!,
                                    amount: parseFloat(e.target.value),
                                  })
                                }
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="category" className="text-right">
                                Kategoria
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setEditingCost({ ...editingCost!, category: value })
                                }
                                defaultValue={editingCost?.category}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Wybierz kategorię" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Koszty stałe">Koszty stałe</SelectItem>
                                  <SelectItem value="Media">Media</SelectItem>
                                  <SelectItem value="Marketing">Marketing</SelectItem>
                                  <SelectItem value="Inne">Inne</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="month" className="text-right">
                                Miesiąc
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setEditingCost({ ...editingCost!, cost_month: parseInt(value) })
                                }
                                defaultValue={editingCost?.cost_month.toString()}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Wybierz miesiąc" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <SelectItem key={month} value={month.toString()}>
                                      {format(new Date(2000, month - 1, 1), 'MMMM', { locale: pl })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="year" className="text-right">
                                Rok
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setEditingCost({ ...editingCost!, cost_year: parseInt(value) })
                                }
                                defaultValue={editingCost?.cost_year.toString()}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Wybierz rok" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="submit">Zapisz zmiany</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCost(cost.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Usuń
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MonthlyCostsManager;
