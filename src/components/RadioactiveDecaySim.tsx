import { Radiation, Pause, Play, FastForward, RotateCcw, Activity } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';

import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

interface IsotopePreset {
  id: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  halfLifeSec: number; // in simulation seconds
  displayHalfLife: string;
  radiationType: string;
}

const ISOTOPES: IsotopePreset[] = [
  { id: 'c14', nameAr: 'الكربون-14 (C-14)', nameEn: 'Carbon-14 (¹⁴C)', nameKu: 'کاربۆن-14', nameKmr: 'Karbon-14', halfLifeSec: 10, displayHalfLife: '5,730 years', radiationType: 'β⁻' },
  { id: 'i131', nameAr: 'اليود-131 (I-131)', nameEn: 'Iodine-131 (¹³¹I)', nameKu: 'یۆد-131', nameKmr: 'Yod-131', halfLifeSec: 6, displayHalfLife: '8.02 days', radiationType: 'β⁻ + γ' },
  { id: 'rn222', nameAr: 'الرادون-222 (Rn-222)', nameEn: 'Radon-222 (²²²Rn)', nameKu: 'ڕادۆن-222', nameKmr: 'Radon-222', halfLifeSec: 4, displayHalfLife: '3.82 days', radiationType: 'α' },
  { id: 'co60', nameAr: 'الكوبالت-60 (Co-60)', nameEn: 'Cobalt-60 (⁶⁰Co)', nameKu: 'کۆباڵت-60', nameKmr: 'Kobalt-60', halfLifeSec: 8, displayHalfLife: '5.27 years', radiationType: 'β⁻ + γ' },
  { id: 'po218', nameAr: 'البولونيوم-218 (Po-218)', nameEn: 'Polonium-218 (²¹⁸Po)', nameKu: 'پۆلۆنیۆم-218', nameKmr: 'Polonyum-218', halfLifeSec: 3, displayHalfLife: '3.10 minutes', radiationType: 'α' },
];

