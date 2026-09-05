import { Flame, Pause, Play, BookmarkCheck, Sliders } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function WorkHeatSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Inputs
  const [waterMassKg, setWaterMassKg] = useState<number>(1.0); // kg
  const [appliedForceN, setAppliedForceN] = useState<number>(200); // N (paddle wheel or piston force)
  const [displacementM, setDisplacementM] = useState<number>(5.0); // m
  const [burnerHeatJ, setBurnerHeatJ] = useState<number>(3000); // J (added thermal heat Q)
  const [initialTempC, setInitialTempC] = useState<number>(20); // °C

  // Simulation running state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simProgress, setSimProgress] = useState<number>(1.0); // 0 to 1
  const [logged, setLogged] = useState<boolean>(false);

  // Constants
  const specificHeatWater = 4184; // J/(kg·°C)

  // Physics Calculations
  // Mechanical Work W = F * d
  const mechanicalWorkJ = appliedForceN * displacementM;

  // First Law of Thermodynamics: ΔU = Q - W_by_system (or ΔU = Q_in + W_on_system)
  // Work done ON the water by falling weight / paddle wheel: W_in = mechanicalWorkJ
  const totalEnergyAddedJ = (burnerHeatJ + mechanicalWorkJ) * simProgress;
  const deltaTempC = waterMassKg > 0 ? totalEnergyAddedJ / (waterMassKg * specificHeatWater) : 0;
  const currentTempC = initialTempC + deltaTempC;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const paddleAngleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
        drawApparatus(ctx, canvas.width, canvas.height);
      }
    }

    if (!isRunning) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      paddleAngleRef.current += dt * (appliedForceN > 0 ? 3.5 : 0.5);

      setSimProgress((prev) => {
        const next = prev + dt * 0.2; // complete in 5 seconds
        if (next >= 1.0) {
          setIsRunning(false);
          return 1.0;
        }
        return next;
      });

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          drawApparatus(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, waterMassKg, appliedForceN, displacementM, burnerHeatJ, lang]); // Removed simProgress & currentTempC from deps

  const drawApparatus = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

    // Calorimeter Chamber Center
    const calX = width * 0.48;
    const calY = height * 0.50;
    const calW = 180;
    const calH = 200;

    // 1. Burner beneath calorimeter
    const burnerY = calY + calH / 2 + 25;
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(calX - 35, burnerY, 70, 15);
    ctx.strokeStyle = '#71717a';
    ctx.strokeRect(calX - 35, burnerY, 70, 15);

    if (burnerHeatJ > 0 && isRunning) {
      // Dynamic animated flame
      const flameH = 20 + Math.sin(performance.now() * 0.01) * 6;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.beginPath();
      ctx.moveTo(calX - 25, burnerY);
      ctx.quadraticCurveTo(calX, burnerY - flameH * 1.3, calX + 25, burnerY);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(calX - 14, burnerY);
      ctx.quadraticCurveTo(calX, burnerY - flameH * 0.8, calX + 14, burnerY);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`Q = ${burnerHeatJ} J`, calX - 30, burnerY + 30);
    }

    // 2. Insulated Tank Container
    ctx.fillStyle = '#18181b';
    ctx.fillRect(calX - calW / 2 - 8, calY - calH / 2 - 8, calW + 16, calH + 16);
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 3;
    ctx.strokeRect(calX - calW / 2 - 8, calY - calH / 2 - 8, calW + 16, calH + 16);

    // Water Liquid Inside Container
    // Liquid color gets slightly warmer as temp increases
    const tempRatio = Math.min(Math.max((currentTempC - 20) / 40, 0), 1);
    const waterR = Math.floor(14 + tempRatio * 180);
    const waterG = Math.floor(116 - tempRatio * 40);
    const waterB = Math.floor(144 - tempRatio * 60);

    ctx.fillStyle = `rgba(${waterR}, ${waterG}, ${waterB}, 0.75)`;
    ctx.fillRect(calX - calW / 2, calY - calH / 2 + 30, calW, calH - 30);

    // Liquid surface meniscus
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(calX - calW / 2, calY - calH / 2 + 30);
    ctx.lineTo(calX + calW / 2, calY - calH / 2 + 30);
    ctx.stroke();

    // 3. Central Rotating Paddle Wheel (Joule Apparatus)
    const shaftX = calX;
    const shaftTopY = calY - calH / 2 - 35;
    const shaftBotY = calY + calH / 4;

    // Shaft
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shaftX, shaftTopY);
    ctx.lineTo(shaftX, shaftBotY);
    ctx.stroke();

    // Pulley wheel on top
    ctx.fillStyle = '#71717a';
    ctx.beginPath();
    ctx.arc(shaftX, shaftTopY, 18, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#a1a1aa';
    ctx.stroke();

    // Paddle Blades in water (rotating)
    const paddleAngle = paddleAngleRef.current;
    const paddleCenterY = calY + 15;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;

    for (let i = 0; i < 4; i++) {
      const a = paddleAngle + (i * Math.PI) / 2;
      const bx = shaftX + Math.cos(a) * 35;
      const by = paddleCenterY + Math.sin(a) * 18;
      ctx.beginPath();
      ctx.moveTo(shaftX, paddleCenterY);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Blade fins
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx - 4, by - 6, 8, 12);
    }

    // 4. Pulley Cord & Falling Weight on the Left (Mechanical Work F * d)
    const weightX = 70;
    const weightY = calY - 30 + Math.sin(paddleAngle * 0.3) * 15;

    // String from pulley over to weight
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(shaftX, shaftTopY);
    ctx.lineTo(weightX, shaftTopY);
    ctx.lineTo(weightX, weightY);
    ctx.stroke();

    // Guide pulley at corner
    ctx.fillStyle = '#52525b';
    ctx.beginPath();
    ctx.arc(weightX, shaftTopY, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Suspended Mass Block
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(weightX - 20, weightY, 40, 35);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(weightX - 20, weightY, 40, 35);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`${appliedForceN}N`, weightX - 12, weightY + 18);
    ctx.fillText(`d=${displacementM}m`, weightX - 16, weightY + 30);

    // 5. Thermometer on the Right
    const thX = calX + calW / 2 - 25;
    const thY = calY - calH / 2 + 10;
    const thH = 150;

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(thX - 4, thY, 8, thH);
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(thX - 4, thY, 8, thH);

    // Mercury mercury column
    const mercuryH = Math.min((currentTempC / 100) * (thH - 20), thH - 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(thX - 3, thY + thH - mercuryH, 6, mercuryH);

    // Thermometer bulb
    ctx.beginPath();
    ctx.arc(thX, thY + thH, 9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.stroke();

    // Temperature Badge
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${currentTempC.toFixed(2)} °C`, thX - 20, thY - 8);
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'work_heat',
      variableName: 'Internal Energy Rise ΔU (Work & Heat)',
      measuredValue: Number(totalEnergyAddedJ.toFixed(2)),
      theoreticalValue: Number((burnerHeatJ + mechanicalWorkJ).toFixed(2)),
      unit: 'J',
      parameters: {
        'Water Mass m': `${waterMassKg} kg`,
        'Work Force F': `${appliedForceN} N`,
        'Displacement d': `${displacementM} m`,
        'Mechanical Work W': `${mechanicalWorkJ} J`,
        'Heat Added Q': `${burnerHeatJ} J`,
        'Initial Temp T0': `${initialTempC} °C`,
        'Final Temp Tf': `${currentTempC.toFixed(2)} °C`,
        'Temp Rise ΔT': `${deltaTempC.toFixed(3)} °C`,
      },
      equation: `ΔU = Q + W = ${burnerHeatJ} J + (${appliedForceN} N · ${displacementM} m) = ${totalEnergyAddedJ.toFixed(0)} J, ΔT = ΔU / (m·c) = ${deltaTempC.toFixed(3)} °C`,
      notes: `Mechanical equivalent of heat & First Law of Thermodynamics experiment. Water specific heat c = 4184 J/(kg·°C).`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-rose-950/40 border border-amber-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>
              {tI18n('experiments.work_heat.title')}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.work_heat.description')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isRunning && simProgress >= 1.0) setSimProgress(0);
              setIsRunning(!isRunning);
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={handleLog}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
              logged
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{logged ? tI18n('experiments.work_heat.loggedSuccess') : tI18n('experiments.work_heat.logButton')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Apparatus FIRST, then Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas & Live Computed Metrics (ORDER 1 on mobile, 8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-4 order-1 lg:order-2">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={380}
              className="w-full h-[380px] rounded-xl bg-zinc-950 block shadow-inner"
            />
          </div>

          {/* Computed Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Energy Added ΔU */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-zinc-900 to-rose-950/40 border border-amber-700/60 space-y-1">
              <span className="text-[10px] text-amber-300 uppercase font-semibold">
                {tI18n('experiments.work_heat.internalEnergy')}
              </span>
              <div className="text-xl font-bold font-mono text-amber-300">
                {totalEnergyAddedJ.toFixed(0)} <span className="text-xs text-zinc-400">J</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">ΔU = Q + W</span>
            </div>

            {/* Mechanical Work W */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.work_heat.mechanicalWork')}
              </span>
              <div className="text-xl font-bold font-mono text-indigo-400">
                {mechanicalWorkJ.toFixed(0)} <span className="text-xs text-zinc-400">J</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">W = F · d</span>
            </div>

            {/* Heat Added Q */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.work_heat.thermalHeat')}
              </span>
              <div className="text-xl font-bold font-mono text-rose-400">
                {burnerHeatJ.toFixed(0)} <span className="text-xs text-zinc-400">J</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Q = m · c · ΔT</span>
            </div>

            {/* Final Temperature */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.work_heat.finalTemperature')}
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {currentTempC.toFixed(2)} <span className="text-xs text-zinc-400">°C</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">ΔT = +{deltaTempC.toFixed(2)} °C</span>
            </div>
          </div>
        </div>

        {/* Controls Panel (ORDER 2 on mobile, 4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 order-2 lg:order-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              {tI18n('experiments.work_heat.workHeatParameters')}
            </span>
          </div>

          {/* Water Mass Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.work_heat.waterMass')}</span>
              <span className="font-mono text-sky-400 font-semibold">{waterMassKg.toFixed(1)} kg</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.1"
              value={waterMassKg}
              onChange={(e) => setWaterMassKg(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Mechanical Force Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.work_heat.mechanicalForce')}</span>
              <span className="font-mono text-indigo-400 font-semibold">{appliedForceN} N</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={appliedForceN}
              onChange={(e) => setAppliedForceN(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Displacement Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.work_heat.displacement')}</span>
              <span className="font-mono text-indigo-300 font-semibold">{displacementM.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={displacementM}
              onChange={(e) => setDisplacementM(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Burner Thermal Heat (Q) Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.work_heat.addedHeat')}</span>
              <span className="font-mono text-rose-400 font-semibold">{burnerHeatJ} J</span>
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="200"
              value={burnerHeatJ}
              onChange={(e) => setBurnerHeatJ(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Initial Temperature */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.work_heat.initialTemp')}</span>
              <span className="font-mono text-emerald-400 font-semibold">{initialTempC} °C</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={initialTempC}
              onChange={(e) => setInitialTempC(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[10px] text-zinc-400 block mb-1.5">
              {tI18n('experiments.work_heat.standardPresets')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setAppliedForceN(400);
                  setDisplacementM(10);
                  setBurnerHeatJ(0);
                  setSimProgress(0);
                  setIsRunning(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700/60"
              >
                {tI18n('experiments.work_heat.pureWork')}
              </button>
              <button
                onClick={() => {
                  setAppliedForceN(0);
                  setDisplacementM(0);
                  setBurnerHeatJ(5000);
                  setSimProgress(0);
                  setIsRunning(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700/60"
              >
                {tI18n('experiments.work_heat.pureHeat')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}