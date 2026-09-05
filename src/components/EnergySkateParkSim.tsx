import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Activity, 
  Pause, 
  Play, 
  RotateCcw, 
  BookmarkCheck, 
  Zap, 
  Layers, 
  Gauge, 
  Sliders, 
  Sparkles, 
  Eye, 
  Info,
  Globe,
  Flame,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart3,
  Move
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface EnergySkateParkSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

type TrackType = 'uRamp' | 'rollerCoaster' | 'skiSlope';

interface EnvPreset {
  id: string;
  nameKey: string;
  g: number;
  icon: string;
}

const ENV_PRESETS: EnvPreset[] = [
  { id: 'earth', nameKey: 'envEarth', g: 9.8, icon: '🌍' },
  { id: 'moon', nameKey: 'envMoon', g: 1.6, icon: '🌕' },
  { id: 'jupiter', nameKey: 'envJupiter', g: 24.8, icon: '🪐' },
  { id: 'space', nameKey: 'envSpace', g: 0.0, icon: '🌌' },
];

export const EnergySkateParkSim: React.FC<EnergySkateParkSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // Core Physical States
  const [trackType, setTrackType] = useState<TrackType>('uRamp');
  const [mass, setMass] = useState<number>(60); // kg
  const [gravity, setGravity] = useState<number>(9.8); // m/s²
  const [friction, setFriction] = useState<number>(0.02); // coefficient μ
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  const [activeEnv, setActiveEnv] = useState<string>('earth');

  // Visualization Overlays
  const [showPieChart, setShowPieChart] = useState<boolean>(true);
  const [showBarGraph, setShowBarGraph] = useState<boolean>(true);
  const [showSpeedometer, setShowSpeedometer] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Logging Feedback
  const [logged, setLogged] = useState<boolean>(false);

  // Skater Simulation Refs
  // Parameter u in [-1, 1] representing coordinate along the track
  const posNormRef = useRef<number>(-0.85);
  const velNormRef = useRef<number>(0);
  const thermalERef = useRef<number>(0);
  const initialEnergyRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Telemetry display state
  const [displayEnergies, setDisplayEnergies] = useState({
    kineticE: 0,
    potentialE: 60 * 9.8 * 4.5,
    thermalE: 0,
    totalE: 60 * 9.8 * 4.5,
    speed: 0,
    height: 4.5,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Track height function y(u) in meters, where u in [-1, 1]
  // Returns height in meters (0 to 6m)
  const getTrackHeight = useCallback((u: number, type: TrackType): number => {
    const clampedU = Math.max(-1, Math.min(1, u));
    switch (type) {
      case 'uRamp':
        // Parabola y = 5.5 * u²
        return 5.5 * clampedU * clampedU;
      case 'rollerCoaster':
        // Double-well coaster: high on left (5.5m), drops to 0.8m, middle hill (3.2m), second drop (0.5m), rises to 4.5m
        // Standard polynomial / cosine blend
        const cos1 = Math.cos(clampedU * Math.PI * 1.5);
        const baseline = 2.4 - 1.8 * clampedU + 1.6 * (clampedU * clampedU);
        return Math.max(0.2, Math.min(5.8, baseline + 1.2 * cos1));
      case 'skiSlope':
        // Smooth downhill incline from 5.6m on left (u = -1) flattening out to 0m on right (u >= 0.2)
        if (clampedU < 0.2) {
          const t = (clampedU + 1) / 1.2; // 0 to 1
          return 5.5 * Math.pow(1 - t, 2.2);
        }
        return 0.05; // flat ground
      default:
        return 5.5 * clampedU * clampedU;
    }
  }, []);

  // Track derivative dy/du (for slopes, tangents, and normal force)
  const getTrackSlope = useCallback((u: number, type: TrackType): number => {
    const du = 0.005;
    const y1 = getTrackHeight(u - du, type);
    const y2 = getTrackHeight(u + du, type);
    return (y2 - y1) / (2 * du);
  }, [getTrackHeight]);

  // Screen coordinates projection
  // Canvas width: 600px (internal), height: 320px
  // u in [-1, 1] maps to px in [60, 540]
  // y in [0, 6m] maps to py in [270, 40]
  const projectToScreen = useCallback((u: number, height_m: number) => {
    const px = 60 + ((u + 1) / 2) * 480;
    const py = 270 - (height_m / 6.0) * 230;
    return { px, py };
  }, []);

  // Screen to track coordinate inverse (for dragging)
  const screenToTrackU = useCallback((screenX: number, rectWidth: number): number => {
    const scale = 600 / rectWidth;
    const internalX = screenX * scale;
    const u = ((internalX - 60) / 480) * 2 - 1;
    return Math.max(-0.96, Math.min(0.96, u));
  }, []);

  // Set Environment Preset
  const handleSelectEnv = (env: EnvPreset) => {
    setGravity(env.g);
    setActiveEnv(env.id);
  };

  // Set Skater Mass Preset
  const handleSkaterPreset = (m: number) => {
    setMass(m);
  };

  // Reset Skater Simulation
  const handleReset = useCallback(() => {
    posNormRef.current = -0.85;
    velNormRef.current = 0;
    thermalERef.current = 0;
    const h0 = getTrackHeight(-0.85, trackType);
    const initialU = mass * gravity * h0;
    initialEnergyRef.current = initialU;
    setDisplayEnergies({
      kineticE: 0,
      potentialE: initialU,
      thermalE: 0,
      totalE: initialU,
      speed: 0,
      height: h0,
    });
  }, [getTrackHeight, trackType, mass, gravity]);

  // Handle Track Change
  const handleTrackChange = (newTrack: TrackType) => {
    setTrackType(newTrack);
    posNormRef.current = -0.85;
    velNormRef.current = 0;
    thermalERef.current = 0;
  };

  // Physics Update & Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCounter = 0;

    const render = (now: number) => {
      const rawDt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;
      const speedScale = isSlowMo ? 0.35 : 1.0;
      const dt = rawDt * speedScale;

      // 1. Physics Integration (Symplectic Multi-substep)
      if (isRunning && !isDraggingRef.current) {
        const numSubSteps = 12;
        const dtSub = dt / numSubSteps;
        const L0 = 5.0; // horizontal physical span in meters

        for (let step = 0; step < numSubSteps; step++) {
          const u = posNormRef.current;
          const v = velNormRef.current; // tangential speed along track in m/s
          let therm = thermalERef.current;

          const dy_du = getTrackSlope(u, trackType);
          // Arc length element: ds/du = sqrt(L0² + (dy_du)²)
          const S_prime = Math.sqrt(L0 * L0 + dy_du * dy_du);

          // Tangent angle θ = arctan(dy/dx) = arctan(dy_du / L0)
          const sinTheta = dy_du / S_prime;
          const cosTheta = L0 / S_prime;

          // Tangential acceleration from gravity: a_g = -g · sin(θ)
          const a_grav = -gravity * sinTheta;

          // Normal force per unit mass: N/m = g·cos(θ) + v²/R_curvature
          // Friction deceleration: a_fric = μ · g·cos(θ) · sign(v)
          let a_fric = 0;
          if (friction > 0 && Math.abs(v) > 0.001) {
            const normalAcc = Math.max(0, gravity * cosTheta);
            const f_mag = friction * normalAcc;
            a_fric = f_mag * Math.sign(v);

            // Thermal energy dissipation rate: dE_th = μ · m · N · |v| · dt
            const dTherm = friction * (mass * normalAcc) * Math.abs(v) * dtSub;
            therm += dTherm;
            thermalERef.current = therm;
          }

          // Semi-implicit velocity update
          let nv = v + (a_grav - a_fric) * dtSub;

          // Stopping condition at minimum when friction dominates
          if (friction > 0 && Math.abs(dy_du) < 0.25 && Math.abs(nv) < 0.08) {
            nv = 0;
          }

          // Coordinate update: du/dt = v / (ds/du)
          let nu = u + (nv / S_prime) * dtSub;

          // Boundary bounce / reflection at track ends
          if (nu > 0.95) {
            nu = 0.95;
            nv = -Math.abs(nv) * 0.95; // slight boundary damping
          } else if (nu < -0.95) {
            nu = -0.95;
            nv = Math.abs(nv) * 0.95;
          }

          posNormRef.current = nu;
          velNormRef.current = nv;
        }
      }

      // Current instantaneous state
      const currentU = posNormRef.current;
      const currentV = velNormRef.current;
      const currentTherm = thermalERef.current;
      const currentHeight = getTrackHeight(currentU, trackType);
      const speed_m_s = Math.abs(currentV);

      const kineticE = 0.5 * mass * speed_m_s * speed_m_s;
      const potentialE = mass * gravity * currentHeight;
      const totalE = kineticE + potentialE + currentTherm;

      frameCounter++;
      if (frameCounter % 2 === 0) {
        setDisplayEnergies({
          kineticE,
          potentialE,
          thermalE: currentTherm,
          totalE,
          speed: speed_m_s,
          height: currentHeight,
        });
      }

      // --- 2. DRAW CANVAS SCENE ---
      ctx.clearRect(0, 0, 600, 320);

      // A. Deep Sky / Background Environment
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 320);
      if (activeEnv === 'space') {
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(1, '#090d16');
      } else if (activeEnv === 'moon') {
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(1, '#1e293b');
      } else {
        bgGrad.addColorStop(0, '#0b1329');
        bgGrad.addColorStop(0.7, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 320);

      // Distant stars / particles in space/moon
      if (activeEnv === 'space' || activeEnv === 'moon') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const starCoords = [[50, 40], [120, 80], [240, 30], [420, 60], [540, 35], [510, 110], [90, 160], [330, 45]];
        starCoords.forEach(([sx, sy]) => ctx.fillRect(sx, sy, 1.5, 1.5));
      }

      // B. Height Grid & Reference Dashed Lines
      if (showGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        for (let h = 0; h <= 6; h += 1) {
          const { py } = projectToScreen(0, h);
          ctx.beginPath();
          ctx.moveTo(40, py);
          ctx.lineTo(560, py);
          ctx.stroke();

          // Height number badge on left
          ctx.fillStyle = h === 0 ? '#38bdf8' : '#94a3b8';
          ctx.font = '9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${h}m`, 34, py + 3);
        }
        ctx.setLineDash([]);
        ctx.restore();
      }

      // C. Ground Platform
      ctx.save();
      const groundGrad = ctx.createLinearGradient(0, 270, 0, 320);
      groundGrad.addColorStop(0, '#334155');
      groundGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(40, 270, 520, 45);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 270, 520, 45);
      ctx.restore();

      // D. Draw Track Structure (Rails, Support Pillars, Metallic Track)
      ctx.save();

      // Track support pillars
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 3;
      for (let uPillar = -0.8; uPillar <= 0.8; uPillar += 0.4) {
        const hPillar = getTrackHeight(uPillar, trackType);
        const { px: ppx, py: ppy } = projectToScreen(uPillar, hPillar);
        ctx.beginPath();
        ctx.moveTo(ppx, ppy);
        ctx.lineTo(ppx, 270);
        ctx.stroke();
      }

      // Track Underglow / Bed
      ctx.beginPath();
      for (let px_scan = 60; px_scan <= 540; px_scan += 4) {
        const u_scan = ((px_scan - 60) / 480) * 2 - 1;
        const h_scan = getTrackHeight(u_scan, trackType);
        const { px, py } = projectToScreen(u_scan, h_scan);
        if (px_scan === 60) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Track Shiny Metal Rail Top
      ctx.beginPath();
      for (let px_scan = 60; px_scan <= 540; px_scan += 4) {
        const u_scan = ((px_scan - 60) / 480) * 2 - 1;
        const h_scan = getTrackHeight(u_scan, trackType);
        const { px, py } = projectToScreen(u_scan, h_scan);
        if (px_scan === 60) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();

      // E. Skater Location on Screen
      const { px: skaterX, py: skaterY } = projectToScreen(currentU, currentHeight);
      const dy_du = getTrackSlope(currentU, trackType);
      const trackAngle = Math.atan2(dy_du * (230 / 6.0), (480 / 2.0)); // angle on screen canvas

      // F. Draw Skater Body & Skateboard (Oriented Tangent to Track)
      ctx.save();
      ctx.translate(skaterX, skaterY);
      ctx.rotate(trackAngle);

      // Skateboard Deck
      ctx.beginPath();
      ctx.roundRect(-16, -4, 32, 5, 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Skateboard Wheels
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-11, 2, 3, 0, Math.PI * 2);
      ctx.arc(11, 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Skater Legs & Body
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      // Legs
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-4, -14);
      ctx.lineTo(0, -18);
      ctx.moveTo(6, -4);
      ctx.lineTo(4, -14);
      ctx.lineTo(0, -18);
      ctx.stroke();

      // Torso
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, -32);
      ctx.stroke();

      // Arms
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, -22);
      ctx.lineTo(0, -28);
      ctx.lineTo(10, -24);
      ctx.stroke();

      // Head / Helmet
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -38, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // G. Floating Pie Chart (Over Skater)
      if (showPieChart && totalE > 0.1) {
        ctx.save();
        const pieRadius = 18;
        const pieX = skaterX;
        const pieY = skaterY - 60;

        // Background shadow circle
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.beginPath();
        ctx.arc(pieX, pieY, pieRadius + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.stroke();

        let startAngle = -Math.PI / 2;

        // Kinetic Slice (Emerald)
        const kFrac = kineticE / totalE;
        if (kFrac > 0.001) {
          const endAngle = startAngle + kFrac * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(pieX, pieY);
          ctx.arc(pieX, pieY, pieRadius, startAngle, endAngle);
          ctx.closePath();
          ctx.fillStyle = '#10b981';
          ctx.fill();
          startAngle = endAngle;
        }

        // Potential Slice (Sky Blue)
        const uFrac = potentialE / totalE;
        if (uFrac > 0.001) {
          const endAngle = startAngle + uFrac * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(pieX, pieY);
          ctx.arc(pieX, pieY, pieRadius, startAngle, endAngle);
          ctx.closePath();
          ctx.fillStyle = '#0284c7';
          ctx.fill();
          startAngle = endAngle;
        }

        // Thermal Slice (Rose/Red)
        const thFrac = currentTherm / totalE;
        if (thFrac > 0.001) {
          const endAngle = startAngle + thFrac * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(pieX, pieY);
          ctx.arc(pieX, pieY, pieRadius, startAngle, endAngle);
          ctx.closePath();
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        }
        ctx.restore();
      }

      // H. Velocity Vector Arrow
      if (showVectors && speed_m_s > 0.2) {
        ctx.save();
        const vLength = Math.min(speed_m_s * 4.5, 55);
        const vDirection = Math.sign(currentV);
        const vx = Math.cos(trackAngle) * vLength * vDirection;
        const vy = Math.sin(trackAngle) * vLength * vDirection;

        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(skaterX, skaterY - 18);
        ctx.lineTo(skaterX + vx, skaterY - 18 + vy);
        ctx.stroke();

        // Arrowhead
        const arrowAngle = Math.atan2(vy, vx);
        ctx.beginPath();
        ctx.moveTo(skaterX + vx, skaterY - 18 + vy);
        ctx.lineTo(skaterX + vx - 7 * Math.cos(arrowAngle - Math.PI / 6), skaterY - 18 + vy - 7 * Math.sin(arrowAngle - Math.PI / 6));
        ctx.lineTo(skaterX + vx - 7 * Math.cos(arrowAngle + Math.PI / 6), skaterY - 18 + vy - 7 * Math.sin(arrowAngle + Math.PI / 6));
        ctx.fill();

        ctx.font = 'bold 9px monospace';
        ctx.fillText(`v = ${speed_m_s.toFixed(1)} m/s`, skaterX + vx + 4, skaterY - 18 + vy);
        ctx.restore();
      }

      // I. Real-time Mini Speedometer (Top Right of Canvas)
      if (showSpeedometer) {
        ctx.save();
        const speedoX = 525;
        const speedoY = 65;
        const speedoR = 32;

        // Gauge background
        ctx.beginPath();
        ctx.arc(speedoX, speedoY, speedoR, Math.PI * 0.75, Math.PI * 2.25);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Gauge arc progress
        const maxV = 16.0; // max gauge speed m/s
        const speedFraction = Math.min(speed_m_s / maxV, 1.0);
        const currentAngle = Math.PI * 0.75 + speedFraction * (Math.PI * 1.5);

        ctx.beginPath();
        ctx.arc(speedoX, speedoY, speedoR - 4, Math.PI * 0.75, currentAngle);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Speed readout in center
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${speed_m_s.toFixed(1)}`, speedoX, speedoY + 2);
        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('m/s', speedoX, speedoY + 12);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    isSlowMo,
    gravity,
    friction,
    mass,
    trackType,
    activeEnv,
    showPieChart,
    showSpeedometer,
    showVectors,
    showGrid,
    getTrackHeight,
    getTrackSlope,
    projectToScreen,
  ]);

  // Dragging Handlers for interactive track positioning
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newU = screenToTrackU(clickX, rect.width);

    isDraggingRef.current = true;
    posNormRef.current = newU;
    velNormRef.current = 0;
    thermalERef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newU = screenToTrackU(clickX, rect.width);

    posNormRef.current = newU;
    velNormRef.current = 0;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Log Experiment Data to Scientific Notebook
  const handleLog = () => {
    if (onLogMeasurement) {
      const mechanicalE = displayEnergies.kineticE + displayEnergies.potentialE;
      onLogMeasurement({
        experiment: 'energy_skate_park',
        variableName: 'Total_Energy_and_Mechanical_Conservation',
        measuredValue: parseFloat(displayEnergies.totalE.toFixed(1)),
        theoreticalValue: parseFloat(displayEnergies.totalE.toFixed(1)),
        unit: 'J',
        parameters: {
          Track_Type: trackType,
          Skater_Mass_m: `${mass} kg`,
          Gravity_g: `${gravity.toFixed(1)} m/s² (${activeEnv})`,
          Friction_Coefficient_mu: `${(friction * 100).toFixed(0)}%`,
          Current_Height_h: `${displayEnergies.height.toFixed(2)} m`,
          Current_Speed_v: `${displayEnergies.speed.toFixed(2)} m/s`,
          Kinetic_Energy_K: `${displayEnergies.kineticE.toFixed(1)} J`,
          Potential_Energy_U: `${displayEnergies.potentialE.toFixed(1)} J`,
          Thermal_Energy_Eth: `${displayEnergies.thermalE.toFixed(1)} J`,
          Total_Mechanical_Energy: `${mechanicalE.toFixed(1)} J`,
          Total_Energy_E: `${displayEnergies.totalE.toFixed(1)} J`,
        },
        equation: `E_total = K + U_g + E_th = ½·(${mass})·(${displayEnergies.speed.toFixed(1)})² + (${mass})·(${gravity.toFixed(1)})·(${displayEnergies.height.toFixed(1)}) + ${displayEnergies.thermalE.toFixed(1)} J = ${displayEnergies.totalE.toFixed(1)} J`,
        timestamp: new Date().toISOString(),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Maximum total energy reference for bar scaling (capped at min 500J for visual balance)
  const maxBarE = Math.max(displayEnergies.totalE, 60 * 9.8 * 5.5, 500);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none" id="energy-skate-park-root">
      
      {/* 1. Header Bar with Title, Simulation Status, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-sky-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{tI18n('experiments.energy_skate_park.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-amber-300 whitespace-nowrap">
                E = K + U + E_th
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.energy_skate_park.subtitle')}</p>
          </div>
        </div>

        {/* Action Controls - Strictly Protected Against Text Overflow */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Play / Pause Toggle */}
          <button
            id="energy-skate-play-pause-btn"
            onClick={() => setIsRunning(!isRunning)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
            <span>{isRunning ? tI18n('experiments.energy_skate_park.pause') : tI18n('experiments.energy_skate_park.play')}</span>
          </button>

          {/* Slow Motion Toggle */}
          <button
            onClick={() => setIsSlowMo(!isSlowMo)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 border ${
              isSlowMo
                ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{isSlowMo ? '0.35x' : '1.0x'}</span>
          </button>

          {/* Log Measurement Button */}
          <button
            id="energy-skate-park-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              logged
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span>{logged ? (tI18n('experiments.energy_skate_park.logged') || 'Logged ✓') : (tI18n('experiments.energy_skate_park.log') || 'Log')}</span>
          </button>

          {/* Reset Button */}
          <button
            id="energy-skate-park-reset-btn"
            onClick={handleReset}
            title={tI18n('experiments.energy_skate_park.reset')}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center shrink-0"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* 2. Top Bar: Track Selection & Gravity Environment Presets */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Track Shapes */}
          <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider me-1 whitespace-nowrap">
              <Layers className="w-4 h-4 shrink-0" />
              Tracks:
            </span>
            <button
              onClick={() => handleTrackChange('uRamp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                trackType === 'uRamp'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🛹 {tI18n('experiments.energy_skate_park.trackU')}
            </button>
            <button
              onClick={() => handleTrackChange('rollerCoaster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                trackType === 'rollerCoaster'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              〰️ {tI18n('experiments.energy_skate_park.trackRoller')}
            </button>
            <button
              onClick={() => handleTrackChange('skiSlope')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                trackType === 'skiSlope'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              ⛷️ {tI18n('experiments.energy_skate_park.trackSlope')}
            </button>
          </div>

          {/* Environment Gravity Presets */}
          <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1 uppercase tracking-wider me-1 whitespace-nowrap">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              Gravity:
            </span>
            {ENV_PRESETS.map((env) => {
              const isActive = activeEnv === env.id;
              return (
                <button
                  key={env.id}
                  onClick={() => handleSelectEnv(env)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    isActive
                      ? 'bg-sky-500/20 border-sky-500/60 text-sky-200 font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <span>{env.icon}</span>
                  <span>{tI18n(`experiments.energy_skate_park.${env.nameKey}`)}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* 3. Main Stage: Interactive Canvas, Bar Charts, & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Interactive Skate Park Canvas Stage */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative min-h-[440px] overflow-hidden shadow-inner">
          
          {/* Top Formula Dynamic Proportional Card */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-10 font-mono shadow-sm">
            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
              <span className="text-amber-400 font-bold">{tI18n('experiments.energy_skate_park.energyConservationFormula')}:</span>
              <div className="flex items-center gap-1 font-bold">
                <span className="text-amber-400">{displayEnergies.totalE.toFixed(0)} J</span>
                <span className="text-slate-500">=</span>
                <span className="text-emerald-400">{displayEnergies.kineticE.toFixed(0)} K</span>
                <span className="text-slate-500">+</span>
                <span className="text-sky-400">{displayEnergies.potentialE.toFixed(0)} U</span>
                <span className="text-slate-500">+</span>
                <span className="text-rose-400">{displayEnergies.thermalE.toFixed(0)} E_th</span>
              </div>
            </div>

            {/* Total Energy Badge */}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                {tI18n('experiments.energy_skate_park.totalEnergy')}
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {displayEnergies.totalE.toFixed(0)} <span className="text-xs sm:text-sm font-bold text-amber-300">J</span>
              </span>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={320}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-auto max-h-[320px] rounded-xl bg-slate-950 border border-slate-900 shadow-inner cursor-grab active:cursor-grabbing touch-none"
            />
          </div>

          {/* Real-time Vertical / Horizontal Energy Bar Graph */}
          {showBarGraph && (
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 z-10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800/80 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Live Energy Distribution
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  h = {displayEnergies.height.toFixed(2)}m | v = {displayEnergies.speed.toFixed(2)}m/s
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {/* Kinetic (Green) */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-emerald-400 font-semibold block truncate">
                    {tI18n('experiments.energy_skate_park.kinetic')}
                  </span>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-1">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-75"
                      style={{ width: `${Math.min(100, (displayEnergies.kineticE / maxBarE) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-emerald-300 font-bold text-xs sm:text-sm">
                    {displayEnergies.kineticE.toFixed(0)} J
                  </span>
                </div>

                {/* Potential (Sky) */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-sky-400 font-semibold block truncate">
                    {tI18n('experiments.energy_skate_park.potential')}
                  </span>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-1">
                    <div 
                      className="bg-sky-500 h-full rounded-full transition-all duration-75"
                      style={{ width: `${Math.min(100, (displayEnergies.potentialE / maxBarE) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-sky-300 font-bold text-xs sm:text-sm">
                    {displayEnergies.potentialE.toFixed(0)} J
                  </span>
                </div>

                {/* Thermal (Rose) */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-rose-400 font-semibold block truncate">
                    {tI18n('experiments.energy_skate_park.thermal')}
                  </span>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-1">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-75"
                      style={{ width: `${Math.min(100, (displayEnergies.thermalE / maxBarE) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-rose-300 font-bold text-xs sm:text-sm">
                    {displayEnergies.thermalE.toFixed(0)} J
                  </span>
                </div>

                {/* Total (Amber) */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-amber-400 font-semibold block truncate">
                    {tI18n('experiments.energy_skate_park.totalEnergy')}
                  </span>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-1">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-75"
                      style={{ width: `${Math.min(100, (displayEnergies.totalE / maxBarE) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-amber-300 font-bold text-xs sm:text-sm">
                    {displayEnergies.totalE.toFixed(0)} J
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Interactive Sliders, Mass Presets, & Overlays */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Sliders Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
              Parameters & Physics Controls
            </span>

            {/* Skater Mass Presets & Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-amber-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                  {tI18n('experiments.energy_skate_park.mass')} (m)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {mass} kg
                </span>
              </div>

              {/* Mass Quick Presets */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { m: 35, label: tI18n('experiments.energy_skate_park.skaterLight') },
                  { m: 60, label: tI18n('experiments.energy_skate_park.skaterMedium') },
                  { m: 90, label: tI18n('experiments.energy_skate_park.skaterHeavy') },
                ].map((p) => (
                  <button
                    key={p.m}
                    onClick={() => handleSkaterPreset(p.m)}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-medium border transition-all active:scale-95 whitespace-nowrap text-center ${
                      mass === p.m
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.m} kg
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="20"
                max="120"
                step="5"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Gravity Slider (g) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shrink-0" />
                  {tI18n('experiments.energy_skate_park.gravity')} (g)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {gravity.toFixed(1)} m/s²
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="26.0"
                step="0.2"
                value={gravity}
                onChange={(e) => {
                  setGravity(Number(e.target.value));
                  setActiveEnv('custom');
                }}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0 (Space)</span>
                <span>9.8 (Earth)</span>
                <span>24.8 (Jupiter)</span>
              </div>
            </div>

            {/* Track Friction Slider (μ) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  {tI18n('experiments.energy_skate_park.friction')} (μ)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {(friction * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.10"
                step="0.005"
                value={friction}
                onChange={(e) => setFriction(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% ({tI18n('experiments.energy_skate_park.frictionNone')})</span>
                <span>5%</span>
                <span>10% ({tI18n('experiments.energy_skate_park.frictionLots')})</span>
              </div>
            </div>

            {/* Overlays / Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 shrink-0" />
                Display Overlays
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={showPieChart}
                    onChange={(e) => setShowPieChart(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <span className="truncate">{tI18n('experiments.energy_skate_park.pieChart')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={showBarGraph}
                    onChange={(e) => setShowBarGraph(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <span className="truncate">{tI18n('experiments.energy_skate_park.barGraph')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={showSpeedometer}
                    onChange={(e) => setShowSpeedometer(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <span className="truncate">{tI18n('experiments.energy_skate_park.speedometer')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={(e) => setShowVectors(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <span className="truncate">{tI18n('experiments.energy_skate_park.vectors')}</span>
                </label>
              </div>
            </div>

          </div>

          {/* Educational Note & Drag Instruction */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {tI18n('experiments.energy_skate_park.dragTip')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
