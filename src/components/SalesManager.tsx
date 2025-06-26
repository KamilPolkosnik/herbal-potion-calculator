import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Package, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSales, BuyerData } from '@/hooks/useSales';
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
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [buyerData, setBuyerData] = useState<BuyerData>({});
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

  const handleBuyerDataChange = (field: keyof BuyerData, value: string) => {
    setBuyerData(prev => ({ ...prev, [field]: value }));
  };

  // Update custom price when composition changes
  useEffect(() => {
    const selectedComp = compositions.find(c => c.id === selectedComposition);
    if (selectedComp) {
      setCustomPrice(selectedComp.sale_price || 0);
    }
  }, [selectedComposition, compositions]);

  const handleSale = async () => {
    if (!selectedComposition || quantity <= 0 || customPrice < 0) {
      toast({
        title: "Błąd",
        description: "Wybierz zestaw, podaj prawidłową ilość i cenę",
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

      // Process the sale with custom price and buyer data
      await processSale(
        selectedComposition,
        composition.name,
        quantity,
        customPrice,
        ingredients.map(ing => ({
          name: ing.ingredient_name,
          amount: ing.amount,
          unit: ing.unit
        })),
        buyerData
      );

      toast({
        title: "Sukces",
        description: `Sprzedaż ${quantity}x ${composition.name} została zarejestrowana`,
      });

      // Reset form
      setSelectedComposition('');
      setQuantity(1);
      setCustomPrice(0);
      setBuyerData({});

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

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="price">Cena jednostkowa (zł)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Cena za sztukę"
                />
              </div>
            </div>

            {selectedComp && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Podsumowanie sprzedaży:</h4>
                <div className="text-blue-700">
                  <p>Zestaw: {selectedComp.name}</p>
                  <p>Cena katalogowa: {selectedComp.sale_price?.toFixed(2) || '0.00'} zł</p>
                  <p>Cena sprzedaży: {customPrice.toFixed(2)} zł</p>
                  <p>Ilość: {quantity} szt.</p>
                  <p className="font-semibold">
                    Łączna wartość: {(customPrice * quantity).toFixed(2)} zł
                  </p>
                  {customPrice !== (selectedComp.sale_price || 0) && (
                    <p className="text-orange-600 font-medium">
                      {customPrice > (selectedComp.sale_price || 0) ? '↑ Cena wyższa' : '↓ Promocja'}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button 
              onClick={handleSale} 
              disabled={!selectedComposition || quantity <= 0 || processing || customPrice < 0}
              className="w-full"
            >
              <Package className="w-4 h-4 mr-2" />
              {processing ? 'Przetwarzanie...' : 'Zarejestruj Sprzedaż'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dane kupującego */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Dane Kupującego (opcjonalne)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyer_name">Nazwa/Imię i nazwisko</Label>
                <Input
                  id="buyer_name"
                  value={buyerData.name || ''}
                  onChange={(e) => handleBuyerDataChange('name', e.target.value)}
                  placeholder="Jan Kowalski / Firma ABC"
                />
              </div>
              <div>
                <Label htmlFor="buyer_tax_id">NIP (dla firm)</Label>
                <Input
                  id="buyer_tax_id"
                  value={buyerData.tax_id || ''}
                  onChange={(e) => handleBuyerDataChange('tax_id', e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buyer_address">Adres</Label>
              <Textarea
                id="buyer_address"
                value={buyerData.address || ''}
                onChange={(e) => handleBuyerDataChange('address', e.target.value)}
                placeholder="ul. Przykładowa 123, 00-000 Warszawa"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyer_email">Email</Label>
                <Input
                  id="buyer_email"
                  type="email"
                  value={buyerData.email || ''}
                  onChange={(e) => handleBuyerDataChange('email', e.target.value)}
                  placeholder="jan@example.com"
                />
              </div>
              <div>
                <Label htmlFor="buyer_phone">Telefon</Label>
                <Input
                  id="buyer_phone"
                  value={buyerData.phone || ''}
                  onChange={(e) => handleBuyerDataChange('phone', e.target.value)}
                  placeholder="+48 123 456 789"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesManager;
