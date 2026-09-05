import { 
  Atom, 
  RotateCcw, 
  Plus, 
  Minus, 
  Zap, 
  Check, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface BuildAtomSimProps {
  lang: Language;
  onLogMeasurement?: (record: any) => void;
}

export interface ElementData {
  z: number;
  symbol: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  stableN: number[];
  period: number;
  group: number;
}

export const ELEMENTS: ElementData[] = [
  { z: 1, symbol: 'H', nameAr: 'هيدروجين', nameEn: 'Hydrogen', nameKu: 'هایدرۆجین', nameKmr: 'Hîdrojen', stableN: [0, 1], period: 1, group: 1 },
  { z: 2, symbol: 'He', nameAr: 'هيليوم', nameEn: 'Helium', nameKu: 'هیلیۆم', nameKmr: 'Helyûm', stableN: [1, 2], period: 1, group: 18 },
  { z: 3, symbol: 'Li', nameAr: 'ليثيوم', nameEn: 'Lithium', nameKu: 'لیتیۆم', nameKmr: 'Lîtyûm', stableN: [3, 4], period: 2, group: 1 },
  { z: 4, symbol: 'Be', nameAr: 'بيريليوم', nameEn: 'Beryllium', nameKu: 'بێریلیۆم', nameKmr: 'Berîlyûm', stableN: [5], period: 2, group: 2 },
  { z: 5, symbol: 'B', nameAr: 'بورون', nameEn: 'Boron', nameKu: 'بۆرۆن', nameKmr: 'Boron', stableN: [5, 6], period: 2, group: 13 },
  { z: 6, symbol: 'C', nameAr: 'كربون', nameEn: 'Carbon', nameKu: 'کاربۆن', nameKmr: 'Karbon', stableN: [6, 7], period: 2, group: 14 },
  { z: 7, symbol: 'N', nameAr: 'نيتروجين', nameEn: 'Nitrogen', nameKu: 'نایترۆجین', nameKmr: 'Nîtrojen', stableN: [7, 8], period: 2, group: 15 },
  { z: 8, symbol: 'O', nameAr: 'أكسجين', nameEn: 'Oxygen', nameKu: 'ئۆکسجین', nameKmr: 'Oksîjen', stableN: [8, 9, 10], period: 2, group: 16 },
  { z: 9, symbol: 'F', nameAr: 'فلور', nameEn: 'Fluorine', nameKu: 'فلۆر', nameKmr: 'Florîn', stableN: [10], period: 2, group: 17 },
  { z: 10, symbol: 'Ne', nameAr: 'نيون', nameEn: 'Neon', nameKu: 'نیۆن', nameKmr: 'Neon', stableN: [10, 11, 12], period: 2, group: 18 },
  { z: 11, symbol: 'Na', nameAr: 'صوديوم', nameEn: 'Sodium', nameKu: 'سۆدیۆم', nameKmr: 'Sodyûm', stableN: [12], period: 3, group: 1 },
  { z: 12, symbol: 'Mg', nameAr: 'مغنيسيوم', nameEn: 'Magnesium', nameKu: 'مەگنیسیۆم', nameKmr: 'Magnezyûm', stableN: [12, 13, 14], period: 3, group: 2 },
];

export const BuildAtomSim: React.FC<BuildAtomSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();
  const [protons, setProtons] = useState<number>(1);
  const [neutrons, setNeutrons] = useState<number>(0);
  const [electrons, setElectrons] = useState<number>(1);
  const [modelType, setModelType] = useState<'orbits' | 'cloud'>('orbits');
  const [logged, setLogged] = useState(false);

  const element = ELEMENTS.find((e) => e.z === protons) || {
    z: protons,
    symbol: `E${protons}`,
    nameAr: `عنصر ${protons}`,
    nameEn: `Element ${protons}`,
    nameKu: `توخمی ${protons}`,
    nameKmr: `Element ${protons}`,
    stableN: [protons],
    period: 1,
    group: 1,
  };

  const massNumber = protons + neutrons;
  const netCharge = protons - electrons;
  const isStable = element.stableN ? element.stableN.includes(neutrons) : neutrons === protons;

  // Electron Shell Distribution (Bohr model: Shell 1 max 2, Shell 2 max 8, Shell 3 max 8)
  const shell1 = Math.min(electrons, 2);
  const shell2 = Math.min(Math.max(electrons - 2, 0), 8);
  const shell3 = Math.min(Math.max(electrons - 10, 0), 8);
  const valenceElectrons = shell3 > 0 ? shell3 : shell2 > 0 ? shell2 : shell1;

  // Interleaved nucleons list for realistic cluster rendering
  const nucleons = useMemo(() => {
    const list: Array<{ type: 'proton' | 'neutron'; id: number }> = [];
    const maxLen = Math.max(protons, neutrons);
    for (let i = 0; i < maxLen; i++) {
      if (i < protons) list.push({ type: 'proton', id: i });
      if (i < neutrons) list.push({ type: 'neutron', id: i });
    }
    return list;
  }, [protons, neutrons]);

  // Deterministic 2D phyllotaxis packing for nucleus center
  const nucleonPositions = useMemo(() => {
    const total = nucleons.length;
    if (total === 0) return [];
    if (total === 1) return [{ x: 50, y: 50 }];

    return nucleons.map((_, i) => {
      const angle = i * 2.399963; // golden angle (~137.5 deg)
      // Radius scale dynamically adjusts with total nucleon count to prevent overflowing
      const maxR = total > 16 ? 38 : total > 8 ? 34 : 26;
      const r = Math.sqrt((i + 0.6) / total) * maxR;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      return { x, y };
    });
  }, [nucleons]);

  // Deterministic electron cloud dots based on quantum probability distribution
  const cloudDots = useMemo(() => {
    if (electrons === 0) return [];
    const dots: Array<{ x: number; y: number; opacity: number; size: number }> = [];
    const count = electrons * 12; // 12 samples per electron for rich wave-density visualization
    
    for (let i = 0; i < count; i++) {
      // Golden spiral distribution with radial probability
      const angle = i * 1.61803398875 * Math.PI * 2;
      // Normal radial spread: more dense near Bohr radius (25-45%), tapering outward
      const u = ((i * 37) % 100) / 100;
      const v = ((i * 73) % 100) / 100;
      const r = 18 + (u * 0.6 + v * 0.4) * 58;
      const x = 50 + r * Math.cos(angle) * 0.68;
      const y = 50 + r * Math.sin(angle) * 0.68;
      const opacity = 0.25 + 0.65 * Math.exp(-Math.abs(r - 35) / 18);
      dots.push({ x, y, opacity, size: (i % 3 === 0 ? 3 : 2) });
    }
    return dots;
  }, [electrons]);

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'build_atom',
        element: element.symbol,
        elementName: elemName,
        protons,
        neutrons,
        electrons,
        massNumber,
        netCharge,
        isStable,
        valenceElectrons,
        modelType,
        timestamp: new Date().toISOString()
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Quick Action Handlers
  const handleSelectElement = (el: ElementData) => {
    setProtons(el.z);
    setNeutrons(el.stableN[0] ?? el.z);
    setElectrons(el.z); // Neutral atom by default
  };

  const handleNeutralize = () => {
    setElectrons(protons);
  };

  const handleMakeStable = () => {
    if (element.stableN && element.stableN.length > 0) {
      setNeutrons(element.stableN[0]);
    } else {
      setNeutrons(protons);
    }
  };

  const handleReset = () => {
    setProtons(1);
    setNeutrons(0);
    setElectrons(1);
    setModelType('orbits');
  };

  const elemName = {
    ar: element.nameAr,
    en: element.nameEn,
    ku: element.nameKu,
    kmr: element.nameKmr,
  }[lang];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl" id="build-atom-container">
      {/* Top Banner & Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            <Atom className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {tI18n('experiments.build_atom.title')}
            </h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 1</p>
          </div>
        </div>

        {/* Model Switcher & Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Model Toggle: Orbits vs Cloud */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-inner">
            <button
              id="model-orbits-btn"
              type="button"
              onClick={() => setModelType('orbits')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                modelType === 'orbits'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={tI18n('experiments.build_atom.orbits')}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{tI18n('experiments.build_atom.orbits')}</span>
            </button>
            <button
              id="model-cloud-btn"
              type="button"
              onClick={() => setModelType('cloud')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                modelType === 'cloud'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={tI18n('experiments.build_atom.cloud')}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tI18n('experiments.build_atom.cloud')}</span>
            </button>
          </div>

          {/* Quick Neutralize Button */}
          <button
            id="make-neutral-btn"
            type="button"
            onClick={handleNeutralize}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              netCharge === 0
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 cursor-default'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-emerald-500/50'
            }`}
            title={tI18n('experiments.build_atom.makeNeutral')}
          >
            <Zap className={`w-3.5 h-3.5 ${netCharge === 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{tI18n('experiments.build_atom.makeNeutral')}</span>
          </button>

          {/* Quick Stable Isotope Button */}
          <button
            id="make-stable-btn"
            type="button"
            onClick={handleMakeStable}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isStable
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 cursor-default'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-rose-500/50'
            }`}
            title={tI18n('experiments.build_atom.stableIsotope')}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tI18n('experiments.build_atom.stableIsotope')}</span>
          </button>

          {/* Log Measurement Button */}
          <button
            id="log-measurement-btn"
            type="button"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              logged
                ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
            }`}
          >
            {logged ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 text-center">📊</span>}
            <span>{logged ? tI18n('experiments.build_atom.logged') : tI18n('experiments.build_atom.log')}</span>
          </button>

          {/* Reset Button */}
          <button
            id="reset-atom-btn"
            type="button"
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center justify-center shadow-sm"
            title={tI18n('experiments.build_atom.reset')}
            aria-label={tI18n('experiments.build_atom.reset')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Periodic Table Quick Element Selector Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Atom className="w-3.5 h-3.5 text-indigo-400" />
            {tI18n('experiments.build_atom.commonElements')} (Z = 1 → 12)
          </span>
          <span className="text-[11px] text-indigo-300 font-mono">
            {elemName} ({element.symbol})
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {ELEMENTS.map((el) => {
            const isCurrent = el.z === protons;
            return (
              <button
                key={el.symbol}
                id={`element-btn-${el.symbol.toLowerCase()}`}
                type="button"
                onClick={() => handleSelectElement(el)}
                className={`min-h-[42px] px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex flex-col items-center justify-center border ${
                  isCurrent
                    ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/40 scale-105'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title={`${el.nameEn} (Z=${el.z})`}
              >
                <span className="text-[9px] text-slate-400 font-normal leading-none mb-0.5">{el.z}</span>
                <span className="text-sm font-black leading-none">{el.symbol}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Atom Stage */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between min-h-[440px] overflow-hidden space-y-4">
          {/* Top Status & Element Identifier Strip */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
            {/* Element Identity with Standard Isotope Notation */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-indigo-950/80 border border-indigo-500/50 rounded-xl flex items-center justify-center shadow-md px-1.5 gap-1">
                {/* Isotope Notation: Left superscripts A and Z, then Symbol */}
                <div className="flex flex-col text-right font-mono font-bold leading-none text-slate-400 text-[11px]">
                  <span className="text-amber-400" title={`Mass number A = ${massNumber}`}>{massNumber}</span>
                  <span className="text-red-400" title={`Atomic number Z = ${protons}`}>{protons}</span>
                </div>
                <span className="text-2xl font-black text-indigo-300 leading-none">{element.symbol}</span>
              </div>
              <div>
                <span className="text-base font-bold text-white block">{elemName}</span>
                <span className="text-xs text-slate-400 font-mono">
                  {element.symbol}-{massNumber} • (p: {protons}, n: {neutrons}, e⁻: {electrons})
                </span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* Charge Badge */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  netCharge === 0
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : netCharge > 0
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                }`}
              >
                {netCharge === 0 ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    {tI18n('experiments.build_atom.neutral')}
                  </>
                ) : netCharge > 0 ? (
                  <>
                    <span className="font-mono font-black text-amber-400">+{netCharge}</span>
                    {tI18n('experiments.build_atom.positiveIon')}
                  </>
                ) : (
                  <>
                    <span className="font-mono font-black text-sky-400">{netCharge}</span>
                    {tI18n('experiments.build_atom.negativeIon')}
                  </>
                )}
              </span>

              {/* Stability Badge */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  isStable
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse'
                }`}
              >
                {isStable ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {tI18n('experiments.build_atom.stable')}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    {tI18n('experiments.build_atom.unstable')}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Atom Graphic Stage */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-auto select-none">
            {/* Quantum Electron Cloud Model */}
            {modelType === 'cloud' && electrons > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Background diffuse glow */}
                <div
                  className="absolute w-full h-full rounded-full bg-sky-500/10 blur-3xl animate-pulse"
                  style={{ opacity: Math.min(electrons * 0.08, 0.45) }}
                />
                <div
                  className="absolute w-3/4 h-3/4 rounded-full bg-sky-400/15 blur-2xl animate-spin-slow"
                  style={{ opacity: Math.min(electrons * 0.12, 0.5) }}
                />

                {/* Deterministic probability distribution dots */}
                {cloudDots.map((dot, idx) => (
                  <div
                    key={`cloud-dot-${idx}`}
                    style={{
                      top: `${dot.y}%`,
                      left: `${dot.x}%`,
                      opacity: dot.opacity,
                      width: `${dot.size}px`,
                      height: `${dot.size}px`,
                    }}
                    className="absolute bg-sky-300 rounded-full blur-[0.5px] -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                  />
                ))}
              </div>
            )}

            {/* Classical Bohr Orbits Model */}
            {modelType === 'orbits' && (
              <>
                {/* Outer Orbit (n=3) - For Na (Z=11), Mg (Z=12) */}
                {shell3 > 0 && (
                  <div className="absolute inset-1 rounded-full border border-sky-500/20 animate-spin-slow">
                    {Array.from({ length: shell3 }).map((_, i) => {
                      const angle = (i * 360) / Math.max(shell3, 1);
                      const rad = (angle * Math.PI) / 180;
                      const x = 50 + 49 * Math.cos(rad);
                      const y = 50 + 49 * Math.sin(rad);
                      return (
                        <div
                          key={`s3-${i}`}
                          style={{ top: `${y}%`, left: `${x}%` }}
                          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-sky-400 rounded-full shadow-lg shadow-sky-400/80 ring-2 ring-sky-300"
                          title="Electron (n=3 / M shell)"
                        />
                      );
                    })}
                  </div>
                )}

                {/* Middle Orbit (n=2, L shell, max 8) */}
                {shell2 > 0 && (
                  <div className="absolute inset-9 sm:inset-10 rounded-full border border-sky-500/30 animate-spin-slow">
                    {Array.from({ length: shell2 }).map((_, i) => {
                      const angle = (i * 360) / Math.max(shell2, 1);
                      const rad = (angle * Math.PI) / 180;
                      const x = 50 + 48 * Math.cos(rad);
                      const y = 50 + 48 * Math.sin(rad);
                      return (
                        <div
                          key={`s2-${i}`}
                          style={{ top: `${y}%`, left: `${x}%` }}
                          className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 bg-sky-400 rounded-full shadow-lg shadow-sky-400/80 ring-2 ring-sky-300"
                          title="Electron (n=2 / L shell)"
                        />
                      );
                    })}
                  </div>
                )}

                {/* Inner Orbit (n=1, K shell, max 2) */}
                {shell1 > 0 && (
                  <div className="absolute inset-20 sm:inset-24 rounded-full border border-sky-400/40 animate-spin-reverse">
                    {Array.from({ length: shell1 }).map((_, i) => {
                      const angle = (i * 360) / Math.max(shell1, 1);
                      const rad = (angle * Math.PI) / 180;
                      const x = 50 + 46 * Math.cos(rad);
                      const y = 50 + 46 * Math.sin(rad);
                      return (
                        <div
                          key={`s1-${i}`}
                          style={{ top: `${y}%`, left: `${x}%` }}
                          className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 bg-sky-400 rounded-full shadow-lg shadow-sky-400/80 ring-2 ring-sky-300"
                          title="Electron (n=1 / K shell)"
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Nucleus at the Center: dynamically scaled and tightly packed */}
            <div
              className={`relative rounded-full bg-slate-900/90 border flex items-center justify-center p-1 shadow-2xl transition-all duration-300 ${
                isStable ? 'border-red-500/40 shadow-red-950/30' : 'border-rose-500/70 shadow-rose-950/50 animate-pulse'
              }`}
              style={{
                width: `${Math.max(68, Math.min(108, 60 + Math.sqrt(massNumber) * 10))}px`,
                height: `${Math.max(68, Math.min(108, 60 + Math.sqrt(massNumber) * 10))}px`,
              }}
              title={`Nucleus (${protons} Protons, ${neutrons} Neutrons)`}
            >
              {nucleons.map((nuc, idx) => {
                const pos = nucleonPositions[idx] || { x: 50, y: 50 };
                const isProton = nuc.type === 'proton';
                return (
                  <div
                    key={`${nuc.type}-${nuc.id}`}
                    style={{
                      top: `${pos.y}%`,
                      left: `${pos.x}%`,
                    }}
                    title={isProton ? `Proton #${nuc.id + 1} (+)` : `Neutron #${nuc.id + 1} (0)`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md text-[9px] font-black flex items-center justify-center transition-all duration-300 select-none ${
                      isProton
                        ? 'w-4 h-4 bg-gradient-to-br from-red-500 to-rose-600 text-white ring-1 ring-red-300/40'
                        : 'w-4 h-4 bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 ring-1 ring-slate-100/40'
                    }`}
                  >
                    {isProton ? '+' : '0'}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subatomic Particle Legend with Quick-Add Buttons */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-red-500 rounded-full inline-block shadow-sm"></span>
                <span className="text-slate-300 font-semibold">{tI18n('experiments.build_atom.protons')}:</span>
                <span className="text-white font-bold">{protons}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-400 rounded-full inline-block shadow-sm"></span>
                <span className="text-slate-300 font-semibold">{tI18n('experiments.build_atom.neutrons')}:</span>
                <span className="text-white font-bold">{neutrons}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-sky-400 rounded-full inline-block shadow-sm"></span>
                <span className="text-slate-300 font-semibold">{tI18n('experiments.build_atom.electrons')}:</span>
                <span className="text-white font-bold">{electrons}</span>
              </span>
            </div>

            {/* Electron shell summary */}
            <div className="text-[11px] text-sky-300 bg-sky-950/40 border border-sky-800/40 px-2 py-1 rounded-md font-mono">
              <span>{tI18n('experiments.build_atom.electronConfig')}: </span>
              <span className="font-bold text-white">
                [K:{shell1}{shell2 > 0 ? `, L:${shell2}` : ''}{shell3 > 0 ? `, M:${shell3}` : ''}]
              </span>
            </div>
          </div>
        </div>

        {/* Controls & Particle Sliders with Accessible + / - Stepper Buttons */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
            {/* Protons Control (Z) with + / - Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-red-400 flex items-center gap-1.5 text-sm">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span>
                  {tI18n('experiments.build_atom.protons')} (Z)
                </span>
                <span className="font-mono text-white text-base font-bold bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md">
                  {protons}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="proton-decrement-btn"
                  type="button"
                  onClick={() => setProtons((prev) => Math.max(1, prev - 1))}
                  disabled={protons <= 1}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title={`${tI18n('experiments.build_atom.removeParticle')} (p)`}
                  aria-label="Remove Proton"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="proton-slider"
                  type="range"
                  min="1"
                  max="12"
                  value={protons}
                  onChange={(e) => setProtons(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <button
                  id="proton-increment-btn"
                  type="button"
                  onClick={() => setProtons((prev) => Math.min(12, prev + 1))}
                  disabled={protons >= 12}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title={`${tI18n('experiments.build_atom.addParticle')} (p)`}
                  aria-label="Add Proton"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Neutrons Control (N) with + / - Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5 text-sm">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-full shadow-sm"></span>
                  {tI18n('experiments.build_atom.neutrons')} (N)
                </span>
                <span className="font-mono text-white text-base font-bold bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md">
                  {neutrons}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="neutron-decrement-btn"
                  type="button"
                  onClick={() => setNeutrons((prev) => Math.max(0, prev - 1))}
                  disabled={neutrons <= 0}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title={`${tI18n('experiments.build_atom.removeParticle')} (n)`}
                  aria-label="Remove Neutron"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="neutron-slider"
                  type="range"
                  min="0"
                  max="16"
                  value={neutrons}
                  onChange={(e) => setNeutrons(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                />
                <button
                  id="neutron-increment-btn"
                  type="button"
                  onClick={() => setNeutrons((prev) => Math.min(16, prev + 1))}
                  disabled={neutrons >= 16}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title={`${tI18n('experiments.build_atom.addParticle')} (n)`}
                  aria-label="Add Neutron"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Electrons Control (e⁻) with + / - Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-sky-400 flex items-center gap-1.5 text-sm">
                  <span className="w-2.5 h-2.5 bg-sky-400 rounded-full shadow-sm"></span>
                  {tI18n('experiments.build_atom.electrons')} (e⁻)
                </span>
                <span className="font-mono text-white text-base font-bold bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md">
                  {electrons}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="electron-decrement-btn"
                  type="button"
                  onClick={() => setElectrons((prev) => Math.max(0, prev - 1))}
                  disabled={electrons <= 0}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-sky-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title={`${tI18n('experiments.build_atom.removeParticle')} (e⁻)`}
                  aria-label="Remove Electron"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="electron-slider"
                  type="range"
                  min="0"
                  max="12"
                  value={electrons}
                  onChange={(e) => setElectrons(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <button
                  id="electron-increment-btn"
                  type="button"
                  onClick={() => setElectrons((prev) => Math.min(12, prev + 1))}
                  disabled={electrons >= 12}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-sky-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title={`${tI18n('experiments.build_atom.addParticle')} (e⁻)`}
                  aria-label="Add Electron"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Calculated Nuclear & Electronic Properties */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mass Number Card */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">
                {tI18n('experiments.build_atom.massNumber')} (A)
              </span>
              <span className="text-xl font-bold text-amber-400 font-mono block">
                {massNumber} <span className="text-xs text-amber-500/80 font-normal">u</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                A = p ({protons}) + n ({neutrons})
              </span>
            </div>

            {/* Net Charge Card */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">
                {tI18n('experiments.build_atom.netCharge')} (Q)
              </span>
              <span
                className={`text-xl font-bold font-mono block ${
                  netCharge === 0 ? 'text-emerald-400' : netCharge > 0 ? 'text-amber-400' : 'text-sky-400'
                }`}
              >
                {netCharge > 0 ? `+${netCharge}` : netCharge} <span className="text-xs font-normal">e</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                Q = p ({protons}) - e⁻ ({electrons})
              </span>
            </div>

            {/* Valence Electrons */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">
                {tI18n('experiments.build_atom.valenceElectrons')}
              </span>
              <span className="text-xl font-bold text-sky-400 font-mono block">
                {valenceElectrons} <span className="text-xs text-sky-500/80 font-normal">e⁻</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                Group {element.group}
              </span>
            </div>

            {/* Nuclear Stability */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">
                {tI18n('experiments.build_nucleus.valleyOfStability') || 'Isotope Stability'}
              </span>
              <span className={`text-base font-bold font-mono flex items-center gap-1 ${isStable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isStable ? (
                  <>
                    <ShieldCheck className="w-4 h-4 inline" />
                    <span>Stable</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 inline" />
                    <span>Radioactive</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                N/Z = {(neutrons / Math.max(protons, 1)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
