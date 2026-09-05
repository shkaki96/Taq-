import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Waves, 
  Pause, 
  Play, 
  RotateCcw, 
  Activity, 
  BookmarkCheck, 
  Gauge, 
  Sliders, 
  Sparkles, 
  Eye, 
  Info,
  Radio,
  Zap,
  Ruler,
  Layers,
  ArrowRight,
  MoveVertical
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface WaveOnStringSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

type ExcitationMode = 'oscillate' | 'pulse' | 'manual';
type EndCondition = 'fixed' | 'loose' | 'noEnd';

interface TensionPreset {
  id: 'low' | 'med' | 'high';
  nameKey: string;
  tensionN: number;
}

const TENSION_PRESETS: TensionPreset[] = [
  { id: 'low', nameKey: 'low', tensionN: 2.5 },
  { id: 'med', nameKey: 'med', tensionN: 6.0 },
  { id: 'high', nameKey: 'high', tensionN: 13.5 },
];

interface DensityPreset {
  id: 'thin' | 'medium' | 'heavy';
  nameKey: string;
  mu_kg_m: number;
  color: string;
}

const DENSITY_PRESETS: DensityPreset[] = [
  { id: 'thin', nameKey: 'stringThin', mu_kg_m: 0.010, color: '#38bdf8' },
  { id: 'medium', nameKey: 'stringMedium', mu_kg_m: 0.024, color: '#60a5fa' },
  { id: 'heavy', nameKey: 'stringHeavy', mu_kg_m: 0.060, color: '#818cf8' },
];

