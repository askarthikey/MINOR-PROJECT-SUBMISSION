import type { Locale as DateFnsLocale } from 'date-fns';
import { be, enUS, ru } from 'date-fns/locale';

import { LanguageCode } from './locale.service';

type IntlLocale = 'en' | 'ru' | 'be';

type LocaleFormatConfig = {
  intlLocale: IntlLocale;
  dateFnsLocale: DateFnsLocale;
};

const localeFormatMap: Record<LanguageCode, LocaleFormatConfig> = {
  [LanguageCode.en]: {
    intlLocale: 'en',
    dateFnsLocale: enUS,
  },
  [LanguageCode.ru]: {
    intlLocale: 'ru',
    dateFnsLocale: ru,
  },
  [LanguageCode.by]: {
    intlLocale: 'be',
    dateFnsLocale: be,
  },
};

export function getIntlLocale(languageCode: LanguageCode): IntlLocale {
  return localeFormatMap[languageCode].intlLocale;
}

export function getDateFnsLocale(languageCode: LanguageCode): DateFnsLocale {
  return localeFormatMap[languageCode].dateFnsLocale;
}
