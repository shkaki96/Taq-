import { Shield, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface BuildNucleusSimProps {
  lang: Language;
}

export const BuildNucleusSim: React.FC<BuildNucleusSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [protons, setProtons] = useState<number>(6); // Carbon
  const [neutrons, setNeutrons] = useState<number>(6);

  // Masses in atomic mass units (u)
  const mp = 1.007276;
  const mn = 1.008665;
  const u_to_MeV = 931.494; // 1 u = 931.5 MeV

  const totalConstituentMass = protons * mp + neutrons * mn;
  
  // Semi-empirical mass formula (Weizsäcker formula) for binding energy (MeV)
  const A = protons + neutrons;
  const Z = protons;
  const N = neutrons;

  const a_v = 15.75;
  const a_s = 17.8;
  const a_c = 0.711;
  const a_a = 23.7;
  const delta = (A % 2 !== 0) ? 0 : (Z % 2 === 0 && N % 2 === 0) ? 11.18 / Math.sqrt(A) : -11.18 / Math.sqrt(A);

  let bindingEnergyMeV = 0;
  if (A > 1) {
    bindingEnergyMeV = Math.max(
      0,
      a_v * A - a_s * Math.pow(A, 2 / 3) - a_c * (Z * (Z - 1)) / Math.pow(A, 1 / 3) - a_a * Math.pow(N - Z, 2) / A + delta
    );
  }

  const bePerNucleon = A > 0 ? bindingEnergyMeV / A : 0;
  const massDefect_u = bindingEnergyMeV / u_to_MeV;
  const nuclearMass_u = totalConstituentMass - massDefect_u;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Shield  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.build_nucleus.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 2</p>
          </div>
        </div>

        <button className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw  className="w-3.5 h-3.5"/>
          {tI18n('experiments.build_nucleus.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Graph & Nucleus */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          {/* Binding Energy Curve preview */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-400 font-semibold">{tI18n('experiments.build_nucleus.bePerNucleon')}</span>
              <span className="font-mono text-amber-300 font-bold">{bePerNucleon.toFixed(2)} MeV / nucleon</span>
            </div>
            {/* Progress / Curve Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700 relative">
              <div
                style={{ width: `${Math.min((bePerNucleon / 9.0) * 100, 100)}%` }}
               className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-300"/>
            </div>
            <p className="text-[11px] text-slate-400 italic text-center">{tI18n('experiments.build_nucleus.peakStability')}</p>
          </div>

          {/* Nucleon Cluster Visual */}
          <div className="h-44 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px]">
              {Array.from({ length: protons }).map((_, i) => (
                <div
                  key={`p-${i}`}
                 className="w-4 h-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-full shadow-md text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  +
                </div>
              ))}
              {Array.from({ length: neutrons }).map((_, i) => (
                <div
                  key={`n-${i}`}
                 className="w-4 h-4 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full shadow-md text-[9px] font-bold text-slate-900 flex items-center justify-center">
                  0
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span>{tI18n('experiments.build_nucleus.constituentMass')}:</span>
              <span className="font-mono text-slate-200">{totalConstituentMass.toFixed(5)} u</span>
            </div>
            <div className="flex justify-between text-amber-400 font-semibold">
              <span>{tI18n('experiments.build_nucleus.massDefect')} (Δm):</span>
              <span className="font-mono">{(massDefect_u * 1000).toFixed(3)} × 10⁻³ u</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
              <span>{tI18n('experiments.build_nucleus.nuclearMass')}:</span>
              <span className="font-mono">{nuclearMass_u.toFixed(5)} u</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-red-400">{tI18n('experiments.build_nucleus.protons')} (Z)</span>
                <span className="font-mono text-white text-sm">{protons}</span>
              </div>
              <input
                type="range"
                min="1"
                max="26"
                value={protons}
                onChange={(e) => setProtons(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.build_nucleus.neutrons')} (N)</span>
                <span className="font-mono text-white text-sm">{neutrons}</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={neutrons}
                onChange={(e) => setNeutrons(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>
          </div>

          <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
            <span className="text-xs text-purple-300 font-semibold block">{tI18n('experiments.build_nucleus.bindingEnergy')}</span>
            <div className="text-2xl font-black text-purple-400 font-mono">
              {bindingEnergyMeV.toFixed(2)} <span className="text-sm font-normal text-purple-300">MeV</span>
            </div>
            <p className="text-[11px] text-purple-200/80 leading-relaxed font-mono">
              E = Δm · c² = (Z·m_p + N·m_n - M_nuc) · 931.5 MeV
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};