import { TrendingUp, Pause, Play, BookmarkCheck, Sliders } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function RampMachineSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Inputs
  const [loadMassKg, setLoadMassKg] = useState<number>(20); // kg
  const [rampHeightM, setRampHeightM] = useState<number>(1.5); // m
  const [rampLengthM, setRampLengthM] = useState<number>(4.0); // m
  const [frictionCoeffMu, setFrictionCoeffMu] = useState<number>(0.15); // μ
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Dynamic box position along ramp [0 to 1]
  const boxProgressRef = useRef<number>(0.1);

  const g = 9.80665;
  const clampedHeight = Math.min(rampHeightM, rampLengthM * 0.95);
  const thetaRad = Math.asin(clampedHeight / rampLengthM);
  const thetaDeg = (thetaRad * 180) / Math.PI;

  const loadWeightN = loadMassKg * g; // Output Load Force
  const normalForceN = loadWeightN * Math.cos(thetaRad);
  const frictionForceN = frictionCoeffMu * normalForceN;

  // Effort Force required to pull load up incline
  const idealEffortN = loadWeightN * Math.sin(thetaRad);
  const actualEffortN = idealEffortN + frictionForceN;

  // Mechanical Advantage & Work
  const ima = rampLengthM / clampedHeight; // L / h = 1 / sin(θ)
  const ama = loadWeightN / actualEffortN;
  const workOutputJ = loadWeightN * clampedHeight; // m * g * h
  const workInputJ = actualEffortN * rampLengthM; // F_effort * L
  const efficiencyPercent = (workOutputJ / workInputJ) * 100;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRunning) {
        boxProgressRef.current += dt * 0.25;
        if (boxProgressRef.current > 0.95) {
          boxProgressRef.current = 0.05;
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          drawInclinedRamp(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [loadMassKg, rampHeightM, rampLengthM, frictionCoeffMu, isRunning, thetaRad, clampedHeight]);

  const drawInclinedRamp = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

    const groundY = height * 0.78;
    const rampStartX = 90;
    const rampW = 380;
    const rampTopY = groundY - (clampedHeight / 2.5) * 160;
    const rampEndX = rampStartX + rampW;

    // 1. Ramp Triangular Wedge
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(rampStartX, groundY);
    ctx.lineTo(rampEndX, groundY);
    ctx.lineTo(rampEndX, rampTopY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Height Marker Line h
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rampEndX + 15, groundY);
    ctx.lineTo(rampEndX + 15, rampTopY);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`h = ${clampedHeight.toFixed(2)} m`, rampEndX + 22, (groundY + rampTopY) / 2);

    // Length / Incline Incline Slope Marker L
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`L = ${rampLengthM.toFixed(1)} m`, (rampStartX + rampEndX) / 2 - 30, (groundY + rampTopY) / 2 - 25);

    // Angle Arc θ
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rampStartX, groundY, 45, -thetaRad, 0);
    ctx.stroke();

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`θ = ${thetaDeg.toFixed(1)}°`, rampStartX + 52, groundY - 10);

    // 2. Sliding Box Load on Ramp Surface
    const prog = boxProgressRef.current;
    const boxX = rampStartX + prog * (rampEndX - rampStartX);
    const boxY = groundY - prog * (groundY - rampTopY);

    ctx.save();
    ctx.translate(boxX, boxY);
    ctx.rotate(-thetaRad);

    const boxSize = 42;
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(-boxSize / 2, -boxSize, boxSize, boxSize);
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2;
    ctx.strokeRect(-boxSize / 2, -boxSize, boxSize, boxSize);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${loadMassKg}kg`, -14, -boxSize / 2 + 4);

    // Pulling Effort Vector along ramp
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(boxSize / 2, -boxSize / 2);
    ctx.lineTo(boxSize / 2 + 50, -boxSize / 2);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(boxSize / 2 + 55, -boxSize / 2);
    ctx.lineTo(boxSize / 2 + 48, -boxSize / 2 - 4);
    ctx.lineTo(boxSize / 2 + 48, -boxSize / 2 + 4);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 9px monospace';
    ctx.fillText(`F_eff = ${actualEffortN.toFixed(0)}N`, boxSize / 2 + 6, -boxSize / 2 - 8);

    ctx.restore();
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'ramp_machine',
      variableName: 'Mechanical Advantage & Efficiency (Inclined Ramp)',
      measuredValue: Number(efficiencyPercent.toFixed(1)),
      theoreticalValue: Number(((ima > 0 ? (ama / ima) * 100 : 100)).toFixed(1)),
      unit: '% Efficiency',
      parameters: {
        'Load Mass m': `${loadMassKg} kg`,
        'Load Weight W_load': `${loadWeightN.toFixed(1)} N`,
        'Ramp Height h': `${clampedHeight.toFixed(2)} m`,
        'Ramp Length L': `${rampLengthM.toFixed(1)} m`,
        'Incline Angle θ': `${thetaDeg.toFixed(1)}°`,
        'Friction Coeff μ': frictionCoeffMu,
        'Ideal Effort Force': `${idealEffortN.toFixed(1)} N`,
        'Actual Effort Force': `${actualEffortN.toFixed(1)} N`,
        'Work Output W_out': `${workOutputJ.toFixed(1)} J`,
        'Work Input W_in': `${workInputJ.toFixed(1)} J`,
        'Ideal Advantage IMA': `${ima.toFixed(2)}`,
        'Actual Advantage AMA': `${ama.toFixed(2)}`,
        'Machine Efficiency η': `${efficiencyPercent.toFixed(1)}%`,
      },
      equation: `IMA = L/h = ${ima.toFixed(2)}, AMA = F_load / F_effort = ${ama.toFixed(2)}, η = (W_out / W_in) · 100% = ${efficiencyPercent.toFixed(1)}%`,
      notes: `Inclined plane simple machine mechanics experiment testing force multiplication, work conservation, and mechanical efficiency with friction.`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-indigo-950/40 border border-emerald-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <TrendingUp  className="w-5 h-5 text-emerald-400"/>
            <span>{tI18n('experiments.ramp_machine.title')}</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">{tI18n('experiments.ramp_machine.desc')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center"
          >
            {isRunning ? <Pause  className="w-4 h-4"/> : <Play  className="w-4 h-4 text-emerald-400"/>}
          </button>
          <button
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' }`}
          >
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.ramp_machine.logged') : tI18n('experiments.ramp_machine.log')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-emerald-400"/>
              {tI18n('experiments.ramp_machine.controlsTitle')}
            </span>
          </div>

          {/* Load Mass Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.ramp_machine.loadMass')}</span>
              <span className="font-mono text-indigo-400 font-semibold">{loadMassKg} kg</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={loadMassKg}
              onChange={(e) => setLoadMassKg(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Ramp Height Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.ramp_machine.rampHeight')}</span>
              <span className="font-mono text-amber-400 font-semibold">{clampedHeight.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={rampHeightM}
              onChange={(e) => setRampHeightM(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Ramp Length Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.ramp_machine.rampLength')}</span>
              <span className="font-mono text-sky-400 font-semibold">{rampLengthM.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="8.0"
              step="0.5"
              value={rampLengthM}
              onChange={(e) => setRampLengthM(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Friction Coefficient Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.ramp_machine.frictionCoeff')}</span>
              <span className="font-mono text-rose-400 font-semibold">{frictionCoeffMu.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.6"
              step="0.05"
              value={frictionCoeffMu}
              onChange={(e) => setFrictionCoeffMu(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
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
            {/* Actual Effort Force */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.ramp_machine.effortForce')}
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {actualEffortN.toFixed(1)} <span className="text-sm text-zinc-400">N</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Ideal: {idealEffortN.toFixed(1)} N</span>
            </div>

            {/* Ideal Mech Adv (IMA) */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.ramp_machine.ima')}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {ima.toFixed(2)}x
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">IMA = L / h</span>
            </div>

            {/* Actual Mech Adv (AMA) */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.ramp_machine.ama')}
              </span>
              <div className="text-xl font-bold font-mono text-indigo-400">
                {ama.toFixed(2)}x
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">F_load / F_effort</span>
            </div>

            {/* Efficiency % */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.ramp_machine.efficiency')}
              </span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {efficiencyPercent.toFixed(1)}%
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">W_out / W_in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}