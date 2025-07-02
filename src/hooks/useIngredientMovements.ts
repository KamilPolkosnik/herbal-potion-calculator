
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IngredientMovement {
  id: string;
  ingredient_name: string;
  movement_type: 'purchase' | 'sale' | 'reversal' | 'adjustment';
  quantity_change: number;
  unit: string;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_at: string;
  is_archived?: boolean;
}

export const useIngredientMovements = () => {
  const [movements, setMovements] = useState<IngredientMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMovements = async (ingredientName?: string, includeArchived: boolean = false) => {
    try {
      let query = supabase
        .from('ingredient_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (ingredientName) {
        query = query.eq('ingredient_name', ingredientName);
      }

      if (!includeArchived) {
        query = query.or('is_archived.is.null,is_archived.eq.false');
      }

      const { data, error } = await query;
      if (error) throw error;

      setMovements(data || []);
    } catch (error) {
      console.error('Error loading ingredient movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordMovement = async (
    ingredientName: string,
    movementType: 'purchase' | 'sale' | 'reversal' | 'adjustment',
    quantityChange: number,
    unit: string,
    referenceId?: string,
    referenceType?: string,
    notes?: string
  ) => {
    try {
      console.log('Recording movement:', {
        ingredientName,
        movementType,
        quantityChange,
        unit,
        referenceId,
        referenceType,
        notes
      });

      const { error } = await supabase
        .from('ingredient_movements')
        .insert({
          ingredient_name: ingredientName,
          movement_type: movementType,
          quantity_change: quantityChange,
          unit: unit,
          reference_id: referenceId,
          reference_type: referenceType,
          notes: notes
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording ingredient movement:', error);
      throw error;
    }
  };

  const archiveMovement = async (movementId: string) => {
    try {
      const { error } = await supabase
        .from('ingredient_movements')
        .update({ is_archived: true })
        .eq('id', movementId);

      if (error) throw error;
    } catch (error) {
      console.error('Error archiving movement:', error);
      throw error;
    }
  };

  const unarchiveMovement = async (movementId: string) => {
    try {
      const { error } = await supabase
        .from('ingredient_movements')
        .update({ is_archived: false })
        .eq('id', movementId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unarchiving movement:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  return {
    movements,
    loading,
    loadMovements,
    recordMovement,
    archiveMovement,
    unarchiveMovement,
    refreshMovements: loadMovements
  };
};
