import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface TransactionsListProps {
  onDataChange?: () => void | Promise<void>;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ onDataChange }) => {
  const { transactions, loading, processing, reverseTransaction, deleteTransaction, refreshTransactions } = useSales();
  const { settings: companySettings } = useCompanySettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const [operatingTransactions, setOperatingTransactions] = useState<Set<string>>(new Set());

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

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.created_at) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.created_at) <= toDate);
    }

    // Sort by creation date (newest first for display)
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [transactions, dateFrom, dateTo]);

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
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4 sm:p-8">
        <div className="text-base sm:text-lg">Ładowanie transakcji...</div>
      </div>
    );
  }

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardHeader className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg break-words">
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="break-words">Historia Transakcji</span>
          {processing && <Loader2 className="w-4 h-4 animate-spin" />}
        </CardTitle>
        
        {/* Date Range Filter */}
        <div className="flex flex-col gap-2 sm:gap-3 items-start w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            <div className="w-full min-w-0">
              <Label htmlFor="dateFrom" className="text-xs sm:text-sm break-words">Data Od:</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full text-xs sm:text-sm"
              />
            </div>
            <div className="w-full min-w-0">
              <Label htmlFor="dateTo" className="text-xs sm:text-sm break-words">Data Do:</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full text-xs sm:text-sm"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
            <span className="break-words">Wyczyść filtry</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-1 py-2 sm:px-2 sm:py-3 md:px-4 md:py-4">
        {groupedTransactions.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm md:text-base break-words">
            {dateFrom || dateTo ? 'Brak transakcji w wybranym zakresie dat' : 'Brak transakcji do wyświetlenia'}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <ScrollArea className="h-64 sm:h-80 md:h-96 w-full">
              <div className="min-w-[320px]">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium px-1 w-16">Nr</TableHead>
                      <TableHead className="text-xs font-medium px-1 hidden sm:table-cell w-20">Data</TableHead>
                      <TableHead className="text-xs font-medium px-1 min-w-0">Zestaw</TableHead>
                      <TableHead className="text-xs font-medium px-1 hidden md:table-cell w-24">Kupujący</TableHead>
                      <TableHead className="text-xs font-medium px-1 w-12">Ilość</TableHead>
                      <TableHead className="text-xs font-medium px-1 hidden sm:table-cell w-16">Cena jedn.</TableHead>
                      <TableHead className="text-xs font-medium px-1 w-16">Łącznie</TableHead>
                      <TableHead className="text-xs font-medium px-1 hidden lg:table-cell w-16">Status</TableHead>
                      <TableHead className="text-xs font-medium px-1 w-20">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedTransactions.map((group) => (
                      <React.Fragment key={group.id}>
                        <TableRow>
                          <TableCell className="font-mono text-xs px-1">
                            <span className="block w-full truncate">
                              {group.transaction.invoice_number.toString().padStart(9, '0')}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-1 hidden sm:table-cell">
                            <span className="block w-full truncate">
                              {format(new Date(group.transaction.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-1 min-w-0">
                            <div className="flex items-center gap-1 min-w-0 w-full">
                              <span className="truncate text-xs break-words flex-1 min-w-0">
                                {group.mainItem}
                              </span>
                              {group.isMultiItem && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpanded(group.id)}
                                  className="h-4 w-4 p-0 shrink-0"
                                >
                                  {expandedTransactions.has(group.id) ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs px-1 hidden md:table-cell">
                            <span className="break-words block w-full truncate">
                              {group.transaction.buyer_name || 'Klient indywidualny'}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-1">
                            <span className="block w-full truncate">
                              {group.transaction.quantity} szt.
                            </span>
                          </TableCell>
                          <TableCell className="text-xs px-1 hidden sm:table-cell">
                            <span className="block w-full truncate">
                              {group.transaction.unit_price.toFixed(2)} zł
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium px-1">
                            <span className="block w-full truncate">
                              {group.transaction.total_price.toFixed(2)} zł
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell px-1">
                            {group.transaction.is_reversed ? (
                              <span className="text-red-600 font-medium text-xs block w-full truncate">Cofnięta</span>
                            ) : (
                              <span className="text-green-600 font-medium text-xs block w-full truncate">Aktywna</span>
                            )}
                          </TableCell>
                          <TableCell className="px-1 w-20">
                            <div className="flex flex-col gap-1 w-full min-w-0">
                              {!group.transaction.is_reversed ? (
                                // Przyciski dla aktywnych transakcji
                                <>
                                  <InvoiceGenerator 
                                    transaction={group.transaction}
                                    companySettings={companySettings}
                                    transactionNumber={group.transaction.invoice_number.toString().padStart(9, '0')}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReverse(group.transaction.id, group.transaction.composition_name)}
                                    disabled={operatingTransactions.has(group.transaction.id) || processing}
                                    className="text-xs px-1 py-1 h-6 w-full min-w-0"
                                  >
                                    {operatingTransactions.has(group.transaction.id) ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Undo2 className="w-3 h-3 mr-1 shrink-0" />
                                        <span className="truncate">Cofnij</span>
                                      </>
                                    )}
                                  </Button>
                                </>
                              ) : (
                                // Przyciski dla cofniętych transakcji
                                <>
                                  <CorrectionInvoiceGenerator 
                                    transaction={group.transaction}
                                    companySettings={companySettings}
                                    originalInvoiceNumber={group.transaction.invoice_number.toString().padStart(9, '0')}
                                  />
                                  {user?.role === 'admin' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDelete(group.transaction.id, group.transaction.composition_name)}
                                      disabled={operatingTransactions.has(group.transaction.id) || processing}
                                      className="text-xs px-1 py-1 h-6 w-full min-w-0"
                                    >
                                      {operatingTransactions.has(group.transaction.id) ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Trash2 className="w-3 h-3 mr-1 shrink-0" />
                                          <span className="truncate">Usuń</span>
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
                            <TableCell colSpan={9} className="bg-gray-50 p-2 sm:p-4">
                              <div className="text-xs sm:text-sm w-full overflow-x-auto">
                                <p className="font-medium mb-1 sm:mb-2">Szczegóły pozycji:</p>
                                <div className="space-y-1 w-full">
                                  {group.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center gap-2 w-full min-w-0">
                                      <span className="truncate break-words min-w-0 flex-1">{item.name}</span>
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
