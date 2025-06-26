
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Undo2, ShoppingCart, Calendar } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface TransactionsListProps {
  onDataChange?: () => void | Promise<void>;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ onDataChange }) => {
  const { transactions, loading, reverseTransaction } = useSales();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
    } catch (error) {
      console.error('Error reversing transaction:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się cofnąć transakcji",
        variant: "destructive",
      });
    }
  };

  const generateTransactionNumber = (index: number) => {
    return (index + 1).toString().padStart(9, '0');
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

    return filtered;
  }, [transactions, dateFrom, dateTo]);

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
        {filteredTransactions.length === 0 ? (
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
                  <TableHead>Ilość</TableHead>
                  <TableHead>Cena jedn.</TableHead>
                  <TableHead>Łącznie</TableHead>
                  <TableHead>Użytkownik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {generateTransactionNumber(transactions.findIndex(t => t.id === transaction.id))}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}
                    </TableCell>
                    <TableCell>{transaction.composition_name}</TableCell>
                    <TableCell>{transaction.quantity} szt.</TableCell>
                    <TableCell>{transaction.unit_price.toFixed(2)} zł</TableCell>
                    <TableCell>{transaction.total_price.toFixed(2)} zł</TableCell>
                    <TableCell>admin</TableCell>
                    <TableCell>
                      {transaction.is_reversed ? (
                        <span className="text-red-600 font-medium">Cofnięta</span>
                      ) : (
                        <span className="text-green-600 font-medium">Aktywna</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!transaction.is_reversed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReverse(transaction.id, transaction.composition_name)}
                        >
                          <Undo2 className="w-4 h-4 mr-1" />
                          Cofnij
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
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
