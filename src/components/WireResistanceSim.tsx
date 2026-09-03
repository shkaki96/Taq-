import { Zap, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface WireResistanceSimProps {
  lang: Language;
}

export const WireResistanceSim: React.FC<WireResistanceSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [resistivity, setResistivity] = useState<number>(0.5); // rho in ohm*cm
  const [length_cm, setLength_cm] = useState<number>(10.0); // L in cm
  const [area_cm2, setArea_cm2] = useState<number>(4.0); // A in cm2

  // Resistance R = rho * L / A (Ohms)
  const resistance = (resistivity * length_cm) / area_cm2;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.resistance_in_wire.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.resistance_in_wire.subtitle')}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setResistivity(0.5);
            setLength_cm(10.0);
            setArea_cm2(4.0);
          }}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {tI18n('experiments.resistance_in_wire.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Wire Stage */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center relative min-h-[320px] overflow-hidden">
          {/* Wire Visual Cylinder */}
          <div className="flex items-center justify-center w-full px-8">
            <div
              style={{
                width: `${Math.min(Math.max((length_cm / 20) * 100, 25), 85)}%`,
                height: `${Math.min(Math.max((area_cm2 / 10) * 120, 20), 120)}px`,
              }}
              className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 rounded-xl border-2 border-amber-400 shadow-2xl relative flex items-center justify-around overflow-hidden transition-all duration-200"
            >
              {/* Impurity particles representing resistivity rho */}
              {Array.from({ length: Math.round(resistivity * 25) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-slate-950/80 border border-slate-700 inline-block m-0.5"
                />
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <span className="text-xs text-slate-400 font-mono block">R = ρ · L / A</span>
            <div className="text-3xl font-black text-amber-400 font-mono mt-1">
              {resistance.toFixed(3)} <span className="text-base font-bold text-amber-300">Ω</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Resistivity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-purple-400">{tI18n('experiments.resistance_in_wire.resistivity')} (ρ)</span>
                <span className="font-mono text-white text-sm">{resistivity.toFixed(2)} Ω·cm</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={resistivity}
                onChange={(e) => setResistivity(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Length */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-400">{tI18n('experiments.resistance_in_wire.length')} (L)</span>
                <span className="font-mono text-white text-sm">{length_cm.toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="20.0"
                step="0.5"
                value={length_cm}
                onChange={(e) => setLength_cm(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-400">{tI18n('experiments.resistance_in_wire.area')} (A)</span>
                <span className="font-mono text-white text-sm">{area_cm2.toFixed(1)} cm²</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={area_cm2}
                onChange={(e) => setArea_cm2(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Material Presets */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 text-xs">
              <button
                onClick={() => setResistivity(0.15)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium"
              >
                {tI18n('experiments.resistance_in_wire.copper')}
              </button>
              <button
                onClick={() => setResistivity(0.6)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium"
              >
                {tI18n('experiments.resistance_in_wire.iron')}
              </button>
              <button
                onClick={() => setResistivity(1.2)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium"
              >
                {tI18n('experiments.resistance_in_wire.nichrome')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};