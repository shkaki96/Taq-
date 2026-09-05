import { 
  Eye, 
  RotateCcw, 
  BookmarkCheck, 
  Check, 
  Plus, 
  Minus, 
  Zap, 
  Sparkles, 
  Copy, 
  Info,
  Layers,
  Activity,
  Lightbulb,
  Power
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface ColorVisionSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

type VisionDeficiency = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy';
type ViewMode = 'observer' | 'spotlights';

interface Preset {
  id: string;
  nameKey: string;
  r: number;
  g: number;
  b: number;
}

const PRESETS: Preset[] = [
  { id: 'yellow', nameKey: 'colorYellow', r: 255, g: 255, b: 0 },
  { id: 'cyan', nameKey: 'colorCyan', r: 0, g: 255, b: 255 },
  { id: 'magenta', nameKey: 'colorMagenta', r: 255, g: 0, b: 255 },
  { id: 'white', nameKey: 'colorWhite', r: 255, g: 255, b: 255 },
  { id: 'black', nameKey: 'colorBlack', r: 0, g: 0, b: 0 },
  { id: 'red', nameKey: 'colorPureRed', r: 255, g: 0, b: 0 },
  { id: 'green', nameKey: 'colorPureGreen', r: 0, g: 255, b: 0 },
  { id: 'blue', nameKey: 'colorPureBlue', r: 0, g: 0, b: 255 },
  { id: 'orange', nameKey: 'colorOrange', r: 255, g: 128, b: 0 },
  { id: 'amber', nameKey: 'colorAmber', r: 255, g: 191, b: 0 },
  { id: 'lime', nameKey: 'colorLime', r: 128, g: 255, b: 0 },
  { id: 'teal', nameKey: 'colorTeal', r: 0, g: 128, b: 128 },
  { id: 'violet', nameKey: 'colorViolet', r: 138, g: 43, b: 226 },
  { id: 'gray', nameKey: 'colorGray', r: 128, g: 128, b: 128 },
];

// Color Blindness Simulation Matrices (Brettel / Vienot et al.)
function simulateDeficiency(r: number, g: number, b: number, mode: VisionDeficiency): [number, number, number] {
  const rL = r / 255;
  const gL = g / 255;
  const bL = b / 255;

  let sR = rL;
  let sG = gL;
  let sB = bL;

  if (mode === 'protanopia') {
    // Missing L-cones (Red blind)
    sR = 0.56667 * rL + 0.43333 * gL;
    sG = 0.55833 * rL + 0.44167 * gL;
    sB = 0.24167 * gL + 0.75833 * bL;
  } else if (mode === 'deuteranopia') {
    // Missing M-cones (Green blind)
    sR = 0.625 * rL + 0.375 * gL;
    sG = 0.70 * rL + 0.30 * gL;
    sB = 0.30 * gL + 0.70 * bL;
  } else if (mode === 'tritanopia') {
    // Missing S-cones (Blue blind)
    sR = 0.95 * rL + 0.05 * gL;
    sG = 0.43333 * gL + 0.56667 * bL;
    sB = 0.475 * gL + 0.525 * bL;
  } else if (mode === 'monochromacy') {
    // Total color blindness (Luminance Y only)
    const y = 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
    sR = y;
    sG = y;
    sB = y;
  }

  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return [clamp(sR), clamp(sG), clamp(sB)];
}

export const ColorVisionSim: React.FC<ColorVisionSimProps> = ({ lang, onLogMeasurement }) => {
  const { t } = useTranslation();

  // Primary Beam Intensities (0 - 255)
  const [red, setRed] = useState<number>(255);
  const [green, setGreen] = useState<number>(255);
  const [blue, setBlue] = useState<number>(0);

  // Power switches for each flashlight
  const [redPower, setRedPower] = useState<boolean>(true);
  const [greenPower, setGreenPower] = useState<boolean>(true);
  const [bluePower, setBluePower] = useState<boolean>(true);

  // View Mode & Color Vision Model
  const [viewMode, setViewMode] = useState<ViewMode>('observer');
  const [visionMode, setVisionMode] = useState<VisionDeficiency>('normal');

  // Interactive UI states
  const [logged, setLogged] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Effective RGB accounting for beam power
  const effR = redPower ? red : 0;
  const effG = greenPower ? green : 0;
  const effB = bluePower ? blue : 0;

  // Actual Physical Color Output
  const hexPhysical = `#${effR.toString(16).padStart(2, '0')}${effG.toString(16).padStart(2, '0')}${effB.toString(16).padStart(2, '0')}`;

  // Perceived Color Output (Simulated Vision Deficiency)
  const [percR, percG, percB] = useMemo(() => {
    return simulateDeficiency(effR, effG, effB, visionMode);
  }, [effR, effG, effB, visionMode]);

  const hexPerceived = `#${percR.toString(16).padStart(2, '0')}${percG.toString(16).padStart(2, '0')}${percB.toString(16).padStart(2, '0')}`;

  // Cone photoreceptor activation rates (%)
  const lConePct = ((effR / 255) * 100).toFixed(0);
  const mConePct = ((effG / 255) * 100).toFixed(0);
  const sConePct = ((effB / 255) * 100).toFixed(0);

  // Relative Luminance Y (CIE 1931: Y = 0.2126 R + 0.7152 G + 0.0722 B)
  const relLuminance = ((0.2126 * effR + 0.7152 * effG + 0.0722 * effB) / 255 * 100).toFixed(1);

  // Chromaticity coordinates (r, g, b normalized)
  const sumRGB = effR + effG + effB;
  const normR = sumRGB > 0 ? (effR / sumRGB).toFixed(3) : '0.333';
  const normG = sumRGB > 0 ? (effG / sumRGB).toFixed(3) : '0.333';
  const normB = sumRGB > 0 ? (effB / sumRGB).toFixed(3) : '0.333';

  // Determine standard color name
  const colorNameKey = useMemo(() => {
    const p = PRESETS.find((pr) => pr.r === effR && pr.g === effG && pr.b === effB);
    return p ? p.nameKey : 'colorCustom';
  }, [effR, effG, effB]);

  // Reset to default (Yellow = Red + Green)
  const handleReset = () => {
    setRed(255);
    setGreen(255);
    setBlue(0);
    setRedPower(true);
    setGreenPower(true);
    setBluePower(true);
    setVisionMode('normal');
    setViewMode('observer');
  };

  // Apply preset
  const handleApplyPreset = (p: Preset) => {
    setRed(p.r);
    setGreen(p.g);
    setBlue(p.b);
    setRedPower(p.r > 0);
    setGreenPower(p.g > 0);
    setBluePower(p.b > 0);
  };

  // Copy HEX code
  const handleCopyHex = () => {
    navigator.clipboard.writeText(hexPhysical.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Log measurement
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'color_vision',
        colorName: t(`experiments.color_vision.${colorNameKey}`),
        hexPhysical: hexPhysical.toUpperCase(),
        hexPerceived: hexPerceived.toUpperCase(),
        redIntensity: effR,
        greenIntensity: effG,
        blueIntensity: effB,
        lConeActivationPercent: lConePct,
        mConeActivationPercent: mConePct,
        sConeActivationPercent: sConePct,
        relativeLuminancePercent: relLuminance,
        chromaticityCoordinates: { r: normR, g: normG, b: normB },
        visionModel: visionMode,
        timestamp: new Date().toISOString(),
        equation: 'Color = r·R(700nm) + g·G(546nm) + b·B(435nm)',
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl" id="color-vision-container">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {t('experiments.color_vision.title')}
            </h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 7</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Observer vs Spotlights */}
          <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-800 flex items-center">
            <button
              id="color-view-observer-btn"
              type="button"
              onClick={() => setViewMode('observer')}
              className={`min-h-[38px] px-3 py-1 text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'observer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('experiments.color_vision.viewObserver')}</span>
            </button>
            <button
              id="color-view-spotlights-btn"
              type="button"
              onClick={() => setViewMode('spotlights')}
              className={`min-h-[38px] px-3 py-1 text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'spotlights'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('experiments.color_vision.viewOverlapping')}</span>
            </button>
          </div>

          {/* Copy HEX Button */}
          <button
            id="color-copy-hex-btn"
            type="button"
            onClick={handleCopyHex}
            className="min-h-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            title={t('experiments.color_vision.copyHex')}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="font-mono">{copied ? t('experiments.color_vision.copied') : hexPhysical.toUpperCase()}</span>
          </button>

          {/* Log Measurement */}
          <button
            id="color-log-btn"
            type="button"
            onClick={handleLog}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              logged
                ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
            }`}
          >
            {logged ? <Check className="w-4 h-4" /> : <BookmarkCheck className="w-4 h-4" />}
            <span>{logged ? t('experiments.color_vision.logged') : t('experiments.color_vision.log')}</span>
          </button>

          {/* Reset */}
          <button
            id="color-reset-btn"
            type="button"
            onClick={handleReset}
            className="p-2 min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center transition-colors"
            title={t('experiments.color_vision.reset')}
            aria-label="Reset to Yellow"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Color Presets Palette Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            {t('experiments.color_vision.presets')}
          </span>
          <span className="text-[11px] font-mono text-slate-300">
            {t(`experiments.color_vision.${colorNameKey}`)} • RGB({effR}, {effG}, {effB})
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => {
            const isCurrent = effR === p.r && effG === p.g && effB === p.b;
            const swatchBg = `rgb(${p.r}, ${p.g}, ${p.b})`;
            return (
              <button
                key={p.id}
                id={`color-preset-${p.id}-btn`}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`min-h-[38px] px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isCurrent
                    ? 'bg-slate-800 text-white border-indigo-400 ring-2 ring-indigo-500/40 font-bold shadow-md'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm shrink-0"
                  style={{ backgroundColor: swatchBg }}
                />
                <span className="truncate max-w-[120px]">{t(`experiments.color_vision.${p.nameKey}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vision Deficiency Model Selector Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
            <Activity className="w-3.5 h-3.5" />
            {t('experiments.color_vision.visionDeficiency')}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {visionMode === 'normal' ? 'Standard Trichromatic Eyes' : 'Photoreceptor Sensitivity Shift'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'normal', nameKey: 'normalVision', desc: 'L+M+S Cones' },
            { id: 'protanopia', nameKey: 'protanopia', desc: 'No L-Cones' },
            { id: 'deuteranopia', nameKey: 'deuteranopia', desc: 'No M-Cones' },
            { id: 'tritanopia', nameKey: 'tritanopia', desc: 'No S-Cones' },
            { id: 'monochromacy', nameKey: 'monochromacy', desc: 'Rods Only' },
          ].map((v) => {
            const isSel = visionMode === v.id;
            return (
              <button
                key={v.id}
                id={`vision-mode-${v.id}-btn`}
                type="button"
                onClick={() => setVisionMode(v.id as VisionDeficiency)}
                className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center border transition-all ${
                  isSel
                    ? 'bg-indigo-950/90 text-indigo-200 border-indigo-500 shadow-md ring-2 ring-indigo-500/30 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{t(`experiments.color_vision.${v.nameKey}`)}</span>
                <span className="text-[10px] text-slate-500 font-mono">{v.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Stage & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Ray / Spotlight Stage & Cone Photoreceptors */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          {/* Stage Header Info */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              {t('experiments.color_vision.perceivedBrain')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                {t('experiments.color_vision.luminance')}: <strong className="text-amber-400">{relLuminance}%</strong>
              </span>
            </div>
          </div>

          {/* Interactive Visual Stage */}
          {viewMode === 'observer' ? (
            /* Mode 1: Observer & Flashlights Stage */
            <div className="relative w-full h-[280px] bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-between p-4 shadow-inner">
              {/* Flashlights on the Left */}
              <div className="flex flex-col justify-around h-full z-10 space-y-2 py-2">
                {/* Red Flashlight */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-14 h-9 rounded-lg border flex items-center justify-center transition-all ${
                      redPower && red > 0
                        ? 'bg-red-950/80 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        : 'bg-slate-900 border-slate-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-red-400">R: {effR}</span>
                  </div>
                  <div
                    className="h-3 rounded-r-full transition-all duration-300"
                    style={{
                      width: '60px',
                      backgroundColor: redPower ? `rgba(239, 68, 68, ${red / 255})` : 'transparent',
                      boxShadow: redPower && red > 0 ? `0 0 16px rgba(239, 68, 68, ${red / 255})` : 'none',
                    }}
                  />
                </div>

                {/* Green Flashlight */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-14 h-9 rounded-lg border flex items-center justify-center transition-all ${
                      greenPower && green > 0
                        ? 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]'
                        : 'bg-slate-900 border-slate-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-emerald-400">G: {effG}</span>
                  </div>
                  <div
                    className="h-3 rounded-r-full transition-all duration-300"
                    style={{
                      width: '60px',
                      backgroundColor: greenPower ? `rgba(34, 197, 94, ${green / 255})` : 'transparent',
                      boxShadow: greenPower && green > 0 ? `0 0 16px rgba(34, 197, 94, ${green / 255})` : 'none',
                    }}
                  />
                </div>

                {/* Blue Flashlight */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-14 h-9 rounded-lg border flex items-center justify-center transition-all ${
                      bluePower && blue > 0
                        ? 'bg-blue-950/80 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                        : 'bg-slate-900 border-slate-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-blue-400">B: {effB}</span>
                  </div>
                  <div
                    className="h-3 rounded-r-full transition-all duration-300"
                    style={{
                      width: '60px',
                      backgroundColor: bluePower ? `rgba(59, 130, 246, ${blue / 255})` : 'transparent',
                      boxShadow: bluePower && blue > 0 ? `0 0 16px rgba(59, 130, 246, ${blue / 255})` : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Blended Photon Beam Stream */}
              <div className="flex-1 h-full flex items-center justify-center px-4 relative">
                <div
                  className="w-full h-24 rounded-full blur-md transition-all duration-300"
                  style={{
                    backgroundColor: hexPhysical,
                    opacity: (effR + effG + effB) > 0 ? 0.75 : 0,
                    boxShadow: (effR + effG + effB) > 0 ? `0 0 35px ${hexPhysical}` : 'none',
                  }}
                />
              </div>

              {/* Observer Head, Eye, & Brain Thought Bubble */}
              <div className="flex flex-col items-center justify-center z-10 space-y-2">
                {/* Perceived Thought Bubble */}
                <div
                  className="w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-2xl relative"
                  style={{
                    backgroundColor: hexPerceived,
                    borderColor: (effR + effG + effB) > 0 ? '#ffffff' : '#334155',
                    boxShadow: (effR + effG + effB) > 0 ? `0 0 25px ${hexPerceived}` : 'none',
                  }}
                >
                  <span
                    className="text-[11px] font-black font-mono px-1.5 py-0.5 rounded shadow-sm"
                    style={{
                      backgroundColor: (percR * 0.299 + percG * 0.587 + percB * 0.114) > 130 ? '#0f172a' : '#ffffff',
                      color: (percR * 0.299 + percG * 0.587 + percB * 0.114) > 130 ? '#ffffff' : '#0f172a',
                    }}
                  >
                    {hexPerceived.toUpperCase()}
                  </span>
                  <span
                    className="text-[9px] font-bold mt-1 max-w-[85px] text-center truncate px-1"
                    style={{
                      color: (percR * 0.299 + percG * 0.587 + percB * 0.114) > 130 ? '#0f172a' : '#ffffff',
                    }}
                  >
                    {t(`experiments.color_vision.${colorNameKey}`)}
                  </span>
                </div>

                {/* Eye Icon Label */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-semibold">{t('experiments.color_vision.perceivedBrain')}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Overlapping Spotlights / Venn Diagram */
            <div className="relative w-full h-[280px] bg-black border border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
              <div className="relative w-[240px] h-[220px]">
                {/* Red Spotlight (Top) */}
                <div
                  className="absolute w-36 h-36 rounded-full top-0 left-12 mix-blend-screen transition-all duration-300"
                  style={{
                    backgroundColor: redPower ? `rgb(${red}, 0, 0)` : 'transparent',
                    boxShadow: redPower && red > 0 ? `0 0 30px rgba(255, 0, 0, ${red / 255})` : 'none',
                  }}
                />

                {/* Green Spotlight (Bottom Left) */}
                <div
                  className="absolute w-36 h-36 rounded-full bottom-0 left-0 mix-blend-screen transition-all duration-300"
                  style={{
                    backgroundColor: greenPower ? `rgb(0, ${green}, 0)` : 'transparent',
                    boxShadow: greenPower && green > 0 ? `0 0 30px rgba(0, 255, 0, ${green / 255})` : 'none',
                  }}
                />

                {/* Blue Spotlight (Bottom Right) */}
                <div
                  className="absolute w-36 h-36 rounded-full bottom-0 right-0 mix-blend-screen transition-all duration-300"
                  style={{
                    backgroundColor: bluePower ? `rgb(0, 0, ${blue})` : 'transparent',
                    boxShadow: bluePower && blue > 0 ? `0 0 30px rgba(0, 0, 255, ${blue / 255})` : 'none',
                  }}
                />

                {/* Center Core Mix Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span
                    className="text-xs font-bold font-mono px-2 py-0.5 rounded-full border shadow-lg"
                    style={{
                      backgroundColor: hexPhysical,
                      borderColor: '#ffffff',
                      color: (effR * 0.299 + effG * 0.587 + effB * 0.114) > 130 ? '#000000' : '#ffffff',
                    }}
                  >
                    {t(`experiments.color_vision.${colorNameKey}`)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Retina Photoreceptor Cone Sensitivity Bars */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                {t('experiments.color_vision.cones')}
              </span>
              <span className="text-[11px] font-mono text-slate-400">Trichromatic Response</span>
            </div>

            {/* L-Cones (Red 560nm) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-red-400 font-bold">{t('experiments.color_vision.lCones')}</span>
                <span className="text-slate-300">{lConePct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  style={{ width: `${lConePct}%` }}
                />
              </div>
            </div>

            {/* M-Cones (Green 530nm) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">{t('experiments.color_vision.mCones')}</span>
                <span className="text-slate-300">{mConePct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                  style={{ width: `${mConePct}%` }}
                />
              </div>
            </div>

            {/* S-Cones (Blue 420nm) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-blue-400 font-bold">{t('experiments.color_vision.sCones')}</span>
                <span className="text-slate-300">{sConePct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                  style={{ width: `${sConePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Flashlight Sliders & Scientific Color Coordinates */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Red Beam Controller */}
            <div className="space-y-2 p-3 bg-slate-900/60 border border-red-500/20 rounded-xl">
              <div className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <button
                    id="red-power-toggle-btn"
                    type="button"
                    onClick={() => setRedPower(!redPower)}
                    className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border transition-all ${
                      redPower
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                    title={t('experiments.color_vision.beamPower')}
                    aria-label="Toggle Red Flashlight"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-red-400 font-bold">{t('experiments.color_vision.redBeam')}</span>
                </div>
                <span className="font-mono text-white text-sm font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">
                  {effR}
                </span>
              </div>

              {/* Slider & Stepper */}
              <div className="flex items-center gap-2">
                <button
                  id="red-decrement-btn"
                  type="button"
                  onClick={() => setRed((prev) => Math.max(0, prev - 5))}
                  disabled={!redPower || red <= 0}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 border border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title={`${t('experiments.color_vision.decrease')} Red`}
                  aria-label="Decrease Red"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="red-intensity-slider"
                  type="range"
                  min="0"
                  max="255"
                  step="1"
                  value={red}
                  disabled={!redPower}
                  onChange={(e) => setRed(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-30"
                />
                <button
                  id="red-increment-btn"
                  type="button"
                  onClick={() => setRed((prev) => Math.min(255, prev + 5))}
                  disabled={!redPower || red >= 255}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 border border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title={`${t('experiments.color_vision.increase')} Red`}
                  aria-label="Increase Red"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Green Beam Controller */}
            <div className="space-y-2 p-3 bg-slate-900/60 border border-emerald-500/20 rounded-xl">
              <div className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <button
                    id="green-power-toggle-btn"
                    type="button"
                    onClick={() => setGreenPower(!greenPower)}
                    className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border transition-all ${
                      greenPower
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                    title={t('experiments.color_vision.beamPower')}
                    aria-label="Toggle Green Flashlight"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-emerald-400 font-bold">{t('experiments.color_vision.greenBeam')}</span>
                </div>
                <span className="font-mono text-white text-sm font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">
                  {effG}
                </span>
              </div>

              {/* Slider & Stepper */}
              <div className="flex items-center gap-2">
                <button
                  id="green-decrement-btn"
                  type="button"
                  onClick={() => setGreen((prev) => Math.max(0, prev - 5))}
                  disabled={!greenPower || green <= 0}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-400 border border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title={`${t('experiments.color_vision.decrease')} Green`}
                  aria-label="Decrease Green"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="green-intensity-slider"
                  type="range"
                  min="0"
                  max="255"
                  step="1"
                  value={green}
                  disabled={!greenPower}
                  onChange={(e) => setGreen(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-30"
                />
                <button
                  id="green-increment-btn"
                  type="button"
                  onClick={() => setGreen((prev) => Math.min(255, prev + 5))}
                  disabled={!greenPower || green >= 255}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-400 border border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title={`${t('experiments.color_vision.increase')} Green`}
                  aria-label="Increase Green"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Blue Beam Controller */}
            <div className="space-y-2 p-3 bg-slate-900/60 border border-blue-500/20 rounded-xl">
              <div className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <button
                    id="blue-power-toggle-btn"
                    type="button"
                    onClick={() => setBluePower(!bluePower)}
                    className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border transition-all ${
                      bluePower
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                    title={t('experiments.color_vision.beamPower')}
                    aria-label="Toggle Blue Flashlight"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-blue-400 font-bold">{t('experiments.color_vision.blueBeam')}</span>
                </div>
                <span className="font-mono text-white text-sm font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">
                  {effB}
                </span>
              </div>

              {/* Slider & Stepper */}
              <div className="flex items-center gap-2">
                <button
                  id="blue-decrement-btn"
                  type="button"
                  onClick={() => setBlue((prev) => Math.max(0, prev - 5))}
                  disabled={!bluePower || blue <= 0}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-blue-400 border border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title={`${t('experiments.color_vision.decrease')} Blue`}
                  aria-label="Decrease Blue"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="blue-intensity-slider"
                  type="range"
                  min="0"
                  max="255"
                  step="1"
                  value={blue}
                  disabled={!bluePower}
                  onChange={(e) => setBlue(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-30"
                />
                <button
                  id="blue-increment-btn"
                  type="button"
                  onClick={() => setBlue((prev) => Math.min(255, prev + 5))}
                  disabled={!bluePower || blue >= 255}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-blue-400 border border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title={`${t('experiments.color_vision.increase')} Blue`}
                  aria-label="Increase Blue"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CIE Chromaticity & Physics Data */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                {t('experiments.color_vision.chromaticity')}
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-red-400 block font-bold">r (norm)</span>
                  <span className="text-white font-bold">{normR}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-emerald-400 block font-bold">g (norm)</span>
                  <span className="text-white font-bold">{normG}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-blue-400 block font-bold">b (norm)</span>
                  <span className="text-white font-bold">{normB}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
