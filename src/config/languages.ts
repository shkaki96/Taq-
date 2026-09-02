import { Language } from '../types';

export interface LanguageOption {
  code: Language;
  label: string;
  subLabel: string;
  kurdishBadge?: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'ku', label: 'سۆرانی', subLabel: 'Kurdî (Sorani)', kurdishBadge: true },
  { code: 'kmr', label: 'Kurmancî', subLabel: 'Kurdî (Kurmanji)', kurdishBadge: true },
  { code: 'en', label: 'English', subLabel: 'English' },
  { code: 'ar', label: 'العربية', subLabel: 'Arabic' },
];
