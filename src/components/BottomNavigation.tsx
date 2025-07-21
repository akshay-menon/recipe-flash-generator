import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, MessageSquare, BookOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      label: 'Generate',
      path: '/',
      icon: Zap,
    },
    {
      label: 'Chat',
      path: '/chat',
      icon: MessageSquare,
    },
    {
      label: 'Saved',
      path: '/saved-recipes',
      icon: BookOpen,
    },
    {
      label: 'Preferences',
      path: '/preferences',
      icon: Settings,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      {/* Desktop: Centered navigation */}
      <div className="hidden md:flex justify-center">
        <nav className="w-full max-w-md bg-background">
          <div className="flex items-center justify-around px-6 py-4">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile: Full width navigation */}
      <div className="md:hidden">
        <nav className="bg-background">
          <div className="flex items-center justify-around px-4 py-3">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                    isActive
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default BottomNavigation;