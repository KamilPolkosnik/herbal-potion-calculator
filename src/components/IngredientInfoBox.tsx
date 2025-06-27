
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface IngredientInfoBoxProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const IngredientInfoBox: React.FC<IngredientInfoBoxProps> = ({ onRefresh, isLoading }) => {
  return (
    <div className="flex justify-between items-center">
      <div className="bg-blue-50 p-4 rounded-lg flex-1 mr-4">
        <h3 className="font-semibold text-blue-800 mb-2">Informacja o przeliczniku olejków:</h3>
        <p className="text-blue-700">200 kropel = 10 ml olejku eterycznego</p>
      </div>
      <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Odśwież
      </Button>
    </div>
  );
};

export default IngredientInfoBox;
