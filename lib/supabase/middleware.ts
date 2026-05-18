import { NextRequest, NextResponse } from 'next/server';

import { UserDetails } from '@/types/schemas/authorization-schemas';

import { RoutePermissions, Routes } from '../routes';
import { getNavigation } from '../utils';
import { supabaseServer } from './server';

export const userDetailsCookieName = 'jsit-user-details';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = await supabaseServer(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userRole = user?.app_metadata?.role ?? 'user';

  if (user) {
    const userDetails: UserDetails = {
      email: user.email ?? '',
      username: user.user_metadata.username ?? 'username',
      id: user.id,
      role: userRole,
    };

    response.cookies.set(userDetailsCookieName, JSON.stringify(userDetails));
  }
  const path = request.nextUrl.pathname;

  const correctPath = getNavigation(path);

  if (correctPath != undefined) {
    const status = RoutePermissions[correctPath];

    if (status.access === 'authorized' && !user) {
      const url = request.nextUrl.clone();
      url.pathname = Routes.SignIn;
      url.searchParams.set('redirect', path);

      return NextResponse.redirect(url);
    }

    const unauthorizedViolation = status.access === 'unauthorized' && !!user;
    const roleViolation =
      status.access === 'authorized' && !!status.allowedRoles && !status.allowedRoles.includes(userRole);

    if (unauthorizedViolation) {
      const url = request.nextUrl.clone();
      url.pathname = Routes.Dashboard;

      return NextResponse.redirect(url);
    }

    if (roleViolation) {
      const url = request.nextUrl.clone();
      url.pathname = Routes.Dashboard;

      return NextResponse.redirect(url);
    }
  }

  return response;
}
