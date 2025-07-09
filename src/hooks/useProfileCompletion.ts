import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    } else {
      setIsProfileComplete(null);
      setLoading(false);
    }
  }, [user]);

  const checkProfileCompletion = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, kitchen_equipment, preferred_cuisines')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const hasName = Boolean(data.name?.trim());
        const hasEquipment = Array.isArray(data.kitchen_equipment) && data.kitchen_equipment.length > 0;
        const hasCuisines = Array.isArray(data.preferred_cuisines) && data.preferred_cuisines.length > 0;
        
        setIsProfileComplete(hasName && (hasEquipment || hasCuisines));
      } else {
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setIsProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  return { isProfileComplete, loading, checkProfileCompletion };
};