export default function RadioactiveDecaySim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const getIsotopeName = (iso: IsotopePreset) => {
    const names: Record<string, string> = {
      ar: iso.nameAr,
      ku: iso.nameKu,
      kmr: iso.nameKmr || iso.nameEn,
      en: iso.nameEn,
    };
    return names[lang] || iso.nameAr;
  };
  const [initialCount, setInitialCount] = useState<number>(400); // N_0
  const [isotopeIndex, setIsotopeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; decayed: boolean; decayTime?: number }[]>([]);
  const [history, setHistory] = useState<{ t: number; remaining: number }[]>([]);

  const isotope = ISOTOPES[isotopeIndex];
  const halfLife = isotope.halfLifeSec;
  const decayConstant = Math.LN2 / halfLife; // lambda = ln(2) / T_1/2

  // Initialize particles
  useEffect(() => {
    const newParticles = Array.from({ length: initialCount }).map((_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      decayed: false,
    }));
    setParticles(newParticles);
    setElapsedTime(0);
    setHistory([{ t: 0, remaining: initialCount }]);
  }, [initialCount, isotopeIndex]);

  // Main simulation timer loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (isPlaying) {
        setElapsedTime((prevT) => {
          const nextT = prevT + dt;

          // Probability of decay in dt: P = 1 - exp(-lambda * dt) ≈ lambda * dt
          const decayProb = 1 - Math.exp(-decayConstant * dt);

          setParticles((prevParticles) => {
            let activeCount = 0;
            const updated = prevParticles.map((p) => {
              if (p.decayed) return p;
              if (Math.random() < decayProb) {
                return { ...p, decayed: true, decayTime: nextT };
              }
              activeCount++;
              return p;
            });

            // Update history chart periodically
            setHistory((prevH) => {
              if (prevH.length === 0 || nextT - prevH[prevH.length - 1].t >= 0.5) {
                return [...prevH.slice(-40), { t: parseFloat(nextT.toFixed(1)), remaining: activeCount }];
              }
              return prevH;
            });

            return updated;
          });

          return nextT;
        });
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, decayConstant]);

  const activeCount = particles.filter((p) => !p.decayed).length;
  const decayedCount = particles.length - activeCount;
  const theoreticalRemaining = initialCount * Math.pow(0.5, elapsedTime / halfLife);
  const elapsedHalfLives = elapsedTime / halfLife;
  const activityBq = decayConstant * activeCount; // Decays/sec

  const handleReset = () => {
    const newParticles = Array.from({ length: initialCount }).map((_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      decayed: false,
    }));
    setParticles(newParticles);
    setElapsedTime(0);
    setHistory([{ t: 0, remaining: initialCount }]);
  };

  const handleStepHalfLife = () => {
    const nextT = elapsedTime + halfLife;
    setElapsedTime(nextT);
    setParticles((prev) =>
      prev.map((p) => {
        if (p.decayed) return p;
        return Math.random() < 0.5 ? { ...p, decayed: true, decayTime: nextT } : p;
      })
    );
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'radioactive_decay',
        parameters: {
          Isotope: isotope.nameEn,
          Initial_Nuclei_N0: initialCount,
          Half_Life_Sec: halfLife,
          Elapsed_Time_Sec: parseFloat(elapsedTime.toFixed(2)),
          Elapsed_Half_Lives: parseFloat(elapsedHalfLives.toFixed(2)),
          Decay_Constant_lambda: parseFloat(decayConstant.toFixed(4)),
        },
        measuredValue: activeCount,
        theoreticalValue: parseFloat(theoreticalRemaining.toFixed(1)),
        unit: 'nuclei',
        variableName: 'Remaining_Active_Nuclei_N_t',
        equation: 'N(t) = N₀ · (1/2)^(t / T₁/₂)',
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Radiation  className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {tI18n('experiments.radioactive_decay.title')}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              N(t) = N₀ · (1/2)^(t / T₁/₂) = N₀ · e^(-λ·t) &nbsp;|&nbsp; λ = ln(2) / T₁/₂
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
            <span>{isPlaying ? tI18n('experiments.radioactive_decay.pause') : tI18n('experiments.radioactive_decay.play')}</span>
          </button>
          <button
            onClick={handleStepHalfLife}
            title={tI18n('experiments.radioactive_decay.stepHalfLifeTooltip')}
           className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all">
            <FastForward  className="w-3.5 h-3.5 text-indigo-400"/>
            <span className="hidden sm:inline">+1 T½</span>
          </button>
          <button
            onClick={handleReset}
           className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all">
            <RotateCcw  className="w-3.5 h-3.5"/>
          </button>
          <button
            onClick={handleLog}
           className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all">
            <Activity  className="w-3.5 h-3.5"/>
            <span>{tI18n('experiments.radioactive_decay.log')}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
          {/* Top Status & Legend */}
          <div className="flex items-center justify-between z-10 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span  className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"/>
                {tI18n('experiments.radioactive_decay.activeParentNuclei')}: {activeCount}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <span  className="w-2.5 h-2.5 rounded-full bg-slate-600"/>
                {tI18n('experiments.radioactive_decay.decayedDaughter')}: {decayedCount}
              </span>
            </div>

            <span className="font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
              {tI18n('experiments.radioactive_decay.halfLivesCount')} <strong className="text-amber-400">{elapsedHalfLives.toFixed(2)} T₁/₂</strong>
            </span>
          </div>

          {/* Graphical Split: Left = Nuclei Cloud, Right = Exponential Curve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-auto py-2">
            {/* Nuclei Chamber Box */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 h-52 relative overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {particles.map((p) => (
                  <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={p.decayed ? 1.4 : 2}
                    fill={p.decayed ? '#475569' : '#10b981'}
                    opacity={p.decayed ? 0.4 : 0.9}
                  />
                ))}
              </svg>
            </div>

            {/* Live Decay Curve Plot */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2.5 h-52 flex flex-col justify-between">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>N(t) Decay Curve</span>
                <span className="text-emerald-400">{((activeCount / initialCount) * 100).toFixed(1)}%</span>
              </div>

              <div className="relative w-full h-36">
                <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                  {/* Axis lines */}
                  <line x1="10" y1="5" x2="10" y2="55" stroke="#475569" strokeWidth="0.6" />
                  <line x1="10" y1="55" x2="95" y2="55" stroke="#475569" strokeWidth="0.6" />

                  {/* Half-life vertical guide lines: T1/2, 2T1/2, 3T1/2 */}
                  <line x1="30" y1="5" x2="30" y2="55" stroke="#334155" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="50" y1="5" x2="50" y2="55" stroke="#334155" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="70" y1="5" x2="70" y2="55" stroke="#334155" strokeWidth="0.4" strokeDasharray="1,1" />

                  {/* Theoretical exponential curve */}
                  <path
                    d="M 10 10 Q 30 32 50 44 T 90 53"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="0.8"
                    strokeDasharray="2,1"
                  />

                  {/* Experimental Live Points Path */}
                  {history.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.5"
                      points={history
                        .map((pt) => {
                          const x = 10 + (pt.t / (halfLife * 4)) * 80;
                          const y = 55 - (pt.remaining / initialCount) * 45;
                          return `${Math.min(95, x)},${Math.max(5, y)}`;
                        })
                        .join(' ')}
                    />
                  )}
                </svg>
              </div>

              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>t=0</span>
                <span>1·T½</span>
                <span>2·T½</span>
                <span>3·T½</span>
                <span>4·T½</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.radioactive_decay.elapsedTime')}</span>
              <span className="text-slate-200 font-bold">{elapsedTime.toFixed(1)} s</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.radioactive_decay.activeNucleiCard')}</span>
              <span className="text-emerald-400 font-bold">{activeCount} / {initialCount}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.radioactive_decay.remainingPercent')}</span>
              <span className="text-amber-400 font-bold">{((activeCount / initialCount) * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.radioactive_decay.activityRate')}</span>
              <span className="text-sky-400 font-bold">{activityBq.toFixed(1)} Bq</span>
            </div>
          </div>
        </div>

        {/* Input Parameters Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              {tI18n('experiments.radioactive_decay.isotopeControls')}
            </h4>

            {/* Isotope Preset Selector */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300">{tI18n('experiments.radioactive_decay.targetIsotopeLabel')}</label>
              <select
                value={isotopeIndex}
                onChange={(e) => setIsotopeIndex(parseInt(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
              >
                {ISOTOPES.map((iso, idx) => (
                  <option key={iso.id} value={idx}>
                    {getIsotopeName(iso)} (T½ = {iso.displayHalfLife})
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Nuclei Count N0 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.radioactive_decay.initialNucleiLabel')}</span>
                <span className="font-mono text-emerald-400 font-bold">{initialCount} atoms</span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="50"
                value={initialCount}
                onChange={(e) => setInitialCount(parseInt(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-emerald-500"
              />
            </div>

            {/* Isotope Info Card */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">{tI18n('experiments.radioactive_decay.realHalfLife')}</span>
                <span className="text-amber-300 font-bold">{isotope.displayHalfLife}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">{tI18n('experiments.radioactive_decay.radiationType')}</span>
                <span className="text-sky-300 font-bold">{isotope.radiationType}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">{tI18n('experiments.radioactive_decay.decayConstant')}</span>
                <span className="text-purple-300 font-bold">{decayConstant.toFixed(3)} s⁻¹</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External HUD Cards Row (All calculated data placed strictly outside Canvas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.radioactive_decay.decayedNucleiCard')}
          </div>
          <div className="text-lg font-mono font-bold text-rose-400">
            {decayedCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">N_decayed = N₀ - N(t)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.radioactive_decay.theoreticalN')}
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {theoreticalRemaining.toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">N = N₀ · (1/2)^(t/T½)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.radioactive_decay.decayConstantCard')}
          </div>
          <div className="text-lg font-mono font-bold text-sky-400">
            {decayConstant.toFixed(4)} s⁻¹
          </div>
          <div className="text-[10px] text-slate-500 font-mono">λ = ln(2) / T₁/₂ = 0.693 / T½</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.radioactive_decay.instantaneousActivity')}
          </div>
          <div className="text-lg font-mono font-bold text-amber-400">
            {activityBq.toFixed(1)} Bq
          </div>
          <div className="text-[10px] text-slate-500 font-mono">A(t) = λ · N(t)</div>
        </div>
      </div>
    </div>
  );
}