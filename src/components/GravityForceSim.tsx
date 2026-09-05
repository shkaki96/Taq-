import {
  Orbit,
  RotateCcw,
  BookmarkCheck,
  Play,
  Pause,
  Sliders,
  MoveHorizontal,
  Globe,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface PresetSystem {
  id: string;
  nameAr: string;
  nameEn: string;
  m1: number; // kg
  m2: number; // kg
  distance: number; // m
  scale: 'lab' | 'planetary';
}

const PRESET_SYSTEMS: PresetSystem[] = [
  { id: 'spheres', nameAr: 'كرتان في المختبر (kg)', nameEn: 'Lab Spheres (kg)', m1: 150, m2: 300, distance: 4.0, scale: 'lab' },
  { id: 'earth_moon', nameAr: 'الأرض والقمر', nameEn: 'Earth & Moon', m1: 600, m2: 80, distance: 5.5, scale: 'planetary' },
  { id: 'astronaut_craft', nameAr: 'رائد فضاء ومحطة', nameEn: 'Astronaut & Station', m1: 90, m2: 800, distance: 3.5, scale: 'lab' },
  { id: 'lead_spheres', nameAr: 'تجربة كافنديش', nameEn: 'Cavendish Experiment', m1: 400, m2: 400, distance: 2.5, scale: 'lab' },
];

export default function GravityForceSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();

  // Masses (kg) and Separation (m)
  const [m1, setM1] = useState<number>(150); // 10 to 1000 kg
  const [m2, setM2] = useState<number>(300); // 10 to 1000 kg
  const [distance, setDistance] = useState<number>(4.0); // 1.5 to 9.0 meters
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [showGravityWell, setShowGravityWell] = useState<boolean>(true);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Universal Gravitational Constant G = 6.67430e-11 N·m²/kg²
  const G = 6.6743e-11;

  // Real physical force in Newtons
  const forceN = (G * m1 * m2) / (distance * distance);
  const forceNanoN = forceN * 1e9; // in nanoNewtons (nN)
  const forceSci = forceN.toExponential(3);

  // Canvas References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingTargetRef = useRef<'m1' | 'm2' | 'ruler' | null>(null);
  const dragStartXRef = useRef<number>(0);
  const animTimeRef = useRef<number>(0);

  // Calculate mass positions in 840x480 canvas space
  // Ruler track runs from x = 120 to x = 720 (600px width = 8.0 meters => 75 px per meter)
  const trackStartX = 120;
  const pixelsPerMeter = 65;
  const centerY = 240;

  // Center the two masses around canvas center (420px)
  const canvasCenterX = 420;
  const m1X = canvasCenterX - (distance * pixelsPerMeter) / 2;
  const m2X = canvasCenterX + (distance * pixelsPerMeter) / 2;

  // Mass radii proportional to cube root of mass (constant density volume)
  const getRadius = (m: number) => Math.max(22, Math.min(52, 14 + Math.cbrt(m) * 4.2));
  const r1 = getRadius(m1);
  const r2 = getRadius(m2);

  // Apply preset
  const applyPreset = (preset: PresetSystem, idx: number) => {
    setPresetIndex(idx);
    setM1(preset.m1);
    setM2(preset.m2);
    setDistance(preset.distance);
  };

  const handleReset = () => {
    setM1(150);
    setM2(300);
    setDistance(4.0);
    setPresetIndex(0);
    setShowGravityWell(true);
    setShowRuler(true);
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'gravity_force_lab',
        parameters: {
          m1_kg: `${m1} kg`,
          m2_kg: `${m2} kg`,
          distance_r_m: `${distance.toFixed(2)} m`,
          G_constant: '6.6743 × 10⁻¹¹ N·m²/kg²',
          force_scientific: `${forceSci} N`,
        },
        measuredValue: Number(forceNanoN.toFixed(4)),
        theoreticalValue: Number(((G * m1 * m2) / (distance * distance) * 1e9).toFixed(4)),
        unit: 'nN',
        variableName: tI18n('experiments.gravity_force_lab.gravitationalForce') || 'Gravitational Attraction Force (F)',
        equation: 'F = G · (m₁ · m₂) / r²',
        notes: `Newton Gravitational Force: m1=${m1}kg, m2=${m2}kg, r=${distance.toFixed(2)}m => F=${forceNanoN.toFixed(3)} nN`,
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

      if (isRunning) {
        animTimeRef.current += dt;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.clearRect(0, 0, width, height);

          // Deep Cosmos / Physics Lab Slate Background
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, width, height);

          // Starfield Background effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          for (let s = 0; s < 40; s++) {
            const sx = (s * 97 + 31) % width;
            const sy = (s * 67 + 17) % height;
            ctx.beginPath();
            ctx.arc(sx, sy, (s % 3 === 0) ? 1.2 : 0.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // 1. Spacetime Curvature Grid (Gravitational Wells beneath masses)
          if (showGravityWell) {
            ctx.lineWidth = 1;
            const gridSpacing = 28;
            const baseY = centerY + 90;

            for (let x = 40; x < width - 40; x += gridSpacing) {
              ctx.beginPath();
              // Calculate gravity depth profile
              const d1 = Math.abs(x - m1X);
              const d2 = Math.abs(x - m2X);
              const wellDepth1 = (m1 / 1000) * 45 / (1 + (d1 / 45) ** 2);
              const wellDepth2 = (m2 / 1000) * 45 / (1 + (d2 / 45) ** 2);
              const totalDepth = wellDepth1 + wellDepth2;

              ctx.moveTo(x, baseY + totalDepth);
              ctx.lineTo(x, height - 25);
              ctx.strokeStyle = `rgba(99, 102, 241, ${Math.min(0.35, 0.08 + totalDepth * 0.006)})`;
              ctx.stroke();
            }

            // Horizontal Warped Grid Lines
            for (let y = baseY; y < height - 20; y += 22) {
              ctx.beginPath();
              for (let x = 40; x < width - 40; x += 6) {
                const d1 = Math.abs(x - m1X);
                const d2 = Math.abs(x - m2X);
                const decay = Math.max(0, 1 - (y - baseY) / 90);
                const wellDepth1 = (m1 / 1000) * 45 / (1 + (d1 / 45) ** 2) * decay;
                const wellDepth2 = (m2 / 1000) * 45 / (1 + (d2 / 45) ** 2) * decay;
                const totalDepth = wellDepth1 + wellDepth2;

                const py = y + totalDepth;
                if (x === 40) ctx.moveTo(x, py);
                else ctx.lineTo(x, py);
              }
              ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
              ctx.stroke();
            }
          }

          // 2. Linear Distance Track & Measurement Caliper
          const trackY = centerY;
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(80, trackY);
          ctx.lineTo(width - 80, trackY);
          ctx.stroke();

          // Distance Ruler Bar with Ticks
          if (showRuler) {
            const rulerY = trackY - 95;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(m1X, rulerY);
            ctx.lineTo(m2X, rulerY);
            ctx.stroke();

            // End tick arrows
            ctx.beginPath();
            ctx.moveTo(m1X, rulerY - 8);
            ctx.lineTo(m1X, rulerY + 8);
            ctx.moveTo(m2X, rulerY - 8);
            ctx.lineTo(m2X, rulerY + 8);
            ctx.stroke();

            // Center distance label badge
            const midX = (m1X + m2X) / 2;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(midX - 52, rulerY - 14, 104, 28);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(midX - 52, rulerY - 14, 104, 28);

            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`r = ${distance.toFixed(2)} m`, midX, rulerY);
          }

          // Connecting center-to-center dashed line
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(m1X, trackY);
          ctx.lineTo(m2X, trackY);
          ctx.stroke();
          ctx.setLineDash([]);

          // 3. Force Vector Arrows (Newton's Third Law: F12 = -F21)
          // Scale arrow length logarithmically/smoothly
          const baseArrowLen = Math.min(130, Math.max(30, 25 + Math.log10(Math.max(1, forceNanoN * 10)) * 32));

          // Vector 1 -> 2 (From m1 pointing towards m2, i.e. to the right)
          const f12EndX = m1X + r1 + baseArrowLen;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(m1X + r1 + 4, trackY);
          ctx.lineTo(f12EndX, trackY);
          ctx.stroke();

          // Arrowhead 1 -> 2
          ctx.beginPath();
          ctx.moveTo(f12EndX + 8, trackY);
          ctx.lineTo(f12EndX - 4, trackY - 6);
          ctx.lineTo(f12EndX - 4, trackY + 6);
          ctx.closePath();
          ctx.fillStyle = '#38bdf8';
          ctx.fill();

          // Vector 1 label
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          ctx.fillText(`F₁₂ = ${forceNanoN.toFixed(2)} nN`, (m1X + r1 + f12EndX) / 2, trackY - 14);

          // Vector 2 -> 1 (From m2 pointing towards m1, i.e. to the left)
          const f21EndX = m2X - r2 - baseArrowLen;
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(m2X - r2 - 4, trackY);
          ctx.lineTo(f21EndX, trackY);
          ctx.stroke();

          // Arrowhead 2 -> 1
          ctx.beginPath();
          ctx.moveTo(f21EndX - 8, trackY);
          ctx.lineTo(f21EndX + 4, trackY - 6);
          ctx.lineTo(f21EndX + 4, trackY + 6);
          ctx.closePath();
          ctx.fillStyle = '#f97316';
          ctx.fill();

          // Vector 2 label
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#f97316';
          ctx.textAlign = 'center';
          ctx.fillText(`F₂₁ = ${forceNanoN.toFixed(2)} nN`, (m2X - r2 + f21EndX) / 2, trackY - 14);

          // 4. Render Sphere 1 (Blue Mass m1)
          ctx.save();
          ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
          ctx.shadowBlur = 18;

          // Radial 3D Sphere Gradient
          const grad1 = ctx.createRadialGradient(m1X - r1 * 0.35, trackY - r1 * 0.35, r1 * 0.1, m1X, trackY, r1);
          grad1.addColorStop(0, '#93c5fd');
          grad1.addColorStop(0.3, '#3b82f6');
          grad1.addColorStop(0.8, '#1d4ed8');
          grad1.addColorStop(1, '#0f172a');

          ctx.fillStyle = grad1;
          ctx.beginPath();
          ctx.arc(m1X, trackY, r1, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#bfdbfe';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Label Mass 1
          ctx.font = 'bold 13px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('m₁', m1X, trackY - 2);

          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = '#60a5fa';
          ctx.fillText(`${m1} kg`, m1X, trackY + r1 + 18);

          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('✋ ' + (lang === 'ar' ? 'اسحب الكتلة' : 'Drag m₁'), m1X, trackY + r1 + 32);

          // 5. Render Sphere 2 (Orange/Red Mass m2)
          ctx.save();
          ctx.shadowColor = 'rgba(249, 115, 22, 0.5)';
          ctx.shadowBlur = 18;

          const grad2 = ctx.createRadialGradient(m2X - r2 * 0.35, trackY - r2 * 0.35, r2 * 0.1, m2X, trackY, r2);
          grad2.addColorStop(0, '#fdba74');
          grad2.addColorStop(0.3, '#f97316');
          grad2.addColorStop(0.8, '#c2410c');
          grad2.addColorStop(1, '#0f172a');

          ctx.fillStyle = grad2;
          ctx.beginPath();
          ctx.arc(m2X, trackY, r2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#fed7aa';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Label Mass 2
          ctx.font = 'bold 13px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('m₂', m2X, trackY - 2);

          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = '#fb923c';
          ctx.fillText(`${m2} kg`, m2X, trackY + r2 + 18);

          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('✋ ' + (lang === 'ar' ? 'اسحب الكتلة' : 'Drag m₂'), m2X, trackY + r2 + 32);

          // Top Info Banner on Canvas
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(24, 16, 260, 36);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
          ctx.strokeRect(24, 16, 260, 36);

          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#e2e8f0';
          ctx.textAlign = 'left';
          ctx.fillText(`F = G · (m₁ · m₂) / r²`, 36, 32);
          ctx.font = '10px monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`G = 6.6743 × 10⁻¹¹ N·m²/kg²`, 36, 44);

          // Status Badge
          ctx.textAlign = 'right';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(width - 100, 28, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillText(lang === 'ar' ? 'المحاكاة نشطة' : 'Active Lab', width - 24, 32);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [m1, m2, distance, showGravityWell, showRuler, isRunning, m1X, m2X, r1, r2, forceNanoN, forceSci, lang]);

  // Pointer Interaction Handlers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }

    if (Math.hypot(coords.x - m1X, coords.y - centerY) < r1 + 15) {
      draggingTargetRef.current = 'm1';
      dragStartXRef.current = coords.x;
      return;
    }

    if (Math.hypot(coords.x - m2X, coords.y - centerY) < r2 + 15) {
      draggingTargetRef.current = 'm2';
      dragStartXRef.current = coords.x;
      return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingTargetRef.current) return;
    const coords = getCanvasCoords(e);

    if (draggingTargetRef.current === 'm1') {
      // Calculate new distance from m1 dragging
      const newM1X = Math.min(canvasCenterX - 45, Math.max(120, coords.x));
      const halfDistPx = canvasCenterX - newM1X;
      const newDistMeters = Math.max(1.5, Math.min(9.0, (halfDistPx * 2) / pixelsPerMeter));
      setDistance(newDistMeters);
    } else if (draggingTargetRef.current === 'm2') {
      // Calculate new distance from m2 dragging
      const newM2X = Math.max(canvasCenterX + 45, Math.min(720, coords.x));
      const halfDistPx = newM2X - canvasCenterX;
      const newDistMeters = Math.max(1.5, Math.min(9.0, (halfDistPx * 2) / pixelsPerMeter));
      setDistance(newDistMeters);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingTargetRef.current = null;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div id="gravity-force-simulation" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Orbit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {tI18n('experiments.gravity_force_lab.title') || 'Gravity Force Lab (Newton Universal Law)'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">F = G · (m₁ · m₂) / r²  |  F₁₂ = -F₂₁</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            title={tI18n('experiments.gravity_force_lab.reset') || 'Reset'}
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
            <span className="whitespace-nowrap">{logged ? tI18n('experiments.gravity_force_lab.logged') || 'Logged ✓' : tI18n('experiments.gravity_force_lab.logMeasurement') || 'Log Data'}</span>
          </button>
        </div>
      </div>

      {/* Preset System Buttons Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap px-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'ar' ? 'أنظمة كتل جاهزة:' : 'Presets:'}</span>
        </span>
        {PRESET_SYSTEMS.map((preset, idx) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset, idx)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              presetIndex === idx
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? preset.nameAr : preset.nameEn}</span>
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
                <MoveHorizontal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  {lang === 'ar' ? 'حقل الجاذبية المتبادل ومتجهات القوة' : 'Mutual Gravitational Interaction'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGravityWell(!showGravityWell)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono border whitespace-nowrap transition-colors ${
                    showGravityWell
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {lang === 'ar' ? 'انحناء الزمكان' : 'Gravity Well'}
                </button>
                <button
                  onClick={() => setShowRuler(!showRuler)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono border whitespace-nowrap transition-colors ${
                    showRuler
                      ? 'bg-sky-950 text-sky-300 border-sky-700'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {lang === 'ar' ? 'المسطرة' : 'Ruler'}
                </button>
              </div>
            </div>

            {/* High-Resolution HTML5 Canvas */}
            <div className="w-full aspect-[7/4] max-h-[520px] rounded-xl overflow-hidden bg-slate-950 relative border border-slate-800/70 flex items-center justify-center touch-none">
              <canvas
                ref={canvasRef}
                width={840}
                height={480}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="cursor-ew-resize w-full h-full object-contain"
              />
            </div>

            {/* Canvas Hint Prompt */}
            <div className="w-full text-center py-1.5 text-[11px] text-slate-400 flex items-center justify-center gap-3">
              <span>💡 {lang === 'ar' ? 'اسحب أي من الكتلتين m₁ أو m₂ أفقياً لتغيير المسافة الفاصلة وملاحظة تغير القوة بالعكس مع مربع المسافة' : 'Drag m₁ or m₂ horizontally to adjust separation distance and see inverse-square law in action!'}</span>
            </div>
          </div>

          {/* Quick Real-Time Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{tI18n('experiments.gravity_force_lab.gravitationalForce') || 'Force (F)'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 whitespace-nowrap">
                {forceNanoN.toFixed(3)} <span className="text-[10px] sm:text-xs text-slate-400">nN</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{lang === 'ar' ? 'بالصيغة العلمية' : 'Scientific Notation'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-sky-400 whitespace-nowrap">
                {forceSci} <span className="text-[10px] sm:text-xs text-slate-400">N</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{lang === 'ar' ? 'المسافة الفاصلة (r)' : 'Distance (r)'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-amber-400 whitespace-nowrap">
                {distance.toFixed(2)} <span className="text-[10px] sm:text-xs text-slate-400">m</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{lang === 'ar' ? 'حاصل ضرب الكتل (m₁·m₂)' : 'Mass Product (m₁·m₂)'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-purple-400 whitespace-nowrap">
                {(m1 * m2).toLocaleString()} <span className="text-xs text-slate-400">kg²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls (Cols: 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>{tI18n('experiments.gravity_force_lab.controlsTitle') || 'Gravity Controls'}</span>
            </h4>

            {/* Mass 1 Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>{tI18n('experiments.gravity_force_lab.mass1Label') || 'Mass 1 (m₁):'}</span>
                </span>
                <span className="font-mono text-blue-400 font-bold">{m1} kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={m1}
                onChange={(e) => setM1(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Mass 2 Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                  <span>{tI18n('experiments.gravity_force_lab.mass2Label') || 'Mass 2 (m₂):'}</span>
                </span>
                <span className="font-mono text-orange-400 font-bold">{m2} kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={m2}
                onChange={(e) => setM2(parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            {/* Distance Slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.gravity_force_lab.distanceLabel') || 'Distance (r):'}</span>
                <span className="font-mono text-emerald-400 font-bold">{distance.toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="9.0"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Scientific Equations Reference Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ar' ? 'قانون الجاذبية العام لنيوتن' : 'Newton Universal Gravitation'}</span>
            </h4>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-300 space-y-1.5">
              <div className="font-bold text-amber-300">F = G · (m₁ · m₂) / r²</div>
              <div className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? 'قوة تجاذب كتلي متساوية في المقدار ومتعاكسة في الاتجاه بين أي جسمين في الكون، وتتناسب عكسياً مع مربع المسافة بين مركزيهما.'
                  : 'Universal gravitational attraction between any two masses, strictly proportional to mass product and inversely proportional to r².'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
