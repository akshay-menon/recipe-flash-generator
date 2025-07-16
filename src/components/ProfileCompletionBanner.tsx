import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, X } from 'lucide-react';

interface ProfileCompletionBannerProps {
  onDismiss?: () => void;
}

const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ onDismiss }) => {
  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Tell us what you like</h3>
              <p className="text-sm text-muted-foreground">
                Tell us about your cooking preferences to get more personalized recipes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="default" size="sm">
              <Link to="/preferences">Choose preferences</Link>
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

export default ProfileCompletionBanner;