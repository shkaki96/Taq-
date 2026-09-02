import { Atom, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface BuildAtomSimProps {
  lang: Language;
  onLogMeasurement?: (record: any) => void;
}

const ELEMENTS = [
  { z: 1, symbol: 'H', nameAr: 'هيدروجين', nameEn: 'Hydrogen', nameKu: 'هایدرۆجین', nameKmr: 'Hîdrojen', stableN: [0, 1] },
  { z: 2, symbol: 'He', nameAr: 'هيليوم', nameEn: 'Helium', nameKu: 'هیلیۆم', nameKmr: 'Helyûm', stableN: [1, 2] },
  { z: 3, symbol: 'Li', nameAr: 'ليثيوم', nameEn: 'Lithium', nameKu: 'لیتیۆم', nameKmr: 'Lîtyûm', stableN: [3, 4] },
  { z: 4, symbol: 'Be', nameAr: 'بيريليوم', nameEn: 'Beryllium', nameKu: 'بێریلیۆم', nameKmr: 'Berîlyûm', stableN: [5] },
  { z: 5, symbol: 'B', nameAr: 'بورون', nameEn: 'Boron', nameKu: 'بۆرۆن', nameKmr: 'Boron', stableN: [5, 6] },
  { z: 6, symbol: 'C', nameAr: 'كربون', nameEn: 'Carbon', nameKu: 'کاربۆن', nameKmr: 'Karbon', stableN: [6, 7] },
  { z: 7, symbol: 'N', nameAr: 'نيتروجين', nameEn: 'Nitrogen', nameKu: 'نایترۆجین', nameKmr: 'Nîtrojen', stableN: [7, 8] },
  { z: 8, symbol: 'O', nameAr: 'أكسجين', nameEn: 'Oxygen', nameKu: 'ئۆکسجین', nameKmr: 'Oksîjen', stableN: [8, 9, 10] },
  { z: 9, symbol: 'F', nameAr: 'فلور', nameEn: 'Fluorine', nameKu: 'فلۆر', nameKmr: 'Florîn', stableN: [10] },
  { z: 10, symbol: 'Ne', nameAr: 'نيون', nameEn: 'Neon', nameKu: 'نیۆن', nameKmr: 'Neon', stableN: [10, 11, 12] },
];

export const BuildAtomSim: React.FC<BuildAtomSimProps> = ({ lang }) => {
  const [protons, setProtons] = useState<number>(1);
  const [neutrons, setNeutrons] = useState<number>(0);
  const [electrons, setElectrons] = useState<number>(1);
  const [modelType, setModelType] = useState<'orbits' | 'cloud'>('orbits');

  const element = ELEMENTS.find((e) => e.z === protons) || {
    z: protons,
    symbol: `E${protons}`,
    nameAr: `عنصر ${protons}`,
    nameEn: `Element ${protons}`,
    nameKu: `توخمی ${protons}`,
    nameKmr: `Element ${protons}`,
    stableN: [protons],
  };

  const massNumber = protons + neutrons;
  const netCharge = protons - electrons;
  const isStable = element.stableN ? element.stableN.includes(neutrons) : neutrons === protons;

  const elemName = {
    ar: element.nameAr,
    en: element.nameEn,
    ku: element.nameKu,
    kmr: element.nameKmr,
  }[lang];

  // Shell electron distribution (Bohr: 2, 8, 18...)
  const shell1 = Math.min(electrons, 2);
  const shell2 = Math.min(Math.max(electrons - 2, 0), 8);

  const t = {
    ar: {
      title: 'بناء الذرة والنموذج الذري (Z = p, A = p + n)',
      protons: 'البروتونات (Z)',
      neutrons: 'النيوترونات (N)',
      electrons: 'الإلكترونات (e⁻)',
      massNumber: 'العدد الكتلي (A)',
      netCharge: 'الشحنة الكلية (Net Charge)',
      neutral: 'ذرة متعادلة كهربائياً',
      positiveIon: 'أيون موجب (كاتيون)',
      negativeIon: 'أيون سالب (أنيون)',
      stable: 'نظير نووي مستقر ✅',
      unstable: 'نظير غير مستقر (مشع) ⚠️',
      orbits: 'مدارات بور',
      cloud: 'السحابة الإلكترونية',
      reset: 'إعادة ضبط الذرة',
    },
    en: {
      title: 'Build an Atom & Quantum Model (Z = p, A = p + n)',
      protons: 'Protons (Z)',
      neutrons: 'Neutrons (N)',
      electrons: 'Electrons (e⁻)',
      massNumber: 'Mass Number (A)',
      netCharge: 'Net Charge',
      neutral: 'Neutral Atom',
      positiveIon: 'Positive Ion (Cation)',
      negativeIon: 'Negative Ion (Anion)',
      stable: 'Stable Isotope ✅',
      unstable: 'Unstable Isotope (Radioactive) ⚠️',
      orbits: 'Bohr Orbits',
      cloud: 'Electron Cloud',
      reset: 'Reset Atom',
    },
    ku: {
      title: 'دروستکردنی گەردیلە و مۆدێلی ئەتۆمی',
      protons: 'پرۆتۆنەکان (Z)',
      neutrons: 'نیوترۆنەکان (N)',
      electrons: 'ئەلیکترۆنەکان (e⁻)',
      massNumber: 'ژمارەی بارستە (A)',
      netCharge: 'بارگەی گشتی',
      neutral: 'گەردیلەی بێ بارگە',
      positiveIon: 'ئایۆنی ئەرێنی',
      negativeIon: 'ئایۆنی نەرێنی',
      stable: 'نۆکڵیدای جێگیر ✅',
      unstable: 'نادیار و تیشکدەر ⚠️',
      orbits: 'خولگەی بۆر',
      cloud: 'هەوری ئەلیکترۆنی',
      reset: 'ڕێکخستنەوەی گەردیلە',
    },
    kmr: {
      title: 'Avakirina Atomê û Mînakên Bohr (Z = p, A = p + n)',
      protons: 'Proton (Z)',
      neutrons: 'Neutron (N)',
      electrons: 'Elektron (e⁻)',
      massNumber: 'Hejmara Masayê (A)',
      netCharge: 'Barga Giştî',
      neutral: 'Atoma Bêalî',
      positiveIon: 'Îyona Erênî (Katyon)',
      negativeIon: 'Îyona Neyînî (Anyon)',
      stable: 'Îzotopa Berxwedêr ✅',
      unstable: 'Îzotopa Radyoaktîf ⚠️',
      orbits: 'Xelekên Bohr',
      cloud: 'Ewra Elektronî',
      reset: 'Nûkirina Atomê',
    },
  }[lang];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            <Atom  className="w-6 h-6 animate-spin-slow"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{t.title}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 1</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors"
          >
            {modelType === 'orbits' ? t.cloud : t.orbits}
          </button>
          <button className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title={t.reset}
          >
            <RotateCcw  className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Main Canvas & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Atom Stage */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[420px] overflow-hidden space-y-4">
          {/* Top Status & Element Identifier Strip */}
          <div className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            {/* Element Identity */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-950/80 border border-indigo-500/50 rounded-xl flex flex-col items-center justify-center shadow-md">
                <span className="text-xl font-black text-indigo-300 leading-none">{element.symbol}</span>
                <span className="text-[9px] text-slate-400 font-mono">Z={protons}</span>
              </div>
              <div>
                <span className="text-sm font-bold text-white block">{elemName}</span>
                <span className="text-xs text-slate-400 font-mono">A = {massNumber} (p: {protons}, n: {neutrons})</span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-col sm:flex-row gap-1.5 items-end sm:items-center">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  netCharge === 0
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : netCharge > 0
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                }`}
              >
                {netCharge === 0 ? t.neutral : netCharge > 0 ? `${t.positiveIon} (+${netCharge})` : `${t.negativeIon} (${netCharge})`}
              </span>
              <span
               className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${ isStable ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/60 text-rose-300 border-rose-500/40' }`}>
                {isStable ? t.stable : t.unstable}
              </span>
            </div>
          </div>

          {/* Atom Graphic (Unobstructed) */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-auto">
            {/* Outer Orbit (n=2) */}
            {electrons > 2 && (
              <div className="absolute inset-2 rounded-full border border-sky-500/25 animate-spin-slow">
                {Array.from({ length: shell2 }).map((_, i) => {
                  const angle = (i * 360) / Math.max(shell2, 1);
                  const rad = (angle * Math.PI) / 180;
                  const x = 50 + 48 * Math.cos(rad);
                  const y = 50 + 48 * Math.sin(rad);
                  return (
                    <div
                      key={`s2-${i}`}
                      style={{ top: `${y}%`, left: `${x}%` }}
                     className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-sky-400 rounded-full shadow-lg shadow-sky-400/80 ring-2 ring-sky-300"/>
                  );
                })}
              </div>
            )}

            {/* Inner Orbit (n=1) */}
            {electrons > 0 && (
              <div className="absolute inset-16 rounded-full border border-sky-400/40 animate-spin-reverse">
                {Array.from({ length: shell1 }).map((_, i) => {
                  const angle = (i * 360) / Math.max(shell1, 1);
                  const rad = (angle * Math.PI) / 180;
                  const x = 50 + 46 * Math.cos(rad);
                  const y = 50 + 46 * Math.sin(rad);
                  return (
                    <div
                      key={`s1-${i}`}
                      style={{ top: `${y}%`, left: `${x}%` }}
                     className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-sky-400 rounded-full shadow-lg shadow-sky-400/80 ring-2 ring-sky-300"/>
                  );
                })}
              </div>
            )}

            {/* Nucleus in center */}
            <div className="relative w-20 h-20 rounded-full bg-slate-900/80 border border-slate-700/80 flex items-center justify-center p-1 shadow-inner">
              <div className="flex flex-wrap items-center justify-center gap-1 max-w-[60px]">
                {Array.from({ length: protons }).map((_, i) => (
                  <div
                    key={`p-${i}`}
                    title="Proton (+)"
                   className="w-3.5 h-3.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-full shadow-sm text-[8px] font-bold text-white flex items-center justify-center">
                    +
                  </div>
                ))}
                {Array.from({ length: neutrons }).map((_, i) => (
                  <div
                    key={`n-${i}`}
                    title="Neutron (0)"
                   className="w-3.5 h-3.5 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full shadow-sm text-[8px] font-bold text-slate-900 flex items-center justify-center">
                    0
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-mono flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
              {t.protons}: {protons}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-slate-400 rounded-full inline-block"></span>
              {t.neutrons}: {neutrons}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-sky-400 rounded-full inline-block"></span>
              {t.electrons}: {electrons}
            </span>
          </div>
        </div>

        {/* Controls & Properties */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Sliders */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Protons */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {t.protons} (Z)
                </span>
                <span className="font-mono text-white text-sm">{protons}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={protons}
                onChange={(e) => setProtons(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Neutrons */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                  {t.neutrons} (N)
                </span>
                <span className="font-mono text-white text-sm">{neutrons}</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={neutrons}
                onChange={(e) => setNeutrons(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>

            {/* Electrons */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
                  {t.electrons} (e⁻)
                </span>
                <span className="font-mono text-white text-sm">{electrons}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={electrons}
                onChange={(e) => setElectrons(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>

          {/* Live Calculated Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block">{t.massNumber} (A)</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{massNumber} u</span>
              <span className="text-[10px] text-slate-500 block">A = {protons} + {neutrons}</span>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block">{t.netCharge} (Q)</span>
              <span className={`text-lg font-bold font-mono ${netCharge === 0 ? 'text-emerald-400' : netCharge > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                {netCharge > 0 ? `+${netCharge}` : netCharge} e
              </span>
              <span className="text-[10px] text-slate-500 block">Q = {protons} - {electrons}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};