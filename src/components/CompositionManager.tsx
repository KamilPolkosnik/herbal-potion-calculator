
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIngredients } from '@/hooks/useIngredients';

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

const colorOptions = [
  { value: 'bg-purple-600', label: 'Fioletowy' },
  { value: 'bg-red-600', label: 'Czerwony' },
  { value: 'bg-green-600', label: 'Zielony' },
  { value: 'bg-blue-600', label: 'Niebieski' },
  { value: 'bg-teal-600', label: 'Morski' },
  { value: 'bg-orange-600', label: 'Pomarańczowy' },
  { value: 'bg-pink-600', label: 'Różowy' }
];

const CompositionManager: React.FC = () => {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [selectedComposition, setSelectedComposition] = useState<string>('');
  const [compositionIngredients, setCompositionIngredients] = useState<CompositionIngredient[]>([]);
  const [newComposition, setNewComposition] = useState({
    name: '',
    description: '',
    color: 'bg-blue-600'
  });
  const [newIngredient, setNewIngredient] = useState({
    ingredient_name: '',
    amount: 0,
    unit: 'g',
    category: 'zioło'
  });
  const [loading, setLoading] = useState(false);
  const { ingredients, refreshData } = useIngredients();

  const availableIngredients = Object.keys(ingredients);

  const loadCompositions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('compositions')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading compositions:', error);
      } else {
        console.log('Loaded compositions:', data);
        setCompositions(data || []);
      }
    } catch (error) {
      console.error('Error loading compositions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompositionIngredients = async (compositionId: string) => {
    try {
      const { data, error } = await supabase
        .from('composition_ingredients')
        .select('*')
        .eq('composition_id', compositionId);
      
      if (error) {
        console.error('Error loading composition ingredients:', error);
      } else {
        setCompositionIngredients(data || []);
      }
    } catch (error) {
      console.error('Error loading composition ingredients:', error);
    }
  };

  const createComposition = async () => {
    if (!newComposition.name) return;

    try {
      const { data, error } = await supabase
        .from('compositions')
        .insert([newComposition])
        .select()
        .single();

      if (error) {
        console.error('Error creating composition:', error);
      } else {
        setCompositions(prev => [...prev, data]);
        setNewComposition({ name: '', description: '', color: 'bg-blue-600' });
        console.log('Composition created successfully');
      }
    } catch (error) {
      console.error('Error creating composition:', error);
    }
  };

  const addIngredientToComposition = async () => {
    if (!selectedComposition || !newIngredient.ingredient_name || newIngredient.amount <= 0) return;

    // Automatické nastavenie jednotky na základe kategórie
    let unit = newIngredient.unit;
    if (newIngredient.category === 'olejek') {
      unit = 'krople';
    } else if (newIngredient.category === 'zioło') {
      unit = 'g';
    }

    try {
      const { error } = await supabase
        .from('composition_ingredients')
        .insert([{
          composition_id: selectedComposition,
          ingredient_name: newIngredient.ingredient_name,
          amount: newIngredient.amount,
          unit: unit
        }]);

      if (error) {
        console.error('Error adding ingredient:', error);
      } else {
        loadCompositionIngredients(selectedComposition);
        setNewIngredient({ ingredient_name: '', amount: 0, unit: 'g', category: 'zioło' });
        console.log('Ingredient added successfully');
      }
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  };

  const removeIngredientFromComposition = async (ingredientName: string) => {
    try {
      const { error } = await supabase
        .from('composition_ingredients')
        .delete()
        .eq('composition_id', selectedComposition)
        .eq('ingredient_name', ingredientName);

      if (error) {
        console.error('Error removing ingredient:', error);
      } else {
        loadCompositionIngredients(selectedComposition);
        console.log('Ingredient removed successfully');
      }
    } catch (error) {
      console.error('Error removing ingredient:', error);
    }
  };

  const deleteComposition = async (compositionId: string) => {
    try {
      const { error } = await supabase
        .from('compositions')
        .delete()
        .eq('id', compositionId);

      if (error) {
        console.error('Error deleting composition:', error);
      } else {
        setCompositions(prev => prev.filter(comp => comp.id !== compositionId));
        if (selectedComposition === compositionId) {
          setSelectedComposition('');
          setCompositionIngredients([]);
        }
        console.log('Composition deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting composition:', error);
    }
  };

  useEffect(() => {
    loadCompositions();
  }, []);

  useEffect(() => {
    if (selectedComposition) {
      loadCompositionIngredients(selectedComposition);
    }
  }, [selectedComposition]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tworzenie Nowego Zestawu</CardTitle>
            <Button variant="outline" onClick={loadCompositions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Odśwież
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Nazwa zestawu</Label>
              <Input
                id="name"
                value={newComposition.name}
                onChange={(e) => setNewComposition(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nazwa zestawu"
              />
            </div>
            <div>
              <Label htmlFor="description">Opis</Label>
              <Input
                id="description"
                value={newComposition.description}
                onChange={(e) => setNewComposition(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Opis zestawu"
              />
            </div>
            <div>
              <Label htmlFor="color">Kolor</Label>
              <Select
                value={newComposition.color}
                onValueChange={(value) => setNewComposition(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.value}`}></div>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={createComposition} className="mt-4" disabled={!newComposition.name}>
            <Plus className="w-4 h-4 mr-2" />
            Utwórz Zestaw
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edytowanie Zestawu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Wybierz zestaw do edycji ({compositions.length} dostępnych)</Label>
              <Select value={selectedComposition} onValueChange={setSelectedComposition}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz zestaw" />
                </SelectTrigger>
                <SelectContent>
                  {compositions.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${comp.color}`}></div>
                        {comp.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedComposition && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Dodaj składnik do zestawu</h4>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteComposition(selectedComposition)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Usuń zestaw
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Kategoria</Label>
                    <Select
                      value={newIngredient.category}
                      onValueChange={(value) => setNewIngredient(prev => ({ 
                        ...prev, 
                        category: value,
                        unit: value === 'olejek' ? 'krople' : 'g'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zioło">Zioło</SelectItem>
                        <SelectItem value="olejek">Olejek</SelectItem>
                        <SelectItem value="inne">Inne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Składnik</Label>
                    <Select
                      value={newIngredient.ingredient_name}
                      onValueChange={(value) => setNewIngredient(prev => ({ ...prev, ingredient_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz składnik" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIngredients
                          .filter(ingredient => {
                            if (newIngredient.category === 'olejek') {
                              return ingredient.includes('olejek');
                            } else if (newIngredient.category === 'zioło') {
                              return !ingredient.includes('olejek');
                            }
                            return true;
                          })
                          .map(ingredient => (
                            <SelectItem key={ingredient} value={ingredient}>
                              {ingredient}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ilość</Label>
                    <Input
                      type="number"
                      value={newIngredient.amount}
                      onChange={(e) => setNewIngredient(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="Ilość"
                    />
                  </div>
                  <div>
                    <Label>Jednostka</Label>
                    <Input
                      value={newIngredient.unit}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                <Button 
                  onClick={addIngredientToComposition}
                  disabled={!newIngredient.ingredient_name || newIngredient.amount <= 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Składnik
                </Button>

                <div className="space-y-2">
                  <h4 className="font-semibold">Składniki w zestawie ({compositionIngredients.length}):</h4>
                  {compositionIngredients.length === 0 ? (
                    <p className="text-gray-500 text-sm">Brak składników w tym zestawie</p>
                  ) : (
                    compositionIngredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div>
                          <span className="font-medium">{ingredient.ingredient_name}</span>
                          <Badge variant="outline" className="ml-2">
                            {ingredient.amount} {ingredient.unit}
                          </Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeIngredientFromComposition(ingredient.ingredient_name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompositionManager;
