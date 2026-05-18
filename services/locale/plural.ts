import { LanguageCode } from './locale.service';
import { getIntlLocale } from './locale-format';

const pluralRulesCache = new Map<string, Intl.PluralRules>();

function getPluralRules(languageCode: LanguageCode): Intl.PluralRules {
  const locale = getIntlLocale(languageCode);
  const cachedRules = pluralRulesCache.get(locale);

  if (cachedRules != undefined) {
    return cachedRules;
  }

  const rules = new Intl.PluralRules(locale);

  pluralRulesCache.set(locale, rules);
  return rules;
}

export function selectPluralCategory(count: number, languageCode: LanguageCode): Intl.LDMLPluralRule {
  return getPluralRules(languageCode).select(count);
}
