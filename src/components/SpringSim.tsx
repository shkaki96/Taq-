import { Activity, BookmarkCheck, Pause, Play, RotateCcw, Gauge } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';
import { PLANETS } from '../data/physicsData';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function SpringSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Parameters
  const [springConstant, setSpringConstant] = useState<number>(50); // N/m (k)
  const [mass, setMass] = useState<number>(1.0); // kg (m)
  const [displacement, setDisplacement] = useState<number>(0.15); // m (x0)
  const [damping, setDamping] = useState<number>(0.02); // b
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [selectedPlanet, setSelectedPlanet] = useState<string>('earth');
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showEnergyBars, setShowEnergyBars] = useState<boolean>(true);

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logged, setLogged] = useState<boolean>(false);

  // Physics dynamic variables
  const currentG = PLANETS.find((p) => p.id === selectedPlanet)?.g ?? 9.81;
  const effectiveG = orientation === 'vertical' ? currentG : 0;

  // Equilibrium stretch for vertical spring: y_eq = (m * g) / k
  const equilibriumStretch = (mass * effectiveG) / springConstant;

  // Dynamic state refs for 60fps canvas loop
  const xRef = useRef<number>(displacement); // displacement relative to equilibrium (m)
  const vRef = useRef<number>(0); // velocity (m/s)
  const timeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);

  // Live metrics in state for UI display
  const [metrics, setMetrics] = useState({
    x: displacement,
    v: 0,
    a: 0,
    force: -springConstant * displacement,
    ek: 0,
    epe: 0.5 * springConstant * displacement * displacement,
    eg: mass * effectiveG * displacement,
    eTotal: 0.5 * springConstant * displacement * displacement,
    time: 0,
    periodMeasured: 0,
  });

  // Theoretical Period: T = 2 * PI * sqrt(m / k)
  const theoreticalPeriod = 2 * Math.PI * Math.sqrt(mass / springConstant);
  const theoreticalFrequency = 1 / theoreticalPeriod;

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset when key parameters change while stopped
  const resetSimulation = () => {
    setIsRunning(false);
    xRef.current = displacement;
    vRef.current = 0;
    timeRef.current = 0;
    const initialEpe = 0.5 * springConstant * displacement * displacement;
    setMetrics({
      x: displacement,
      v: 0,
      a: (-springConstant * displacement) / mass,
      force: -springConstant * displacement,
      ek: 0,
      epe: initialEpe,
      eg: 0,
      eTotal: initialEpe,
      time: 0,
      periodMeasured: theoreticalPeriod,
    });
  };

  useEffect(() => {
    resetSimulation();
  }, [springConstant, mass, displacement, orientation, selectedPlanet]);

  // Main 60FPS Physics Simulation Loop
  useEffect(() => {
    let lastTime = performance.now();
    let zeroCrossings = 0;
    let lastCrossingTime = 0;
    let measuredPeriodVal = theoreticalPeriod;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033); // seconds
      lastTime = now;

      if (isRunning && !isDraggingRef.current) {
        // Physics update: F_net = -k * x - b * v
        // In vertical equilibrium relative frame, gravity is absorbed into equilibrium position!
        const x = xRef.current;
        const v = vRef.current;

        const fSpring = -springConstant * x;
        const fDamping = -damping * 5 * v;
        const fNet = fSpring + fDamping;
        const a = fNet / mass;

        // Semi-implicit Euler integration
        const nextV = v + a * dt;
        const nextX = x + nextV * dt;

        // Period measurement by zero crossings
        if ((x > 0 && nextX <= 0) || (x < 0 && nextX >= 0)) {
          zeroCrossings++;
          if (zeroCrossings >= 2) {
            const periodSample = (timeRef.current - lastCrossingTime) * 2;
            if (periodSample > 0.1 && periodSample < 20) {
              measuredPeriodVal = periodSample;
            }
            lastCrossingTime = timeRef.current;
            zeroCrossings = 0;
          } else {
            lastCrossingTime = timeRef.current;
          }
        }

        xRef.current = nextX;
        vRef.current = nextV;
        timeRef.current += dt;

        // Calculate energies
        const ek = 0.5 * mass * nextV * nextV;
        const epe = 0.5 * springConstant * nextX * nextX;
        const total = ek + epe;

        setMetrics({
          x: nextX,
          v: nextV,
          a,
          force: fSpring,
          ek,
          epe,
          eg: 0,
          eTotal: total,
          time: timeRef.current,
          periodMeasured: measuredPeriodVal,
        });
      }

      // Draw Canvas
      drawCanvas();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, springConstant, mass, damping, orientation, selectedPlanet]);

  // Render Spring on HTML5 Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Subtle coordinate grid
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const isVert = orientation === 'vertical';

    if (isVert) {
      // Top ceiling support
      const startX = width / 2;
      const startY = 30;

      // Ceiling mount bar
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(startX - 60, startY - 8, 120, 8);
      // Hatch lines
      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 1.5;
      for (let h = -50; h <= 50; h += 12) {
        ctx.beginPath();
        ctx.moveTo(startX + h, startY - 8);
        ctx.lineTo(startX + h + 8, startY - 18);
        ctx.stroke();
      }

      // Visual scaling: 1 meter = 250 pixels
      const scale = 250;
      const restLengthPx = 100;
      const eqPx = equilibriumStretch * scale;
      const currentStretchPx = xRef.current * scale;
      const currentMassY = startY + restLengthPx + eqPx + currentStretchPx;
      const massRadius = Math.max(16, Math.min(32, 14 + mass * 6));

      // Equilibrium dashed line
      const eqLineY = startY + restLengthPx + eqPx;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX - 90, eqLineY);
      ctx.lineTo(startX + 90, eqLineY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText(tI18n('experiments.spring.eqPos'), startX + 95, eqLineY + 3);

      // Draw Coiled Spring
      const coils = 16;
      const springLength = Math.max(20, currentMassY - startY - massRadius);
      const coilStep = springLength / coils;
      const springWidth = 14;

      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      // top straight segment
      ctx.lineTo(startX, startY + 10);
      for (let i = 0; i < coils; i++) {
        const y1 = startY + 10 + i * coilStep;
        const y2 = y1 + coilStep / 2;
        const y3 = y1 + coilStep;
        ctx.lineTo(startX + (i % 2 === 0 ? springWidth : -springWidth), y2);
        ctx.lineTo(startX, y3);
      }
      ctx.lineTo(startX, currentMassY - massRadius);
      ctx.stroke();

      // Draw Hanging Mass Block
      const gradient = ctx.createLinearGradient(startX - massRadius, currentMassY - massRadius, startX + massRadius, currentMassY + massRadius);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#4338ca');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(startX - massRadius, currentMassY - massRadius, massRadius * 2, massRadius * 2, 8);
      ctx.fill();
      ctx.stroke();

      // Mass label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mass.toFixed(1)} kg`, startX, currentMassY + 4);

      // Draw Vectors if enabled
      if (showVectors) {
        // Restoring force vector (pointing towards equilibrium)
        const forceMag = metrics.force; // negative when stretched down
        const forceVecLength = Math.max(-50, Math.min(50, forceMag * 0.8));

        ctx.strokeStyle = '#f43f5e';
        ctx.fillStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX - massRadius - 12, currentMassY);
        ctx.lineTo(startX - massRadius - 12, currentMassY + forceVecLength);
        ctx.stroke();
        // Arrowhead
        const arrowDir = forceVecLength > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(startX - massRadius - 16, currentMassY + forceVecLength - arrowDir * 6);
        ctx.lineTo(startX - massRadius - 12, currentMassY + forceVecLength);
        ctx.lineTo(startX - massRadius - 8, currentMassY + forceVecLength - arrowDir * 6);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`F = ${Math.abs(forceMag).toFixed(1)}N`, startX - massRadius - 18, currentMassY + forceVecLength / 2);

        // Velocity Vector
        const velLength = metrics.v * 40;
        if (Math.abs(velLength) > 2) {
          ctx.strokeStyle = '#10b981';
          ctx.fillStyle = '#10b981';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(startX + massRadius + 12, currentMassY);
          ctx.lineTo(startX + massRadius + 12, currentMassY + velLength);
          ctx.stroke();
          const vDir = velLength > 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(startX + massRadius + 8, currentMassY + velLength - vDir * 6);
          ctx.lineTo(startX + massRadius + 12, currentMassY + velLength);
          ctx.lineTo(startX + massRadius + 16, currentMassY + velLength - vDir * 6);
          ctx.fill();

          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'left';
          ctx.fillText(`v = ${metrics.v.toFixed(2)}m/s`, startX + massRadius + 18, currentMassY + velLength / 2);
        }
      }
    } else {
      // Horizontal Air Track Mode
      const wallX = 50;
      const trackY = height / 2 + 40;

      // Left support wall
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(wallX - 12, trackY - 70, 12, 80);
      // Track surface
      ctx.fillStyle = '#27272a';
      ctx.fillRect(wallX, trackY, width - wallX - 30, 8);

      const scale = 250;
      const restLengthPx = 140;
      const currentStretchPx = xRef.current * scale;
      const currentMassX = wallX + restLengthPx + currentStretchPx;
      const massSize = Math.max(32, Math.min(56, 28 + mass * 10));

      // Equilibrium line
      const eqLineX = wallX + restLengthPx;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(eqLineX, trackY - 60);
      ctx.lineTo(eqLineX, trackY + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tI18n('experiments.spring.eqPosShort'), eqLineX, trackY - 65);

      // Draw horizontal spring
      const coils = 18;
      const springLength = Math.max(20, currentMassX - wallX - massSize / 2);
      const coilStep = springLength / coils;
      const springWidth = 14;

      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(wallX, trackY - massSize / 2);
      ctx.lineTo(wallX + 10, trackY - massSize / 2);
      for (let i = 0; i < coils; i++) {
        const x1 = wallX + 10 + i * coilStep;
        const x2 = x1 + coilStep / 2;
        const x3 = x1 + coilStep;
        ctx.lineTo(x2, trackY - massSize / 2 + (i % 2 === 0 ? springWidth : -springWidth));
        ctx.lineTo(x3, trackY - massSize / 2);
      }
      ctx.lineTo(currentMassX - massSize / 2, trackY - massSize / 2);
      ctx.stroke();

      // Glider block
      const gradient = ctx.createLinearGradient(currentMassX - massSize / 2, trackY - massSize, currentMassX + massSize / 2, trackY);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#4338ca');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(currentMassX - massSize / 2, trackY - massSize, massSize, massSize, 6);
      ctx.fill();
      ctx.stroke();

      // wheels
      ctx.fillStyle = '#e4e4e7';
      ctx.beginPath();
      ctx.arc(currentMassX - massSize / 3, trackY - 2, 4, 0, Math.PI * 2);
      ctx.arc(currentMassX + massSize / 3, trackY - 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mass.toFixed(1)} kg`, currentMassX, trackY - massSize / 2 + 4);
    }
  };

  // Mouse interaction for dragging the mass
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dy = (e.clientY - dragStartYRef.current) / 250; // delta in meters
    const newX = Math.max(-0.35, Math.min(0.35, displacement + dy));
    xRef.current = newX;
    vRef.current = 0;
    setDisplacement(newX);
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsRunning(true);
    }
  };

  // Log to Lab Notebook
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'spring',
      variableName: tI18n('experiments.spring.variableName'),
      measuredValue: Number(metrics.periodMeasured.toFixed(3)),
      theoreticalValue: Number(theoreticalPeriod.toFixed(3)),
      unit: 's',
      parameters: {
        'Spring Constant k': `${springConstant} N/m`,
        'Mass m': `${mass} kg`,
        'Displacement x0': `${displacement.toFixed(2)} m`,
        Orientation: orientation,
        Damping: damping,
      },
      equation: 'T = 2π √(m / k)',
      notes: tI18n('experiments.spring.notes'),
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="spring-sim-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation Stage (Canvas & Live Telemetry) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-zinc-100">{tI18n('experiments.spring.title')}</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{tI18n('experiments.spring.shortDesc')}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="spring-log-btn"
              onClick={handleLog}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{logged ? tI18n('experiments.spring.loggedSuccess') : tI18n('experiments.spring.logData')}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Header Bar (Displacement, Velocity, Restoring Force) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-xs flex items-center justify-between">
            <span className="text-sky-300 font-semibold">{tI18n('experiments.spring.dispX')}:</span>
            <span className="text-zinc-100 font-bold text-sm">{metrics.x.toFixed(3)} m</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-xs flex items-center justify-between">
            <span className="text-emerald-300 font-semibold">{tI18n('experiments.spring.velV')}:</span>
            <span className="text-zinc-100 font-bold text-sm">{metrics.v.toFixed(3)} m/s</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-xs flex items-center justify-between">
            <span className="text-rose-300 font-semibold">{tI18n('experiments.spring.restoringF')}:</span>
            <span className="text-zinc-100 font-bold text-sm">{metrics.force.toFixed(2)} N</span>
          </div>
        </div>

        {/* Unobstructed Interactive Canvas Area */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl space-y-2 p-2">
          <canvas
            ref={canvasRef}
            width={760}
            height={380}
            className="w-full h-[380px] cursor-grab active:cursor-grabbing block rounded-xl"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <div className="text-center py-1 text-[11px] text-zinc-400 font-medium">
            {tI18n('experiments.spring.pullMass')}
          </div>
        </div>

        {/* Energy Bar Chart Section (Cleanly separated below canvas) */}
        {showEnergyBars && (
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
            <div className="text-xs font-bold text-zinc-300 flex items-center justify-between border-b border-zinc-800 pb-2">
              <span>{tI18n('experiments.spring.totalEnergy')}</span>
              <span className="font-mono text-amber-400">{metrics.eTotal.toFixed(2)} J</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-emerald-400">
                  <span>E_k ({tI18n('experiments.spring.kineticEnergy')})</span>
                  <span className="font-bold">{metrics.ek.toFixed(2)} J</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, (metrics.ek / (metrics.eTotal || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-indigo-400">
                  <span>E_pe ({tI18n('experiments.spring.elasticPotential')})</span>
                  <span className="font-bold">{metrics.epe.toFixed(2)} J</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, (metrics.epe / (metrics.eTotal || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Playback Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              id="spring-play-btn"
              onClick={() => setIsRunning(!isRunning)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? tI18n('experiments.spring.pause') : tI18n('experiments.spring.play')}</span>
            </button>

            <button
              id="spring-reset-btn"
              onClick={resetSimulation}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs transition-colors"
              title={tI18n('experiments.spring.reset')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showVectors}
                onChange={(e) => setShowVectors(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
              />
              <span>{tI18n('experiments.spring.showVectors')}</span>
            </label>

            <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showEnergyBars}
                onChange={(e) => setShowEnergyBars(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
              />
              <span>{tI18n('experiments.spring.energyChart')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Control Panel & Parameters */}
      <div className="lg:col-span-4 space-y-4">
        {/* Core Sliders */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span>{tI18n('experiments.spring.oscillatorParams')}</span>
          </h3>

          {/* Spring Constant (k) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.spring.springConstant')}</span>
              <span className="font-mono text-indigo-400 font-bold">{springConstant} N/m</span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={springConstant}
              onChange={(e) => setSpringConstant(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Mass (m) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.spring.mass')}</span>
              <span className="font-mono text-indigo-400 font-bold">{mass.toFixed(1)} kg</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={5.0}
              step={0.1}
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Initial Displacement (x0) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.spring.displacement')}</span>
              <span className="font-mono text-indigo-400 font-bold">{displacement.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min={-0.3}
              max={0.3}
              step={0.02}
              value={displacement}
              onChange={(e) => setDisplacement(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Damping */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.spring.damping')}</span>
              <span className="font-mono text-indigo-400 font-bold">{damping.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.15}
              step={0.01}
              value={damping}
              onChange={(e) => setDamping(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Orientation Mode */}
          <div className="space-y-1.5">
            <span className="text-xs text-zinc-400 block">{tI18n('experiments.spring.orientation')}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrientation('vertical')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  orientation === 'vertical'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tI18n('experiments.spring.vertical')}
              </button>
              <button
                onClick={() => setOrientation('horizontal')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  orientation === 'horizontal'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tI18n('experiments.spring.horizontal')}
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Theoretical Calculations Card */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            {tI18n('experiments.spring.theoreticalAnalysis')}
          </h3>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span>{tI18n('experiments.spring.theoreticalPeriod')}:</span>
              <span className="text-sky-300 font-bold text-sm">{theoreticalPeriod.toFixed(3)} s</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>{tI18n('experiments.spring.naturalFreq')}:</span>
              <span className="text-indigo-300 font-bold">{theoreticalFrequency.toFixed(2)} Hz</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>{tI18n('experiments.spring.angularFreq')}:</span>
              <span className="text-emerald-300 font-bold">{Math.sqrt(springConstant / mass).toFixed(2)} rad/s</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300 leading-relaxed font-mono">
            T = 2π √(m / k) = 2π √({mass} / {springConstant}) = {theoreticalPeriod.toFixed(3)} s
          </div>
        </div>
      </div>
    </div>
  );
}