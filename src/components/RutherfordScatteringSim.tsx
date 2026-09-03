import { Target, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface RutherfordScatteringSimProps {
  lang: Language;
}

interface AlphaParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  deflected: boolean;
  color: string;
}

export const RutherfordScatteringSim: React.FC<RutherfordScatteringSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [energyMeV, setEnergyMeV] = useState<number>(5.0); // Alpha energy 5 MeV
  const [targetZ, setTargetZ] = useState<number>(79); // Gold (Au Z=79)
  const [impactParameter, setImpactParameter] = useState<number>(15); // b in arbitrary units
  const [particles, setParticles] = useState<AlphaParticle[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Constants for simulation scaling
  const nucleusPos = { x: 300, y: 150 };

  useEffect(() => {
    let animId: number;
    let spawnTimer = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    const loop = () => {
      if (isRunning) {
        spawnTimer++;
        if (spawnTimer % 18 === 0) {
          // Spawn new alpha particle with random offset around impactParameter
          const randomOffset = (Math.random() - 0.5) * 50 + impactParameter;
          const speed = Math.sqrt(energyMeV) * 2.2;
          setParticles((prev) => [
            ...prev.slice(-40),
            {
              x: 20,
              y: nucleusPos.y - randomOffset,
              vx: speed,
              vy: 0,
              trail: [],
              deflected: false,
              color: `hsl(${Math.random() * 40 + 30}, 100%, 65%)`,
            },
          ]);
        }

        // Update particle physics
        setParticles((prev) =>
          prev
            .map((p) => {
              const dx = p.x - nucleusPos.x;
              const dy = p.y - nucleusPos.y;
              const distSq = Math.max(dx * dx + dy * dy, 25);
              const dist = Math.sqrt(distSq);

              // Coulomb force magnitude: F ∝ Z / r^2
              const force = (targetZ * 40) / distSq;
              const ax = (dx / dist) * force;
              const ay = (dy / dist) * force;

              const nvx = p.vx + ax * 0.15;
              const nvy = p.vy + ay * 0.15;

              return {
                ...p,
                x: p.x + nvx,
                y: p.y + nvy,
                vx: nvx,
                vy: nvy,
                trail: [...p.trail.slice(-25), { x: p.x, y: p.y }],
              };
            })
            .filter((p) => p.x >= 0 && p.x <= 600 && p.y >= 0 && p.y <= 300)
        );
      }

      // Render
      ctx.clearRect(0, 0, 600, 300);

      // Draw Gold Foil Atom / Nucleus
      ctx.beginPath();
      ctx.arc(nucleusPos.x, nucleusPos.y, 45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(234, 179, 8, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
      ctx.stroke();

      // Dense positive nucleus in center
      ctx.beginPath();
      ctx.arc(nucleusPos.x, nucleusPos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Nucleus label
      ctx.fillStyle = '#fde68a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`+${targetZ}e ${tI18n('experiments.rutherford_scattering.nucleusLabel')}`, nucleusPos.x, nucleusPos.y + 22);

      // Render particles & trails
      particles.forEach((p) => {
        // Trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          p.trail.forEach((pt) => ctx.lineTo(pt.x, pt.y));
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Particle head
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, energyMeV, targetZ, impactParameter, particles]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.rutherford_scattering.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 3</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? tI18n('experiments.rutherford_scattering.pause') : tI18n('experiments.rutherford_scattering.play')}
          </button>
          <button
            onClick={() => setParticles([])}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title={tI18n('experiments.rutherford_scattering.reset')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Display */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="w-full h-auto max-h-[340px] rounded-xl bg-slate-950"
          />
          <div className="w-full flex justify-between items-center text-[11px] text-slate-400 px-3 pt-2 font-mono border-t border-slate-800 mt-2">
            <span>{tI18n('experiments.rutherford_scattering.alphaBeamSource')}</span>
            <span className="text-amber-400">{tI18n('experiments.rutherford_scattering.deflectionObservation')}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-amber-400 block">{tI18n('experiments.rutherford_scattering.targetElement')}</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => setTargetZ(79)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    targetZ === 79
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tI18n('experiments.rutherford_scattering.gold')}
                </button>
                <button
                  onClick={() => setTargetZ(47)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    targetZ === 47
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tI18n('experiments.rutherford_scattering.silver')}
                </button>
                <button
                  onClick={() => setTargetZ(13)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    targetZ === 13
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tI18n('experiments.rutherford_scattering.aluminum')}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.rutherford_scattering.alphaEnergy')}</span>
                <span className="font-mono text-amber-300">{energyMeV.toFixed(1)} MeV</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={energyMeV}
                onChange={(e) => setEnergyMeV(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.rutherford_scattering.impactParameter')} (b)</span>
                <span className="font-mono text-amber-300">{impactParameter}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={impactParameter}
                onChange={(e) => setImpactParameter(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 font-mono space-y-1">
            <span className="font-bold text-amber-300 block">Coulomb Deflection Formula:</span>
            <p>F_e = k_e · (2e · Z e) / r²</p>
            <p>cot(θ / 2) = (4πε₀ E_k / Z e²) · b</p>
          </div>
        </div>
      </div>
    </div>
  );
};