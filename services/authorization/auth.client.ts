import Cookies from 'js-cookie';

import { UserDetails, UserDetailsSchema } from '@/types/schemas/authorization-schemas';

const userDetailsCookieName = 'your-cookie-name'; // Replace with your actual name

export function getUserFromCookies(): UserDetails | undefined {
  const cookieValue = Cookies.get(userDetailsCookieName);

  if (cookieValue == undefined) return;

  try {
    const jsonObject = JSON.parse(cookieValue);

    if (jsonObject !== undefined) {
      const parsed = UserDetailsSchema.safeParse(jsonObject);
      if (parsed.success) return parsed.data;
    }
  } catch {
    return undefined;
  }
}

export function removeAuthCookies() {
  const allCookies = Cookies.get();

  Object.keys(allCookies).forEach((name) => {
    if (name.startsWith(userDetailsCookieName) || (name.startsWith('sb-') && name.endsWith('-auth-token'))) {
      Cookies.remove(name, { path: '/', domain: 'localhost' });
      Cookies.remove(name, { path: '/' });
      Cookies.remove(name);
    }
  });
}
