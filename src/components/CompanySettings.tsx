
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Building, Save } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';

const CompanySettings: React.FC = () => {
  const { settings, loading, updateSettings } = useCompanySettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_tax_id: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    bank_account: '',
    bank_name: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_tax_id: settings.company_tax_id || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_website: settings.company_website || '',
        bank_account: settings.bank_account || '',
        bank_name: settings.bank_name || ''
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(formData);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Ustawienia Firmy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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

          <div>
            <Label htmlFor="company_address">Adres Firmy</Label>
            <Textarea
              id="company_address"
              value={formData.company_address}
              onChange={(e) => handleChange('company_address', e.target.value)}
              placeholder="ul. Przykładowa 123, 00-000 Warszawa"
              rows={3}
            />
          </div>

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

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !formData.company_name}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanySettings;
