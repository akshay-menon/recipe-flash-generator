import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, X } from 'lucide-react';

interface ProfileSetupBannerProps {
  onDismiss?: () => void;
}

const ProfileSetupBanner: React.FC<ProfileSetupBannerProps> = ({ onDismiss }) => {
  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Set up your profile</h3>
              <p className="text-sm text-muted-foreground">
                Choose a nickname and profile picture to personalize your experience
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:flex-shrink-0">
            <Button asChild variant="default" size="sm" className="flex-1 md:flex-initial">
              <Link to="/profile">Complete profile</Link>
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSetupBanner;