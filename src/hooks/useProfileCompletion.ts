import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [isPreferencesComplete, setIsPreferencesComplete] = useState<boolean | null>(null);
  const [isPersonalProfileComplete, setIsPersonalProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    } else {
      setIsProfileComplete(null);
      setIsPreferencesComplete(null);
      setIsPersonalProfileComplete(null);
      setLoading(false);
    }
  }, [user]);

  const checkProfileCompletion = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, kitchen_equipment, preferred_cuisines, profile_emoji, dietary_restrictions, cooking_experience')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const hasName = Boolean(data.name?.trim());
        const hasEquipment = Array.isArray(data.kitchen_equipment) && data.kitchen_equipment.length > 0;
        const hasCuisines = Array.isArray(data.preferred_cuisines) && data.preferred_cuisines.length > 0;
        const hasProfileEmoji = Boolean(data.profile_emoji?.trim()) && data.profile_emoji !== '👨‍🍳';
        const hasDietaryRestrictions = Boolean(data.dietary_restrictions?.trim());
        const hasCookingExperience = Boolean(data.cooking_experience?.trim());
        
        // Check if preferences are complete (dietary restrictions OR cooking experience)
        const preferencesComplete = hasDietaryRestrictions || hasCookingExperience || hasEquipment || hasCuisines;
        
        // Check if personal profile is complete (name AND custom emoji)
        const personalProfileComplete = hasName && hasProfileEmoji;
        
        setIsPreferencesComplete(preferencesComplete);
        setIsPersonalProfileComplete(personalProfileComplete);
        setIsProfileComplete(preferencesComplete && personalProfileComplete);
      } else {
        setIsProfileComplete(false);
        setIsPreferencesComplete(false);
        setIsPersonalProfileComplete(false);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setIsProfileComplete(false);
      setIsPreferencesComplete(false);
      setIsPersonalProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  return { 
    isProfileComplete, 
    isPreferencesComplete, 
    isPersonalProfileComplete, 
    loading, 
    checkProfileCompletion 
  };
};