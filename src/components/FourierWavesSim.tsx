import { Waves, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface FourierWavesSimProps {
  lang: Language;
}

export const FourierWavesSim: React.FC<FourierWavesSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  // Amplitudes for harmonics n = 1 to 8
  const [harmonics, setHarmonics] = useState<number[]>([1.0, 0.0, 0.33, 0.0, 0.2, 0.0, 0.14, 0.0]); // default square wave approx
  const [fundamentalFreq, setFundamentalFreq] = useState<number>(1.0);

  // Set Presets
  const setSquareWave = () => {
    // 1/n for odd n, 0 for even
    setHarmonics([1.0, 0.0, 1 / 3, 0.0, 1 / 5, 0.0, 1 / 7, 0.0]);
  };

  const setSawtoothWave = () => {
    // 1/n for all n
    setHarmonics([1.0, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8]);
  };

  const setTriangleWave = () => {
    // (-1)^((n-1)/2) / n^2 for odd n
    setHarmonics([1.0, 0.0, -1 / 9, 0.0, 1 / 25, 0.0, -1 / 49, 0.0]);
  };

  const setPureSine = () => {
    setHarmonics([1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
  };

  // Generate waveform points
  const points: { x: number; y: number }[] = [];
  const numPoints = 120;
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * Math.PI * 4; // 2 full cycles
    let ySum = 0;
    harmonics.forEach((amp, idx) => {
      const n = idx + 1;
      ySum += amp * Math.sin(n * x);
    });
    points.push({ x: (i / numPoints) * 520 + 30, y: 130 - ySum * 55 });
  }

  const pathD = points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Waves  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.fourier_making_waves.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER E • SIMULATION 21</p>
          </div>
        </div>

        <button
          onClick={setSquareWave}
         className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5">
          <RotateCcw  className="w-3.5 h-3.5"/>
          {tI18n('experiments.fourier_making_waves.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wave Display SVG */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="w-full h-[240px]">
            <svg viewBox="0 0 580 260" className="w-full h-full">
              {/* Center Axis */}
              <line x1="30" y1="130" x2="550" y2="130" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Synthesized Wave */}
              <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="3" />
            </svg>
          </div>

          {/* Presets buttons */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-2">{tI18n('experiments.fourier_making_waves.presets')}</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                onClick={setSquareWave}
               className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium">
                ⬛ {tI18n('experiments.fourier_making_waves.square')}
              </button>
              <button
                onClick={setSawtoothWave}
               className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium">
                📐 {tI18n('experiments.fourier_making_waves.sawtooth')}
              </button>
              <button
                onClick={setTriangleWave}
               className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium">
                🔺 {tI18n('experiments.fourier_making_waves.triangle')}
              </button>
              <button
                onClick={setPureSine}
               className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium">
                〰️ {tI18n('experiments.fourier_making_waves.sine')}
              </button>
            </div>
          </div>
        </div>

        {/* Harmonics Sliders */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-sky-400 block">{tI18n('experiments.fourier_making_waves.harmonicsHeader')}</span>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {harmonics.map((amp, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-10 font-mono text-slate-400">n={idx + 1}:</span>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.05"
                    value={amp}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setHarmonics((prev) => {
                        const copy = [...prev];
                        copy[idx] = val;
                        return copy;
                      });
                    }}
                    className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <span className="w-10 font-mono text-right text-slate-200">{amp.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};