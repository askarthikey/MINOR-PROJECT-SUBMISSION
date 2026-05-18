import { createBrowserClient } from '@supabase/ssr';

export const supabaseBrowser = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl == undefined || supabaseAnonKey == undefined) {
    throw new Error('Missing environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
