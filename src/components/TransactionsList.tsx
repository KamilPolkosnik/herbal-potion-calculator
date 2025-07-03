
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Undo2, ShoppingCart, Calendar, Trash2 } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceNumbering } from '@/hooks/useInvoiceNumbering';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import InvoiceGenerator from './InvoiceGenerator';

interface TransactionsListProps {
  onDataChange?: () => void | Promise<void>;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ onDataChange }) => {
  const { transactions, loading, reverseTransaction, deleteTransaction, refreshTransactions } = useSales();
  const { settings: companySettings } = useCompanySettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getInvoiceNumber, refreshInvoiceNumbers } = useInvoiceNumbering();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  const handleReverse = async (transactionId: string, compositionName: string) => {
    try {
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
      // Odśwież numerację faktur
      await refreshInvoiceNumbers();
    } catch (error) {
      console.error('Error reversing transaction:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się cofnąć transakcji",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (transactionId: string, compositionName: string) => {
    try {
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
      // Odśwież numerację faktur
      await refreshInvoiceNumbers();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć transakcji",
        variant: "destructive",
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
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie transakcji...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Historia Transakcji
        </CardTitle>
        
        {/* Date Range Filter */}
        <div className="flex gap-4 items-end">
          <div>
            <Label htmlFor="dateFrom">Data Od:</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="dateTo">Data Do:</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="mb-0"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Wyczyść filtry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {groupedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {dateFrom || dateTo ? 'Brak transakcji w wybranym zakresie dat' : 'Brak transakcji do wyświetlenia'}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr Transakcji</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Zestaw</TableHead>
                  <TableHead>Kupujący</TableHead>
                  <TableHead>Ilość</TableHead>
                  <TableHead>Cena jedn.</TableHead>
                  <TableHead>Łącznie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedTransactions.map((group) => (
                  <React.Fragment key={group.id}>
                    <TableRow>
                      <TableCell className="font-mono text-sm">
                        {getInvoiceNumber(group.transaction.id)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(group.transaction.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{group.mainItem}</span>
                          {group.isMultiItem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(group.id)}
                              className="h-6 w-6 p-0"
                            >
                              {expandedTransactions.has(group.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{group.transaction.buyer_name || 'Klient indywidualny'}</TableCell>
                      <TableCell>{group.transaction.quantity} szt.</TableCell>
                      <TableCell>{group.transaction.unit_price.toFixed(2)} zł</TableCell>
                      <TableCell>{group.transaction.total_price.toFixed(2)} zł</TableCell>
                      <TableCell>
                        {group.transaction.is_reversed ? (
                          <span className="text-red-600 font-medium">Cofnięta</span>
                        ) : (
                          <span className="text-green-600 font-medium">Aktywna</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <InvoiceGenerator 
                            transaction={group.transaction}
                            companySettings={companySettings}
                            transactionNumber={getInvoiceNumber(group.transaction.id)}
                          />
                          {!group.transaction.is_reversed ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReverse(group.transaction.id, group.transaction.composition_name)}
                            >
                              <Undo2 className="w-4 h-4 mr-1" />
                              Cofnij
                            </Button>
                          ) : (
                            // Przycisk "Usuń" tylko dla administratorów
                            user?.role === 'admin' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(group.transaction.id, group.transaction.composition_name)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Usuń
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {group.isMultiItem && expandedTransactions.has(group.id) && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-gray-50 p-4">
                          <div className="text-sm">
                            <p className="font-medium mb-2">Szczegóły pozycji:</p>
                            <div className="space-y-1">
                              {group.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span>{item.name}</span>
                                  <span>{item.quantity} szt. × {item.price.toFixed(2)} zł</span>
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
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
