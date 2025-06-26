
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Undo2, ShoppingCart } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie transakcji...</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Historia Transakcji
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Brak transakcji do wyświetlenia
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Historia Transakcji
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Zestaw</TableHead>
              <TableHead>Ilość</TableHead>
              <TableHead>Cena jedn.</TableHead>
              <TableHead>Łącznie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {format(new Date(transaction.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}
                </TableCell>
                <TableCell>{transaction.composition_name}</TableCell>
                <TableCell>{transaction.quantity} szt.</TableCell>
                <TableCell>{transaction.unit_price.toFixed(2)} zł</TableCell>
                <TableCell>{transaction.total_price.toFixed(2)} zł</TableCell>
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
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
