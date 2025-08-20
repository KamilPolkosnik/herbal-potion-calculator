
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanySettings {
  id: string;
  company_name: string;
  company_address: string | null;
  company_tax_id: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  bank_account: string | null;
  bank_name: string | null;
  show_ues_generator: boolean;
  is_vat_registered: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedSettings: Partial<CompanySettings>) => {
    try {
      if (!settings) return;

      const { data, error } = await supabase
        .from('company_settings')
        .update(updatedSettings)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return data;
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: loadSettings
  };
};
