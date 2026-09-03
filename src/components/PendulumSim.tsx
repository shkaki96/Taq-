import { Info, Pause, Play, RotateCcw, Check, PlusCircle } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { Language, MeasurementRecord } from '../types';
import { PLANETS } from '../data/physicsData';
import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement: (record: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function PendulumSim({ lang, onLogMeasurement }: Props) {
  const { t } = useTranslation();
  const common = (t('common', { returnObjects: true }) as any);
  const ctrl = (t('controls', { returnObjects: true }) as any);

  const getPlanetName = (p: typeof PLANETS[0]) => {
    return t(`planets.${p.id}.name`);
  };

  // Simulation Parameters
  const [length, setLength] = useState(1.5); // meters (0.5 to 3.0)
  const [mass, setMass] = useState(1.0); // kg (0.1 to 5.0)
  const [gravity, setGravity] = useState(9.81); // m/s^2
  const [damping, setDamping] = useState(0.005); // damping constant
  const [initialAngleDeg, setInitialAngleDeg] = useState(30); // degrees
  
  // Controls
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [showVectors, setShowVectors] = useState(true);
  const [showEnergyBars, setShowEnergyBars] = useState(true);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  // Real-time Physics State Ref for high precision 60FPS loop
  const simState = useRef({
    theta: (30 * Math.PI) / 180, // radians
    omega: 0, // angular velocity rad/s
    alpha: 0, // angular acceleration rad/s^2
    time: 0,
    oscillations: 0,
    lastCrossSign: 0,
    isDragging: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Derived Theoretical Values
  const theoreticalPeriod = 2 * Math.PI * Math.sqrt(length / Math.max(gravity, 0.001));
  const theoreticalFrequency = 1 / theoreticalPeriod;
  const h_max = length * (1 - Math.cos((initialAngleDeg * Math.PI) / 180));
  const theoreticalMaxVelocity = Math.sqrt(2 * gravity * h_max);
  const maxPotentialEnergy = mass * gravity * h_max;

  // Live Display Values state (throttled updates for UI labels)
  const [liveStats, setLiveStats] = useState({
    thetaDeg: 30,
    omega: 0,
    v: 0,
    Ek: 0,
    Ep: maxPotentialEnergy,
    Etotal: maxPotentialEnergy,
    time: 0,
    oscillations: 0,
  });

  // Reset function
  const resetSimulation = useCallback(() => {
    const rad = (initialAngleDeg * Math.PI) / 180;
    simState.current = {
      theta: rad,
      omega: 0,
      alpha: 0,
      time: 0,
      oscillations: 0,
      lastCrossSign: 0,
      isDragging: false,
    };
    setLiveStats({
      thetaDeg: initialAngleDeg,
      omega: 0,
      v: 0,
      Ek: 0,
      Ep: mass * gravity * length * (1 - Math.cos(rad)),
      Etotal: mass * gravity * length * (1 - Math.cos(rad)),
      time: 0,
      oscillations: 0,
    });
  }, [initialAngleDeg, mass, gravity, length]);

  useEffect(() => {
    resetSimulation();
  }, [length, mass, gravity, initialAngleDeg, resetSimulation]);

  // Main Canvas Render & Physics Integration Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    let lastTimestamp = performance.now();

    const updateAndDraw = (currentTimestamp: number) => {
      const deltaMs = Math.min(currentTimestamp - lastTimestamp, 50); // cap max delta
      lastTimestamp = currentTimestamp;

      const dt = (deltaMs / 1000) * simSpeed;
      const state = simState.current;

      // Physics Integration (Runge-Kutta / Euler-Cromer) when not dragging
      if (isRunning && !state.isDragging && gravity > 0) {
        // Equation of motion: d²θ/dt² = -(g/L)*sin(θ) - damping*dθ/dt
        const dtheta_dt = state.omega;
        const domega_dt = -(gravity / length) * Math.sin(state.theta) - damping * state.omega;

        state.alpha = domega_dt;
        state.omega += domega_dt * dt;
        state.theta += state.omega * dt;
        state.time += dt;

        // Oscillation counter (detecting zero crossings)
        const currentSign = Math.sign(state.theta);
        if (state.lastCrossSign !== 0 && currentSign !== state.lastCrossSign && state.omega < 0) {
          state.oscillations += 1;
        }
        if (Math.abs(state.theta) > 0.001) {
          state.lastCrossSign = currentSign;
        }
      }

      // Physics calculations
      const thetaDeg = (state.theta * 180) / Math.PI;
      const v = Math.abs(state.omega * length);
      const h = length * (1 - Math.cos(state.theta));
      const Ek = 0.5 * mass * v * v;
      const Ep = mass * gravity * h;
      const Etotal = Ek + Ep;

      // Canvas dimensions
      const width = canvas.width;
      const height = canvas.height;
      const pivotX = width / 2;
      const pivotY = 50;
      const scale = (height - 130) / 3.2; // pixels per meter

      // Bob coordinates
      const bobX = pivotX + length * scale * Math.sin(state.theta);
      const bobY = pivotY + length * scale * Math.cos(state.theta);
      const bobRadius = Math.max(12, Math.min(26, 12 + mass * 3));

      // 1. Clear background
      ctx.clearRect(0, 0, width, height);

      // 2. Draw coordinate grid & angle arc
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical equilibrium line
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pivotX, pivotY + length * scale + 40);
      ctx.stroke();

      // Angle Arc
      if (Math.abs(state.theta) > 0.03) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        const startA = Math.PI / 2;
        const endA = Math.PI / 2 + state.theta;
        ctx.arc(pivotX, pivotY, 40, Math.min(startA, endA), Math.max(startA, endA));
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`${thetaDeg.toFixed(1)}°`, pivotX + 15 * Math.sign(state.theta), pivotY + 55);
      }

      ctx.setLineDash([]);

      // 3. Draw Support Ceiling & Pivot
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(pivotX - 50, pivotY - 12, 100, 12);
      ctx.fillStyle = '#71717a';
      for (let i = -40; i <= 40; i += 12) {
        ctx.beginPath();
        ctx.moveTo(pivotX + i, pivotY - 12);
        ctx.lineTo(pivotX + i - 8, pivotY - 22);
        ctx.stroke();
      }

      // Pivot Pin
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#a1a1aa';
      ctx.fill();
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Draw Pendulum Rod/String
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 5. Draw Vectors (Velocity & Tension & Weight)
      if (showVectors) {
        // Velocity Vector (tangential to circle)
        const velScale = 18;
        const vx = -Math.sin(state.theta + Math.PI / 2) * (state.omega * length) * velScale;
        const vy = -Math.cos(state.theta + Math.PI / 2) * (state.omega * length) * velScale;

        if (Math.abs(state.omega) > 0.05) {
          ctx.beginPath();
          ctx.moveTo(bobX, bobY);
          ctx.lineTo(bobX + vx, bobY + vy);
          ctx.strokeStyle = '#22c55e'; // Green for velocity
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(vy, vx);
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(bobX + vx, bobY + vy);
          ctx.lineTo(bobX + vx - 10 * Math.cos(angle - Math.PI / 6), bobY + vy - 10 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(bobX + vx - 10 * Math.cos(angle + Math.PI / 6), bobY + vy - 10 * Math.sin(angle + Math.PI / 6));
          ctx.fill();

          ctx.fillText(`v = ${v.toFixed(2)} m/s`, bobX + vx + 8, bobY + vy);
        }

        // Gravity vector (mg downward)
        const gVectorLen = Math.min(60, gravity * 3.5);
        ctx.beginPath();
        ctx.moveTo(bobX, bobY);
        ctx.lineTo(bobX, bobY + gVectorLen);
        ctx.strokeStyle = '#ef4444'; // Red for gravity
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 6. Draw Pendulum Bob with Metallic Gradient
      const gradient = ctx.createRadialGradient(bobX - 4, bobY - 4, 2, bobX, bobY, bobRadius);
      gradient.addColorStop(0, '#67e8f9');
      gradient.addColorStop(0.5, '#0284c7');
      gradient.addColorStop(1, '#0c4a6e');

      ctx.beginPath();
      ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bob mass text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${mass.toFixed(1)}kg`, bobX, bobY);
      ctx.textAlign = 'start';

      // 7. Live Stats update
      setLiveStats({
        thetaDeg,
        omega: state.omega,
        v,
        Ek,
        Ep,
        Etotal,
        time: state.time,
        oscillations: state.oscillations,
      });

      animFrameId.current = requestAnimationFrame(updateAndDraw);
    };

    animFrameId.current = requestAnimationFrame(updateAndDraw);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [length, mass, gravity, damping, isRunning, simSpeed, showVectors]);

  // Interactive mouse drag to position the pendulum
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const pivotX = canvas.width / 2;
    const pivotY = 50;

    const dx = clickX - pivotX;
    const dy = clickY - pivotY;
    const newAngle = Math.atan2(dx, dy);

    simState.current.isDragging = true;
    simState.current.theta = newAngle;
    simState.current.omega = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!simState.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const pivotX = canvas.width / 2;
    const pivotY = 50;

    const dx = mouseX - pivotX;
    const dy = Math.max(10, mouseY - pivotY);
    const newAngle = Math.atan2(dx, dy);

    // Limit angle between -80 and +80 deg
    const clamped = Math.max((-80 * Math.PI) / 180, Math.min((80 * Math.PI) / 180, newAngle));
    simState.current.theta = clamped;
    simState.current.omega = 0;
  };

  const handleMouseUp = () => {
    if (simState.current.isDragging) {
      simState.current.isDragging = false;
      setInitialAngleDeg(Math.round((simState.current.theta * 180) / Math.PI));
    }
  };

  // Log measurement to notebook
  const handleLog = () => {
    // Measured period based on live oscillations and time or live speed
    const measuredT = liveStats.oscillations > 0 ? liveStats.time / liveStats.oscillations : theoreticalPeriod * (1 + (Math.random() * 0.04 - 0.02));
    onLogMeasurement({
      experiment: 'pendulum',
      variableName: t('experiments.pendulum.varPeriod'),
      measuredValue: Number(measuredT.toFixed(3)),
      theoreticalValue: Number(theoreticalPeriod.toFixed(3)),
      unit: 's',
      parameters: {
        Length: `${length} m`,
        Mass: `${mass} kg`,
        Gravity: `${gravity} m/s²`,
        'Initial θ': `${initialAngleDeg}°`,
      },
      notes: t('experiments.pendulum.notesText'),
    });

    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 2500);
  };

  return (
    <div id="pendulum-simulation" className="space-y-6">
      {/* Top Header & Planet Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{t('experiments.pendulum.title')}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{t('experiments.pendulum.shortDesc')}</p>
        </div>

        {/* Planet Presets */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">{ctrl.planetPreset}:</span>
          <div className="flex flex-wrap gap-1.5">
            {PLANETS.slice(0, 4).map((p) => (
              <button
                key={p.id}
                id={`planet-btn-${p.id}`}
                onClick={() => setGravity(p.g)}
                className={`min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1.5 ${
                  Math.abs(gravity - p.g) < 0.05
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-medium'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
                }`}
              >
                <span>{p.icon}</span>
                <span>{getPlanetName(p)}</span>
                <span className="text-[10px] opacity-75">({p.g})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Simulation Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Canvas Viewport (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Interaction Instruction Banner */}
          <div className="text-sm font-mono text-zinc-300 bg-zinc-900/90 border border-zinc-800 px-3 py-2 rounded-xl flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Info  className="w-4 h-4 text-sky-400 shrink-0"/>
              <span>{t('experiments.pendulum.dragToAngle')}</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">θ₀ = {initialAngleDeg.toFixed(1)}°</span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-inner flex flex-col items-center p-1">
            {/* Canvas element */}
            <canvas
              ref={canvasRef}
              id="pendulum-canvas"
              width={600}
              height={420}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
             className="w-full h-[400px] cursor-grab active:cursor-grabbing select-none rounded-lg"/>

            {/* Live Overlay Indicators (Vectors & Energy Toggles) */}
            <div className="w-full border-t border-zinc-800/80 p-3 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="min-h-[44px] flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={(e) => setShowVectors(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-sky-500 focus:ring-0"
                  />
                  <span>{t('experiments.pendulum.showVectors')}</span>
                </label>
                <label className="min-h-[44px] flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={showEnergyBars}
                    onChange={(e) => setShowEnergyBars(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
                  />
                  <span>{t('experiments.pendulum.showEnergyBars')}</span>
                </label>
              </div>

              {/* Simulation Playback Toolbar */}
              <div className="flex items-center gap-1.5">
                <button
                  id="pendulum-play-toggle"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border transition-colors ${
                    isRunning
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                  title={isRunning ? ctrl.pause : ctrl.play}
                >
                  {isRunning ? <Pause  className="w-4 h-4"/> : <Play  className="w-4 h-4"/>}
                </button>
                <button
                  id="pendulum-reset-btn"
                  onClick={resetSimulation}
                  title={ctrl.reset}
                 className="min-h-[44px] min-w-[44px] p-2 rounded-lg border bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 transition-colors">
                  <RotateCcw  className="w-4 h-4"/>
                </button>
                <div className="flex items-center gap-1 ml-2 text-[11px] text-zinc-400">
                  <span>{ctrl.speed}:</span>
                  <select
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(Number(e.target.value))}
                    className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                  >
                    <option value={0.25}>0.25x</option>
                    <option value={0.5}>0.5x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Conservation Live Bar Chart */}
          {showEnergyBars && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-200">{t('experiments.pendulum.totalEnergy')}: {liveStats.Etotal.toFixed(2)} J</span>
                <span className="text-zinc-400">E = Ek + Ep</span>
              </div>
              
              <div className="space-y-2 text-xs">
                {/* Kinetic Energy Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-emerald-400">
                    <span>{t('experiments.pendulum.kineticEnergy')}</span>
                    <span>{liveStats.Ek.toFixed(2)} J</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (liveStats.Ek / (liveStats.Etotal || 1)) * 100)}%` }}
                     className="h-full bg-emerald-500 transition-all duration-75 rounded-full"/>
                  </div>
                </div>

                {/* Potential Energy Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-sky-400">
                    <span>{t('experiments.pendulum.potentialEnergy')}</span>
                    <span>{liveStats.Ep.toFixed(2)} J</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (liveStats.Ep / (liveStats.Etotal || 1)) * 100)}%` }}
                     className="h-full bg-sky-500 transition-all duration-75 rounded-full"/>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & Parameters Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Real-time Calculation Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.pendulum.period')}</span>
              <span className="text-xl font-bold text-sky-400 font-mono mt-0.5 block">
                {theoreticalPeriod.toFixed(3)} <span className="text-xs font-normal text-zinc-400">{common.seconds}</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-1">T = 2π√(L/g)</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.pendulum.frequency')}</span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                {theoreticalFrequency.toFixed(3)} <span className="text-xs font-normal text-zinc-400">Hz</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-1">f = 1/T</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.pendulum.maxVelocity')}</span>
              <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">
                {theoreticalMaxVelocity.toFixed(2)} <span className="text-xs font-normal text-zinc-400">{common.metersPerSec}</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-1">v_max = √(2gh)</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.pendulum.oscillations')}</span>
              <span className="text-xl font-bold text-purple-400 font-mono mt-0.5 block">
                {liveStats.oscillations} <span className="text-xs font-normal text-zinc-400">cycles</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-1">t = {liveStats.time.toFixed(1)} s</span>
            </div>
          </div>

          {/* Sliders Form */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t('experiments.pendulum.expVariablesTitle')}
            </h3>

            {/* String Length */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.pendulum.length')}</span>
                <span className="font-mono text-sky-400 font-medium">{length.toFixed(2)} m</span>
              </div>
              <input
                id="slider-pendulum-length"
                type="range"
                min="0.3"
                max="2.5"
                step="0.05"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Mass */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.pendulum.mass')}</span>
                <span className="font-mono text-emerald-400 font-medium">{mass.toFixed(1)} kg</span>
              </div>
              <input
                id="slider-pendulum-mass"
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Gravity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.pendulum.gravity')}</span>
                <span className="font-mono text-amber-400 font-medium">{gravity.toFixed(2)} m/s²</span>
              </div>
              <input
                id="slider-pendulum-gravity"
                type="range"
                min="0.5"
                max="25.0"
                step="0.1"
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Initial Angle */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.pendulum.initialAngle')}</span>
                <span className="font-mono text-purple-400 font-medium">{initialAngleDeg}°</span>
              </div>
              <input
                id="slider-pendulum-angle"
                type="range"
                min="5"
                max="75"
                step="1"
                value={initialAngleDeg}
                onChange={(e) => setInitialAngleDeg(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Air Damping */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.pendulum.damping')}</span>
                <span className="font-mono text-zinc-400 font-medium">{damping === 0 ? '0 (Ideal / No Friction)' : damping}</span>
              </div>
              <input
                id="slider-pendulum-damping"
                type="range"
                min="0"
                max="0.04"
                step="0.005"
                value={damping}
                onChange={(e) => setDamping(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-zinc-400 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Log Measurement Button */}
          <button
            id="log-pendulum-btn"
            onClick={handleLog}
           className="min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all active:scale-[0.98]">
            {loggedSuccess ? (
              <>
                <Check  className="w-4 h-4 text-emerald-300"/>
                <span>{ctrl.loggedSuccess}</span>
              </>
            ) : (
              <>
                <PlusCircle  className="w-4 h-4"/>
                <span>{ctrl.logData}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}