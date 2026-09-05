import { Flame, Pause, Play, RotateCcw, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Language } from '../types';

import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

interface SolidMaterial {
  id: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  specificHeat: number; // J/(g·°C)
  color: string;
}

interface LiquidMaterial {
  id: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  specificHeat: number; // J/(g·°C)
  color: string;
}

const SOLIDS: SolidMaterial[] = [
  { id: 'copper', nameAr: 'النحاس (Copper)', nameEn: 'Copper (Cu)', nameKu: 'مس (Copper)', nameKmr: 'Sifir (Copper)', specificHeat: 0.385, color: '#f59e0b' },
  { id: 'aluminum', nameAr: 'الألومنيوم (Aluminum)', nameEn: 'Aluminum (Al)', nameKu: 'ئەلومینیۆم (Aluminum)', nameKmr: 'Alyumînyum (Aluminum)', specificHeat: 0.897, color: '#94a3b8' },
  { id: 'iron', nameAr: 'الحديد (Iron)', nameEn: 'Iron (Fe)', nameKu: 'ئاسن (Iron)', nameKmr: 'Hesên (Iron)', specificHeat: 0.449, color: '#64748b' },
  { id: 'lead', nameAr: 'الرصاص (Lead)', nameEn: 'Lead (Pb)', nameKu: 'سۆرب (Lead)', nameKmr: 'Qurşûm (Lead)', specificHeat: 0.129, color: '#475569' },
  { id: 'gold', nameAr: 'الذهب (Gold)', nameEn: 'Gold (Au)', nameKu: 'ئاڵتوون (Gold)', nameKmr: 'Zêr (Gold)', specificHeat: 0.129, color: '#eab308' },
];

const LIQUIDS: LiquidMaterial[] = [
  { id: 'water', nameAr: 'الماء (Water)', nameEn: 'Water (H₂O)', nameKu: 'ئاو (Water)', nameKmr: 'Av (H₂O)', specificHeat: 4.184, color: '#38bdf8' },
  { id: 'ethanol', nameAr: 'الإيثانول (Ethanol)', nameEn: 'Ethanol', nameKu: 'ئیتانۆل (Ethanol)', nameKmr: 'Êtanol', specificHeat: 2.440, color: '#a78bfa' },
  { id: 'oil', nameAr: 'زيت نباتي (Oil)', nameEn: 'Vegetable Oil', nameKu: 'ڕۆنی ڕووەکی (Oil)', nameKmr: 'Rûnê nebatî', specificHeat: 1.670, color: '#fbbf24' },
];

