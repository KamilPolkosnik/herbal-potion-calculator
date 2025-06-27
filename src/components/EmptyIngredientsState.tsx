
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface EmptyIngredientsStateProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const EmptyIngredientsState: React.FC<EmptyIngredientsStateProps> = ({ onRefresh, isLoading }) => {
  return (
    <div className="text-center py-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Brak składników</h3>
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Odśwież
        </Button>
      </div>
      <p className="text-gray-500">
        Nie ma jeszcze żadnych składników w zestawach. Dodaj składniki do zestawów w zakładce "Zarządzanie", a potem będziesz mógł zarządzać ich stanami i cenami tutaj.
      </p>
    </div>
  );
};

export default EmptyIngredientsState;
