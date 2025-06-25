
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
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
    unit: 'g'
  });
  const { ingredients } = useIngredients();

  const availableIngredients = Object.keys(ingredients);

  const loadCompositions = async () => {
    const { data, error } = await supabase
      .from('compositions')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading compositions:', error);
    } else {
      setCompositions(data || []);
    }
  };

  const loadCompositionIngredients = async (compositionId: string) => {
    const { data, error } = await supabase
      .from('composition_ingredients')
      .select('*')
      .eq('composition_id', compositionId);
    
    if (error) {
      console.error('Error loading composition ingredients:', error);
    } else {
      setCompositionIngredients(data || []);
    }
  };

  const createComposition = async () => {
    if (!newComposition.name) return;

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
    }
  };

  const addIngredientToComposition = async () => {
    if (!selectedComposition || !newIngredient.ingredient_name || newIngredient.amount <= 0) return;

    const { error } = await supabase
      .from('composition_ingredients')
      .insert([{
        composition_id: selectedComposition,
        ingredient_name: newIngredient.ingredient_name,
        amount: newIngredient.amount,
        unit: newIngredient.unit
      }]);

    if (error) {
      console.error('Error adding ingredient:', error);
    } else {
      loadCompositionIngredients(selectedComposition);
      setNewIngredient({ ingredient_name: '', amount: 0, unit: 'g' });
    }
  };

  const removeIngredientFromComposition = async (ingredientName: string) => {
    const { error } = await supabase
      .from('composition_ingredients')
      .delete()
      .eq('composition_id', selectedComposition)
      .eq('ingredient_name', ingredientName);

    if (error) {
      console.error('Error removing ingredient:', error);
    } else {
      loadCompositionIngredients(selectedComposition);
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
          <CardTitle>Tworzenie Nowego Zestawu</CardTitle>
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
          <Button onClick={createComposition} className="mt-4">
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
              <Label>Wybierz zestaw do edycji</Label>
              <Select value={selectedComposition} onValueChange={setSelectedComposition}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz zestaw" />
                </SelectTrigger>
                <SelectContent>
                  {compositions.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedComposition && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {availableIngredients.map(ingredient => (
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
                    <Select
                      value={newIngredient.unit}
                      onValueChange={(value) => setNewIngredient(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="krople">krople</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addIngredientToComposition}>
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Składnik
                </Button>

                <div className="space-y-2">
                  <h4 className="font-semibold">Składniki w zestawie:</h4>
                  {compositionIngredients.map((ingredient, index) => (
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
                  ))}
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
