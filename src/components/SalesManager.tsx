import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShoppingCart, Package, User, AlertTriangle, Trash2, Plus, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSales, BuyerData } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';
import { convertToBaseUnit, areUnitsCompatible } from '@/utils/unitConverter';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Composition {
  id: string;
  name: string;
  sale_price: number;
}

interface CartItem {
  id: string;
  compositionId: string;
  compositionName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  availabilityCheck: { available: boolean; missingIngredients: string[] } | null;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerData, setBuyerData] = useState<BuyerData>({});
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const { processSale, processCartSale, checkIngredientAvailability } = useSales();
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

  // Enhanced availability check that considers current cart contents with proper unit conversion
  const checkAvailabilityWithCart = async (compositionId: string, newQuantity: number) => {
    try {
      console.log('Sprawdzanie dostępności dla:', compositionId, 'ilość:', newQuantity);

      // Get current ingredient amounts from database
      const { data: currentIngredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('name, amount, unit');

      if (ingredientsError) throw ingredientsError;

      // Get composition ingredients with their units
      const { data: compositionIngredients, error: compositionError } = await supabase
        .from('composition_ingredients')
        .select('ingredient_name, amount, unit')
        .eq('composition_id', compositionId);

      if (compositionError) throw compositionError;

      if (!compositionIngredients || compositionIngredients.length === 0) {
        return { available: false, missingIngredients: ['Brak składników w zestawie'] };
      }

      // Create a map of current ingredient amounts with their units
      const availableAmounts: Record<string, { amount: number; unit: string }> = {};
      currentIngredients?.forEach(ingredient => {
        availableAmounts[ingredient.name] = {
          amount: ingredient.amount,
          unit: ingredient.unit
        };
      });

      // Calculate total usage from CURRENT cart items in base units
      const totalUsageFromCart: Record<string, number> = {};
      
      // Sum up usage from existing cart items, converting to base units
      cart.forEach(cartItem => {
        cartItem.ingredients.forEach(ingredient => {
          const amountInBaseUnit = convertToBaseUnit(ingredient.amount, ingredient.unit);
          const totalUsedInBaseUnit = amountInBaseUnit * cartItem.quantity;
          totalUsageFromCart[ingredient.name] = (totalUsageFromCart[ingredient.name] || 0) + totalUsedInBaseUnit;
        });
      });

      // NAPRAWKA: Sprawdź każdy składnik wymaganego zestawu
      const missingIngredients: string[] = [];

      for (const ingredient of compositionIngredients) {
        const requiredAmountInBaseUnit = convertToBaseUnit(ingredient.amount, ingredient.unit);
        const requiredForNewItemInBaseUnit = requiredAmountInBaseUnit * newQuantity;
        const currentUsageFromCartInBaseUnit = totalUsageFromCart[ingredient.ingredient_name] || 0;
        const totalRequiredInBaseUnit = currentUsageFromCartInBaseUnit + requiredForNewItemInBaseUnit;
        
        const availableData = availableAmounts[ingredient.ingredient_name];
        
        if (!availableData) {
          missingIngredients.push(`${ingredient.ingredient_name} (składnik nie istnieje w bazie)`);
          continue;
        }

        // Check if units are compatible
        if (!areUnitsCompatible(availableData.unit, ingredient.unit)) {
          console.warn(`Niezgodność jednostek dla ${ingredient.ingredient_name}: dostępne w ${availableData.unit}, wymagane w ${ingredient.unit}`);
          missingIngredients.push(
            `${ingredient.ingredient_name} (niezgodność jednostek: ${availableData.unit} vs ${ingredient.unit})`
          );
          continue;
        }

        const availableAmountInBaseUnit = convertToBaseUnit(availableData.amount, availableData.unit);

        console.log(`Sprawdzanie składnika ${ingredient.ingredient_name}:`, {
          availableAmount: availableData.amount,
          availableUnit: availableData.unit,
          availableInBaseUnit: availableAmountInBaseUnit,
          requiredAmount: ingredient.amount,
          requiredUnit: ingredient.unit,
          requiredInBaseUnit: requiredAmountInBaseUnit,
          currentUsageFromCart: currentUsageFromCartInBaseUnit,
          requiredForNewItem: requiredForNewItemInBaseUnit,
          totalRequired: totalRequiredInBaseUnit,
          willExceed: totalRequiredInBaseUnit > availableAmountInBaseUnit
        });

        if (totalRequiredInBaseUnit > availableAmountInBaseUnit) {
          const shortageInBaseUnit = totalRequiredInBaseUnit - availableAmountInBaseUnit;
          const reservedInBaseUnit = currentUsageFromCartInBaseUnit;
          
          // Format shortage information more clearly, including reservation info
          let messageText = `${ingredient.ingredient_name}: dostępne ${availableData.amount}${availableData.unit}`;
          
          if (reservedInBaseUnit > 0) {
            if (ingredient.unit.toLowerCase().includes('krople') || ingredient.unit.toLowerCase().includes('kropli')) {
              const reservedInDrops = Math.ceil(reservedInBaseUnit * 20);
              messageText += `, w rezerwacji ${reservedInDrops} kropli`;
            } else {
              messageText += `, w rezerwacji ${reservedInBaseUnit.toFixed(2)}${availableData.unit}`;
            }
          }
          
          if (ingredient.unit.toLowerCase().includes('krople') || ingredient.unit.toLowerCase().includes('kropli')) {
            const shortageInDrops = Math.ceil(shortageInBaseUnit * 20);
            messageText += `, brakuje jeszcze ${shortageInDrops} kropli`;
          } else {
            messageText += `, brakuje jeszcze ${shortageInBaseUnit.toFixed(2)}${availableData.unit}`;
          }
          
          missingIngredients.push(messageText);
        }
      }

      const isAvailable = missingIngredients.length === 0;
      console.log('Wynik sprawdzania dostępności:', { isAvailable, missingIngredients });

      return {
        available: isAvailable,
        missingIngredients
      };
    } catch (error) {
      console.error('Error checking availability with cart:', error);
      return { available: false, missingIngredients: ['Błąd sprawdzania dostępności'] };
    }
  };

  const addToCart = async () => {
    if (!selectedComposition || quantity <= 0 || customPrice < 0) {
      toast({
        title: "Błąd",
        description: "Wybierz zestaw, podaj prawidłową ilość i cenę",
        variant: "destructive",
      });
      return;
    }

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

      // Check ingredient availability considering current cart
      const availabilityCheck = await checkAvailabilityWithCart(selectedComposition, quantity);

      if (!availabilityCheck.available) {
        // Show detailed missing ingredients information
        const missingIngredientsText = availabilityCheck.missingIngredients.join('\n');
        
        toast({
          title: "Niewystarczające składniki",
          description: `Brakujące składniki:\n${missingIngredientsText}`,
          variant: "destructive",
        });
        
        console.log('Brakujące składniki:', availabilityCheck.missingIngredients);
        return;
      }

      // Create cart item
      const cartItem: CartItem = {
        id: Date.now().toString(), // Simple ID for cart management
        compositionId: selectedComposition,
        compositionName: composition.name,
        quantity,
        unitPrice: customPrice,
        totalPrice: customPrice * quantity,
        ingredients: ingredients.map(ing => ({
          name: ing.ingredient_name,
          amount: ing.amount,
          unit: ing.unit
        })),
        availabilityCheck
      };

      setCart(prev => [...prev, cartItem]);

      // Reset form
      setSelectedComposition('');
      setQuantity(1);
      setCustomPrice(0);

      toast({
        title: "Dodano do koszyka",
        description: `${cartItem.quantity}x ${cartItem.compositionName} dodano do koszyka`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się dodać do koszyka",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    const updatedCart = cart.filter(item => item.id !== cartItemId);
    setCart(updatedCart);
    
    // After removing item, recheck availability for all remaining items
    if (updatedCart.length > 0) {
      const recheckPromises = updatedCart.map(async (item) => {
        // NAPRAWKA: Sprawdź dostępność dla tej pozycji bez siebie samej w koszyku
        const cartWithoutThis = updatedCart.filter(cartItem => cartItem.id !== item.id);
        const tempCart = cart;
        setCart(cartWithoutThis);
        const availability = await checkAvailabilityWithCart(item.compositionId, item.quantity);
        setCart(tempCart);
        return { ...item, availabilityCheck: availability };
      });

      const updatedCartWithAvailability = await Promise.all(recheckPromises);
      setCart(updatedCartWithAvailability);
    }

    toast({
      title: "Usunięto z koszyka",
      description: "Produkt został usunięty z koszyka i dostępność składników została zaktualizowana",
    });
  };

  const getTotalCartValue = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const hasUnavailableItems = () => {
    return cart.some(item => !item.availabilityCheck?.available);
  };

  // Process sale from cart using the new processCartSale function
  const processSaleFromCart = async () => {
    if (cart.length === 0) {
      toast({
        title: "Błąd",
        description: "Koszyk jest pusty",
        variant: "destructive",
      });
      return;
    }

    if (hasUnavailableItems()) {
      toast({
        title: "Błąd",
        description: "W koszyku są produkty z niewystarczającymi składnikami",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Process entire cart as single transaction with selected sale date
      await processCartSale(
        cart.map(item => ({
          compositionId: item.compositionId,
          compositionName: item.compositionName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          ingredients: item.ingredients
        })),
        buyerData,
        saleDate
      );

      toast({
        title: "Sukces",
        description: `Sprzedaż koszyka z ${cart.length} pozycjami została zarejestrowana jako jedna transakcja`,
      });

      // Clear cart and buyer data
      setCart([]);
      setBuyerData({});

      // Notify parent component of data change
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error('Error processing cart sale:', error);
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
      {/* Data sprzedaży */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Data Sprzedaży
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="sale-date">Wybierz datę sprzedaży</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !saleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {saleDate ? format(saleDate, "dd.MM.yyyy", { locale: pl }) : <span>Wybierz datę</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={saleDate}
                  onSelect={(date) => date && setSaleDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
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

      {/* Dodawanie zestawów do koszyka */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Dodaj Zestaw do Koszyka
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="composition">Wybierz zestaw</Label>
              <Select value={selectedComposition} onValueChange={setSelectedComposition}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz zestaw do dodania" />
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
                <h4 className="font-semibold text-blue-800 mb-2">Podgląd pozycji:</h4>
                <div className="text-blue-700">
                  <p>Zestaw: {selectedComp.name}</p>
                  <p>Cena katalogowa: {selectedComp.sale_price?.toFixed(2) || '0.00'} zł</p>
                  <p>Cena sprzedaży: {customPrice.toFixed(2)} zł</p>
                  <p>Ilość: {quantity} szt.</p>
                  <p className="font-semibold">
                    Wartość pozycji: {(customPrice * quantity).toFixed(2)} zł
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={addToCart} 
              disabled={!selectedComposition || quantity <= 0 || customPrice < 0}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj do Koszyka
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Koszyk */}
      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Koszyk ({cart.length} pozycji)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{item.compositionName}</h4>
                      <p className="text-sm text-gray-600">
                        {item.quantity} szt. × {item.unitPrice.toFixed(2)} zł = {item.totalPrice.toFixed(2)} zł
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Status dostępności składników */}
                  {item.availabilityCheck && (
                    <div className={`p-2 rounded text-sm ${
                      item.availabilityCheck.available 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-red-50 text-red-800'
                    }`}>
                      {item.availabilityCheck.available ? (
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>Składniki dostępne</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="font-medium">Niewystarczające składniki:</span>
                          </div>
                          <ul className="text-xs list-disc list-inside">
                            {item.availabilityCheck.missingIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold mb-2">
                  <span>Łączna wartość:</span>
                  <span>{getTotalCartValue().toFixed(2)} zł</span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Data sprzedaży: {format(saleDate, "dd.MM.yyyy", { locale: pl })}
                </div>
              </div>

              <Button 
                onClick={processSaleFromCart} 
                disabled={cart.length === 0 || processing || hasUnavailableItems()}
                className="w-full"
                size="lg"
              >
                <Package className="w-4 h-4 mr-2" />
                {processing ? 'Przetwarzanie...' : 'Zarejestruj Sprzedaż'}
              </Button>

              {hasUnavailableItems() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">
                      Niektóre produkty w koszyku mają niewystarczające składniki
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesManager;
