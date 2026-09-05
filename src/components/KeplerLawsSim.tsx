import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Compass, 
  Pause, 
  Play, 
  RotateCcw, 
  Activity, 
  BookmarkCheck, 
  Globe, 
  Orbit, 
  Layers, 
  Gauge, 
  Sliders, 
  Sparkles, 
  Eye, 
  Info,
  FastForward
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface KeplerLawsSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

interface CelestialPreset {
  id: string;
  nameKey: string;
  a_AU: number;
  e: number;
  color: string;
  radiusPx: number;
}

const CELESTIAL_PRESETS: CelestialPreset[] = [
  { id: 'earth', nameKey: 'presetEarth', a_AU: 1.00, e: 0.017, color: '#38bdf8', radiusPx: 7 },
  { id: 'mars', nameKey: 'presetMars', a_AU: 1.52, e: 0.093, color: '#f87171', radiusPx: 6 },
  { id: 'mercury', nameKey: 'presetMercury', a_AU: 0.39, e: 0.206, color: '#cbd5e1', radiusPx: 5 },
  { id: 'comet', nameKey: 'presetComet', a_AU: 2.20, e: 0.750, color: '#a78bfa', radiusPx: 5 },
  { id: 'circular', nameKey: 'presetCircular', a_AU: 1.20, e: 0.000, color: '#34d399', radiusPx: 6 },
];

