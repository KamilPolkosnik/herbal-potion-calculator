
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const allIngredients = [
  // Surowce ziołowe
  'kwiaty lawendy',
  'kwiaty rumianku',
  'liście melisy',
  'nagietek',
  'kozłek lekarski',
  'korzeń maca',
  'płatki róży',
  'kwiaty hibiskusa',
  'liście pokrzywy',
  'ziele skrzypu polnego',
  'liście brzozy',
  'liście mięty pieprzowej',
  'korzeń machy',
  'kwiaty czarnego bzu',
  'kwiaty lipy',
  'ziele jeżówki',
  'pokrzywa',
  'hibiskus',
  'spirulina sproszkowana',
  'sól morska',
  'suszone algi kelp',
  'eukaliptus',
  'kora wierzby białej',
  'kwiat nagietka',
  'mięta pieprzowa',
  'liście szałwii muszkatołowej',
  'lawenda',
  'płatki nagietka',
  'rumian rzymski',
  'płatki róży',
  'skrzyp polny',
  'suszony aloes',
  
  // Olejki eteryczne
  'olejek lawendowy',
  'olejek ylang',
  'olejek pomarańczowy',
  'olejek paczuli',
  'olejek eukaliptusowy',
  'olejek citronella',
  'olejek z drzewka herbacianego',
  'olejek rozmarynowy',
  'olejek morski świat'
];

interface IngredientManagerProps {
  ingredients: Record<string, number>;
  setIngredients: (ingredients: Record<string, number>) => void;
  prices: Record<string, number>;
  setPrices: (prices: Record<string, number>) => void;
}

const IngredientManager: React.FC<IngredientManagerProps> = ({
  ingredients,
  setIngredients,
  prices,
  setPrices
}) => {
  const updateIngredient = (name: string, amount: number) => {
    setIngredients({ ...ingredients, [name]: amount });
  };

  const updatePrice = (name: string, price: number) => {
    setPrices({ ...prices, [name]: price });
  };

  const herbIngredients = allIngredients.filter(ing => !ing.includes('olejek'));
  const oilIngredients = allIngredients.filter(ing => ing.includes('olejek'));

  const renderIngredientSection = (items: string[], title: string, unit: string) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((ingredient) => (
            <div key={ingredient} className="space-y-2 p-4 border rounded-lg bg-white">
              <Label htmlFor={ingredient} className="text-sm font-medium capitalize">
                {ingredient}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Stan ({unit})</Label>
                  <Input
                    id={ingredient}
                    type="number"
                    value={ingredients[ingredient] || ''}
                    onChange={(e) => updateIngredient(ingredient, parseFloat(e.target.value) || 0)}
                    placeholder={`0 ${unit}`}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Cena (zł/{unit})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prices[ingredient] || ''}
                    onChange={(e) => updatePrice(ingredient, parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-8"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600 text-center mt-2">
                Wartość: {((ingredients[ingredient] || 0) * (prices[ingredient] || 0)).toFixed(2)} zł
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Informacja o przeliczniku olejków:</h3>
        <p className="text-blue-700">200 kropel = 10 ml olejku eterycznego</p>
      </div>
      
      {renderIngredientSection(herbIngredients, 'Surowce Ziołowe', 'g')}
      {renderIngredientSection(oilIngredients, 'Olejki Eteryczne', 'ml')}
    </div>
  );
};

export default IngredientManager;
