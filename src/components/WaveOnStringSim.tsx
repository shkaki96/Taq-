import { Waves, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface WaveOnStringSimProps {
  lang: Language;
}

export const WaveOnStringSim: React.FC<WaveOnStringSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [amplitude, setAmplitude] = useState<number>(0.75); // cm
  const [frequency, setFrequency] = useState<number>(1.5); // Hz
  const [damping, setDamping] = useState<number>(0.05); // damping
  const [tension, setTension] = useState<'low' | 'med' | 'high'>('med');
  const [endType, setEndType] = useState<'fixed' | 'loose'>('fixed');

  // 60 beads along the string
  const numBeads = 60;
  const [beadPositions, setBeadPositions] = useState<number[]>(new Array(numBeads).fill(0));
  const [beadVelocities, setBeadVelocities] = useState<number[]>(new Array(numBeads).fill(0));
  const [timeStep, setTimeStep] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Wave speed based on tension
  const tensionFactor = tension === 'low' ? 0.8 : tension === 'med' ? 1.4 : 2.2;

  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (isRunning) {
        setTimeStep((t) => t + 0.05);

        setBeadPositions((prevY) => {
          const newY = [...prevY];
          const newV = [...beadVelocities];

          // Drive bead 0 with oscillator
          const oscY = Math.sin(timeStep * frequency * 2 * Math.PI) * amplitude * 50;
          newY[0] = oscY;

          // Wave equation on beads: a_i = (T/mu) * (y_{i+1} - 2y_i + y_{i-1}) - damping * v_i
          for (let i = 1; i < numBeads - 1; i++) {
            const laplacian = newY[i + 1] - 2 * newY[i] + newY[i - 1];
            const accel = laplacian * tensionFactor - damping * newV[i];
            newV[i] += accel * 0.15;
            newY[i] += newV[i] * 0.15;
          }

          // Boundary condition at right end
          if (endType === 'fixed') {
            newY[numBeads - 1] = 0;
          } else {
            // Loose end follows neighbor
            newY[numBeads - 1] = newY[numBeads - 2];
          }

          setBeadVelocities(newV);
          return newY;
        });
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 600, 240);

          // Center axis
          ctx.beginPath();
          ctx.moveTo(30, 120);
          ctx.lineTo(570, 120);
          ctx.strokeStyle = '#334155';
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Connecting line
          ctx.beginPath();
          ctx.moveTo(30, 120 - beadPositions[0]);
          for (let i = 1; i < numBeads; i++) {
            const x = 30 + (i / (numBeads - 1)) * 540;
            const y = 120 - beadPositions[i];
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Beads
          for (let i = 0; i < numBeads; i++) {
            const x = 30 + (i / (numBeads - 1)) * 540;
            const y = 120 - beadPositions[i];

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = i === 0 ? '#f59e0b' : i === numBeads - 1 ? '#ef4444' : '#60a5fa';
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, amplitude, frequency, damping, tensionFactor, endType, timeStep, beadPositions, beadVelocities]);

  const handleReset = () => {
    setBeadPositions(new Array(numBeads).fill(0));
    setBeadVelocities(new Array(numBeads).fill(0));
    setTimeStep(0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/20 border border-sky-500/30 rounded-xl text-sky-400">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.wave_on_a_string.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER E • SIMULATION 23</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'إيقاف مؤقت' : 'تشغيل الاهتزاز'}
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title={tI18n('experiments.wave_on_a_string.reset')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={240}
            className="w-full h-auto max-h-[240px] rounded-xl bg-slate-950"
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-400">{tI18n('experiments.wave_on_a_string.amplitude')}</span>
                <span className="font-mono text-white text-sm">{amplitude.toFixed(2)} cm</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.05"
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-400">{tI18n('experiments.wave_on_a_string.frequency')}</span>
                <span className="font-mono text-white text-sm">{frequency.toFixed(2)} Hz</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.wave_on_a_string.damping')}</span>
                <span className="font-mono text-white text-sm">{(damping * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.2"
                step="0.01"
                value={damping}
                onChange={(e) => setDamping(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block">{tI18n('experiments.wave_on_a_string.tension')}:</span>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(['low', 'med', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setTension(lvl)}
                    className={`p-1.5 rounded-lg border text-center font-medium ${
                      tension === lvl ? 'bg-sky-500/20 border-sky-500 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {tI18n(`experiments.wave_on_a_string.${lvl}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block">{tI18n('experiments.wave_on_a_string.endType')}:</span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => setEndType('fixed')}
                  className={`p-1.5 rounded-lg border text-center font-medium ${
                    endType === 'fixed' ? 'bg-sky-500/20 border-sky-500 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tI18n('experiments.wave_on_a_string.fixedEnd')}
                </button>
                <button
                  onClick={() => setEndType('loose')}
                  className={`p-1.5 rounded-lg border text-center font-medium ${
                    endType === 'loose' ? 'bg-sky-500/20 border-sky-500 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tI18n('experiments.wave_on_a_string.looseEnd')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};