-- Extend profiles table with additional fields for user preferences
ALTER TABLE public.profiles 
ADD COLUMN name TEXT,
ADD COLUMN kitchen_equipment JSONB DEFAULT '[]'::jsonb,
ADD COLUMN preferred_cuisines JSONB DEFAULT '[]'::jsonb,
ADD COLUMN additional_context TEXT;

-- Create index for better query performance
CREATE INDEX idx_profiles_name ON public.profiles(name);

-- Update the trigger to handle updated_at for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();