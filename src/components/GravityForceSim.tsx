import { Orbit, Activity, MoveHorizontal } from 'lucide-react';
import React, { useState } from 'react';
import { Language } from '../types';

import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

export default function GravityForceSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [m1, setM1] = useState<number>(50); // kg
  const [m2, setM2] = useState<number>(100); // kg
  const [distance, setDistance] = useState<number>(4.0); // meters (2 to 10 m)

  // Universal Gravitational Constant G = 6.67430e-11 N m^2 / kg^2
  const G = 6.6743e-11;

  // Force in scientific notation and microNewtons
  const forceN = (G * m1 * m2) / (distance * distance);
  const forceNanoN = (forceN * 1e9).toFixed(3); // nN (nanoNewtons)
  const forceSci = forceN.toExponential(3);

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'gravity_force_lab',
        parameters: {
          Mass1_kg: m1,
          Mass2_kg: m2,
          Distance_r_m: distance,
        },
        measuredValue: parseFloat(forceNanoN),
        theoreticalValue: parseFloat(((G * m1 * m2) / (distance * distance) * 1e9).toFixed(3)),
        unit: 'nN',
        variableName: 'F_gravitational',
        equation: 'F = G · m₁ · m₂ / r²',
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Orbit  className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {tI18n('experiments.gravity_force_lab.title')}
            </h3>
            <p className="text-xs text-slate-400 font-mono">F = G · m₁ · m₂ / r²</p>
          </div>
        </div>
        <button
          onClick={handleLog}
         className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all">
          <Activity  className="w-3.5 h-3.5"/>
          <span>{tI18n('experiments.gravity_force_lab.logMeasurement')}</span>
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visual Spheres & Force Vectors */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
          {/* Distance Ruler Bar */}
          <div className="w-full max-w-md flex items-center justify-between border-b border-dashed border-slate-700 pb-2 mb-6 px-4">
            <MoveHorizontal  className="w-4 h-4 text-slate-400"/>
            <span className="text-sm font-mono text-emerald-300 font-bold">
              r = {distance.toFixed(1)} m
            </span>
            <MoveHorizontal  className="w-4 h-4 text-slate-400"/>
          </div>

          {/* Spheres with Mass and Vectors */}
          <div className="flex items-center justify-around w-full max-w-lg relative py-8">
            {/* Sphere 1 (Blue) */}
            <div className="flex flex-col items-center gap-2 relative">
              {/* Force Vector 1 -> 2 */}
              <div
                style={{ width: `${Math.min(100, Math.max(25, parseFloat(forceNanoN) * 20))}px` }}
               className="absolute top-1/2 -translate-y-1/2 ltr:left-full rtl:right-full flex items-center gap-1 transition-all duration-300">
                <div  className="h-1 bg-gradient-to-r from-blue-400 to-emerald-400 w-full rounded"/>
                <span className="text-[9px] font-mono text-emerald-300 shrink-0 font-bold">F₁₂</span>
              </div>

              <div
                style={{
                  width: `${Math.min(90, Math.max(45, 35 + m1 * 0.4))}px`,
                  height: `${Math.min(90, Math.max(45, 35 + m1 * 0.4))}px`,
                }}
               className="rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-900 border-2 border-blue-300 shadow-xl flex items-center justify-center transition-all">
                <span className="text-xs font-bold text-white font-mono">m₁</span>
              </div>
              <span className="text-sm font-mono text-blue-300 font-bold">{m1} kg</span>
            </div>

            {/* Center Measurement Readout */}
            <div className="bg-slate-900/90 border border-emerald-500/40 px-4 py-2 rounded-xl text-center shadow-lg">
              <span className="text-[10px] text-slate-400 block uppercase">
                {tI18n('experiments.gravity_force_lab.gravitationalForce')}
              </span>
              <span className="text-sm font-mono font-bold text-emerald-300">{forceNanoN} nN</span>
              <span className="text-[10px] font-mono text-slate-400 block">({forceSci} N)</span>
            </div>

            {/* Sphere 2 (Red/Orange) */}
            <div className="flex flex-col items-center gap-2 relative">
              {/* Force Vector 2 -> 1 */}
              <div
                style={{ width: `${Math.min(100, Math.max(25, parseFloat(forceNanoN) * 20))}px` }}
               className="absolute top-1/2 -translate-y-1/2 ltr:right-full rtl:left-full flex items-center gap-1 flex-row-reverse transition-all duration-300">
                <div  className="h-1 bg-gradient-to-l from-orange-400 to-emerald-400 w-full rounded"/>
                <span className="text-[9px] font-mono text-emerald-300 shrink-0 font-bold">F₂₁</span>
              </div>

              <div
                style={{
                  width: `${Math.min(90, Math.max(45, 35 + m2 * 0.4))}px`,
                  height: `${Math.min(90, Math.max(45, 35 + m2 * 0.4))}px`,
                }}
               className="rounded-full bg-gradient-to-br from-amber-400 via-orange-600 to-red-900 border-2 border-orange-300 shadow-xl flex items-center justify-center transition-all">
                <span className="text-xs font-bold text-white font-mono">m₂</span>
              </div>
              <span className="text-sm font-mono text-orange-300 font-bold">{m2} kg</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-3 text-center">
            {tI18n('experiments.gravity_force_lab.thirdLawNote')}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              {tI18n('experiments.gravity_force_lab.simulationInputs')}
            </h4>

            {/* Mass 1 Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.gravity_force_lab.mass1')}</span>
                <span className="font-mono text-blue-400 font-bold">{m1} kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={m1}
                onChange={(e) => setM1(parseFloat(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-blue-500"
              />
            </div>

            {/* Mass 2 Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.gravity_force_lab.mass2')}</span>
                <span className="font-mono text-orange-400 font-bold">{m2} kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={m2}
                onChange={(e) => setM2(parseFloat(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-orange-500"
              />
            </div>

            {/* Distance Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.gravity_force_lab.distance')}</span>
                <span className="font-mono text-emerald-400 font-bold">{distance.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="10"
                step="0.2"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}