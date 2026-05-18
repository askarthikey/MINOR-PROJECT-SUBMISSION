import { z } from 'zod';

import { LanguageCode } from '@/services/locale/locale.service';

export const LocaleStringSchema = z.record(z.enum(LanguageCode), z.string().min(1, 'Translation cannot be empty'));

export type LocaleString = z.infer<typeof LocaleStringSchema>;
