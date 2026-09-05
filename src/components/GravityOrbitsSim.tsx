import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Orbit, 
  Pause, 
  Play, 
  RotateCcw, 
  Activity, 
  BookmarkCheck, 
  Zap, 
  Compass, 
  Trash2, 
  Grid, 
  Eye, 
  Gauge, 
  Sparkles,
  ArrowUpRight,
  Sun
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface GravityOrbitsSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

export const GravityOrbitsSim: React.FC<GravityOrbitsSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // Core Simulation States
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0); // 0.5x, 1x, 2x, 4x
  const [starMass, setStarMass] = useState<number>(1.0); // Solar masses (M☉)
  const [planetMass, setPlanetMass] = useState<number>(1.0); // Earth masses (M⊕)
  const [gravityOn, setGravityOn] = useState<boolean>(true);

  // Visualization Toggles
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Dragging interaction state
  const [isDraggingPlanet, setIsDraggingPlanet] = useState<boolean>(false);
  const [isDraggingVelocity, setIsDraggingVelocity] = useState<boolean>(false);

  // Live Telemetry state for UI
  const [telemetry, setTelemetry] = useState({
    r_px: 120,
    r_AU: 1.0,
    v_kms: 29.8,
    v_circ_kms: 29.8,
    Fg_relative: 1.0,
    period_yr: 1.0,
    orbitType: 'circular' as 'circular' | 'elliptical' | 'hyperbolic' | 'crashed',
  });

  // Logging status
  const [logged, setLogged] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);

  // Canvas and Physics References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starPos = { x: 300, y: 175 }; // Center of 600x350 canvas
  const G_SIM = 1500; // Scaled Gravitational Constant (120 px = 1.0 AU)
  const AU_PIXELS = 120;

  // Planet dynamic physics state in simulation coordinates
  const planetPosRef = useRef<{ x: number; y: number }>({ x: 300, y: 55 }); // 120px radius at top
  const planetVelRef = useRef<{ vx: number; vy: number }>({ vx: 3.535, vy: 0 }); // Circular orbital speed
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  // Calculate circular velocity magnitude for radius r
  const getCircularSpeed = useCallback((r: number, mass: number) => {
    return Math.sqrt((G_SIM * mass) / Math.max(r, 20));
  }, []);

  // Update telemetry readout helper
  const updateTelemetry = useCallback((px: number, py: number, vx: number, vy: number, mass: number, gActive: boolean) => {
    const dx = starPos.x - px;
    const dy = starPos.y - py;
    const r = Math.max(Math.hypot(dx, dy), 1);
    const v = Math.hypot(vx, vy);

    const r_AU = r / AU_PIXELS;
    const v_kms = v * 8.43; // Scaled to ~29.8 km/s at 1 AU
    const v_circ = getCircularSpeed(r, mass);
    const v_circ_kms = v_circ * 8.43;
    const v_esc = Math.sqrt(2) * v_circ;

    const Fg_relative = gActive ? (mass * 1.0) / Math.pow(r_AU, 2) : 0;
    const period_yr = Math.pow(r_AU, 1.5) / Math.sqrt(mass);

    // Orbit Classification
    const starRadius = 18 * Math.cbrt(mass);
    let type: 'circular' | 'elliptical' | 'hyperbolic' | 'crashed' = 'circular';

    if (r <= starRadius + 6) {
      type = 'crashed';
    } else if (!gActive || v >= v_esc * 0.98) {
      type = 'hyperbolic';
    } else if (Math.abs(v - v_circ) / v_circ < 0.08) {
      type = 'circular';
    } else {
      type = 'elliptical';
    }

    setTelemetry({
      r_px: r,
      r_AU: Number(r_AU.toFixed(2)),
      v_kms: Number(v_kms.toFixed(1)),
      v_circ_kms: Number(v_circ_kms.toFixed(1)),
      Fg_relative: Number(Fg_relative.toFixed(2)),
      period_yr: Number(period_yr.toFixed(2)),
      orbitType: type,
    });
  }, [getCircularSpeed]);

  // Apply Pre-configured Orbits
  const applyPreset = (presetKey: 'circular' | 'elliptical' | 'escape' | 'heavyStar' | 'satellite') => {
    trailRef.current = [];

    switch (presetKey) {
      case 'circular':
        setStarMass(1.0);
        setPlanetMass(1.0);
        setGravityOn(true);
        planetPosRef.current = { x: 300, y: 55 }; // r = 120 px = 1.0 AU
        planetVelRef.current = { vx: 3.535, vy: 0 };
        break;

      case 'elliptical':
        setStarMass(1.0);
        setPlanetMass(1.0);
        setGravityOn(true);
        planetPosRef.current = { x: 300, y: 55 }; // r = 120 px
        planetVelRef.current = { vx: 2.3, vy: 0 }; // Lower speed -> elliptical
        break;

      case 'escape':
        setStarMass(1.0);
        setPlanetMass(1.0);
        setGravityOn(true);
        planetPosRef.current = { x: 300, y: 55 };
        planetVelRef.current = { vx: 5.4, vy: -0.8 }; // v >= v_esc
        break;

      case 'heavyStar':
        setStarMass(2.2);
        setPlanetMass(1.0);
        setGravityOn(true);
        planetPosRef.current = { x: 300, y: 40 }; // r = 135 px
        planetVelRef.current = { vx: Math.sqrt((G_SIM * 2.2) / 135), vy: 0 };
        break;

      case 'satellite':
        setStarMass(1.0);
        setPlanetMass(0.5);
        setGravityOn(true);
        planetPosRef.current = { x: 300, y: 110 }; // close orbit r = 65 px
        planetVelRef.current = { vx: Math.sqrt((G_SIM * 1.0) / 65), vy: 0 };
        break;
    }

    setResetKey(k => k + 1);
  };

  // Reset Orbit to Standard Circular
  const handleReset = () => {
    applyPreset('circular');
  };

  // Clear Orbit Path Trail
  const handleClearTrail = () => {
    trailRef.current = [];
  };

  // Pointer Interaction Handlers for Dragging Planet or Velocity Arrow Tip
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 300, y: 55 };
    const scaleX = 600 / rect.width;
    const scaleY = 350 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    e.currentTarget.setPointerCapture(e.pointerId);

    const pos = planetPosRef.current;
    const vel = planetVelRef.current;
    const velTipX = pos.x + vel.vx * 16;
    const velTipY = pos.y + vel.vy * 16;

    // 1. Check if user clicked on green velocity arrow tip (radius 16px)
    if (Math.hypot(x - velTipX, y - velTipY) < 18) {
      setIsDraggingVelocity(true);
      return;
    }

    // 2. Check if user clicked on the planet (radius 18px)
    if (Math.hypot(x - pos.x, y - pos.y) < 22) {
      setIsDraggingPlanet(true);
      return;
    }

    // 3. If clicked elsewhere in space, move planet there and recalculate circular orbit velocity
    planetPosRef.current = { x, y };
    trailRef.current = [];
    const dx = starPos.x - x;
    const dy = starPos.y - y;
    const r = Math.max(Math.hypot(dx, dy), 20);
    const v_circ = getCircularSpeed(r, starMass);

    // Tangent perpendicular vector
    planetVelRef.current = {
      vx: -(dy / r) * v_circ,
      vy: (dx / r) * v_circ,
    };
    setIsDraggingPlanet(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingPlanet && !isDraggingVelocity) return;
    const { x, y } = getCanvasCoords(e);

    if (isDraggingPlanet) {
      planetPosRef.current = { x, y };
      trailRef.current = [];
      updateTelemetry(x, y, planetVelRef.current.vx, planetVelRef.current.vy, starMass, gravityOn);
    } else if (isDraggingVelocity) {
      const pos = planetPosRef.current;
      const newVx = (x - pos.x) / 16;
      const newVy = (y - pos.y) / 16;
      planetVelRef.current = { vx: newVx, vy: newVy };
      updateTelemetry(pos.x, pos.y, newVx, newVy, starMass, gravityOn);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDraggingPlanet(false);
    setIsDraggingVelocity(false);
  };

  // Canvas Main Rendering & Symplectic Verlet Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const drawScene = () => {
      ctx.clearRect(0, 0, 600, 350);

      const pos = planetPosRef.current;
      const vel = planetVelRef.current;
      const trail = trailRef.current;

      // 1. Concentric Distance Grid Rings (0.5 AU, 1.0 AU, 1.5 AU, 2.0 AU)
      if (showGrid) {
        ctx.save();
        const rings = [0.5, 1.0, 1.5, 2.0];
        rings.forEach((au) => {
          const r = au * AU_PIXELS;
          ctx.beginPath();
          ctx.arc(starPos.x, starPos.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.stroke();

          // Distance Tag
          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
          ctx.font = '9px monospace';
          ctx.fillText(`${au} AU`, starPos.x + r - 16, starPos.y - 4);
        });
        ctx.restore();
      }

      // 2. Render Trajectory Trail
      if (trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Render Star (Sun) with Solar Flares & Corona Glow
      const starRadius = 18 * Math.cbrt(starMass);
      
      // Corona Glow
      const coronaGrad = ctx.createRadialGradient(starPos.x, starPos.y, starRadius * 0.5, starPos.x, starPos.y, starRadius * 2.6);
      coronaGrad.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
      coronaGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.25)');
      coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(starPos.x, starPos.y, starRadius * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Star Core Sphere
      const starBody = ctx.createRadialGradient(starPos.x - starRadius * 0.3, starPos.y - starRadius * 0.3, 2, starPos.x, starPos.y, starRadius);
      starBody.addColorStop(0, '#fef08a');
      starBody.addColorStop(0.4, '#f59e0b');
      starBody.addColorStop(1, '#b45309');
      ctx.fillStyle = starBody;
      ctx.beginPath();
      ctx.arc(starPos.x, starPos.y, starRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Star Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`☉ ${starMass.toFixed(1)}M☉`, starPos.x, starPos.y);

      // 4. Render Planet with Atmosphere & Surface
      const planetRadius = Math.max(7 * Math.cbrt(planetMass), 6);

      // Atmosphere Glow
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, planetRadius + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

      // Planet Sphere
      const planetGrad = ctx.createRadialGradient(pos.x - 2, pos.y - 2, 1, pos.x, pos.y, planetRadius);
      planetGrad.addColorStop(0, '#bae6fd');
      planetGrad.addColorStop(0.5, '#0284c7');
      planetGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, planetRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDraggingPlanet ? '#fbbf24' : '#ffffff';
      ctx.lineWidth = isDraggingPlanet ? 2.5 : 1.5;
      ctx.stroke();

      // 5. Render Force & Velocity Vectors
      if (showVectors) {
        const dx = starPos.x - pos.x;
        const dy = starPos.y - pos.y;
        const r = Math.max(Math.hypot(dx, dy), 1);

        // A. Gravitational Force Vector (Blue Arrow pointing toward Sun)
        if (gravityOn) {
          const Fg_scale = Math.min(Math.max((G_SIM * starMass * 3.5) / (r * r), 12), 48);
          const fgEndX = pos.x + (dx / r) * Fg_scale;
          const fgEndY = pos.y + (dy / r) * Fg_scale;
          const fgAngle = Math.atan2(dy, dx);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(fgEndX, fgEndY);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.4;
          ctx.stroke();

          // Arrowhead
          ctx.translate(fgEndX, fgEndY);
          ctx.rotate(fgAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-6, -4);
          ctx.lineTo(-6, 4);
          ctx.closePath();
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.restore();

          // Vector Label
          ctx.fillStyle = '#7dd3fc';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('Fg', pos.x + (dx / r) * (Fg_scale + 12), pos.y + (dy / r) * (Fg_scale + 12));
        }

        // B. Velocity Vector (Green Arrow with Draggable Handle Tip)
        const velLen = Math.hypot(vel.vx, vel.vy);
        const vEndX = pos.x + vel.vx * 16;
        const vEndY = pos.y + vel.vy * 16;
        const vAngle = Math.atan2(vel.vy, vel.vx);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(vEndX, vEndY);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Arrowhead
        ctx.translate(vEndX, vEndY);
        ctx.rotate(vAngle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-7, -4.5);
        ctx.lineTo(-7, 4.5);
        ctx.closePath();
        ctx.fillStyle = '#4ade80';
        ctx.fill();

        // Draggable Tip Ring
        ctx.beginPath();
        ctx.arc(0, 0, isDraggingVelocity ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isDraggingVelocity ? '#fbbf24' : '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Vector Label
        ctx.fillStyle = '#86efac';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`v (${(velLen * 8.43).toFixed(1)} km/s)`, vEndX + 12, vEndY + 4);
      }
    };

    // Numerical Acceleration Calculation: a = G * M / r^2 in direction of star
    const computeAccel = (px: number, py: number) => {
      if (!gravityOn) return { ax: 0, ay: 0 };
      const dx = starPos.x - px;
      const dy = starPos.y - py;
      const r2 = Math.max(dx * dx + dy * dy, 200);
      const r = Math.sqrt(r2);
      const a = (G_SIM * starMass) / r2;
      return {
        ax: a * (dx / r),
        ay: a * (dy / r),
      };
    };

    // Primary Physics Loop
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      if (isRunning && !isDraggingPlanet && !isDraggingVelocity) {
        let px = planetPosRef.current.x;
        let py = planetPosRef.current.y;
        let vx = planetVelRef.current.vx;
        let vy = planetVelRef.current.vy;

        // Symplectic Velocity Verlet Integration (10 sub-steps for celestial stability)
        const subSteps = 10;
        const subDt = (dt * simSpeed) / subSteps;
        let { ax, ay } = computeAccel(px, py);

        for (let s = 0; s < subSteps; s++) {
          const vx_half = vx + 0.5 * ax * subDt;
          const vy_half = vy + 0.5 * ay * subDt;

          px += vx_half * subDt;
          py += vy_half * subDt;

          const nextAcc = computeAccel(px, py);

          vx = vx_half + 0.5 * nextAcc.ax * subDt;
          vy = vy_half + 0.5 * nextAcc.ay * subDt;

          ax = nextAcc.ax;
          ay = nextAcc.ay;
        }

        planetPosRef.current = { x: px, y: py };
        planetVelRef.current = { vx, vy };

        // Append to trajectory trail (max 180 points)
        trailRef.current = [...trailRef.current.slice(-180), { x: px, y: py }];

        // Telemetry update
        updateTelemetry(px, py, vx, vy, starMass, gravityOn);
      }

      drawScene();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, simSpeed, starMass, planetMass, gravityOn, showVectors, showGrid, isDraggingPlanet, isDraggingVelocity, updateTelemetry, resetKey]);

  // Log experiment measurement to Lab Notebook
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'gravity_and_orbits',
        variableName: 'Orbital_Velocity_and_Period',
        measuredValue: telemetry.v_kms,
        theoreticalValue: telemetry.v_circ_kms,
        unit: 'km/s',
        parameters: {
          Star_Mass_M: `${starMass.toFixed(1)} M☉`,
          Planet_Mass_m: `${planetMass.toFixed(1)} M⊕`,
          Orbital_Radius_r: `${telemetry.r_AU} AU (${(telemetry.r_AU * 149.6).toFixed(1)} million km)`,
          Instantaneous_Speed_v: `${telemetry.v_kms} km/s`,
          Theoretical_Circular_Speed: `${telemetry.v_circ_kms} km/s`,
          Gravitational_Force: `${telemetry.Fg_relative} F_earth`,
          Period_T: `${telemetry.period_yr} yr`,
          Gravity_State: gravityOn ? 'Enabled' : 'Zero Gravity (Drifting)',
          Orbit_Classification: telemetry.orbitType,
        },
        equation: 'F_g = (G · M · m) / r² | v_orb = √(G·M / r) | T² = (4π²/GM) · r³',
        timestamp: new Date().toISOString(),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none" id="gravity-orbits-root">
      
      {/* 1. Header Bar with Title & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-sky-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner">
            <Orbit className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{tI18n('experiments.gravity_and_orbits.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-amber-300">
                F_g = G·M·m/r²
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER C • SIMULATION 15</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Log Measurement Button */}
          <button
            id="gravity-orbits-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              logged
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{logged ? (tI18n('experiments.gravity_and_orbits.logged') || 'Logged ✓') : (tI18n('experiments.gravity_and_orbits.log') || 'Log')}</span>
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            id="gravity-orbits-play-pause-btn"
            onClick={() => setIsRunning(!isRunning)}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              isRunning 
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? tI18n('experiments.gravity_and_orbits.pause') : tI18n('experiments.gravity_and_orbits.play')}</span>
          </button>

          {/* Reset Orbit Button */}
          <button
            id="gravity-orbits-reset-btn"
            onClick={handleReset}
            title={tI18n('experiments.gravity_and_orbits.reset')}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Prominent Controls Bar with Standard Presets & Speed Controls */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3.5">
        
        {/* Presets Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            {tI18n('experiments.gravity_and_orbits.controlsBar')}
          </span>
          <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium me-1 hidden sm:inline">
              {tI18n('experiments.gravity_and_orbits.presets')}:
            </span>
            <button
              onClick={() => applyPreset('circular')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.gravity_and_orbits.presetCircular')}
            </button>
            <button
              onClick={() => applyPreset('elliptical')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.gravity_and_orbits.presetElliptical')}
            </button>
            <button
              onClick={() => applyPreset('escape')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.gravity_and_orbits.presetEscape')}
            </button>
            <button
              onClick={() => applyPreset('heavyStar')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.gravity_and_orbits.presetHeavyStar')}
            </button>
            <button
              onClick={() => applyPreset('satellite')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.gravity_and_orbits.presetSatellite')}
            </button>
          </div>
        </div>

        {/* Dynamic Action Buttons Row: Gravity Switch, Speed, Clear Trail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          
          {/* Gravity ON / OFF Toggle */}
          <button
            id="btn-gravity-toggle"
            onClick={() => setGravityOn(!gravityOn)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              gravityOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>{tI18n('experiments.gravity_and_orbits.gravityToggle')}: {gravityOn ? 'ON' : 'OFF'}</span>
          </button>

          {/* Vectors Toggle */}
          <button
            id="btn-vectors-toggle"
            onClick={() => setShowVectors(!showVectors)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
              showVectors
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span>{tI18n('experiments.gravity_and_orbits.showVectors')}</span>
          </button>

          {/* Clear Trail Button */}
          <button
            id="btn-clear-trail"
            onClick={handleClearTrail}
            className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-4 h-4 shrink-0 text-slate-400" />
            <span>{tI18n('experiments.gravity_and_orbits.clearTrail')}</span>
          </button>

          {/* Speed Selector Segmented Pill */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 justify-between">
            {[0.5, 1.0, 2.0, 4.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`min-h-[36px] flex-1 text-xs font-bold rounded-lg transition-all ${
                  simSpeed === spd
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 3. Main Stage: Interactive Canvas & Sliders Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Unobstructed Canvas Display with Dragging & Orbit Rings */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between items-center relative min-h-[440px] overflow-hidden">
          
          {/* Top Canvas Status */}
          <div className="w-full flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">
                {tI18n('experiments.gravity_and_orbits.dragTip')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {tI18n('experiments.gravity_and_orbits.orbitType')}:
              </span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                telemetry.orbitType === 'circular' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                telemetry.orbitType === 'elliptical' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                telemetry.orbitType === 'hyperbolic' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {tI18n(`experiments.gravity_and_orbits.${telemetry.orbitType}`)}
              </span>
            </div>
          </div>

          {/* Interactive 2D Canvas */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={350}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-auto max-h-[380px] rounded-xl bg-slate-950 cursor-crosshair border border-slate-900 shadow-inner touch-none select-none"
            />
          </div>

          {/* Real-time Astronomical Telemetry Readouts */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">{tI18n('experiments.gravity_and_orbits.telemetry')}:</span>
            </div>
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.gravity_and_orbits.orbitalRadius')}:</span>
                <span className="text-xs sm:text-sm font-bold text-sky-400">{telemetry.r_AU} AU</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.gravity_and_orbits.velocity')}:</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400">{telemetry.v_kms} km/s</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.gravity_and_orbits.gravForce')}:</span>
                <span className="text-xs sm:text-sm font-bold text-amber-400">{telemetry.Fg_relative} F⊕</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.gravity_and_orbits.period')}:</span>
                <span className="text-xs sm:text-sm font-bold text-purple-400">{telemetry.period_yr} yr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Celestial Mass Sliders & Visualization Controls */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Masses Control Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sun className="w-4 h-4 text-amber-400" />
              {tI18n('experiments.gravity_and_orbits.starMass')}
            </span>

            {/* Star Mass Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-300">{tI18n('experiments.gravity_and_orbits.starMass')}</span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {starMass.toFixed(1)} M☉
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={starMass}
                onChange={(e) => setStarMass(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5 M☉ (Dwarf)</span>
                <span>1.0 M☉ (Sun)</span>
                <span>3.0 M☉ (Giant)</span>
              </div>
            </div>

            {/* Planet Mass Slider */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-300">{tI18n('experiments.gravity_and_orbits.planetMass')}</span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {planetMass.toFixed(1)} M⊕
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={planetMass}
                onChange={(e) => setPlanetMass(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.1 M⊕ (Mercury)</span>
                <span>1.0 M⊕ (Earth)</span>
                <span>5.0 M⊕ (Super-Earth)</span>
              </div>
            </div>
          </div>

          {/* Visual Display Toggles Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Grid className="w-4 h-4 text-indigo-400" />
              {tI18n('experiments.gravity_and_orbits.showGrid')}
            </span>

            <div className="space-y-2 text-xs">
              {/* Toggle Orbital Distance Rings */}
              <button
                onClick={() => setShowGrid(prev => !prev)}
                className={`min-h-[42px] w-full px-3.5 py-2 rounded-xl border flex items-center justify-between transition-all active:scale-95 ${
                  showGrid
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-400" />
                  {tI18n('experiments.gravity_and_orbits.showGrid')}
                </span>
                <span>{showGrid ? '✓' : '✗'}</span>
              </button>

              {/* Toggle Force and Velocity Vectors */}
              <button
                onClick={() => setShowVectors(prev => !prev)}
                className={`min-h-[42px] w-full px-3.5 py-2 rounded-xl border flex items-center justify-between transition-all active:scale-95 ${
                  showVectors
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-sky-400" />
                  {tI18n('experiments.gravity_and_orbits.showVectors')}
                </span>
                <span>{showVectors ? '✓' : '✗'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
