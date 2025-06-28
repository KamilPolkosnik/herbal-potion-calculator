
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Package, User, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSales, BuyerData } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';

interface Composition {
  id: string;
  name: string;
  sale_price: number;
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
  const [availabilityCheck, setAvailabilityCheck] = useState<{available: boolean; missingIngredients: string[]} | null>(null);
  const [buyerData, setBuyerData] = useState<BuyerData>({});
  const { processSale, checkIngredientAvailability } = useSales();
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

  // Check ingredient availability when composition or quantity changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (selectedComposition && quantity > 0) {
        try {
          const result = await checkIngredientAvailability(selectedComposition, quantity);
          setAvailabilityCheck(result);
        } catch (error) {
          console.error('Error checking availability:', error);
          setAvailabilityCheck({ available: false, missingIngredients: ['Błąd sprawdzania dostępności'] });
        }
      } else {
        setAvailabilityCheck(null);
      }
    };

    checkAvailability();
  }, [selectedComposition, quantity, checkIngredientAvailability]);

  const handleSale = async () => {
    if (!selectedComposition || quantity <= 0 || customPrice < 0) {
      toast({
        title: "Błąd",
        description: "Wybierz zestaw, podaj prawidłową ilość i cenę",
        variant: "destructive",
      });
      return;
    }

    if (!availabilityCheck?.available) {
      toast({
        title: "Błąd",
        description: "Niewystarczające składniki do realizacji sprzedaży",
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
      setAvailabilityCheck(null);

      // Notify parent component of data change
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się zarejestrować sprzedaży",
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
      {/* Dane kupującego - przeniesione na górę */}
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

            {/* Szczegółowy adres */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Adres</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="buyer_street">Ulica</Label>
                  <Input
                    id="buyer_street"
                    value={buyerData.street || ''}
                    onChange={(e) => handleBuyerDataChange('street', e.target.value)}
                    placeholder="ul. Przykładowa"
                  />
                </div>
                <div>
                  <Label htmlFor="buyer_house_number">Nr domu</Label>
                  <Input
                    id="buyer_house_number"
                    value={buyerData.house_number || ''}
                    onChange={(e) => handleBuyerDataChange('house_number', e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="buyer_apartment_number">Nr mieszkania</Label>
                  <Input
                    id="buyer_apartment_number"
                    value={buyerData.apartment_number || ''}
                    onChange={(e) => handleBuyerDataChange('apartment_number', e.target.value)}
                    placeholder="45"
                  />
                </div>
                <div>
                  <Label htmlFor="buyer_postal_code">Kod pocztowy</Label>
                  <Input
                    id="buyer_postal_code"
                    value={buyerData.postal_code || ''}
                    onChange={(e) => handleBuyerDataChange('postal_code', e.target.value)}
                    placeholder="00-000"
                  />
                </div>
                <div>
                  <Label htmlFor="buyer_city">Miasto</Label>
                  <Input
                    id="buyer_city"
                    value={buyerData.city || ''}
                    onChange={(e) => handleBuyerDataChange('city', e.target.value)}
                    placeholder="Warszawa"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprzedaż zestawów */}
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

            {/* Sprawdzenie dostępności składników */}
            {availabilityCheck && (
              <div className={`p-4 rounded-lg ${availabilityCheck.available ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`flex items-center gap-2 ${availabilityCheck.available ? 'text-green-800' : 'text-red-800'}`}>
                  {availabilityCheck.available ? (
                    <>
                      <Package className="w-4 h-4" />
                      <span className="font-medium">Składniki dostępne</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Niewystarczające składniki:</span>
                    </>
                  )}
                </div>
                {!availabilityCheck.available && (
                  <ul className="mt-2 text-red-700 text-sm list-disc list-inside">
                    {availabilityCheck.missingIngredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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
              disabled={!selectedComposition || quantity <= 0 || processing || customPrice < 0 || !availabilityCheck?.available}
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
