'use server';

import { AuthError, PostgrestError } from '@supabase/supabase-js';
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';

import { mockUser } from '@/data/mocks/user.mock';
import { UserRole } from '@/lib/routes';
import { userDetailsCookieName } from '@/lib/supabase/middleware';
import { supabaseServer } from '@/lib/supabase/server';
import { UserDetails, UserDetailsSchema } from '@/types/schemas/authorization-schemas';

import { AppMessages } from '../locale/messages';

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ data: UserDetails | undefined; error?: string }> {
  if (!email || !password) {
    return { data: undefined, error: 'error.auth.required' };
  }

  const supabase = await supabaseServer();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    if (!user || user.email == undefined) {
      throw 'error.auth.not-found';
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single<{ username: string }>();

    if (profileError) throw profileError;

    const parsed = UserDetailsSchema.safeParse({ ...user, ...profile });

    if (!parsed.success) throw new Error('error.auth.invalid-account-data');

    return { data: parsed.data };
  } catch (error: unknown) {
    return { data: undefined, error: handleError(error) };
  }
}

export async function signUp({
  email,
  password,
  username,
}: {
  email: string;
  password: string;
  username: string;
}): Promise<{ data: UserDetails | undefined; error?: string }> {
  if (!email || !password || !username) {
    return { data: undefined, error: 'error.auth.required' };
  }

  const supabase = await supabaseServer();
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      if (error?.message.includes('profiles_username_key') || error.code === '23505') {
        throw 'error.auth.conflict';
      }
      throw error.message;
    }

    const user = data.user;

    if (user && user.email != undefined) {
      return { data: { email: user.email, id: user.id, username, role: UserRole.User } };
    }

    throw 'error.global.unknown';
  } catch (error: unknown) {
    return { data: undefined, error: handleError(error) };
  }
}

export async function signOut() {
  const supabase = await supabaseServer();

  try {
    const { error } = await supabase.auth.signOut();
    if (error != undefined) throw error;

    await removeAuthCookies();

    return {};
  } catch (error: unknown) {
    return { error: handleError(error) };
  }
}

export async function getUser(): Promise<{ data: UserDetails | undefined; error?: string }> {
  if (process.env.MOCK_MODE === 'true') {
    return { data: mockUser, error: undefined };
  }

  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user?.id)
      .single<{ username: string }>();

    if (profileError) throw profileError;

    const parsed = UserDetailsSchema.safeParse({ ...user, ...profile });

    if (!parsed.success) throw new Error('error.auth.invalid-account-data');

    return { data: parsed.data };
  } catch (error: unknown) {
    return { data: undefined, error: handleError(error) };
  }
}

const handleError = (error: unknown): string => {
  if (typeof error === 'string' && error in AppMessages) {
    return error;
  }

  if (error instanceof Error && error.message in AppMessages) {
    return error.message;
  }

  if (error instanceof AuthError || error instanceof PostgrestError) {
    const code = error.code;

    if (code === '23505') return 'error.auth.conflict';

    if ('status' in error && typeof error.status === 'number') {
      switch (error.status) {
        case 400:
        case 403: {
          return 'error.auth.invalid';
        }
        case 401: {
          return 'error.auth.expired';
        }
        case 409: {
          return 'error.auth.conflict';
        }
        case 429: {
          return 'error.auth.rate_limit';
        }
        case 500:
        case 502:
        case 503: {
          return 'error.server.maintenance';
        }
        case 504:
        case 408: {
          return 'error.server.timeout';
        }
      }
    }
  }

  return 'error.global.unknown';
};

export async function getUserFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();

  return cookieStore.get(userDetailsCookieName)?.value;
}

export async function getAuthCookie(): Promise<RequestCookie[]> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return allCookies.filter((cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));
}

export async function hasAuthCookie() {
  const authCookies = await getAuthCookie();

  return authCookies.length > 0;
}

export async function removeAuthCookies() {
  const cookieStore = await cookies();
  const authCookies = await getAuthCookie();

  authCookies.forEach((cookie) => cookieStore.delete(cookie));

  cookieStore.delete(userDetailsCookieName);
}
