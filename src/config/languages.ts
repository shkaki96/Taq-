import { Language } from '../types';

export interface LanguageOption {
  code: Language;
  label: string;
  subLabel: string;
  kurdishBadge?: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'ku', label: 'سۆرانی', subLabel: 'Kurdî (Sorani)', kurdishBadge: true },
  { code: 'bad', label: 'بادینی', subLabel: 'Kurdî (Badînî)', kurdishBadge: true },
  { code: 'kmr', label: 'Kurmancî', subLabel: 'Kurdî (Kurmanji)', kurdishBadge: true },
  { code: 'en', label: 'English', subLabel: 'English' },
  { code: 'ar', label: 'العربية', subLabel: 'Arabic' },
];

export const RTL_LANGUAGES: Language[] = ['ar', 'ku', 'bad'];
export const isRtlLanguage = (lang: string): boolean => RTL_LANGUAGES.includes(lang as Language);

