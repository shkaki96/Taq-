import { Compass, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface KeplerLawsSimProps {
  lang: Language;
}

export const KeplerLawsSim: React.FC<KeplerLawsSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [eccentricity, setEccentricity] = useState<number>(0.6); // 0 to 0.8
  const [semiMajorAxis, setSemiMajorAxis] = useState<number>(180); // pixels
  const [showSweptArea, setShowSweptArea] = useState<boolean>(true);
  const [orbitalAngle, setOrbitalAngle] = useState<number>(0); // true anomaly theta

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Focus offset c = a * e
  const c = semiMajorAxis * eccentricity;
  const centerPos = { x: 300, y: 160 };
  const sunPos = { x: centerPos.x - c, y: centerPos.y };

  // Kepler's 3rd Law Period: T = 2 * pi * sqrt(a^3 / GM)
  const T_period_years = Math.pow(semiMajorAxis / 120, 1.5);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (isRunning) {
        setOrbitalAngle((theta) => {
          // Angular velocity from conservation of angular momentum: dtheta/dt = h / r^2
          // r(theta) = a(1 - e^2) / (1 + e cos(theta))
          const r = (semiMajorAxis * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(theta));
          const dTheta = (450 / (r * r)) * 1.5;
          return (theta + dTheta) % (Math.PI * 2);
        });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          ctx.clearRect(0, 0, 600, 320);

          const a = semiMajorAxis;
          const b = a * Math.sqrt(Math.max(1 - eccentricity * eccentricity, 0.05));
          const curC = a * eccentricity;
          const curSun = { x: centerPos.x - curC, y: centerPos.y };

          // Draw Ellipse Orbit
          ctx.beginPath();
          ctx.ellipse(centerPos.x, centerPos.y, a, b, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Calculate current planet position (r, theta) relative to Sun
          const curR = (a * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(orbitalAngle));
          const planetX = curSun.x + curR * Math.cos(orbitalAngle);
          const planetY = curSun.y + curR * Math.sin(orbitalAngle);

          // Draw Swept Sector Area (Kepler 2nd law)
          if (showSweptArea) {
            ctx.beginPath();
            ctx.moveTo(curSun.x, curSun.y);
            const delta = 0.35;
            for (let t = orbitalAngle - delta; t <= orbitalAngle; t += 0.05) {
              const r_t = (a * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(t));
              const px = curSun.x + r_t * Math.cos(t);
              const py = curSun.y + r_t * Math.sin(t);
              ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.fill();
          }

          // Line from Sun to Planet
          ctx.beginPath();
          ctx.moveTo(curSun.x, curSun.y);
          ctx.lineTo(planetX, planetY);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Sun Focus
          ctx.beginPath();
          ctx.arc(curSun.x, curSun.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Planet
          ctx.beginPath();
          ctx.arc(planetX, planetY, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Perihelion and Aphelion Markers
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText('Perihelion (Fastest)', curSun.x + (a * (1 - eccentricity)) - 40, curSun.y - 12);
          ctx.fillText('Aphelion (Slowest)', curSun.x - (a * (1 + eccentricity)) - 10, curSun.y - 12);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, eccentricity, semiMajorAxis, orbitalAngle, showSweptArea]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Compass  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.keplers_laws.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER C • SIMULATION 16</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors"
          >
            {isRunning ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
            {isRunning ? tI18n('experiments.keplers_laws.pause') : tI18n('experiments.keplers_laws.play')}
          </button>
          <button
            onClick={() => {
              setEccentricity(0.6);
              setSemiMajorAxis(180);
              setOrbitalAngle(0);
            }}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title={tI18n('experiments.keplers_laws.reset')}
          >
            <RotateCcw  className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={320}
           className="w-full h-auto max-h-[320px] rounded-xl bg-slate-950"/>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-400">{tI18n('experiments.keplers_laws.eccentricity')} (e)</span>
                <span className="font-mono text-white text-sm">{eccentricity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.75"
                step="0.05"
                value={eccentricity}
                onChange={(e) => setEccentricity(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.keplers_laws.semiMajor')} (a)</span>
                <span className="font-mono text-white text-sm">{semiMajorAxis} px</span>
              </div>
              <input
                type="range"
                min="100"
                max="220"
                step="10"
                value={semiMajorAxis}
                onChange={(e) => setSemiMajorAxis(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1 text-xs">
              <span className="text-emerald-300 font-semibold block">{tI18n('experiments.keplers_laws.orbitalPeriod')} (Kepler 3rd):</span>
              <span className="text-base font-bold text-amber-300 font-mono">
                {T_period_years.toFixed(2)} yr
              </span>
              <p className="text-[11px] text-slate-400 font-mono">T² ∝ a³</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};