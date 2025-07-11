
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Building, Save, Users, MapPin, FileBarChart } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import WarningThresholdSettings from './WarningThresholdSettings';

const CompanySettings: React.FC = () => {
  const { settings, loading, updateSettings, refreshSettings } = useCompanySettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    company_name: '',
    company_street: '',
    company_house_number: '',
    company_apartment_number: '',
    company_postal_code: '',
    company_city: '',
    company_tax_id: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    bank_account: '',
    bank_name: '',
    show_ues_generator: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      // Parse existing address if it exists
      const addressParts = settings.company_address?.split(', ') || [];
      let street = '', houseNumber = '', apartmentNumber = '', postalCode = '', city = '';
      
      if (addressParts.length > 0) {
        const streetPart = addressParts[0];
        if (streetPart.includes(' ')) {
          const parts = streetPart.split(' ');
          street = parts.slice(0, -1).join(' ');
          const numberPart = parts[parts.length - 1];
          if (numberPart.includes('/')) {
            [houseNumber, apartmentNumber] = numberPart.split('/');
          } else {
            houseNumber = numberPart;
          }
        } else {
          street = streetPart;
        }
      }
      
      if (addressParts.length > 1) {
        const cityPart = addressParts[1];
        if (cityPart.includes(' ')) {
          const parts = cityPart.split(' ');
          postalCode = parts[0];
          city = parts.slice(1).join(' ');
        } else {
          city = cityPart;
        }
      }

      setFormData({
        company_name: settings.company_name || '',
        company_street: street,
        company_house_number: houseNumber,
        company_apartment_number: apartmentNumber,
        company_postal_code: postalCode,
        company_city: city,
        company_tax_id: settings.company_tax_id || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_website: settings.company_website || '',
        bank_account: settings.bank_account || '',
        bank_name: settings.bank_name || '',
        show_ues_generator: settings.show_ues_generator
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build full address from components
      let fullAddress = '';
      if (formData.company_street || formData.company_house_number || formData.company_city) {
        const addressParts = [];
        if (formData.company_street) {
          let streetPart = formData.company_street;
          if (formData.company_house_number) {
            streetPart += ` ${formData.company_house_number}`;
            if (formData.company_apartment_number) {
              streetPart += `/${formData.company_apartment_number}`;
            }
          }
          addressParts.push(streetPart);
        }
        if (formData.company_postal_code && formData.company_city) {
          addressParts.push(`${formData.company_postal_code} ${formData.company_city}`);
        } else if (formData.company_city) {
          addressParts.push(formData.company_city);
        }
        fullAddress = addressParts.join(', ');
      }

      await updateSettings({
        company_name: formData.company_name,
        company_address: fullAddress,
        company_tax_id: formData.company_tax_id,
        company_phone: formData.company_phone,
        company_email: formData.company_email,
        company_website: formData.company_website,
        bank_account: formData.bank_account,
        bank_name: formData.bank_name,
        show_ues_generator: formData.show_ues_generator
      });

      // Odśwież ustawienia aby zmiana była widoczna od razu w innych komponentach
      await refreshSettings();
      
      toast({
        title: "Sukces",
        description: "Ustawienia firmy zostały zapisane",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać ustawień",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie ustawień...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company">Dane Firmy</TabsTrigger>
          <TabsTrigger value="warnings">Progi Ostrzeżeń</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Ustawienia Firmy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Podstawowe dane firmy */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Podstawowe Dane</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name">Nazwa Firmy *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        placeholder="Nazwa firmy"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_tax_id">NIP</Label>
                      <Input
                        id="company_tax_id"
                        value={formData.company_tax_id}
                        onChange={(e) => handleChange('company_tax_id', e.target.value)}
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                </div>

                {/* Dane adresowe */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Adres Firmy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="company_street">Ulica</Label>
                      <Input
                        id="company_street"
                        value={formData.company_street}
                        onChange={(e) => handleChange('company_street', e.target.value)}
                        placeholder="ul. Przykładowa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_house_number">Nr domu</Label>
                      <Input
                        id="company_house_number"
                        value={formData.company_house_number}
                        onChange={(e) => handleChange('company_house_number', e.target.value)}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="company_apartment_number">Nr mieszkania/lokalu</Label>
                      <Input
                        id="company_apartment_number"
                        value={formData.company_apartment_number}
                        onChange={(e) => handleChange('company_apartment_number', e.target.value)}
                        placeholder="45"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_postal_code">Kod pocztowy</Label>
                      <Input
                        id="company_postal_code"
                        value={formData.company_postal_code}
                        onChange={(e) => handleChange('company_postal_code', e.target.value)}
                        placeholder="00-000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_city">Miasto</Label>
                      <Input
                        id="company_city"
                        value={formData.company_city}
                        onChange={(e) => handleChange('company_city', e.target.value)}
                        placeholder="Warszawa"
                      />
                    </div>
                  </div>
                </div>

                {/* Dane kontaktowe */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Dane Kontaktowe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_phone">Telefon</Label>
                      <Input
                        id="company_phone"
                        value={formData.company_phone}
                        onChange={(e) => handleChange('company_phone', e.target.value)}
                        placeholder="+48 123 456 789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_email">Email</Label>
                      <Input
                        id="company_email"
                        type="email"
                        value={formData.company_email}
                        onChange={(e) => handleChange('company_email', e.target.value)}
                        placeholder="kontakt@firma.pl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company_website">Strona WWW</Label>
                    <Input
                      id="company_website"
                      value={formData.company_website}
                      onChange={(e) => handleChange('company_website', e.target.value)}
                      placeholder="https://www.firma.pl"
                    />
                  </div>
                </div>

                {/* Dane bankowe */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Dane Bankowe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank_name">Nazwa Banku</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) => handleChange('bank_name', e.target.value)}
                        placeholder="Bank Przykładowy"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_account">Numer Konta</Label>
                      <Input
                        id="bank_account"
                        value={formData.bank_account}
                        onChange={(e) => handleChange('bank_account', e.target.value)}
                        placeholder="12 3456 7890 1234 5678 9012 3456"
                      />
                    </div>
                  </div>
                </div>

                {/* Ustawienia aplikacji */}
                {user?.role === 'admin' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Ustawienia Aplikacji</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_ues_generator"
                        checked={formData.show_ues_generator}
                        onCheckedChange={(checked) => handleChange('show_ues_generator', checked)}
                      />
                      <Label htmlFor="show_ues_generator" className="flex items-center gap-2">
                        <FileBarChart className="w-4 h-4" />
                        Wyświetlaj Generator UES w zakładce Podsumowanie
                      </Label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving || !formData.company_name}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="warnings">
          <WarningThresholdSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanySettings;