export default function CalorimetrySim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [solidIndex, setSolidIndex] = useState<number>(0);
  const [solidMass, setSolidMass] = useState<number>(100); // g
  const [solidTemp, setSolidTemp] = useState<number>(100); // °C (hot sample)

  const [liquidIndex, setLiquidIndex] = useState<number>(0);
  const [liquidMass, setLiquidMass] = useState<number>(200); // g
  const [liquidTemp, setLiquidTemp] = useState<number>(20); // °C (cool liquid)

  const [isSubmerged, setIsSubmerged] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [currentLiquidTemp, setCurrentLiquidTemp] = useState<number>(20);
  const [currentSolidTemp, setCurrentSolidTemp] = useState<number>(100);

  const solid = SOLIDS[solidIndex];
  const liquid = LIQUIDS[liquidIndex];

  // Thermal Equilibrium Equation:
  // Q_lost = Q_gained => m1 * c1 * (T1 - Tf) = m2 * c2 * (Tf - T2)
  // Tf = (m1 * c1 * T1 + m2 * c2 * T2) / (m1 * c1 + m2 * c2)
  const heatCapacitySolid = solidMass * solid.specificHeat; // J/°C
  const heatCapacityLiquid = liquidMass * liquid.specificHeat; // J/°C
  const finalEquilibriumTemp =
    (heatCapacitySolid * solidTemp + heatCapacityLiquid * liquidTemp) /
    (heatCapacitySolid + heatCapacityLiquid);

  const totalHeatJoules = heatCapacitySolid * (solidTemp - finalEquilibriumTemp);
  const totalHeatCalories = totalHeatJoules / 4.184;
  const deltaSolid = solidTemp - finalEquilibriumTemp;
  const deltaLiquid = finalEquilibriumTemp - liquidTemp;

  // Real-time thermal equilibration simulation
  useEffect(() => {
    if (!isPlaying || !isSubmerged) return;

    let animationId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      setElapsedTime((prevT) => prevT + dt);

      // Newton's law of cooling / heat transfer rate
      const kRate = 0.5; // thermal transfer constant
      setCurrentLiquidTemp((prevT) => {
        const diff = finalEquilibriumTemp - prevT;
        return prevT + diff * (1 - Math.exp(-kRate * dt * 2));
      });

      setCurrentSolidTemp((prevT) => {
        const diff = finalEquilibriumTemp - prevT;
        return prevT + diff * (1 - Math.exp(-kRate * dt * 2));
      });

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, isSubmerged, finalEquilibriumTemp]);

  const getSolidName = (s: typeof SOLIDS[0]) => {
    const names: Record<string, string> = {
      ar: s.nameAr,
      ku: s.nameKu,
      kmr: s.nameKmr || s.nameEn,
      en: s.nameEn,
    };
    return names[lang] || s.nameAr;
  };

  const getLiquidName = (l: typeof LIQUIDS[0]) => {
    const names: Record<string, string> = {
      ar: l.nameAr,
      ku: l.nameKu,
      kmr: l.nameKmr || l.nameEn,
      en: l.nameEn,
    };
    return names[lang] || l.nameAr;
  };

  const handleReset = () => {
    setElapsedTime(0);
    setCurrentLiquidTemp(liquidTemp);
    setCurrentSolidTemp(solidTemp);
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'calorimetry_equilibrium',
        parameters: {
          Solid_Material: getSolidName(solid),
          Solid_Mass_m1_g: solidMass,
          Solid_Initial_Temp_T1_C: solidTemp,
          Solid_Specific_Heat_c1: solid.specificHeat,
          Liquid_Material: getLiquidName(liquid),
          Liquid_Mass_m2_g: liquidMass,
          Liquid_Initial_Temp_T2_C: liquidTemp,
          Liquid_Specific_Heat_c2: liquid.specificHeat,
        },
        measuredValue: parseFloat(currentLiquidTemp.toFixed(2)),
        theoreticalValue: parseFloat(finalEquilibriumTemp.toFixed(2)),
        unit: '°C',
        variableName: 'Equilibrium_Temperature_Tf',
        equation: 'm₁·c₁·(T₁ - Tf) = m₂·c₂·(Tf - T₂)',
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame  className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {tI18n('experiments.calorimetry_equilibrium.title')}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Q_lost = Q_gained &nbsp;|&nbsp; m₁·c₁·(T₁ - T_f) = m₂·c₂·(T_f - T₂)
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
            <span>{isPlaying ? tI18n('experiments.calorimetry_equilibrium.pause') : tI18n('experiments.calorimetry_equilibrium.play')}</span>
          </button>
          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <RotateCcw  className="w-3.5 h-3.5"/>
          </button>
          <button
            onClick={handleLog}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all"
          >
            <Activity  className="w-3.5 h-3.5"/>
            <span>{tI18n('experiments.calorimetry_equilibrium.log')}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
          {/* Top Status Badge */}
          <div className="flex items-center justify-between z-10 text-xs flex-wrap gap-2">
            <span className="px-3 py-1 rounded-lg font-bold border bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
              {tI18n('experiments.calorimetry_equilibrium.adiabaticBadge')}
            </span>

            <span className="font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
              {tI18n('experiments.calorimetry_equilibrium.currentTemp')} <strong className="text-amber-400">{currentLiquidTemp.toFixed(2)} °C</strong>
            </span>
          </div>

          {/* Calorimeter Vector Vessel */}
          <div className="relative w-full h-64 my-auto flex items-center justify-center">
            <svg viewBox="0 0 100 80" className="w-full h-full max-w-lg">
              {/* Outer Insulated Shell */}
              <rect x="25" y="15" width="50" height="55" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              {/* Insulation foam stripes */}
              <rect x="27" y="17" width="46" height="51" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />

              {/* Inner Liquid Container */}
              <rect x="31" y="24" width="38" height="42" rx="2" fill="#020617" stroke="#64748b" strokeWidth="0.8" />

              {/* Liquid Level */}
              <rect
                x="32"
                y="36"
                width="36"
                height="29"
                rx="1"
                fill={liquid.color}
                opacity={0.65}
              />

              {/* Stirrer (left side inside liquid) */}
              <line x1="37" y1="8" x2="37" y2="58" stroke="#94a3b8" strokeWidth="1" />
              <line x1="33" y1="58" x2="41" y2="58" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="34" y="6" width="6" height="4" rx="1" fill="#64748b" />

              {/* Digital Thermometer Probe (center/right) */}
              <line x1="61" y1="8" x2="61" y2="54" stroke="#f43f5e" strokeWidth="1" />
              <circle cx="61" cy="54" r="2" fill="#ef4444" />
              {/* Digital Display Box */}
              <rect x="53" y="2" width="16" height="8" rx="1.5" fill="#020617" stroke="#f43f5e" strokeWidth="0.8" />
              <text x="61" y="7.5" fill="#fca5a5" fontSize="2.8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {currentLiquidTemp.toFixed(1)}°C
              </text>

              {/* Submerged Hot Metal Sample */}
              <g transform="translate(48, 48)">
                <rect
                  x="-7"
                  y="-8"
                  width="14"
                  height="16"
                  rx="2"
                  fill={solid.color}
                  stroke="#ffffff"
                  strokeWidth="0.6"
                />
                <text x="0" y="2" fill="#ffffff" fontSize="3" fontWeight="bold" textAnchor="middle">
                  {getSolidName(solid).split(' ')[0]}
                </text>
                {/* Heat conduction ripple rings */}
                {Math.abs(currentSolidTemp - currentLiquidTemp) > 0.5 && (
                  <circle cx="0" cy="0" r="10" fill="none" stroke="#f97316" strokeWidth="0.6" strokeDasharray="1,1" opacity="0.8" />
                )}
              </g>

              {/* Calorimeter Lid / Cover */}
              <rect x="23" y="14" width="54" height="4" rx="1" fill="#475569" stroke="#64748b" strokeWidth="0.6" />
            </svg>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.calorimetry_equilibrium.finalTempCard')}</span>
              <span className="text-emerald-400 font-bold">{finalEquilibriumTemp.toFixed(2)} °C</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.calorimetry_equilibrium.heatTransferredCard')}</span>
              <span className="text-amber-400 font-bold">{totalHeatJoules.toFixed(1)} J</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.calorimetry_equilibrium.deltaSolidCard')}</span>
              <span className="text-rose-400 font-bold">-{deltaSolid.toFixed(1)} °C</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.calorimetry_equilibrium.deltaLiquidCard')}</span>
              <span className="text-sky-400 font-bold">+{deltaLiquid.toFixed(1)} °C</span>
            </div>
          </div>
        </div>

        {/* Input Parameters Controls */}
        <div className="lg:col-span-4 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {tI18n('experiments.calorimetry_equilibrium.solidTitle')}
            </h4>

            {/* Solid Material Selector */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300">{tI18n('experiments.calorimetry_equilibrium.solidMaterialLabel')}</label>
              <select
                value={solidIndex}
                onChange={(e) => {
                  setSolidIndex(parseInt(e.target.value));
                  handleReset();
                }}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-amber-500"
              >
                {SOLIDS.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {getSolidName(s)} ({s.specificHeat} J/g°C)
                  </option>
                ))}
              </select>
            </div>

            {/* Solid Mass */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.calorimetry_equilibrium.solidMassLabel')}</span>
                <span className="font-mono text-amber-400 font-bold">{solidMass} g</span>
              </div>
              <input
                type="range"
                min="20"
                max="400"
                step="10"
                value={solidMass}
                onChange={(e) => {
                  setSolidMass(parseInt(e.target.value));
                  handleReset();
                }}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Solid Initial Temp */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.calorimetry_equilibrium.solidTempLabel')}</span>
                <span className="font-mono text-rose-400 font-bold">{solidTemp} °C</span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                step="5"
                value={solidTemp}
                onChange={(e) => {
                  setSolidTemp(parseInt(e.target.value));
                  handleReset();
                }}
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              {tI18n('experiments.calorimetry_equilibrium.liquidTitle')}
            </h4>

            {/* Liquid Type */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300">{tI18n('experiments.calorimetry_equilibrium.liquidMaterialLabel')}</label>
              <select
                value={liquidIndex}
                onChange={(e) => {
                  setLiquidIndex(parseInt(e.target.value));
                  handleReset();
                }}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-sky-500"
              >
                {LIQUIDS.map((l, idx) => (
                  <option key={l.id} value={idx}>
                    {getLiquidName(l)} ({l.specificHeat} J/g°C)
                  </option>
                ))}
              </select>
            </div>

            {/* Liquid Mass */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.calorimetry_equilibrium.liquidMassLabel')}</span>
                <span className="font-mono text-sky-400 font-bold">{liquidMass} g</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={liquidMass}
                onChange={(e) => {
                  setLiquidMass(parseInt(e.target.value));
                  handleReset();
                }}
                className="w-full accent-sky-500"
              />
            </div>

            {/* Liquid Initial Temp */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.calorimetry_equilibrium.liquidTempLabel')}</span>
                <span className="font-mono text-sky-400 font-bold">{liquidTemp} °C</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                value={liquidTemp}
                onChange={(e) => {
                  setLiquidTemp(parseInt(e.target.value));
                  handleReset();
                }}
                className="w-full accent-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* External HUD Cards Row (All calculated data placed strictly outside Canvas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.calorimetry_equilibrium.sampleHeatCapacity')}
          </div>
          <div className="text-lg font-mono font-bold text-amber-400">
            {heatCapacitySolid.toFixed(1)} J/°C
          </div>
          <div className="text-[10px] text-slate-500 font-mono">C₁ = m₁ · c₁</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.calorimetry_equilibrium.liquidHeatCapacity')}
          </div>
          <div className="text-lg font-mono font-bold text-sky-400">
            {heatCapacityLiquid.toFixed(1)} J/°C
          </div>
          <div className="text-[10px] text-slate-500 font-mono">C₂ = m₂ · c₂</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.calorimetry_equilibrium.heatCalories')}
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {totalHeatCalories.toFixed(1)} cal
          </div>
          <div className="text-[10px] text-slate-500 font-mono">1 cal = 4.184 J</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.calorimetry_equilibrium.equilibriumKelvin')}
          </div>
          <div className="text-lg font-mono font-bold text-purple-400">
            {(finalEquilibriumTemp + 273.15).toFixed(2)} K
          </div>
          <div className="text-[10px] text-slate-500 font-mono">T(K) = T(°C) + 273.15</div>
        </div>
      </div>
    </div>
  );
}