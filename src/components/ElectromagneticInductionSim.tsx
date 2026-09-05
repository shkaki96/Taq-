import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Zap, 
  Pause, 
  Play, 
  RotateCcw, 
  BookmarkCheck, 
  Sliders, 
  Activity, 
  Compass, 
  Sparkles, 
  Layers, 
  ArrowRightLeft, 
  Info, 
  Lightbulb,
  TrendingUp,
  Hand,
  FastForward,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

type MotionMode = 'oscillate' | 'manual' | 'ac';

export default function ElectromagneticInductionSim({ lang, onLogMeasurement }: Props) {
  const { t } = useTranslation();

  // Core Simulation Parameters
  const [coilTurnsN, setCoilTurnsN] = useState<number>(50); // turns (10 to 200)
  const [magnetSpeedMps, setMagnetSpeedMps] = useState<number>(1.5); // m/s (0.2 to 4.0)
  const [magneticFieldTesla, setMagneticFieldTesla] = useState<number>(0.8); // Tesla (0.1 to 2.0)
  const [coilResistanceOhm, setCoilResistanceOhm] = useState<number>(10); // Ohms (1 to 50)
  const [coilRadiusCm, setCoilRadiusCm] = useState<number>(3.5); // cm (2.0 to 6.0)
  const [isNorthLeading, setIsNorthLeading] = useState<boolean>(true); // true = N right, S left; false = S right, N left
  const [motionMode, setMotionMode] = useState<MotionMode>('oscillate');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [showFieldLines, setShowFieldLines] = useState<boolean>(true);
  const [showFluxVector, setShowFluxVector] = useState<boolean>(true);
  const [showOscilloscope, setShowOscilloscope] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);
  const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
  const [manualSliderX, setManualSliderX] = useState<number>(200);

  // Live throttled readouts for React UI cards
  const [liveEmf, setLiveEmf] = useState<number>(0);
  const [liveCurrent, setLiveCurrent] = useState<number>(0);
  const [liveFlux, setLiveFlux] = useState<number>(0);
  const [liveFluxRate, setLiveFluxRate] = useState<number>(0);

  // Dynamic Physical State Refs
  const magnetPosRef = useRef<number>(200); // x-pixel position
  const magnetVelRef = useRef<number>(0); // pixels/second
  const magnetDirRef = useRef<number>(1); // 1 = right, -1 = left
  const rotAngleRef = useRef<number>(0); // for AC mode (radians)
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; lastTime: number }>({ x: 200, lastTime: 0 });
  const recentInstantEmfRef = useRef<number>(0);
  const recentInstantFluxRef = useRef<number>(0);
  const recentInstantFluxRateRef = useRef<number>(0);
  const needleAngleDampedRef = useRef<number>(0);
  const isHoveringMagnetRef = useRef<boolean>(false);
  const lastUiUpdateRef = useRef<number>(0);

  // Scope history for waveform display
  const scopeHistoryRef = useRef<Array<{ emf: number; flux: number }>>([]);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Calculated Physical Properties
  const coilAreaM2 = useMemo(() => {
    const rM = coilRadiusCm / 100;
    return Math.PI * rM * rM;
  }, [coilRadiusCm]);

  // Peak Theoretical EMF when magnet passes coil center at current velocity
  const peakTheoreticalEmf = useMemo(() => {
    const rM = coilRadiusCm / 100;
    const fluxGradientMax = (1.5 * magneticFieldTesla * coilAreaM2) / rM;
    const speed = motionMode === 'ac' ? magnetSpeedMps * 2 : magnetSpeedMps;
    return coilTurnsN * fluxGradientMax * speed;
  }, [coilTurnsN, magneticFieldTesla, coilAreaM2, coilRadiusCm, magnetSpeedMps, motionMode]);

  const peakTheoreticalCurrent = useMemo(() => {
    return coilResistanceOhm > 0 ? (peakTheoreticalEmf / coilResistanceOhm) * 1000 : 0; // mA
  }, [peakTheoreticalEmf, coilResistanceOhm]);

  // Helper to accurately extract canvas coordinates from PointerEvent
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Handle Pointer Down for Mouse, Touch, & Pen
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e);
    const magX = magnetPosRef.current;
    const centerY = canvas.height * 0.44;

    // Check hit: directly on the magnet (±75px horizontal, ±50px vertical) or track corridor
    const isDirectHit = Math.abs(x - magX) < 80 && Math.abs(y - centerY) < 55;
    const isTrackHit = motionMode === 'manual' && y >= 40 && y <= 260;

    if (isDirectHit || isTrackHit) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture fallback
      }

      // Automatically switch to manual mode if user interacts with magnet
      if (motionMode !== 'manual') {
        setMotionMode('manual');
      }

      isDraggingRef.current = true;
      setIsDraggingActive(true);

      const targetX = Math.max(65, Math.min(canvas.width - 65, x));
      if (isTrackHit && !isDirectHit) {
        const dx = targetX - magnetPosRef.current;
        magnetVelRef.current = dx * 8;
        magnetPosRef.current = targetX;
        setManualSliderX(Math.round(targetX));
      }

      dragStartPosRef.current = { x: targetX, lastTime: performance.now() };
    }
  }, [getCanvasCoords, motionMode]);

  // Handle Pointer Move for High-Precision Drag Velocity
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e);
    const centerY = canvas.height * 0.44;
    const magX = magnetPosRef.current;

    isHoveringMagnetRef.current = Math.abs(x - magX) < 80 && Math.abs(y - centerY) < 55;

    if (!isDraggingRef.current) return;

    const now = performance.now();
    const dt = Math.max((now - dragStartPosRef.current.lastTime) / 1000, 0.003);
    const targetX = Math.max(65, Math.min(canvas.width - 65, x));
    const dx = targetX - dragStartPosRef.current.x;

    // Filtered physical velocity (px/second)
    const instVel = dx / dt;
    magnetVelRef.current = magnetVelRef.current * 0.25 + instVel * 0.75;

    magnetPosRef.current = targetX;
    setManualSliderX(Math.round(targetX));
    dragStartPosRef.current = { x: targetX, lastTime: now };
  }, [getCanvasCoords]);

  // Handle Pointer Up / Cancel
  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
      isDraggingRef.current = false;
      setIsDraggingActive(false);
    }
  }, []);

  // Programmatic manual movement (Buttons and Sliders)
  const setManualPosition = useCallback((newX: number) => {
    if (motionMode !== 'manual') {
      setMotionMode('manual');
    }
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 650;
    const clampedX = Math.max(65, Math.min(w - 65, newX));
    const dx = clampedX - magnetPosRef.current;
    magnetVelRef.current = dx * 12; // swift physical velocity for displacement
    magnetPosRef.current = clampedX;
    setManualSliderX(Math.round(clampedX));
    dragStartPosRef.current = { x: clampedX, lastTime: performance.now() };
  }, [motionMode]);

  // Quick thrust animation through the solenoid coil
  const handleQuickThrust = useCallback(() => {
    if (motionMode !== 'manual') {
      setMotionMode('manual');
    }
    magnetPosRef.current = 80;
    magnetVelRef.current = 750; // high speed burst
    setManualSliderX(80);
    dragStartPosRef.current = { x: 80, lastTime: performance.now() };
  }, [motionMode]);

  // Main Canvas & Faraday Physics Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h * 0.44;
      const coilCenterX = w * 0.52;
      const coilW = 120;
      const coilH = 85 + (coilRadiusCm - 3.5) * 15;

      // 1. Motion Kinematics Update
      if (motionMode === 'oscillate') {
        if (isRunning) {
          const oscSpeedPx = magnetSpeedMps * 190;
          magnetPosRef.current += magnetDirRef.current * oscSpeedPx * dt;
          magnetVelRef.current = magnetDirRef.current * oscSpeedPx;

          const leftBound = coilCenterX - 180;
          const rightBound = coilCenterX + 180;

          if (magnetPosRef.current > rightBound) {
            magnetPosRef.current = rightBound;
            magnetDirRef.current = -1;
          } else if (magnetPosRef.current < leftBound) {
            magnetPosRef.current = leftBound;
            magnetDirRef.current = 1;
          }
        } else {
          magnetVelRef.current = 0;
        }
      } else if (motionMode === 'ac') {
        if (isRunning) {
          const omega = magnetSpeedMps * 3.5; // rad/s
          rotAngleRef.current += omega * dt;
          magnetPosRef.current = coilCenterX - 100;
        }
      } else if (motionMode === 'manual') {
        // Decay velocity when hand stops moving
        const timeSinceMove = (now - dragStartPosRef.current.lastTime) / 1000;
        if (timeSinceMove > 0.04) {
          magnetVelRef.current *= Math.pow(0.05, dt * 8);
          if (Math.abs(magnetVelRef.current) < 0.5) {
            magnetVelRef.current = 0;
          }
        }
      }

      // 2. Exact Physics Calculations: Faraday's Law & Lenz's Law
      let instantFlux = 0;
      let instantEmf = 0;
      let instantFluxRate = 0;

      const poleSign = isNorthLeading ? 1 : -1;
      const rM = coilRadiusCm / 100;

      if (motionMode === 'ac') {
        // AC sinusoidal flux & EMF
        const theta = rotAngleRef.current;
        instantFlux = magneticFieldTesla * coilAreaM2 * Math.cos(theta) * poleSign;
        const omega = isRunning ? magnetSpeedMps * 3.5 : 0;
        instantEmf = coilTurnsN * magneticFieldTesla * coilAreaM2 * omega * Math.sin(theta) * poleSign;
        instantFluxRate = isRunning ? -magneticFieldTesla * coilAreaM2 * omega * Math.sin(theta) * poleSign : 0;
      } else {
        // Linear translation through coil center (Lorentz & Dipole Model)
        const distPx = magnetPosRef.current - coilCenterX;
        const distM = distPx / 400; // coordinate scale factor (400px = 1m)

        // Dipole field flux: Phi(x) = B0 * Area / (1 + (x/R)^2)^1.5
        const normDist = distM / rM;
        const fluxDenominator = Math.pow(1 + normDist * normDist, 1.5);
        instantFlux = (magneticFieldTesla * coilAreaM2 / fluxDenominator) * poleSign;

        // Exact derivative: dPhi/dt = (dPhi/dx) * (dx/dt)
        const dPhi_dx = (-3 * magneticFieldTesla * coilAreaM2 * (normDist / rM) / Math.pow(1 + normDist * normDist, 2.5)) * poleSign;
        const velMps = (magnetVelRef.current / 400); // m/s
        instantFluxRate = dPhi_dx * velMps;

        // Faraday's law of electromagnetic induction
        instantEmf = -coilTurnsN * instantFluxRate;
      }

      recentInstantEmfRef.current = instantEmf;
      recentInstantFluxRef.current = instantFlux;
      recentInstantFluxRateRef.current = instantFluxRate;

      // Update React live state throttled to 30fps for pristine UI performance
      if (now - lastUiUpdateRef.current > 33) {
        lastUiUpdateRef.current = now;
        setLiveEmf(instantEmf);
        setLiveCurrent(coilResistanceOhm > 0 ? (instantEmf / coilResistanceOhm) * 1000 : 0);
        setLiveFlux(instantFlux);
        setLiveFluxRate(instantFluxRate);
      }

      // Record live waveform history
      scopeHistoryRef.current.push({ emf: instantEmf, flux: instantFlux });
      if (scopeHistoryRef.current.length > 200) {
        scopeHistoryRef.current.shift();
      }

      // 3. Render Canvas Graphics
      ctx.clearRect(0, 0, w, h);

      // Deep Tech Blueprint Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle Measurement Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 25; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 25; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 4. Motion Track Rail for Magnet
      ctx.strokeStyle = motionMode === 'manual' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, centerY + 28);
      ctx.lineTo(w - 60, centerY + 28);
      ctx.stroke();

      // Track ruler tick marks
      for (let tx = 80; tx <= w - 80; tx += 40) {
        ctx.beginPath();
        ctx.moveTo(tx, centerY + 25);
        ctx.lineTo(tx, centerY + 31);
        ctx.stroke();
      }

      // 5. Circuit Copper Wires & Connecting Galvanometer
      const galvX = coilCenterX;
      const galvY = h * 0.82;
      const galvR = 46;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left wire from coil to galvanometer
      ctx.beginPath();
      ctx.moveTo(coilCenterX - coilW / 2 + 12, centerY + coilH / 2);
      ctx.lineTo(coilCenterX - coilW / 2 + 12, galvY);
      ctx.lineTo(galvX - galvR - 10, galvY);
      ctx.stroke();

      // Right wire from coil to galvanometer
      ctx.beginPath();
      ctx.moveTo(coilCenterX + coilW / 2 - 12, centerY + coilH / 2);
      ctx.lineTo(coilCenterX + coilW / 2 - 12, galvY);
      ctx.lineTo(galvX + galvR + 10, galvY);
      ctx.stroke();

      // Glowing Current Pulses along Wire if EMF is present
      const instantCurrent = coilResistanceOhm > 0 ? instantEmf / coilResistanceOhm : 0;
      if (Math.abs(instantCurrent) > 0.003) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = Math.min(18, Math.abs(instantCurrent) * 60);
        ctx.strokeStyle = instantCurrent > 0 ? '#38bdf8' : '#eab308';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(coilCenterX - coilW / 2 + 12, centerY + coilH / 2);
        ctx.lineTo(coilCenterX - coilW / 2 + 12, galvY);
        ctx.lineTo(galvX - galvR - 10, galvY);
        ctx.moveTo(coilCenterX + coilW / 2 - 12, centerY + coilH / 2);
        ctx.lineTo(coilCenterX + coilW / 2 - 12, galvY);
        ctx.lineTo(galvX + galvR + 10, galvY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 6. Center-Zero Analog Galvanometer Body
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(galvX, galvY, galvR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dial Scale Arc & Tick Marks
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(galvX, galvY + 14, 34, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();

      // Scale Ticks
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('-V', galvX - 26, galvY - 12);
      ctx.fillText('0', galvX, galvY - 22);
      ctx.fillText('+V', galvX + 26, galvY - 12);

      // Galvanometer Center-Zero Needle with Realistic Physical Damping
      const maxRangeV = Math.max(0.4, peakTheoreticalEmf || 1);
      const targetAngle = -Math.PI / 2 + Math.max(-0.85, Math.min(0.85, (instantEmf / maxRangeV) * 0.85));
      needleAngleDampedRef.current += (targetAngle - needleAngleDampedRef.current) * 0.3;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(galvX, galvY + 14);
      ctx.lineTo(
        galvX + Math.cos(needleAngleDampedRef.current) * 36,
        galvY + 14 + Math.sin(needleAngleDampedRef.current) * 36
      );
      ctx.stroke();

      // Needle Hub
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(galvX, galvY + 14, 5, 0, Math.PI * 2);
      ctx.fill();

      // Galvanometer Digital Value Tag
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${instantEmf >= 0 ? '+' : ''}${instantEmf.toFixed(2)} V`, galvX, galvY + 34);

      // 7. Filament Lamp / LED Indicator in Parallel
      const lampX = galvX - 110;
      const lampY = galvY;
      const powerDissipated = (instantEmf * instantEmf) / Math.max(1, coilResistanceOhm);
      const glowLevel = Math.min(1, powerDissipated / 0.45);

      if (glowLevel > 0.05) {
        const lampGlow = ctx.createRadialGradient(lampX, lampY, 4, lampX, lampY, 32 * glowLevel + 10);
        lampGlow.addColorStop(0, `rgba(250, 204, 21, ${0.9 * glowLevel})`);
        lampGlow.addColorStop(0.5, `rgba(245, 158, 11, ${0.4 * glowLevel})`);
        lampGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = lampGlow;
        ctx.beginPath();
        ctx.arc(lampX, lampY, 35 * glowLevel + 12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = glowLevel > 0.1 ? '#fef08a' : '#1e293b';
      ctx.beginPath();
      ctx.arc(lampX, lampY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = glowLevel > 0.1 ? '#ea580c' : '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lampX - 5, lampY + 6);
      ctx.lineTo(lampX - 2, lampY - 4);
      ctx.lineTo(lampX + 2, lampY - 4);
      ctx.lineTo(lampX + 5, lampY + 6);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText('LED Indicator', lampX, lampY - 20);

      // 8. Solenoid Coil Cylinder with Wire Loops
      const loopCount = Math.min(Math.max(Math.floor(coilTurnsN / 6), 6), 26);
      const loopSpacing = coilW / loopCount;

      // Solenoid Body Frame
      ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.fillRect(coilCenterX - coilW / 2, centerY - coilH / 2 + 4, coilW, coilH - 8);
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(coilCenterX - coilW / 2, centerY - coilH / 2 + 4, coilW, coilH - 8);

      // Solenoid Coil Turns
      for (let i = 0; i < loopCount; i++) {
        const lx = coilCenterX - coilW / 2 + i * loopSpacing + loopSpacing / 2;
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.ellipse(lx, centerY, 6, coilH / 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Lenz's Law Induced Current Arrows on Coil
        if (Math.abs(instantCurrent) > 0.008 && (i % 2 === 0)) {
          const arrowDir = instantCurrent > 0 ? 1 : -1;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(lx, centerY - (coilH / 2) * arrowDir + (arrowDir > 0 ? 4 : -4), 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Solenoid Label Tag
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`N = ${coilTurnsN} ${t('experiments.electromagnetic_induction.turnsSuffix')}`, coilCenterX, centerY - coilH / 2 - 14);

      // 9. Bar Magnet or Rotating Magnet Rendering
      const magX = magnetPosRef.current;
      const magW = 110;
      const magH = 36;

      ctx.save();
      ctx.translate(magX, centerY);

      if (motionMode === 'ac') {
        ctx.rotate(rotAngleRef.current);
      }

      // Magnet South Pole
      ctx.fillStyle = isNorthLeading ? '#0284c7' : '#dc2626';
      ctx.fillRect(-magW / 2, -magH / 2, magW / 2, magH);
      ctx.strokeStyle = isNorthLeading ? '#38bdf8' : '#f87171';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-magW / 2, -magH / 2, magW / 2, magH);

      // Magnet North Pole
      ctx.fillStyle = isNorthLeading ? '#dc2626' : '#0284c7';
      ctx.fillRect(0, -magH / 2, magW / 2, magH);
      ctx.strokeStyle = isNorthLeading ? '#f87171' : '#38bdf8';
      ctx.strokeRect(0, -magH / 2, magW / 2, magH);

      // Center Gripper Ridges in Magnet
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.lineTo(-4, 10);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.moveTo(4, -10);
      ctx.lineTo(4, 10);
      ctx.stroke();

      // Pole Letters
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isNorthLeading ? 'S' : 'N', -magW / 4, 5);
      ctx.fillText(isNorthLeading ? 'N' : 'S', magW / 4, 5);

      ctx.restore();

      // 10. Magnetic Field Lines (Emerging from North Pole)
      if (showFieldLines) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);

        const northSign = isNorthLeading ? 1 : -1;
        const nX = magX + (magW / 2) * northSign;
        const sX = magX - (magW / 2) * northSign;

        for (let offset = -20; offset <= 20; offset += 10) {
          ctx.beginPath();
          ctx.moveTo(nX, centerY + offset);
          ctx.quadraticCurveTo(nX + 45 * northSign, centerY + offset * 3, sX, centerY + offset);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 11. Magnetic Flux Vector Arrow through Coil
      if (showFluxVector && Math.abs(instantFlux) > 0.0001) {
        ctx.save();
        const fluxLen = Math.max(10, Math.min(60, (Math.abs(instantFlux) / 0.005) * 45));
        const fluxDir = instantFlux > 0 ? 1 : -1;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(coilCenterX - fluxLen * fluxDir, centerY);
        ctx.lineTo(coilCenterX + fluxLen * fluxDir, centerY);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(coilCenterX + (fluxLen + 6) * fluxDir, centerY);
        ctx.lineTo(coilCenterX + fluxLen * fluxDir, centerY - 6);
        ctx.lineTo(coilCenterX + fluxLen * fluxDir, centerY + 6);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 10px monospace';
        ctx.fillText(`Φ_B`, coilCenterX, centerY - 12);
        ctx.restore();
      }

      // 12. Interactive Drag Highlight on Magnet (Active Feedback in Manual Mode)
      if (motionMode === 'manual') {
        ctx.save();
        const isDragging = isDraggingRef.current;
        const isHovered = isHoveringMagnetRef.current;

        ctx.strokeStyle = isDragging 
          ? 'rgba(56, 189, 248, 0.95)' 
          : isHovered 
            ? 'rgba(250, 204, 21, 0.85)' 
            : 'rgba(250, 204, 21, 0.45)';
        ctx.lineWidth = isDragging ? 2.5 : 1.5;
        ctx.setLineDash(isDragging ? [4, 4] : [3, 3]);
        ctx.strokeRect(magX - magW / 2 - 5, centerY - magH / 2 - 5, magW + 10, magH + 10);

        // Visual Drag Handle prompt directly above magnet
        if (!isDragging) {
          ctx.fillStyle = '#fde047';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🖐️ Drag Here', magX, centerY - magH / 2 - 9);
        }
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    coilTurnsN,
    magnetSpeedMps,
    magneticFieldTesla,
    coilResistanceOhm,
    coilRadiusCm,
    isNorthLeading,
    motionMode,
    isRunning,
    showFieldLines,
    showFluxVector,
    coilAreaM2,
    peakTheoreticalEmf,
    t,
  ]);

  // Live Oscilloscope Waveform Rendering
  useEffect(() => {
    if (!showOscilloscope) return;
    const canvas = scopeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep Tech Oscilloscope Display
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 25; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 20; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Zero Voltage Axis
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const history = scopeHistoryRef.current;
    if (history.length > 2) {
      const maxV = Math.max(0.25, peakTheoreticalEmf || 1);

      // Plot Induced EMF Waveform (Gold / Yellow)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = (i / 200) * w;
        const normY = history[i].emf / maxV;
        const y = h / 2 - normY * (h * 0.4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Plot Magnetic Flux Waveform (Sky Blue)
      const maxFlux = Math.max(0.001, magneticFieldTesla * coilAreaM2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = (i / 200) * w;
        const normY = history[i].flux / maxFlux;
        const y = h / 2 - normY * (h * 0.35);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [showOscilloscope, peakTheoreticalEmf, magneticFieldTesla, coilAreaM2]);

  // Log Measurement to Lab Notebook
  const handleLog = () => {
    const instantEmf = recentInstantEmfRef.current;
    const instantCurrent = coilResistanceOhm > 0 ? (instantEmf / coilResistanceOhm) * 1000 : 0;
    const instantFlux = recentInstantFluxRef.current;

    onLogMeasurement({
      experiment: 'electromagnetic_induction',
      variableName: t('experiments.electromagnetic_induction.variableName'),
      measuredValue: parseFloat(instantEmf.toFixed(3)),
      theoreticalValue: parseFloat(peakTheoreticalEmf.toFixed(3)),
      unit: 'V',
      parameters: {
        'Motion Mode': motionMode.toUpperCase(),
        'Coil Turns (N)': coilTurnsN,
        'Magnet Speed (v)': `${magnetSpeedMps.toFixed(1)} m/s`,
        'Magnetic Field (B)': `${magneticFieldTesla.toFixed(2)} T`,
        'Coil Radius (r)': `${coilRadiusCm.toFixed(1)} cm`,
        'Coil Area (A)': `${(coilAreaM2 * 10000).toFixed(2)} cm²`,
        'Circuit Resistance (R)': `${coilResistanceOhm} Ω`,
        'Instantaneous EMF (ε)': `${instantEmf.toFixed(3)} V`,
        'Instantaneous Current (I)': `${instantCurrent.toFixed(1)} mA`,
        'Magnetic Flux (Φ_B)': `${(instantFlux * 1000).toFixed(3)} mWb`,
        'Peak Calculated EMF (ε_peak)': `${peakTheoreticalEmf.toFixed(3)} V`,
      },
      notes: t('experiments.electromagnetic_induction.notes'),
    });

    setLogged(true);
    setTimeout(() => setLogged(false), 2500);
  };

  const handleReset = () => {
    setCoilTurnsN(50);
    setMagnetSpeedMps(1.5);
    setMagneticFieldTesla(0.8);
    setCoilResistanceOhm(10);
    setCoilRadiusCm(3.5);
    setIsNorthLeading(true);
    setMotionMode('oscillate');
    setIsRunning(true);
    magnetPosRef.current = 200;
    setManualSliderX(200);
  };

  return (
    <div id="faraday-induction-root" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none">
      
      {/* 1. Header Bar: Title, Equation Badge, and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{t('experiments.electromagnetic_induction.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-amber-300 whitespace-nowrap">
                ε = -N · (dΦ/dt)
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{t('experiments.electromagnetic_induction.subTitle')}</p>
          </div>
        </div>

        {/* Action Controls - Protected against overflow */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Pause / Play Toggle */}
          <button
            id="btn-faraday-play-pause"
            onClick={() => setIsRunning(!isRunning)}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 border ${
              isRunning
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 shadow-lg shadow-emerald-950/40'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 shrink-0" />
                <span>{t('experiments.electromagnetic_induction.pause')}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('experiments.electromagnetic_induction.play')}</span>
              </>
            )}
          </button>

          {/* Flip Magnet Polarity */}
          <button
            id="btn-faraday-flip-poles"
            onClick={() => setIsNorthLeading(!isNorthLeading)}
            className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-sky-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title={t('experiments.electromagnetic_induction.flipMagnet')}
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0 text-sky-400" />
            <span>{isNorthLeading ? 'N ↔ S' : 'S ↔ N'}</span>
          </button>

          {/* Log Measurement Button */}
          <button
            id="btn-faraday-log-data"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              logged
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span>{logged ? (t('experiments.electromagnetic_induction.loggedSuccess') || 'Saved ✓') : (t('experiments.electromagnetic_induction.logData') || 'Log Data')}</span>
          </button>

          {/* Reset Button */}
          <button
            id="btn-faraday-reset"
            onClick={handleReset}
            title={t('experiments.electromagnetic_induction.reset') || 'Reset'}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center shrink-0"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
          </button>

        </div>
      </div>

      {/* 2. Motion Mode Selector Toolbar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap me-1">
            {t('experiments.electromagnetic_induction.mode')}:
          </span>

          <button
            id="btn-mode-oscillate"
            onClick={() => setMotionMode('oscillate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              motionMode === 'oscillate'
                ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 font-bold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <span>↔️</span>
            <span>{t('experiments.electromagnetic_induction.modeOscillate')}</span>
          </button>

          <button
            id="btn-mode-manual"
            onClick={() => setMotionMode('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              motionMode === 'manual'
                ? 'bg-sky-500/20 border-sky-500/70 text-sky-200 font-bold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <Hand className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('experiments.electromagnetic_induction.modeManual')}</span>
          </button>

          <button
            id="btn-mode-ac"
            onClick={() => setMotionMode('ac')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              motionMode === 'ac'
                ? 'bg-purple-500/20 border-purple-500/70 text-purple-200 font-bold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <span>🔄</span>
            <span>{t('experiments.electromagnetic_induction.modeAC')}</span>
          </button>
        </div>

        {/* Visual Toggles */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showFieldLines}
              onChange={(e) => setShowFieldLines(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <span className="whitespace-nowrap">{t('experiments.electromagnetic_induction.showFieldLines')}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showFluxVector}
              onChange={(e) => setShowFluxVector(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
            />
            <span className="whitespace-nowrap">{t('experiments.electromagnetic_induction.showFlux')}</span>
          </label>
        </div>
      </div>

      {/* 3. Main Stage: Interactive Induction Canvas & Oscilloscope Waveforms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Solenoid & Moving Magnet Canvas Stage (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-inner min-h-[410px]">
            
            {/* Top Interactive Canvas Bar */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 z-10 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                {motionMode === 'manual' ? (
                  <Hand className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
                ) : (
                  <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="font-bold text-xs sm:text-sm">
                  {motionMode === 'manual'
                    ? (t('experiments.electromagnetic_induction.dragActive') || t('experiments.electromagnetic_induction.dragPrompt'))
                    : `Speed: ${magnetSpeedMps.toFixed(1)} m/s | B: ${magneticFieldTesla.toFixed(2)} T`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400">
                  {t('experiments.electromagnetic_induction.galvanometerLabel')}
                </span>
              </div>
            </div>

            {/* Interactive Faraday Canvas with Full Pointer & Touch Support */}
            <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
              <canvas
                ref={canvasRef}
                width={650}
                height={350}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`w-full h-auto max-h-[350px] rounded-xl bg-slate-950 border border-slate-900 shadow-inner touch-none select-none ${
                  motionMode === 'manual' 
                    ? (isDraggingActive ? 'cursor-grabbing' : 'cursor-grab') 
                    : 'cursor-pointer'
                }`}
              />
            </div>

            {/* Manual Drag Quick Helper Controls below Canvas when in Manual Mode */}
            {motionMode === 'manual' && (
              <div className="w-full bg-slate-900/90 border border-sky-900/40 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-sky-300 font-bold flex items-center gap-1">
                    <Hand className="w-3.5 h-3.5" />
                    {t('experiments.electromagnetic_induction.manualPos') || 'Position (X):'}
                  </span>
                  <span className="text-xs font-mono text-slate-300 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {manualSliderX} px
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setManualPosition(magnetPosRef.current - 60)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 active:scale-95 transition-all flex items-center gap-1"
                    title="Move Magnet Left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{t('experiments.electromagnetic_induction.moveLeft') || 'Left'}</span>
                  </button>

                  <button
                    onClick={() => setManualPosition(338)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 active:scale-95 transition-all flex items-center gap-1"
                    title="Center inside Solenoid"
                  >
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('experiments.electromagnetic_induction.centerMagnet') || 'Center'}</span>
                  </button>

                  <button
                    onClick={() => setManualPosition(magnetPosRef.current + 60)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 active:scale-95 transition-all flex items-center gap-1"
                    title="Move Magnet Right"
                  >
                    <span>{t('experiments.electromagnetic_induction.moveRight') || 'Right'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleQuickThrust}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 active:scale-95 transition-all flex items-center gap-1"
                    title="Simulate swift thrust through coil"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>{t('experiments.electromagnetic_induction.quickThrust') || 'Quick Thrust'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Real-Time Measured Outputs Bento Cards (Live Dynamic Values) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Live Instantaneous Induced EMF Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('experiments.electromagnetic_induction.inducedEmf')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">ε</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-1 block">
                {liveEmf.toFixed(3)} <span className="text-xs font-normal text-slate-400">V</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">ε_peak = {peakTheoreticalEmf.toFixed(2)} V</span>
            </div>

            {/* Live Instantaneous Induced Current Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('experiments.electromagnetic_induction.inducedCurrent')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">I</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1 block">
                {liveCurrent.toFixed(1)} <span className="text-xs font-normal text-slate-400">mA</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">I = ε / R</span>
            </div>

            {/* Live Magnetic Flux Change Rate Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('experiments.electromagnetic_induction.fluxChangeRate')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">dΦ/dt</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-sky-400 font-mono mt-1 block">
                {liveFluxRate.toFixed(4)} <span className="text-xs font-normal text-slate-400">Wb/s</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Φ = {(liveFlux * 1000).toFixed(2)} mWb</span>
            </div>

            {/* Coil Loops Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('experiments.electromagnetic_induction.coilLoopsLabel')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">N</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-purple-400 font-mono mt-1 block">
                {coilTurnsN} <span className="text-xs font-normal text-slate-400">{t('experiments.electromagnetic_induction.turnsSuffix')}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Solenoid Coil</span>
            </div>

          </div>

        </div>

        {/* Right Side: Parameters Controls & Live Oscilloscope (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Controls Panel */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                {t('experiments.electromagnetic_induction.controlsTitle')}
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Faraday Lab</span>
            </div>

            {/* Manual Position Slider (Dedicated slider when in Manual Mode) */}
            {motionMode === 'manual' && (
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/50 space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-sky-300 font-sans font-bold flex items-center gap-1">
                    <Hand className="w-3.5 h-3.5" />
                    {t('experiments.electromagnetic_induction.manualPos') || 'Magnet Position (x):'}
                  </span>
                  <span className="text-sky-300 font-bold">{manualSliderX} px</span>
                </div>
                <input
                  id="slider-faraday-manual-pos"
                  type="range"
                  min="65"
                  max="585"
                  step="2"
                  value={manualSliderX}
                  onChange={(e) => setManualPosition(Number(e.target.value))}
                  className="w-full accent-sky-400 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>◀ Entry (65px)</span>
                  <span className="text-amber-400 font-bold">Coil Center (338px)</span>
                  <span>Exit (585px) ▶</span>
                </div>
              </div>
            )}

            {/* Number of Turns (N) Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">{t('experiments.electromagnetic_induction.coilTurns')}</span>
                <span className="text-amber-400 font-bold">{coilTurnsN} {t('experiments.electromagnetic_induction.turnsSuffix')}</span>
              </div>
              <input
                id="slider-faraday-turns"
                type="range"
                min="10"
                max="200"
                step="10"
                value={coilTurnsN}
                onChange={(e) => setCoilTurnsN(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Magnet Velocity (v) Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">{t('experiments.electromagnetic_induction.magnetSpeed')}</span>
                <span className="text-emerald-400 font-bold">{magnetSpeedMps.toFixed(1)} m/s</span>
              </div>
              <input
                id="slider-faraday-speed"
                type="range"
                min="0.2"
                max="4.0"
                step="0.1"
                value={magnetSpeedMps}
                onChange={(e) => setMagnetSpeedMps(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Magnetic Field Strength (B) Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">{t('experiments.electromagnetic_induction.magneticField')}</span>
                <span className="text-rose-400 font-bold">{magneticFieldTesla.toFixed(2)} T</span>
              </div>
              <input
                id="slider-faraday-bfield"
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={magneticFieldTesla}
                onChange={(e) => setMagneticFieldTesla(Number(e.target.value))}
                className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Circuit Resistance (R) Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">{t('experiments.electromagnetic_induction.coilResistance')}</span>
                <span className="text-sky-400 font-bold">{coilResistanceOhm} Ω</span>
              </div>
              <input
                id="slider-faraday-resistance"
                type="range"
                min="1"
                max="50"
                step="1"
                value={coilResistanceOhm}
                onChange={(e) => setCoilResistanceOhm(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Coil Radius (r) Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">{t('experiments.electromagnetic_induction.coilRadius')}</span>
                <span className="text-purple-400 font-bold">{coilRadiusCm.toFixed(1)} cm</span>
              </div>
              <input
                id="slider-faraday-radius"
                type="range"
                min="2.0"
                max="6.0"
                step="0.5"
                value={coilRadiusCm}
                onChange={(e) => setCoilRadiusCm(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

          </div>

          {/* Live Waveform Oscilloscope */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                {t('experiments.electromagnetic_induction.showScope')}
              </span>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-amber-400 font-bold">● ε (EMF)</span>
                <span className="text-sky-400">--- Φ_B (Flux)</span>
              </div>
            </div>

            <canvas
              ref={scopeCanvasRef}
              width={340}
              height={130}
              className="w-full h-[130px] rounded-xl bg-slate-950 border border-slate-900"
            />
          </div>

          {/* Lenz's Law Educational Tip */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t('experiments.electromagnetic_induction.lenzNotice')}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
