import { Sun, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface BlackbodySimProps {
  lang: Language;
}

export const BlackbodySim: React.FC<BlackbodySimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [temperatureK, setTemperatureK] = useState<number>(5800); // 5800 K (Sun surface)

  // Wien's Displacement Law: lambda_max * T = 2.898 * 10^-3 m*K
  // In micrometers (um): lambda_max = 2898 / T
  const lambdaMax_um = 2898 / temperatureK;
  const lambdaMax_nm = lambdaMax_um * 1000;

  // Stefan-Boltzmann Law: Total Power P = sigma * T^4 (normalized intensity)
  const sigma = 5.67e-8;
  const intensity_MW_m2 = (sigma * Math.pow(temperatureK, 4)) / 1e6;

  // Generate spectral curve points (Planck law relative curve)
  const curvePoints: { x: number; y: number }[] = [];
  const maxLambda = 3.0; // 0 to 3.0 um
  for (let l = 0.05; l <= maxLambda; l += 0.05) {
    // Relative Planck distribution: u(lambda) ∝ 1 / (lambda^5 * (exp(hc/lambda kT) - 1))
    const xRatio = (lambdaMax_um / l);
    // Normalized peak = 1.0 when l = lambdaMax_um
    const u = (Math.pow(xRatio, 5) / (Math.exp(4.965 * xRatio) - 1)) * 142;
    curvePoints.push({
      x: (l / maxLambda) * 100,
      y: Math.min(Math.max(u * 100, 0), 100),
    });
  }

  // SVG path generator
  const pathD = curvePoints.reduce((acc, pt, idx) => {
    const x = (pt.x / 100) * 500 + 40;
    const y = 220 - (pt.y / 100) * 180;
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
            <Sun  className="w-6 h-6 animate-pulse"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.blackbody_spectrum.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 5</p>
          </div>
        </div>

        <button className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw  className="w-3.5 h-3.5"/>
          {tI18n('experiments.blackbody_spectrum.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spectrum Graph SVG */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="relative w-full h-[260px]">
            <svg viewBox="0 0 580 250" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="40" y1="220" x2="560" y2="220" stroke="#334155" strokeWidth="1.5" />
              <line x1="40" y1="30" x2="40" y2="220" stroke="#334155" strokeWidth="1.5" />

              {/* Spectral bands (UV, Visible, IR) */}
              {/* UV: 0 to 0.38 um -> x: 40 to 40 + (0.38/3)*500 = 103 */}
              <rect x="40" y="30" width="63" height="190" fill="rgba(168, 85, 247, 0.15)" />
              <text x="70" y="50" fill="#c084fc" fontSize="10" textAnchor="middle">{tI18n('experiments.blackbody_spectrum.uv')}</text>

              {/* Visible: 0.38 to 0.75 um -> x: 103 to 103 + (0.37/3)*500 = 165 */}
              <rect x="103" y="30" width="62" height="190" fill="url(#rainbowGrad)" opacity="0.35" />
              <text x="134" y="50" fill="#fde047" fontSize="10" textAnchor="middle">{tI18n('experiments.blackbody_spectrum.visible')}</text>

              {/* IR: 0.75 to 3.0 um -> x: 165 to 560 */}
              <rect x="165" y="30" width="395" height="190" fill="rgba(239, 68, 68, 0.1)" />
              <text x="350" y="50" fill="#f87171" fontSize="10" textAnchor="middle">{tI18n('experiments.blackbody_spectrum.ir')}</text>

              {/* Rainbow Gradient Definition */}
              <defs>
                <linearGradient id="rainbowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="25%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="75%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Planck Curve */}
              <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="3" />

              {/* Peak Indicator */}
              {lambdaMax_um <= maxLambda && (
                <g>
                  <line
                    x1={(lambdaMax_um / maxLambda) * 500 + 40}
                    y1="30"
                    x2={(lambdaMax_um / maxLambda) * 500 + 40}
                    y2="220"
                    stroke="#38bdf8"
                    strokeDasharray="4 3"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={(lambdaMax_um / maxLambda) * 500 + 40}
                    cy="40"
                    r="4"
                    fill="#38bdf8"
                  />
                </g>
              )}

              {/* Wavelength Axis Labels */}
              <text x="40" y="240" fill="#64748b" fontSize="10">0 μm</text>
              <text x="206" y="240" fill="#64748b" fontSize="10">1.0 μm</text>
              <text x="373" y="240" fill="#64748b" fontSize="10">2.0 μm</text>
              <text x="540" y="240" fill="#64748b" fontSize="10">3.0 μm</text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
            <span className="text-amber-400 font-mono font-semibold">
              {tI18n('experiments.blackbody_spectrum.peakWavelength')}: {lambdaMax_nm.toFixed(0)} nm ({lambdaMax_um.toFixed(2)} μm)
            </span>
            <span className="text-purple-400 font-mono">
              {tI18n('experiments.blackbody_spectrum.totalIntensity')}: {intensity_MW_m2.toFixed(2)} MW/m²
            </span>
          </div>
        </div>

        {/* Controls & Presets */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-400">{tI18n('experiments.blackbody_spectrum.temperature')} (T)</span>
                <span className="font-mono text-white text-base font-bold">{temperatureK} K</span>
              </div>
              <input
                type="range"
                min="300"
                max="10000"
                step="50"
                value={temperatureK}
                onChange={(e) => setTemperatureK(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Presets */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-slate-400 block">نماذج معيارية (Presets):</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    temperatureK === 9940 ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  ⭐ {tI18n('experiments.blackbody_spectrum.sirius')}
                </button>
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    temperatureK === 5800 ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  ☀️ {tI18n('experiments.blackbody_spectrum.sun')}
                </button>
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    temperatureK === 3000 ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  💡 {tI18n('experiments.blackbody_spectrum.bulb')}
                </button>
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    temperatureK === 300 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  🌍 {tI18n('experiments.blackbody_spectrum.earth')}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 font-mono space-y-1">
            <span className="font-bold text-amber-300 block">Wien\'s Displacement Law:</span>
            <p>λ_max · T = 2.898 × 10⁻³ m·K</p>
            <p>I_total = σ · T⁴ (Stefan-Boltzmann)</p>
          </div>
        </div>
      </div>
    </div>
  );
};