import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, ChefHat, Globe, User, Check } from 'lucide-react';

const KITCHEN_EQUIPMENT = [
  'Oven',
  'Air Fryer',
  'Stovetop',
  'Microwave',
  'Slow Cooker'
];

const CUISINE_OPTIONS = [
  { name: 'Italian', icon: '🍝', description: 'Pasta, risotto, simple proteins with herbs' },
  { name: 'Asian', icon: '🥢', description: 'Stir-fries, noodles, rice bowls, fresh ingredients' },
  { name: 'Mexican', icon: '🌮', description: 'Tacos, burritos, beans, spiced proteins' },
  { name: 'Mediterranean', icon: '🫒', description: 'Olive oil, fresh vegetables, grilled meats' },
  { name: 'American', icon: '🍔', description: 'Comfort foods, grilled meats, hearty sides' },
  { name: 'Indian', icon: '🍛', description: 'Curries, rice dishes, aromatic spices' }
];

const COOKING_EXPERIENCE = [
  { name: 'Beginner', icon: '👶', description: 'Simple recipes with basic techniques and detailed instructions' },
  { name: 'Intermediate', icon: '👨‍🍳', description: 'Comfortable with most cooking methods, can handle multi-step recipes' },
  { name: 'Advanced', icon: '🔥', description: 'Experienced cook, enjoys complex techniques and minimal hand-holding' }
];

const PROTEIN_PREFERENCES = [
  'Chicken 🐔',
  'Beef 🥩',
  'Pork 🐷',
  'Fish 🐟',
  'Seafood 🦐',
  'Vegetarian 🥬',
  'Eggs 🥚'
];


const Preferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    kitchen_equipment: [] as string[],
    preferred_cuisines: [] as string[],
    cooking_experience: '' as string,
    protein_preferences: [] as string[],
    additional_context: ''
  });
  const [selectedCuisineForDescription, setSelectedCuisineForDescription] = useState<string | null>(null);
  const [selectedExperienceForDescription, setSelectedExperienceForDescription] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('kitchen_equipment, preferred_cuisines, additional_context')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          kitchen_equipment: Array.isArray(data.kitchen_equipment) ? data.kitchen_equipment.filter((item): item is string => typeof item === 'string') : [],
          preferred_cuisines: Array.isArray(data.preferred_cuisines) ? data.preferred_cuisines.filter((item): item is string => typeof item === 'string') : [],
          cooking_experience: '', // Will be added to database later
          protein_preferences: [], // Will be added to database later
          additional_context: data.additional_context || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          kitchen_equipment: profile.kitchen_equipment,
          preferred_cuisines: profile.preferred_cuisines,
          additional_context: profile.additional_context,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (equipment: string) => {
    setProfile(prev => ({
      ...prev,
      kitchen_equipment: prev.kitchen_equipment.includes(equipment)
        ? prev.kitchen_equipment.filter(item => item !== equipment)
        : [...prev.kitchen_equipment, equipment]
    }));
  };

  const toggleCuisine = (cuisineName: string) => {
    setProfile(prev => ({
      ...prev,
      preferred_cuisines: prev.preferred_cuisines.includes(cuisineName)
        ? prev.preferred_cuisines.filter(item => item !== cuisineName)
        : [...prev.preferred_cuisines, cuisineName]
    }));
  };

  const handleCuisineClick = (cuisineName: string) => {
    toggleCuisine(cuisineName);
    // Toggle description for mobile
    if (window.innerWidth < 768) {
      setSelectedCuisineForDescription(
        selectedCuisineForDescription === cuisineName ? null : cuisineName
      );
    }
  };

  const toggleExperience = (experienceName: string) => {
    setProfile(prev => ({
      ...prev,
      cooking_experience: prev.cooking_experience === experienceName ? '' : experienceName
    }));
  };

  const handleExperienceClick = (experienceName: string) => {
    toggleExperience(experienceName);
    // Toggle description for mobile
    if (window.innerWidth < 768) {
      setSelectedExperienceForDescription(
        selectedExperienceForDescription === experienceName ? null : experienceName
      );
    }
  };

  const toggleProtein = (protein: string) => {
    setProfile(prev => ({
      ...prev,
      protein_preferences: prev.protein_preferences.includes(protein)
        ? prev.protein_preferences.filter(item => item !== protein)
        : [...prev.protein_preferences, protein]
    }));
  };


  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">You need to sign in to view and edit your profile.</p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Preferences</h1>
          <p className="text-muted-foreground">
            Tell us about your cooking preferences
          </p>
        </div>

        <div className="space-y-6">

          {/* Kitchen Equipment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Kitchen Equipment
              </CardTitle>
              <CardDescription>
                Select the equipment you have available in your kitchen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {KITCHEN_EQUIPMENT.map((equipment) => {
                  const isSelected = profile.kitchen_equipment.includes(equipment);
                  return (
                    <Badge
                      key={equipment}
                      variant={isSelected ? "default" : "outline"}
                      className={`
                        cursor-pointer transition-all duration-200 px-3 py-2 text-sm font-medium
                        hover:scale-105 active:scale-95 select-none
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground border-input'
                        }
                      `}
                      onClick={() => toggleEquipment(equipment)}
                    >
                      <span className="flex items-center gap-1.5">
                        {isSelected && <Check className="h-3 w-3" />}
                        {equipment}
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cooking Experience Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Cooking Experience
              </CardTitle>
              <CardDescription>
                What's your comfort level in the kitchen?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="flex flex-wrap gap-2">
                  {COOKING_EXPERIENCE.map((experience) => {
                    const isSelected = profile.cooking_experience === experience.name;
                    return (
                      <Tooltip key={experience.name}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={`
                              cursor-pointer transition-all duration-200 px-3 py-2 text-sm font-medium
                              hover:scale-105 active:scale-95 select-none
                              ${isSelected 
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground border-input'
                              }
                            `}
                            onClick={() => handleExperienceClick(experience.name)}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-base">{experience.icon}</span>
                              {isSelected && <Check className="h-3 w-3" />}
                              {experience.name}
                            </span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="hidden md:block">
                          <p className="text-sm">{experience.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
              
              {/* Mobile descriptions */}
              {selectedExperienceForDescription && (
                <div className="mt-3 md:hidden">
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    <strong>{selectedExperienceForDescription}:</strong>{' '}
                    {COOKING_EXPERIENCE.find(e => e.name === selectedExperienceForDescription)?.description}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Protein Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Protein Preferences
              </CardTitle>
              <CardDescription>
                What proteins do you enjoy cooking with?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PROTEIN_PREFERENCES.map((protein) => {
                  const isSelected = profile.protein_preferences.includes(protein);
                  return (
                    <Badge
                      key={protein}
                      variant={isSelected ? "default" : "outline"}
                      className={`
                        cursor-pointer transition-all duration-200 px-3 py-2 text-sm font-medium
                        hover:scale-105 active:scale-95 select-none
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground border-input'
                        }
                      `}
                      onClick={() => toggleProtein(protein)}
                    >
                      <span className="flex items-center gap-1.5">
                        {isSelected && <Check className="h-3 w-3" />}
                        {protein}
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cuisine Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Cuisine Preferences
              </CardTitle>
              <CardDescription>
                What types of cuisines do you enjoy cooking?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => {
                    const isSelected = profile.preferred_cuisines.includes(cuisine.name);
                    return (
                      <Tooltip key={cuisine.name}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={`
                              cursor-pointer transition-all duration-200 px-3 py-2 text-sm font-medium
                              hover:scale-105 active:scale-95 select-none
                              ${isSelected 
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground border-input'
                              }
                            `}
                            onClick={() => handleCuisineClick(cuisine.name)}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-base">{cuisine.icon}</span>
                              {isSelected && <Check className="h-3 w-3" />}
                              {cuisine.name}
                            </span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="hidden md:block">
                          <p className="text-sm">{cuisine.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
              
              {/* Mobile descriptions */}
              {selectedCuisineForDescription && (
                <div className="mt-3 md:hidden">
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    <strong>{selectedCuisineForDescription}:</strong>{' '}
                    {CUISINE_OPTIONS.find(c => c.name === selectedCuisineForDescription)?.description}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Context Section */}
          <Card>
            <CardHeader>
              <CardTitle>Tell Us More</CardTitle>
              <CardDescription>
                Any additional preferences, allergies, or cooking style notes?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="context">Additional Context</Label>
              <Textarea
                id="context"
                value={profile.additional_context}
                onChange={(e) => setProfile(prev => ({ ...prev, additional_context: e.target.value }))}
                placeholder="I like cooking pastas, and use pesto and chilli oil a lot. I don't like aubergines"
                className="mt-2 min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;