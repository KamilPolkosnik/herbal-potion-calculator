
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface IngredientFiltersProps {
  onFilterChange: (filters: { searchTerm: string; selectedComposition: string; lowStock: boolean }) => void;
}

const IngredientFilters: React.FC<IngredientFiltersProps> = ({ onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComposition, setSelectedComposition] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [compositions, setCompositions] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadCompositions = async () => {
      try {
        const { data, error } = await supabase
          .from('compositions')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Błąd podczas ładowania zestawów:', error);
          return;
        }

        setCompositions(data || []);
      } catch (error) {
        console.error('Błąd podczas ładowania zestawów:', error);
      }
    };

    loadCompositions();
  }, []);

  useEffect(() => {
    onFilterChange({ searchTerm, selectedComposition, lowStock });
  }, [searchTerm, selectedComposition, lowStock, onFilterChange]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCompositionChange = (value: string) => {
    setSelectedComposition(value);
  };

  const handleLowStockChange = (value: string) => {
    setLowStock(value === 'low-stock');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedComposition('');
    setLowStock(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg border mb-6">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Filtrowanie składników</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Wyczyść filtry
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">
            Szukaj składnika
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Wpisz nazwę składnika..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="composition" className="text-sm font-medium text-gray-700">
            Filtruj według zestawu
          </Label>
          <Select value={selectedComposition} onValueChange={handleCompositionChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Wybierz zestaw..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie składniki</SelectItem>
              {compositions.map((composition) => (
                <SelectItem key={composition.id} value={composition.id}>
                  {composition.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="stock-filter" className="text-sm font-medium text-gray-700">
            Filtruj według stanu
          </Label>
          <Select value={lowStock ? 'low-stock' : 'all'} onValueChange={handleLowStockChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Wybierz stan..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie składniki</SelectItem>
              <SelectItem value="low-stock">Niski stan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default IngredientFilters;
