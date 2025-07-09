-- Extend profiles table with additional fields for user preferences
ALTER TABLE public.profiles 
ADD COLUMN name TEXT,
ADD COLUMN kitchen_equipment JSONB DEFAULT '[]'::jsonb,
ADD COLUMN preferred_cuisines JSONB DEFAULT '[]'::jsonb,
ADD COLUMN additional_context TEXT;

-- Create index for better query performance
CREATE INDEX idx_profiles_name ON public.profiles(name);