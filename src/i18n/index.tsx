import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { FlexStyle, TextStyle } from 'react-native';
import { ar } from './ar';
import { en, TranslationKey } from './en';

export type { TranslationKey } from './en';

export type Language = 'en' | 'ar';

const CATALOGUES: Record<Language, Record<string, string>> = { en, ar };
const STORAGE_KEY = 'celadon.language';

/** Arabic-Indic digits, as the approved design uses them. */
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Converts Western digits to Arabic-Indic and swaps the group/decimal marks.
 * Applied to any number rendered inside Arabic copy.
 */
export function toArabicDigits(value: string | number): string {
  return String(value)
    .replace(/,/g, '٬')
    .replace(/\./g, '٫')
    .replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

/**
 * Plural category for a count. English needs two forms; Arabic needs six, and
 * the catalogue supplies whichever ones it uses.
 */
function pluralSuffix(lang: Language, count: number): string[] {
  if (lang === 'en') return [count === 1 ? '_one' : '_other', '_other'];

  const mod100 = count % 100;
  if (count === 0) return ['_zero', '_other'];
  if (count === 1) return ['_one', '_other'];
  if (count === 2) return ['_two', '_other'];
  if (mod100 >= 3 && mod100 <= 10) return ['_few', '_other'];
  if (mod100 >= 11 && mod100 <= 99) return ['_many', '_other'];
  return ['_other'];
}

export type TranslateOptions = Record<string, string | number>;

export type I18n = {
  lang: Language;
  isRTL: boolean;
  /** Look up a string, interpolating `{{name}}` placeholders. */
  t: (key: TranslationKey, options?: TranslateOptions) => string;
  /** Look up a counted string, choosing the right plural form. */
  tp: (key: string, count: number, options?: TranslateOptions) => string;
  /** Localise a number — Arabic-Indic digits under Arabic. */
  n: (value: number | string) => string;
  setLanguage: (lang: Language) => void;
  /** `row` mirrors to `row-reverse` under Arabic. */
  row: FlexStyle['flexDirection'];
  /** Natural text alignment for the current language. */
  textAlign: TextStyle['textAlign'];
  /** Direction-aware "back"/"forward" chevrons. */
  chevronBack: string;
  chevronForward: string;
};

const I18nContext = createContext<I18n | null>(null);

const deviceLanguage = (): Language => {
  const tag = Localization.getLocales()[0]?.languageCode;
  return tag === 'ar' ? 'ar' : 'en';
};

/**
 * Language and direction for the whole app.
 *
 * Mirroring is done in styles (`row` → `row-reverse`, text alignment) rather
 * than through `I18nManager.forceRTL`, which needs a full app restart to take
 * effect. Switching language here is instant, and behaves identically on iOS,
 * Android and web.
 */
export function I18nProvider({
  children,
  language,
}: {
  children: React.ReactNode;
  /** Fixes the language — used in tests and screenshots. */
  language?: Language;
}) {
  const [lang, setLang] = useState<Language>(language ?? deviceLanguage());

  // Restore the saved choice; the device locale is only the first-run default.
  useEffect(() => {
    if (language) return;
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (active && (saved === 'en' || saved === 'ar')) setLang(saved);
      })
      .catch(() => {
        // A storage failure just means we keep the device default.
      });
    return () => {
      active = false;
    };
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLang(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<I18n>(() => {
    const isRTL = lang === 'ar';
    const catalogue = CATALOGUES[lang];

    const n = (input: number | string) => {
      const text = typeof input === 'number' ? input.toLocaleString('en-US') : input;
      return isRTL ? toArabicDigits(text) : text;
    };

    const fill = (template: string, options?: TranslateOptions) =>
      options
        ? template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
            const provided = options[name];
            if (provided === undefined) return match;
            return typeof provided === 'number' ? n(provided) : provided;
          })
        : template;

    const lookup = (key: string): string => {
      const hit = catalogue[key];
      if (hit !== undefined) return hit;
      // Fall back to English so a missing translation degrades to readable
      // copy rather than a raw key.
      const fallback = (en as Record<string, string>)[key];
      if (fallback !== undefined) {
        if (__DEV__) console.warn(`[i18n] missing ${lang} string: ${key}`);
        return fallback;
      }
      if (__DEV__) console.warn(`[i18n] unknown key: ${key}`);
      return key;
    };

    return {
      lang,
      isRTL,
      setLanguage,
      n,
      t: (key, options) => fill(lookup(key), options),
      tp: (key, count, options) => {
        for (const suffix of pluralSuffix(lang, count)) {
          const candidate = catalogue[`${key}${suffix}`];
          if (candidate !== undefined) return fill(candidate, { count, ...options });
        }
        return fill(lookup(key), { count, ...options });
      },
      row: isRTL ? 'row-reverse' : 'row',
      textAlign: isRTL ? 'right' : 'left',
      chevronBack: isRTL ? '›' : '‹',
      chevronForward: isRTL ? '‹' : '›',
    };
  }, [lang, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

/** Language metadata for the picker. */
export const LANGUAGES: { code: Language; nativeKey: TranslationKey; nameKey: TranslationKey; noteKey: TranslationKey }[] = [
  { code: 'en', nativeKey: 'language.englishNative', nameKey: 'language.english', noteKey: 'language.ltrNote' },
  { code: 'ar', nativeKey: 'language.arabicNative', nameKey: 'language.arabic', noteKey: 'language.rtlNote' },
];
