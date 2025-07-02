
import React, { useState, useEffect } from 'react';
import { useIngredientMovements } from '@/hooks/useIngredientMovements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw, Download, Archive, ArchiveRestore, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface IngredientMovementHistoryProps {
  ingredientName?: string;
}

interface GroupedTransaction {
  id: string;
  type: 'transaction' | 'individual';
  referenceId?: string;
  movements: Array<{
    id: string;
    ingredient_name: string;
    movement_type: 'purchase' | 'sale' | 'reversal' | 'adjustment';
    quantity_change: number;
    unit: string;
    reference_id?: string;
    reference_type?: string;
    notes?: string;
    created_at: string;
    is_archived?: boolean;
  }>;
  created_at: string;
  is_archived: boolean;
  notes?: string;
}

const IngredientMovementHistory: React.FC<IngredientMovementHistoryProps> = ({ ingredientName }) => {
  const { movements, loading, loadMovements, archiveMovement, unarchiveMovement } = useIngredientMovements();
  const [searchTerm, setSearchTerm] = useState(ingredientName || '');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showArchived, setShowArchived] = useState(false);
  const [groupedMovements, setGroupedMovements] = useState<GroupedTransaction[]>([]);

  useEffect(() => {
    loadMovements(ingredientName, showArchived).then(() => {
      console.log('Movements loaded:', movements.length);
    });
  }, [ingredientName, showArchived, loadMovements]);

  // Group movements by transaction
  useEffect(() => {
    const grouped: Record<string, GroupedTransaction> = {};

    movements.forEach(movement => {
      // Group by reference_id for sales and reversals
      if (movement.reference_id && (movement.movement_type === 'sale' || movement.movement_type === 'reversal')) {
        const key = movement.reference_id;
        
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            type: 'transaction',
            referenceId: movement.reference_id,
            movements: [],
            created_at: movement.created_at,
            is_archived: movement.is_archived || false,
            notes: movement.notes
          };
        }
        
        grouped[key].movements.push(movement);
        // Update archived status - if any movement is archived, mark group as archived
        if (movement.is_archived) {
          grouped[key].is_archived = true;
        }
      } else {
        // Individual movements (purchase, adjustment, etc.)
        grouped[movement.id] = {
          id: movement.id,
          type: 'individual',
          movements: [movement],
          created_at: movement.created_at,
          is_archived: movement.is_archived || false,
          notes: movement.notes
        };
      }
    });

    let filteredGroups = Object.values(grouped);

    // Apply filters
    if (searchTerm) {
      filteredGroups = filteredGroups.filter(group =>
        group.movements.some(movement =>
          movement.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (movementTypeFilter !== 'all') {
      filteredGroups = filteredGroups.filter(group =>
        group.movements.some(movement => movement.movement_type === movementTypeFilter)
      );
    }

    if (dateFrom) {
      filteredGroups = filteredGroups.filter(group =>
        new Date(group.created_at) >= dateFrom
      );
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filteredGroups = filteredGroups.filter(group =>
        new Date(group.created_at) <= endOfDay
      );
    }

    // Sort by date
    filteredGroups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setGroupedMovements(filteredGroups);
  }, [movements, searchTerm, movementTypeFilter, dateFrom, dateTo]);

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'sale':
        return 'bg-red-100 text-red-800';
      case 'reversal':
        return 'bg-blue-100 text-blue-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Zakup';
      case 'sale':
        return 'Sprzedaż';
      case 'reversal':
        return 'Cofnięcie';
      case 'adjustment':
        return 'Korekta';
      default:
        return type;
    }
  };

  const handleArchiveToggle = async (group: GroupedTransaction) => {
    try {
      const promises = group.movements.map(movement => {
        if (group.is_archived) {
          return unarchiveMovement(movement.id);
        } else {
          return archiveMovement(movement.id);
        }
      });
      
      await Promise.all(promises);
      await loadMovements(ingredientName, showArchived);
    } catch (error) {
      console.error('Error toggling archive status:', error);
    }
  };

  const exportToCSV = () => {
    const csvHeader = 'Data,Składnik,Typ,Zmiana,Jednostka,Notatki,Status\n';
    const csvData = movements.map(movement => 
      `${format(new Date(movement.created_at), 'yyyy-MM-dd HH:mm:ss')},` +
      `"${movement.ingredient_name}",` +
      `"${getMovementTypeLabel(movement.movement_type)}",` +
      `${movement.quantity_change},` +
      `"${movement.unit}",` +
      `"${movement.notes || ''}",` +
      `"${movement.is_archived ? 'Zarchiwizowany' : 'Aktywny'}"`
    ).join('\n');

    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historia_ruchow_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie historii ruchów...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{showArchived ? 'Archiwum Ruchów Magazynowych' : 'Historia Ruchów Magazynowych'}</span>
          <div className="flex gap-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? <ArchiveRestore className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
              {showArchived ? 'Pokaż Aktywne' : 'Archiwum'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMovements(ingredientName, showArchived)}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Odśwież
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={groupedMovements.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Eksportuj CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <Input
              placeholder="Wyszukaj składnik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Typ ruchu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                <SelectItem value="purchase">Zakup</SelectItem>
                <SelectItem value="sale">Sprzedaż</SelectItem>
                <SelectItem value="reversal">Cofnięcie</SelectItem>
                <SelectItem value="adjustment">Korekta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd.MM.yyyy") : "Data od"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd.MM.yyyy") : "Data do"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setDateFrom(undefined);
                setDateTo(undefined);
                setSearchTerm('');
                setMovementTypeFilter('all');
              }}
              className="w-full"
            >
              Wyczyść filtry
            </Button>
          </div>
        </div>

        {groupedMovements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showArchived 
              ? "Brak zarchiwizowanych ruchów magazynowych spełniających kryteria wyszukiwania."
              : "Brak ruchów magazynowych spełniających kryteria wyszukiwania."
            }
          </div>
        ) : (
          <div className="space-y-2">
            {groupedMovements.map((group) => (
              <div
                key={group.id}
                className={cn(
                  "p-3 border rounded-lg hover:bg-gray-50",
                  group.is_archived && "bg-gray-100 opacity-75"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {group.type === 'transaction' ? (
                        <span className="font-medium">
                          Transakcja: {group.movements.length} składników
                        </span>
                      ) : (
                        <span className="font-medium">{group.movements[0].ingredient_name}</span>
                      )}
                      
                      {group.movements.map((movement, index) => (
                        <Badge key={index} className={getMovementTypeColor(movement.movement_type)}>
                          {getMovementTypeLabel(movement.movement_type)}
                        </Badge>
                      ))}
                      
                      {group.is_archived && (
                        <Badge variant="secondary">Zarchiwizowany</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {group.movements.map((movement, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className="font-medium">{movement.ingredient_name}:</span>
                          <span className={`ml-2 ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change.toFixed(2)} {movement.unit}
                          </span>
                        </div>
                      ))}
                      
                      {group.notes && (
                        <div className="text-sm text-gray-600 mt-1">{group.notes}</div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {format(new Date(group.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveToggle(group)}
                  >
                    {group.is_archived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IngredientMovementHistory;
