
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface CompositionFiltersProps {
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  availabilityFilter: string;
  onAvailabilityFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const CompositionFilters: React.FC<CompositionFiltersProps> = ({
  nameFilter,
  onNameFilterChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-800">Filtry i sortowanie</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="name-filter">Filtruj po nazwie</Label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              id="name-filter"
              value={nameFilter}
              onChange={(e) => onNameFilterChange(e.target.value)}
              placeholder="Wpisz nazwę zestawu..."
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="availability-filter">Dostępność</Label>
          <Select value={availabilityFilter} onValueChange={onAvailabilityFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Wszystkie zestawy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie zestawy</SelectItem>
              <SelectItem value="available">Tylko dostępne</SelectItem>
              <SelectItem value="unavailable">Tylko niedostępne</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sort-by">Sortowanie</Label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sortuj według..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nazwa A-Z</SelectItem>
              <SelectItem value="name-desc">Nazwa Z-A</SelectItem>
              <SelectItem value="sets-desc">Najwięcej zestawów</SelectItem>
              <SelectItem value="sets-asc">Najmniej zestawów</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CompositionFilters;
