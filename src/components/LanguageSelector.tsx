import { Globe, ChevronDown, Check } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { LANGUAGES, LanguageOption } from '../config/languages';

export type { LanguageOption };

interface Props {
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  className?: string;
}

export default function LanguageSelector({ currentLang, onSelectLang, className = '' }: Props) {
  const { t: tI18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`} id="language-selector-wrapper">
      {/* Current Language Button */}
      <button
        id="language-dropdown-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-600 text-xs font-bold text-slate-200 hover:text-white shadow-md shadow-black/40 backdrop-blur-md transition-all active:scale-95"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold tracking-tight">{activeOption.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute ltr:right-0 rtl:left-0 mt-1.5 w-44 rounded-xl bg-slate-950/95 border border-slate-800/90 shadow-2xl shadow-black/80 backdrop-blur-xl p-1.5 z-50 animate-fade-in space-y-1 focus:outline-none"
        >
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
            {currentLang === 'ar'
              ? 'اختر اللغة'
              : currentLang === 'ku'
              ? 'زمانێک هەڵبژێرە'
              : currentLang === 'kmr'
              ? 'Zimanek Hilbijêre'
              : 'Select Language'}
          </div>

          {LANGUAGES.map((l) => {
            const isSelected = currentLang === l.code;
            return (
              <button
                key={l.code}
                id={`lang-opt-${l.code}`}
                type="button"
                onClick={() => {
                  onSelectLang(l.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                }`}
              >
                <div className="text-start">
                  <div className="font-medium text-slate-100">{l.label}</div>
                  <div className="text-[10px] text-slate-400 font-sans">{l.subLabel}</div>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}