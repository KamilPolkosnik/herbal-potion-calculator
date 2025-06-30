
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WarningThresholds {
  id: string;
  herbs_threshold: number;
  oils_threshold: number;
  others_threshold: number;
  created_at: string;
  updated_at: string;
}

export const useWarningThresholds = () => {
  const [thresholds, setThresholds] = useState<WarningThresholds | null>(null);
  const [loading, setLoading] = useState(true);

  const loadThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from('warning_thresholds')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading warning thresholds:', error);
        return;
      }
      
      setThresholds(data);
    } catch (error) {
      console.error('Error loading warning thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateThresholds = async (updatedThresholds: { herbs_threshold: number; oils_threshold: number; others_threshold: number }) => {
    try {
      if (!thresholds) {
        // Create new record if none exists
        const { data, error } = await supabase
          .from('warning_thresholds')
          .insert({
            herbs_threshold: updatedThresholds.herbs_threshold,
            oils_threshold: updatedThresholds.oils_threshold,
            others_threshold: updatedThresholds.others_threshold
          })
          .select()
          .single();

        if (error) throw error;
        setThresholds(data);
        return data;
      } else {
        // Update existing record
        const { data, error } = await supabase
          .from('warning_thresholds')
          .update(updatedThresholds)
          .eq('id', thresholds.id)
          .select()
          .single();

        if (error) throw error;
        setThresholds(data);
        return data;
      }
    } catch (error) {
      console.error('Error updating warning thresholds:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadThresholds();
  }, []);

  return {
    thresholds,
    loading,
    updateThresholds,
    refreshThresholds: loadThresholds,
    // Default values if no thresholds are set
    getThreshold: (type: 'herbs' | 'oils' | 'others') => {
      if (!thresholds) return 0;
      switch (type) {
        case 'herbs': return thresholds.herbs_threshold;
        case 'oils': return thresholds.oils_threshold;
        case 'others': return thresholds.others_threshold;
        default: return 0;
      }
    }
  };
};
