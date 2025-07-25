
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, RefreshCw, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIngredients } from '@/hooks/useIngredients';

interface Composition {
  id: string;
  name: string;
  description: string;
  color: string;
  sale_price: number;
}

interface CompositionIngredient {
  ingredient_name: string;
  amount: number;
  unit: string;
  category: string;
}

interface CompositionManagerProps {
  onDataChange?: () => void | Promise<void>;
}

const VAT_RATE = 0.23; // 23% VAT

const colorOptions = [
  { value: 'bg-purple-600', label: 'Fioletowy' },
  { value: 'bg-red-600', label: 'Czerwony' },
  { value: 'bg-green-600', label: 'Zielony' },
  { value: 'bg-blue-600', label: 'Niebieski' },
  { value: 'bg-teal-600', label: 'Morski' },
  { value: 'bg-orange-600', label: 'Pomarańczowy' },
  { value: 'bg-pink-600', label: 'Różowy' }
];

const CompositionManager: React.FC<CompositionManagerProps> = ({ onDataChange }) => {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [selectedComposition, setSelectedComposition] = useState<string>('');
  const [compositionIngredients, setCompositionIngredients] = useState<CompositionIngredient[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ amount: 0, unit: '' });
  const [editingComposition, setEditingComposition] = useState<string | null>(null);
  const [editingCompositionData, setEditingCompositionData] = useState({
    name: '',
    description: '',
    color: '',
    sale_price: 0
  });
  const [newComposition, setNewComposition] = useState({
    name: '',
    description: '',
    color: 'bg-blue-600',
    sale_price: 0
  });
  const [newIngredient, setNewIngredient] = useState({
    ingredient_name: '',
    amount: 0,
    unit: 'g',
    category: 'zioło',
    customUnit: ''
  });
  const [ingredientInput, setIngredientInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [allUsedIngredients, setAllUsedIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { ingredients, refreshData } = useIngredients();

  const availableIngredients = Object.keys(ingredients);

  const loadAllUsedIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name');
      
      if (error) {
        console.error('Error loading used ingredients:', error);
      } else {
        const uniqueIngredients = [...new Set(data?.map(item => item.ingredient_name) || [])];
        setAllUsedIngredients(uniqueIngredients);
      }
    } catch (error) {
      console.error('Error loading used ingredients:', error);
    }
  };

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
        .select('ingredient_name, amount, unit, category')
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
        setNewComposition({ name: '', description: '', color: 'bg-blue-600', sale_price: 0 });
        console.log('Composition created successfully');
        if (onDataChange) {
          await onDataChange();
        }
      }
    } catch (error) {
      console.error('Error creating composition:', error);
    }
  };

  const updateComposition = async (compositionId: string, updates: Partial<Composition>) => {
    try {
      const { error } = await supabase
        .from('compositions')
        .update(updates)
        .eq('id', compositionId);

      if (error) {
        console.error('Error updating composition:', error);
      } else {
        setCompositions(prev => prev.map(comp => 
          comp.id === compositionId ? { ...comp, ...updates } : comp
        ));
        setEditingComposition(null);
        console.log('Composition updated successfully');
        if (onDataChange) {
          await onDataChange();
        }
      }
    } catch (error) {
      console.error('Error updating composition:', error);
    }
  };

  const updateIngredientInComposition = async (oldName: string, amount: number, unit: string) => {
    try {
      const { error } = await supabase
        .from('composition_ingredients')
        .update({ amount, unit })
        .eq('composition_id', selectedComposition)
        .eq('ingredient_name', oldName);

      if (error) {
        console.error('Error updating ingredient:', error);
      } else {
        loadCompositionIngredients(selectedComposition);
        setEditingIngredient(null);
        console.log('Ingredient updated successfully');
        if (onDataChange) {
          await onDataChange();
        }
      }
    } catch (error) {
      console.error('Error updating ingredient:', error);
    }
  };

  const addIngredientToComposition = async () => {
    const ingredientName = ingredientInput || newIngredient.ingredient_name;
    if (!selectedComposition || !ingredientName || newIngredient.amount <= 0) return;

    let unit = newIngredient.unit;
    if (newIngredient.category === 'olejek') {
      unit = 'krople';
    } else if (newIngredient.category === 'zioło') {
      unit = 'g';
    } else if (newIngredient.category === 'inne') {
      unit = newIngredient.customUnit;
    }

    try {
      const { error } = await supabase
        .from('composition_ingredients')
        .insert([{
          composition_id: selectedComposition,
          ingredient_name: ingredientName,
          amount: newIngredient.amount,
          unit: unit,
          category: newIngredient.category
        }]);

      if (error) {
        console.error('Error adding ingredient:', error);
      } else {
        loadCompositionIngredients(selectedComposition);
        loadAllUsedIngredients();
        setNewIngredient({ ingredient_name: '', amount: 0, unit: 'g', category: 'zioło', customUnit: '' });
        setIngredientInput('');
        setShowDropdown(false);
        console.log('Ingredient added successfully');
        if (onDataChange) {
          await onDataChange();
        }
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
        if (onDataChange) {
          await onDataChange();
        }
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
        if (onDataChange) {
          await onDataChange();
        }
      }
    } catch (error) {
      console.error('Error deleting composition:', error);
    }
  };

  const calculateNetPrice = (grossPrice: number) => {
    return grossPrice / (1 + VAT_RATE);
  };

  const calculateGrossPrice = (netPrice: number) => {
    return netPrice * (1 + VAT_RATE);
  };

  const filteredIngredients = [...new Set([...availableIngredients, ...allUsedIngredients])]
    .filter(ingredient => ingredient.toLowerCase().includes(ingredientInput.toLowerCase()));

  useEffect(() => {
    loadCompositions();
    loadAllUsedIngredients();
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div>
              <Label htmlFor="sale_price">Cena sprzedaży brutto (zł)</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                min="0"
                value={newComposition.sale_price}
                onChange={(e) => setNewComposition(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
              {newComposition.sale_price > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Netto: {calculateNetPrice(newComposition.sale_price).toFixed(2)} zł
                  <br />
                  VAT (23%): {(newComposition.sale_price - calculateNetPrice(newComposition.sale_price)).toFixed(2)} zł
                </div>
              )}
            </div>
            <div className="flex items-end">
              <Button onClick={createComposition} className="w-full" disabled={!newComposition.name}>
                <Plus className="w-4 h-4 mr-2" />
                Utwórz Zestaw
              </Button>
            </div>
          </div>
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
                        {comp.name} - {comp.sale_price.toFixed(2)} zł brutto ({calculateNetPrice(comp.sale_price).toFixed(2)} zł netto)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedComposition && (
              <div className="space-y-4">
                {/* Edycja danych zestawu */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Dane zestawu</h4>
                  {compositions.filter(comp => comp.id === selectedComposition).map(comp => (
                    <div key={comp.id} className="space-y-3">
                      {editingComposition === comp.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div>
                            <Label>Nazwa</Label>
                            <Input
                              value={editingCompositionData.name}
                              onChange={(e) => setEditingCompositionData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Opis</Label>
                            <Input
                              value={editingCompositionData.description}
                              onChange={(e) => setEditingCompositionData(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Kolor</Label>
                            <Select
                              value={editingCompositionData.color}
                              onValueChange={(value) => setEditingCompositionData(prev => ({ ...prev, color: value }))}
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
                          <div>
                            <Label>Cena sprzedaży brutto (zł)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingCompositionData.sale_price}
                              onChange={(e) => setEditingCompositionData(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
                            />
                            {editingCompositionData.sale_price > 0 && (
                              <div className="text-xs text-gray-600 mt-1">
                                Netto: {calculateNetPrice(editingCompositionData.sale_price).toFixed(2)} zł
                              </div>
                            )}
                          </div>
                          <div className="flex items-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateComposition(comp.id, editingCompositionData)}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Zapisz
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingComposition(null)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Anuluj
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-4 h-4 rounded ${comp.color}`}></div>
                            <div>
                              <span className="font-medium">{comp.name}</span>
                              {comp.description && <span className="text-gray-600 ml-2">- {comp.description}</span>}
                            </div>
                            <div className="flex flex-col">
                              <Badge variant="secondary">{comp.sale_price.toFixed(2)} zł brutto</Badge>
                              <Badge variant="outline" className="text-xs mt-1">{calculateNetPrice(comp.sale_price).toFixed(2)} zł netto</Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingComposition(comp.id);
                              setEditingCompositionData({
                                name: comp.name,
                                description: comp.description || '',
                                color: comp.color,
                                sale_price: comp.sale_price || 0
                              });
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edytuj
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

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
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Kategoria</Label>
                    <Select
                      value={newIngredient.category}
                      onValueChange={(value) => setNewIngredient(prev => ({ 
                        ...prev, 
                        category: value,
                        unit: value === 'olejek' ? 'krople' : value === 'zioło' ? 'g' : prev.unit,
                        customUnit: value === 'inne' ? 'szt.' : ''
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
                  <div className="relative">
                    <Label>Składnik</Label>
                    <Input
                      value={ingredientInput}
                      onChange={(e) => {
                        setIngredientInput(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Wpisz lub wybierz składnik"
                    />
                    {showDropdown && filteredIngredients.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                        {filteredIngredients.map(ingredient => (
                          <div
                            key={ingredient}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              setIngredientInput(ingredient);
                              setShowDropdown(false);
                            }}
                          >
                            {ingredient}
                          </div>
                        ))}
                      </div>
                    )}
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
                    {newIngredient.category === 'inne' ? (
                      <Select
                        value={newIngredient.customUnit}
                        onValueChange={(value) => setNewIngredient(prev => ({ ...prev, customUnit: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz jednostkę" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="szt.">szt.</SelectItem>
                          <SelectItem value="kpl.">kpl.</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={newIngredient.unit}
                        disabled
                        className="bg-gray-100"
                      />
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={addIngredientToComposition}
                      disabled={!ingredientInput || newIngredient.amount <= 0 || (newIngredient.category === 'inne' && !newIngredient.customUnit)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Składniki w zestawie ({compositionIngredients.length}):</h4>
                  {compositionIngredients.length === 0 ? (
                    <p className="text-gray-500 text-sm">Brak składników w tym zestawie</p>
                  ) : (
                    compositionIngredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ingredient.ingredient_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {ingredient.category}
                          </Badge>
                          {editingIngredient === ingredient.ingredient_name ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editingData.amount}
                                onChange={(e) => setEditingData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                className="w-20"
                              />
                              <Input
                                value={editingData.unit}
                                onChange={(e) => setEditingData(prev => ({ ...prev, unit: e.target.value }))}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                onClick={() => updateIngredientInComposition(ingredient.ingredient_name, editingData.amount, editingData.unit)}
                              >
                                Zapisz
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingIngredient(null)}
                              >
                                Anuluj
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline">
                              {ingredient.amount} {ingredient.unit}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingIngredient !== ingredient.ingredient_name && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingIngredient(ingredient.ingredient_name);
                                setEditingData({ amount: ingredient.amount, unit: ingredient.unit });
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeIngredientFromComposition(ingredient.ingredient_name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
