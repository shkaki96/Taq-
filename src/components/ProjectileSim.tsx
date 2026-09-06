import { Target, Flame, RotateCcw, Play, Check, PlusCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';
import { PLANETS } from '../data/physicsData';
import confetti from 'canvas-confetti';

interface Props {
  lang: Language;
  onLogMeasurement: (record: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface TrajectoryPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
}

export default function ProjectileSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
    const common = (tI18n('common', { returnObjects: true }) as any);
  const ctrl = (tI18n('controls', { returnObjects: true }) as any);


  const getPlanetName = (p: typeof PLANETS[0]) => {
    return tI18n(`planets.${p.id}.name`);
  };

  // Parameters
  const [velocity, setVelocity] = useState(25); // m/s (5 to 60)
  const [angleDeg, setAngleDeg] = useState(45); // deg (5 to 85)
  const [initialHeight, setInitialHeight] = useState(0); // m (0 to 40)
  const [gravity, setGravity] = useState(9.81); // m/s^2
  const [airDrag, setAirDrag] = useState(0); // 0 = vacuum, 0.05 = drag
  const [targetDistance, setTargetDistance] = useState(55); // target at 55m
  const [isTargetMode, setIsTargetMode] = useState(true);

  // States
  const [isFlying, setIsFlying] = useState(false);
  const [hitResult, setHitResult] = useState<'hit' | 'miss' | null>(null);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  // Trajectory history for persistent trails
  const [historyTrail, setHistoryTrail] = useState<TrajectoryPoint[]>([]);

  // Real-time animation ref
  const projectileRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    t: number;
    trail: { x: number; y: number }[];
  }>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    t: 0,
    trail: [],
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Theoretical physics calculations (in vacuum)
  const rad = (angleDeg * Math.PI) / 180;
  const v0x = velocity * Math.cos(rad);
  const v0y = velocity * Math.sin(rad);

  // Theoretical Max Height
  const theoreticalHmax = initialHeight + (v0y * v0y) / (2 * gravity);

  // Theoretical Total Flight Time: solving y(t) = h0 + v0y*t - 0.5*g*t^2 = 0
  const theoreticalFlightTime = (v0y + Math.sqrt(v0y * v0y + 2 * gravity * initialHeight)) / gravity;

  // Theoretical Range
  const theoreticalRange = v0x * theoreticalFlightTime;

  // Launch the projectile
  const handleLaunch = () => {
    setIsFlying(true);
    setHitResult(null);

    const rad = (angleDeg * Math.PI) / 180;
    const initialVx = velocity * Math.cos(rad);
    const initialVy = velocity * Math.sin(rad);

    projectileRef.current = {
      x: 0,
      y: initialHeight,
      vx: initialVx,
      vy: initialVy,
      t: 0,
      trail: [{ x: 0, y: initialHeight }],
    };
  };

  const handleReset = () => {
    setIsFlying(false);
    setHitResult(null);
    projectileRef.current = {
      x: 0,
      y: initialHeight,
      vx: 0,
      vy: 0,
      t: 0,
      trail: [],
    };
    setHistoryTrail([]);
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku' || lang === 'bad') ? 'rtl' : 'ltr';

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const p = projectileRef.current;

      // Physical simulation step if flying
      if (isFlying) {
        // Air drag force F_drag = -k * v * v_vec
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const ax = -airDrag * speed * p.vx;
        const ay = -gravity - airDrag * speed * p.vy;

        p.vx += ax * dt;
        p.vy += ay * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.t += dt;

        p.trail.push({ x: p.x, y: p.y });

        // Ground collision check
        if (p.y <= 0) {
          p.y = 0;
          setIsFlying(false);

          // Check if hit target (within 3m radius)
          if (isTargetMode) {
            const diff = Math.abs(p.x - targetDistance);
            if (diff <= 3.5) {
              setHitResult('hit');
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            } else {
              setHitResult('miss');
            }
          }

          // Save to history trail
          setHistoryTrail(
            p.trail.map((pt, idx) => ({
              x: pt.x,
              y: pt.y,
              vx: p.vx,
              vy: p.vy,
              t: (idx / p.trail.length) * p.t,
            }))
          );
        }
      }

      // Drawing coordinate space:
      // Real space: x from 0 to 120m, y from 0 to 60m
      const w = canvas.width;
      const h = canvas.height;
      const originX = 50;
      const groundY = h - 50;
      const scaleX = (w - 100) / 110; // ~5.5 px per meter
      const scaleY = (h - 100) / 50; // ~6.0 px per meter

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Ground line & Grid markings
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      for (let gridX = 0; gridX <= 110; gridX += 10) {
        const cx = originX + gridX * scaleX;
        ctx.beginPath();
        ctx.moveTo(cx, 20);
        ctx.lineTo(cx, groundY);
        ctx.stroke();

        ctx.fillStyle = '#71717a';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${gridX}m`, cx, groundY + 18);
      }

      for (let gridY = 0; gridY <= 40; gridY += 10) {
        const cy = groundY - gridY * scaleY;
        ctx.beginPath();
        ctx.moveTo(originX, cy);
        ctx.lineTo(w - 30, cy);
        ctx.stroke();

        ctx.fillStyle = '#71717a';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${gridY}m`, originX - 8, cy + 3);
      }

      // Ground Surface
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // 2. Draw Launch Platform
      const platformHeightPx = initialHeight * scaleY;
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(originX - 16, groundY - platformHeightPx, 24, platformHeightPx);
      ctx.strokeStyle = '#71717a';
      ctx.strokeRect(originX - 16, groundY - platformHeightPx, 24, platformHeightPx);

      // 3. Draw Target if target mode
      if (isTargetMode) {
        const targetX = originX + targetDistance * scaleX;
        const targetY = groundY;

        // Target Board
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(targetX, targetY - 12, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(targetX, targetY - 12, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(targetX, targetY - 12, 4, 0, Math.PI * 2);
        ctx.fill();

        // Target Stand
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX, targetY - 12);
        ctx.stroke();
      }

      // 4. Draw Cannon Barrel
      const cannonBaseX = originX;
      const cannonBaseY = groundY - platformHeightPx;
      const rad = (angleDeg * Math.PI) / 180;
      const barrelLength = 30;

      ctx.save();
      ctx.translate(cannonBaseX, cannonBaseY);
      ctx.rotate(-rad);
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.fillRect(0, -6, barrelLength, 12);
      ctx.strokeRect(0, -6, barrelLength, 12);
      ctx.restore();

      // Cannon Base Pivot
      ctx.beginPath();
      ctx.arc(cannonBaseX, cannonBaseY, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Draw Flight Trails
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        p.trail.forEach((pt, i) => {
          const px = originX + pt.x * scaleX;
          const py = groundY - pt.y * scaleY;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 6. Draw Projectile Ball
      if (isFlying || p.x > 0) {
        const ballX = originX + p.x * scaleX;
        const ballY = groundY - p.y * scaleY;

        // Glow
        const ballGrad = ctx.createRadialGradient(ballX - 2, ballY - 2, 1, ballX, ballY, 8);
        ballGrad.addColorStop(0, '#fde047');
        ballGrad.addColorStop(0.6, '#f97316');
        ballGrad.addColorStop(1, '#dc2626');

        ctx.beginPath();
        ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Velocity Vectors on the ball
        if (isFlying) {
          // Total Velocity vector
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ballX, ballY);
          ctx.lineTo(ballX + p.vx * 1.5, ballY - p.vy * 1.5);
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isFlying, angleDeg, initialHeight, gravity, airDrag, targetDistance, isTargetMode]);

  // Log measurement to notebook
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'projectile',
      variableName: tI18n('experiments.projectile.varRange'),
      measuredValue: Number(projectileRef.current.x.toFixed(2)) || Number(theoreticalRange.toFixed(2)),
      theoreticalValue: Number(theoreticalRange.toFixed(2)),
      unit: 'm',
      parameters: {
        'Launch Speed': `${velocity} m/s`,
        'Launch Angle': `${angleDeg}°`,
        'Platform Height': `${initialHeight} m`,
        Gravity: `${gravity} m/s²`,
        'Air Drag': airDrag > 0 ? 'Enabled' : 'None (Vacuum)',
      },
      notes: tI18n('experiments.projectile.notesText'),
    });

    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 2500);
  };

  return (
    <div id="projectile-simulation" className="space-y-6">
      {/* Top Header & Planet selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{tI18n('experiments.projectile.title')}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{tI18n('experiments.projectile.shortDesc')}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">{ctrl.planetPreset}:</span>
          <div className="flex flex-wrap gap-1.5">
            {PLANETS.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => setGravity(p.g)}
                className={`min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1.5 ${
                  Math.abs(gravity - p.g) < 0.05
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-medium'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
                }`}
              >
                <span>{p.icon}</span>
                <span>{getPlanetName(p)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Canvas Area (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-inner flex flex-col items-center">
            {/* Target Hit Notification Banner */}
            {hitResult && (
              <div
               className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 shadow-lg ${ hitResult === 'hit' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-amber-500/20 text-amber-300 border-amber-500/50' }`}>
                {hitResult === 'hit' ? tI18n('experiments.projectile.hitTarget') : tI18n('experiments.projectile.missedTarget')}
              </div>
            )}

            <canvas
              ref={canvasRef}
              id="projectile-canvas"
              width={650}
              height={380}
             className="w-full h-[380px] select-none"/>

            {/* Bottom Toolbar */}
            <div className="w-full border-t border-zinc-800/80 p-3 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="min-h-[44px] flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isTargetMode}
                    onChange={(e) => setIsTargetMode(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-0"
                  />
                  <Target  className="w-3.5 h-3.5 text-red-400"/>
                  <span>{tI18n('experiments.projectile.targetMode')}</span>
                </label>

                <label className="min-h-[44px] flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={airDrag > 0}
                    onChange={(e) => setAirDrag(e.target.checked ? 0.04 : 0)}
                    className="rounded bg-zinc-800 border-zinc-700 text-sky-500 focus:ring-0"
                  />
                  <Flame  className="w-3.5 h-3.5 text-amber-400"/>
                  <span>{tI18n('experiments.projectile.airResistance')}</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="projectile-reset-btn"
                  onClick={handleReset}
                 className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg border bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-1">
                  <RotateCcw  className="w-3.5 h-3.5"/>
                  <span>{tI18n('experiments.projectile.reset')}</span>
                </button>
                <button
                  id="projectile-launch-btn"
                  onClick={handleLaunch}
                  disabled={isFlying}
                 className="min-h-[44px] min-w-[44px] px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all">
                  <Play  className="w-3.5 h-3.5"/>
                  <span>{tI18n('experiments.projectile.launch')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Velocity Vector Decomposition Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{tI18n('experiments.projectile.range')}</span>
              <span className="text-base font-bold text-sky-400 font-mono mt-0.5 block">
                {theoreticalRange.toFixed(2)} <span className="text-xs font-normal text-zinc-400">{common.meters}</span>
              </span>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{tI18n('experiments.projectile.maxHeight')}</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                {theoreticalHmax.toFixed(2)} <span className="text-xs font-normal text-zinc-400">{common.meters}</span>
              </span>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{tI18n('experiments.projectile.flightTime')}</span>
              <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
                {theoreticalFlightTime.toFixed(2)} <span className="text-xs font-normal text-zinc-400">{common.seconds}</span>
              </span>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{tI18n('experiments.projectile.vx')} / {tI18n('experiments.projectile.vy')}</span>
              <span className="text-xs font-bold text-zinc-200 font-mono mt-1 block">
                {v0x.toFixed(1)} / {v0y.toFixed(1)} <span className="font-normal text-[10px] text-zinc-400">m/s</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Parameters & Controls Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {tI18n('experiments.projectile.launchControlsTitle')}
            </h3>

            {/* Velocity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{tI18n('experiments.projectile.velocity')}</span>
                <span className="font-mono text-sky-400 font-medium">{velocity} m/s</span>
              </div>
              <input
                id="slider-projectile-v0"
                type="range"
                min="5"
                max="50"
                step="1"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Launch Angle Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{tI18n('experiments.projectile.angle')}</span>
                <span className="font-mono text-purple-400 font-medium">{angleDeg}°</span>
              </div>
              <input
                id="slider-projectile-angle"
                type="range"
                min="5"
                max="85"
                step="1"
                value={angleDeg}
                onChange={(e) => setAngleDeg(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Initial Height Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{tI18n('experiments.projectile.height')}</span>
                <span className="font-mono text-emerald-400 font-medium">{initialHeight} m</span>
              </div>
              <input
                id="slider-projectile-height"
                type="range"
                min="0"
                max="30"
                step="1"
                value={initialHeight}
                onChange={(e) => setInitialHeight(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Target Distance if target mode */}
            {isTargetMode && (
              <div className="space-y-1.5 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <div className="flex justify-between text-xs">
                  <span className="text-red-300 flex items-center gap-1">
                    <Target  className="w-3.5 h-3.5 text-red-400"/>
                    {tI18n('experiments.projectile.targetDistance')}
                  </span>
                  <span className="font-mono text-red-400 font-medium">{targetDistance} m</span>
                </div>
                <input
                  id="slider-target-distance"
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={targetDistance}
                  onChange={(e) => setTargetDistance(Number(e.target.value))}
                  className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-red-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Log Measurement Button */}
          <button
            id="log-projectile-btn"
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