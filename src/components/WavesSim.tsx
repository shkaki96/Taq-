import { Waves, Eye, Check, PlusCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (record: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function WavesSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
    const ctrl = (tI18n('controls', { returnObjects: true }) as any);

  // Parameters
  const [wavelengthNm, setWavelengthNm] = useState(532); // nm (400 to 700)
  const [slitDistanceMm, setSlitDistanceMm] = useState(0.25); // mm (0.1 to 0.8)
  const [screenDistanceM, setScreenDistanceM] = useState(1.5); // m (0.5 to 3.0)
  const [simMode, setSimMode] = useState<'doubleSlit' | 'rippleTank'>('doubleSlit');
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  // Theoretical Fringe Spacing Δy = (λ * L) / d
  // λ in m, L in m, d in m => Δy in m
  const lambdaM = wavelengthNm * 1e-9;
  const dM = slitDistanceMm * 1e-3;
  const LM = screenDistanceM;
  const fringeSpacingM = (lambdaM * LM) / dM;
  const fringeSpacingMm = fringeSpacingM * 1e3; // mm

  // Helper for wavelength color
  const getWavelengthColor = (nm: number) => {
    if (nm < 440) return '#8b5cf6'; // Violet
    if (nm < 490) return '#3b82f6'; // Blue
    if (nm < 560) return '#22c55e'; // Green
    if (nm < 590) return '#eab308'; // Yellow
    if (nm < 630) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const waveColor = getWavelengthColor(wavelengthNm);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      phaseRef.current += dt * 3.5;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (simMode === 'doubleSlit') {
        const slitX = 140;
        const screenX = w - 120;
        const midY = h / 2;
        const slitSeparationPx = slitDistanceMm * 120;

        // 1. Draw Coherent Light Source Beam
        ctx.fillStyle = waveColor;
        ctx.shadowColor = waveColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(10, midY - 60, 40, 120);
        ctx.shadowBlur = 0;

        // 2. Double Slit Barrier
        ctx.fillStyle = '#27272a';
        ctx.fillRect(slitX, 20, 14, h - 40);

        // Clear Slit 1 and Slit 2 apertures
        ctx.clearRect(slitX - 2, midY - slitSeparationPx / 2 - 4, 18, 8);
        ctx.clearRect(slitX - 2, midY + slitSeparationPx / 2 - 4, 18, 8);

        // Circular Wavefronts from each slit
        const numArcs = 12;
        const arcSpacing = 16;

        ctx.strokeStyle = waveColor;
        ctx.lineWidth = 1.2;

        for (let i = 0; i < numArcs; i++) {
          const r = ((i * arcSpacing + phaseRef.current * 18) % (numArcs * arcSpacing)) + 8;

          // Upper slit wave
          ctx.beginPath();
          ctx.arc(slitX + 7, midY - slitSeparationPx / 2, r, -Math.PI / 2.5, Math.PI / 2.5);
          ctx.stroke();

          // Lower slit wave
          ctx.beginPath();
          ctx.arc(slitX + 7, midY + slitSeparationPx / 2, r, -Math.PI / 2.5, Math.PI / 2.5);
          ctx.stroke();
        }

        // 3. Detector Screen at right
        ctx.fillStyle = '#09090b';
        ctx.fillRect(screenX, 20, 90, h - 40);
        ctx.strokeStyle = '#52525b';
        ctx.strokeRect(screenX, 20, 90, h - 40);

        // Draw Interference Intensity Pattern on the screen
        const screenHeight = h - 60;
        for (let py = 0; py < screenHeight; py += 2) {
          const yPos = (py - screenHeight / 2) * 0.002; // relative physical coordinate
          // Path difference delta = d * sin(theta) ≈ d * y / L
          const delta = (dM * yPos) / LM;
          const phaseDiff = (2 * Math.PI * delta) / lambdaM;
          // Intensity I = I0 * cos^2(phaseDiff / 2)
          const intensity = Math.pow(Math.cos(phaseDiff / 2), 2);

          ctx.fillStyle = waveColor;
          ctx.globalAlpha = intensity;
          ctx.fillRect(screenX + 4, 30 + py, 40, 2);

          // Intensity graph curve
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(screenX + 50 + intensity * 30, 30 + py, 2, 2);
        }
        ctx.globalAlpha = 1.0;

        // Labels
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('Double Slit (d)', slitX - 10, h - 10);
        ctx.fillText('Screen (L)', screenX + 15, h - 10);
      } else {
        // 2D Ripple Tank Wave Interference
        const src1X = w * 0.35;
        const src2X = w * 0.65;
        const srcY = h / 2;

        const imgData = ctx.createImageData(w, h);
        const data = imgData.data;
        const freq = 0.12;

        for (let y = 0; y < h; y += 4) {
          for (let x = 0; x < w; x += 4) {
            const d1 = Math.sqrt((x - src1X) ** 2 + (y - srcY) ** 2);
            const d2 = Math.sqrt((x - src2X) ** 2 + (y - srcY) ** 2);

            const val1 = Math.sin(d1 * freq - phaseRef.current * 3);
            const val2 = Math.sin(d2 * freq - phaseRef.current * 3);
            const combined = (val1 + val2) / 2; // -1 to 1

            const brightness = Math.floor(((combined + 1) / 2) * 200 + 20);

            for (let dy = 0; dy < 4 && y + dy < h; dy++) {
              for (let dx = 0; dx < 4 && x + dx < w; dx++) {
                const idx = ((y + dy) * w + (x + dx)) * 4;
                data[idx] = brightness * 0.2; // R
                data[idx + 1] = brightness * 0.7; // G
                data[idx + 2] = brightness; // B
                data[idx + 3] = 255;
              }
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);

        // Sources markers
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(src1X, srcY, 6, 0, Math.PI * 2);
        ctx.arc(src2X, srcY, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [wavelengthNm, slitDistanceMm, screenDistanceM, simMode, waveColor, dM, LM, lambdaM]);

  // Log measurement
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'waves',
      variableName: tI18n('experiments.waves.varFringeWidth'),
      measuredValue: Number(fringeSpacingMm.toFixed(3)),
      theoreticalValue: Number(fringeSpacingMm.toFixed(3)),
      unit: 'mm',
      parameters: {
        Wavelength: `${wavelengthNm} nm`,
        'Slit Separation (d)': `${slitDistanceMm} mm`,
        'Screen Distance (L)': `${screenDistanceM} m`,
        'Fringe Spacing (Δy)': `${fringeSpacingMm.toFixed(3)} mm`,
      },
      notes: tI18n('experiments.waves.notesText'),
    });

    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 2500);
  };

  return (
    <div id="waves-simulation" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{tI18n('experiments.waves.title')}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{tI18n('experiments.waves.shortDesc')}</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimMode('doubleSlit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              simMode === 'doubleSlit' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{tI18n('experiments.waves.doubleSlit')}</span>
          </button>
          <button
            onClick={() => setSimMode('rippleTank')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              simMode === 'rippleTank' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>{tI18n('experiments.waves.rippleTank')}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-inner flex flex-col items-center">
            <canvas
              ref={canvasRef}
              id="waves-canvas"
              width={650}
              height={380}
              className="w-full h-[380px] select-none"
            />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{tI18n('experiments.waves.fringeWidth')} (Δy)</span>
              <span className="text-xl font-bold text-sky-400 font-mono mt-0.5 block">
                {fringeSpacingMm.toFixed(3)} <span className="text-xs font-normal text-zinc-400">mm</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Δy = λL / d</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{tI18n('experiments.waves.wavelength')}</span>
              <span className="text-xl font-bold font-mono mt-0.5 block" style={{ color: waveColor }}>
                {wavelengthNm} <span className="text-xs font-normal text-zinc-400">nm</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{waveColor}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{tI18n('experiments.waves.slitDistance')}</span>
              <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">
                {slitDistanceMm} <span className="text-xs font-normal text-zinc-400">mm</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">d</span>
            </div>
          </div>
        </div>

        {/* Right: Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {tI18n('experiments.waves.youngSlitParams')}
            </h3>

            {/* Wavelength Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{tI18n('experiments.waves.wavelength')}</span>
                <span className="font-mono font-medium" style={{ color: waveColor }}>
                  {wavelengthNm} nm
                </span>
              </div>
              <input
                id="slider-wavelength"
                type="range"
                min="400"
                max="700"
                step="5"
                value={wavelengthNm}
                onChange={(e) => setWavelengthNm(Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slit Distance */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{tI18n('experiments.waves.slitDistance')}</span>
                <span className="font-mono text-amber-400 font-medium">{slitDistanceMm} mm</span>
              </div>
              <input
                id="slider-slit-distance"
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={slitDistanceMm}
                onChange={(e) => setSlitDistanceMm(Number(e.target.value))}
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Screen Distance */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{tI18n('experiments.waves.screenDistance')}</span>
                <span className="font-mono text-purple-400 font-medium">{screenDistanceM} m</span>
              </div>
              <input
                id="slider-screen-distance"
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={screenDistanceM}
                onChange={(e) => setScreenDistanceM(Number(e.target.value))}
                className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Log Button */}
          <button
            id="log-waves-btn"
            onClick={handleLog}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all active:scale-[0.98]"
          >
            {loggedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>{ctrl.loggedSuccess}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>{ctrl.logData}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}