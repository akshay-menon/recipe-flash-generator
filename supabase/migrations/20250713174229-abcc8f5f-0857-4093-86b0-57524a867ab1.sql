-- Add emoji profile picture column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profile_emoji TEXT DEFAULT '👨‍🍳';