import { Waves, Pause, Play, BookmarkCheck, Gauge } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface FluidType {
  id: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  density: number; // kg/m³
  color: string;
}

const FLUIDS: FluidType[] = [
  { id: 'water', nameAr: 'الماء العذب (Water - 1000 kg/m³)', nameEn: 'Fresh Water', nameKu: 'ئاو (Water - 1000 kg/m³)', nameKmr: 'Ava Paqij (Water - 1000 kg/m³)', density: 1000, color: '#38bdf8' },
  { id: 'air', nameAr: 'الهواء الجوي (Air - 1.225 kg/m³)', nameEn: 'Air (Aero)', nameKu: 'هەوا (Air - 1.225 kg/m³)', nameKmr: 'Heva Atmosferî (Air - 1.225 kg/m³)', density: 1.225, color: '#94a3b8' },
  { id: 'oil', nameAr: 'الزيت الهيدروليكي (Oil - 860 kg/m³)', nameEn: 'Hydraulic Oil', nameKu: 'زەیتی هایدرۆلیکی (Oil - 860 kg/m³)', nameKmr: 'Rûnê Hîdrolîk (Oil - 860 kg/m³)', density: 860, color: '#eab308' },
  { id: 'ethanol', nameAr: 'الإيثانول (Ethanol - 789 kg/m³)', nameEn: 'Ethanol', nameKu: 'ئیسانۆڵ (Ethanol - 789 kg/m³)', nameKmr: 'Etanol (Ethanol - 789 kg/m³)', density: 789, color: '#a855f7' },
  { id: 'mercury', nameAr: 'الزئبق (Mercury - 13600 kg/m³)', nameEn: 'Mercury', nameKu: 'زیبق (Mercury - 13600 kg/m³)', nameKmr: 'Cîva (Mercury - 13600 kg/m³)', density: 13600, color: '#cbd5e1' },
];

