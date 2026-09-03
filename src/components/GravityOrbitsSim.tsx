import { Orbit, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface GravityOrbitsSimProps {
  lang: Language;
}

export const GravityOrbitsSim: React.FC<GravityOrbitsSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [starMass, setStarMass] = useState<number>(1.0); // solar masses
  const [planetMass, setPlanetMass] = useState<number>(1.0); // earth masses
  const [gravityOn, setGravityOn] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);

  // Position & Velocity of planet in simulation units
  const [planetPos, setPlanetPos] = useState<{ x: number; y: number }>({ x: 300, y: 80 });
  const [planetVel, setPlanetVel] = useState<{ vx: number; vy: number }>({ vx: 2.3, vy: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  const starPos = { x: 300, y: 175 };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (isRunning) {
        setPlanetPos((pos) => {
          const dx = starPos.x - pos.x;
          const dy = starPos.y - pos.y;
          const r2 = Math.max(dx * dx + dy * dy, 400);
          const r = Math.sqrt(r2);

          let ax = 0;
          let ay = 0;
          if (gravityOn) {
            // F = G M m / r^2 -> a = G M / r^2
            const G = 1500;
            const a = (G * starMass) / r2;
            ax = a * (dx / r);
            ay = a * (dy / r);
          }

          const nvx = planetVel.vx + ax * 0.1;
          const nvy = planetVel.vy + ay * 0.1;
          setPlanetVel({ vx: nvx, vy: nvy });

          const nx = pos.x + nvx * 0.8;
          const ny = pos.y + nvy * 0.8;

          setTrail((t) => [...t.slice(-120), { x: nx, y: ny }]);
          return { x: nx, y: ny };
        });
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 600, 350);

          // Orbit Trail
          if (trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            trail.forEach((pt) => ctx.lineTo(pt.x, pt.y));
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Star in center
          ctx.beginPath();
          ctx.arc(starPos.x, starPos.y, 16 * starMass, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Planet
          ctx.beginPath();
          ctx.arc(planetPos.x, planetPos.y, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Gravity & Velocity vectors
          if (showVectors && gravityOn) {
            const dx = starPos.x - planetPos.x;
            const dy = starPos.y - planetPos.y;
            const r = Math.sqrt(dx * dx + dy * dy);

            // Gravity force vector (blue)
            ctx.beginPath();
            ctx.moveTo(planetPos.x, planetPos.y);
            ctx.lineTo(planetPos.x + (dx / r) * 35, planetPos.y + (dy / r) * 35);
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Velocity vector (green)
            ctx.beginPath();
            ctx.moveTo(planetPos.x, planetPos.y);
            ctx.lineTo(planetPos.x + planetVel.vx * 12, planetPos.y + planetVel.vy * 12);
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, starMass, gravityOn, planetVel, planetPos, showVectors, trail]);

  const handleReset = () => {
    setPlanetPos({ x: 300, y: 80 });
    setPlanetVel({ vx: 2.3, vy: 0 });
    setTrail([]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Orbit  className="w-6 h-6 animate-spin-slow"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.gravity_and_orbits.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER C • SIMULATION 15</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors"
          >
            {isRunning ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
            {isRunning ? tI18n('experiments.gravity_and_orbits.pause') : tI18n('experiments.gravity_and_orbits.play')}
          </button>
          <button
            onClick={handleReset}
            title={tI18n('experiments.gravity_and_orbits.reset')}
           className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700">
            <RotateCcw  className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Display */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={350}
           className="w-full h-auto max-h-[350px] rounded-xl bg-slate-950"/>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-400">{tI18n('experiments.gravity_and_orbits.starMass')}</span>
                <span className="font-mono text-white text-sm">{starMass.toFixed(1)} M☉</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={starMass}
                onChange={(e) => setStarMass(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300">{tI18n('experiments.gravity_and_orbits.gravityToggle')}</span>
              <button
                onClick={() => setGravityOn(!gravityOn)}
                className={`min-h-[44px] min-w-[44px] px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  gravityOn ? 'bg-emerald-600 text-white' : 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                }`}
              >
                {gravityOn ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-300">{tI18n('experiments.gravity_and_orbits.showVectors')}</span>
              <button
                onClick={() => setShowVectors(!showVectors)}
                className={`min-h-[44px] min-w-[44px] px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  showVectors ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showVectors ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};