export const KeplerLawsSim: React.FC<KeplerLawsSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // Core Physical State
  const [semiMajorAxis_AU, setSemiMajorAxis_AU] = useState<number>(1.50); // a in Astronomical Units (AU)
  const [eccentricity, setEccentricity] = useState<number>(0.55); // e (0 to 0.85)
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<number>(1.0); // 0.5x, 1x, 2x, 4x
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Visualization Overlays
  const [showSweptArea, setShowSweptArea] = useState<boolean>(true);
  const [showFociAndAxes, setShowFociAndAxes] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);

  // Active Preset ID
  const [activePreset, setActivePreset] = useState<string>('custom');

  // Animation Refs
  const orbitalAngleRef = useRef<number>(0); // True anomaly θ (radians)
  const lastTimeRef = useRef<number>(performance.now());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Logging Feedback
  const [logged, setLogged] = useState<boolean>(false);

  // Derived Geometric & Orbital Quantities
  // b = a · √(1 - e²)
  const semiMinorAxis_AU = useMemo(() => {
    return semiMajorAxis_AU * Math.sqrt(Math.max(1 - eccentricity * eccentricity, 0.01));
  }, [semiMajorAxis_AU, eccentricity]);

  // Linear eccentricity c = a · e (distance from center to focus)
  const focalDistance_AU = useMemo(() => {
    return semiMajorAxis_AU * eccentricity;
  }, [semiMajorAxis_AU, eccentricity]);

  // Perihelion and Aphelion distances
  const r_perihelion_AU = useMemo(() => {
    return semiMajorAxis_AU * (1 - eccentricity);
  }, [semiMajorAxis_AU, eccentricity]);

  const r_aphelion_AU = useMemo(() => {
    return semiMajorAxis_AU * (1 + eccentricity);
  }, [semiMajorAxis_AU, eccentricity]);

  // Kepler's 3rd Law: T² = a³ => T = a^(3/2) in Earth Years
  const period_Years = useMemo(() => {
    return Math.pow(semiMajorAxis_AU, 1.5);
  }, [semiMajorAxis_AU]);

  const period_Days = useMemo(() => {
    return period_Years * 365.25;
  }, [period_Years]);

  // Kepler's Constant T² / a³
  const keplerRatio = useMemo(() => {
    const t2 = Math.pow(period_Years, 2);
    const a3 = Math.pow(semiMajorAxis_AU, 3);
    return t2 / Math.max(a3, 0.0001);
  }, [period_Years, semiMajorAxis_AU]);

  // Select Preset Handler
  const handleSelectPreset = (preset: CelestialPreset) => {
    setSemiMajorAxis_AU(preset.a_AU);
    setEccentricity(preset.e);
    setActivePreset(preset.id);
  };

  const handleReset = () => {
    setSemiMajorAxis_AU(1.50);
    setEccentricity(0.55);
    orbitalAngleRef.current = 0;
    setSimSpeedMultiplier(1.0);
    setActivePreset('custom');
  };

  // Canvas Coordinate Scaler (mapping AU to Canvas Pixels)
  // Max semi-major axis is ~3.0 AU, canvas width is 600, height is 340
  const scalePxPerAU = useMemo(() => {
    const maxA = Math.max(semiMajorAxis_AU, 0.5);
    return Math.min(180 / maxA, 130);
  }, [semiMajorAxis_AU]);

  // Telemetry state for instantaneous readings
  const [telemetry, setTelemetry] = useState<{
    r_AU: number;
    r_millionKm: number;
    v_km_s: number;
    theta_deg: number;
  }>({
    r_AU: 1.0,
    r_millionKm: 149.6,
    v_km_s: 29.8,
    theta_deg: 0,
  });

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      // Update orbital angle θ using Kepler's 2nd Law (dθ/dt = h / r²)
      if (isRunning) {
        const theta = orbitalAngleRef.current;
        // r(θ) = a(1 - e²) / (1 + e·cos θ)
        const p_AU = semiMajorAxis_AU * (1 - eccentricity * eccentricity);
        const curR_AU = p_AU / (1 + eccentricity * Math.cos(theta));

        // Mean motion n = 2π / T (rad/s scaled for simulation)
        // Instantaneous angular velocity: dθ/dt = (2π / T) * (a / r)² * √(1 - e²)
        const baseRate = 0.85 * simSpeedMultiplier;
        const dTheta = (baseRate / Math.pow(curR_AU, 2)) * Math.sqrt(1 - eccentricity * eccentricity) * dt;

        orbitalAngleRef.current = (theta + dTheta) % (Math.PI * 2);
      }

      const theta = orbitalAngleRef.current;
      const a_px = semiMajorAxis_AU * scalePxPerAU;
      const b_px = semiMinorAxis_AU * scalePxPerAU;
      const c_px = focalDistance_AU * scalePxPerAU;

      const centerX = 300;
      const centerY = 170;

      // Foci coordinates
      const sunFocusX = centerX - c_px; // F1 (Sun)
      const sunFocusY = centerY;
      const emptyFocusX = centerX + c_px; // F2 (Empty focus)
      const emptyFocusY = centerY;

      // Current Planet Polar Position relative to Sun F1
      const p_AU = semiMajorAxis_AU * (1 - eccentricity * eccentricity);
      const curR_AU = p_AU / (1 + eccentricity * Math.cos(theta));
      const curR_px = curR_AU * scalePxPerAU;

      const planetX = sunFocusX + curR_px * Math.cos(theta);
      const planetY = sunFocusY + curR_px * Math.sin(theta);

      // Instantaneous Speed: v = v_earth · √(2/r - 1/a)
      // v_earth ~ 29.78 km/s
      const v_km_s = 29.78 * Math.sqrt(Math.max(2 / curR_AU - 1 / semiMajorAxis_AU, 0));

      // Update telemetry state throttled
      setTelemetry({
        r_AU: curR_AU,
        r_millionKm: curR_AU * 149.597,
        v_km_s: v_km_s,
        theta_deg: ((theta * 180) / Math.PI) % 360,
      });

      // --- DRAW CANVAS SCENE ---
      ctx.clearRect(0, 0, 600, 340);

      // 1. Deep Space Starfield Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 600, 340);

      // Distant background stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const starSeeds = [
        [40, 50], [90, 220], [150, 40], [220, 290], [380, 45], [450, 280], [530, 80], [570, 230],
        [80, 140], [490, 160], [280, 310], [320, 30], [20, 270], [550, 300]
      ];
      starSeeds.forEach(([sx, sy]) => {
        ctx.fillRect(sx, sy, 1.5, 1.5);
      });

      // 2. Foci & Geometry Axes Overlay (Kepler's 1st Law)
      if (showFociAndAxes) {
        ctx.save();
        // Major Axis (Horizontal line through ellipse)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX - a_px - 20, centerY);
        ctx.lineTo(centerX + a_px + 20, centerY);
        ctx.stroke();

        // Minor Axis (Vertical line through center)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - b_px - 15);
        ctx.lineTo(centerX, centerY + b_px + 15);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center Point C
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '9px monospace';
        ctx.fillText('C', centerX - 3, centerY - 6);

        // Empty Focus F2
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.beginPath();
        ctx.arc(emptyFocusX, emptyFocusY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('F₂', emptyFocusX - 4, emptyFocusY - 8);

        // Sun Focus Label F1
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('F₁ (Sun)', sunFocusX - 16, sunFocusY + 22);

        // Perihelion Marker & Label
        const periX = sunFocusX + r_perihelion_AU * scalePxPerAU;
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(periX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 9px monospace';
        ctx.fillText('Perihelion', periX - 22, centerY - 8);

        // Aphelion Marker & Label
        const aphX = sunFocusX - r_aphelion_AU * scalePxPerAU;
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(aphX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('Aphelion', aphX - 18, centerY - 8);

        ctx.restore();
      }

      // 3. Swept Sectors / Kepler's 2nd Law (Equal Areas in Equal Times)
      if (showSweptArea) {
        ctx.save();
        
        // Static Equal Time Reference Sectors:
        // Sector A (near Perihelion, θ = -0.3 to +0.3): Wide angle, short radius
        const dt_sector = 0.55;
        
        // Draw Perihelion Reference Sector (Area A1)
        ctx.beginPath();
        ctx.moveTo(sunFocusX, sunFocusY);
        for (let t = -dt_sector; t <= dt_sector; t += 0.05) {
          const r_t = (p_AU / (1 + eccentricity * Math.cos(t))) * scalePxPerAU;
          ctx.lineTo(sunFocusX + r_t * Math.cos(t), sunFocusY + r_t * Math.sin(t));
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(52, 211, 153, 0.22)';
        ctx.fill();
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Aphelion Reference Sector (Area A2) (θ = π - dt_aph to π + dt_aph)
        // The angle subtended at aphelion for EQUAL AREA is smaller by factor (r_peri/r_aph)^2
        const dt_aph = dt_sector * Math.pow(r_perihelion_AU / r_aphelion_AU, 1.0);
        ctx.beginPath();
        ctx.moveTo(sunFocusX, sunFocusY);
        for (let t = Math.PI - dt_aph; t <= Math.PI + dt_aph; t += 0.05) {
          const r_t = (p_AU / (1 + eccentricity * Math.cos(t))) * scalePxPerAU;
          ctx.lineTo(sunFocusX + r_t * Math.cos(t), sunFocusY + r_t * Math.sin(t));
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Labels for Equal Areas
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#34d399';
        ctx.fillText('Area A₁', sunFocusX + (r_perihelion_AU * scalePxPerAU * 0.5), sunFocusY + 18);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('Area A₂', sunFocusX - (r_aphelion_AU * scalePxPerAU * 0.6), sunFocusY + 18);

        // Active Sweeping Tail behind Planet
        ctx.beginPath();
        ctx.moveTo(sunFocusX, sunFocusY);
        const sweepSpan = 0.28;
        for (let t = theta - sweepSpan; t <= theta; t += 0.04) {
          const r_t = (p_AU / (1 + eccentricity * Math.cos(t))) * scalePxPerAU;
          ctx.lineTo(sunFocusX + r_t * Math.cos(t), sunFocusY + r_t * Math.sin(t));
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.fill();

        ctx.restore();
      }

      // 4. Elliptical Orbit Path
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, a_px, b_px, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dashed radius vector line from Sun to Planet
      ctx.beginPath();
      ctx.moveTo(sunFocusX, sunFocusY);
      ctx.lineTo(planetX, planetY);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 5. Vectors (Velocity Vector & Gravitational Force Vector)
      if (showVectors) {
        ctx.save();
        // Velocity Vector (tangent to ellipse)
        // Velocity magnitude scaled
        const v_scale = Math.min(v_km_s * 0.9, 45);
        // Tangent angle = theta + pi/2 + flight path angle correction
        const dr_dtheta = (p_AU * eccentricity * Math.sin(theta)) / Math.pow(1 + eccentricity * Math.cos(theta), 2);
        const vx_unit = Math.cos(theta + Math.PI / 2) - (dr_dtheta / curR_AU) * Math.sin(theta + Math.PI / 2) * 0.4;
        const vy_unit = Math.sin(theta + Math.PI / 2) + (dr_dtheta / curR_AU) * Math.cos(theta + Math.PI / 2) * 0.4;
        const mag = Math.hypot(vx_unit, vy_unit) || 1;

        const vx = (vx_unit / mag) * v_scale;
        const vy = (vy_unit / mag) * v_scale;

        // Draw Velocity Vector (Emerald)
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(planetX, planetY);
        ctx.lineTo(planetX + vx, planetY + vy);
        ctx.stroke();

        // Arrow head for velocity
        const vHeadAngle = Math.atan2(vy, vx);
        ctx.beginPath();
        ctx.moveTo(planetX + vx, planetY + vy);
        ctx.lineTo(planetX + vx - 7 * Math.cos(vHeadAngle - Math.PI / 6), planetY + vy - 7 * Math.sin(vHeadAngle - Math.PI / 6));
        ctx.lineTo(planetX + vx - 7 * Math.cos(vHeadAngle + Math.PI / 6), planetY + vy - 7 * Math.sin(vHeadAngle + Math.PI / 6));
        ctx.fill();

        ctx.font = 'bold 9px monospace';
        ctx.fillText(`v = ${v_km_s.toFixed(1)} km/s`, planetX + vx + 4, planetY + vy);

        // Gravitational Force Vector (Pointing to Sun F1)
        const fx_unit = (sunFocusX - planetX) / (curR_px || 1);
        const fy_unit = (sunFocusY - planetY) / (curR_px || 1);
        const f_scale = Math.min((35 / (curR_AU * curR_AU)), 38);

        ctx.strokeStyle = '#f43f5e';
        ctx.fillStyle = '#f43f5e';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(planetX, planetY);
        ctx.lineTo(planetX + fx_unit * f_scale, planetY + fy_unit * f_scale);
        ctx.stroke();

        // Arrow head for force
        const fHeadAngle = Math.atan2(fy_unit, fx_unit);
        ctx.beginPath();
        ctx.moveTo(planetX + fx_unit * f_scale, planetY + fy_unit * f_scale);
        ctx.lineTo(planetX + fx_unit * f_scale - 6 * Math.cos(fHeadAngle - Math.PI / 6), planetY + fy_unit * f_scale - 6 * Math.sin(fHeadAngle - Math.PI / 6));
        ctx.lineTo(planetX + fx_unit * f_scale - 6 * Math.cos(fHeadAngle + Math.PI / 6), planetY + fy_unit * f_scale - 6 * Math.sin(fHeadAngle + Math.PI / 6));
        ctx.fill();

        ctx.restore();
      }

      // 6. Central Star (Sun) at Focus F1
      ctx.save();
      // Corona glow
      const sunGrad = ctx.createRadialGradient(sunFocusX, sunFocusY, 4, sunFocusX, sunFocusY, 22);
      sunGrad.addColorStop(0, '#fef08a');
      sunGrad.addColorStop(0.3, '#f59e0b');
      sunGrad.addColorStop(0.7, '#ea580c');
      sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunFocusX, sunFocusY, 22, 0, Math.PI * 2);
      ctx.fill();

      // Sun core
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sunFocusX, sunFocusY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 7. Planet Body
      ctx.save();
      // Planet glow
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(planetX, planetY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet border & atmosphere
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Planet label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Planet', planetX - 16, planetY - 10);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    semiMajorAxis_AU,
    semiMinorAxis_AU,
    eccentricity,
    focalDistance_AU,
    r_perihelion_AU,
    r_aphelion_AU,
    scalePxPerAU,
    simSpeedMultiplier,
    showSweptArea,
    showFociAndAxes,
    showVectors,
  ]);

  // Log Experiment Data to Scientific Notebook
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'keplers_laws',
        variableName: 'Kepler_Orbital_Harmonics_and_Areal_Velocity',
        measuredValue: parseFloat(period_Years.toFixed(3)),
        theoreticalValue: parseFloat(Math.pow(semiMajorAxis_AU, 1.5).toFixed(3)),
        unit: 'yr',
        parameters: {
          Semi_Major_Axis_a: `${semiMajorAxis_AU.toFixed(3)} AU`,
          Semi_Minor_Axis_b: `${semiMinorAxis_AU.toFixed(3)} AU`,
          Eccentricity_e: `${eccentricity.toFixed(3)}`,
          Focal_Distance_c: `${focalDistance_AU.toFixed(3)} AU`,
          Orbital_Period_T: `${period_Years.toFixed(3)} yr (${period_Days.toFixed(1)} Earth days)`,
          Perihelion_Distance_r_min: `${r_perihelion_AU.toFixed(3)} AU`,
          Aphelion_Distance_r_max: `${r_aphelion_AU.toFixed(3)} AU`,
          Current_Orbital_Radius_r: `${telemetry.r_AU.toFixed(3)} AU (${telemetry.r_millionKm.toFixed(1)}M km)`,
          Instantaneous_Speed_v: `${telemetry.v_km_s.toFixed(2)} km/s`,
          Kepler_Constant_T2_over_a3: `${keplerRatio.toFixed(4)} yr²/AU³`,
          Preset_Body: activePreset,
        },
        equation: `T² / a³ = (${period_Years.toFixed(3)})² / (${semiMajorAxis_AU.toFixed(3)})³ = ${keplerRatio.toFixed(4)} yr²/AU³ ≡ const`,
        timestamp: new Date().toISOString(),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Dynamic Equation Scaling factors for proportional visual
  const tScale = Math.max(0.8, Math.min(1.7, 0.8 + (period_Years / 4) * 0.9));
  const aScale = Math.max(0.8, Math.min(1.7, 0.8 + (semiMajorAxis_AU / 2.5) * 0.9));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none" id="kepler-laws-root">
      
      {/* 1. Header Bar with Title, Simulation Status, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-sky-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner">
            <Orbit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{tI18n('experiments.keplers_laws.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-amber-300">
                T² / a³ = 1.000 yr²/AU³
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.keplers_laws.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Play / Pause Button */}
          <button
            id="kepler-play-pause-btn"
            onClick={() => setIsRunning(!isRunning)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? tI18n('experiments.keplers_laws.pause') : tI18n('experiments.keplers_laws.play')}</span>
          </button>

          {/* Log Measurement Button */}
          <button
            id="kepler-laws-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              logged
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{logged ? (tI18n('experiments.keplers_laws.logged') || 'Logged ✓') : (tI18n('experiments.keplers_laws.log') || 'Log')}</span>
          </button>

          {/* Reset Button */}
          <button
            id="kepler-laws-reset-btn"
            onClick={handleReset}
            title={tI18n('experiments.keplers_laws.reset')}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Celestial Presets & Speed Controls Row */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            {tI18n('experiments.keplers_laws.presets')}
          </span>
          
          <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
            {CELESTIAL_PRESETS.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{tI18n(`experiments.keplers_laws.${p.nameKey}`)}</span>
                </button>
              );
            })}
          </div>

          {/* Simulation Speed Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 px-2 font-mono flex items-center gap-1">
              <FastForward className="w-3 h-3 text-sky-400" />
              {tI18n('experiments.keplers_laws.simSpeed')}:
            </span>
            {[0.5, 1.0, 2.0, 4.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeedMultiplier(spd)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  simSpeedMultiplier === spd
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Stage: Orbit Canvas & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Interactive Space Stage */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative min-h-[440px] overflow-hidden shadow-inner">
          
          {/* Top Formula Dynamic Proportional Card (Kepler's 3rd Law T² / a³ = const) */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-around z-10 font-mono shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs sm:text-sm font-semibold">{tI18n('experiments.keplers_laws.law3')}:</span>
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-bold">
                <div className="flex flex-col items-center leading-none">
                  <span className="text-amber-400 transition-all duration-200 border-b border-slate-600 pb-0.5" style={{ transform: `scale(${tScale})`, display: 'inline-block' }}>
                    T²
                  </span>
                  <span className="text-sky-400 transition-all duration-200 pt-0.5" style={{ transform: `scale(${aScale})`, display: 'inline-block' }}>
                    a³
                  </span>
                </div>
                <span className="text-slate-500">=</span>
                <span className="text-emerald-400 font-black">
                  1.000 <span className="text-xs text-slate-400 font-mono font-normal">yr²/AU³</span>
                </span>
              </div>
            </div>

            {/* Orbital Period Readout */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                {tI18n('experiments.keplers_laws.orbitalPeriod')}
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {period_Years.toFixed(2)} <span className="text-xs sm:text-sm font-bold text-amber-300">yr</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                ≈ {period_Days.toFixed(0)} Earth Days
              </span>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={340}
              className="w-full h-auto max-h-[340px] rounded-xl bg-slate-950 border border-slate-900 shadow-inner"
            />
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 z-10 font-mono">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300 font-sans">{tI18n('experiments.keplers_laws.telemetry')}:</span>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.keplers_laws.currentDist')}:</span>
                <span className="text-xs sm:text-sm font-bold text-amber-400">{telemetry.r_AU.toFixed(2)} AU</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.keplers_laws.currentSpeed')}:</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400">{telemetry.v_km_s.toFixed(1)} km/s</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">θ:</span>
                <span className="text-xs sm:text-sm font-bold text-sky-400">{telemetry.theta_deg.toFixed(0)}°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Orbital Parameters & View Toggles */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Sliders Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-amber-400" />
              {tI18n('experiments.keplers_laws.title')}
            </span>

            {/* 1. Semi-Major Axis Slider (a) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                  {tI18n('experiments.keplers_laws.semiMajor')} (a)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {semiMajorAxis_AU.toFixed(2)} AU
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="3.00"
                step="0.05"
                value={semiMajorAxis_AU}
                onChange={(e) => {
                  setSemiMajorAxis_AU(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.39 AU (Mercury)</span>
                <span>1.0 AU (Earth)</span>
                <span>3.0 AU (Asteroid Belt)</span>
              </div>
            </div>

            {/* 2. Eccentricity Slider (e) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  {tI18n('experiments.keplers_laws.eccentricity')} (e)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {eccentricity.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.85"
                step="0.01"
                value={eccentricity}
                onChange={(e) => {
                  setEccentricity(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.00 (Circle)</span>
                <span>0.55 (Ellipse)</span>
                <span>0.85 (High Ellipse)</span>
              </div>
            </div>

            {/* Derived Dimensions Summary */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">{tI18n('experiments.keplers_laws.semiMinor')} (b):</span>
                <span className="text-sm font-bold text-slate-200">{semiMinorAxis_AU.toFixed(2)} AU</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Focal Distance (c = a·e):</span>
                <span className="text-sm font-bold text-slate-200">{focalDistance_AU.toFixed(2)} AU</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">{tI18n('experiments.keplers_laws.perihelion')}:</span>
                <span className="text-sm font-bold text-emerald-400">{r_perihelion_AU.toFixed(2)} AU</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">{tI18n('experiments.keplers_laws.aphelion')}:</span>
                <span className="text-sm font-bold text-rose-400">{r_aphelion_AU.toFixed(2)} AU</span>
              </div>
            </div>

            {/* Overlays / Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5" />
                Visual Overlays
              </span>
              
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSweptArea}
                    onChange={(e) => setShowSweptArea(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>{tI18n('experiments.keplers_laws.sweptArea')}</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showFociAndAxes}
                    onChange={(e) => setShowFociAndAxes(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <span>{tI18n('experiments.keplers_laws.showFoci')}</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={(e) => setShowVectors(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>{tI18n('experiments.keplers_laws.showVectors')}</span>
                </label>
              </div>
            </div>

          </div>

          {/* Educational Note on Kepler's Laws */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {tI18n('experiments.keplers_laws.fociNote')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
