import { cookies } from 'next/headers';

import { Locale, localeCookieName, LocaleDictionary, validateLocale } from './locale.service';

export async function getServerLocale() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value ?? Locale.gb;

  return validateLocale(cookieLocale);
}

export async function getServerLanguageCode() {
  const locale = await getServerLocale();

  return LocaleDictionary[locale].languageCode;
}
