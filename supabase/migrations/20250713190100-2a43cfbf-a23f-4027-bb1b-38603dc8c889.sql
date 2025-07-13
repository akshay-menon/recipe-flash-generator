-- Add new columns to profiles table for cooking experience and protein preferences
ALTER TABLE public.profiles 
ADD COLUMN cooking_experience TEXT,
ADD COLUMN protein_preferences JSONB DEFAULT '[]'::jsonb;