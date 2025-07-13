import React, { useState, useEffect } from 'react';
import { LogOut, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<{ name: string | null; emoji: string }>({
    name: null,
    emoji: '👨‍🍳'
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, profile_emoji')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile({
        name: data?.name || null,
        emoji: data?.profile_emoji || '👨‍🍳'
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  if (!user) return null;

  const displayName = userProfile.name || user.email?.split('@')[0] || 'Chef';

  return (
    <div className="flex justify-end p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:bg-accent/50 transition-colors"
          >
            <span className="text-lg">{userProfile.emoji}</span>
            <span className="font-medium">Chef {displayName}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Header;