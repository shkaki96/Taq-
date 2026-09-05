import { Sparkles, Pause, Play, RotateCcw, Activity, BookmarkCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface DiffusionSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

interface GasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'light' | 'heavy';
}

export const DiffusionSim: React.FC<DiffusionSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();
  const [barrierOpen, setBarrierOpen] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [temperature, setTemperature] = useState<number>(300); // Kelvin
  const particlesRef = useRef<GasParticle[]>([]);
  const [counts, setCounts] = useState({ leftLight: 30, rightLight: 0, leftHeavy: 0, rightHeavy: 30 });
  const [resetKey, setResetKey] = useState<number>(0);
  const [logged, setLogged] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize: Light (blue) in left side, Heavy (red) in right side
  const initChamber = () => {
    const newParticles: GasParticle[] = [];
    // 30 Light particles (He, mass 4) on left
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        x: 60 + Math.random() * 200,
        y: 40 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        type: 'light',
      });
    }
    // 30 Heavy particles (Xe, mass 131) on right
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        x: 340 + Math.random() * 200,
        y: 40 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        type: 'heavy',
      });
    }
    particlesRef.current = newParticles;
    setCounts({ leftLight: 30, rightLight: 0, leftHeavy: 0, rightHeavy: 30 });
    setResetKey((k) => k + 1);
  };

  useEffect(() => {
    initChamber();
  }, []);

  const drawDiffusion = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 600, 280);

    // Container border
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 30, 500, 220);

    // Divider Barrier
    if (!barrierOpen) {
      ctx.beginPath();
      ctx.moveTo(300, 30);
      ctx.lineTo(300, 250);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      // Open barrier indicator
      ctx.beginPath();
      ctx.moveTo(300, 30);
      ctx.lineTo(300, 70);
      ctx.moveTo(300, 210);
      ctx.lineTo(300, 250);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Draw particles
    particlesRef.current.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.type === 'light' ? 4.5 : 7.5, 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'light' ? '#38bdf8' : '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    drawDiffusion(ctx);

    if (!isRunning) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const stepFactor = dt / 0.016;

      const speedScale = Math.sqrt(temperature / 300);

      const minX = 50;
      const maxX = 550;
      const minY = 30;
      const maxY = 250;
      const barrierX = 300;

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const massFactor = p.type === 'light' ? 1.8 : 0.7;
        const vx = p.vx * speedScale * massFactor * stepFactor;
        const vy = p.vy * speedScale * massFactor * stepFactor;

        let nx = p.x + vx;
        let ny = p.y + vy;
        let nvx = p.vx;
        let nvy = p.vy;

        // Outer walls
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

        // Barrier in middle (if closed)
        if (!barrierOpen) {
          if (p.x < barrierX && nx >= barrierX) {
            nx = barrierX - 2;
            nvx = -nvx;
          } else if (p.x > barrierX && nx <= barrierX) {
            nx = barrierX + 2;
            nvx = -nvx;
          }
        }

        p.x = nx;
        p.y = ny;
        p.vx = nvx;
        p.vy = nvy;
      }

      drawDiffusion(ctx);

      // Periodically update chamber counts
      frameCount++;
      if (frameCount % 10 === 0) {
        let ll = 0, rl = 0, lh = 0, rh = 0;
        for (const p of particles) {
          if (p.type === 'light') {
            if (p.x < 300) ll++; else rl++;
          } else {
            if (p.x < 300) lh++; else rh++;
          }
        }
        setCounts({ leftLight: ll, rightLight: rl, leftHeavy: lh, rightHeavy: rh });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, barrierOpen, temperature, lang, resetKey]);

  // Count particles in chambers
  const { leftLight, rightLight, leftHeavy, rightHeavy } = counts;

  const handleLog = () => {
    if (onLogMeasurement) {
      const mixingRatio = ((rightLight + leftHeavy) / 60) * 100;
      const grahamRatio = Math.sqrt(131 / 4);

      onLogMeasurement({
        experiment: 'diffusion',
        variableName: 'Diffusion_Rate_and_Mixing_Ratio',
        measuredValue: parseFloat(mixingRatio.toFixed(1)),
        theoreticalValue: 50.0,
        unit: '%',
        parameters: {
          Absolute_Temperature_T: `${temperature} K`,
          Barrier_State: barrierOpen ? 'Open (Active Inter-diffusion)' : 'Closed (Isolated Chambers)',
          Light_Gas_He_Mass: '4 g/mol (Left initial)',
          Heavy_Gas_Xe_Mass: '131 g/mol (Right initial)',
          Left_Chamber_He_Count: `${leftLight} particles`,
          Right_Chamber_He_Count: `${rightLight} particles`,
          Left_Chamber_Xe_Count: `${leftHeavy} particles`,
          Right_Chamber_Xe_Count: `${rightHeavy} particles`,
          Mixing_Equilibrium_Progress: `${mixingRatio.toFixed(1)}%`,
          Graham_Effusion_Rate_Ratio: `${grahamRatio.toFixed(2)}× (He is ~5.72× faster than Xe)`,
        },
        equation: 'Rate_1 / Rate_2 = √(M_2 / M_1) | v_rms = √(3·k_B·T / m) | J = -D·(dC/dx)',
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Sparkles  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.diffusion.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER F • SIMULATION 30</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="diffusion-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              logged
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
            }`}
          >
            {logged ? <BookmarkCheck className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            <span>{logged ? (tI18n('experiments.diffusion.logged') || tI18n('common.logged') || 'تم التسجيل ✓') : (tI18n('experiments.diffusion.log') || tI18n('common.logMeasurement') || 'تسجيل القياس')}</span>
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors"
          >
            {isRunning ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
            {isRunning ? tI18n('experiments.diffusion.pause') : tI18n('experiments.diffusion.play')}
          </button>
          <button
            onClick={() => {
              setBarrierOpen(false);
              initChamber();
            }}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title={tI18n('experiments.diffusion.reset')}
          >
            <RotateCcw  className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={280}
           className="w-full h-auto max-h-[280px] rounded-xl bg-slate-950"/>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
            <div className="p-2 bg-slate-900 rounded-lg text-center">
              <span className="text-slate-400 font-bold block mb-1">{tI18n('experiments.diffusion.leftChamber')}</span>
              <span className="text-sky-400">He: {leftLight}</span> | <span className="text-red-400">Xe: {leftHeavy}</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg text-center">
              <span className="text-slate-400 font-bold block mb-1">{tI18n('experiments.diffusion.rightChamber')}</span>
              <span className="text-sky-400">He: {rightLight}</span> | <span className="text-red-400">Xe: {rightHeavy}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <button
              onClick={() => setBarrierOpen(!barrierOpen)}
              className={`min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-lg ${
                barrierOpen
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {barrierOpen ? tI18n('experiments.diffusion.closeBarrier') : tI18n('experiments.diffusion.openBarrier')}
            </button>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-400">{tI18n('experiments.diffusion.temp')}</span>
                <span className="font-mono text-white text-sm">{temperature} K</span>
              </div>
              <input
                type="range"
                min="100"
                max="800"
                step="20"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200/90 font-mono space-y-1">
            <span className="font-bold text-purple-300 block">Graham's Law of Effusion:</span>
            <p>Rate_1 / Rate_2 = √(M_2 / M_1)</p>
            <p>v_rms = √(3kT / m)</p>
          </div>
        </div>
      </div>
    </div>
  );
};