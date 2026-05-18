import Cookies from 'js-cookie';

export enum Locale {
  gb = 'gb',
  ru = 'ru',
  by = 'by',
}

export enum LanguageCode {
  en = 'en',
  ru = 'ru',
  by = 'by',
}

export enum Language {
  english = 'english',
  russian = 'русский',
  belarusian = 'беларуская',
}

export const LocaleDictionary: Record<Locale, { languageCode: LanguageCode; language: Language }> = {
  [Locale.gb]: { languageCode: LanguageCode.en, language: Language.english },
  [Locale.ru]: { languageCode: LanguageCode.ru, language: Language.russian },
  [Locale.by]: { languageCode: LanguageCode.by, language: Language.belarusian },
};

export const localeCookieName = 'custom_locale';

export type LocaleInfo = {
  locale: Locale;
  languageCode: LanguageCode;
  language: Language;
};

export const validateLocale = (inspectLocale: string | undefined) => {
  if (inspectLocale === undefined) return Locale.gb;

  return Object.values(Locale).find((locale) => locale === inspectLocale) ?? Locale.gb;
};

export const getLocaleFromCookies = () => {
  return validateLocale(Cookies.get(localeCookieName));
};

export const setLocaleCookie = (locale: Locale) => {
  Cookies.set(localeCookieName, locale, { expires: 365 });
};
