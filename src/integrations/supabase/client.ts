// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vuuxlukywogxhdpgcmjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dXhsdWt5d29neGhkcGdjbWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDcyNzcsImV4cCI6MjA2NzQ4MzI3N30.oUe8TKjnYl_Ocj9en2W51CXYma_rjCw2SrWfCTO9sk4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});