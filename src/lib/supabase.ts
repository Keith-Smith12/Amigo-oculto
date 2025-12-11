import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (for use in React components)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create a Supabase client for client components with auth helpers
export const createBrowserClient = () => {
  return createClientComponentClient<Database>();
};

// Server-side client with service role (for admin operations)
export const createServerClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Export types for convenience
export type SupabaseClient = typeof supabase;
