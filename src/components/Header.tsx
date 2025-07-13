import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserName(data?.name || null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {userName ? (
            <span>Welcome back, {userName}</span>
          ) : (
            <span>Welcome back, {user.email}</span>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Header;