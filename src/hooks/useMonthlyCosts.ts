
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MonthlyCost {
  id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  cost_month: number;
  cost_year: number;
  created_at: string;
  updated_at: string;
}

export const useMonthlyCosts = () => {
  const [costs, setCosts] = useState<MonthlyCost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCosts = async (year?: number, month?: number) => {
    try {
      setLoading(true);
      let query = supabase
        .from('monthly_costs')
        .select('*')
        .order('cost_year', { ascending: false })
        .order('cost_month', { ascending: false })
        .order('created_at', { ascending: false });

      if (year) {
        query = query.eq('cost_year', year);
      }
      if (month) {
        query = query.eq('cost_month', month);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching costs:', error);
        toast({
          title: 'Błąd',
          description: 'Nie udało się pobrać kosztów',
          variant: 'destructive',
        });
        return;
      }

      setCosts(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Błąd',
        description: 'Wystąpił błąd podczas pobierania kosztów',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addCost = async (cost: Omit<MonthlyCost, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('monthly_costs')
        .insert([cost]);

      if (error) {
        console.error('Error adding cost:', error);
        toast({
          title: 'Błąd',
          description: 'Nie udało się dodać kosztu',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sukces',
        description: 'Koszt został dodany pomyślnie',
      });

      await fetchCosts();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Błąd',
        description: 'Wystąpił błąd podczas dodawania kosztu',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateCost = async (id: string, updates: Partial<Omit<MonthlyCost, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase
        .from('monthly_costs')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating cost:', error);
        toast({
          title: 'Błąd',
          description: 'Nie udało się zaktualizować kosztu',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sukces',
        description: 'Koszt został zaktualizowany pomyślnie',
      });

      await fetchCosts();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Błąd',
        description: 'Wystąpił błąd podczas aktualizacji kosztu',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monthly_costs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting cost:', error);
        toast({
          title: 'Błąd',
          description: 'Nie udało się usunąć kosztu',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sukces',
        description: 'Koszt został usunięty pomyślnie',
      });

      await fetchCosts();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Błąd',
        description: 'Wystąpił błąd podczas usuwania kosztu',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  return {
    costs,
    loading,
    fetchCosts,
    addCost,
    updateCost,
    deleteCost,
    refreshCosts: fetchCosts
  };
};
