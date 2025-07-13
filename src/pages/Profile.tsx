import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChefHat, Globe, User } from 'lucide-react';

const KITCHEN_EQUIPMENT = [
  'Oven',
  'Air Fryer',
  'Stovetop',
  'Microwave',
  'Slow Cooker'
];

const CUISINE_OPTIONS = [
  'Italian',
  'Mexican',
  'Indian',
  'Asian',
  'Mediterranean'
];

const EMOJI_OPTIONS = [
  '👨‍🍳', '👩‍🍳', '🧑‍🍳', '😊', '😄', '🤓', '🥳', '🍳', '🍽️', '🥗', '🍕', '🍜', '🥘', '🍲', '🥟', '🍱'
];

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    kitchen_equipment: [] as string[],
    preferred_cuisines: [] as string[],
    additional_context: '',
    profile_emoji: '👨‍🍳'
  });

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
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          name: data.name || '',
          kitchen_equipment: Array.isArray(data.kitchen_equipment) ? data.kitchen_equipment.filter((item): item is string => typeof item === 'string') : [],
          preferred_cuisines: Array.isArray(data.preferred_cuisines) ? data.preferred_cuisines.filter((item): item is string => typeof item === 'string') : [],
          additional_context: data.additional_context || '',
          profile_emoji: data.profile_emoji || '👨‍🍳'
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
          name: profile.name,
          kitchen_equipment: profile.kitchen_equipment,
          preferred_cuisines: profile.preferred_cuisines,
          additional_context: profile.additional_context,
          profile_emoji: profile.profile_emoji
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

  const toggleCuisine = (cuisine: string) => {
    setProfile(prev => ({
      ...prev,
      preferred_cuisines: prev.preferred_cuisines.includes(cuisine)
        ? prev.preferred_cuisines.filter(item => item !== cuisine)
        : [...prev.preferred_cuisines, cuisine]
    }));
  };

  const generateRandomEmoji = () => {
    const randomIndex = Math.floor(Math.random() * EMOJI_OPTIONS.length);
    setProfile(prev => ({ ...prev, profile_emoji: EMOJI_OPTIONS[randomIndex] }));
  };

  const selectEmoji = (emoji: string) => {
    setProfile(prev => ({ ...prev, profile_emoji: emoji }));
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
          <h1 className="text-4xl font-bold text-primary mb-2">Your Profile</h1>
          <p className="text-muted-foreground">
            Tell us about yourself to get more personalized recipes
          </p>
        </div>

        <div className="space-y-6">
          {/* Name Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Name</CardTitle>
              <CardDescription>
                How would you like us to address you?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Choose an emoji to represent you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="text-6xl">{profile.profile_emoji}</div>
                <div className="flex gap-2">
                  <Button 
                    onClick={generateRandomEmoji}
                    variant="outline"
                    size="sm"
                  >
                    Random
                  </Button>
                </div>
                <div className="grid grid-cols-8 gap-2 w-full max-w-md">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant={profile.profile_emoji === emoji ? "default" : "outline"}
                      onClick={() => selectEmoji(emoji)}
                      className="text-2xl h-12 p-0"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {KITCHEN_EQUIPMENT.map((equipment) => (
                  <Button
                    key={equipment}
                    variant={profile.kitchen_equipment.includes(equipment) ? "default" : "outline"}
                    onClick={() => toggleEquipment(equipment)}
                    className="h-auto py-3"
                  >
                    {equipment}
                  </Button>
                ))}
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <Button
                    key={cuisine}
                    variant={profile.preferred_cuisines.includes(cuisine) ? "default" : "outline"}
                    onClick={() => toggleCuisine(cuisine)}
                    className="h-auto py-3"
                  >
                    {cuisine}
                  </Button>
                ))}
              </div>
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
              'Save Profile'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;