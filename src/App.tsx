/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import {
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Award,
  Calculator,
  Activity,
  Layers,
  Compass,
  Zap,
  Eye,
  Waves,
  ArrowDownToDot,
  Binary,
  Flame,
  Scale,
  CircleDot,
  RotateCw,
  Target,
  Magnet,
  Volume2,
  Droplets,
  Search,
  Atom,
  Shield,
  Sun,
  Battery,
  Orbit,
  Glasses,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Info,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Home,
  X,
  Filter,
  Radio,
  Radiation
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { Language, ExperimentType, MeasurementRecord } from './types';
import { LANGUAGES } from './config/languages';
import { experimentsList as experimentsMeta, ExperimentMeta } from './experimentsData';

// 36 Classic Simulations (Lazy Loaded)
const PendulumSim = React.lazy(() => import('./components/PendulumSim'));
const ProjectileSim = React.lazy(() => import('./components/ProjectileSim'));
const CircuitSim = React.lazy(() => import('./components/CircuitSim'));
const OpticsSim = React.lazy(() => import('./components/OpticsSim'));
const FreeFallSim = React.lazy(() => import('./components/FreeFallSim'));
const WavesSim = React.lazy(() => import('./components/WavesSim'));
const SpringSim = React.lazy(() => import('./components/SpringSim'));
const BuoyancySim = React.lazy(() => import('./components/BuoyancySim'));
const CollisionSim = React.lazy(() => import('./components/CollisionSim'));
const ThermodynamicsSim = React.lazy(() => import('./components/ThermodynamicsSim'));
const ArcLengthSim = React.lazy(() => import('./components/ArcLengthSim'));
const RotationalDynamicsSim = React.lazy(() => import('./components/RotationalDynamicsSim'));
const CenterOfMassSim = React.lazy(() => import('./components/CenterOfMassSim'));
const PendulumEnergySim = React.lazy(() => import('./components/PendulumEnergySim'));
const AcousticResonanceSim = React.lazy(() => import('./components/AcousticResonanceSim'));
const SoundSpeedSim = React.lazy(() => import('./components/SoundSpeedSim'));
const MagneticFieldSim = React.lazy(() => import('./components/MagneticFieldSim'));
const AtomicSpectraSim = React.lazy(() => import('./components/AtomicSpectraSim'));
const MetricPrefixesSim = React.lazy(() => import('./components/MetricPrefixesSim'));
const StressStrainSim = React.lazy(() => import('./components/StressStrainSim'));
const BernoulliSim = React.lazy(() => import('./components/BernoulliSim'));
const AngledMirrorsSim = React.lazy(() => import('./components/AngledMirrorsSim'));
const CurvedMirrorsSim = React.lazy(() => import('./components/CurvedMirrorsSim'));
const ThinLensesSim = React.lazy(() => import('./components/ThinLensesSim'));
const PolarizationSim = React.lazy(() => import('./components/PolarizationSim'));
const LightScatteringSim = React.lazy(() => import('./components/LightScatteringSim'));
const WorkHeatSim = React.lazy(() => import('./components/WorkHeatSim'));
const PrescriptionGlassesSim = React.lazy(() => import('./components/PrescriptionGlassesSim'));
const PeriscopeSim = React.lazy(() => import('./components/PeriscopeSim'));
const StaticBalloonsSim = React.lazy(() => import('./components/StaticBalloonsSim'));
const SledFrictionSim = React.lazy(() => import('./components/SledFrictionSim'));
const HeatConductionSim = React.lazy(() => import('./components/HeatConductionSim'));
const SeesawTorqueSim = React.lazy(() => import('./components/SeesawTorqueSim'));
const ElectromagneticInductionSim = React.lazy(() => import('./components/ElectromagneticInductionSim'));
const ViscosityStokesSim = React.lazy(() => import('./components/ViscosityStokesSim'));
const RampMachineSim = React.lazy(() => import('./components/RampMachineSim'));

// Extended & Newly Added Specialized Simulations (53-65) (Lazy Loaded)
const BuildAtomSim = React.lazy(() => import('./components/BuildAtomSim').then(m => ({ default: m.BuildAtomSim })));
const BuildNucleusSim = React.lazy(() => import('./components/BuildNucleusSim').then(m => ({ default: m.BuildNucleusSim })));
const RutherfordScatteringSim = React.lazy(() => import('./components/RutherfordScatteringSim').then(m => ({ default: m.RutherfordScatteringSim })));
const BlackbodySim = React.lazy(() => import('./components/BlackbodySim').then(m => ({ default: m.BlackbodySim })));
const MoleculesLightSim = React.lazy(() => import('./components/MoleculesLightSim').then(m => ({ default: m.MoleculesLightSim })));
const ColorVisionSim = React.lazy(() => import('./components/ColorVisionSim').then(m => ({ default: m.ColorVisionSim })));
const CapacitorSim = React.lazy(() => import('./components/CapacitorSim').then(m => ({ default: m.CapacitorSim })));
const ChargesFieldsSim = React.lazy(() => import('./components/ChargesFieldsSim').then(m => ({ default: m.ChargesFieldsSim })));
const WireResistanceSim = React.lazy(() => import('./components/WireResistanceSim').then(m => ({ default: m.WireResistanceSim })));
const GravityOrbitsSim = React.lazy(() => import('./components/GravityOrbitsSim').then(m => ({ default: m.GravityOrbitsSim })));
const KeplerLawsSim = React.lazy(() => import('./components/KeplerLawsSim').then(m => ({ default: m.KeplerLawsSim })));
const EnergySkateParkSim = React.lazy(() => import('./components/EnergySkateParkSim').then(m => ({ default: m.EnergySkateParkSim })));
const FourierWavesSim = React.lazy(() => import('./components/FourierWavesSim').then(m => ({ default: m.FourierWavesSim })));
const WaveOnStringSim = React.lazy(() => import('./components/WaveOnStringSim').then(m => ({ default: m.WaveOnStringSim })));
const StatesOfMatterSim = React.lazy(() => import('./components/StatesOfMatterSim').then(m => ({ default: m.StatesOfMatterSim })));
const DiffusionSim = React.lazy(() => import('./components/DiffusionSim').then(m => ({ default: m.DiffusionSim })));
const ElectromagnetSim = React.lazy(() => import('./components/ElectromagnetSim'));
const GravityForceSim = React.lazy(() => import('./components/GravityForceSim'));
const ForcesMotionSim = React.lazy(() => import('./components/ForcesMotionSim'));
const NormalModesSim = React.lazy(() => import('./components/NormalModesSim'));

// 5 New Physics Experiments (IDs 66 to 70) (Lazy Loaded)
const DopplerEffectSim = React.lazy(() => import('./components/DopplerEffectSim'));
const ElectricalTransformerSim = React.lazy(() => import('./components/ElectricalTransformerSim'));
const PhotoelectricEffectSim = React.lazy(() => import('./components/PhotoelectricEffectSim'));
const RadioactiveDecaySim = React.lazy(() => import('./components/RadioactiveDecaySim'));
const CalorimetrySim = React.lazy(() => import('./components/CalorimetrySim'));

// Additional UI Tabs & Tools
import ErrorBoundary from './components/ErrorBoundary';
import LabNotebook from './components/LabNotebook';
import FormulaSheet from './components/FormulaSheet';
import { PhysicsEquationKeyboard } from './components/PhysicsEquationKeyboard';
import LabQuiz from './components/LabQuiz';
import LabToolsModal from './components/LabToolsModal';
import LanguageSelector from './components/LanguageSelector';
import KurdishSun21 from './components/KurdishSun21';
import { safeGetItem, safeSetItem } from './utils/storage';

export type CategoryFilter = 
  | 'all'
  | 'mechanics'
  | 'waves_sound'
  | 'em_atomic'
  | 'fluids_thermo_optics'
  | 'gravity_astrophysics';

export interface ExperimentItem extends ExperimentMeta {
  icon: React.ReactNode;
}

const experimentIconMap: Record<number, React.ReactNode> = {
  1: <Flame className="w-4 h-4 text-orange-400" />,
  2: <Glasses className="w-4 h-4 text-sky-400" />,
  3: <Eye className="w-4 h-4 text-cyan-400" />,
  4: <Zap className="w-4 h-4 text-yellow-400" />,
  5: <Activity className="w-4 h-4 text-amber-400" />,
  6: <Flame className="w-4 h-4 text-rose-400" />,
  7: <Scale className="w-4 h-4 text-emerald-400" />,
  8: <Magnet className="w-4 h-4 text-purple-400" />,
  9: <Droplets className="w-4 h-4 text-teal-400" />,
  10: <Activity className="w-4 h-4 text-indigo-400" />,
  11: <Binary className="w-4 h-4 text-sky-400" />,
  12: <Activity className="w-4 h-4 text-red-400" />,
  13: <Droplets className="w-4 h-4 text-cyan-400" />,
  14: <Eye className="w-4 h-4 text-pink-400" />,
  15: <Eye className="w-4 h-4 text-purple-400" />,
  16: <Eye className="w-4 h-4 text-emerald-400" />,
  17: <Sun className="w-4 h-4 text-yellow-400" />,
  18: <Sun className="w-4 h-4 text-amber-400" />,
  19: <CircleDot className="w-4 h-4 text-teal-400" />,
  20: <RotateCw className="w-4 h-4 text-indigo-400" />,
  21: <Target className="w-4 h-4 text-rose-400" />,
  22: <Activity className="w-4 h-4 text-sky-400" />,
  23: <Activity className="w-4 h-4 text-emerald-400" />,
  24: <Compass className="w-4 h-4 text-amber-400" />,
  25: <Activity className="w-4 h-4 text-violet-400" />,
  26: <Scale className="w-4 h-4 text-orange-400" />,
  27: <ArrowDownToDot className="w-4 h-4 text-rose-400" />,
  28: <Volume2 className="w-4 h-4 text-cyan-400" />,
  29: <Volume2 className="w-4 h-4 text-sky-400" />,
  30: <Waves className="w-4 h-4 text-blue-400" />,
  31: <Magnet className="w-4 h-4 text-purple-400" />,
  32: <Atom className="w-4 h-4 text-indigo-400" />,
  33: <Zap className="w-4 h-4 text-yellow-400" />,
  34: <Droplets className="w-4 h-4 text-teal-400" />,
  35: <Flame className="w-4 h-4 text-orange-400" />,
  36: <Eye className="w-4 h-4 text-emerald-400" />,
  37: <Atom className="w-4 h-4 text-red-400" />,
  38: <Shield className="w-4 h-4 text-purple-400" />,
  39: <Target className="w-4 h-4 text-amber-400" />,
  40: <Waves className="w-4 h-4 text-sky-400" />,
  41: <Eye className="w-4 h-4 text-pink-400" />,
  42: <Battery className="w-4 h-4 text-blue-400" />,
  43: <Zap className="w-4 h-4 text-yellow-400" />,
  44: <Zap className="w-4 h-4 text-amber-400" />,
  45: <Orbit className="w-4 h-4 text-emerald-400" />,
  46: <Compass className="w-4 h-4 text-sky-400" />,
  47: <Activity className="w-4 h-4 text-amber-400" />,
  48: <Waves className="w-4 h-4 text-indigo-400" />,
  49: <Waves className="w-4 h-4 text-sky-400" />,
  50: <Flame className="w-4 h-4 text-rose-400" />,
  51: <Sparkles className="w-4 h-4 text-purple-400" />,
  52: <RotateCw className="w-4 h-4 text-emerald-400" />,
  53: <Atom className="w-4 h-4 text-indigo-400" />,
  54: <Cpu className="w-4 h-4 text-yellow-400" />,
  55: <Zap className="w-4 h-4 text-amber-400" />,
  56: <Compass className="w-4 h-4 text-cyan-400" />,
  57: <Magnet className="w-4 h-4 text-purple-400" />,
  58: <Orbit className="w-4 h-4 text-emerald-400" />,
  59: <Sun className="w-4 h-4 text-amber-400" />,
  60: <Flame className="w-4 h-4 text-orange-400" />,
  61: <Waves className="w-4 h-4 text-indigo-400" />,
  62: <Activity className="w-4 h-4 text-rose-400" />,
  63: <Droplets className="w-4 h-4 text-cyan-400" />,
  64: <Sparkles className="w-4 h-4 text-purple-400" />,
  65: <Sun className="w-4 h-4 text-amber-400" />,
  66: <Radio className="w-4 h-4 text-sky-400" />,
  67: <Zap className="w-4 h-4 text-amber-400" />,
  68: <Sparkles className="w-4 h-4 text-purple-400" />,
  69: <Radiation className="w-4 h-4 text-emerald-400" />,
  70: <Flame className="w-4 h-4 text-amber-400" />
};

export const experimentsList: ExperimentItem[] = experimentsMeta.map((exp) => ({
  ...exp,
  icon: experimentIconMap[exp.id] || <Activity className="w-4 h-4 text-sky-400" />
}));

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('taq_app_language');
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        return saved as Language;
      }
    } catch (e) {
      console.warn('Failed to read language preference:', e);
    }
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem('taq_app_language', lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
    i18n.changeLanguage(lang);
  }, [lang]);
  const [activeMainTab, setActiveMainTab] = useState<'experiments' | 'notebook' | 'formulas' | 'challenges'>('experiments');
  const [activeExperimentKey, setActiveExperimentKey] = useState<ExperimentType>('models_h_atom');
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [experimentSearch, setExperimentSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isEquationKeyboardOpen, setIsEquationKeyboardOpen] = useState(false);
  const [isBrowsingCatalog, setIsBrowsingCatalog] = useState(true);
  const [isTheoryExpanded, setIsTheoryExpanded] = useState(true);

  // Stored measurements
  const [records, setRecords] = useState<MeasurementRecord[]>(() => {
    const saved = safeGetItem('physics_lab_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    safeSetItem('physics_lab_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    // Direction handling for RTL languages (Arabic and Sorani Kurdish)
    document.documentElement.dir = lang === 'ku' || lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Add new measurement record
  const handleLogMeasurement = (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => {
    const theoretical = data.theoreticalValue === 0 ? 0.0001 : data.theoreticalValue;
    const percentError = Math.abs((data.measuredValue - data.theoreticalValue) / theoretical) * 100;

    const newRecord: MeasurementRecord = {
      ...data,
      id: `meas_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      percentError,
    };

    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAllRecords = () => {
    setRecords([]);
    setShowClearConfirm(false);
  };

  const handleUpdateNote = (id: string, note: string) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, notes: note } : r)));
  };

  const handleSelectExperiment = (key: ExperimentType) => {
    setActiveExperimentKey(key);
    setActiveMainTab('experiments');
    setIsBrowsingCatalog(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { t } = useTranslation();

  const currentExpIndex = experimentsList.findIndex((e) => e.expKey === activeExperimentKey);
  const currentExp = (currentExpIndex !== -1 ? experimentsList[currentExpIndex] : experimentsList[0]) || experimentsList[0];
  const prevExp = currentExpIndex > 0 ? experimentsList[currentExpIndex - 1] : null;
  const nextExp = currentExpIndex < experimentsList.length - 1 ? experimentsList[currentExpIndex + 1] : null;

  const getExpTitle = (exp: ExperimentItem, language?: Language) => {
    if (language) {
      return t(`catalog.${exp.expKey}.title`, { lng: language, defaultValue: (exp as any).title || exp.expKey });
    }
    return t(`catalog.${exp.expKey}.title`, { defaultValue: (exp as any).title || exp.expKey });
  };

  // Cross-language subtitle fallback logic
  const getSubTitle = (exp: ExperimentItem, language: Language) => {
    if (language === 'ku' || language === 'ar') {
      return t(`catalog.${exp.expKey}.title`, { lng: 'en' });
    }
    return t(`catalog.${exp.expKey}.title`, { lng: 'ku' });
  };

  const filteredExperiments = experimentsList.filter((exp) => {
    const matchesCategory =
      categoryFilter === 'all' || exp.category === categoryFilter;

    const query = experimentSearch.toLowerCase().trim();
    if (!query) return matchesCategory;

    const inputs = (t(`catalog.${exp.expKey}.inputs`, { returnObjects: true }) as string[]) || [];
    const outputs = (t(`catalog.${exp.expKey}.outputs`, { returnObjects: true }) as string[]) || [];

    const matchesSearch =
      ['ar', 'en', 'ku', 'kmr'].some((l) =>
        i18n.getFixedT(l)(`catalog.${exp.expKey}.title`).toLowerCase().includes(query)
      ) ||
      exp.physical_law.toLowerCase().includes(query) ||
      exp.expKey.toLowerCase().includes(query) ||
      exp.id.toString().includes(query) ||
      (Array.isArray(inputs) && inputs.some((inp) => typeof inp === 'string' && inp.toLowerCase().includes(query))) ||
      (Array.isArray(outputs) && outputs.some((out) => typeof out === 'string' && out.toLowerCase().includes(query)));

    return matchesCategory && matchesSearch;
  });

  // Category options list
  const categoryOptions = [
    { id: 'all' as const },
    { id: 'mechanics' as const },
    { id: 'waves_sound' as const },
    { id: 'em_atomic' as const },
    { id: 'fluids_thermo_optics' as const },
    { id: 'gravity_astrophysics' as const },
  ];

  const getCategoryLabel = (cat: typeof categoryOptions[0]) => {
    if (cat.id === 'all') {
      return `${t('categories.all')} (${experimentsList.length})`;
    }
    return t(`categories.${cat.id}`);
  };

  return (
    <div
      id="app-container"
      /* Direction attribute for RTL languages */
      dir={lang === 'ar' || lang === 'ku' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200"
    >
      {/* Top Main Navigation Header */}
      <header id="main-header" className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-16 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Title with 21-ray Kurdish Sun */}
          <div
            onClick={() => {
              setActiveMainTab('experiments');
              setIsBrowsingCatalog(true);
            }}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-slate-200 shadow-md shadow-amber-500/10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
              <KurdishSun21 className="w-full h-full" withBg={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  taq lab
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t('headerSubtitle')}
              </p>
            </div>
          </div>

          {/* Quick Actions & Language Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSelector currentLang={lang} onSelectLang={setLang} />
          </div>
        </div>
      </header>

      {/* Main Workspace Body with safe bottom padding for fixed bottom bar */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-32 space-y-6">
        {activeMainTab === 'experiments' && (
          <div className="space-y-6">
            {/* VIEW A: CATALOG VIEW (Search, Dropdown Category Filter & Responsive Cards Grid) */}
            {isBrowsingCatalog ? (
              <div className="space-y-6 animate-fade-in">
                {/* Modern Dropdown Filter & Search Bar */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3.5 shadow-xl">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Dropdown Filter Toggle Button & Count Badge */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        id="category-dropdown-toggle-btn"
                        type="button"
                        onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 text-slate-100 text-xs font-semibold flex items-center gap-2 shadow-md transition-all group"
                      >
                        <Filter className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-slate-400">
                          {t('catalogUI.category')}
                        </span>
                        <span className="text-white font-bold max-w-[180px] sm:max-w-[240px] truncate">
                          {getCategoryLabel(
                            categoryOptions.find((c) => c.id === categoryFilter) || categoryOptions[0]
                          )}
                        </span>
                        {isCategoryDropdownOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 transition-transform" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform" />
                        )}
                      </button>

                      <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-indigo-300 font-semibold shrink-0">
                        {filteredExperiments.length} / {experimentsList.length} Labs
                      </span>
                    </div>

                    {/* Quick Search */}
                    <div className="relative min-w-[240px] flex-1 md:max-w-xs">
                      <Search className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={experimentSearch}
                        onChange={(e) => setExperimentSearch(e.target.value)}
                        placeholder={t('catalogUI.searchPlaceholder')}
                        className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                      />
                      {experimentSearch && (
                        <button
                          onClick={() => setExperimentSearch('')}
                          className="absolute ltr:right-2.5 rtl:left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* In-flow Dropdown Options Grid (naturally pushes cards below without any clipping or overlap) */}
                  {isCategoryDropdownOpen && (
                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 animate-fade-in">
                      {categoryOptions.map((cat) => {
                        const isSelected = categoryFilter === cat.id;
                        const countForCat =
                          cat.id === 'all'
                            ? experimentsList.length
                            : experimentsList.filter((e) => e.category === cat.id).length;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setCategoryFilter(cat.id as any);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl text-xs text-start flex items-center justify-between gap-2 border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-indigo-600/30 to-teal-600/30 border-indigo-500 text-white font-bold shadow-md shadow-indigo-950/50'
                                : 'bg-slate-950/70 hover:bg-slate-800/90 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isSelected ? 'bg-indigo-400 shadow-sm shadow-indigo-400' : 'bg-slate-600'
                                }`}
                              />
                              <span className="truncate">{getCategoryLabel(cat)}</span>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {countForCat}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Experiment Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredExperiments.map((exp) => {
                    const isNew13 = exp.id >= 53 && exp.id <= 65;
                    return (
                      <div
                        key={exp.id}
                        id={`catalog-card-${exp.id}`}
                        onClick={() => handleSelectExperiment(exp.expKey)}
                        className={`group bg-slate-900/90 hover:bg-slate-850 border rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 ${
                          isNew13
                            ? 'border-amber-500/30 hover:border-amber-500/60'
                            : 'border-slate-800/80 hover:border-indigo-500/50'
                        }`}
                      >
                        {/* Top ID & Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-indigo-300 flex items-center justify-center font-mono font-bold text-xs">
                              #{exp.id}
                            </span>
                            <div className="p-1 rounded-md bg-slate-800/60">
                              {exp.icon}
                            </div>
                          </div>
                          {isNew13 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              {t('catalogUI.newBadge')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Lab #{exp.id}
                            </span>
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                            {getExpTitle(exp, lang)}
                          </h3>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {getSubTitle(exp, lang)}
                          </p>
                        </div>

                        {/* Physical Law */}
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-amber-300 font-medium truncate">
                          {exp.physical_law}
                        </div>

                        {/* Action Launch Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectExperiment(exp.expKey);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition-all group-hover:bg-indigo-600 group-hover:text-white shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {t('catalogUI.launchLab')}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {filteredExperiments.length === 0 && (
                  <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                    <p className="text-slate-400 text-sm">
                      {t('catalogUI.noResults')}
                    </p>
                    <button
                      onClick={() => {
                        setCategoryFilter('all');
                        setExperimentSearch('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                    >
                      {t('catalogUI.resetFilters')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* VIEW B: SINGLE SIMULATION VIEW (Navigation Bar, Canvas, Collapsible Theory Accordion) */
              <div className="space-y-6 animate-fade-in">
                {/* Simulation Top Bar & Quick Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md">
                  {/* Back to Catalog Button */}
                  <button
                    id="back-to-catalog-btn"
                    onClick={() => setIsBrowsingCatalog(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 text-indigo-400" />
                    <span>
                      {t('catalogUI.backToCatalog')}
                    </span>
                  </button>

                  {/* Active Experiment Title */}
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-mono font-bold text-xs border border-indigo-500/40">
                      #{currentExp.id}
                    </span>
                    <h2 className="font-bold text-sm sm:text-base text-white">
                      {getExpTitle(currentExp, lang)}
                    </h2>
                  </div>

                  {/* Next / Previous Navigator */}
                  <div className="flex items-center gap-1">
                    {prevExp && (
                      <button
                        onClick={() => handleSelectExperiment(prevExp.expKey)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                        title={getExpTitle(prevExp, lang)}
                      >
                        <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                        <span className="hidden sm:inline">#{prevExp.id}</span>
                      </button>
                    )}
                    {nextExp && (
                      <button
                        onClick={() => handleSelectExperiment(nextExp.expKey)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                        title={getExpTitle(nextExp, lang)}
                      >
                        <span className="hidden sm:inline">#{nextExp.id}</span>
                        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. Active Experiment Render - Simulation Canvas Area */}
                <div className="transition-all duration-200">
                  <ErrorBoundary>
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-[400px] text-gray-400">
                        {t('loading')}
                      </div>
                    }>
                      {/* 36 Classic Experiments */}
                      {activeExperimentKey === 'work_heat' && <WorkHeatSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'prescription_glasses' && <PrescriptionGlassesSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'periscope' && <PeriscopeSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'static_balloons' && <StaticBalloonsSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'sled_friction' && <SledFrictionSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'heat_conduction' && <HeatConductionSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'seesaw_torque' && <SeesawTorqueSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'electromagnetic_induction' && <ElectromagneticInductionSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'viscosity_stokes' && <ViscosityStokesSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'ramp_machine' && <RampMachineSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'metric_prefixes' && <MetricPrefixesSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'stress_strain' && <StressStrainSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'bernoulli' && <BernoulliSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'angled_mirrors' && <AngledMirrorsSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'curved_mirrors' && <CurvedMirrorsSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'thin_lenses' && <ThinLensesSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'polarization' && <PolarizationSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'light_scattering' && <LightScatteringSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'arc_length' && <ArcLengthSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'rotational_dynamics' && <RotationalDynamicsSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'center_of_mass' && <CenterOfMassSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'pendulum_energy' && <PendulumEnergySim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'pendulum' && <PendulumSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'projectile' && <ProjectileSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'spring' && <SpringSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'collision' && <CollisionSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'freefall' && <FreeFallSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'acoustic_resonance' && <AcousticResonanceSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'sound_speed' && <SoundSpeedSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'waves' && <WavesSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'magnetic_field' && <MagneticFieldSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'atomic_spectra' && <AtomicSpectraSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'circuits' && <CircuitSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'buoyancy' && <BuoyancySim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'thermodynamics' && <ThermodynamicsSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {activeExperimentKey === 'optics' && <OpticsSim lang={lang} onLogMeasurement={handleLogMeasurement} />}

                      {/* Extended & The 13 New Simulation Labs (53-65) */}
                      {activeExperimentKey === 'build_atom' && <BuildAtomSim lang={lang} />}
                      {activeExperimentKey === 'build_nucleus' && <BuildNucleusSim lang={lang} />}
                      {activeExperimentKey === 'rutherford_scattering' && <RutherfordScatteringSim lang={lang} />}
                      {activeExperimentKey === 'molecules_and_light' && <MoleculesLightSim lang={lang} />}
                      {activeExperimentKey === 'color_vision' && <ColorVisionSim lang={lang} />}
                      {activeExperimentKey === 'capacitor_lab' && <CapacitorSim lang={lang} />}
                      {activeExperimentKey === 'charges_and_fields' && <ChargesFieldsSim lang={lang} />}
                      {activeExperimentKey === 'resistance_in_wire' && <WireResistanceSim lang={lang} />}
                      {activeExperimentKey === 'gravity_and_orbits' && <GravityOrbitsSim lang={lang} />}
                      {activeExperimentKey === 'keplers_laws' && <KeplerLawsSim lang={lang} />}
                      {activeExperimentKey === 'energy_skate_park' && <EnergySkateParkSim lang={lang} />}
                      {activeExperimentKey === 'fourier_making_waves' && <FourierWavesSim lang={lang} />}
                      {activeExperimentKey === 'wave_on_a_string' && <WaveOnStringSim lang={lang} />}
                      {activeExperimentKey === 'states_of_matter' && <StatesOfMatterSim lang={lang} />}
                      {activeExperimentKey === 'gas_diffusion' && <DiffusionSim lang={lang} />}

                      {/* ID 53: Models of Hydrogen Atom */}
                      {activeExperimentKey === 'models_h_atom' && <AtomicSpectraSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 54: Circuit Construction Kit (Advanced Kirchhoff) */}
                      {activeExperimentKey === 'circuit_construction_kit' && <CircuitSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 55: Generator */}
                      {activeExperimentKey === 'generator' && <ElectromagneticInductionSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 56: Magnet and Compass */}
                      {activeExperimentKey === 'magnet_compass' && <MagneticFieldSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 57: Magnets and Electromagnets (Solenoid) */}
                      {activeExperimentKey === 'magnets_electromagnets' && <ElectromagnetSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 58: Gravity Force Lab */}
                      {activeExperimentKey === 'gravity_force_lab' && <GravityForceSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 59: Solar System */}
                      {activeExperimentKey === 'solar_system' && <GravityOrbitsSim lang={lang} />}
                      {/* ID 60: Energy Forms and Changes */}
                      {activeExperimentKey === 'energy_forms' && <WorkHeatSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 61: Normal Modes */}
                      {activeExperimentKey === 'normal_modes' && <NormalModesSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 62: Forces and Motion: Basics */}
                      {activeExperimentKey === 'forces_motion' && <ForcesMotionSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 63: Gas Properties */}
                      {activeExperimentKey === 'gas_properties' && <ThermodynamicsSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 64: Diffusion */}
                      {activeExperimentKey === 'diffusion' && <DiffusionSim lang={lang} />}
                      {/* ID 65: Blackbody Spectrum */}
                      {activeExperimentKey === 'blackbody_spectrum' && <BlackbodySim lang={lang} />}

                      {/* ID 66: Doppler Effect */}
                      {activeExperimentKey === 'doppler_effect' && <DopplerEffectSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 67: Electrical Transformer */}
                      {activeExperimentKey === 'electrical_transformer' && <ElectricalTransformerSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 68: Photoelectric Effect */}
                      {activeExperimentKey === 'photoelectric_effect' && <PhotoelectricEffectSim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 69: Radioactive Decay */}
                      {activeExperimentKey === 'radioactive_decay' && <RadioactiveDecaySim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                      {/* ID 70: Calorimetry & Thermal Equilibrium */}
                      {activeExperimentKey === 'calorimetry_equilibrium' && <CalorimetrySim lang={lang} onLogMeasurement={handleLogMeasurement} />}
                    </Suspense>
                  </ErrorBoundary>
                </div>

                {/* 2. Collapsible Theory & Explanation Section (Accordion) */}
                {currentExp && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <button
                      id="toggle-theory-accordion-btn"
                      onClick={() => setIsTheoryExpanded((prev) => !prev)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start bg-slate-900 hover:bg-slate-850 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-500/40">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                            <span>
                              {t('catalogUI.theoryTitle')}
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {currentExp.physical_law}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {isTheoryExpanded ? t('common.hide') : t('common.showDetails')}
                        </span>
                        <div className="p-1 rounded-lg bg-slate-800 text-slate-300">
                          {isTheoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {isTheoryExpanded && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/80 space-y-3 animate-fade-in">
                        {/* Law Equation Row */}
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-3">
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {t('catalogUI.physicalLaw')}
                            </span>
                          </span>
                          <span className="text-xs sm:text-sm font-mono text-amber-300 font-bold tracking-wide">
                            {currentExp.physical_law}
                          </span>
                        </div>

                        {/* Inputs & Outputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {/* Simulation Inputs */}
                          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase">
                              <Sliders className="w-3.5 h-3.5" />
                              <span>
                                {t('catalogUI.simulationInputs')}
                              </span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(((t(`catalog.${currentExp.expKey}.inputs`, { returnObjects: true }) as string[]) || []).map((inp, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-200 text-xs flex items-center gap-1"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                  {inp}
                                </span>
                              )))}
                            </div>
                          </div>

                          {/* Simulation Outputs */}
                          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>
                                {t('catalogUI.simulationOutputs')}
                              </span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(((t(`catalog.${currentExp.expKey}.outputs`, { returnObjects: true }) as string[]) || []).map((out, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  {out}
                                </span>
                              )))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SMART RETURN NAVIGATION BAR (Shown when viewing any bottom tab: Notebook, Formulas, or Quiz) */}
        {activeMainTab !== 'experiments' && (
          <div
            id="smart-return-navigation-bar"
            className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl mb-6 animate-fade-in"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 1. Return to Active Simulation */}
              <button
                id="btn-return-to-active-sim"
                onClick={() => {
                  setActiveMainTab('experiments');
                  setIsBrowsingCatalog(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-100"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-indigo-200" />
                <span>
                  {t('navigation.returnToSim', { title: getExpTitle(currentExp, lang), id: currentExp.id })}
                </span>
              </button>

              {/* 2. Return to Main Experiments Catalog */}
              <button
                id="btn-return-to-home-catalog"
                onClick={() => {
                  setActiveMainTab('experiments');
                  setIsBrowsingCatalog(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-100"
              >
                <Home className="w-4 h-4 text-teal-400" />
                <span>
                  {t('navigation.homeCatalog')}
                </span>
              </button>
            </div>

            {/* Current Tab Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                {t(`tabs.${activeMainTab}`)}
              </span>
            </div>
          </div>
        )}

        {activeMainTab === 'notebook' && (
          <LabNotebook
            lang={lang}
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAll}
            onUpdateNote={handleUpdateNote}
          />
        )}

        {activeMainTab === 'formulas' && <FormulaSheet lang={lang} />}

        {activeMainTab === 'challenges' && <LabQuiz lang={lang} />}
      </main>

      {/* Lab Tools Modal */}
      <LabToolsModal lang={lang} isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />

      {/* Custom Non-blocking Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              {t('notebook.confirmClearTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {t('notebook.confirmClearMessage')}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmClearAllRecords}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-md shadow-rose-600/30 transition-colors"
              >
                {t('notebook.confirmClearBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer id="main-footer" className="border-t border-slate-900 py-4 mb-20 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {t('footer.text', { count: experimentsList.length })}
          </span>
          <span className="font-mono text-slate-500">
            Mechanics • Waves & Acoustics • E&M • Optics • Thermodynamics • Quantum & Astrophysics
          </span>
        </div>
      </footer>

      {/* Physics Equation Keyboard Modal/Drawer */}
      {isEquationKeyboardOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {t('equationKeyboard.modalTitle')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('equationKeyboard.modalSubtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEquationKeyboardOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
                title={t('navigation.closeOrReturn')}
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>{t('navigation.returnToSimShort')}</span>
              </button>
            </div>
            
            <PhysicsEquationKeyboard
              lang={lang}
              isOpen={true}
              onClose={() => setIsEquationKeyboardOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (4 Prominent & High-Accessibility Buttons) */}
      <div
        id="persistent-bottom-bar"
        className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg shadow-2xl shadow-black/80 px-2 sm:px-6 py-2 shrink-0 max-w-full overflow-hidden"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-around gap-1.5 sm:gap-4 shrink min-w-0">
          {/* 1. Lab Notebook Button */}
          <button
            id="bottom-nav-notebook"
            onClick={() => {
              if (activeMainTab === 'notebook') {
                setActiveMainTab('experiments');
              } else {
                setActiveMainTab('notebook');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-1 shrink min-w-0 min-h-[52px] py-1 px-1 sm:px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeMainTab === 'notebook'
                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/30'
                : 'bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <FileSpreadsheet className={`w-5 h-5 ${activeMainTab === 'notebook' ? 'text-emerald-400' : 'text-emerald-500'}`} />
              {records.length > 0 && (
                <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] font-mono leading-tight">
                  {records.length}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap truncate max-w-full block text-center min-w-0 shrink">
              {activeMainTab === 'notebook'
                ? t('navigation.returnBack')
                : t('tabs.notebookShort')}
            </span>
          </button>

          {/* 2. Formula Sheet Button */}
          <button
            id="bottom-nav-formulas"
            onClick={() => {
              if (activeMainTab === 'formulas') {
                setActiveMainTab('experiments');
              } else {
                setActiveMainTab('formulas');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-1 shrink min-w-0 min-h-[52px] py-1 px-1 sm:px-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeMainTab === 'formulas'
                ? 'bg-purple-950/70 border border-purple-500/50 text-purple-300 shadow-md shadow-purple-900/30 ring-1 ring-purple-400/30'
                : 'bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className={`w-5 h-5 shrink-0 ${activeMainTab === 'formulas' ? 'text-purple-400' : 'text-purple-400'}`} />
            <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap truncate max-w-full block text-center min-w-0 shrink">
              {activeMainTab === 'formulas'
                ? t('navigation.returnBack')
                : t('tabs.formulasShort')}
            </span>
          </button>

          {/* 4. Physics Equation Keyboard Button */}
          <button
            id="bottom-nav-keyboard"
            onClick={() => setIsEquationKeyboardOpen(true)}
            className="flex-1 shrink min-w-0 min-h-[52px] py-1 px-1 sm:px-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white group hover:border-indigo-500/40"
          >
            <Calculator className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap truncate max-w-full block text-center min-w-0 shrink">
              {t('tabs.equationKeys')}
            </span>
          </button>

          {/* 5. Lab Quiz / Challenges Button */}
          <button
            id="bottom-nav-challenges"
            onClick={() => {
              if (activeMainTab === 'challenges') {
                setActiveMainTab('experiments');
              } else {
                setActiveMainTab('challenges');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-1 shrink min-w-0 min-h-[52px] py-1 px-1 sm:px-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeMainTab === 'challenges'
                ? 'bg-amber-950/70 border border-amber-500/50 text-amber-300 shadow-md shadow-amber-900/30 ring-1 ring-amber-400/30'
                : 'bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Award className={`w-5 h-5 shrink-0 ${activeMainTab === 'challenges' ? 'text-amber-400' : 'text-amber-400'}`} />
            <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap truncate max-w-full block text-center min-w-0 shrink">
              {activeMainTab === 'challenges'
                ? t('navigation.returnBack')
                : t('tabs.challengesShort')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
