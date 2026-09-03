import { Sun, Pause, Play, BookmarkCheck, Compass } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function PolarizationSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Parameters
  const [initialIntensity, setInitialIntensity] = useState<number>(100); // W/m² or %
  const [polarizer1AngleDeg, setPolarizer1AngleDeg] = useState<number>(0); // degrees (vertical = 0)
  const [analyzerAngleDeg, setAnalyzerAngleDeg] = useState<number>(45); // degrees
  const [useMiddlePolarizer, setUseMiddlePolarizer] = useState<boolean>(false);
  const [middleAngleDeg, setMiddleAngleDeg] = useState<number>(45); // degrees
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Mathematics: Malus's Law
  // After Polarizer 1 (from unpolarized source): I1 = 0.5 * I0
  const intensityAfterP1 = 0.5 * initialIntensity;

  // After Analyzer (or via Middle):
  let finalIntensity = 0;
  let relativeAngleDeg = 0;

  if (useMiddlePolarizer) {
    // 3 Polarizers: P1 -> P_mid -> Analyzer
    const deltaTheta1 = ((middleAngleDeg - polarizer1AngleDeg) * Math.PI) / 180;
    const intensityAfterMid = intensityAfterP1 * Math.pow(Math.cos(deltaTheta1), 2);

    const deltaTheta2 = ((analyzerAngleDeg - middleAngleDeg) * Math.PI) / 180;
    finalIntensity = intensityAfterMid * Math.pow(Math.cos(deltaTheta2), 2);
    relativeAngleDeg = Math.abs(analyzerAngleDeg - polarizer1AngleDeg) % 180;
  } else {
    // 2 Polarizers: Malus's law I = I1 * cos²(θ2 - θ1)
    relativeAngleDeg = Math.abs(analyzerAngleDeg - polarizer1AngleDeg) % 180;
    const deltaThetaRad = (relativeAngleDeg * Math.PI) / 180;
    finalIntensity = intensityAfterP1 * Math.pow(Math.cos(deltaThetaRad), 2);
  }

  // Fraction of total incident light transmitted
  const transmissionRatio = initialIntensity > 0 ? finalIntensity / initialIntensity : 0;
  const eFieldAmplitudeRatio = Math.sqrt(transmissionRatio);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRunning) {
        phaseRef.current += dt * 4.5;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          drawPolarization(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, initialIntensity, polarizer1AngleDeg, analyzerAngleDeg, useMiddlePolarizer, middleAngleDeg, finalIntensity]);

  const drawPolarization = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Dark Background Grid
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.8;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const centerY = height * 0.52;
    const phase = phaseRef.current;

    // Optical Stages Positions
    const xSource = 60;
    const xP1 = width * (useMiddlePolarizer ? 0.30 : 0.40);
    const xPMid = useMiddlePolarizer ? width * 0.55 : 0;
    const xP2 = width * (useMiddlePolarizer ? 0.80 : 0.75);
    const xTarget = width - 40;

    // Optical Axis
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xSource, centerY);
    ctx.lineTo(xTarget, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 1. Light Source (Unpolarized)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(xSource, centerY, 16, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(tI18n('experiments.polarization.unpolarizedCanvas'), xSource - 30, centerY - 25);
    ctx.fillText(`I₀=${initialIntensity}`, xSource - 18, centerY + 30);

    // Section A: Unpolarized wave propagating to P1 (multidirectional oscillating arrows)
    const waveAmp1 = 30;
    for (let x = xSource + 20; x < xP1; x += 18) {
      const localPhase = phase - x * 0.08;
      const amp = Math.sin(localPhase) * waveAmp1;

      // Draw vertical component
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, centerY - amp);
      ctx.lineTo(x, centerY + amp);
      ctx.stroke();

      // Draw horizontal component
      ctx.strokeStyle = '#f59e0b';
      const ampHoriz = Math.cos(localPhase) * waveAmp1 * 0.65;
      ctx.beginPath();
      ctx.moveTo(x - ampHoriz * 0.6, centerY - ampHoriz * 0.4);
      ctx.lineTo(x + ampHoriz * 0.6, centerY + ampHoriz * 0.4);
      ctx.stroke();
    }

    // --- DRAW POLARIZER 1 ---
    drawPolarizerPlate(ctx, xP1, centerY, polarizer1AngleDeg, tI18n('experiments.polarization.polarizer1Canvas'), '#38bdf8');

    // Section B: Linearly polarized wave after P1
    const p1Rad = (polarizer1AngleDeg * Math.PI) / 180;
    const nextStopX = useMiddlePolarizer ? xPMid : xP2;
    const waveAmp2 = 28;

    for (let x = xP1 + 10; x < nextStopX; x += 14) {
      const localPhase = phase - x * 0.08;
      const amp = Math.sin(localPhase) * waveAmp2;

      // E-field vector oriented at polarizer1AngleDeg
      const dx = -amp * Math.sin(p1Rad) * 0.5;
      const dy = -amp * Math.cos(p1Rad);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, centerY);
      ctx.lineTo(x + dx, centerY + dy);
      ctx.stroke();

      // Arrow dot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x + dx, centerY + dy, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Middle Polarizer if enabled
    if (useMiddlePolarizer) {
      drawPolarizerPlate(ctx, xPMid, centerY, middleAngleDeg, tI18n('experiments.polarization.middlePolarizerCanvas'), '#a855f7');

      // Wave between Middle and Analyzer
      const midRad = (middleAngleDeg * Math.PI) / 180;
      const delta1 = ((middleAngleDeg - polarizer1AngleDeg) * Math.PI) / 180;
      const waveAmpMid = waveAmp2 * Math.abs(Math.cos(delta1));

      for (let x = xPMid + 10; x < xP2; x += 14) {
        const localPhase = phase - x * 0.08;
        const amp = Math.sin(localPhase) * waveAmpMid;

        const dx = -amp * Math.sin(midRad) * 0.5;
        const dy = -amp * Math.cos(midRad);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x + dx, centerY + dy);
        ctx.stroke();

        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(x + dx, centerY + dy, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // --- DRAW ANALYZER ---
    drawPolarizerPlate(ctx, xP2, centerY, analyzerAngleDeg, tI18n('experiments.polarization.analyzerCanvas'), '#10b981');

    // Section C: Transmitted wave after Analyzer
    const anaRad = (analyzerAngleDeg * Math.PI) / 180;
    const waveAmpFinal = waveAmp2 * eFieldAmplitudeRatio;

    for (let x = xP2 + 10; x < xTarget; x += 14) {
      const localPhase = phase - x * 0.08;
      const amp = Math.sin(localPhase) * waveAmpFinal;

      const dx = -amp * Math.sin(anaRad) * 0.5;
      const dy = -amp * Math.cos(anaRad);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = Math.max(waveAmpFinal * 0.08, 0.8);
      ctx.beginPath();
      ctx.moveTo(x, centerY);
      ctx.lineTo(x + dx, centerY + dy);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x + dx, centerY + dy, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Output Light Sensor / Target
    ctx.fillStyle = finalIntensity > 1 ? `rgba(16, 185, 129, ${Math.min(transmissionRatio + 0.2, 1.0)})` : '#27272a';
    ctx.fillRect(xTarget - 5, centerY - 35, 12, 70);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(xTarget - 5, centerY - 35, 12, 70);
  };

  const drawPolarizerPlate = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angleDeg: number,
    label: string,
    accentColor: string
  ) => {
    const plateW = 40;
    const plateH = 120;

    // Plate Holder
    ctx.fillStyle = 'rgba(39, 39, 42, 0.85)';
    ctx.fillRect(x - plateW / 2, y - plateH / 2, plateW, plateH);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - plateW / 2, y - plateH / 2, plateW, plateH);

    // Slits / Transmission Axis Lines
    const angleRad = (angleDeg * Math.PI) / 180;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;

    const lineLen = 30;
    for (let offset = -40; offset <= 40; offset += 15) {
      const cx = x;
      const cy = y + offset;
      ctx.beginPath();
      ctx.moveTo(cx - lineLen * Math.sin(angleRad), cy - lineLen * Math.cos(angleRad));
      ctx.lineTo(cx + lineLen * Math.sin(angleRad), cy + lineLen * Math.cos(angleRad));
      ctx.stroke();
    }

    // Transmission Axis Vector
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 22 * Math.sin(angleRad), y - 22 * Math.cos(angleRad));
    ctx.lineTo(x + 22 * Math.sin(angleRad), y + 22 * Math.cos(angleRad));
    ctx.stroke();

    // Plate Label
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${angleDeg}°`, x - 8, y + plateH / 2 + 15);
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'polarization',
      variableName: "Malus's Transmitted Light Intensity (I)",
      measuredValue: Number(finalIntensity.toFixed(2)),
      theoreticalValue: Number(finalIntensity.toFixed(2)),
      unit: 'W/m²',
      parameters: {
        'Incident Intensity I0': `${initialIntensity} W/m²`,
        'Polarizer 1 Angle': `${polarizer1AngleDeg}°`,
        'Analyzer Angle': `${analyzerAngleDeg}°`,
        'Angle Diff Δθ': `${relativeAngleDeg}°`,
        'Middle Polarizer': useMiddlePolarizer ? `Yes (${middleAngleDeg}°)` : 'None',
        'Transmission Fraction': `${(transmissionRatio * 100).toFixed(2)}%`,
      },
      equation: `I = I₁ · cos²(Δθ) = (${intensityAfterP1.toFixed(1)}) · cos²(${relativeAngleDeg}°) = ${finalIntensity.toFixed(2)} W/m²`,
      notes: `Malus's law polarization test. Transmission ratio = ${(transmissionRatio * 100).toFixed(1)}%.`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-sky-950/40 border border-amber-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Sun  className="w-5 h-5 text-amber-400"/>
            <span>
              {tI18n('experiments.polarization.title')}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.polarization.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
          >
            {isRunning ? <Pause  className="w-4 h-4"/> : <Play  className="w-4 h-4 text-emerald-400"/>}
          </button>
          <button
            onClick={handleLog}
           className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.polarization.logged') : tI18n('experiments.polarization.logMeasurement')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls + Interactive Wave Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Compass  className="w-4 h-4 text-amber-400"/>
              {tI18n('experiments.polarization.controlsTitle')}
            </span>
          </div>

          {/* Initial Intensity */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.polarization.incidentIntensityLabel')}</span>
              <span className="font-mono text-amber-400 font-semibold">{initialIntensity} W/m²</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={initialIntensity}
              onChange={(e) => setInitialIntensity(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Polarizer 1 Angle */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.polarization.p1AngleLabel')}</span>
              <span className="font-mono text-sky-400 font-semibold">{polarizer1AngleDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="5"
              value={polarizer1AngleDeg}
              onChange={(e) => setPolarizer1AngleDeg(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Analyzer Angle */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.polarization.p2AngleLabel')}</span>
              <span className="font-mono text-emerald-400 font-semibold">{analyzerAngleDeg}° (Δθ = {relativeAngleDeg}°)</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="5"
              value={analyzerAngleDeg}
              onChange={(e) => setAnalyzerAngleDeg(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Preset Angles */}
          <div>
            <span className="text-[10px] text-zinc-400 block mb-1.5">
              {tI18n('experiments.polarization.presetLabel')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { p1: 0, p2: 0, label: 'Parallel 0° (Max I)' },
                { p1: 0, p2: 45, label: '45° (50% I)' },
                { p1: 0, p2: 60, label: '60° (25% I)' },
                { p1: 0, p2: 90, label: 'Crossed 90° (0% I)' },
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPolarizer1AngleDeg(p.p1);
                    setAnalyzerAngleDeg(p.p2);
                  }}
                  className="min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700/60"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Polarizer Quantum Zeno / Cascade Toggle */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">
                {tI18n('experiments.polarization.middleFilterToggle')}
              </span>
              <input
                type="checkbox"
                checked={useMiddlePolarizer}
                onChange={(e) => setUseMiddlePolarizer(e.target.checked)}
                className="accent-purple-500 cursor-pointer w-4 h-4"
              />
            </div>

            {useMiddlePolarizer && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{tI18n('experiments.polarization.middleAngleLabel')}</span>
                  <span className="font-mono text-purple-400 font-semibold">{middleAngleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={middleAngleDeg}
                  onChange={(e) => setMiddleAngleDeg(Number(e.target.value))}
                  className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Canvas & Live Computed Metrics */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={380}
             className="w-full h-[380px] rounded-xl bg-zinc-950 block"/>
          </div>

          {/* Computed Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Transmitted Intensity */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-amber-950/40 border border-emerald-700/60 space-y-1">
              <span className="text-[10px] text-emerald-300 uppercase font-semibold">
                {tI18n('experiments.polarization.finalIntensityCard')}
              </span>
              <div className="text-xl font-bold font-mono text-emerald-300">
                {finalIntensity.toFixed(2)} <span className="text-sm text-zinc-400">W/m²</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">I = I₀ · cos²(θ)</span>
            </div>

            {/* Transmission Percentage */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.polarization.transmissionRatioCard')}
              </span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {(transmissionRatio * 100).toFixed(1)} <span className="text-sm text-zinc-400">%</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">I_out / I_in</span>
            </div>

            {/* E-field Amplitude */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.polarization.eFieldCard')}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {(eFieldAmplitudeRatio * 100).toFixed(1)} <span className="text-sm text-zinc-400">%</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">E = E₀ · cos(θ)</span>
            </div>

            {/* Extinction Ratio */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.polarization.extinctionCard')}
              </span>
              <div className="text-xs font-bold text-zinc-200 mt-1">
                {relativeAngleDeg === 90 && !useMiddlePolarizer
                  ? tI18n('experiments.polarization.crossedExtinction')
                  : relativeAngleDeg === 0
                  ? tI18n('experiments.polarization.maxParallel')
                  : tI18n('experiments.polarization.partialTransmission')}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Δθ = {relativeAngleDeg}°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}