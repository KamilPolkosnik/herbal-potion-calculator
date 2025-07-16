
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import CompositionFilters from './CompositionFilters';

interface ProductCalculatorProps {
  ingredients: Record<string, number>;
  prices: Record<string, number>;
}

interface Composition {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface CompositionIngredient {
  ingredient_name: string;
  amount: number;
  unit: string;
}

const ProductCalculator: React.FC<ProductCalculatorProps> = ({ ingredients }) => {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [compositionIngredients, setCompositionIngredients] = useState<Record<string, CompositionIngredient[]>>({});
  const [loading, setLoading] = useState(true);
  
  // State dla filtrów i sortowania
  const [nameFilter, setNameFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  const loadCompositions = async () => {
    try {
      const { data: compositionsData, error: compositionsError } = await supabase
        .from('compositions')
        .select('*')
        .order('name');

      if (compositionsError) throw compositionsError;

      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('composition_ingredients')
        .select('*');

      if (ingredientsError) throw ingredientsError;

      const ingredientsByComposition: Record<string, CompositionIngredient[]> = {};
      ingredientsData?.forEach((ingredient) => {
        if (!ingredientsByComposition[ingredient.composition_id]) {
          ingredientsByComposition[ingredient.composition_id] = [];
        }
        ingredientsByComposition[ingredient.composition_id].push({
          ingredient_name: ingredient.ingredient_name,
          amount: ingredient.amount,
          unit: ingredient.unit,
        });
      });

      setCompositions(compositionsData || []);
      setCompositionIngredients(ingredientsByComposition);
    } catch (error) {
      console.error('Error loading compositions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompositions();
  }, []);

  const calculateAvailableSets = (compositionId: string) => {
    const ingredientsList = compositionIngredients[compositionId] || [];
    let minSets = Infinity;
    const limitingIngredients: string[] = [];

    for (const ingredient of ingredientsList) {
      const available = ingredients[ingredient.ingredient_name] || 0;
      let possibleSets = 0;

      if (ingredient.unit === 'krople') {
        const availableDrops = available * 20;
        possibleSets = Math.floor(availableDrops / ingredient.amount);
      } else {
        possibleSets = Math.floor(available / ingredient.amount);
      }

      if (possibleSets < minSets) {
        minSets = possibleSets;
        limitingIngredients.length = 0;
        limitingIngredients.push(ingredient.ingredient_name);
      } else if (possibleSets === minSets && possibleSets < Infinity) {
        limitingIngredients.push(ingredient.ingredient_name);
      }
    }

    return { sets: minSets === Infinity ? 0 : minSets, limitingIngredients };
  };

  // Oblicz dane dla filtrowania i sortowania
  const compositionsWithSets = useMemo(() => {
    return compositions.map(composition => {
      const { sets } = calculateAvailableSets(composition.id);
      return { ...composition, availableSets: sets };
    });
  }, [compositions, compositionIngredients, ingredients]);

  // Filtrowanie i sortowanie
  const filteredAndSortedCompositions = useMemo(() => {
    let filtered = compositionsWithSets;

    // Filtrowanie po nazwie
    if (nameFilter) {
      filtered = filtered.filter(comp =>
        comp.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
        (comp.description && comp.description.toLowerCase().includes(nameFilter.toLowerCase()))
      );
    }

    // Filtrowanie po dostępności
    if (availabilityFilter === 'available') {
      filtered = filtered.filter(comp => comp.availableSets > 0);
    } else if (availabilityFilter === 'unavailable') {
      filtered = filtered.filter(comp => comp.availableSets === 0);
    }

    // Sortowanie
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'sets-desc':
          return b.availableSets - a.availableSets;
        case 'sets-asc':
          return a.availableSets - b.availableSets;
        default:
          return 0;
      }
    });

    return filtered;
  }, [compositionsWithSets, nameFilter, availabilityFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie zestawów...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompositionFilters
        nameFilter={nameFilter}
        onNameFilterChange={setNameFilter}
        availabilityFilter={availabilityFilter}
        onAvailabilityFilterChange={setAvailabilityFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Zestawy ({filteredAndSortedCompositions.length} z {compositions.length})
        </h2>
        {(nameFilter || availabilityFilter !== 'all') && (
          <button
            onClick={() => {
              setNameFilter('');
              setAvailabilityFilter('all');
              setSortBy('name-asc');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedCompositions.map((composition) => {
          const { sets, limitingIngredients } = calculateAvailableSets(composition.id);
          const ingredientsList = compositionIngredients[composition.id] || [];

          return (
            <Card key={composition.id} className="overflow-hidden">
              <CardHeader className={`${composition.color} text-white`}>
                <CardTitle className="text-lg">{composition.name}</CardTitle>
                <p className="text-sm opacity-90">{composition.description}</p>
              </CardHeader>

              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-800">{sets} zestawów</span>
                    <Badge variant={sets > 0 ? 'default' : 'destructive'}>
                      {sets > 0 ? 'Dostępne' : 'Brak'}
                    </Badge>
                  </div>

                  {sets === 0 && limitingIngredients.length > 0 && (
                    <div className="text-sm text-red-600 mb-3">
                      <p className="font-medium">Ograniczające składniki:</p>
                      <ul className="list-disc list-inside ml-2">
                        {limitingIngredients.map((ingredient, index) => (
                          <li key={index}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Składniki:</h4>
                  {ingredientsList.map((ingredient, index) => {
                    const available = ingredients[ingredient.ingredient_name] || 0;
                    let needed = ingredient.amount;
                    let availableForCalc = available;
                    let percentage = 0;

                    if (ingredient.unit === 'krople') {
                      availableForCalc = available * 20;
                      percentage = Math.min((availableForCalc / needed) * 100, 100);
                    } else {
                      percentage = Math.min((available / needed) * 100, 100);
                    }

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{ingredient.ingredient_name}</span>
                          <span className={availableForCalc >= needed ? 'text-green-600' : 'text-red-600'}>
                            {ingredient.unit === 'krople'
                              ? `${Math.floor(availableForCalc)} / ${needed} kropel`
                              : `${available}${ingredient.unit} / ${needed}${ingredient.unit}`}
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

      {filteredAndSortedCompositions.length === 0 && compositions.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Brak zestawów spełniających kryteria filtrowania.</p>
        </div>
      )}

      {compositions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Brak zestawów. Dodaj nowe zestawy w zakładce "Zarządzanie".</p>
        </div>
      )}
    </div>
  );
};

export default ProductCalculator;
