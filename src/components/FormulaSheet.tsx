import { BookOpen, Calculator, Search, Check, Copy, Sparkles, Plus, Layers } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Language } from '../types';
import { FORMULAS } from '../data/physicsData';
import { PhysicsEquationKeyboard } from './PhysicsEquationKeyboard';

interface Props {
  lang: Language;
}

export default function FormulaSheet({ lang }: Props) {
  const { t: tI18n } = useTranslation();
  const t = (tI18n('formulas', { returnObjects: true }) as any);
  const common = (tI18n('common', { returnObjects: true }) as any);

  const [activeTopic, setActiveTopic] = useState<'all' | 'mechanics' | 'electricity' | 'optics' | 'waves'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCustomEquationBuilder, setShowCustomEquationBuilder] = useState(false);
  const [customEquation, setCustomEquation] = useState('T = 2π √(L / g)');

  const filtered = FORMULAS.filter((f) => {
    const matchesTopic = activeTopic === 'all' || f.topic === activeTopic;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return matchesTopic;

    const name = tI18n(`formulas.${f.id}.name`).toLowerCase();
    const desc = tI18n(`formulas.${f.id}.description`).toLowerCase();
    const vars = (tI18n(`formulas.${f.id}.variables`, { returnObjects: true }) as Array<{ symbol: string; name: string; unit: string }>) || [];

    const matchesSearch =
      name.includes(q) ||
      desc.includes(q) ||
      f.formula.toLowerCase().includes(q) ||
      ['ar', 'en', 'ku', 'kmr'].some((l) =>
        i18n.getFixedT(l)(`formulas.${f.id}.name`).toLowerCase().includes(q)
      ) ||
      (Array.isArray(vars) && vars.some((v) => 
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.symbol && v.symbol.toLowerCase().includes(q))
      ));

    return matchesTopic && matchesSearch;
  });

  const handleCopy = (id: string, formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="formula-sheet-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100">{t.title}</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            {lang === 'ar'
              ? 'دليل القوانين والمعادلات الأساسية المستخدمة في تجارب المختبر مع توضيح الوحدات والمتغيرات ولوحة المفاتيح الرياضية.'
              : lang === 'kmr'
              ? 'Rêberê qanûn û hevkêşeyên bingehîn ên ezmûnên laboratûwarê ligel şiroveya yekeyan û tebleya matematîkî.'
              : lang === 'ku'
              ? 'ڕێبەری یاسا و هاوکێشە بنەڕەتییەکان لەگەڵ ڕوونکردنەوەی یەکەکان و تەختەکلیلی هاوکێشەی فیزیایی.'
              : 'Fundamental equations and physical laws explored across the experimental simulations with live physics keyboard.'}
          </p>
        </div>

        <button
          id="toggle-custom-eq-btn"
          onClick={() => setShowCustomEquationBuilder(!showCustomEquationBuilder)}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shadow-md ${
            showCustomEquationBuilder 
              ? 'bg-indigo-600 text-white' 
              : 'bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-zinc-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{lang === 'ar' ? 'منشئ وحاسبة المعادلات' : lang === 'kmr' ? 'Avakirok û Hesabkera Hevkêşeyan' : lang === 'ku' ? 'دروستکەر و شیکارکەری هاوکێشە' : 'Equation Builder & Solver'}</span>
        </button>
      </div>

      {/* Embedded Physics Equation Keyboard if open */}
      {showCustomEquationBuilder && (
        <div className="animate-fade-in">
          <PhysicsEquationKeyboard
            lang={lang}
            value={customEquation}
            onChange={setCustomEquation}
            onClose={() => setShowCustomEquationBuilder(false)}
            docked={true}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="formula-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Topic Tabs */}
        <div className="flex flex-wrap rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs gap-1">
          {[
            { id: 'all', label: t.filterAll },
            { id: 'mechanics', label: t.filterMechanics },
            { id: 'electricity', label: t.filterElectricity },
            { id: 'optics', label: t.filterOptics },
            { id: 'waves', label: t.filterWaves },
            { id: 'thermodynamics', label: lang === 'ar' ? 'الديناميكا الحرارية' : lang === 'kmr' ? 'Termodînamîk' : lang === 'ku' ? 'داینامیکی گەرمی' : 'Thermodynamics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTopic(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                activeTopic === tab.id ? 'bg-zinc-800 text-zinc-100 shadow border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formula Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            id={`formula-card-${item.id}`}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 hover:border-zinc-700 hover:bg-zinc-900 transition-all flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-semibold">
                  {tI18n(`formulas.${item.id}.topic`) || item.topic}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setCustomEquation(item.formula);
                      setShowCustomEquationBuilder(true);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800 transition-colors"
                    title={lang === 'ar' ? 'فتح في لوحة المعادلات' : lang === 'kmr' ? 'Di klavyeya hevkêşeyan de veke' : lang === 'ku' ? 'کردنەوە لە تەختەکلیلی هاوکێشەکان' : 'Open in Equation Keyboard'}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopy(item.id, item.formula)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title={common.copy}
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-zinc-100">
                {tI18n(`formulas.${item.id}.name`)}
              </h3>

              {/* Formula Display Box */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 text-center shadow-inner">
                <span className="font-mono text-base sm:text-lg font-bold text-sky-300 tracking-wide dir-ltr inline-block">
                  {item.formula}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {tI18n(`formulas.${item.id}.description`)}
              </p>
            </div>

            {/* Variables breakdown list */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 block">{t.variablesHeader}</span>
              <div className="grid grid-cols-1 gap-1">
                {((tI18n(`formulas.${item.id}.variables`, { returnObjects: true }) as Array<{ symbol: string; name: string; unit: string }>) || []).map((v) => (
                  <div key={v.symbol} className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-950/40 px-2 py-1 rounded-lg border border-zinc-800/40">
                    <span className="font-mono text-indigo-400 font-bold">{v.symbol}</span>
                    <span className="text-zinc-300">
                      {v.name}
                    </span>
                    <span className="text-zinc-500 font-mono">[{v.unit}]</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}