import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl == undefined || supabaseRoleKey == undefined) {
    throw new Error('Missing environment variables');
  }

  return createClient(supabaseUrl, supabaseRoleKey);
};
