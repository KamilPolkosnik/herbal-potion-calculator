import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Undo2, ShoppingCart, Calendar, Trash2, Loader2 } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import InvoiceGenerator from './InvoiceGenerator';
import CorrectionInvoiceGenerator from './CorrectionInvoiceGenerator';
import ReceiptGenerator from './ReceiptGenerator';

interface TransactionsListProps {
  onDataChange?: () => void | Promise<void>;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ onDataChange }) => {
  const { transactions, loading, processing, reverseTransaction, deleteTransaction, refreshTransactions } = useSales();
  const { settings: companySettings } = useCompanySettings();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const [operatingTransactions, setOperatingTransactions] = useState<Set<string>>(new Set());

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

  // Generate available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const year = new Date(transaction.created_at).getFullYear();
      years.add(year);
    });
    years.add(currentDate.getFullYear()); // Add current year if no transactions
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentDate.getFullYear()]);

  const handleReverse = async (transactionId: string, compositionName: string) => {
    if (operatingTransactions.has(transactionId) || processing) {
      return;
    }

    try {
      setOperatingTransactions(prev => new Set(prev).add(transactionId));
      
      await reverseTransaction(transactionId);
      
      toast({
        title: "Sukces",
        description: `Transakcja dla ${compositionName} została cofnięta`,
      });

      if (onDataChange) {
        await onDataChange();
      }
      
      // Odśwież zakładkę podsumowanie poprzez emitowanie zdarzenia
      window.dispatchEvent(new CustomEvent('refreshSummary'));
      // Odśwież statystyki sprzedaży
      window.dispatchEvent(new CustomEvent('refreshSalesStatistics'));
    } catch (error) {
      console.error('Error reversing transaction:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się cofnąć transakcji",
        variant: "destructive",
      });
    } finally {
      setOperatingTransactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  const handleDelete = async (transactionId: string, compositionName: string) => {
    if (operatingTransactions.has(transactionId) || processing) {
      return;
    }

    try {
      setOperatingTransactions(prev => new Set(prev).add(transactionId));
      
      await deleteTransaction(transactionId);
      
      toast({
        title: "Sukces",
        description: `Transakcja dla ${compositionName} została usunięta`,
      });

      if (onDataChange) {
        await onDataChange();
      }
      
      // Odśwież zakładkę podsumowanie poprzez emitowanie zdarzenia
      window.dispatchEvent(new CustomEvent('refreshSummary'));
      // Odśwież statystyki sprzedaży
      window.dispatchEvent(new CustomEvent('refreshSalesStatistics'));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć transakcji",
        variant: "destructive",
      });
    } finally {
      setOperatingTransactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by selected year and month
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.created_at);
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth() + 1;
      
      return transactionYear === selectedYear && transactionMonth === selectedMonth;
    });

    // Sort by creation date (newest first for display)
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [transactions, selectedYear, selectedMonth]);

  // Grupuj transakcje z wieloma pozycjami
  const groupedTransactions = useMemo(() => {
    const grouped: Array<{
      id: string;
      transaction: any;
      isMultiItem: boolean;
      items: Array<{ name: string; quantity: number; price: number }>;
      mainItem: string;
    }> = [];

    filteredTransactions.forEach(transaction => {
      const isMultiItem = transaction.composition_name.includes(',');
      
      if (isMultiItem) {
        // Parse composition names to handle multiple items
        const compositionParts = transaction.composition_name.split(', ');
        const items = compositionParts.map(part => {
          const matchWithPrice = part.match(/^(\d+)x (.+) \[(\d+(?:\.\d{2})?)zł\]$/);
          if (matchWithPrice) {
            return {
              name: matchWithPrice[2],
              quantity: parseInt(matchWithPrice[1]),
              price: parseFloat(matchWithPrice[3])
            };
          }
          
          const match = part.match(/^(\d+)x (.+)$/);
          if (match) {
            return {
              name: match[2],
              quantity: parseInt(match[1]),
              price: transaction.unit_price
            };
          }
          
          return {
            name: part,
            quantity: 1,
            price: transaction.unit_price
          };
        });

        grouped.push({
          id: transaction.id,
          transaction,
          isMultiItem: true,
          items,
          mainItem: `${items[0]?.name || 'Zestaw'} + ${items.length - 1} inne`
        });
      } else {
        grouped.push({
          id: transaction.id,
          transaction,
          isMultiItem: false,
          items: [{
            name: transaction.composition_name,
            quantity: transaction.quantity,
            price: transaction.unit_price
          }],
          mainItem: transaction.composition_name
        });
      }
    });

    return grouped;
  }, [filteredTransactions]);

  const toggleExpanded = (transactionId: string) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth() + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-2 sm:p-4">
        <div className="text-xs sm:text-sm">Ładowanie transakcji...</div>
      </div>
    );
  }

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardHeader className="px-1 py-2 sm:px-3 sm:py-3">
        <CardTitle className="flex items-center gap-1 text-xs sm:text-sm break-words">
          <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
          <span className="break-words">Historia Transakcji</span>
          {processing && <Loader2 className="w-3 h-3 animate-spin" />}
        </CardTitle>
        
        {/* Month and Year Filter */}
        <div className="flex flex-col gap-1 sm:gap-2 items-start w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full">
            <div className="w-full min-w-0">
              <Label htmlFor="yearSelect" className="text-xs break-words">Rok:</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
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
              <Label htmlFor="monthSelect" className="text-xs break-words">Miesiąc:</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-full text-xs h-8">
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
          </div>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full text-xs h-8"
          >
            <Calendar className="w-3 h-3 mr-1 shrink-0" />
            <span className="break-words">Wyczyść filtry</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-1 py-1 sm:px-2 sm:py-2">
        {groupedTransactions.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-xs break-words">
            Brak transakcji w wybranym miesiącu
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <ScrollArea className="h-48 sm:h-64 w-full">
              <div className="min-w-[350px]">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium px-0.5 w-[40px]">Nr</TableHead>
                      <TableHead className="text-xs font-medium px-0.5 hidden sm:table-cell w-[60px]">Data</TableHead>
                      <TableHead className="text-xs font-medium px-0.5 min-w-0 w-[80px]">Zestaw</TableHead>
                      <TableHead className="text-xs font-medium px-0.5 hidden md:table-cell w-[60px]">Kupujący</TableHead>
                      <TableHead className="text-xs font-medium px-0.5 w-[30px]">Ilość</TableHead>
                      <TableHead className="text-xs font-medium px-0.5 hidden sm:table-cell w-[40px]">Cena jedn.</TableHead>
                      <TableHead className="text-xs font-medium px-0.5 w-[40px]">Łącznie</TableHead>
                      <TableHead className="text-xs font-medium px-0.5 hidden lg:table-cell w-[40px]">Status</TableHead>
                      <TableHead className="text-xs font-medium px-0.5 w-[50px]">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedTransactions.map((group) => (
                      <React.Fragment key={group.id}>
                        <TableRow>
                          <TableCell className="font-mono text-xs px-0.5">
                            <span className="block w-full truncate text-xs">
                              {group.transaction.invoice_number.toString().padStart(9, '0')}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-0.5 hidden sm:table-cell">
                            <span className="block w-full truncate text-xs">
                              {format(new Date(group.transaction.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-0.5 min-w-0">
                            <div className="flex items-center gap-0.5 min-w-0 w-full">
                              <span className="truncate text-xs break-words flex-1 min-w-0">
                                {group.mainItem}
                              </span>
                              {group.isMultiItem && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpanded(group.id)}
                                  className="h-3 w-3 p-0 shrink-0"
                                >
                                  {expandedTransactions.has(group.id) ? (
                                    <ChevronDown className="h-2 w-2" />
                                  ) : (
                                    <ChevronRight className="h-2 w-2" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs px-0.5 hidden md:table-cell">
                            <span className="break-words block w-full truncate text-xs">
                              {group.transaction.buyer_name || 'Klient indywidualny'}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-0.5">
                            <span className="block w-full truncate text-xs">
                              {group.transaction.quantity} szt.
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-0.5 hidden sm:table-cell">
                            <span className="block w-full truncate text-xs">
                              {group.transaction.unit_price.toFixed(2)} zł
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium px-0.5">
                            <span className="block w-full truncate text-xs">
                              {group.transaction.total_price.toFixed(2)} zł
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell px-0.5">
                            {group.transaction.is_reversed ? (
                              <span className="text-red-600 font-medium text-xs block w-full truncate">Cofnięta</span>
                            ) : (
                              <span className="text-green-600 font-medium text-xs block w-full truncate">Aktywna</span>
                            )}
                          </TableCell>
                          <TableCell className="px-0.5 w-[50px]">
                            <div className="flex flex-col gap-0.5 w-full min-w-0">
                              {!group.transaction.is_reversed ? (
                                // Przyciski dla aktywnych transakcji
                                <>
                                  {companySettings?.is_vat_registered ? (
                                    <InvoiceGenerator 
                                      transaction={group.transaction}
                                      companySettings={companySettings}
                                      transactionNumber={group.transaction.invoice_number.toString().padStart(9, '0')}
                                    />
                                  ) : (
                                    <ReceiptGenerator 
                                      transaction={group.transaction}
                                      companySettings={companySettings}
                                    />
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReverse(group.transaction.id, group.transaction.composition_name)}
                                    disabled={operatingTransactions.has(group.transaction.id) || processing}
                                    className="text-xs px-0.5 py-0.5 h-5 w-full min-w-0"
                                  >
                                    {operatingTransactions.has(group.transaction.id) ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                      <>
                                        <Undo2 className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                                        <span className="truncate text-xs">Cofnij</span>
                                      </>
                                    )}
                                  </Button>
                                </>
                              ) : (
                                // Przyciski dla cofniętych transakcji
                                <>
                                  {companySettings?.is_vat_registered && (
                                    <CorrectionInvoiceGenerator 
                                      transaction={group.transaction}
                                      companySettings={companySettings}
                                      originalInvoiceNumber={group.transaction.invoice_number.toString().padStart(9, '0')}
                                    />
                                  )}
                                  {user?.role === 'admin' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDelete(group.transaction.id, group.transaction.composition_name)}
                                      disabled={operatingTransactions.has(group.transaction.id) || processing}
                                      className="text-xs px-0.5 py-0.5 h-5 w-full min-w-0"
                                    >
                                      {operatingTransactions.has(group.transaction.id) ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                      ) : (
                                        <>
                                          <Trash2 className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                                          <span className="truncate text-xs">Usuń</span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {group.isMultiItem && expandedTransactions.has(group.id) && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-gray-50 p-1 sm:p-2">
                              <div className="text-xs w-full overflow-x-auto">
                                <p className="font-medium mb-1">Szczegóły pozycji:</p>
                                <div className="space-y-0.5 w-full">
                                  {group.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center gap-1 w-full min-w-0">
                                      <span className="truncate break-words min-w-0 flex-1 text-xs">{item.name}</span>
                                      <span className="whitespace-nowrap shrink-0 text-xs">
                                        {item.quantity} szt. × {item.price.toFixed(2)} zł
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
