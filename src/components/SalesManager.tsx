
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, TrendingUp, History, Plus } from 'lucide-react';
import { useCompositions } from '@/hooks/useIngredientCompositions';
import { useSales } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';
import SalesStatistics from './SalesStatistics';
import TransactionsList from './TransactionsList';
import { BuyerData } from '@/hooks/useSales';

const SalesManager: React.FC = () => {
  const { compositions, loading: compositionsLoading } = useCompositions();
  const { processSale, loading: salesLoading, refreshTransactions } = useSales();
  const { toast } = useToast();
  
  const [selectedComposition, setSelectedComposition] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [buyerData, setBuyerData] = useState<BuyerData>({});
  const [activeTab, setActiveTab] = useState('sell');

  const handleCompositionSelect = (compositionId: string) => {
    const composition = compositions.find(c => c.id === compositionId);
    if (composition) {
      setSelectedComposition(compositionId);
      setUnitPrice(composition.price || 0);
    }
  };

  const handleSale = async () => {
    if (!selectedComposition) {
      toast({
        title: "Błąd",
        description: "Wybierz zestaw do sprzedaży",
        variant: "destructive",
      });
      return;
    }

    const composition = compositions.find(c => c.id === selectedComposition);
    if (!composition) return;

    try {
      await processSale(
        composition.id,
        composition.name,
        quantity,
        unitPrice,
        composition.ingredients || [],
        buyerData
      );

      toast({
        title: "Sukces",
        description: `Sprzedano ${quantity} x ${composition.name}`,
      });

      // Reset form
      setSelectedComposition('');
      setQuantity(1);
      setUnitPrice(0);
      setBuyerData({});
      
      // Switch to statistics tab to see updated data
      setActiveTab('statistics');
    } catch (error) {
      console.error('Sale error:', error);
      toast({
        title: "Błąd sprzedaży",
        description: error instanceof Error ? error.message : "Nie udało się przetworzyć sprzedaży",
        variant: "destructive",
      });
    }
  };

  const handleDataChange = async () => {
    await refreshTransactions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Zarządzanie Sprzedażą</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sell" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Sprzedaż
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Statystyki
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sell">
          <Card>
            <CardHeader>
              <CardTitle>Nowa Sprzedaż</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dane Produktu</h3>
                  
                  <div>
                    <Label htmlFor="composition">Wybierz Zestaw</Label>
                    <Select value={selectedComposition} onValueChange={handleCompositionSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz zestaw..." />
                      </SelectTrigger>
                      <SelectContent>
                        {compositions.map(composition => (
                          <SelectItem key={composition.id} value={composition.id}>
                            {composition.name} - {composition.price?.toFixed(2)} zł
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="unitPrice">Cena jednostkowa (zł)</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold">
                      Łączna kwota: {(quantity * unitPrice).toFixed(2)} zł
                    </div>
                  </div>
                </div>

                {/* Buyer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dane Kupującego (opcjonalne)</h3>
                  
                  <div>
                    <Label htmlFor="buyerName">Nazwa/Imię i nazwisko</Label>
                    <Input
                      id="buyerName"
                      value={buyerData.name || ''}
                      onChange={(e) => setBuyerData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nazwa firmy lub imię i nazwisko"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buyerEmail">Email</Label>
                      <Input
                        id="buyerEmail"
                        type="email"
                        value={buyerData.email || ''}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerPhone">Telefon</Label>
                      <Input
                        id="buyerPhone"
                        value={buyerData.phone || ''}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="123-456-789"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="buyerTaxId">NIP (opcjonalnie)</Label>
                    <Input
                      id="buyerTaxId"
                      value={buyerData.tax_id || ''}
                      onChange={(e) => setBuyerData(prev => ({ ...prev, tax_id: e.target.value }))}
                      placeholder="123-456-78-90"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buyerStreet">Ulica</Label>
                      <Input
                        id="buyerStreet"
                        value={buyerData.street || ''}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="ul. Przykładowa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerHouseNumber">Nr domu</Label>
                      <Input
                        id="buyerHouseNumber"
                        value={buyerData.house_number || ''}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, house_number: e.target.value }))}
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="buyerApartmentNumber">Nr mieszkania</Label>
                      <Input
                        id="buyerApartmentNumber"
                        value={buyerData.apartment_number || ''}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, apartment_number: e.target.value }))}
                        placeholder="45"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerPostalCode">Kod pocztowy</Label>
                      <Input
                        id="buyerPostalCode"
                        value={buyerData.postal_code || ''}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, postal_code: e.target.value }))}
                        placeholder="00-000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerCity">Miasto</Label>
                      <Input
                        id="buyerCity"
                        value={buyerData.city || ''}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Warszawa"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSale} 
                  disabled={!selectedComposition || salesLoading}
                  size="lg"
                >
                  {salesLoading ? 'Przetwarzanie...' : 'Potwierdź Sprzedaż'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <SalesStatistics onRefresh={handleDataChange} />
        </TabsContent>

        <TabsContent value="history">
          <TransactionsList onDataChange={handleDataChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesManager;
