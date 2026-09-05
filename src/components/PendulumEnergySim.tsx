import { Zap, Pause, Play, RotateCcw, BookmarkCheck, Gauge, Activity, Compass } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';
import { PLANETS } from '../data/physicsData';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function PendulumEnergySim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();

  const getPlanetName = (p: typeof PLANETS[0]) => {
    return tI18n(`planets.${p.id}.name`);
  };

  // Parameters
  const [length, setLength] = useState<number>(1.5); // meters (L)
  const [mass, setMass] = useState<number>(1.0); // kg (m)
  const [initialAngleDeg, setInitialAngleDeg] = useState<number>(35); // degrees (theta_0)
  const [damping, setDamping] = useState<number>(0.0); // 0 = perfect conservation
  const [selectedPlanet, setSelectedPlanet] = useState<string>('earth');
  const [showPhotogate, setShowPhotogate] = useState<boolean>(true);

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logged, setLogged] = useState<boolean>(false);

  const currentG = PLANETS.find((p) => p.id === selectedPlanet)?.g ?? 9.81;

  // Theoretical Calculations
  const initialAngleRad = (initialAngleDeg * Math.PI) / 180;
  const theoreticalPeriod = 2 * Math.PI * Math.sqrt(length / currentG);
  const maxInitialHeight = length * (1 - Math.cos(initialAngleRad));
  const initialTotalEnergy = mass * currentG * maxInitialHeight;
  const theoreticalMaxVelocity = Math.sqrt(2 * currentG * maxInitialHeight);

  // Live dynamic state refs for 60fps loop
  const thetaRef = useRef<number>(initialAngleRad);
  const omegaRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Photogate measurements
  const [photogateSpeed, setPhotogateSpeed] = useState<number>(theoreticalMaxVelocity);
  const [photogateKE, setPhotogateKE] = useState<number>(initialTotalEnergy);

  // Live metrics for UI
  const [metrics, setMetrics] = useState({
    theta: initialAngleRad,
    thetaDeg: initialAngleDeg,
    omega: 0,
    linearVelocity: 0,
    height: maxInitialHeight,
    pe: initialTotalEnergy,
    ke: 0,
    totalEnergy: initialTotalEnergy,
    time: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const resetSim = () => {
    setIsRunning(false);
    const rad = (initialAngleDeg * Math.PI) / 180;
    thetaRef.current = rad;
    omegaRef.current = 0;
    const h = length * (1 - Math.cos(rad));
    const pe = mass * currentG * h;
    setMetrics({
      theta: rad,
      thetaDeg: initialAngleDeg,
      omega: 0,
      linearVelocity: 0,
      height: h,
      pe: pe,
      ke: 0,
      totalEnergy: pe,
      time: 0,
    });
    setPhotogateSpeed(Math.sqrt(2 * currentG * h));
    setPhotogateKE(pe);
  };

  useEffect(() => {
    resetSim();
  }, [length, mass, initialAngleDeg, damping, selectedPlanet]);

  // 60FPS Physics Runge-Kutta 4 / Euler-Cromer Loop
  useEffect(() => {
    if (!isRunning) return;

    let lastTime = performance.now();
    let prevTheta = thetaRef.current;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (!isDraggingRef.current) {
        // Differential equation: d2(theta)/dt2 = -(g/L)*sin(theta) - (damping/m)*omega
        const alpha = -(currentG / length) * Math.sin(thetaRef.current) - (damping / mass) * omegaRef.current;
        omegaRef.current += alpha * dt;
        thetaRef.current += omegaRef.current * dt;

        // Check photogate trigger (passing theta = 0)
        if ((prevTheta < 0 && thetaRef.current >= 0) || (prevTheta > 0 && thetaRef.current <= 0)) {
          const speedAtBottom = Math.abs(omegaRef.current * length);
          setPhotogateSpeed(speedAtBottom);
          setPhotogateKE(0.5 * mass * speedAtBottom * speedAtBottom);
        }
        prevTheta = thetaRef.current;

        const currentRad = thetaRef.current;
        const currentH = length * (1 - Math.cos(currentRad));
        const currentV = omegaRef.current * length;
        const currentPE = mass * currentG * currentH;
        const currentKE = 0.5 * mass * currentV * currentV;

        setMetrics({
          theta: currentRad,
          thetaDeg: (currentRad * 180) / Math.PI,
          omega: omegaRef.current,
          linearVelocity: currentV,
          height: currentH,
          pe: currentPE,
          ke: currentKE,
          totalEnergy: currentPE + currentKE,
          time: now / 1000,
        });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, currentG, length, damping, mass]);

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const pivotX = width * 0.42;
    const pivotY = 50;
    const scale = 140; // px per meter
    const lengthPix = length * scale;

    // Draw Support Bar
    ctx.fillStyle = '#475569';
    ctx.fillRect(pivotX - 80, pivotY - 14, 160, 14);

    // Reference Vertical Dotted Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + lengthPix + 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pendulum Bob Position
    const bobX = pivotX + lengthPix * Math.sin(metrics.theta);
    const bobY = pivotY + lengthPix * Math.cos(metrics.theta);

    // Height Probe & Datum Baseline
    const lowestY = pivotY + lengthPix;
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX - 160, lowestY);
    ctx.lineTo(pivotX + 160, lowestY);
    ctx.stroke();

    // Height vertical bar indicator
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bobX, bobY);
    ctx.lineTo(bobX, lowestY);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.fillText(`h = ${metrics.height.toFixed(3)} m`, bobX + 8, (bobY + lowestY) / 2);

    // Photogate Sensor at lowest point
    if (showPhotogate) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(pivotX - 18, lowestY - 18, 36, 36);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(pivotX - 18, lowestY - 18, 36, 36);

      // Laser beam line
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX - 25, lowestY);
      ctx.lineTo(pivotX + 25, lowestY);
      ctx.stroke();

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tI18n('experiments.pendulum_energy.photogateLabel'), pivotX, lowestY + 30);
    }

    // Pendulum String
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Pivot Pin
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Pendulum Bob Sphere
    const bobRadius = Math.max(14, Math.min(26, Math.sqrt(mass) * 16));
    const grad = ctx.createRadialGradient(bobX - bobRadius * 0.3, bobY - bobRadius * 0.3, 3, bobX, bobY, bobRadius);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.8, '#0284c7');
    grad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Real-time Energy Chart Overlay on Right Side
    const chartX = width * 0.76;
    const chartY = height * 0.25;
  }, [metrics, length, mass, showPhotogate, initialTotalEnergy]);

  // Dragging Bob to set angle
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pivotX = canvas.width * 0.42;
    const pivotY = 50;
    const lengthPix = length * 140;
    const bobX = pivotX + lengthPix * Math.sin(thetaRef.current);
    const bobY = pivotY + lengthPix * Math.cos(thetaRef.current);

    if (Math.hypot(clickX - bobX, clickY - bobY) < 35) {
      isDraggingRef.current = true;
      setIsRunning(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;

    const pivotX = canvas.width * 0.42;
    const pivotY = 50;
    const dx = moveX - pivotX;
    const dy = moveY - pivotY;

    let angle = Math.atan2(dx, dy);
    angle = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, angle));
    thetaRef.current = angle;
    omegaRef.current = 0;
    setInitialAngleDeg(Math.round((angle * 180) / Math.PI));

    const h = length * (1 - Math.cos(angle));
    const pe = mass * currentG * h;
    setMetrics({
      theta: angle,
      thetaDeg: (angle * 180) / Math.PI,
      omega: 0,
      linearVelocity: 0,
      height: h,
      pe: pe,
      ke: 0,
      totalEnergy: pe,
      time: 0,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'pendulum_energy',
      parameters: {
        length: `${length.toFixed(2)} m`,
        mass: `${mass.toFixed(2)} kg`,
        gravity: `${currentG.toFixed(2)} m/s²`,
        initialAngle: `${initialAngleDeg}°`,
      },
      variableName: tI18n('experiments.pendulum_energy.varEnergyVel'),
      measuredValue: Number(photogateKE.toFixed(3)),
      theoreticalValue: Number(initialTotalEnergy.toFixed(3)),
      unit: 'J',
      equation: 'E = K + U = mgh_max = ½mv_max²',
      notes: `U_max=${initialTotalEnergy.toFixed(2)}J, Photogate K=${photogateKE.toFixed(2)}J, v_measured=${photogateSpeed.toFixed(2)}m/s, v_theo=${theoreticalMaxVelocity.toFixed(2)}m/s, Period T=${theoreticalPeriod.toFixed(2)}s`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="pendulum-energy-simulation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Canvas Area */}
      <div className="lg:col-span-2 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Zap  className="w-5 h-5"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {tI18n('experiments.pendulum_energy.subTitle')}
                </h3>
                <p className="text-sm text-zinc-400 font-mono">
                  T = 2π√(L/g) = {theoreticalPeriod.toFixed(2)}s • E_total = {initialTotalEnergy.toFixed(2)} J
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isRunning
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                }`}
              >
                {isRunning ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
                <span>{isRunning ? tI18n('experiments.pendulum_energy.pause') : tI18n('experiments.pendulum_energy.start')}</span>
              </button>

              <button
                onClick={resetSim}
                title="Reset"
               className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors">
                <RotateCcw  className="w-4 h-4"/>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center items-center bg-zinc-950/70 rounded-xl border border-zinc-800/60 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={700}
              height={380}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
             className="cursor-grab active:cursor-grabbing max-w-full h-auto"/>
          </div>

          {/* Photogate & Real-time Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.pendulum_energy.photogateVelLabel')}</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {photogateSpeed.toFixed(3)} <span className="text-sm text-zinc-400">m/s</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.pendulum_energy.bottomKELabel')}</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {photogateKE.toFixed(3)} <span className="text-sm text-zinc-400">J</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.pendulum_energy.initialPELabel')}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {initialTotalEnergy.toFixed(3)} <span className="text-sm text-zinc-400">J</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.pendulum_energy.periodLabel')}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {theoreticalPeriod.toFixed(2)} <span className="text-sm text-zinc-400">s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conservation Proof Card */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-zinc-300 space-y-2">
          <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{tI18n('experiments.pendulum_energy.proofTitle')}</span>
          </div>
          <p>{tI18n('experiments.pendulum_energy.proofText')}</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
          <h4 className="text-sm font-bold text-zinc-200 pb-2 border-b border-zinc-800">
            {tI18n('experiments.pendulum_energy.controlsTitle')}
          </h4>

          {/* Length Control */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.pendulum_energy.lengthLabel')}</span>
              <span className="font-mono text-sky-400 font-bold">{length.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.2"
              step="0.05"
              value={length}
              onChange={(e) => setLength(parseFloat(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Mass Control */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.pendulum_energy.massLabel')}</span>
              <span className="font-mono text-zinc-200 font-bold">{mass.toFixed(1)} kg</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={mass}
              onChange={(e) => setMass(parseFloat(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Initial Release Angle */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.pendulum_energy.angleLabel')}</span>
              <span className="font-mono text-amber-400 font-bold">{initialAngleDeg}°</span>
            </div>
            <input
              type="range"
              min="5"
              max="65"
              step="1"
              value={initialAngleDeg}
              onChange={(e) => setInitialAngleDeg(parseFloat(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Damping toggle (conservative vs non-conservative) */}
          <div className="space-y-1 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.pendulum_energy.dampingLabel')}</span>
              <span className="font-mono text-rose-400 font-bold">{damping === 0 ? tI18n('experiments.pendulum_energy.conservativeZero') : damping.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={damping}
              onChange={(e) => setDamping(parseFloat(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Planet Gravity Selector */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            <label className="text-sm text-zinc-400">{tI18n('experiments.pendulum_energy.gravityLabel')}</label>
            <select
              value={selectedPlanet}
              onChange={(e) => setSelectedPlanet(e.target.value)}
              className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
            >
              {PLANETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {getPlanetName(p)} ({p.g} m/s²)
                </option>
              ))}
            </select>
          </div>

          {/* Log Measurement Button */}
          <button
            onClick={handleLog}
           className={`min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${ logged ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.pendulum_energy.loggedMsg') : tI18n('experiments.pendulum_energy.logBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}