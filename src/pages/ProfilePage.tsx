import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shuffle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Available emoji options for profile pictures
const EMOJI_OPTIONS = [
  '👨‍🍳', '👩‍🍳', '🧑‍🍳', '👨', '👩', '🧑', '😊', '😄', '🤗', '🥰',
  '🍳', '🥄', '🍴', '🔥', '⭐', '🌟', '🍽️', '🥘', '🍲', '🥗'
];

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    profile_emoji: '👨‍🍳'
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('name, profile_emoji')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          name: data.name || '',
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

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profile.name,
          profile_emoji: profile.profile_emoji,
          email: user.email,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
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

  const generateRandomEmoji = () => {
    const randomEmoji = EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
    setProfile(prev => ({ ...prev, profile_emoji: randomEmoji }));
  };

  const selectEmoji = (emoji: string) => {
    setProfile(prev => ({ ...prev, profile_emoji: emoji }));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Sign in required to view profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Tell us more about yourself</p>
        </div>

        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-6xl">{profile.profile_emoji}</div>
              <Button 
                variant="outline" 
                onClick={generateRandomEmoji}
                className="flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Random
              </Button>
            </div>
            
            <div className="grid grid-cols-10 gap-2 max-w-md mx-auto">
              {EMOJI_OPTIONS.map((emoji, index) => (
                <Button
                  key={index}
                  variant={profile.profile_emoji === emoji ? "default" : "ghost"}
                  className="text-xl p-2 h-10 w-10"
                  onClick={() => selectEmoji(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Name Section */}
        <Card>
          <CardHeader>
            <CardTitle>Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="What should we call you?"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;