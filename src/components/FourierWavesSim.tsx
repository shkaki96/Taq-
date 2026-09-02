import { Waves, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface FourierWavesSimProps {
  lang: Language;
}

export const FourierWavesSim: React.FC<FourierWavesSimProps> = ({ lang }) => {
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

  const t = {
    ar: {
      title: 'متسلسلة فورييه وتركيب الموجات (f(x) = Σ Aₙ sin(nωt))',
      fundamental: 'التردد الأساسي (Fundamental Harmonic n=1)',
      harmonicsHeader: 'سعة التوافقيات الفردية والزوجية (Harmonics A₁ - A₈)',
      presets: 'أشكال الموجات القياسية (Fourier Presets):',
      square: 'موجة مربعة (Square Wave)',
      sawtooth: 'موجة سن المنشار (Sawtooth)',
      triangle: 'موجة مثلثية (Triangle)',
      sine: 'جيبية نقية (Pure Sine)',
      reset: 'إعادة ضبط (مربعة)',
    },
    en: {
      title: 'Fourier: Making Waves Lab (f(x) = Σ Aₙ sin(nωt))',
      fundamental: 'Fundamental Harmonic (n=1)',
      harmonicsHeader: 'Harmonic Amplitudes (A₁ - A₈)',
      presets: 'Waveform Presets:',
      square: 'Square Wave',
      sawtooth: 'Sawtooth Wave',
      triangle: 'Triangle Wave',
      sine: 'Pure Sine',
      reset: 'Reset (Square)',
    },
    ku: {
      title: 'زنجیرەی فۆریە و دروستکردنی شەپۆل',
      fundamental: 'فریکوێنسی بنەڕەتی (n=1)',
      harmonicsHeader: 'فراوانیی فریکوێنسییەکان (A₁ - A₈)',
      presets: 'شێوە شەپۆلە بنەڕەتییەکان:',
      square: 'شەپۆلی چوارگۆشە',
      sawtooth: 'شەپۆلی ددانی مشار',
      triangle: 'شەپۆلی سێگۆشە',
      sine: 'شەپۆلی ساین',
      reset: 'ڕێکخستنەوە',
    },
    kmr: {
      title: 'Rêzeya Fourier û Çêkirina Pêlan',
      fundamental: 'Frekansa Bingehîn (n=1)',
      harmonicsHeader: 'Firehiya Harmonîkan (A₁ - A₈)',
      presets: 'Pêşsaziyên Pêlan:',
      square: 'Pêla Çargoşe',
      sawtooth: 'Pêla Diranê Mişarê',
      triangle: 'Pêla Sêgoşe',
      sine: 'Pêla Sine ya Paqij',
      reset: 'Nûkirin',
    },
  }[lang];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Waves  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{t.title}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER E • SIMULATION 21</p>
          </div>
        </div>

        <button
          onClick={setSquareWave}
         className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5">
          <RotateCcw  className="w-3.5 h-3.5"/>
          {t.reset}
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
            <span className="text-xs font-semibold text-slate-400 block mb-2">{t.presets}</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                onClick={setSquareWave}
               className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium">
                ⬛ {t.square}
              </button>
              <button
                onClick={setSawtoothWave}
               className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium">
                📐 {t.sawtooth}
              </button>
              <button
                onClick={setTriangleWave}
               className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium">
                🔺 {t.triangle}
              </button>
              <button
                onClick={setPureSine}
               className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium">
                〰️ {t.sine}
              </button>
            </div>
          </div>
        </div>

        {/* Harmonics Sliders */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-sky-400 block">{t.harmonicsHeader}</span>
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