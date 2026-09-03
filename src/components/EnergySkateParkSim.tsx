import { Activity, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface EnergySkateParkSimProps {
  lang: Language;
}

export const EnergySkateParkSim: React.FC<EnergySkateParkSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [mass, setMass] = useState<number>(60); // kg
  const [gravity, setGravity] = useState<number>(9.8); // m/s^2
  const [friction, setFriction] = useState<number>(0.02); // friction coefficient

  // Skater position on parabolic ramp y = a * x^2 (-1 to 1)
  const [posNorm, setPosNorm] = useState<number>(-0.9);
  const [velNorm, setVelNorm] = useState<number>(0);
  const [thermalE, setThermalE] = useState<number>(0);

  // Derived energies
  // Height h = y = posNorm^2 * 6.0 meters
  const height_m = posNorm * posNorm * 6.0;
  const potentialE = mass * gravity * height_m; // Joules
  // Velocity in m/s = velNorm * 10
  const speed_m_s = Math.abs(velNorm * 10);
  const kineticE = 0.5 * mass * speed_m_s * speed_m_s;
  const totalE = kineticE + potentialE + thermalE;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (isRunning) {
        setPosNorm((x) => {
          // Tangential acceleration on parabola: a_t = - g * (dy/dx) / sqrt(1 + (dy/dx)^2)
          // dy/dx = 2 * k * x
          const slope = 2 * 0.8 * x;
          const accel = -gravity * (slope / Math.sqrt(1 + slope * slope)) * 0.008;

          // Friction force
          const f_loss = friction * velNorm * 0.05;

          const nVel = velNorm + accel - f_loss;
          setVelNorm(nVel);

          // Accumulate thermal energy
          if (friction > 0 && Math.abs(velNorm) > 0.01) {
            setThermalE((th) => th + Math.abs(f_loss) * mass * 3.5);
          }

          const nx = x + nVel * 0.03;
          if (nx > 0.95) {
            setVelNorm(-Math.abs(nVel) * 0.9);
            return 0.95;
          }
          if (nx < -0.95) {
            setVelNorm(Math.abs(nVel) * 0.9);
            return -0.95;
          }
          return nx;
        });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 600, 300);

          // Draw U-Ramp Parabola
          ctx.beginPath();
          ctx.moveTo(50, 60);
          for (let px = 50; px <= 550; px += 5) {
            const u = (px - 300) / 250; // -1 to 1
            const py = 250 - (1 - u * u) * 190;
            ctx.lineTo(px, py);
          }
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Skater position on screen
          const screenX = 300 + posNorm * 250;
          const screenY = 250 - (1 - posNorm * posNorm) * 190;

          // Skater body
          ctx.beginPath();
          ctx.arc(screenX, screenY - 14, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();

          // Skateboard
          ctx.beginPath();
          ctx.moveTo(screenX - 12, screenY);
          ctx.lineTo(screenX + 12, screenY);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, gravity, friction, velNorm, mass, posNorm]);

  const handleReset = () => {
    setPosNorm(-0.9);
    setVelNorm(0);
    setThermalE(0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
            <Activity  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.energy_skate_park.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER D • SIMULATION 19</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors"
          >
            {isRunning ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
            {isRunning ? tI18n('experiments.energy_skate_park.pause') : tI18n('experiments.energy_skate_park.play')}
          </button>
          <button
            onClick={handleReset}
            title={tI18n('experiments.energy_skate_park.reset')}
           className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700">
            <RotateCcw  className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas & Energy Bar Chart */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={260}
           className="w-full h-auto max-h-[260px] rounded-xl bg-slate-950"/>

          {/* Energy Bar Chart Bars */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-emerald-400 font-semibold block">{tI18n('experiments.energy_skate_park.kinetic')}</span>
              <span className="font-mono text-emerald-300 font-bold">{kineticE.toFixed(0)} J</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-sky-400 font-semibold block">{tI18n('experiments.energy_skate_park.potential')}</span>
              <span className="font-mono text-sky-300 font-bold">{potentialE.toFixed(0)} J</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-rose-400 font-semibold block">{tI18n('experiments.energy_skate_park.thermal')}</span>
              <span className="font-mono text-rose-300 font-bold">{thermalE.toFixed(0)} J</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-amber-400 font-semibold block">{tI18n('experiments.energy_skate_park.totalEnergy')}</span>
              <span className="font-mono text-amber-300 font-bold">{totalE.toFixed(0)} J</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.energy_skate_park.mass')} (m)</span>
                <span className="font-mono text-white text-sm">{mass} kg</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.energy_skate_park.gravity')} (g)</span>
                <span className="font-mono text-white text-sm">{gravity.toFixed(1)} m/s²</span>
              </div>
              <input
                type="range"
                min="1.6"
                max="24.8"
                step="0.5"
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.energy_skate_park.friction')}</span>
                <span className="font-mono text-white text-sm">{(friction * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.08"
                step="0.01"
                value={friction}
                onChange={(e) => setFriction(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};