'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { Locale, LocaleDictionary, LocaleInfo, setLocaleCookie } from '@/services/locale/locale.service';

type LocaleContextType = LocaleInfo & {
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocaleCookie(locale);
  }, [locale]);

  const localeInfo = { locale, ...LocaleDictionary[locale], setLocale };

  return <LocaleContext.Provider value={localeInfo}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale was not defined at time');
  }

  return context;
}
