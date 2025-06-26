
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSales } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';

interface Composition {
  id: string;
  name: string;
  sale_price: number;
}

interface CompositionIngredient {
  ingredient_name: string;
  amount: number;
  unit: string;
}

interface SalesManagerProps {
  onDataChange?: () => void | Promise<void>;
}

const SalesManager: React.FC<SalesManagerProps> = ({ onDataChange }) => {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [selectedComposition, setSelectedComposition] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { processSale } = useSales();
  const { toast } = useToast();

  const loadCompositions = async () => {
    try {
      const { data, error } = await supabase
        .from('compositions')
        .select('id, name, sale_price')
        .order('name');

      if (error) throw error;
      setCompositions(data || []);
    } catch (error) {
      console.error('Error loading compositions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompositions();
  }, []);

  const handleSale = async () => {
    if (!selectedComposition || quantity <= 0) {
      toast({
        title: "Błąd",
        description: "Wybierz zestaw i podaj prawidłową ilość",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Get composition details
      const composition = compositions.find(c => c.id === selectedComposition);
      if (!composition) throw new Error('Nie znaleziono zestawu');

      // Get composition ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name, amount, unit')
        .eq('composition_id', selectedComposition);

      if (ingredientsError) throw ingredientsError;

      if (!ingredients || ingredients.length === 0) {
        toast({
          title: "Błąd",
          description: "Wybrany zestaw nie ma składników",
          variant: "destructive",
        });
        return;
      }

      // Process the sale
      await processSale(
        selectedComposition,
        composition.name,
        quantity,
        composition.sale_price || 0,
        ingredients.map(ing => ({
          name: ing.ingredient_name,
          amount: ing.amount,
          unit: ing.unit
        }))
      );

      toast({
        title: "Sukces",
        description: `Sprzedaż ${quantity}x ${composition.name} została zarejestrowana`,
      });

      // Reset form
      setSelectedComposition('');
      setQuantity(1);

      // Notify parent component of data change
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zarejestrować sprzedaży",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie zestawów...</div>
      </div>
    );
  }

  const selectedComp = compositions.find(c => c.id === selectedComposition);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Sprzedaż Zestawów
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="composition">Wybierz zestaw</Label>
              <Select value={selectedComposition} onValueChange={setSelectedComposition}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz zestaw do sprzedaży" />
                </SelectTrigger>
                <SelectContent>
                  {compositions.map((composition) => (
                    <SelectItem key={composition.id} value={composition.id}>
                      {composition.name} - {composition.sale_price?.toFixed(2) || '0.00'} zł
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Ilość</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Ilość sztuk"
              />
            </div>

            {selectedComp && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Podsumowanie sprzedaży:</h4>
                <div className="text-blue-700">
                  <p>Zestaw: {selectedComp.name}</p>
                  <p>Cena jednostkowa: {selectedComp.sale_price?.toFixed(2) || '0.00'} zł</p>
                  <p>Ilość: {quantity} szt.</p>
                  <p className="font-semibold">
                    Łączna wartość: {((selectedComp.sale_price || 0) * quantity).toFixed(2)} zł
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSale} 
              disabled={!selectedComposition || quantity <= 0 || processing}
              className="w-full"
            >
              <Package className="w-4 h-4 mr-2" />
              {processing ? 'Przetwarzanie...' : 'Zarejestruj Sprzedaż'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesManager;
