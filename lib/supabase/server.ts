import { CookieOptions, createServerClient } from '@supabase/ssr';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const supabaseServer = async (request?: NextRequest, response?: NextResponse) => {
  const isMiddleware = !!request && !!response;

  let cookieStore: ReadonlyRequestCookies;

  if (!isMiddleware) {
    cookieStore = await cookies();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl == undefined || supabaseAnonKey == undefined) {
    throw new Error('Missing environment variables');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => (isMiddleware ? request.cookies.getAll() : cookieStore?.getAll()),
      setAll(cookiesToSet: Cookie[]) {
        cookiesToSet.forEach((cookie) => {
          try {
            if (isMiddleware) {
              request.cookies.set(cookie);
              response.cookies.set(cookie);
            } else {
              cookieStore?.set(cookie);
            }
          } catch {}
        });
      },
    },
  });
};

export type Cookie = {
  name: string;
  value: string;
  options: CookieOptions;
};
