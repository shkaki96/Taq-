import { Zap, Pause, Play, BookmarkCheck, Sliders } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function ElectromagneticInductionSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Inputs
  const [coilTurnsN, setCoilTurnsN] = useState<number>(50); // turns
  const [magnetSpeedMps, setMagnetSpeedMps] = useState<number>(1.2); // m/s
  const [magneticFieldTesla, setMagneticFieldTesla] = useState<number>(0.5); // T
  const [coilResistanceOhm, setCoilResistanceOhm] = useState<number>(10); // Ω
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Dynamic magnet position & speed
  const magnetPosRef = useRef<number>(180); // px
  const magnetDirRef = useRef<number>(1); // 1 = right, -1 = left

  // Coil physical properties (Radius r = 0.03 m, Area A = π·r²)
  const coilRadiusM = 0.035;
  const coilAreaM2 = Math.PI * coilRadiusM * coilRadiusM;

  // Maximum Induced EMF: ε = N * B * A * (v / coil_width)
  // When magnet plunges through coil center at speed v
  const maxEmfVolts = (coilTurnsN * magneticFieldTesla * coilAreaM2 * magnetSpeedMps * 20);
  const maxCurrentMilliAmps = coilResistanceOhm > 0 ? (maxEmfVolts / coilResistanceOhm) * 1000 : 0;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentEmfRef = useRef<number>(0);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRunning) {
        // Move magnet back and forth through coil
        const coilCenterX = 340;
        magnetPosRef.current += magnetDirRef.current * magnetSpeedMps * dt * 160;

        if (magnetPosRef.current > coilCenterX + 160) {
          magnetDirRef.current = -1;
        } else if (magnetPosRef.current < coilCenterX - 160) {
          magnetDirRef.current = 1;
        }

        // Induced EMF depends on proximity to coil and velocity direction
        const distFromCenter = magnetPosRef.current - coilCenterX;
        const fluxGradient = Math.exp(-Math.pow(distFromCenter / 45, 2)) * (-distFromCenter / 45);
        currentEmfRef.current = -coilTurnsN * magneticFieldTesla * magnetDirRef.current * magnetSpeedMps * fluxGradient * 0.15;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          drawFaradayInduction(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [coilTurnsN, magnetSpeedMps, magneticFieldTesla, coilResistanceOhm, isRunning]);

  const drawFaradayInduction = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Dark Background & Grid
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

    const centerY = height * 0.48;
    const coilCenterX = 340;
    const coilW = 110;
    const coilH = 90;

    // 1. Galvanometer & Circuit at Bottom
    const galvX = coilCenterX;
    const galvY = height * 0.84;
    const galvR = 42;

    // Connecting wires from coil to galvanometer
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(coilCenterX - coilW / 2 + 10, centerY + coilH / 2);
    ctx.lineTo(coilCenterX - coilW / 2 + 10, galvY);
    ctx.lineTo(galvX - galvR, galvY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(coilCenterX + coilW / 2 - 10, centerY + coilH / 2);
    ctx.lineTo(coilCenterX + coilW / 2 - 10, galvY);
    ctx.lineTo(galvX + galvR, galvY);
    ctx.stroke();

    // Galvanometer Dial Body
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(galvX, galvY, galvR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dial Scale Arc
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(galvX, galvY + 15, 30, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    // Galvanometer Needle (Deflects with induced EMF)
    const emfInstant = currentEmfRef.current;
    const needleAngle = -Math.PI / 2 + (emfInstant / (maxEmfVolts || 1)) * (Math.PI / 4);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(galvX, galvY + 15);
    ctx.lineTo(galvX + Math.cos(needleAngle) * 32, galvY + 15 + Math.sin(needleAngle) * 32);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(galvX, galvY + 15, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('G (Galvanometer)', galvX - 45, galvY + 38);

    // Lightbulb / LED indicator in circuit
    const bulbX = galvX - 90;
    const bulbY = galvY;
    const bulbGlow = Math.min(Math.abs(emfInstant) / (maxEmfVolts * 0.3 || 1), 1);

    ctx.fillStyle = `rgba(234, 179, 8, ${0.15 + bulbGlow * 0.8})`;
    ctx.beginPath();
    ctx.arc(bulbX, bulbY, 14, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.fillText('LED', bulbX - 8, bulbY + 4);

    // 2. Solenoid Wire Loops (Coil)
    const numLoopsToDraw = Math.min(Math.max(Math.floor(coilTurnsN / 5), 6), 24);
    const loopSpacing = coilW / numLoopsToDraw;

    for (let i = 0; i < numLoopsToDraw; i++) {
      const lx = coilCenterX - coilW / 2 + i * loopSpacing;
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(lx, centerY, 6, coilH / 2, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`N = ${coilTurnsN} لفّة`, coilCenterX - 35, centerY - coilH / 2 - 12);

    // 3. Moving Bar Magnet (North Red / South Blue)
    const magX = magnetPosRef.current;
    const magW = 100;
    const magH = 34;

    // South Pole (Blue)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(magX - magW / 2, centerY - magH / 2, magW / 2, magH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(magX - magW / 2, centerY - magH / 2, magW / 2, magH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('S', magX - magW / 2 + 18, centerY + 4);

    // North Pole (Red)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(magX, centerY - magH / 2, magW / 2, magH);
    ctx.strokeStyle = '#f87171';
    ctx.strokeRect(magX, centerY - magH / 2, magW / 2, magH);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('N', magX + 20, centerY + 4);

    // Magnetic Field Lines emerging from North Pole to South
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);

    for (let offset = -18; offset <= 18; offset += 12) {
      ctx.beginPath();
      ctx.moveTo(magX + magW / 2, centerY + offset);
      ctx.quadraticCurveTo(magX + magW / 2 + 35, centerY + offset * 2.5, magX - magW / 2, centerY + offset);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Velocity Vector on Magnet
    const velArrowLen = magnetSpeedMps * 25 * magnetDirRef.current;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(magX, centerY - magH / 2 - 12);
    ctx.lineTo(magX + velArrowLen, centerY - magH / 2 - 12);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(magX + velArrowLen + (magnetDirRef.current > 0 ? 5 : -5), centerY - magH / 2 - 12);
    ctx.lineTo(magX + velArrowLen, centerY - magH / 2 - 16);
    ctx.lineTo(magX + velArrowLen, centerY - magH / 2 - 8);
    ctx.closePath();
    ctx.fill();
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'electromagnetic_induction',
      variableName: tI18n('experiments.electromagnetic_induction.variableName'),
      measuredValue: Number(maxEmfVolts.toFixed(3)),
      theoreticalValue: Number((coilTurnsN * magneticFieldTesla * coilAreaM2 * magnetSpeedMps * 20).toFixed(3)),
      unit: 'Volts (V)',
      parameters: {
        'Coil Turns N': coilTurnsN,
        'Magnet Speed v': `${magnetSpeedMps} m/s`,
        'Magnetic Field B': `${magneticFieldTesla} Tesla`,
        'Coil Resistance R': `${coilResistanceOhm} Ω`,
        'Peak Induced EMF ε': `${maxEmfVolts.toFixed(3)} V`,
        'Peak Induced Current I': `${maxCurrentMilliAmps.toFixed(1)} mA`,
      },
      equation: `ε = -N · (dΦ_B / dt) = -N · A · (dB/dt) ≈ ${maxEmfVolts.toFixed(3)} V, I = ε / R = ${maxCurrentMilliAmps.toFixed(1)} mA`,
      notes: tI18n('experiments.electromagnetic_induction.notes'),
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-950/40 via-zinc-900 to-amber-950/40 border border-yellow-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Zap  className="w-5 h-5 text-yellow-400"/>
            <span>
              {tI18n('experiments.electromagnetic_induction.title')}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.electromagnetic_induction.desc')}
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
            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-600/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.electromagnetic_induction.loggedSuccess') : tI18n('experiments.electromagnetic_induction.logData')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-yellow-400"/>
              {tI18n('experiments.electromagnetic_induction.controlsTitle')}
            </span>
          </div>

          {/* Coil Turns Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.electromagnetic_induction.coilTurns')}</span>
              <span className="font-mono text-yellow-400 font-semibold">{coilTurnsN} {tI18n('experiments.electromagnetic_induction.turnsSuffix')}</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={coilTurnsN}
              onChange={(e) => setCoilTurnsN(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          {/* Magnet Speed Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.electromagnetic_induction.magnetSpeed')}</span>
              <span className="font-mono text-emerald-400 font-semibold">{magnetSpeedMps.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.2"
              value={magnetSpeedMps}
              onChange={(e) => setMagnetSpeedMps(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Magnetic Field Strength Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.electromagnetic_induction.magneticField')}</span>
              <span className="font-mono text-rose-400 font-semibold">{magneticFieldTesla.toFixed(2)} T</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={magneticFieldTesla}
              onChange={(e) => setMagneticFieldTesla(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Coil Resistance Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.electromagnetic_induction.coilResistance')}</span>
              <span className="font-mono text-sky-400 font-semibold">{coilResistanceOhm} Ω</span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="2"
              value={coilResistanceOhm}
              onChange={(e) => setCoilResistanceOhm(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>

        {/* Canvas & Computed Bento Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={360}
             className="w-full h-[360px] rounded-xl bg-zinc-950 block shadow-inner"/>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Peak EMF */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.electromagnetic_induction.inducedEmf')}
              </span>
              <div className="text-xl font-bold font-mono text-yellow-400">
                {maxEmfVolts.toFixed(3)} <span className="text-sm text-zinc-400">V</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">ε = -N · ΔΦ/Δt</span>
            </div>

            {/* Induced Current */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.electromagnetic_induction.inducedCurrent')}
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {maxCurrentMilliAmps.toFixed(1)} <span className="text-sm text-zinc-400">mA</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">I = ε / R</span>
            </div>

            {/* Magnetic Flux Rate */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.electromagnetic_induction.fluxChangeRate')}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {(magneticFieldTesla * magnetSpeedMps * 0.1).toFixed(3)} <span className="text-sm text-zinc-400">Wb/s</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">B · v · A</span>
            </div>

            {/* Coil Turns N */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.electromagnetic_induction.coilLoopsLabel')}
              </span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {coilTurnsN} <span className="text-sm text-zinc-400">{tI18n('experiments.electromagnetic_induction.turnsSuffix')}</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Solenoid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}