export const WaveOnStringSim: React.FC<WaveOnStringSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // Core Physical States
  const [mode, setMode] = useState<ExcitationMode>('oscillate');
  const [endType, setEndType] = useState<EndCondition>('fixed');
  const [amplitude, setAmplitude] = useState<number>(0.80); // cm (0.2 to 1.5 cm)
  const [frequency, setFrequency] = useState<number>(1.50); // Hz (0.4 to 3.5 Hz)
  const [damping, setDamping] = useState<number>(0.02); // Damping coefficient gamma
  const [tensionN, setTensionN] = useState<number>(6.0); // Tension in Newtons
  const [linearDensity, setLinearDensity] = useState<number>(0.024); // kg/m
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);

  // Tools & Visualization Overlays
  const [showRulers, setShowRulers] = useState<boolean>(false);
  const [showRefLines, setShowRefLines] = useState<boolean>(true);

  // Logging Feedback
  const [logged, setLogged] = useState<boolean>(false);

  // 90 Beads Discretization along string (Length L = 7.5 meters)
  const numBeads = 90;
  const stringLength_m = 7.5; // meters
  const beadPositionsRef = useRef<Float64Array>(new Float64Array(numBeads));
  const beadVelocitiesRef = useRef<Float64Array>(new Float64Array(numBeads));
  const timeStepRef = useRef<number>(0);
  const pulseStartTimeRef = useRef<number | null>(null);
  const isDraggingDriverRef = useRef<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derived Theoretical Wave Properties
  // Wave speed v = √(T / μ)
  const waveSpeed = useMemo(() => {
    return Math.sqrt(Math.max(tensionN, 0.1) / Math.max(linearDensity, 0.001));
  }, [tensionN, linearDensity]);

  // Wavelength λ = v / f
  const wavelength = useMemo(() => {
    return waveSpeed / Math.max(frequency, 0.1);
  }, [waveSpeed, frequency]);

  // Wave Period T = 1 / f
  const period = useMemo(() => {
    return 1 / Math.max(frequency, 0.1);
  }, [frequency]);

  // Harmonic Node Count for Standing Waves: 2L / λ
  const harmonicEstimate = useMemo(() => {
    const ratio = (2 * stringLength_m) / wavelength;
    const nearestHarmonic = Math.round(ratio);
    const isResonant = Math.abs(ratio - nearestHarmonic) < 0.15;
    return { ratio, nearestHarmonic, isResonant };
  }, [stringLength_m, wavelength]);

  // Send Single Pulse Handler
  const handleSendPulse = useCallback(() => {
    pulseStartTimeRef.current = timeStepRef.current;
  }, []);

  // Reset Simulation
  const handleReset = useCallback(() => {
    beadPositionsRef.current.fill(0);
    beadVelocitiesRef.current.fill(0);
    timeStepRef.current = 0;
    pulseStartTimeRef.current = null;
  }, []);

  // Main Numerical Integration and Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    const acc = new Float64Array(numBeads);

    const render = (now: number) => {
      const rawDt = Math.min((now - lastTime) / 1000, 0.035);
      lastTime = now;
      const speedScale = isSlowMo ? 0.35 : 1.0;
      const dt = rawDt * speedScale;

      const pos = beadPositionsRef.current;
      const vel = beadVelocitiesRef.current;

      // 1. Numerical Wave Equation Solver (Multi-substepping for CFL stability)
      // CFL Condition: c * dt_sub / dx <= 0.65
      const dx = stringLength_m / (numBeads - 1);
      const c = waveSpeed;
      const numSubSteps = Math.max(12, Math.ceil((c * dt / dx) / 0.5));
      const dtSub = dt / numSubSteps;

      // Spring-coupling factor: K_eff = T / (μ · dx²) = c² / dx²
      const couplingFactor = (c * c) / (dx * dx);

      if (isRunning) {
        for (let step = 0; step < numSubSteps; step++) {
          timeStepRef.current += dtSub;
          const t = timeStepRef.current;

          // Compute driver bead 0 displacement based on active mode
          if (mode === 'oscillate') {
            const driverY = Math.sin(t * frequency * 2 * Math.PI) * (amplitude * 55);
            pos[0] = driverY;
            vel[0] = Math.cos(t * frequency * 2 * Math.PI) * (frequency * 2 * Math.PI) * (amplitude * 55);
          } else if (mode === 'pulse') {
            if (pulseStartTimeRef.current !== null) {
              const dtPulse = t - pulseStartTimeRef.current;
              const pulseDuration = 0.45 / frequency;
              if (dtPulse >= 0 && dtPulse <= pulseDuration) {
                // Smooth Hann pulse shape
                const pFrac = dtPulse / pulseDuration;
                const driverY = Math.sin(pFrac * Math.PI) * (amplitude * 65);
                pos[0] = driverY;
                vel[0] = (Math.cos(pFrac * Math.PI) * Math.PI / pulseDuration) * (amplitude * 65);
              } else {
                pos[0] = 0;
                vel[0] = 0;
              }
            } else {
              pos[0] = 0;
              vel[0] = 0;
            }
          }
          // In 'manual' mode, bead 0 is manipulated via pointer events

          // Compute accelerations for internal beads (i = 1 to numBeads - 2)
          for (let i = 1; i < numBeads - 1; i++) {
            const laplacian = pos[i + 1] - 2 * pos[i] + pos[i - 1];
            // Net acceleration: a = c² (d²y/dx²) - gamma · v
            acc[i] = laplacian * couplingFactor - (damping * 22) * vel[i];
          }

          // Symplectic Semi-Implicit Verlet update
          for (let i = 1; i < numBeads - 1; i++) {
            vel[i] += acc[i] * dtSub;
            pos[i] += vel[i] * dtSub;
          }

          // Boundary Condition at the Right End (i = numBeads - 1)
          if (endType === 'fixed') {
            // Rigid clamp at y = 0
            pos[numBeads - 1] = 0;
            vel[numBeads - 1] = 0;
          } else if (endType === 'loose') {
            // Free ring on frictionless vertical pole (zero slope: dy/dx = 0)
            pos[numBeads - 1] = pos[numBeads - 2];
            vel[numBeads - 1] = vel[numBeads - 2];
          } else if (endType === 'noEnd') {
            // Absorbing boundary (dashpot absorbing wave without reflection: dy/dt + c·dy/dx = 0)
            const alpha = (c * dtSub) / dx;
            pos[numBeads - 1] = pos[numBeads - 1] * (1 - alpha) + pos[numBeads - 2] * alpha;
            vel[numBeads - 1] = (pos[numBeads - 1] - pos[numBeads - 2]) / dtSub;
          }
        }
      }

      // --- 2. DRAW CANVAS SCENE ---
      ctx.clearRect(0, 0, 600, 260);

      // Deep Space Dark Canvas Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 260);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 260);

      const centerY = 130;
      const startX = 65;
      const endX = 550;
      const stringPxSpan = endX - startX;

      // A. Reference Lines (+A, 0 Equilibrium, -A)
      if (showRefLines) {
        ctx.save();
        // Central Equilibrium Axis
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(startX - 25, centerY);
        ctx.lineTo(endX + 25, centerY);
        ctx.stroke();

        // Top & Bottom Amplitude Reference Lines
        const ampPx = amplitude * 55;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.moveTo(startX - 15, centerY - ampPx);
        ctx.lineTo(endX + 15, centerY - ampPx);
        ctx.moveTo(startX - 15, centerY + ampPx);
        ctx.lineTo(endX + 15, centerY + ampPx);
        ctx.stroke();
        ctx.setLineDash([]);

        // Amplitude Labels
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px monospace';
        ctx.fillText(`+A (${amplitude.toFixed(2)} cm)`, startX - 45, centerY - ampPx + 3);
        ctx.fillText(`-A`, startX - 25, centerY + ampPx + 3);
        ctx.restore();
      }

      // B. Overlay Measuring Rulers (Horizontal & Vertical)
      if (showRulers) {
        ctx.save();
        // Horizontal Ruler along top
        const rulerY = 25;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
        ctx.fillRect(startX, rulerY - 14, stringPxSpan, 18);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, rulerY - 14, stringPxSpan, 18);

        ctx.fillStyle = '#fef08a';
        ctx.font = '8px monospace';
        for (let m = 0; m <= stringLength_m; m += 0.5) {
          const rx = startX + (m / stringLength_m) * stringPxSpan;
          const isMajor = m % 1 === 0;
          ctx.beginPath();
          ctx.moveTo(rx, rulerY + 4);
          ctx.lineTo(rx, rulerY + 4 - (isMajor ? 10 : 5));
          ctx.stroke();
          if (isMajor) {
            ctx.fillText(`${m}m`, rx - 6, rulerY - 4);
          }
        }
        ctx.restore();
      }

      // C. Driver Mechanism at Left End (Wrench / Piston / Oscillation motor)
      ctx.save();
      const driverY = centerY - pos[0];

      // Vertical Slider Track for Driver
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, centerY - 85);
      ctx.lineTo(startX, centerY + 85);
      ctx.stroke();

      // Driver Piston Box
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(startX - 28, driverY - 12, 28, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Piston Label
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mode === 'manual' ? 'HAND' : 'DRIVE', startX - 14, driverY + 3);
      ctx.restore();

      // D. Continuous String Rendering (Interpolated Curve with Shadow/Glow)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, centerY - pos[0]);

      for (let i = 1; i < numBeads; i++) {
        const bx = startX + (i / (numBeads - 1)) * stringPxSpan;
        const by = centerY - pos[i];
        ctx.lineTo(bx, by);
      }

      // String Line Shadow & Stroke
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // E. Individual Beads along the String
      for (let i = 0; i < numBeads; i++) {
        const bx = startX + (i / (numBeads - 1)) * stringPxSpan;
        const by = centerY - pos[i];

        ctx.beginPath();
        ctx.arc(bx, by, i === 0 ? 5.5 : i === numBeads - 1 ? 5.5 : (i % 3 === 0 ? 3.5 : 2.5), 0, Math.PI * 2);

        if (i === 0) {
          ctx.fillStyle = '#f59e0b'; // Driver Bead
        } else if (i === numBeads - 1) {
          ctx.fillStyle = endType === 'fixed' ? '#ef4444' : endType === 'loose' ? '#10b981' : '#64748b';
        } else if (i % 6 === 0) {
          ctx.fillStyle = '#f8fafc'; // Marked contrasting reference beads
        } else {
          ctx.fillStyle = '#0284c7';
        }
        ctx.fill();
      }

      // F. Right Boundary Support Structure
      ctx.save();
      const endBeadY = centerY - pos[numBeads - 1];

      if (endType === 'fixed') {
        // Rigid Clamp Wall / Clamp Vise
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(endX, centerY - 35, 12, 70);
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2;
        ctx.strokeRect(endX, centerY - 35, 12, 70);

        // Clamp screw handle
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(endX + 12, centerY - 6, 14, 12);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FIXED', endX + 6, centerY + 3);
      } else if (endType === 'loose') {
        // Vertical Brass Pole with Sliding Ring
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(endX, centerY - 80);
        ctx.lineTo(endX, centerY + 80);
        ctx.stroke();

        // Pole Top / Bottom Caps
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(endX - 6, centerY - 85, 12, 6);
        ctx.fillRect(endX - 6, centerY + 79, 12, 6);

        // Sliding Brass Ring
        ctx.beginPath();
        ctx.arc(endX, endBeadY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Open Absorbing Window / Dashpot
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(endX, centerY - 60);
        ctx.lineTo(endX, centerY + 60);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText('OPEN (Absorber)', endX + 8, centerY + 3);
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    isSlowMo,
    mode,
    endType,
    amplitude,
    frequency,
    damping,
    waveSpeed,
    showRulers,
    showRefLines,
  ]);

  // Pointer Handlers for Manual Driver Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'manual') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const scaleY = 260 / rect.height;
    const internalY = clickY * scaleY;
    const centerY = 130;
    const deltaY = centerY - internalY;

    isDraggingDriverRef.current = true;
    beadPositionsRef.current[0] = Math.max(-80, Math.min(80, deltaY));
    beadVelocitiesRef.current[0] = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'manual' || !isDraggingDriverRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const scaleY = 260 / rect.height;
    const internalY = clickY * scaleY;
    const centerY = 130;
    const deltaY = centerY - internalY;

    beadPositionsRef.current[0] = Math.max(-80, Math.min(80, deltaY));
    beadVelocitiesRef.current[0] = 0;
  };

  const handlePointerUp = () => {
    isDraggingDriverRef.current = false;
  };

  // Log Experiment Data to Scientific Notebook
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'wave_on_a_string',
        variableName: 'Wave_Propagation_Speed_and_Harmonics',
        measuredValue: parseFloat(waveSpeed.toFixed(2)),
        theoreticalValue: parseFloat(Math.sqrt(tensionN / linearDensity).toFixed(2)),
        unit: 'm/s',
        parameters: {
          Tension_T: `${tensionN.toFixed(1)} N`,
          Linear_Mass_Density_mu: `${linearDensity.toFixed(3)} kg/m (${(linearDensity * 1000).toFixed(0)} g/m)`,
          Wave_Speed_v: `${waveSpeed.toFixed(2)} m/s`,
          Oscillation_Frequency_f: `${frequency.toFixed(2)} Hz`,
          Calculated_Wavelength_lambda: `${wavelength.toFixed(2)} m`,
          Wave_Period_T: `${period.toFixed(3)} s`,
          Amplitude_A: `${amplitude.toFixed(2)} cm`,
          Damping_gamma: `${(damping * 100).toFixed(1)}%`,
          Boundary_Condition: endType,
          Excitation_Mode: mode,
          Harmonic_Resonance_Ratio: `${harmonicEstimate.ratio.toFixed(2)} (Closest: n=${harmonicEstimate.nearestHarmonic})`,
        },
        equation: `v = √(T / μ) = √(${tensionN.toFixed(1)} / ${linearDensity.toFixed(3)}) = ${waveSpeed.toFixed(2)} m/s | λ = v / f = ${wavelength.toFixed(2)} m`,
        timestamp: new Date().toISOString(),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none" id="wave-string-root">
      
      {/* 1. Header Bar with Title, Simulation Status, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-sky-500/20 to-indigo-500/10 border border-sky-500/30 rounded-xl text-sky-400 shadow-inner shrink-0">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{tI18n('experiments.wave_on_a_string.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-sky-300 whitespace-nowrap">
                v = √(T / μ)
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.wave_on_a_string.subtitle')}</p>
          </div>
        </div>

        {/* Action Controls - Strictly Protected Against Text Overflow */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Play / Pause Toggle */}
          <button
            id="wave-string-play-pause-btn"
            onClick={() => setIsRunning(!isRunning)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
            <span>{isRunning ? tI18n('experiments.wave_on_a_string.pause') : tI18n('experiments.wave_on_a_string.play')}</span>
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
            id="wave-string-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              logged
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span>{logged ? (tI18n('experiments.wave_on_a_string.logged') || 'Logged ✓') : (tI18n('experiments.wave_on_a_string.log') || 'Log')}</span>
          </button>

          {/* Reset Button */}
          <button
            id="wave-string-reset-btn"
            onClick={handleReset}
            title={tI18n('experiments.wave_on_a_string.reset')}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center shrink-0"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* 2. Top Bar: Excitation Mode & Boundary Conditions Presets */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Excitation Modes */}
          <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1 uppercase tracking-wider me-1 whitespace-nowrap">
              <Radio className="w-3.5 h-3.5 shrink-0" />
              {tI18n('experiments.wave_on_a_string.mode')}:
            </span>
            <button
              onClick={() => setMode('oscillate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                mode === 'oscillate'
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              〰️ {tI18n('experiments.wave_on_a_string.modeOscillate')}
            </button>
            <button
              onClick={() => setMode('pulse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                mode === 'pulse'
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              〽️ {tI18n('experiments.wave_on_a_string.modePulse')}
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                mode === 'manual'
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🖐️ {tI18n('experiments.wave_on_a_string.modeManual')}
            </button>

            {/* Send Pulse Button when in Pulse Mode */}
            {mode === 'pulse' && (
              <button
                onClick={handleSendPulse}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>{tI18n('experiments.wave_on_a_string.sendPulse')}</span>
              </button>
            )}
          </div>

          {/* Right End Boundary Condition */}
          <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider me-1 whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              {tI18n('experiments.wave_on_a_string.endType')}:
            </span>
            <button
              onClick={() => setEndType('fixed')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                endType === 'fixed'
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🔒 {tI18n('experiments.wave_on_a_string.fixedEnd')}
            </button>
            <button
              onClick={() => setEndType('loose')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                endType === 'loose'
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🟢 {tI18n('experiments.wave_on_a_string.looseEnd')}
            </button>
            <button
              onClick={() => setEndType('noEnd')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                endType === 'noEnd'
                  ? 'bg-purple-500/20 border-purple-500/60 text-purple-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🪟 {tI18n('experiments.wave_on_a_string.noEnd')}
            </button>
          </div>

        </div>
      </div>

      {/* 3. Main Stage: Interactive Wave Canvas & Live Telemetry Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: String Stage */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative min-h-[420px] overflow-hidden shadow-inner">
          
          {/* Top Dynamic Mathematical Formula Card */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-10 font-mono shadow-sm">
            <div className="flex items-center gap-3 flex-wrap text-xs sm:text-sm">
              <span className="text-slate-400 font-semibold">{tI18n('experiments.wave_on_a_string.speed')}:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-sky-400">v = √(T / μ) =</span>
                <span className="text-emerald-400 text-base sm:text-lg">{waveSpeed.toFixed(2)} m/s</span>
              </div>
            </div>

            {/* Wavelength & Period Badges */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">λ = </span>
                <span className="font-bold text-amber-400">{wavelength.toFixed(2)} m</span>
              </div>
              <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">T = </span>
                <span className="font-bold text-sky-400">{period.toFixed(2)} s</span>
              </div>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={260}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`w-full h-auto max-h-[260px] rounded-xl bg-slate-950 border border-slate-900 shadow-inner touch-none ${
                mode === 'manual' ? 'cursor-ns-resize' : 'cursor-default'
              }`}
            />
          </div>

          {/* Bottom Wave Telemetry and Standing Wave Resonance Indicator */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 z-10 font-mono">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300 font-sans">Harmonics & Resonance:</span>
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">2L/λ:</span>
                <span className="font-bold text-amber-400">{harmonicEstimate.ratio.toFixed(2)}</span>
              </div>

              {harmonicEstimate.isResonant && (
                <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold animate-pulse">
                  <span>✨ Harmonic n = {harmonicEstimate.nearestHarmonic} (Resonance!)</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Parameters Sliders & Density/Tension Presets */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Sliders Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
              Wave Parameters & Tension
            </span>

            {/* Amplitude Slider (A) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shrink-0" />
                  {tI18n('experiments.wave_on_a_string.amplitude')} (A)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {amplitude.toFixed(2)} cm
                </span>
              </div>
              <input
                type="range"
                min="0.20"
                max="1.50"
                step="0.05"
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Frequency Slider (f) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                  {tI18n('experiments.wave_on_a_string.frequency')} (f)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {frequency.toFixed(2)} Hz
                </span>
              </div>
              <input
                type="range"
                min="0.40"
                max="3.50"
                step="0.05"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* String Tension (T) Presets & Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                  {tI18n('experiments.wave_on_a_string.tension')} (T)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {tensionN.toFixed(1)} N
                </span>
              </div>

              {/* Quick Tension Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {TENSION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setTensionN(p.tensionN)}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-medium border transition-all active:scale-95 whitespace-nowrap text-center ${
                      Math.abs(tensionN - p.tensionN) < 0.2
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tI18n(`experiments.wave_on_a_string.${p.nameKey}`)}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="1.0"
                max="20.0"
                step="0.5"
                value={tensionN}
                onChange={(e) => setTensionN(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Linear Mass Density (μ) Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-indigo-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shrink-0" />
                  {tI18n('experiments.wave_on_a_string.linearDensity')} (μ)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {(linearDensity * 1000).toFixed(0)} g/m
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {DENSITY_PRESETS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setLinearDensity(d.mu_kg_m)}
                    className={`py-1 px-1 rounded-lg text-[11px] font-medium border transition-all active:scale-95 whitespace-nowrap text-center ${
                      Math.abs(linearDensity - d.mu_kg_m) < 0.002
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {(d.mu_kg_m * 1000).toFixed(0)} g/m
                  </button>
                ))}
              </div>
            </div>

            {/* Damping Slider (γ) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{tI18n('experiments.wave_on_a_string.damping')} (γ)</span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {(damping * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.08"
                step="0.005"
                value={damping}
                onChange={(e) => setDamping(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>

            {/* Tools & Overlays */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 shrink-0" />
                Measurement Tools
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={showRulers}
                    onChange={(e) => setShowRulers(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <span className="truncate">{tI18n('experiments.wave_on_a_string.ruler')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={showRefLines}
                    onChange={(e) => setShowRefLines(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <span className="truncate">{tI18n('experiments.wave_on_a_string.referenceLine')}</span>
                </label>
              </div>
            </div>

          </div>

          {/* Educational Note */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {tI18n('experiments.wave_on_a_string.tip')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
