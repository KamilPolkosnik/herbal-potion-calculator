
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { compositions } from '@/data/compositions';

interface ProductCalculatorProps {
  ingredients: Record<string, number>;
  prices: Record<string, number>;
}

const ProductCalculator: React.FC<ProductCalculatorProps> = ({ ingredients, prices }) => {
  const calculateAvailableSets = (composition: any) => {
    let minSets = Infinity;
    let limitingIngredient = '';
    
    // Sprawdź surowce
    for (const [ingredient, requiredAmount] of Object.entries(composition.herbs)) {
      const available = ingredients[ingredient] || 0;
      const possibleSets = Math.floor(available / (requiredAmount as number));
      if (possibleSets < minSets) {
        minSets = possibleSets;
        limitingIngredient = ingredient;
      }
    }
    
    // Sprawdź olejki (przelicz ml na krople: 10ml = 200 kropel)
    for (const [ingredient, requiredDrops] of Object.entries(composition.oils)) {
      const availableMl = ingredients[ingredient] || 0;
      const availableDrops = availableMl * 20; // 1ml = 20 kropel
      const possibleSets = Math.floor(availableDrops / (requiredDrops as number));
      if (possibleSets < minSets) {
        minSets = possibleSets;
        limitingIngredient = ingredient;
      }
    }
    
    return { sets: minSets === Infinity ? 0 : minSets, limitingIngredient };
  };

  const calculateCostPerSet = (composition: any) => {
    let totalCost = 0;
    
    // Koszt surowców na 1 zestaw (cena za 100g, więc dzielimy przez 100)
    for (const [ingredient, amount] of Object.entries(composition.herbs)) {
      const price = prices[ingredient] || 0;
      totalCost += (amount as number) * price / 100; // dzielimy przez 100 bo cena jest za 100g
    }
    
    // Koszt olejków na 1 zestaw (przelicz krople na ml)
    for (const [ingredient, drops] of Object.entries(composition.oils)) {
      const price = prices[ingredient] || 0;
      const mlNeeded = (drops as number) / 20; // 20 kropel = 1ml
      totalCost += mlNeeded * price;
    }
    
    return totalCost;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {compositions.map((composition) => {
          const { sets, limitingIngredient } = calculateAvailableSets(composition);
          const costPerSet = calculateCostPerSet(composition);
          
          return (
            <Card key={composition.name} className="overflow-hidden">
              <CardHeader className={`${composition.color} text-white`}>
                <CardTitle className="text-lg">{composition.name}</CardTitle>
                <p className="text-sm opacity-90">{composition.description}</p>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-800">
                      {sets} zestawów
                    </span>
                    <Badge variant={sets > 0 ? "default" : "destructive"}>
                      {sets > 0 ? "Dostępne" : "Brak"}
                    </Badge>
                  </div>
                  
                  {limitingIngredient && (
                    <p className="text-sm text-red-600 mb-3">
                      Ograniczający składnik: {limitingIngredient}
                    </p>
                  )}
                  
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Koszt jednego zestawu:
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {costPerSet.toFixed(2)} zł
                    </p>
                    {sets > 0 && (
                      <p className="text-sm text-gray-600">
                        Całkowita wartość: {(sets * costPerSet).toFixed(2)} zł
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Surowce (100g):</h4>
                  {Object.entries(composition.herbs).map(([herb, amount]) => {
                    const available = ingredients[herb] || 0;
                    const needed = amount as number;
                    const percentage = Math.min((available / needed) * 100, 100);
                    
                    return (
                      <div key={herb} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{herb}</span>
                          <span className={available >= needed ? "text-green-600" : "text-red-600"}>
                            {available}g / {needed}g
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                  
                  <h4 className="font-semibold text-gray-700 mt-4">Olejki eteryczne:</h4>
                  {Object.entries(composition.oils).map(([oil, drops]) => {
                    const availableMl = ingredients[oil] || 0;
                    const availableDrops = availableMl * 20;
                    const neededDrops = drops as number;
                    const percentage = Math.min((availableDrops / neededDrops) * 100, 100);
                    
                    return (
                      <div key={oil} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{oil.replace('olejek ', '')}</span>
                          <span className={availableDrops >= neededDrops ? "text-green-600" : "text-red-600"}>
                            {Math.floor(availableDrops)} / {neededDrops} kropel
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProductCalculator;
