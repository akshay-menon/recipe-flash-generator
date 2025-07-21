import React, { useState, useEffect } from 'react';
import { LogOut, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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

  const handleLogoClick = () => {
    // Clear localStorage to reset recipe state
    try {
      localStorage.removeItem('home-recipe-state');
    } catch (error) {
      console.error('Error clearing recipe state:', error);
    }
    
    // Navigate to home page
    navigate('/');
    
    // Force page reload to ensure clean state
    window.location.reload();
  };

  const displayName = userProfile.name || user?.email?.split('@')[0] || 'Chef';

  return (
    <div className="flex justify-between items-center p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Logo - Clickable */}
      <button 
        onClick={handleLogoClick}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <span className="text-xl">🍉</span>
        <span className="font-semibold text-lg text-foreground">Melon Farms</span>
      </button>

      {/* Profile Dropdown - only show when user is logged in */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 hover:bg-accent/50 transition-colors"
            >
              <span className="text-lg">{userProfile.emoji}</span>
              <span className="font-medium hidden sm:inline">Chef {displayName}</span>
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
      ) : (
        <Button asChild>
          <Link to="/auth">Sign in</Link>
        </Button>
      )}
    </div>
  );
};

export default Header;