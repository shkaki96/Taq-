import { Flame } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface StatesOfMatterSimProps {
  lang: Language;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export const StatesOfMatterSim: React.FC<StatesOfMatterSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [element, setElement] = useState<'neon' | 'argon' | 'water'>('neon');
  const [tempK, setTempK] = useState<number>(27); // default solid Neon (27K)
  const [particles, setParticles] = useState<Particle[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Phase classification based on temperature
  // Neon: Melting 24.5K, Boiling 27K
  // Argon: Melting 84K, Boiling 87K
  // Water: Melting 273K, Boiling 373K
  const phase =
    element === 'neon'
      ? tempK < 24 ? 'solid' : tempK < 35 ? 'liquid' : 'gas'
      : element === 'argon'
      ? tempK < 84 ? 'solid' : tempK < 100 ? 'liquid' : 'gas'
      : tempK < 273 ? 'solid' : tempK < 373 ? 'liquid' : 'gas';

  // Pressure P = N * k * T / V (atm)
  const pressureAtm = (particles.length * 0.001 * tempK).toFixed(2);

  // Initialize lattice
  useEffect(() => {
    const newParticles: Particle[] = [];
    const color = element === 'neon' ? '#ef4444' : element === 'argon' ? '#38bdf8' : '#60a5fa';
    const rows = 6;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newParticles.push({
          x: 180 + c * 30,
          y: 120 + r * 25,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color,
        });
      }
    }
    setParticles(newParticles);
  }, [element]);

  // Physics animation loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const speedScale = Math.sqrt(Math.max(tempK, 5)) * 0.25;

      setParticles((prev) =>
        prev.map((p) => {
          let nvx = p.vx + (Math.random() - 0.5) * speedScale * 0.2;
          let nvy = p.vy + (Math.random() - 0.5) * speedScale * 0.2;

          // In solid, particles oscillate near bottom
          if (phase === 'solid') {
            nvx *= 0.85;
            nvy *= 0.85;
          }

          let nx = p.x + nvx;
          let ny = p.y + nvy;

          // Box boundaries (width 500, height 280)
          const minX = 60;
          const maxX = 540;
          const minY = 30;
          const maxY = 250;

          if (nx < minX) {
            nx = minX;
            nvx = -nvx;
          }
          if (nx > maxX) {
            nx = maxX;
            nvx = -nvx;
          }
          if (ny < minY) {
            ny = minY;
            nvy = -nvy;
          }
          if (ny > maxY) {
            ny = maxY;
            nvy = -nvy;
          }

          return { ...p, x: nx, y: ny, vx: nvx, vy: nvy };
        })
      );

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 600, 280);

          // Container Walls
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 3;
          ctx.strokeRect(50, 20, 500, 240);

          // Draw particles
          particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tempK, phase, particles]);

  const setSolidPreset = () => {
    if (element === 'neon') setTempK(15);
    else if (element === 'argon') setTempK(40);
    else setTempK(200);
  };

  const setLiquidPreset = () => {
    if (element === 'neon') setTempK(26);
    else if (element === 'argon') setTempK(90);
    else setTempK(310);
  };

  const setGasPreset = () => {
    if (element === 'neon') setTempK(120);
    else if (element === 'argon') setTempK(220);
    else setTempK(450);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.states_of_matter.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER F • SIMULATION 29</p>
          </div>
        </div>

        {/* Phase buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={setSolidPreset}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              phase === 'solid' ? 'bg-sky-500/20 border-sky-500 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            🧊 {tI18n('experiments.states_of_matter.solid')}
          </button>
          <button
            onClick={setLiquidPreset}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              phase === 'liquid' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            💧 {tI18n('experiments.states_of_matter.liquid')}
          </button>
          <button
            onClick={setGasPreset}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              phase === 'gas' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            💨 {tI18n('experiments.states_of_matter.gas')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={280}
            className="w-full h-auto max-h-[280px] rounded-xl bg-slate-950"
          />

          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800 px-2 font-mono">
            <span className="text-amber-400">
              {tI18n('experiments.states_of_matter.temperature')}: {tempK} K ({(tempK - 273.15).toFixed(1)} °C)
            </span>
            <span className="text-sky-400">
              {tI18n('experiments.states_of_matter.pressure')}: {pressureAtm} atm
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">{tI18n('experiments.states_of_matter.substance')}</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => {
                    setElement('neon');
                    setTempK(27);
                  }}
                  className={`p-2 rounded-lg border text-center font-medium ${
                    element === 'neon' ? 'bg-red-500/20 border-red-500 text-red-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tI18n('experiments.states_of_matter.neon')}
                </button>
                <button
                  onClick={() => {
                    setElement('argon');
                    setTempK(85);
                  }}
                  className={`p-2 rounded-lg border text-center font-medium ${
                    element === 'argon' ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tI18n('experiments.states_of_matter.argon')}
                </button>
                <button
                  onClick={() => {
                    setElement('water');
                    setTempK(300);
                  }}
                  className={`p-2 rounded-lg border text-center font-medium ${
                    element === 'water' ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tI18n('experiments.states_of_matter.water')}
                </button>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-400">{tI18n('experiments.states_of_matter.temperature')}</span>
                <span className="font-mono text-white text-sm">{tempK} K</span>
              </div>
              <input
                type="range"
                min="5"
                max="600"
                step="5"
                value={tempK}
                onChange={(e) => setTempK(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Heat / Cool Quick Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setTempK((prev) => Math.min(prev + 40, 600))}
                className="p-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition-colors"
              >
                {tI18n('experiments.states_of_matter.heat')}
              </button>
              <button
                onClick={() => setTempK((prev) => Math.max(prev - 40, 5))}
                className="p-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold transition-colors"
              >
                {tI18n('experiments.states_of_matter.cool')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};