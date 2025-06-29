
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, AlertCircle } from 'lucide-react';
import { useWarningThresholds } from '@/hooks/useWarningThresholds';
import { useToast } from '@/hooks/use-toast';

const WarningThresholdSettings: React.FC = () => {
  const { thresholds, loading, updateThresholds } = useWarningThresholds();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    herbs_threshold: 0,
    oils_threshold: 0,
    others_threshold: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (thresholds) {
      setFormData({
        herbs_threshold: thresholds.herbs_threshold,
        oils_threshold: thresholds.oils_threshold,
        others_threshold: thresholds.others_threshold
      });
    }
  }, [thresholds]);

  const handleChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateThresholds(formData);
      
      toast({
        title: "Sukces",
        description: "Progi ostrzeżeń zostały zapisane",
      });
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać progów ostrzeżeń",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Ładowanie progów ostrzeżeń...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Progi Ostrzeżeń Składników
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Ustaw minimalne ilości składników, poniżej których będą wyświetlane ostrzeżenia w zakładce "Składniki".
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="herbs_threshold">Surowce Ziołowe (g)</Label>
              <Input
                id="herbs_threshold"
                type="number"
                min="0"
                step="1"
                value={formData.herbs_threshold}
                onChange={(e) => handleChange('herbs_threshold', parseFloat(e.target.value) || 0)}
                placeholder="np. 50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ostrzeżenie gdy stan składników ziołowych spadnie poniżej tej wartości
              </p>
            </div>

            <div>
              <Label htmlFor="oils_threshold">Olejki Eteryczne (ml)</Label>
              <Input
                id="oils_threshold"
                type="number"
                min="0"
                step="0.1"
                value={formData.oils_threshold}
                onChange={(e) => handleChange('oils_threshold', parseFloat(e.target.value) || 0)}
                placeholder="np. 5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ostrzeżenie gdy stan olejków eterycznych spadnie poniżej tej wartości
              </p>
            </div>

            <div>
              <Label htmlFor="others_threshold">Inne (szt/kpl)</Label>
              <Input
                id="others_threshold"
                type="number"
                min="0"
                step="1"
                value={formData.others_threshold}
                onChange={(e) => handleChange('others_threshold', parseFloat(e.target.value) || 0)}
                placeholder="np. 3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ostrzeżenie gdy stan innych składników spadnie poniżej tej wartości
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Zapisywanie...' : 'Zapisz Progi Ostrzeżeń'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarningThresholdSettings;
