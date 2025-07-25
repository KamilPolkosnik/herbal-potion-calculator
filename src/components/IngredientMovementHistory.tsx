
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
  type: 'sale' | 'reversal' | 'batch' | 'individual';
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
  const [displayedCount, setDisplayedCount] = useState(10);

  // Load movements when component mounts or when showArchived changes
  useEffect(() => {
    loadMovements(ingredientName, true); // Always load all movements, filter client-side
  }, [ingredientName]);

  // Group movements by transaction type and reference
  useEffect(() => {
    if (!movements.length) {
      setGroupedMovements([]);
      return;
    }

    const grouped: Record<string, GroupedTransaction> = {};

    // Filter movements based on archive status first
    const filteredByArchive = movements.filter(movement => {
      return showArchived ? (movement.is_archived === true) : (movement.is_archived !== true);
    });

    filteredByArchive.forEach(movement => {
      if (movement.reference_id && (movement.movement_type === 'sale' || movement.movement_type === 'reversal')) {
        // Create separate groups for sales and reversals even if they share the same reference_id
        const key = `${movement.reference_id}_${movement.movement_type}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            type: movement.movement_type as 'sale' | 'reversal',
            referenceId: movement.reference_id,
            movements: [],
            created_at: movement.created_at,
            is_archived: movement.is_archived || false,
            notes: movement.notes
          };
        }
        
        grouped[key].movements.push(movement);
      } else if (movement.reference_id && movement.reference_type === 'manual_update') {
        // Group manual updates by reference_id (batch operations)
        const key = `batch_${movement.reference_id}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            type: 'batch',
            referenceId: movement.reference_id,
            movements: [],
            created_at: movement.created_at,
            is_archived: movement.is_archived || false,
            notes: movement.notes
          };
        }
        
        grouped[key].movements.push(movement);
      } else {
        // Individual movements (purchase, adjustment, etc. without batch)
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

    // Apply other filters
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
    setDisplayedCount(10); // Reset displayed count when filters change
  }, [movements, searchTerm, movementTypeFilter, dateFrom, dateTo, showArchived]);

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

  const getGroupTitle = (group: GroupedTransaction) => {
    if (group.type === 'sale') {
      return `Sprzedaż: ${group.movements.length} składników`;
    } else if (group.type === 'reversal') {
      return `Cofnięcie: ${group.movements.length} składników`;
    } else if (group.type === 'batch') {
      // Determine the predominant movement type in the batch
      const purchaseCount = group.movements.filter(m => m.movement_type === 'purchase').length;
      const adjustmentCount = group.movements.filter(m => m.movement_type === 'adjustment').length;
      
      if (purchaseCount > adjustmentCount) {
        return `Zakup: ${group.movements.length} składników`;
      } else if (adjustmentCount > purchaseCount) {
        return `Korekta: ${group.movements.length} składników`;
      } else {
        return `Ręczna aktualizacja: ${group.movements.length} składników`;
      }
    } else {
      return group.movements[0].ingredient_name;
    }
  };

  const getGroupBadgeType = (group: GroupedTransaction) => {
    if (group.type === 'sale') {
      return 'sale';
    } else if (group.type === 'reversal') {
      return 'reversal';
    } else if (group.type === 'batch') {
      // Determine the predominant movement type in the batch
      const purchaseCount = group.movements.filter(m => m.movement_type === 'purchase').length;
      const adjustmentCount = group.movements.filter(m => m.movement_type === 'adjustment').length;
      
      if (purchaseCount > adjustmentCount) {
        return 'purchase';
      } else {
        return 'adjustment';
      }
    } else {
      return group.movements[0].movement_type;
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
      await loadMovements(ingredientName, true);
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

  const handleShowArchivedToggle = () => {
    setShowArchived(prev => !prev);
  };

  const loadMore = () => {
    setDisplayedCount(prev => prev + 10);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4 sm:p-8">
        <div className="text-base sm:text-lg">Ładowanie historii ruchów...</div>
      </div>
    );
  }

  const displayedMovements = groupedMovements.slice(0, displayedCount);
  const hasMore = displayedCount < groupedMovements.length;

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <span className="text-base sm:text-lg">
            {showArchived ? 'Archiwum Ruchów Magazynowych' : 'Historia Ruchów Magazynowych'}
          </span>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={handleShowArchivedToggle}
              className="text-xs sm:text-sm"
            >
              {showArchived ? <ArchiveRestore className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> : <Archive className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              {showArchived ? 'Pokaż Aktywne' : 'Archiwum'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMovements(ingredientName, true)}
              disabled={loading}
              className="text-xs sm:text-sm"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Odśwież
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={groupedMovements.length === 0}
              className="text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <Input
              placeholder="Wyszukaj składnik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
              <SelectTrigger className="text-sm">
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
                    "w-full justify-start text-left font-normal text-sm",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                    "w-full justify-start text-left font-normal text-sm",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
              className="w-full text-sm"
            >
              Wyczyść filtry
            </Button>
          </div>
        </div>

        {displayedMovements.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
            {showArchived 
              ? "Brak zarchiwizowanych ruchów magazynowych spełniających kryteria wyszukiwania."
              : "Brak ruchów magazynowych spełniających kryteria wyszukiwania."
            }
          </div>
        ) : (
          <div className="space-y-2">
            {displayedMovements.map((group) => (
              <div
                key={group.id}
                className={cn(
                  "p-2 sm:p-3 border rounded-lg hover:bg-gray-50",
                  group.is_archived && "bg-gray-100 opacity-75"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                      <span className="font-medium text-sm sm:text-base truncate">
                        {getGroupTitle(group)}
                      </span>
                      
                      {/* Only show one badge per group */}
                      <Badge className={`${getMovementTypeColor(getGroupBadgeType(group))} text-xs`}>
                        {getMovementTypeLabel(getGroupBadgeType(group))}
                      </Badge>
                      
                      {group.is_archived && (
                        <Badge variant="secondary" className="text-xs">Zarchiwizowany</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {group.movements.map((movement, index) => (
                        <div key={index} className="text-xs sm:text-sm text-gray-600">
                          <span className="font-medium truncate">{movement.ingredient_name}:</span>
                          <span className={`ml-1 sm:ml-2 ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change.toFixed(2)} {movement.unit}
                          </span>
                        </div>
                      ))}
                      
                      {group.notes && (
                        <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{group.notes}</div>
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
                    className="ml-2 h-8 w-8 p-0 flex-shrink-0"
                  >
                    {group.is_archived ? (
                      <ArchiveRestore className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="text-center pt-3 sm:pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm"
                >
                  Załaduj więcej
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IngredientMovementHistory;