export default function BernoulliSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Parameters
  const [selectedFluidIdx, setSelectedFluidIdx] = useState<number>(0);
  const [pipeDiameter1Cm, setPipeDiameter1Cm] = useState<number>(12); // cm (wide pipe)
  const [pipeDiameter2Cm, setPipeDiameter2Cm] = useState<number>(6); // cm (constriction / throat)
  const [inletVelocity, setInletVelocity] = useState<number>(2.0); // m/s (0.5 to 10.0)
  const [inletPressureKPa, setInletPressureKPa] = useState<number>(150); // kPa (50 to 300)
  const [heightDiffM, setHeightDiffM] = useState<number>(0); // m (-2 to +2)
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [showStreamlines, setShowStreamlines] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  const fluid = FLUIDS[selectedFluidIdx];
  const g = 9.81;

  // Fluid Dynamics Mathematics
  // Areas in m²: A = π * (D/2)²
  const r1M = (pipeDiameter1Cm / 100) / 2;
  const r2M = (pipeDiameter2Cm / 100) / 2;
  const area1M2 = Math.PI * r1M * r1M;
  const area2M2 = Math.PI * r2M * r2M;

  // Volumetric flow rate Q = A1 * v1 (m³/s)
  const flowRateM3s = area1M2 * inletVelocity;
  const flowRateLitersSec = flowRateM3s * 1000;

  // Continuity equation: v2 = v1 * (A1 / A2) = v1 * (D1 / D2)²
  const throatVelocity = area2M2 > 0 ? (flowRateM3s / area2M2) : 0;

  // Dynamic pressures q = 1/2 * ρ * v² (Pa)
  const dynPressure1Pa = 0.5 * fluid.density * inletVelocity * inletVelocity;
  const dynPressure2Pa = 0.5 * fluid.density * throatVelocity * throatVelocity;

  // Bernoulli's equation:
  // P1 + 1/2 ρ v1² + ρ g h1 = P2 + 1/2 ρ v2² + ρ g h2
  // P2 = P1 + 1/2 ρ (v1² - v2²) + ρ g (h1 - h2)
  const inletPressurePa = inletPressureKPa * 1000;
  const potPressureDiffPa = - fluid.density * g * heightDiffM;
  const throatPressurePa = inletPressurePa + (dynPressure1Pa - dynPressure2Pa) + potPressureDiffPa;
  const throatPressureKPa = throatPressurePa / 1000;

  // Pressure difference ΔP = P1 - P2 (Pa)
  const deltaPressureKPa = (inletPressurePa - throatPressurePa) / 1000;

  // Manometer height difference h_mano = ΔP / (ρ * g) in cm
  const manometerHeightDiffCm = (fluid.density > 0 && g > 0) ? ((inletPressurePa - throatPressurePa) / (fluid.density * g)) * 100 : 0;

  // Canvas particle stream ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<{ x: number; yFraction: number; speedOffset: number }[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize stream particles
  useEffect(() => {
    const pts: { x: number; yFraction: number; speedOffset: number }[] = [];
    for (let i = 0; i < 90; i++) {
      pts.push({
        x: Math.random() * 640,
        yFraction: (Math.random() - 0.5) * 0.85, // -0.42 to +0.42
        speedOffset: 0.9 + Math.random() * 0.2,
      });
    }
    particlesRef.current = pts;
  }, []);

  // Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRunning) {
        const particles = particlesRef.current;
        const totalW = 640;
        const throatStart = totalW * 0.35;
        const throatEnd = totalW * 0.65;

        for (let p of particles) {
          // Local speed depends on x position
          let localSpeedRatio = 1.0;
          if (p.x >= throatStart && p.x <= throatEnd) {
            localSpeedRatio = throatVelocity / Math.max(inletVelocity, 0.01);
          } else if (p.x < throatStart) {
            const progress = p.x / throatStart;
            localSpeedRatio = 1.0 + (throatVelocity / Math.max(inletVelocity, 0.01) - 1.0) * Math.pow(progress, 2);
          } else {
            const progress = (p.x - throatEnd) / (totalW - throatEnd);
            localSpeedRatio = throatVelocity / Math.max(inletVelocity, 0.01) - (throatVelocity / Math.max(inletVelocity, 0.01) - 1.0) * progress;
          }

          const movePx = inletVelocity * 65 * localSpeedRatio * p.speedOffset * dt;
          p.x += movePx;
          if (p.x > totalW + 20) {
            p.x = -10;
            p.yFraction = (Math.random() - 0.5) * 0.85;
          }
        }
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          drawVenturi(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, inletVelocity, throatVelocity, pipeDiameter1Cm, pipeDiameter2Cm, inletPressureKPa, throatPressureKPa, selectedFluidIdx, heightDiffM, showStreamlines]);

  const drawVenturi = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Center Y axis of pipe
    const centerY = height * 0.55;
    const maxRadiusPx = (pipeDiameter1Cm / 16) * 65; // pixels
    const throatRadiusPx = (pipeDiameter2Cm / 16) * 65; // pixels

    const xInlet = 50;
    const xThroatStart = width * 0.35;
    const xThroatMid = width * 0.50;
    const xThroatEnd = width * 0.65;
    const xOutlet = width - 50;

    // Fluid Body Fill Shape
    ctx.beginPath();
    // Top boundary
    ctx.moveTo(xInlet, centerY - maxRadiusPx);
    ctx.bezierCurveTo(xThroatStart - 30, centerY - maxRadiusPx, xThroatStart, centerY - throatRadiusPx, xThroatMid, centerY - throatRadiusPx);
    ctx.bezierCurveTo(xThroatEnd, centerY - throatRadiusPx, xThroatEnd + 30, centerY - maxRadiusPx, xOutlet, centerY - maxRadiusPx);
    // Right cap
    ctx.lineTo(xOutlet, centerY + maxRadiusPx);
    // Bottom boundary
    ctx.bezierCurveTo(xThroatEnd + 30, centerY + maxRadiusPx, xThroatEnd, centerY + throatRadiusPx, xThroatMid, centerY + throatRadiusPx);
    ctx.bezierCurveTo(xThroatStart, centerY + throatRadiusPx, xThroatStart - 30, centerY + maxRadiusPx, xInlet, centerY + maxRadiusPx);
    ctx.closePath();

    // Fill Fluid color gradient
    const fluidGrad = ctx.createLinearGradient(xInlet, 0, xOutlet, 0);
    fluidGrad.addColorStop(0, `${fluid.color}33`);
    fluidGrad.addColorStop(0.5, `${fluid.color}66`);
    fluidGrad.addColorStop(1, `${fluid.color}33`);
    ctx.fillStyle = fluidGrad;
    ctx.fill();

    // Draw Pipe Walls
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Streamline Particles
    if (showStreamlines) {
      for (const p of particlesRef.current) {
        if (p.x < xInlet || p.x > xOutlet) continue;

        // Calculate current pipe radius at particle x
        let currentRPx = maxRadiusPx;
        if (p.x < xThroatStart) {
          const ratio = (p.x - xInlet) / (xThroatStart - xInlet);
          currentRPx = maxRadiusPx - (maxRadiusPx - throatRadiusPx) * Math.sin((ratio * Math.PI) / 2);
        } else if (p.x <= xThroatEnd) {
          currentRPx = throatRadiusPx;
        } else {
          const ratio = (p.x - xThroatEnd) / (xOutlet - xThroatEnd);
          currentRPx = throatRadiusPx + (maxRadiusPx - throatRadiusPx) * Math.sin((ratio * Math.PI) / 2);
        }

        const py = centerY + p.yFraction * currentRPx;

        // Particle speed color
        const isAccelerated = p.x >= xThroatStart - 20 && p.x <= xThroatEnd + 20;
        ctx.fillStyle = isAccelerated ? '#f59e0b' : fluid.color;

        ctx.beginPath();
        ctx.arc(p.x, py, isAccelerated ? 2.8 : 2.0, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw Vertical Glass Manometer Tubes at Section 1 and Section 2
    // Tube 1 at x = 140
    const tube1X = 140;
    const tube2X = xThroatMid;
    const tubeW = 18;
    const tubeTopY = 40;

    // Manometer fluid column heights
    const maxColumnH = 110;
    const p1ColH = Math.min(Math.max((inletPressureKPa / 250) * maxColumnH, 15), maxColumnH);
    const p2ColH = Math.min(Math.max((throatPressureKPa / 250) * maxColumnH, 5), maxColumnH);

    // Tube 1 Glass Outline
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(tube1X - tubeW / 2, tubeTopY, tubeW, centerY - maxRadiusPx - tubeTopY);
    // Tube 1 Fluid Level
    const tube1Bottom = centerY - maxRadiusPx;
    ctx.fillStyle = fluid.color;
    ctx.fillRect(tube1X - tubeW / 2 + 1, tube1Bottom - p1ColH, tubeW - 2, p1ColH);

    // Tube 2 Glass Outline
    ctx.strokeRect(tube2X - tubeW / 2, tubeTopY, tubeW, centerY - throatRadiusPx - tubeTopY);
    // Tube 2 Fluid Level
    const tube2Bottom = centerY - throatRadiusPx;
    ctx.fillStyle = throatPressureKPa < 0 ? '#ef4444' : fluid.color;
    ctx.fillRect(tube2X - tubeW / 2 + 1, tube2Bottom - p2ColH, tubeW - 2, p2ColH);

    // Manometer Labels & Indicators
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`P₁ = ${inletPressureKPa.toFixed(1)} kPa`, tube1X - 45, tubeTopY - 12);
    ctx.fillText(`P₂ = ${throatPressureKPa.toFixed(1)} kPa`, tube2X - 45, tubeTopY - 12);

    // Velocity Vector Indicators
    // Section 1
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`v₁ = ${inletVelocity.toFixed(2)} m/s`, tube1X - 35, centerY + maxRadiusPx + 25);
    ctx.fillText(`Ø₁ = ${pipeDiameter1Cm} cm`, tube1X - 30, centerY + maxRadiusPx + 40);

    // Section 2 (Throat)
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`v₂ = ${throatVelocity.toFixed(2)} m/s`, tube2X - 35, centerY + throatRadiusPx + 25);
    ctx.fillText(`Ø₂ = ${pipeDiameter2Cm} cm`, tube2X - 30, centerY + throatRadiusPx + 40);

    // Dynamic Pressure Drop Indicator
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(tube1X + tubeW, tube1Bottom - p1ColH);
    ctx.lineTo(tube2X - tubeW, tube1Bottom - p1ColH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = '10px monospace';
    ctx.fillText(`Δh_mano = ${Math.abs(p1ColH - p2ColH).toFixed(1)} px (ΔP = ${deltaPressureKPa.toFixed(1)} kPa)`, tube1X + 30, tubeTopY + 30);
  };

  const getFluidName = (f: FluidType) => {
    const names: Record<string, string> = {
      ar: f.nameAr,
      ku: f.nameKu,
      kmr: f.nameKmr || f.nameEn,
      en: f.nameEn,
    };
    return names[lang] || f.nameAr;
  };

  const handleLog = () => {
    const fluidName = getFluidName(fluid);
    onLogMeasurement({
      experiment: 'bernoulli',
      variableName: tI18n('experiments.bernoulli.varThroatPressure'),
      measuredValue: throatPressureKPa,
      theoreticalValue: throatPressureKPa,
      unit: 'kPa',
      parameters: {
        Fluid: `${fluidName} (${fluid.density} kg/m³)`,
        'Inlet Velocity v1': `${inletVelocity} m/s`,
        'Inlet Pressure P1': `${inletPressureKPa} kPa`,
        'Wide Diameter D1': `${pipeDiameter1Cm} cm`,
        'Throat Diameter D2': `${pipeDiameter2Cm} cm`,
        'Throat Velocity v2': `${throatVelocity.toFixed(2)} m/s`,
        'Height Diff Δh': `${heightDiffM} m`,
        'Pressure Drop ΔP': `${deltaPressureKPa.toFixed(2)} kPa`,
      },
      equation: `P₂ = P₁ + ½ρ(v₁² - v₂²) - ρgΔh = ${inletPressureKPa} kPa + ½(${fluid.density})(${inletVelocity}² - ${throatVelocity.toFixed(2)}²) Pa = ${throatPressureKPa.toFixed(2)} kPa`,
      notes: tI18n('experiments.bernoulli.notesLog'),
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-blue-950/40 border border-cyan-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Waves  className="w-5 h-5 text-cyan-400"/>
            <span>{tI18n('experiments.bernoulli.title')}</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.bernoulli.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
          >
            {isRunning ? <Pause  className="w-4 h-4"/> : <Play  className="w-4 h-4 text-emerald-400"/>}
          </button>
          <button className={`min-h-[44px] min-w-[44px] min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.bernoulli.logged') : tI18n('experiments.bernoulli.logMeasurement')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls + Interactive Venturi Animation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Gauge  className="w-4 h-4 text-cyan-400"/>
              {tI18n('experiments.bernoulli.controlsTitle')}
            </span>
          </div>

          {/* Fluid Selector */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5 font-medium">
              {tI18n('experiments.bernoulli.fluidLabel')}
            </label>
            <select
              value={selectedFluidIdx}
              onChange={(e) => setSelectedFluidIdx(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 rounded-xl p-2.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {FLUIDS.map((f, idx) => (
                <option key={f.id} value={idx}>
                  {getFluidName(f)}
                </option>
              ))}
            </select>
          </div>

          {/* Inlet Speed v1 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.bernoulli.inletSpeedLabel')}</span>
              <span className="font-mono text-cyan-400 font-semibold">{inletVelocity.toFixed(2)} m/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.1"
              value={inletVelocity}
              onChange={(e) => setInletVelocity(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Inlet Static Pressure P1 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.bernoulli.inletPressureLabel')}</span>
              <span className="font-mono text-emerald-400 font-semibold">{inletPressureKPa.toFixed(1)} kPa</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="5"
              value={inletPressureKPa}
              onChange={(e) => setInletPressureKPa(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Wide Pipe Diameter D1 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.bernoulli.wideDiameterLabel')}</span>
              <span className="font-mono text-sky-400 font-semibold">{pipeDiameter1Cm} cm</span>
            </div>
            <input
              type="range"
              min="8"
              max="20"
              step="1"
              value={pipeDiameter1Cm}
              onChange={(e) => setPipeDiameter1Cm(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Narrow Throat Diameter D2 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.bernoulli.narrowDiameterLabel')}</span>
              <span className="font-mono text-amber-400 font-semibold">{pipeDiameter2Cm} cm</span>
            </div>
            <input
              type="range"
              min="3"
              max={pipeDiameter1Cm - 1}
              step="0.5"
              value={pipeDiameter2Cm}
              onChange={(e) => setPipeDiameter2Cm(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Streamlines Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-300">{tI18n('experiments.bernoulli.showStreamlinesLabel')}</span>
            <input
              type="checkbox"
              checked={showStreamlines}
              onChange={(e) => setShowStreamlines(e.target.checked)}
              className="accent-cyan-500 cursor-pointer w-4 h-4"
            />
          </div>
        </div>

        {/* Canvas and Bento Metrics */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={380}
             className="w-full h-[380px] rounded-xl bg-zinc-950 block"/>
          </div>

          {/* Computed Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Throat Velocity */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.bernoulli.throatVelocityCard')}
              </span>
              <div className="text-lg font-bold font-mono text-amber-400">
                {throatVelocity.toFixed(2)} <span className="text-sm text-zinc-400">m/s</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">v₂/v₁ = {(throatVelocity / inletVelocity).toFixed(2)}x</span>
            </div>

            {/* Throat Pressure */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.bernoulli.throatPressureCard')}
              </span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {throatPressureKPa.toFixed(1)} <span className="text-sm text-zinc-400">kPa</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">ΔP = {deltaPressureKPa.toFixed(1)} kPa</span>
            </div>

            {/* Volumetric Flow */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.bernoulli.flowRateCard')}
              </span>
              <div className="text-lg font-bold font-mono text-cyan-400">
                {flowRateLitersSec.toFixed(2)} <span className="text-sm text-zinc-400">L/s</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Q = A · v</span>
            </div>

            {/* Dynamic Pressure */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.bernoulli.dynamicPressureCard')}
              </span>
              <div className="text-lg font-bold font-mono text-purple-400">
                {(dynPressure2Pa / 1000).toFixed(2)} <span className="text-sm text-zinc-400">kPa</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">P_dyn = ½ ρ v²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}