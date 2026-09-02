import { Sparkles, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface DiffusionSimProps {
  lang: Language;
}

interface GasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'light' | 'heavy';
}

export const DiffusionSim: React.FC<DiffusionSimProps> = ({ lang }) => {
  const [barrierOpen, setBarrierOpen] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [temperature, setTemperature] = useState<number>(300); // Kelvin
  const [particles, setParticles] = useState<GasParticle[]>([]);

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
    setParticles(newParticles);
  };

  useEffect(() => {
    initChamber();
  }, []);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (isRunning) {
        const speedScale = Math.sqrt(temperature / 300);

        setParticles((prev) =>
          prev.map((p) => {
            const massFactor = p.type === 'light' ? 1.8 : 0.7;
            const vx = p.vx * speedScale * massFactor;
            const vy = p.vy * speedScale * massFactor;

            let nx = p.x + vx;
            let ny = p.y + vy;
            let nvx = p.vx;
            let nvy = p.vy;

            const minX = 50;
            const maxX = 550;
            const minY = 30;
            const maxY = 250;
            const barrierX = 300;

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

            return { ...p, x: nx, y: ny, vx: nvx, vy: nvy };
          })
        );
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
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
          particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.type === 'light' ? 4.5 : 7.5, 0, Math.PI * 2);
            ctx.fillStyle = p.type === 'light' ? '#38bdf8' : '#ef4444';
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
  }, [isRunning, barrierOpen, temperature, particles]);

  // Count particles in chambers
  const leftLight = particles.filter((p) => p.x < 300 && p.type === 'light').length;
  const rightLight = particles.filter((p) => p.x >= 300 && p.type === 'light').length;
  const leftHeavy = particles.filter((p) => p.x < 300 && p.type === 'heavy').length;
  const rightHeavy = particles.filter((p) => p.x >= 300 && p.type === 'heavy').length;

  const t = {
    ar: {
      title: 'انتشار الغازات وقانون غراهام (Diffusion & Graham\'s Law: r₁/r₂ = √(M₂/M₁))',
      barrier: 'الحاجز الفاصل بين الحجرتين',
      openBarrier: 'إزالة الحاجز وبدء الانتشار 🔓',
      closeBarrier: 'إغلاق الحاجز 🔒',
      temp: 'درجة حرارة الغازين (T)',
      lightGas: 'غاز خفيف (هيليوم He - أزرق)',
      heavyGas: 'غاز ثقيل (زينون Xe - أحمر)',
      leftChamber: 'الحجرة اليسرى',
      rightChamber: 'الحجرة اليمنى',
      reset: 'إعادة ضبط الغازات',
    },
    en: {
      title: 'Gas Diffusion & Graham\'s Law (r₁/r₂ = √(M₂/M₁))',
      barrier: 'Dividing Chamber Barrier',
      openBarrier: 'Remove Barrier & Diffuse 🔓',
      closeBarrier: 'Close Barrier 🔒',
      temp: 'Chamber Temperature (T)',
      lightGas: 'Light Gas (Helium He - Blue)',
      heavyGas: 'Heavy Gas (Xenon Xe - Red)',
      leftChamber: 'Left Chamber',
      rightChamber: 'Right Chamber',
      reset: 'Reset Gases',
    },
    ku: {
      title: 'بڵاوبوونەوەی گازەکان و یاسای گراهام',
      barrier: 'پەردەی جیاکەرەوە',
      openBarrier: 'لابردنی پەردە 🔓',
      closeBarrier: 'داخستنی پەردە 🔒',
      temp: 'پلەی گەرمی (T)',
      lightGas: 'گازی سووک (هیلیۆم)',
      heavyGas: 'گازی قورس (زینۆن)',
      leftChamber: 'ژووری چەپ',
      rightChamber: 'ژووری ڕاست',
      reset: 'ڕێکخستنەوە',
    },
    kmr: {
      title: 'Belavbûna Gazan û Qanûna Graham',
      barrier: 'Astengiya Navberê',
      openBarrier: 'Rakirina Astengiyê 🔓',
      closeBarrier: 'Girtina Astengiyê 🔒',
      temp: 'Germahî (T)',
      lightGas: 'Gaza Sivik (Helyûm)',
      heavyGas: 'Gaza Giran (Ksenon)',
      leftChamber: 'Odeya Çepê',
      rightChamber: 'Odeya Rastê',
      reset: 'Nûkirin',
    },
  }[lang];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Sparkles  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{t.title}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER F • SIMULATION 30</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="min-h-[44px] min-w-[44px]"
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors"
          >
            {isRunning ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
            {isRunning ? 'إيقاف مؤقت' : 'تشغيل الحركة'}
          </button>
          <button className="min-h-[44px] min-w-[44px]"
            onClick={() => {
              setBarrierOpen(false);
              initChamber();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title={t.reset}
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
              <span className="text-slate-400 font-bold block mb-1">{t.leftChamber}</span>
              <span className="text-sky-400">He: {leftLight}</span> | <span className="text-red-400">Xe: {leftHeavy}</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg text-center">
              <span className="text-slate-400 font-bold block mb-1">{t.rightChamber}</span>
              <span className="text-sky-400">He: {rightLight}</span> | <span className="text-red-400">Xe: {rightHeavy}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <button className="min-h-[44px] min-w-[44px]"
              onClick={() => setBarrierOpen(!barrierOpen)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-lg ${
                barrierOpen
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {barrierOpen ? t.closeBarrier : t.openBarrier}
            </button>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-400">{t.temp}</span>
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