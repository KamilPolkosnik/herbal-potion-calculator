// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://yctydoacgdjlagxkjmnp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdHlkb2FjZ2RqbGFneGtqbW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzE1ODQsImV4cCI6MjA2NjM0NzU4NH0.Qo1BPdfzMIOJXMgq1NMLOac23PwiP4NzyWHY4EumPBM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);