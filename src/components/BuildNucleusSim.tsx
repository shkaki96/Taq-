import { 
  Shield, 
  RotateCcw, 
  BookmarkCheck, 
  Check, 
  Plus, 
  Minus, 
  Flame, 
  Split, 
  ShieldCheck, 
  AlertTriangle,
  Info
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface BuildNucleusSimProps {
  lang: Language;
  onLogMeasurement?: (record: any) => void;
}

// Element data for Z = 1 to 92 (common elements named, fallback for others)
interface ElementMeta {
  symbol: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  stableN: number;
}

const ELEMENT_METAS: Record<number, ElementMeta> = {
  1: { symbol: 'H', nameAr: 'هيدروجين', nameEn: 'Hydrogen', nameKu: 'هایدرۆجین', nameKmr: 'Hîdrojen', stableN: 0 },
  2: { symbol: 'He', nameAr: 'هيليوم', nameEn: 'Helium', nameKu: 'هیلیۆم', nameKmr: 'Helyûm', stableN: 2 },
  3: { symbol: 'Li', nameAr: 'ليثيوم', nameEn: 'Lithium', nameKu: 'لیتیۆم', nameKmr: 'Lîtyûm', stableN: 4 },
  4: { symbol: 'Be', nameAr: 'بيريليوم', nameEn: 'Beryllium', nameKu: 'بێریلیۆم', nameKmr: 'Berîlyûm', stableN: 5 },
  5: { symbol: 'B', nameAr: 'بورون', nameEn: 'Boron', nameKu: 'بۆرۆن', nameKmr: 'Boron', stableN: 6 },
  6: { symbol: 'C', nameAr: 'كربون', nameEn: 'Carbon', nameKu: 'کاربۆن', nameKmr: 'Karbon', stableN: 6 },
  7: { symbol: 'N', nameAr: 'نيتروجين', nameEn: 'Nitrogen', nameKu: 'نایترۆجین', nameKmr: 'Nîtrojen', stableN: 7 },
  8: { symbol: 'O', nameAr: 'أكسجين', nameEn: 'Oxygen', nameKu: 'ئۆکسجین', nameKmr: 'Oksîjen', stableN: 8 },
  9: { symbol: 'F', nameAr: 'فلور', nameEn: 'Fluorine', nameKu: 'فلۆر', nameKmr: 'Florîn', stableN: 10 },
  10: { symbol: 'Ne', nameAr: 'نيون', nameEn: 'Neon', nameKu: 'نیۆن', nameKmr: 'Neon', stableN: 10 },
  11: { symbol: 'Na', nameAr: 'صوديوم', nameEn: 'Sodium', nameKu: 'سۆدیۆم', nameKmr: 'Sodyûm', stableN: 12 },
  12: { symbol: 'Mg', nameAr: 'مغنيسيوم', nameEn: 'Magnesium', nameKu: 'مەگنیسیۆم', nameKmr: 'Magnezyûm', stableN: 12 },
  13: { symbol: 'Al', nameAr: 'ألومنيوم', nameEn: 'Aluminium', nameKu: 'ئەلەمنیۆم', nameKmr: 'Alumînyûm', stableN: 14 },
  14: { symbol: 'Si', nameAr: 'سيليكون', nameEn: 'Silicon', nameKu: 'سلیکۆن', nameKmr: 'Sîlîsyûm', stableN: 14 },
  15: { symbol: 'P', nameAr: 'فسفور', nameEn: 'Phosphorus', nameKu: 'فۆسفۆر', nameKmr: 'Fosfor', stableN: 16 },
  16: { symbol: 'S', nameAr: 'كبريت', nameEn: 'Sulfur', nameKu: 'دۆشاو/کبریت', nameKmr: 'Kukurt', stableN: 16 },
  17: { symbol: 'Cl', nameAr: 'كلور', nameEn: 'Chlorine', nameKu: 'کلۆر', nameKmr: 'Klor', stableN: 18 },
  18: { symbol: 'Ar', nameAr: 'أرجون', nameEn: 'Argon', nameKu: 'ئارگۆن', nameKmr: 'Argon', stableN: 22 },
  19: { symbol: 'K', nameAr: 'بوتاسيوم', nameEn: 'Potassium', nameKu: 'پۆتاسیۆم', nameKmr: 'Potasyûm', stableN: 20 },
  20: { symbol: 'Ca', nameAr: 'كالسيوم', nameEn: 'Calcium', nameKu: 'کالیسیۆم', nameKmr: 'Kalsiyûm', stableN: 20 },
  26: { symbol: 'Fe', nameAr: 'حديد', nameEn: 'Iron', nameKu: 'ئاسن', nameKmr: 'Hesin', stableN: 30 },
  28: { symbol: 'Ni', nameAr: 'نيكل', nameEn: 'Nickel', nameKu: 'نیکل', nameKmr: 'Nîkel', stableN: 34 },
  29: { symbol: 'Cu', nameAr: 'نحاس', nameEn: 'Copper', nameKu: 'مس', nameKmr: 'Sifir', stableN: 34 },
  30: { symbol: 'Zn', nameAr: 'زنك', nameEn: 'Zinc', nameKu: 'زینک', nameKmr: 'Zînko', stableN: 34 },
  47: { symbol: 'Ag', nameAr: 'فضة', nameEn: 'Silver', nameKu: 'زیو', nameKmr: 'Zîv', stableN: 60 },
  50: { symbol: 'Sn', nameAr: 'قصدير', nameEn: 'Tin', nameKu: 'قەڵای', nameKmr: 'Qelayî', stableN: 70 },
  79: { symbol: 'Au', nameAr: 'ذهب', nameEn: 'Gold', nameKu: 'ئاڵتوون', nameKmr: 'Zêr', stableN: 118 },
  82: { symbol: 'Pb', nameAr: 'رصاص', nameEn: 'Lead', nameKu: 'قورقوشم', nameKmr: 'Qurqûşum', stableN: 126 },
  92: { symbol: 'U', nameAr: 'يورانيوم', nameEn: 'Uranium', nameKu: 'یۆرانیۆم', nameKmr: 'Ûranyûm', stableN: 146 },
};

export interface NuclidePreset {
  name: string;
  symbol: string;
  z: number;
  n: number;
  descAr: string;
  descEn: string;
  descKu: string;
  descKmr: string;
}

const FAMOUS_NUCLIDES: NuclidePreset[] = [
  { name: 'Deuterium', symbol: '²H', z: 1, n: 1, descAr: 'ديوتيريوم (وقود الاندماج)', descEn: 'Deuterium (Fusion fuel)', descKu: 'دیۆتیریۆم (سووتەمەنی یەکگرتن)', descKmr: 'Deuteryûm (Sotemeniya Yekbûnê)' },
  { name: 'Helium-4', symbol: '⁴He', z: 2, n: 2, descAr: 'جسيم ألفا (شديد الاستقرار)', descEn: 'Alpha particle (Double magic)', descKu: 'تەنۆلکەی ئەلفا (جێگیری بەرز)', descKmr: 'Parçeya Alfa (Berxwedana bilind)' },
  { name: 'Carbon-12', symbol: '¹²C', z: 6, n: 6, descAr: 'معيار الكتلة الذرية', descEn: 'Atomic mass standard', descKu: 'پێوەری بارستەی گەردیلەیی', descKmr: 'Pîvana masaya atomî' },
  { name: 'Oxygen-16', symbol: '¹⁶O', z: 8, n: 8, descAr: 'نواة سحرية مزدوجة', descEn: 'Doubly magic nucleus', descKu: 'ناوکی جادوویی دووانە', descKmr: 'Dendika sêhrbaz a ducarî' },
  { name: 'Iron-56', symbol: '⁵⁶Fe', z: 26, n: 30, descAr: 'قمة الاستقرار النووي', descEn: 'Peak of nuclear stability', descKu: 'لووتکەی جێگیری ناوکی', descKmr: 'Lûtkeya berxwedana dendikî' },
  { name: 'Nickel-62', symbol: '⁶²Ni', z: 28, n: 34, descAr: 'أعلى طاقة ربط للنوكليون', descEn: 'Highest BE per nucleon', descKu: 'بەرزترین وزەی بەستنەوەی نوکلێۆن', descKmr: 'Bilindtirîn enerjiya girêdanê' },
  { name: 'Lead-208', symbol: '²⁰⁸Pb', z: 82, n: 126, descAr: 'أثقل نواة مستقرة (سحرية)', descEn: 'Heaviest stable magic nucleus', descKu: 'قورسترین ناوکی جێگیر', descKmr: 'Giranbûyîtirîn dendika berxwedêr' },
  { name: 'Uranium-235', symbol: '²³⁵U', z: 92, n: 143, descAr: 'وقود الانشطار النووي', descEn: 'Fissile nuclear fuel', descKu: 'سووتەمەنی کەرتبوونی ناوکی', descKmr: 'Sotemeniya parçebûna dendikî' },
];

// Experimental benchmarks for key light nuclei (MeV)
const EXPERIMENTAL_BE: Record<string, number> = {
  '1-0': 0.0,
  '1-1': 2.224,   // Deuteron
  '1-2': 8.482,   // Tritium
  '2-1': 7.718,   // He-3
  '2-2': 28.296,  // He-4
  '3-3': 31.99,   // Li-6
  '3-4': 39.24,   // Li-7
  '4-5': 58.16,   // Be-9
  '5-6': 76.20,   // B-11
  '6-6': 92.16,   // C-12
  '7-7': 104.66,  // N-14
  '8-8': 127.62,  // O-16
  '26-30': 492.26, // Fe-56 (8.790 MeV/A)
  '28-34': 545.26, // Ni-62 (8.795 MeV/A)
  '82-126': 1636.4, // Pb-208
  '92-143': 1783.9, // U-235
  '92-146': 1801.7, // U-238
};

export const BuildNucleusSim: React.FC<BuildNucleusSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();
  const [protons, setProtons] = useState<number>(6); // Default Carbon-12
  const [neutrons, setNeutrons] = useState<number>(6);
  const [logged, setLogged] = useState(false);

  // Masses in atomic mass units (u)
  const mp = 1.007276;
  const mn = 1.008665;
  const u_to_MeV = 931.494; // 1 u = 931.494 MeV

  const A = protons + neutrons;
  const Z = protons;
  const N = neutrons;

  // Nuclear radius approximation: R = r0 * A^(1/3) fm (where r0 = 1.25 fm)
  const nuclearRadiusFm = A > 0 ? 1.25 * Math.cbrt(A) : 0;

  // Total Mass of separate constituents
  const totalConstituentMass = protons * mp + neutrons * mn;

  // Binding Energy calculation: Hybrid experimental + Bethe-Weizsäcker Liquid Drop Model
  const bindingEnergyMeV = useMemo(() => {
    const key = `${Z}-${N}`;
    if (EXPERIMENTAL_BE[key] !== undefined) {
      return EXPERIMENTAL_BE[key];
    }
    if (A <= 1) return 0;

    // Semi-empirical mass formula coefficients (Weizsäcker)
    const a_v = 15.75;
    const a_s = 17.8;
    const a_c = 0.711;
    const a_a = 23.7;
    const delta = (A % 2 !== 0) ? 0 : (Z % 2 === 0 && N % 2 === 0) ? 11.18 / Math.sqrt(A) : -11.18 / Math.sqrt(A);

    const ldm = a_v * A - a_s * Math.pow(A, 2 / 3) - a_c * (Z * (Z - 1)) / Math.pow(A, 1 / 3) - a_a * Math.pow(N - Z, 2) / A + delta;
    return Math.max(0, ldm);
  }, [A, Z, N]);

  const bePerNucleon = A > 0 ? bindingEnergyMeV / A : 0;
  const massDefect_u = bindingEnergyMeV / u_to_MeV;
  const nuclearMass_u = Math.max(0, totalConstituentMass - massDefect_u);

  // Optimal neutron count in the Valley of Stability: N ≈ Z + 0.006 * Z^(5/3)
  const optimalN = Math.round(Z <= 20 ? Z : Z + 0.006 * Math.pow(Z, 5 / 3));

  // Determine Nuclear Stability
  const stabilityInfo = useMemo(() => {
    if (A <= 1) return { isStable: true, labelKey: 'stable', desc: 'N/Z = 0' };
    const diff = N - optimalN;
    const isStable = Math.abs(diff) <= (Z <= 20 ? 1 : 3);
    
    if (isStable) {
      return { isStable: true, labelKey: 'stable', desc: `N/Z = ${(N / Math.max(Z, 1)).toFixed(2)}` };
    } else if (diff > 0) {
      return { isStable: false, labelKey: 'unstable', desc: `β⁻ decay prone (Excess neutrons, N/Z=${(N / Z).toFixed(2)})` };
    } else {
      return { isStable: false, labelKey: 'unstable', desc: `β⁺/EC prone (Deficient neutrons, N/Z=${(N / Z).toFixed(2)})` };
    }
  }, [A, N, Z, optimalN]);

  // Element Metadata
  const elementMeta = ELEMENT_METAS[Z] || {
    symbol: `E${Z}`,
    nameAr: `عنصر ${Z}`,
    nameEn: `Element ${Z}`,
    nameKu: `توخمی ${Z}`,
    nameKmr: `Element ${Z}`,
    stableN: optimalN,
  };

  const elemName = {
    ar: elementMeta.nameAr,
    en: elementMeta.nameEn,
    ku: elementMeta.nameKu,
    kmr: elementMeta.nameKmr,
  }[lang];

  // Interleaved nucleons representation for 3D-feeling cluster
  const maxRenderNucleons = Math.min(A, 70); // Render up to 70 for performance and clarity
  const nucleonPositions = useMemo(() => {
    if (maxRenderNucleons === 0) return [];
    if (maxRenderNucleons === 1) return [{ x: 50, y: 50, isProton: protons > 0 }];

    const positions: Array<{ x: number; y: number; isProton: boolean; id: number }> = [];
    // Interleave protons and neutrons proportionally
    const pCount = Math.round((protons / A) * maxRenderNucleons);
    const nCount = maxRenderNucleons - pCount;
    const nucleonTypes: boolean[] = [];
    let pAdded = 0;
    let nAdded = 0;
    for (let i = 0; i < maxRenderNucleons; i++) {
      if ((pAdded / (pCount || 1)) <= (nAdded / (nCount || 1)) && pAdded < pCount) {
        nucleonTypes.push(true);
        pAdded++;
      } else if (nAdded < nCount) {
        nucleonTypes.push(false);
        nAdded++;
      } else {
        nucleonTypes.push(true);
      }
    }

    for (let i = 0; i < maxRenderNucleons; i++) {
      const angle = i * 2.399963; // Golden angle
      const maxR = maxRenderNucleons > 40 ? 38 : maxRenderNucleons > 16 ? 32 : 24;
      const r = Math.sqrt((i + 0.5) / maxRenderNucleons) * maxR;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      positions.push({ x, y, isProton: nucleonTypes[i], id: i });
    }
    return positions;
  }, [maxRenderNucleons, protons, A]);

  // Curve points for Aston / Weizsäcker Binding Energy Curve SVG
  const curvePoints = useMemo(() => {
    // Standard representative nuclides along the valley of stability
    const points: Array<{ a: number; beA: number; label?: string }> = [
      { a: 1, beA: 0.0, label: '¹H' },
      { a: 2, beA: 1.11, label: '²H' },
      { a: 3, beA: 2.83 },
      { a: 4, beA: 7.07, label: '⁴He' },
      { a: 6, beA: 5.33 },
      { a: 7, beA: 5.61 },
      { a: 9, beA: 6.46 },
      { a: 12, beA: 7.68, label: '¹²C' },
      { a: 14, beA: 7.48 },
      { a: 16, beA: 7.98, label: '¹⁶O' },
      { a: 20, beA: 8.03 },
      { a: 28, beA: 8.45 },
      { a: 40, beA: 8.55 },
      { a: 56, beA: 8.79, label: '⁵⁶Fe' },
      { a: 62, beA: 8.795, label: '⁶²Ni' },
      { a: 80, beA: 8.69 },
      { a: 108, beA: 8.55 },
      { a: 140, beA: 8.35 },
      { a: 170, beA: 8.12 },
      { a: 208, beA: 7.87, label: '²⁰⁸Pb' },
      { a: 238, beA: 7.57, label: '²³⁸U' },
    ];
    return points;
  }, []);

  // SVG coordinate mapper for BE/A curve (Width: 360, Height: 130)
  // X: A from 1 to 240
  // Y: BE/A from 0 to 9.5 MeV
  const svgWidth = 360;
  const svgHeight = 120;
  const paddingX = 28;
  const paddingY = 16;

  const mapX = (a: number) => paddingX + (Math.min(Math.max(a, 1), 240) / 240) * (svgWidth - paddingX - 10);
  const mapY = (be: number) => svgHeight - paddingY - (Math.min(Math.max(be, 0), 9.5) / 9.5) * (svgHeight - 2 * paddingY);

  const curveSvgPath = useMemo(() => {
    return curvePoints.reduce((acc, pt, idx) => {
      const x = mapX(pt.a);
      const y = mapY(pt.beA);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [curvePoints]);

  const currentMarkerX = mapX(A);
  const currentMarkerY = mapY(bePerNucleon);

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'build_nucleus',
        element: elementMeta.symbol,
        elementName: elemName,
        massNumber: A,
        protons: Z,
        neutrons: N,
        bindingEnergyMeV,
        bePerNucleon,
        massDefect_u,
        nuclearMass_u,
        nuclearRadiusFm,
        isStable: stabilityInfo.isStable,
        timestamp: new Date().toISOString()
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  const resetSimulation = () => {
    setProtons(6);
    setNeutrons(6);
  };

  const handleApplyPreset = (preset: NuclidePreset) => {
    setProtons(preset.z);
    setNeutrons(preset.n);
  };

  const handleAutoBalanceN = () => {
    setNeutrons(optimalN);
  };

  const handleSetEqualNZ = () => {
    setNeutrons(protons);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl" id="build-nucleus-container">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {tI18n('experiments.build_nucleus.title')}
            </h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 2</p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Balance N Button */}
          <button
            id="auto-balance-n-btn"
            type="button"
            onClick={handleAutoBalanceN}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              neutrons === optimalN
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 cursor-default'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-indigo-500/50'
            }`}
            title={tI18n('experiments.build_nucleus.optimalIsotope')}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tI18n('experiments.build_nucleus.optimalIsotope')}</span>
          </button>

          {/* Equal N=Z Button */}
          <button
            id="equal-nz-btn"
            type="button"
            onClick={handleSetEqualNZ}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              neutrons === protons
                ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/40 cursor-default'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-indigo-500/50'
            }`}
            title={tI18n('experiments.build_nucleus.equalNZ')}
          >
            <span className="font-mono font-bold text-indigo-400">N=Z</span>
            <span>{tI18n('experiments.build_nucleus.equalNZ')}</span>
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
            {logged ? <Check className="w-4 h-4" /> : <BookmarkCheck className="w-4 h-4" />}
            <span>{logged ? tI18n('experiments.build_nucleus.logged') : tI18n('experiments.build_nucleus.log')}</span>
          </button>

          {/* Reset Button */}
          <button 
            id="reset-nucleus-btn"
            type="button"
            onClick={resetSimulation}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            title={tI18n('experiments.build_nucleus.reset')}
            aria-label={tI18n('experiments.build_nucleus.reset')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tI18n('experiments.build_nucleus.reset')}</span>
          </button>
        </div>
      </div>

      {/* Preset Nuclides Selector Chips */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            {tI18n('experiments.build_nucleus.presets')}
          </span>
          <span className="text-[11px] text-purple-300 font-mono">
            {elemName} ({elementMeta.symbol}-{A})
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {FAMOUS_NUCLIDES.map((nuclide) => {
            const isCurrent = nuclide.z === protons && nuclide.n === neutrons;
            const desc = {
              ar: nuclide.descAr,
              en: nuclide.descEn,
              ku: nuclide.descKu,
              kmr: nuclide.descKmr,
            }[lang];

            return (
              <button
                key={nuclide.symbol}
                id={`preset-${nuclide.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                type="button"
                onClick={() => handleApplyPreset(nuclide)}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
                  isCurrent
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title={`${nuclide.name}: ${desc}`}
              >
                <span className="text-sm font-black text-amber-300">{nuclide.symbol}</span>
                <span className="text-[10px] text-slate-300 font-sans hidden sm:inline">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Graph & Interactive Nucleus */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-5">
          {/* Identity & Isotope Notation Header */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Standard Nuclear Notation: Left superscripts A and Z, then Symbol */}
              <div className="w-14 h-14 bg-purple-950/80 border border-purple-500/50 rounded-xl flex items-center justify-center shadow-md px-1.5 gap-1">
                <div className="flex flex-col text-right font-mono font-bold leading-none text-slate-400 text-[11px]">
                  <span className="text-amber-400" title={`Mass Number A = ${A}`}>{A}</span>
                  <span className="text-red-400" title={`Atomic Number Z = ${Z}`}>{Z}</span>
                </div>
                <span className="text-2xl font-black text-purple-300 leading-none">{elementMeta.symbol}</span>
              </div>
              <div>
                <span className="text-base font-bold text-white block">
                  {elemName}-{A}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Z={Z} (protons) • N={N} (neutrons) • R≈{nuclearRadiusFm.toFixed(2)} fm
                </span>
              </div>
            </div>

            {/* Stability State Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  stabilityInfo.isStable
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse'
                }`}
              >
                {stabilityInfo.isStable ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{tI18n('experiments.build_nucleus.stable')}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{tI18n('experiments.build_nucleus.unstable')}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Interactive Binding Energy Curve (B/A vs A) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                {tI18n('experiments.build_nucleus.curveTitle') || 'Binding Energy Curve (B/A vs A)'}
              </span>
              <span className="font-mono text-amber-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {bePerNucleon.toFixed(2)} MeV / nucleon
              </span>
            </div>

            {/* SVG Chart */}
            <div className="w-full overflow-hidden bg-slate-950/90 rounded-lg border border-slate-800 p-2 relative">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-28 select-none">
                {/* Horizontal Gridlines */}
                {[0, 2, 4, 6, 8].map((val) => {
                  const y = mapY(val);
                  return (
                    <g key={`grid-${val}`}>
                      <line x1={paddingX} y1={y} x2={svgWidth - 10} y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                      <text x={paddingX - 4} y={y + 3} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis ticks (A = 50, 100, 150, 200) */}
                {[56, 100, 150, 200].map((a) => {
                  const x = mapX(a);
                  return (
                    <g key={`tick-${a}`}>
                      <line x1={x} y1={mapY(0)} x2={x} y2={mapY(0) + 4} stroke="#475569" strokeWidth="1" />
                      <text x={x} y={svgHeight - 4} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
                        {a}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Regions: Fusion (A < 56) & Fission (A > 56) */}
                <rect
                  x={paddingX}
                  y={mapY(9.2)}
                  width={mapX(56) - paddingX}
                  height={mapY(0) - mapY(9.2)}
                  fill="#6366f1"
                  fillOpacity="0.08"
                />
                <rect
                  x={mapX(56)}
                  y={mapY(9.2)}
                  width={svgWidth - 10 - mapX(56)}
                  height={mapY(0) - mapY(9.2)}
                  fill="#a855f7"
                  fillOpacity="0.06"
                />

                {/* The Theoretical Binding Energy Curve Line */}
                <path d={curveSvgPath} fill="none" stroke="url(#curveGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="25%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="70%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>

                {/* Peak Stability Marker (Fe-56 / Ni-62) */}
                <circle cx={mapX(56)} cy={mapY(8.79)} r="3" fill="#f59e0b" />
                <text x={mapX(56)} y={mapY(8.79) - 6} textAnchor="middle" fill="#fcd34d" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  ⁵⁶Fe (8.79)
                </text>

                {/* Current Active Nucleus Position Pulsing Marker */}
                <circle cx={currentMarkerX} cy={currentMarkerY} r="7" fill="#ec4899" fillOpacity="0.3" className="animate-ping" />
                <circle cx={currentMarkerX} cy={currentMarkerY} r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              </svg>

              {/* Curve Bottom Region Labels */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-mono px-1">
                <span className="flex items-center gap-1 text-indigo-300">
                  <Flame className="w-3 h-3 text-sky-400" />
                  {tI18n('experiments.build_nucleus.fusionZone')}
                </span>
                <span className="text-amber-300 font-bold">
                  {tI18n('experiments.build_nucleus.peakZone')}
                </span>
                <span className="flex items-center gap-1 text-purple-300">
                  <Split className="w-3 h-3 text-rose-400" />
                  {tI18n('experiments.build_nucleus.fissionZone')}
                </span>
              </div>
            </div>
          </div>

          {/* 3D-feeling Nucleus Ball Graphic */}
          <div className="relative h-48 sm:h-52 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-center overflow-hidden p-2 select-none">
            {/* Background Halo Glow */}
            <div
              className={`absolute rounded-full blur-2xl pointer-events-none transition-all duration-300 ${
                stabilityInfo.isStable ? 'bg-purple-600/20' : 'bg-rose-600/30 animate-pulse'
              }`}
              style={{
                width: `${Math.min(220, 90 + Math.sqrt(A) * 10)}px`,
                height: `${Math.min(220, 90 + Math.sqrt(A) * 10)}px`,
              }}
            />

            {/* Nucleus Spherical Container */}
            <div
              className={`relative rounded-full bg-slate-950/80 border flex items-center justify-center p-2 shadow-2xl transition-all duration-300 ${
                stabilityInfo.isStable
                  ? 'border-purple-500/40 shadow-purple-950/40'
                  : 'border-rose-500/60 shadow-rose-950/60 animate-pulse'
              }`}
              style={{
                width: `${Math.max(88, Math.min(170, 75 + Math.sqrt(maxRenderNucleons) * 11))}px`,
                height: `${Math.max(88, Math.min(170, 75 + Math.sqrt(maxRenderNucleons) * 11))}px`,
              }}
              title={`Nucleus: ${protons} Protons (+), ${neutrons} Neutrons (0)`}
            >
              {nucleonPositions.map((pos) => (
                <div
                  key={`nuc-${pos.id}`}
                  style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md text-[9px] font-black flex items-center justify-center transition-all select-none ${
                    pos.isProton
                      ? 'w-4 h-4 bg-gradient-to-br from-red-500 to-rose-600 text-white ring-1 ring-red-300/40'
                      : 'w-4 h-4 bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 ring-1 ring-slate-100/40'
                  }`}
                  title={pos.isProton ? 'Proton (+)' : 'Neutron (0)'}
                >
                  {pos.isProton ? '+' : '0'}
                </div>
              ))}
            </div>

            {/* Overflow indicator if A > 70 */}
            {A > 70 && (
              <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded-md font-mono">
                +{A - maxRenderNucleons} nucleons inside
              </div>
            )}
          </div>

          {/* Mass & Mass Defect Breakdown Card */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between items-center">
              <span>{tI18n('experiments.build_nucleus.constituentMass')}:</span>
              <span className="font-mono text-slate-200 font-semibold">{totalConstituentMass.toFixed(5)} u</span>
            </div>
            <div className="flex justify-between items-center text-amber-400 font-semibold">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-400" />
                {tI18n('experiments.build_nucleus.massDefect')} (Δm):
              </span>
              <span className="font-mono">
                {massDefect_u.toFixed(5)} u ({(massDefect_u * 1000).toFixed(2)} × 10⁻³ u)
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
              <span>{tI18n('experiments.build_nucleus.nuclearMass')}:</span>
              <span className="font-mono">{nuclearMass_u.toFixed(5)} u</span>
            </div>
          </div>
        </div>

        {/* Right Column: Controls, Steppers & Einstein Energy Card */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
            {/* Protons Control (Z) with Stepper Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-red-400 flex items-center gap-1.5 text-sm">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span>
                  {tI18n('experiments.build_nucleus.protons')} (Z)
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
                  title={`${tI18n('experiments.build_nucleus.removeParticle')} (Z)`}
                  aria-label="Remove Proton"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="proton-range-slider"
                  type="range"
                  min="1"
                  max="92"
                  value={protons}
                  onChange={(e) => setProtons(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <button
                  id="proton-increment-btn"
                  type="button"
                  onClick={() => setProtons((prev) => Math.min(92, prev + 1))}
                  disabled={protons >= 92}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title={`${tI18n('experiments.build_nucleus.addParticle')} (Z)`}
                  aria-label="Add Proton"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Neutrons Control (N) with Stepper Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5 text-sm">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-full shadow-sm"></span>
                  {tI18n('experiments.build_nucleus.neutrons')} (N)
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
                  title={`${tI18n('experiments.build_nucleus.removeParticle')} (N)`}
                  aria-label="Remove Neutron"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="neutron-range-slider"
                  type="range"
                  min="0"
                  max="150"
                  value={neutrons}
                  onChange={(e) => setNeutrons(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                />
                <button
                  id="neutron-increment-btn"
                  type="button"
                  onClick={() => setNeutrons((prev) => Math.min(150, prev + 1))}
                  disabled={neutrons >= 150}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title={`${tI18n('experiments.build_nucleus.addParticle')} (N)`}
                  aria-label="Add Neutron"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-mono">Mass Number (A)</span>
                <span className="text-base font-black text-amber-400 font-mono">{A}</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-mono">N/Z Ratio</span>
                <span className="text-base font-black text-purple-300 font-mono">
                  {(neutrons / Math.max(protons, 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Einstein's Binding Energy Calculation Display Card */}
          <div className="p-5 bg-gradient-to-br from-purple-950/50 to-indigo-950/40 border border-purple-500/40 rounded-2xl space-y-3 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-xs text-purple-300 font-bold uppercase tracking-wider block">
                {tI18n('experiments.build_nucleus.bindingEnergy')} (E_b)
              </span>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-900/60 border border-purple-700/50 px-2 py-0.5 rounded-full">
                Δm · 931.5 MeV
              </span>
            </div>
            
            <div className="text-3xl sm:text-4xl font-black text-purple-300 font-mono tracking-tight">
              {bindingEnergyMeV >= 1000 ? (bindingEnergyMeV).toFixed(1) : bindingEnergyMeV.toFixed(2)}{' '}
              <span className="text-base font-normal text-purple-400">MeV</span>
            </div>

            {/* Binding Energy per Nucleon */}
            <div className="p-3 bg-purple-900/30 border border-purple-700/40 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-purple-200">E_b / A:</span>
              <span className="text-amber-300 font-bold text-sm">
                {bePerNucleon.toFixed(3)} MeV / nucleon
              </span>
            </div>

            {/* Physics Equation Formula */}
            <p className="text-[11px] text-purple-200/90 leading-relaxed font-mono bg-purple-950/60 p-2.5 rounded-lg border border-purple-900/60">
              E = Δm · c² = (Z·m_p + N·m_n - M_nuc) · 931.494 MeV
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
