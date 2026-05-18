import { useLocale } from '@/providers/locale.provider';
import { LanguageCode } from '@/services/locale/locale.service';
import { AppMessages, MessageKey } from '@/services/locale/messages';
import { LocaleString } from '@/types/schemas/locale-schemas';

export function useTranslation() {
  const { languageCode } = useLocale();

  const t = (key: MessageKey): string => {
    const message = AppMessages[key];

    return message[languageCode];
  };

  const tor = (key: string, fallback: MessageKey): string => {
    const validKey = isValidMessageKey(key) ? key : fallback;
    const message = AppMessages[validKey];

    return message[languageCode];
  };

  const translate = (localRecord: LocaleString | undefined): string => {
    if (!localRecord) return '';

    return localRecord[languageCode] ?? localRecord[LanguageCode.en] ?? '';
  };

  return { t, tor, translate, languageCode };
}

function isValidMessageKey(key: string): key is MessageKey {
  return key in AppMessages;
}
