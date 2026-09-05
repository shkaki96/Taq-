import {
  Radiation,
  RotateCcw,
  BookmarkCheck,
  Play,
  Pause,
  Sliders,
  Activity,
  FastForward,
  Sparkles,
  CheckCircle2,
  Atom,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface IsotopePreset {
  id: string;
  nameAr: string;
  nameEn: string;
  halfLifeSec: number; // in simulation seconds
  displayHalfLife: string;
  radiationType: string;
  parentSymbol: string;
  daughterSymbol: string;
  particleType: 'alpha' | 'beta' | 'gamma';
}

const ISOTOPES: IsotopePreset[] = [
  {
    id: 'c14',
    nameAr: 'الكربون-14 (¹⁴C)',
    nameEn: 'Carbon-14 (¹⁴C)',
    halfLifeSec: 10,
    displayHalfLife: '5,730 yr',
    radiationType: 'β⁻',
    parentSymbol: '¹⁴C',
    daughterSymbol: '¹⁴N',
    particleType: 'beta',
  },
  {
    id: 'i131',
    nameAr: 'اليود-131 (¹³¹I)',
    nameEn: 'Iodine-131 (¹³¹I)',
    halfLifeSec: 6,
    displayHalfLife: '8.02 d',
    radiationType: 'β⁻ + γ',
    parentSymbol: '¹³¹I',
    daughterSymbol: '¹³¹Xe',
    particleType: 'beta',
  },
  {
    id: 'rn222',
    nameAr: 'الرادون-222 (²²²Rn)',
    nameEn: 'Radon-222 (²²²Rn)',
    halfLifeSec: 4,
    displayHalfLife: '3.82 d',
    radiationType: 'α',
    parentSymbol: '²²²Rn',
    daughterSymbol: '²¹⁸Po',
    particleType: 'alpha',
  },
  {
    id: 'co60',
    nameAr: 'الكوبالت-60 (⁶⁰Co)',
    nameEn: 'Cobalt-60 (⁶⁰Co)',
    halfLifeSec: 8,
    displayHalfLife: '5.27 yr',
    radiationType: 'β⁻ + γ',
    parentSymbol: '⁶⁰Co',
    daughterSymbol: '⁶⁰Ni',
    particleType: 'beta',
  },
  {
    id: 'po218',
    nameAr: 'البولونيوم-218 (²¹⁸Po)',
    nameEn: 'Polonium-218 (²¹⁸Po)',
    halfLifeSec: 3,
    displayHalfLife: '3.10 min',
    radiationType: 'α',
    parentSymbol: '²¹⁸Po',
    daughterSymbol: '²¹⁴Pb',
    particleType: 'alpha',
  },
];

export default function RadioactiveDecaySim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();

  // Primary state
  const [initialCount, setInitialCount] = useState<number>(300); // N_0: 100 to 500 nuclei
  const [isotopeIndex, setIsotopeIndex] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [logged, setLogged] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<{ x: number; y: number; decayed: boolean; decayTime?: number }[]>([]);
  const flyingRaysRef = useRef<{ x: number; y: number; vx: number; vy: number; type: string; life: number }[]>([]);
  const historyRef = useRef<{ t: number; remaining: number }[]>([]);
  const lastHistoryRecordTime = useRef<number>(0);

  const isotope = ISOTOPES[isotopeIndex];
  const halfLife = isotope.halfLifeSec;
  const decayConstant = Math.LN2 / halfLife; // lambda = ln(2) / T_1/2

  // Initialize nuclei
  const initNuclei = useCallback(() => {
    // Distribute nuclei randomly in chamber (chamber coords: x 30 to 390, y 60 to 420)
    const newParticles = Array.from({ length: initialCount }).map(() => ({
      x: 45 + Math.random() * 325,
      y: 75 + Math.random() * 330,
      decayed: false,
    }));
    particlesRef.current = newParticles;
    flyingRaysRef.current = [];
    historyRef.current = [{ t: 0, remaining: initialCount }];
    lastHistoryRecordTime.current = 0;
    setElapsedTime(0);
  }, [initialCount]);

  useEffect(() => {
    initNuclei();
  }, [initNuclei, isotopeIndex]);

  // Compute stats
  const activeCount = particlesRef.current.filter((p) => !p.decayed).length;
  const decayedCount = particlesRef.current.length - activeCount;
  const theoreticalRemaining = initialCount * Math.pow(0.5, elapsedTime / halfLife);
  const elapsedHalfLives = (elapsedTime / halfLife).toFixed(2);
  const activityBq = (decayConstant * activeCount).toFixed(1);

  // Step 1 Half-life button
  const handleStepHalfLife = () => {
    const nextT = elapsedTime + halfLife;
    setElapsedTime(nextT);
    let newActive = 0;
    particlesRef.current.forEach((p) => {
      if (!p.decayed && Math.random() < 0.5) {
        p.decayed = true;
        p.decayTime = nextT;
      }
      if (!p.decayed) newActive++;
    });
    historyRef.current.push({ t: parseFloat(nextT.toFixed(1)), remaining: newActive });
  };

  const handleReset = () => {
    initNuclei();
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'radioactive_decay',
        parameters: {
          isotope: isotope.nameEn,
          halfLifeDisplay: isotope.displayHalfLife,
          radiationType: isotope.radiationType,
          initialNuclei_N0: initialCount,
          elapsedTime_s: `${elapsedTime.toFixed(1)} s`,
          elapsedHalfLives: `${elapsedHalfLives} T₁/₂`,
          activity_Bq: `${activityBq} Bq`,
        },
        measuredValue: activeCount,
        theoreticalValue: Number(theoreticalRemaining.toFixed(1)),
        unit: 'nuclei',
        variableName: tI18n('experiments.radioactive_decay.remainingNuclei') || 'Remaining Parent Nuclei N(t)',
        equation: 'N(t) = N₀ · (1/2)^(t / T₁/₂)',
        notes: `Radioactive Decay: ${isotope.nameEn}, t=${elapsedTime.toFixed(1)}s (${elapsedHalfLives} T1/2), Remaining=${activeCount}/${initialCount}`,
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // Update Physics Decay Process
      if (isRunning) {
        const simDt = dt * speedMultiplier;
        setElapsedTime((prev) => {
          const nextT = prev + simDt;

          // Probability of decay during simDt: P = 1 - e^(-lambda * simDt)
          const decayProb = 1 - Math.exp(-decayConstant * simDt);

          let currentRemaining = 0;
          particlesRef.current.forEach((p) => {
            if (!p.decayed) {
              if (Math.random() < decayProb) {
                p.decayed = true;
                p.decayTime = nextT;
                // Emit radiation ray towards Geiger counter at right
                flyingRaysRef.current.push({
                  x: p.x,
                  y: p.y,
                  vx: 180 + Math.random() * 120,
                  vy: (Math.random() - 0.5) * 80,
                  type: isotope.particleType,
                  life: 0,
                });
              } else {
                currentRemaining++;
              }
            }
          });

          // Record history points every ~0.4 sim seconds
          if (nextT - lastHistoryRecordTime.current >= 0.4) {
            lastHistoryRecordTime.current = nextT;
            historyRef.current.push({ t: parseFloat(nextT.toFixed(1)), remaining: currentRemaining });
            if (historyRef.current.length > 120) {
              historyRef.current = historyRef.current.slice(-120);
            }
          }

          return nextT;
        });

        // Update flying radiation rays
        flyingRaysRef.current = flyingRaysRef.current
          .map((r) => ({
            ...r,
            x: r.x + r.vx * dt,
            y: r.y + r.vy * dt,
            life: r.life + dt,
          }))
          .filter((r) => r.life < 1.2 && r.x < 420);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, width, height);

          // Divider between Left (Chamber) and Right (Graph)
          const splitX = 415;
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(splitX, 15);
          ctx.lineTo(splitX, height - 15);
          ctx.stroke();

          // ==========================================
          // LEFT PANEL: RADIATION CHAMBER & GEIGER COUNTER
          // ==========================================
          const chamberX = 25;
          const chamberY = 30;
          const chamberW = 365;
          const chamberH = 390;

          // Chamber Frame
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.beginPath();
          ctx.roundRect(chamberX, chamberY, chamberW, chamberH, 16);
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Chamber Header Label
          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'left';
          ctx.fillText(`☢️ ${lang === 'ar' ? 'غرفة العينة المشعة' : 'Radiation Sample Chamber'} (${isotope.parentSymbol})`, chamberX + 16, chamberY + 22);

          // Render Nuclei Atoms
          particlesRef.current.forEach((p) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.decayed ? 4 : 5, 0, Math.PI * 2);

            if (!p.decayed) {
              // Active Parent Nucleus (Glowing Green/Amber)
              ctx.fillStyle = '#22c55e';
              ctx.shadowColor = '#16a34a';
              ctx.shadowBlur = 8;
            } else {
              // Decayed Stable Daughter Nucleus (Slate/Blue)
              ctx.fillStyle = '#64748b';
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
            }
            ctx.fill();
            ctx.restore();
          });

          // Render Flying Radiation Particles / Rays
          flyingRaysRef.current.forEach((r) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = r.type === 'alpha' ? '#f97316' : r.type === 'beta' ? '#38bdf8' : '#eab308';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fill();

            // Ray streak tail
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(r.x - 12, r.y);
            ctx.stroke();
            ctx.restore();
          });

          // Geiger-Müller Detector Tube (Bottom Right of Left Chamber)
          const gX = chamberX + chamberW - 85;
          const gY = chamberY + chamberH - 65;
          ctx.save();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(gX, gY, 70, 48);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(gX, gY, 70, 48);

          ctx.font = 'bold 9px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText('GEIGER TUBE', gX + 35, gY + 14);

          ctx.font = 'bold 13px monospace';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(`${activityBq} Bq`, gX + 35, gY + 34);
          ctx.restore();

          // Legend at bottom of chamber
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`● ${lang === 'ar' ? 'نوى أم مشعة' : 'Parent'} (${isotope.parentSymbol}): ${particlesRef.current.filter((p) => !p.decayed).length}`, chamberX + 16, chamberY + chamberH - 24);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`● ${lang === 'ar' ? 'نوى وليدة مستقرة' : 'Daughter'} (${isotope.daughterSymbol}): ${particlesRef.current.filter((p) => p.decayed).length}`, chamberX + 16, chamberY + chamberH - 10);

          // ==========================================
          // RIGHT PANEL: EXPONENTIAL DECAY CURVE GRAPH
          // ==========================================
          const gx = splitX + 35;
          const gy = 45;
          const gw = width - splitX - 55;
          const gh = height - 95;

          const originX = gx;
          const originY = gy + gh;

          // Graph Grid & Background
          ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
          ctx.fillRect(gx, gy, gw, gh);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.lineWidth = 1;

          // Horizontal grid lines (N0, N0/2, N0/4, N0/8)
          const fractions = [
            { label: 'N₀', val: 1.0 },
            { label: 'N₀/2', val: 0.5 },
            { label: 'N₀/4', val: 0.25 },
            { label: 'N₀/8', val: 0.125 },
          ];
          fractions.forEach((f) => {
            const py = originY - f.val * (gh - 30);
            ctx.beginPath();
            ctx.moveTo(gx, py);
            ctx.lineTo(gx + gw, py);
            ctx.stroke();

            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'right';
            ctx.fillText(f.label, gx - 6, py + 3);
          });

          // Vertical grid lines (T1/2, 2T1/2, 3T1/2, 4T1/2)
          const maxSimTime = halfLife * 4.2;
          for (let hl = 1; hl <= 4; hl++) {
            const tVal = hl * halfLife;
            const px = originX + (tVal / maxSimTime) * gw;
            if (px < originX + gw) {
              ctx.beginPath();
              ctx.moveTo(px, gy);
              ctx.lineTo(px, originY);
              ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
              ctx.stroke();

              ctx.font = 'bold 10px monospace';
              ctx.fillStyle = '#38bdf8';
              ctx.textAlign = 'center';
              ctx.fillText(`${hl}T₁/₂`, px, originY + 16);
            }
          }

          // Axes
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(originX, gy);
          ctx.lineTo(originX, originY);
          ctx.lineTo(originX + gw, originY);
          ctx.stroke();

          // Axis titles
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'right';
          ctx.fillText('t (s)', originX + gw, originY - 8);
          ctx.fillText('N(t)', originX + 30, gy + 15);

          // 1. Draw Theoretical Smooth Exponential Curve N(t) = N0 * e^(-lambda * t)
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          for (let tx = 0; tx <= maxSimTime; tx += 0.2) {
            const px = originX + (tx / maxSimTime) * gw;
            const frac = Math.pow(0.5, tx / halfLife);
            const py = originY - frac * (gh - 30);
            if (tx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // 2. Draw Discrete Simulated History Line
          if (historyRef.current.length > 1) {
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            historyRef.current.forEach((pt, idx) => {
              const px = originX + Math.min(1, pt.t / maxSimTime) * gw;
              const frac = pt.remaining / initialCount;
              const py = originY - frac * (gh - 30);
              if (idx === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();
          }

          // 3. Current Time Cursor & Marker
          const currentPx = originX + Math.min(1, elapsedTime / maxSimTime) * gw;
          const currRemaining = particlesRef.current.filter((p) => !p.decayed).length;
          const currentPy = originY - (currRemaining / initialCount) * (gh - 30);

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(currentPx, currentPy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Live tooltip on cursor
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'left';
          ctx.fillText(`N = ${currRemaining}`, currentPx + 10, currentPy - 5);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    decayConstant,
    halfLife,
    speedMultiplier,
    initialCount,
    isotope,
    lang,
    activityBq,
  ]);

  return (
    <div id="radioactive-decay-simulation" className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Radiation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {tI18n('experiments.radioactive_decay.title') || 'Radioactive Decay & Half-Life Lab'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">N(t) = N₀ · (1/2)^(t / T₁/₂) = N₀ · e^(-λ · t)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Step 1 Half-life button */}
          <button
            onClick={handleStepHalfLife}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="+1 Half Life"
          >
            <FastForward className="w-3.5 h-3.5 text-sky-400" />
            <span className="whitespace-nowrap">+1 T₁/₂</span>
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title={isRunning ? 'Pause' : 'Play'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title={tI18n('experiments.radioactive_decay.reset') || 'Reset'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all shrink-0 ${
              logged
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{logged ? tI18n('experiments.radioactive_decay.logged') || 'Logged ✓' : tI18n('experiments.radioactive_decay.logMeasurement') || 'Log Data'}</span>
          </button>
        </div>
      </div>

      {/* Isotope Selection Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap px-1 flex items-center gap-1">
          <Atom className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'ar' ? 'النظائر المشعة:' : 'Isotopes:'}</span>
        </span>
        {ISOTOPES.map((iso, idx) => (
          <button
            key={iso.id}
            onClick={() => setIsotopeIndex(idx)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              isotopeIndex === idx
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
            }`}
          >
            <span>{lang === 'ar' ? iso.nameAr : iso.nameEn}</span>
            <span className="text-[10px] opacity-75 font-mono">({iso.displayHalfLife})</span>
          </button>
        ))}
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Canvas Area (Cols: 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
            {/* Top Toolbar overlay inside canvas */}
            <div className="w-full flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80 px-2">
              <div className="flex items-center gap-2">
                <Radiation className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  {lang === 'ar' ? 'محاكاة التحلل العشوائي ومنحنى التضاؤل الأسي' : 'Stochastic Decay & Exponential Decay Curve'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                <span>t = {elapsedTime.toFixed(1)}s ({elapsedHalfLives} T₁/₂)</span>
              </div>
            </div>

            {/* High-Resolution HTML5 Canvas */}
            <div className="w-full aspect-[7/4] max-h-[520px] rounded-xl overflow-hidden bg-slate-950 relative border border-slate-800/70 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={840}
                height={480}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Canvas Hint Prompt */}
            <div className="w-full text-center py-1.5 text-[11px] text-slate-400 flex items-center justify-center gap-3">
              <span>💡 {lang === 'ar' ? 'راقب كيف يقل عدد النوى للنصف مع كل فترة عمر نصف وتتحول النوى الأم (خضراء) إلى وليدة (رمادية)' : 'Observe how half of parent nuclei decay every half-life period into stable daughter nuclei!'}</span>
            </div>
          </div>

          {/* Real-time Telemetry Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{tI18n('experiments.radioactive_decay.remainingNuclei') || 'Active Nuclei N(t)'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 whitespace-nowrap">
                {activeCount} <span className="text-[10px] sm:text-xs text-slate-400">/ {initialCount}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{tI18n('experiments.radioactive_decay.decayedNuclei') || 'Decayed Daughter'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-400 whitespace-nowrap">
                {decayedCount} <span className="text-[10px] sm:text-[11px] text-slate-500">({((decayedCount / initialCount) * 100).toFixed(0)}%)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{tI18n('experiments.radioactive_decay.activity') || 'Activity (A)'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-amber-400 whitespace-nowrap">
                {activityBq} <span className="text-[10px] sm:text-xs text-slate-400">Bq</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{lang === 'ar' ? 'فترات عمر النصف' : 'Half-Lives'}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {elapsedHalfLives} <span className="text-xs text-slate-400">T₁/₂</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls (Cols: 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>{tI18n('experiments.radioactive_decay.controlsTitle') || 'Decay Parameters'}</span>
            </h4>

            {/* Initial Count N0 Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.radioactive_decay.initialCountLabel') || 'Initial Nuclei (N₀):'}</span>
                <span className="font-mono text-emerald-400 font-bold">{initialCount}</span>
              </div>
              <input
                type="range"
                min="100"
                max="500"
                step="50"
                value={initialCount}
                onChange={(e) => setInitialCount(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Simulation Speed Buttons */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-300">{lang === 'ar' ? 'سرعة المحاكاة:' : 'Simulation Speed:'}</span>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSpeedMultiplier(spd)}
                    className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      speedMultiplier === spd
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {spd}×
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Isotope Information */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{lang === 'ar' ? 'عمر النصف الفعلي:' : 'Real Half-Life:'}</span>
                <span className="font-mono text-amber-300 font-bold">{isotope.displayHalfLife}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{lang === 'ar' ? 'نوع الإشعاع المنبعث:' : 'Radiation Type:'}</span>
                <span className="font-mono text-sky-300 font-bold">{isotope.radiationType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{lang === 'ar' ? 'ثابت الانحلال (λ):' : 'Decay Constant (λ):'}</span>
                <span className="font-mono text-emerald-300 font-bold">{decayConstant.toFixed(3)} s⁻¹</span>
              </div>
            </div>
          </div>

          {/* Scientific Reference Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ar' ? 'قانون التحلل الإشعاعي الأسي' : 'Radioactive Decay Law'}</span>
            </h4>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-300 space-y-1.5">
              <div className="font-bold text-amber-300">N(t) = N₀ · (1/2)^(t / T₁/₂)</div>
              <div className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? 'عملية احتمالية إحصائية يتناقص فيها عدد النوى المشعة بشكل أسي بمعدل ثابت يعتمد على عمر النصف الخاص بكل نظير.'
                  : 'Stochastic exponential decay process governed by the characteristic half-life constant of each radioactive isotope.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
