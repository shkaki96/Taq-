import { Flame, Activity, BookmarkCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface StatesOfMatterSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  origX?: number;
  origY?: number;
}

export const StatesOfMatterSim: React.FC<StatesOfMatterSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();
  const [element, setElement] = useState<'neon' | 'argon' | 'water'>('neon');
  const [tempK, setTempK] = useState<number>(27); // default solid Neon (27K)
  const [particles, setParticles] = useState<Particle[]>([]);
  const [logged, setLogged] = useState<boolean>(false);

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
        const ox = 180 + c * 30;
        const oy = 120 + r * 25;
        newParticles.push({
          x: ox,
          y: oy,
          origX: ox,
          origY: oy,
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

          // In solid, particles oscillate near equilibrium crystal lattice positions via moderate restoring force
          if (phase === 'solid') {
            const ox = p.origX ?? p.x;
            const oy = p.origY ?? p.y;
            const fx = (ox - p.x) * 0.08;
            const fy = (oy - p.y) * 0.08;
            nvx = (p.vx + fx) * 0.88 + (Math.random() - 0.5) * speedScale * 0.12;
            nvy = (p.vy + fy) * 0.88 + (Math.random() - 0.5) * speedScale * 0.12;
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

  const handleLog = () => {
    if (onLogMeasurement) {
      const kB = 1.380649e-23;
      const avgEk_J = 1.5 * kB * tempK;
      const avgEk_meV = avgEk_J / 1.602176634e-22;
      const pAtm = parseFloat(pressureAtm);

      onLogMeasurement({
        experiment: 'states_of_matter',
        variableName: 'Internal_Gas_Pressure_P',
        measuredValue: pAtm,
        theoreticalValue: pAtm,
        unit: 'atm',
        parameters: {
          Substance: element.toUpperCase(),
          Temperature_Kelvin: `${tempK} K`,
          Temperature_Celsius: `${(tempK - 273.15).toFixed(1)} °C`,
          Phase_State: phase.toUpperCase(),
          Particle_Count_N: particles.length,
          Calculated_Pressure: `${pAtm.toFixed(2)} atm`,
          Average_Kinetic_Energy_Ek: `${avgEk_meV.toFixed(2)} meV (${avgEk_J.toExponential(3)} J)`,
        },
        equation: 'PV = N·k_B·T | ⟨E_k⟩ = (3/2)·k_B·T | v_rms = √(3k_B·T / m)',
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
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

        {/* Phase buttons & Log Button */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="states-of-matter-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              logged
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20'
            }`}
          >
            {logged ? <BookmarkCheck className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            <span>{logged ? (tI18n('experiments.states_of_matter.logged') || tI18n('common.logged') || 'تم التسجيل ✓') : (tI18n('experiments.states_of_matter.log') || tI18n('common.logMeasurement') || 'تسجيل القياس')}</span>
          </button>
          <button
            onClick={setSolidPreset}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[44px] min-w-[44px] ${
              phase === 'solid' ? 'bg-sky-500/20 border-sky-500 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            🧊 {tI18n('experiments.states_of_matter.solid')}
          </button>
          <button
            onClick={setLiquidPreset}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[44px] min-w-[44px] ${
              phase === 'liquid' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            💧 {tI18n('experiments.states_of_matter.liquid')}
          </button>
          <button
            onClick={setGasPreset}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[44px] min-w-[44px] ${
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