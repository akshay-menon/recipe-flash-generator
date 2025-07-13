-- Add dietary restrictions column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dietary_restrictions TEXT;