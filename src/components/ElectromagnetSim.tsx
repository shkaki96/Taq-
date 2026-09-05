import {
  Magnet,
  Activity,
  Zap,
  Compass as CompassIcon,
  RotateCcw,
  BookmarkCheck,
  Play,
  Pause,
  ArrowRightLeft,
  Sliders,
  Power,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function ElectromagnetSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();

  // Power & State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isCircuitClosed, setIsCircuitClosed] = useState<boolean>(true);
  const [powerMode, setPowerMode] = useState<'dc' | 'ac'>('dc');

  // Parameters
  const [dcCurrent, setDcCurrent] = useState<number>(3.5); // Amperes (-10 to +10 A)
  const [acAmplitude, setAcAmplitude] = useState<number>(4.0); // Peak Amperes (1 to 10 A)
  const [acFrequency, setAcFrequency] = useState<number>(1.0); // Hz (0.5 to 5 Hz)
  const [turns, setTurns] = useState<number>(120); // Turns (20 to 300)
  const [ironCoreInsertion, setIronCoreInsertion] = useState<number>(100); // 0% (air) to 100% (fully inserted iron)
  const [showCompassGrid, setShowCompassGrid] = useState<boolean>(true);
  const [showFieldLines, setShowFieldLines] = useState<boolean>(true);

  // Draggable Items Coordinates (in Canvas 840x480 space)
  const [compassPos, setCompassPos] = useState<{ x: number; y: number }>({ x: 620, y: 240 });
  const [probePos, setProbePos] = useState<{ x: number; y: number }>({ x: 580, y: 130 });
  const [logged, setLogged] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingTargetRef = useRef<'compass' | 'probe' | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const timeRef = useRef<number>(0);
  const particlePhaseRef = useRef<number>(0);

  // Constants
  const mu0 = 4 * Math.PI * 1e-7; // T*m/A
  const coilLengthM = 0.12; // 12 cm physical solenoid length
  const coilRadiusM = 0.025; // 2.5 cm radius
  const coilResistanceOhm = 1.2; // Ohms

  // Relative permeability smoothly scaled with iron core insertion (1 to 200)
  const relativePermeability = 1.0 + (199.0 * ironCoreInsertion) / 100;

  // Instantaneous Current I(t)
  const getCurrentAtTime = useCallback(
    (tSec: number) => {
      if (!isCircuitClosed) return 0;
      if (powerMode === 'dc') return dcCurrent;
      return acAmplitude * Math.sin(2 * Math.PI * acFrequency * tSec);
    },
    [isCircuitClosed, powerMode, dcCurrent, acAmplitude, acFrequency]
  );

  // Core Magnetic Flux Density: B_core = mu_r * mu_0 * (N / L) * I
  const turnsDensity = turns / coilLengthM;
  const currentInstant = getCurrentAtTime(timeRef.current);
  const B_core_T = mu0 * relativePermeability * turnsDensity * currentInstant;
  const B_core_mT = (B_core_T * 1000).toFixed(2);

  // Dipole Field Calculation at any Canvas point (px, py)
  const computeFieldAt = useCallback(
    (px: number, py: number, currentVal: number) => {
      const centerX = 360;
      const centerY = 240;
      const halfL = 65; // pixels half-length of solenoid
      const poleSign = currentVal >= 0 ? 1 : -1;

      // When I > 0: North pole is at right (+x), South pole at left (-x)
      const nPole = { x: centerX + poleSign * halfL, y: centerY };
      const sPole = { x: centerX - poleSign * halfL, y: centerY };

      const dxN = px - nPole.x;
      const dyN = py - nPole.y;
      const rN = Math.hypot(dxN, dyN);
      const rN3 = Math.max(15, rN) ** 3;

      const dxS = px - sPole.x;
      const dyS = py - sPole.y;
      const rS = Math.hypot(dxS, dyS);
      const rS3 = Math.max(15, rS) ** 3;

      const scale = Math.abs(currentVal) * (relativePermeability / 50) * (turns / 100) * 12000;
      const bx_mag = scale * (dxN / rN3 - dxS / rS3);
      const by_mag = scale * (dyN / rN3 - dyS / rS3);

      // Earth's field (0.05 mT Northwards / Upwards)
      const bx_earth = 0;
      const by_earth = -0.05 * 12;

      const bx_total = bx_mag + bx_earth;
      const by_total = by_mag + by_earth;
      const bTotal_mT = Math.hypot(bx_total, by_total) * 0.08;
      const angleRad = Math.atan2(by_total, bx_total);

      return {
        bx: bx_total,
        by: by_total,
        bTotal_mT,
        angleRad,
      };
    },
    [relativePermeability, turns]
  );

  const compassField = computeFieldAt(compassPos.x, compassPos.y, currentInstant);
  const probeField = computeFieldAt(probePos.x, probePos.y, currentInstant);

  // Number of attracted paperclips proportional to B_core^2 and core presence
  const magneticPickupFactor = Math.abs(parseFloat(B_core_mT)) * (ironCoreInsertion / 100);
  const paperClipsCount = isCircuitClosed ? Math.min(35, Math.round(magneticPickupFactor * 0.12)) : 0;
  const powerDissipated = isCircuitClosed ? (Math.abs(currentInstant) ** 2 * coilResistanceOhm).toFixed(1) : '0.0';

  // Reset Simulation
  const resetSimulation = () => {
    setDcCurrent(3.5);
    setAcAmplitude(4.0);
    setAcFrequency(1.0);
    setTurns(120);
    setIronCoreInsertion(100);
    setIsCircuitClosed(true);
    setPowerMode('dc');
    setCompassPos({ x: 620, y: 240 });
    setProbePos({ x: 580, y: 130 });
    setShowCompassGrid(true);
    setShowFieldLines(true);
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'magnets_electromagnets',
        parameters: {
          PowerMode: powerMode.toUpperCase(),
          Current_I_A: `${currentInstant.toFixed(2)} A`,
          Turns_N: turns,
          IronCoreInsertion: `${ironCoreInsertion}%`,
          RelativePermeability: relativePermeability.toFixed(1),
          AttractedClips: paperClipsCount,
          PowerDissipated_W: `${powerDissipated} W`,
        },
        measuredValue: parseFloat(B_core_mT),
        theoreticalValue: parseFloat(
          (relativePermeability * mu0 * (turns / coilLengthM) * Math.abs(currentInstant) * 1000).toFixed(2)
        ),
        unit: 'mT',
        variableName: tI18n('experiments.magnets_electromagnets.coilField') || 'Solenoid Core Magnetic Flux Density (B)',
        equation: 'B = μ₀ · μᵣ · (N / L) · I',
        notes: `Electromagnet: ${turns} turns, μr=${relativePermeability.toFixed(0)}, I=${currentInstant.toFixed(2)}A, Core B=${B_core_mT} mT`,
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (isRunning) {
        timeRef.current += dt;
        const currentNow = getCurrentAtTime(timeRef.current);
        particlePhaseRef.current = (particlePhaseRef.current + (currentNow >= 0 ? 1 : -1) * dt * Math.abs(currentNow) * 40 + 2000) % 2000;
      }

      const currentNow = getCurrentAtTime(timeRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.clearRect(0, 0, width, height);

          // Deep Space Dark Canvas Background
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, width, height);

          // Grid Lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
          ctx.lineWidth = 1;
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

          const centerX = 360;
          const centerY = 240;
          const solW = 150;
          const solH = 90;

          // 1. Compass Grid (PhET-style background orientation)
          if (showCompassGrid && isCircuitClosed && Math.abs(currentNow) > 0.05) {
            const gridSpacing = 42;
            for (let gx = 35; gx < width - 20; gx += gridSpacing) {
              for (let gy = 35; gy < height - 20; gy += gridSpacing) {
                // Skip core area
                if (Math.abs(gx - centerX) < solW / 2 + 30 && Math.abs(gy - centerY) < solH / 2 + 25) {
                  continue;
                }
                const f = computeFieldAt(gx, gy, currentNow);
                const needleLen = 12;

                ctx.save();
                ctx.translate(gx, gy);
                ctx.rotate(f.angleRad);

                // North tip (Red)
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(needleLen, 0);
                ctx.lineTo(needleLen - 3.5, -2.5);
                ctx.lineTo(needleLen - 3.5, 2.5);
                ctx.closePath();
                ctx.fillStyle = '#ef4444';
                ctx.fill();

                // South tip (Blue)
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-needleLen, 0);
                ctx.lineTo(-needleLen + 3.5, -2.5);
                ctx.lineTo(-needleLen + 3.5, 2.5);
                ctx.closePath();
                ctx.fillStyle = '#60a5fa';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                ctx.restore();
              }
            }
          }

          // 2. Magnetic Field Streamlines Loops
          if (showFieldLines && isCircuitClosed && Math.abs(currentNow) > 0.05) {
            const numLines = Math.min(8, Math.max(3, Math.round(Math.abs(currentNow) * 0.8)));
            const poleSign = currentNow >= 0 ? 1 : -1;
            ctx.lineWidth = 1.4;

            for (let i = 1; i <= numLines; i++) {
              const rx = solW * 0.5 + i * 32;
              const ry = solH * 0.4 + i * 24;
              const alpha = Math.max(0.12, 0.55 - i * 0.06);
              ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;

              // Top Loop
              ctx.beginPath();
              ctx.ellipse(centerX, centerY - ry * 0.55, rx, ry, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Bottom Loop
              ctx.beginPath();
              ctx.ellipse(centerX, centerY + ry * 0.55, rx, ry, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Animated magnetic flux arrows along streamlines
              const phase = (particlePhaseRef.current * 0.03 + i * 0.5) % (Math.PI * 2);
              const ax = centerX + rx * Math.cos(phase);
              const ay = centerY - ry * 0.55 + ry * Math.sin(phase);

              ctx.beginPath();
              ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = '#c084fc';
              ctx.fill();
            }
          }

          // 3. Power Supply Unit (Left side)
          const psuX = 110;
          const psuY = 240;
          ctx.save();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(psuX - 55, psuY - 60, 110, 120);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.strokeRect(psuX - 55, psuY - 60, 110, 120);

          // Power Supply Display Screen
          ctx.fillStyle = '#020617';
          ctx.fillRect(psuX - 45, psuY - 50, 90, 42);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(psuX - 45, psuY - 50, 90, 42);

          ctx.font = 'bold 13px monospace';
          ctx.fillStyle = isCircuitClosed ? (powerMode === 'dc' ? '#f59e0b' : '#38bdf8') : '#64748b';
          ctx.textAlign = 'center';
          ctx.fillText(
            isCircuitClosed
              ? `${powerMode.toUpperCase()}: ${currentNow.toFixed(1)} A`
              : 'CIRCUIT OPEN',
            psuX,
            psuY - 32
          );

          ctx.font = '10px monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(
            isCircuitClosed ? `${(Math.abs(currentNow) * coilResistanceOhm).toFixed(1)} V · ${powerDissipated} W` : '0.0 V · 0.0 W',
            psuX,
            psuY - 16
          );

          // Terminals on PSU
          const termTopY = psuY + 12;
          const termBotY = psuY + 38;

          ctx.fillStyle = currentNow >= 0 ? '#ef4444' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(psuX + 35, termTopY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = currentNow >= 0 ? '#38bdf8' : '#ef4444';
          ctx.beginPath();
          ctx.arc(psuX + 35, termBotY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(currentNow >= 0 ? '+' : '-', psuX + 22, termTopY + 4);
          ctx.fillText(currentNow >= 0 ? '-' : '+', psuX + 22, termBotY + 4);

          // Connecting Heavy Copper Cables to Solenoid
          const coilLeftX = centerX - solW / 2;
          const coilTopLeadY = centerY - 32;
          const coilBotLeadY = centerY + 32;

          ctx.strokeStyle = isCircuitClosed ? (currentNow >= 0 ? '#ef4444' : '#38bdf8') : '#475569';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(psuX + 35, termTopY);
          ctx.bezierCurveTo(psuX + 80, termTopY, coilLeftX - 50, coilTopLeadY, coilLeftX, coilTopLeadY);
          ctx.stroke();

          ctx.strokeStyle = isCircuitClosed ? (currentNow >= 0 ? '#38bdf8' : '#ef4444') : '#475569';
          ctx.beginPath();
          ctx.moveTo(psuX + 35, termBotY);
          ctx.bezierCurveTo(psuX + 80, termBotY, coilLeftX - 50, coilBotLeadY, coilLeftX, coilBotLeadY);
          ctx.stroke();

          ctx.restore();

          // 4. Soft Iron Core (Inserted dynamically inside the solenoid)
          const coreW = solW + 40;
          const coreH = solH - 24;
          const insertionRatio = ironCoreInsertion / 100;
          const coreCurrentX = centerX - (1 - insertionRatio) * 70;

          if (ironCoreInsertion > 0) {
            ctx.save();
            // Metal Gradient
            const grad = ctx.createLinearGradient(0, centerY - coreH / 2, 0, centerY + coreH / 2);
            grad.addColorStop(0, '#64748b');
            grad.addColorStop(0.3, '#94a3b8');
            grad.addColorStop(0.5, '#e2e8f0');
            grad.addColorStop(0.7, '#94a3b8');
            grad.addColorStop(1, '#475569');

            ctx.fillStyle = grad;
            ctx.shadowColor = isCircuitClosed && Math.abs(currentNow) > 1 ? 'rgba(192, 132, 252, 0.4)' : 'transparent';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.roundRect(coreCurrentX - (coreW * insertionRatio) / 2, centerY - coreH / 2, coreW * insertionRatio, coreH, 8);
            ctx.fill();

            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Core Label
            if (insertionRatio > 0.4) {
              ctx.font = 'bold 11px sans-serif';
              ctx.fillStyle = '#0f172a';
              ctx.textAlign = 'center';
              ctx.fillText(
                `${tI18n('experiments.magnets_electromagnets.ironCore') || 'IRON CORE'} (μr=${relativePermeability.toFixed(0)})`,
                coreCurrentX,
                centerY + 4
              );
            }
            ctx.restore();
          }

          // 5. Copper Coil Windings with animated flowing electrons
          const numWindingsToDraw = Math.min(22, Math.max(8, Math.round(turns / 12)));
          const windingSpacing = solW / numWindingsToDraw;

          for (let w = 0; w <= numWindingsToDraw; w++) {
            const wx = coilLeftX + w * windingSpacing;

            // Copper Turn Wire
            ctx.save();
            const wireGrad = ctx.createLinearGradient(0, centerY - solH / 2, 0, centerY + solH / 2);
            wireGrad.addColorStop(0, '#d97706');
            wireGrad.addColorStop(0.4, '#fde047');
            wireGrad.addColorStop(0.7, '#f59e0b');
            wireGrad.addColorStop(1, '#b45309');

            ctx.strokeStyle = wireGrad;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.ellipse(wx, centerY, 8, solH / 2, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Animated Electron Charge Dots moving along coils
            if (isRunning && isCircuitClosed && Math.abs(currentNow) > 0.05) {
              const dotAngle = (particlePhaseRef.current * 0.05 + w * 0.4) % (Math.PI * 2);
              const dx = wx + Math.cos(dotAngle) * 8;
              const dy = centerY + Math.sin(dotAngle) * (solH / 2);
              ctx.beginPath();
              ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = '#fef08a';
              ctx.fill();
            }
            ctx.restore();
          }

          // 6. Magnetic Poles Indicator Badges (N & S)
          if (isCircuitClosed && Math.abs(currentNow) > 0.1) {
            const northAtRight = currentNow >= 0;
            const rightX = centerX + solW / 2 + 25;
            const leftX = centerX - solW / 2 - 25;

            ctx.save();
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Left Pole
            ctx.fillStyle = northAtRight ? '#3b82f6' : '#ef4444';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 12;
            ctx.fillText(northAtRight ? 'S' : 'N', leftX, centerY);

            // Right Pole
            ctx.fillStyle = northAtRight ? '#ef4444' : '#3b82f6';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 12;
            ctx.fillText(northAtRight ? 'N' : 'S', rightX, centerY);

            ctx.restore();
          }

          // 7. Paperclips Pickup Physics Area (Near Right Pole)
          const trayX = centerX + solW / 2 + 65;
          const trayY = centerY + 45;

          ctx.save();
          // Metal Tray on table
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(trayX - 35, trayY - 6, 70, 12);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(trayX - 35, trayY - 6, 70, 12);

          // Paperclips
          const totalClips = 12;
          for (let c = 0; c < totalClips; c++) {
            const isAttracted = c < Math.min(totalClips, paperClipsCount);
            const clipX = isAttracted
              ? centerX + solW / 2 + 10 + (c % 4) * 8
              : trayX - 25 + (c % 6) * 9;
            const clipY = isAttracted
              ? centerY - 15 + Math.floor(c / 4) * 12 + Math.sin(c * 2) * 4
              : trayY - 14 - Math.floor(c / 6) * 6;

            ctx.strokeStyle = isAttracted ? '#fbbf24' : '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(clipX, clipY, 14, 6, 3);
            ctx.stroke();
          }

          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.fillText(`📎 ${paperClipsCount} ` + (lang === 'ar' ? 'مشبك منجذب' : 'Clips Attached'), trayX, trayY + 22);
          ctx.restore();

          // 8. Draggable Precision Compass
          const cx = compassPos.x;
          const cy = compassPos.y;
          const compassRadius = 36;

          ctx.save();
          ctx.shadowColor = 'rgba(14, 165, 233, 0.4)';
          ctx.shadowBlur = 16;

          ctx.beginPath();
          ctx.arc(cx, cy, compassRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Dial marks
          for (let deg = 0; deg < 360; deg += 30) {
            const rad = (deg * Math.PI) / 180;
            const x1 = cx + (compassRadius - 6) * Math.cos(rad);
            const y1 = cy + (compassRadius - 6) * Math.sin(rad);
            const x2 = cx + (compassRadius - 2) * Math.cos(rad);
            const y2 = cy + (compassRadius - 2) * Math.sin(rad);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = deg % 90 === 0 ? '#38bdf8' : '#64748b';
            ctx.lineWidth = deg % 90 === 0 ? 2 : 1;
            ctx.stroke();
          }

          // Rotating Needle
          const compassAngle = compassField.angleRad;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(compassAngle);

          // North Needle
          ctx.beginPath();
          ctx.moveTo(compassRadius - 6, 0);
          ctx.lineTo(0, -5);
          ctx.lineTo(0, 5);
          ctx.closePath();
          ctx.fillStyle = '#ef4444';
          ctx.fill();

          // South Needle
          ctx.beginPath();
          ctx.moveTo(-compassRadius + 6, 0);
          ctx.lineTo(0, -5);
          ctx.lineTo(0, 5);
          ctx.closePath();
          ctx.fillStyle = '#f8fafc';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.fill();

          ctx.restore();
          ctx.restore();

          const deflectionDeg = ((-compassAngle * 180) / Math.PI + 360) % 360;
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          ctx.fillText(`θ = ${deflectionDeg.toFixed(1)}°`, cx, cy + compassRadius + 15);
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('🧭 ' + (lang === 'ar' ? 'اسحب البوصلة' : 'Drag Compass'), cx, cy + compassRadius + 28);

          // 9. Draggable Gaussmeter Sensor Probe
          const px = probePos.x;
          const py = probePos.y;

          ctx.save();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px - 14, py - 14, 28, 28);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(px - 14, py - 14, 28, 28);

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`B = ${probeField.bTotal_mT.toFixed(2)} mT`, px + 18, py - 3);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText(`${(probeField.bTotal_mT * 10).toFixed(1)} Gauss`, px + 18, py + 11);
          ctx.restore();

          // Simulation Status Badge
          ctx.textAlign = 'right';
          ctx.font = 'bold 11px sans-serif';
          if (isRunning && isCircuitClosed) {
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(width - 110, 24, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(tI18n('experiments.magnets_electromagnets.activeState') || 'Running', width - 20, 28);
          } else {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(width - 110, 24, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(tI18n('experiments.magnets_electromagnets.disabledState') || 'Paused / Open', width - 20, 28);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    isCircuitClosed,
    powerMode,
    dcCurrent,
    acAmplitude,
    acFrequency,
    turns,
    ironCoreInsertion,
    showCompassGrid,
    showFieldLines,
    compassPos,
    probePos,
    relativePermeability,
    turnsDensity,
    paperClipsCount,
    powerDissipated,
    computeFieldAt,
    getCurrentAtTime,
    lang,
    tI18n,
    probeField.bTotal_mT,
    compassField.angleRad,
  ]);

  // Pointer Drag Handlers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }

    if (Math.hypot(coords.x - compassPos.x, coords.y - compassPos.y) < 45) {
      draggingTargetRef.current = 'compass';
      dragOffsetRef.current = { x: coords.x - compassPos.x, y: coords.y - compassPos.y };
      return;
    }

    if (Math.hypot(coords.x - probePos.x, coords.y - probePos.y) < 32) {
      draggingTargetRef.current = 'probe';
      dragOffsetRef.current = { x: coords.x - probePos.x, y: coords.y - probePos.y };
      return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingTargetRef.current) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (draggingTargetRef.current === 'compass') {
      const newX = Math.max(45, Math.min(canvas.width - 45, coords.x - dragOffsetRef.current.x));
      const newY = Math.max(45, Math.min(canvas.height - 45, coords.y - dragOffsetRef.current.y));
      setCompassPos({ x: newX, y: newY });
    } else if (draggingTargetRef.current === 'probe') {
      const newX = Math.max(25, Math.min(canvas.width - 25, coords.x - dragOffsetRef.current.x));
      const newY = Math.max(25, Math.min(canvas.height - 25, coords.y - dragOffsetRef.current.y));
      setProbePos({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingTargetRef.current = null;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div id="electromagnet-simulation" className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Magnet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {tI18n('experiments.magnets_electromagnets.title') || 'Magnets and Electromagnets (Solenoid)'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">B = μ₀ · μᵣ · n · I = μ₀ · μᵣ · (N / L) · I</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Circuit Switch */}
          <button
            onClick={() => setIsCircuitClosed(!isCircuitClosed)}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
              isCircuitClosed
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isCircuitClosed ? (lang === 'ar' ? 'الدائرة مغلقة ⚡' : 'Circuit ON') : (lang === 'ar' ? 'الدائرة مفتوحة 🛑' : 'Circuit OFF')}</span>
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title={isRunning ? 'Pause' : 'Play'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={resetSimulation}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title={tI18n('experiments.magnets_electromagnets.reset') || 'Reset'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all shrink-0 ${
              logged
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{logged ? tI18n('experiments.magnets_electromagnets.logged') || 'Logged ✓' : tI18n('experiments.magnets_electromagnets.logMeasurement') || 'Log Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Canvas Area (Cols: 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
            {/* Top Toolbar overlay inside canvas */}
            <div className="w-full flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80 px-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200">
                  {lang === 'ar' ? 'المختبر التفاعلي للمغناطيس الكهربائي وتطبيقاته' : 'Interactive Electromagnet & Induction Stage'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompassGrid(!showCompassGrid)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    showCompassGrid
                      ? 'bg-purple-950 text-purple-300 border-purple-700'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {lang === 'ar' ? 'شبكة البوصلات' : 'Compass Grid'}
                </button>
                <button
                  onClick={() => setShowFieldLines(!showFieldLines)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    showFieldLines
                      ? 'bg-purple-950 text-purple-300 border-purple-700'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {lang === 'ar' ? 'خطوط الفيض' : 'Field Lines'}
                </button>
              </div>
            </div>

            {/* High-Resolution HTML5 Canvas */}
            <div className="w-full aspect-[7/4] max-h-[520px] rounded-xl overflow-hidden bg-slate-950 relative border border-slate-800/70 flex items-center justify-center touch-none">
              <canvas
                ref={canvasRef}
                width={840}
                height={480}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="cursor-crosshair w-full h-full object-contain"
              />
            </div>

            {/* Canvas Hint Prompt */}
            <div className="w-full text-center py-1.5 text-[11px] text-slate-400 flex items-center justify-center gap-3">
              <span>💡 {lang === 'ar' ? 'اسحب البوصلة أو مجس القياس أو غيّر إدخال قلب الحديد لملاحظة تضاعف المجال المغناطيسي!' : 'Drag the compass or probe, or adjust iron core insertion to observe dramatic magnetic amplification!'}</span>
            </div>
          </div>

          {/* Real-time Telemetry Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">{tI18n('experiments.magnets_electromagnets.coilField') || 'Core Field (B)'}</div>
              <div className="text-base font-bold font-mono text-purple-400">
                {B_core_mT} <span className="text-xs text-slate-400">mT</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">{tI18n('experiments.magnets_electromagnets.fieldAtCompass') || 'Field at Probe'}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {probeField.bTotal_mT.toFixed(2)} <span className="text-xs text-slate-400">mT</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">{tI18n('experiments.magnets_electromagnets.relPermeability') || 'Rel. Permeability (μr)'}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {relativePermeability.toFixed(0)} <span className="text-xs text-slate-400">×</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">{tI18n('experiments.magnets_electromagnets.paperclips') || 'Attracted Clips'}</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {paperClipsCount} <span className="text-xs text-slate-400">📎</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Parameters (Cols: 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Main Controls Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>{tI18n('experiments.magnets_electromagnets.inputsTitle') || 'Electromagnet Parameters'}</span>
            </h4>

            {/* Power Source Selector: DC vs AC */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-300">{lang === 'ar' ? 'نوع مصدر التغذية الكهربائية:' : 'Power Supply Source:'}</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPowerMode('dc')}
                  className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    powerMode === 'dc'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تيار مستمر (DC)' : 'DC Source'}</span>
                </button>

                <button
                  onClick={() => setPowerMode('ac')}
                  className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    powerMode === 'ac'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تيار متناوب (AC)' : 'AC Source'}</span>
                </button>
              </div>
            </div>

            {/* DC Current Controls */}
            {powerMode === 'dc' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{tI18n('experiments.magnets_electromagnets.currentLabel') || 'Current (I):'}</span>
                  <span className="font-mono text-amber-400 font-bold">{dcCurrent.toFixed(1)} A</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={dcCurrent}
                  onChange={(e) => setDcCurrent(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'عكس القطبية:' : 'Reverse Polarity:'}</span>
                  <button
                    onClick={() => setDcCurrent((prev) => -prev)}
                    className="min-h-[38px] px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                    <span>{dcCurrent >= 0 ? '+ / - (N ── S)' : '- / + (S ── N)'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{lang === 'ar' ? 'سعة التيار المتناوب (I_peak):' : 'AC Peak Current:'}</span>
                    <span className="font-mono text-sky-400 font-bold">{acAmplitude.toFixed(1)} A</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={acAmplitude}
                    onChange={(e) => setAcAmplitude(parseFloat(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{lang === 'ar' ? 'تردد التيار (f):' : 'AC Frequency (f):'}</span>
                    <span className="font-mono text-sky-300 font-bold">{acFrequency.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.2"
                    value={acFrequency}
                    onChange={(e) => setAcFrequency(parseFloat(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Coil Turns Slider */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.magnets_electromagnets.turnsLabel') || 'Coil Turns (N):'}</span>
                <span className="font-mono text-indigo-400 font-bold">{turns} ({turnsDensity.toFixed(0)} turns/m)</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={turns}
                onChange={(e) => setTurns(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Soft Iron Core Insertion Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{lang === 'ar' ? 'نسبة إدخال قلب الحديد المطاوع:' : 'Iron Core Insertion:'}</span>
                <span className="font-mono text-purple-400 font-bold">{ironCoreInsertion}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={ironCoreInsertion}
                onChange={(e) => setIronCoreInsertion(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{tI18n('experiments.magnets_electromagnets.airCore') || 'Air (μr=1)'}</span>
                <span>{tI18n('experiments.magnets_electromagnets.ironCore') || 'Full Soft Iron (μr=200)'}</span>
              </div>
            </div>
          </div>

          {/* Scientific Equations Reference Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ar' ? 'القوانين الفيزيائية للمغناطيس الكهربائي' : 'Electromagnet Physics Formula'}</span>
            </h4>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-purple-300 space-y-1.5">
              <div className="font-bold text-amber-300">B = μ₀ · μᵣ · (N / L) · I</div>
              <div className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? 'يتناسب المجال المغناطيسي طردياً مع تيار الملف وعدد اللفات ومعامل النفاذية المغناطيسية للقلب الحديدي.'
                  : 'Magnetic flux density is directly proportional to current, winding turns density, and core relative permeability.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
