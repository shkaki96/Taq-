import {
  Magnet,
  RotateCcw,
  Zap,
  BookmarkCheck,
  Play,
  Pause,
  Compass as CompassIcon,
  Layers,
  ArrowRightLeft,
  Activity,
  Maximize2,
  Globe,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
  initialMode?: MagneticMode;
}

export type MagneticMode = 'magnet_compass' | 'solenoid' | 'straight_wire' | 'force_wire';

export default function MagneticFieldSim({ lang, onLogMeasurement, initialMode = 'magnet_compass' }: Props) {
  const { t: tI18n } = useTranslation();
  const [mode, setMode] = useState<MagneticMode>(initialMode);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // --- Mode 1: Magnet & Compass Parameters ---
  const [magnetPos, setMagnetPos] = useState<{ x: number; y: number }>({ x: 340, y: 240 });
  const [magnetPolarity, setMagnetPolarity] = useState<'NS' | 'SN'>('NS'); // NS: N on right, S on left
  const [magnetStrength, setMagnetStrength] = useState<number>(1.0); // 0.2 to 2.0 (Tesla dipole factor)
  const [compassPos, setCompassPos] = useState<{ x: number; y: number }>({ x: 550, y: 240 });
  const [showCompassGrid, setShowCompassGrid] = useState<boolean>(true);
  const [showFieldLines, setShowFieldLines] = useState<boolean>(true);
  const [includeEarthField, setIncludeEarthField] = useState<boolean>(true);
  const [earthFieldStrength, setEarthFieldStrength] = useState<number>(0.05); // mT (North = Upwards in 2D)

  // --- Mode 2: Solenoid Parameters ---
  const [currentI, setCurrentI] = useState<number>(3.0); // Amperes (-8 to +8 A)
  const [numTurns, setNumTurns] = useState<number>(400); // Turns (N)
  const [solenoidLength, setSolenoidLength] = useState<number>(0.25); // m (L)
  const [coreMaterial, setCoreMaterial] = useState<'air' | 'iron' | 'ferrite'>('air');

  // --- Mode 3: Straight Wire Parameters ---
  const [probeDistance, setProbeDistance] = useState<number>(0.05); // m (r: 0.01 to 0.20 m)

  // --- Mode 4: Force on Wire Parameters ---
  const [externalB, setExternalB] = useState<number>(0.5); // Tesla
  const [wireLength, setWireLength] = useState<number>(0.15); // m (L)
  const [fieldAngleDeg, setFieldAngleDeg] = useState<number>(90); // degrees
  const rodMassKg = 0.05; // 50 grams

  // Rod Physical State for Rail Dynamics
  const [rodOffset, setRodOffset] = useState<number>(0);
  const [rodVelocity, setRodVelocity] = useState<number>(0);
  const rodOffsetRef = useRef<number>(0);
  const rodVelocityRef = useRef<number>(0);

  // Draggable Sensor Probe Coordinates (pixels)
  const [probePos, setProbePos] = useState<{ x: number; y: number }>({ x: 620, y: 140 });
  const [logged, setLogged] = useState<boolean>(false);

  // Interaction Dragging References
  const draggingTargetRef = useRef<'magnet' | 'compass' | 'probe' | 'rod' | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const particlePhaseRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Constants
  const mu0 = 4 * Math.PI * 1e-7; // T*m/A
  const relativePermeability = coreMaterial === 'air' ? 1.0 : coreMaterial === 'ferrite' ? 50.0 : 200.0;

  // Mode Calculations:
  // 1. Solenoid: B = mu_0 * mu_r * (N / L) * I
  const turnsDensity = numTurns / solenoidLength;
  const solenoidB = mu0 * relativePermeability * turnsDensity * currentI;

  // 2. Straight Wire: B = (mu_0 * I) / (2 * pi * r)
  const straightWireB = probeDistance > 0 ? (mu0 * Math.abs(currentI)) / (2 * Math.PI * probeDistance) : 0;

  // 3. Magnetic Force on Wire: F = I * L * B * sin(theta)
  const sinAngle = Math.sin((fieldAngleDeg * Math.PI) / 180);
  const magneticForce = currentI * wireLength * externalB * sinAngle;
  const rodAcceleration = magneticForce / rodMassKg;

  // Magnetic dipole field helper for 2D calculation at (px, py) from bar magnet (mx, my)
  const computeMagnetFieldAt = useCallback(
    (px: number, py: number, mx: number, my: number, polarity: 'NS' | 'SN', strength: number) => {
      // Bar magnet modeled as two magnetic monopoles (poles separated by 2d)
      const halfL = 50; // half length of magnet in pixels
      const poleDir = polarity === 'NS' ? 1 : -1; // NS => N is right (+x), S is left (-x)
      const nPole = { x: mx + poleDir * halfL, y: my };
      const sPole = { x: mx - poleDir * halfL, y: my };

      // Vector from N pole to point P
      const dxN = px - nPole.x;
      const dyN = py - nPole.y;
      const rN = Math.hypot(dxN, dyN);
      const rN3 = Math.max(12, rN) ** 3;

      // Vector from S pole to point P
      const dxS = px - sPole.x;
      const dyS = py - sPole.y;
      const rS = Math.hypot(dxS, dyS);
      const rS3 = Math.max(12, rS) ** 3;

      // Dipole field strength scaling factor
      const qM = strength * 9000;
      const bx_mag = qM * (dxN / rN3 - dxS / rS3);
      const by_mag = qM * (dyN / rN3 - dyS / rS3);

      // Earth's magnetic field (pointing North = negative Y on canvas screen coords)
      const bx_earth = 0;
      const by_earth = includeEarthField ? -earthFieldStrength * 12 : 0;

      const bx_total = bx_mag + bx_earth;
      const by_total = by_mag + by_earth;
      const bTotal_mT = Math.hypot(bx_total, by_total) * 0.1;
      const angleRad = Math.atan2(by_total, bx_total);

      return {
        bx: bx_total,
        by: by_total,
        bTotal_mT,
        angleRad,
        bx_mag,
        by_mag,
      };
    },
    [includeEarthField, earthFieldStrength]
  );

  // Field calculation at Probe and Compass
  const compassField = computeMagnetFieldAt(
    compassPos.x,
    compassPos.y,
    magnetPos.x,
    magnetPos.y,
    magnetPolarity,
    magnetStrength
  );

  const probeMagnetField = computeMagnetFieldAt(
    probePos.x,
    probePos.y,
    magnetPos.x,
    magnetPos.y,
    magnetPolarity,
    magnetStrength
  );

  // Active B field value depending on current mode
  const activeB =
    mode === 'magnet_compass'
      ? probeMagnetField.bTotal_mT / 1000
      : mode === 'solenoid'
      ? solenoidB
      : mode === 'straight_wire'
      ? straightWireB
      : externalB;

  // Reset function
  const handleReset = useCallback(() => {
    setCurrentI(3.0);
    setNumTurns(400);
    setSolenoidLength(0.25);
    setCoreMaterial('air');
    setProbeDistance(0.05);
    setExternalB(0.5);
    setWireLength(0.15);
    setFieldAngleDeg(90);
    setMagnetPos({ x: 340, y: 240 });
    setCompassPos({ x: 550, y: 240 });
    setProbePos({ x: 620, y: 140 });
    setMagnetPolarity('NS');
    setMagnetStrength(1.0);
    rodOffsetRef.current = 0;
    rodVelocityRef.current = 0;
    setRodOffset(0);
    setRodVelocity(0);
  }, []);

  // Main Canvas Rendering & Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (isRunning) {
        particlePhaseRef.current = (particlePhaseRef.current + (currentI >= 0 ? 1 : -1) * dt * 90 + 2000) % 2000;

        // Kinematics for Lorentz Force wire
        if (mode === 'force_wire' && draggingTargetRef.current !== 'rod') {
          const a = magneticForce / rodMassKg;
          const aPixels = a * 160;
          const damping = 1.3;

          let v = rodVelocityRef.current + (aPixels - damping * rodVelocityRef.current) * dt;
          let offset = rodOffsetRef.current + v * dt;

          if (offset > 140) {
            offset = 140;
            v = -0.35 * v;
          } else if (offset < -140) {
            offset = -140;
            v = -0.35 * v;
          }

          if (Math.abs(magneticForce) < 0.0001 && Math.abs(v) < 0.5) {
            v = 0;
          }

          rodVelocityRef.current = v;
          rodOffsetRef.current = offset;
          setRodOffset(offset);
          setRodVelocity(v / 160);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.clearRect(0, 0, width, height);

          // Deep Space / Lab Blueprint Grid Background
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, width, height);

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

          const centerX = width * 0.45;
          const centerY = height * 0.5;

          // ==========================================
          // MODE 1: MAGNET & COMPASS SIMULATION
          // ==========================================
          if (mode === 'magnet_compass') {
            // 1. Earth's Magnetic Field Background Indicator
            if (includeEarthField) {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
              ctx.lineWidth = 1;
              for (let x = 30; x < width - 30; x += 60) {
                ctx.beginPath();
                ctx.moveTo(x, height - 20);
                ctx.lineTo(x, 20);
                ctx.stroke();
                // Arrow pointing Up (North)
                ctx.beginPath();
                ctx.moveTo(x, 25);
                ctx.lineTo(x - 4, 33);
                ctx.lineTo(x + 4, 33);
                ctx.closePath();
                ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                ctx.fill();
              }
              // Earth Field Legend
              ctx.font = 'bold 11px monospace';
              ctx.fillStyle = '#38bdf8';
              ctx.textAlign = 'left';
              ctx.fillText(`🌍 B_earth = ${earthFieldStrength.toFixed(2)} mT (North ↑)`, 24, 28);
            }

            // 2. Magnetic Compass Grid (PhET Style)
            if (showCompassGrid) {
              const gridSpacing = 42;
              for (let gx = 35; gx < width - 20; gx += gridSpacing) {
                for (let gy = 35; gy < height - 20; gy += gridSpacing) {
                  // Skip area right inside magnet
                  if (Math.abs(gx - magnetPos.x) < 55 && Math.abs(gy - magnetPos.y) < 25) {
                    continue;
                  }
                  const fAtGrid = computeMagnetFieldAt(gx, gy, magnetPos.x, magnetPos.y, magnetPolarity, magnetStrength);
                  const needleLen = 12;

                  ctx.save();
                  ctx.translate(gx, gy);
                  ctx.rotate(fAtGrid.angleRad);

                  // North tip (Red)
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.lineTo(needleLen, 0);
                  ctx.lineTo(needleLen - 4, -2.5);
                  ctx.lineTo(needleLen - 4, 2.5);
                  ctx.closePath();
                  ctx.fillStyle = '#ef4444';
                  ctx.fill();

                  // South tip (Blue/White)
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.lineTo(-needleLen, 0);
                  ctx.lineTo(-needleLen + 4, -2.5);
                  ctx.lineTo(-needleLen + 4, 2.5);
                  ctx.closePath();
                  ctx.fillStyle = '#60a5fa';
                  ctx.fill();

                  // Pivot pin
                  ctx.beginPath();
                  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
                  ctx.fillStyle = '#ffffff';
                  ctx.fill();

                  ctx.restore();
                }
              }
            }

            // 3. Magnetic Field Streamlines
            if (showFieldLines) {
              const numLines = 6;
              const poleDir = magnetPolarity === 'NS' ? 1 : -1;
              const nX = magnetPos.x + poleDir * 45;
              const sX = magnetPos.x - poleDir * 45;

              ctx.lineWidth = 1.2;
              for (let i = 1; i <= numLines; i++) {
                const rx = 55 + i * 28;
                const ry = 30 + i * 22;
                ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0.12, 0.45 - i * 0.05)})`;

                // Top loop
                ctx.beginPath();
                ctx.ellipse(magnetPos.x, magnetPos.y - ry * 0.5, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();

                // Bottom loop
                ctx.beginPath();
                ctx.ellipse(magnetPos.x, magnetPos.y + ry * 0.5, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
              }
            }

            // 4. Draggable Permanent Bar Magnet
            const mx = magnetPos.x;
            const my = magnetPos.y;
            const magW = 110;
            const magH = 36;
            const isNS = magnetPolarity === 'NS';

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 12;

            // Left half of magnet
            ctx.fillStyle = isNS ? '#2563eb' : '#dc2626';
            ctx.beginPath();
            ctx.roundRect(mx - magW / 2, my - magH / 2, magW / 2, magH, [6, 0, 0, 6]);
            ctx.fill();

            // Right half of magnet
            ctx.fillStyle = isNS ? '#dc2626' : '#2563eb';
            ctx.beginPath();
            ctx.roundRect(mx, my - magH / 2, magW / 2, magH, [0, 6, 6, 0]);
            ctx.fill();

            // Divider and border
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.strokeRect(mx - magW / 2, my - magH / 2, magW, magH);

            ctx.restore();

            // Pole Letters
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(isNS ? 'S' : 'N', mx - magW / 4, my);
            ctx.fillText(isNS ? 'N' : 'S', mx + magW / 4, my);

            // Drag indicator handle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '10px sans-serif';
            ctx.fillText('✋ ' + (lang === 'ar' ? 'اسحب المغناطيس' : 'Drag Magnet'), mx, my + magH / 2 + 14);

            // 5. Draggable Main Precision Compass
            const cx = compassPos.x;
            const cy = compassPos.y;
            const compassRadius = 38;

            ctx.save();
            ctx.shadowColor = 'rgba(14, 165, 233, 0.4)';
            ctx.shadowBlur = 16;

            // Compass Dial Outer Ring
            ctx.beginPath();
            ctx.arc(cx, cy, compassRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Degree marks
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

            // Cardinal Letters on Dial (N, E, S, W)
            ctx.font = 'bold 9px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('N', cx, cy - compassRadius + 10);
            ctx.fillText('S', cx, cy + compassRadius - 10);
            ctx.fillText('E', cx + compassRadius - 10, cy);
            ctx.fillText('W', cx - compassRadius + 10, cy);

            // Rotating Needle
            const compassAngle = compassField.angleRad;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(compassAngle);

            // North Needle (Red diamond)
            ctx.beginPath();
            ctx.moveTo(compassRadius - 6, 0);
            ctx.lineTo(0, -6);
            ctx.lineTo(0, 6);
            ctx.closePath();
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            // South Needle (White/Blue diamond)
            ctx.beginPath();
            ctx.moveTo(-compassRadius + 6, 0);
            ctx.lineTo(0, -6);
            ctx.lineTo(0, 6);
            ctx.closePath();
            ctx.fillStyle = '#f8fafc';
            ctx.fill();

            // Center Brass Pivot
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
            ctx.restore();

            // Compass Deflection Angle Badge
            const deflectionDeg = ((-compassAngle * 180) / Math.PI + 360) % 360;
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'center';
            ctx.fillText(`θ = ${deflectionDeg.toFixed(1)}°`, cx, cy + compassRadius + 16);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('🧭 ' + (lang === 'ar' ? 'اسحب البوصلة' : 'Drag Compass'), cx, cy + compassRadius + 29);
          }

          // ==========================================
          // MODE 2: SOLENOID SIMULATION
          // ==========================================
          else if (mode === 'solenoid') {
            const solLenPix = Math.min(420, solenoidLength * 1200);
            const solHPix = 110;
            const startX = centerX - solLenPix / 2;
            const endX = centerX + solLenPix / 2;

            // Magnetic Core
            if (coreMaterial !== 'air') {
              ctx.fillStyle = coreMaterial === 'iron' ? '#334155' : '#1e293b';
              ctx.fillRect(startX - 15, centerY - solHPix / 2 + 10, solLenPix + 30, solHPix - 20);
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(startX - 15, centerY - solHPix / 2 + 10, solLenPix + 30, solHPix - 20);

              ctx.fillStyle = '#cbd5e1';
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(
                coreMaterial === 'iron'
                  ? tI18n('experiments.magnetic_field.softIronCoreCanvas') || 'SOFT IRON CORE (μr=200)'
                  : tI18n('experiments.magnetic_field.ferriteCoreCanvas') || 'FERRITE CORE (μr=50)',
                centerX,
                centerY + 4
              );
            }

            // Magnetic Field Lines through Solenoid
            if (currentI !== 0) {
              const numLines = 7;
              const dir = currentI > 0 ? 1 : -1;
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
              ctx.lineWidth = 1.5;

              for (let i = 0; i < numLines; i++) {
                const yOff = (i - (numLines - 1) / 2) * 15;
                ctx.beginPath();
                ctx.moveTo(startX - 85, centerY + yOff);
                ctx.lineTo(endX + 85, centerY + yOff);
                ctx.stroke();

                const phaseOffset = (particlePhaseRef.current * 0.8) % 60;
                const arrowX = startX + 40 + phaseOffset + i * 25;
                if (arrowX > startX - 60 && arrowX < endX + 60) {
                  ctx.beginPath();
                  ctx.moveTo(arrowX, centerY + yOff);
                  ctx.lineTo(arrowX - dir * 8, centerY + yOff - 4);
                  ctx.lineTo(arrowX - dir * 8, centerY + yOff + 4);
                  ctx.closePath();
                  ctx.fillStyle = '#38bdf8';
                  ctx.fill();
                }
              }

              // Exterior looping lines
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
              ctx.beginPath();
              ctx.ellipse(centerX, centerY - 75, solLenPix * 0.65, 55, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.beginPath();
              ctx.ellipse(centerX, centerY + 75, solLenPix * 0.65, 55, 0, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Solenoid Coils
            const turnsToDraw = 18;
            const turnSpacing = solLenPix / turnsToDraw;
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 4;

            for (let i = 0; i <= turnsToDraw; i++) {
              const tx = startX + i * turnSpacing;
              ctx.beginPath();
              ctx.ellipse(tx, centerY, 8, solHPix / 2, 0, 0, Math.PI * 2);
              ctx.stroke();

              if (isRunning && currentI !== 0) {
                const dotAngle = (particlePhaseRef.current * 0.05 + i * 0.4) % (Math.PI * 2);
                const dx = tx + Math.cos(dotAngle) * 8;
                const dy = centerY + Math.sin(dotAngle) * (solHPix / 2);
                ctx.beginPath();
                ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#fef08a';
                ctx.fill();
              }
            }

            // North & South Pole Indicators
            if (currentI !== 0) {
              const northAtRight = currentI > 0;
              ctx.font = 'bold 18px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = northAtRight ? '#3b82f6' : '#ef4444';
              ctx.fillText(northAtRight ? 'S' : 'N', startX - 45, centerY + 6);
              ctx.fillStyle = northAtRight ? '#ef4444' : '#3b82f6';
              ctx.fillText(northAtRight ? 'N' : 'S', endX + 45, centerY + 6);
            }
          }

          // ==========================================
          // MODE 3: STRAIGHT WIRE SIMULATION
          // ==========================================
          else if (mode === 'straight_wire') {
            // Central Copper Conductor
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(centerX - 9, 30, 18, height - 60);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.strokeRect(centerX - 9, 30, 18, height - 60);

            // Flowing electrons along wire
            if (isRunning && currentI !== 0) {
              const dir = currentI >= 0 ? -1 : 1;
              ctx.fillStyle = '#fef08a';
              for (let i = 0; i < 9; i++) {
                const py = 40 + ((particlePhaseRef.current * 1.2 * dir + i * 45 + 2000) % (height - 80));
                ctx.beginPath();
                ctx.arc(centerX, py, 3.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Current Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`I = ${currentI.toFixed(1)} A`, centerX, centerY + 5);

            // Concentric Circular Magnetic Field Lines
            const radii = [50, 95, 140, 190];
            radii.forEach((r, idx) => {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
              ctx.stroke();

              const dir = currentI >= 0 ? -1 : 1;
              const angle = ((particlePhaseRef.current * 0.02 * dir + (idx * Math.PI) / 2) % (Math.PI * 2));
              const ax = centerX + r * Math.cos(angle);
              const ay = centerY + r * Math.sin(angle);
              const tanAngle = angle + (currentI >= 0 ? -Math.PI / 2 : Math.PI / 2);

              ctx.beginPath();
              ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
              ctx.fillStyle = '#38bdf8';
              ctx.fill();

              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(ax + 12 * Math.cos(tanAngle), ay + 12 * Math.sin(tanAngle));
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2.5;
              ctx.stroke();
            });
          }

          // ==========================================
          // MODE 4: LORENTZ FORCE WIRE (RAIL GUN)
          // ==========================================
          else {
            const railStartX = centerX - 160;
            const railEndX = centerX + 160;
            const railY1 = centerY - 65;
            const railY2 = centerY + 65;

            // DC Power Supply (Left)
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(railStartX - 65, centerY - 50, 50, 100);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(railStartX - 65, centerY - 50, 50, 100);

            // DC Terminals
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(railStartX - 25, railY1, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(railStartX - 25, railY2, 6, 0, Math.PI * 2);
            ctx.fill();

            // Terminal labels
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(currentI >= 0 ? '+' : '-', railStartX - 25, railY1 - 9);
            ctx.fillText(currentI >= 0 ? '-' : '+', railStartX - 25, railY2 + 18);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('DC', railStartX - 42, centerY + 4);

            // Rails
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(railStartX, railY1);
            ctx.lineTo(railEndX, railY1);
            ctx.moveTo(railStartX, railY2);
            ctx.lineTo(railEndX, railY2);
            ctx.stroke();

            // External Magnetic Field (⊗ into page)
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.font = '16px monospace';
            for (let x = railStartX + 20; x < railEndX; x += 40) {
              for (let y = railY1 + 25; y < railY2; y += 25) {
                ctx.fillText('⊗', x, y);
              }
            }

            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'left';
            ctx.fillText(
              `B_ext = ${externalB.toFixed(2)} T  (⊗ ${lang === 'ar' ? 'داخل الصفحة' : 'Into Page'})`,
              railStartX,
              railY1 - 25
            );

            // Movable Conducting Rod
            const rodX = centerX + rodOffsetRef.current;
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(rodX - 8, railY1 - 14, 16, railY2 - railY1 + 28);
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.strokeRect(rodX - 8, railY1 - 14, 16, railY2 - railY1 + 28);

            // Lorentz Force Vector on Rod (Red Arrow)
            if (Math.abs(magneticForce) > 0.001) {
              const fDir = magneticForce > 0 ? 1 : -1;
              const fLen = Math.min(110, Math.max(20, Math.abs(magneticForce) * 100));
              const fEndX = rodX + fDir * fLen;

              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(rodX, centerY);
              ctx.lineTo(fEndX, centerY);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(fEndX + fDir * 8, centerY);
              ctx.lineTo(fEndX, centerY - 6);
              ctx.lineTo(fEndX, centerY + 6);
              ctx.closePath();
              ctx.fillStyle = '#ef4444';
              ctx.fill();

              ctx.fillStyle = '#f87171';
              ctx.font = 'bold 12px monospace';
              ctx.textAlign = fDir > 0 ? 'left' : 'right';
              ctx.fillText(`F = ${magneticForce.toFixed(3)} N`, fEndX + fDir * 12, centerY - 8);
              ctx.font = '10px monospace';
              ctx.fillText(`a = ${rodAcceleration.toFixed(2)} m/s²`, fEndX + fDir * 12, centerY + 10);
            }
          }

          // ==========================================
          // GAUSSMETER SENSOR PROBE (Available everywhere)
          // ==========================================
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

          // Probe live readout badge
          const displayB_mT = activeB * 1000;
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`B = ${displayB_mT.toFixed(2)} mT`, px + 18, py - 3);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText(`${(displayB_mT * 10).toFixed(1)} Gauss`, px + 18, py + 11);
          ctx.restore();

          // Live Simulation Status
          ctx.textAlign = 'right';
          ctx.font = 'bold 11px sans-serif';
          if (isRunning) {
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(width - 110, 24, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(tI18n('experiments.magnetic_field.running') || 'Running', width - 20, 28);
          } else {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(width - 110, 24, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(tI18n('experiments.magnetic_field.paused') || 'Paused', width - 20, 28);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    mode,
    magnetPos,
    magnetPolarity,
    magnetStrength,
    compassPos,
    showCompassGrid,
    showFieldLines,
    includeEarthField,
    earthFieldStrength,
    currentI,
    numTurns,
    solenoidLength,
    coreMaterial,
    probeDistance,
    externalB,
    wireLength,
    fieldAngleDeg,
    probePos,
    solenoidB,
    straightWireB,
    magneticForce,
    rodAcceleration,
    lang,
    tI18n,
    computeMagnetFieldAt,
    activeB,
    compassField,
  ]);

  // Pointer Interaction Handlers for Desktop & Mobile
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

    // 1. Check Magnet drag
    if (mode === 'magnet_compass' && Math.hypot(coords.x - magnetPos.x, coords.y - magnetPos.y) < 60) {
      draggingTargetRef.current = 'magnet';
      dragOffsetRef.current = { x: coords.x - magnetPos.x, y: coords.y - magnetPos.y };
      return;
    }

    // 2. Check Compass drag
    if (mode === 'magnet_compass' && Math.hypot(coords.x - compassPos.x, coords.y - compassPos.y) < 45) {
      draggingTargetRef.current = 'compass';
      dragOffsetRef.current = { x: coords.x - compassPos.x, y: coords.y - compassPos.y };
      return;
    }

    // 3. Check Probe drag
    if (Math.hypot(coords.x - probePos.x, coords.y - probePos.y) < 32) {
      draggingTargetRef.current = 'probe';
      dragOffsetRef.current = { x: coords.x - probePos.x, y: coords.y - probePos.y };
      return;
    }

    // 4. Check Rod drag in force_wire mode
    if (mode === 'force_wire') {
      const centerX = (canvas?.width || 840) * 0.45;
      const centerY = (canvas?.height || 480) * 0.5;
      const rodScreenX = centerX + rodOffsetRef.current;
      if (Math.abs(coords.x - rodScreenX) < 25 && Math.abs(coords.y - centerY) < 80) {
        draggingTargetRef.current = 'rod';
        rodVelocityRef.current = 0;
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingTargetRef.current) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (draggingTargetRef.current === 'magnet') {
      const newX = Math.max(70, Math.min(canvas.width - 70, coords.x - dragOffsetRef.current.x));
      const newY = Math.max(50, Math.min(canvas.height - 50, coords.y - dragOffsetRef.current.y));
      setMagnetPos({ x: newX, y: newY });
    } else if (draggingTargetRef.current === 'compass') {
      const newX = Math.max(50, Math.min(canvas.width - 50, coords.x - dragOffsetRef.current.x));
      const newY = Math.max(50, Math.min(canvas.height - 50, coords.y - dragOffsetRef.current.y));
      setCompassPos({ x: newX, y: newY });
    } else if (draggingTargetRef.current === 'probe') {
      const newX = Math.max(25, Math.min(canvas.width - 25, coords.x - dragOffsetRef.current.x));
      const newY = Math.max(25, Math.min(canvas.height - 25, coords.y - dragOffsetRef.current.y));
      setProbePos({ x: newX, y: newY });

      if (mode === 'straight_wire') {
        const centerX = canvas.width * 0.45;
        const distMeters = Math.max(0.01, Math.abs(newX - centerX) / 800);
        setProbeDistance(Math.min(0.25, distMeters));
      }
    } else if (draggingTargetRef.current === 'rod') {
      const centerX = canvas.width * 0.45;
      const newOffset = Math.max(-140, Math.min(140, coords.x - centerX));
      rodOffsetRef.current = newOffset;
      setRodOffset(newOffset);
      rodVelocityRef.current = 0;
      setRodVelocity(0);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingTargetRef.current = null;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'magnetic_field',
      parameters: {
        mode: mode,
        magnetStrength: mode === 'magnet_compass' ? `${magnetStrength.toFixed(1)} T` : 'N/A',
        polarity: mode === 'magnet_compass' ? magnetPolarity : 'N/A',
        earthField: mode === 'magnet_compass' ? `${earthFieldStrength.toFixed(2)} mT` : 'N/A',
        current: mode !== 'magnet_compass' ? `${currentI.toFixed(2)} A` : 'N/A',
        turns: mode === 'solenoid' ? `${numTurns}` : 'N/A',
        coreMaterial: mode === 'solenoid' ? coreMaterial : 'N/A',
        magneticForce: mode === 'force_wire' ? `${magneticForce.toFixed(3)} N` : 'N/A',
      },
      variableName:
        mode === 'force_wire'
          ? tI18n('experiments.magnetic_field.variableForce') || 'Magnetic Force (F)'
          : tI18n('experiments.magnetic_field.variableFlux') || 'Magnetic Field Density (B)',
      measuredValue: Number(mode === 'force_wire' ? magneticForce.toFixed(4) : (activeB * 1000).toFixed(3)),
      theoreticalValue: Number(mode === 'force_wire' ? magneticForce.toFixed(4) : (activeB * 1000).toFixed(3)),
      unit: mode === 'force_wire' ? 'N' : 'mT',
      equation:
        mode === 'magnet_compass'
          ? 'tan(θ) = B_ext / B_earth'
          : mode === 'solenoid'
          ? 'B = μ₀ · μᵣ · n · I'
          : mode === 'straight_wire'
          ? 'B = (μ₀ · I) / (2πr)'
          : 'F = I · L · B · sinθ',
      notes: `Mode: ${mode}, Measured B=${(activeB * 1000).toFixed(2)} mT`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="magnetic-field-simulation" className="space-y-6">
      {/* Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setMode('magnet_compass')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              mode === 'magnet_compass'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <CompassIcon className="w-4 h-4 text-sky-300" />
            <span>{lang === 'ar' ? 'المغناطيس والبوصلة' : 'Magnet & Compass'}</span>
          </button>

          <button
            onClick={() => setMode('solenoid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              mode === 'solenoid'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>{tI18n('experiments.magnetic_field.solenoid') || 'Solenoid'}</span>
          </button>

          <button
            onClick={() => setMode('straight_wire')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              mode === 'straight_wire'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-300" />
            <span>{tI18n('experiments.magnetic_field.straightWire') || 'Straight Wire'}</span>
          </button>

          <button
            onClick={() => setMode('force_wire')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              mode === 'force_wire'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Activity className="w-4 h-4 text-rose-300" />
            <span>{tI18n('experiments.magnetic_field.lorentzForce') || 'Lorentz Rail'}</span>
          </button>
        </div>

        {/* Global Action Buttons: Play/Pause, Reset, Log */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning((prev) => !prev)}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all shadow-sm ${
              isRunning
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">
              {isRunning ? tI18n('experiments.magnetic_field.pause') || 'Pause' : tI18n('experiments.magnetic_field.play') || 'Run'}
            </span>
          </button>

          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title={tI18n('experiments.magnetic_field.reset') || 'Reset'}
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
            <span className="whitespace-nowrap">{logged ? tI18n('experiments.magnetic_field.loggedSuccess') || 'Logged ✓' : tI18n('experiments.magnetic_field.logBtn') || 'Log Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Stage & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Interactive Visual Canvas Area (Cols: 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
            {/* Top Toolbar overlay inside canvas */}
            <div className="w-full flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80 px-2">
              <div className="flex items-center gap-2">
                <Magnet className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">
                  {mode === 'magnet_compass'
                    ? lang === 'ar'
                      ? 'محاكاة تراكب المجال والمغناطيس والبوصلة'
                      : 'Magnet & Compass Superposition Simulation'
                    : mode === 'solenoid'
                    ? lang === 'ar'
                      ? 'محاكاة المجال المغناطيسي للملف اللولبي'
                      : 'Solenoid Magnetic Field Simulation'
                    : mode === 'straight_wire'
                    ? lang === 'ar'
                      ? 'محاكاة المجال المغناطيسي لسلك مستقيم'
                      : 'Straight Wire Magnetic Field'
                    : lang === 'ar'
                    ? 'محاكاة قوة لورنتز وسكة لابلاس'
                    : 'Lorentz Force Rail Gun'}
                </span>
              </div>
              <span className="text-xs font-mono text-indigo-300">
                {mode === 'magnet_compass'
                  ? 'tan(θ) = B_ext / B_earth'
                  : mode === 'solenoid'
                  ? 'B = μ₀ μᵣ n I'
                  : mode === 'straight_wire'
                  ? 'B = (μ₀ I)/(2πr)'
                  : 'F = I L B sin(θ)'}
              </span>
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
              <span>💡 {mode === 'magnet_compass' ? (lang === 'ar' ? 'اسحب المغناطيس أو البوصلة أو مجس القياس في أي مكان بالكانفا' : 'Drag the magnet, compass, or sensor probe anywhere on the canvas') : (lang === 'ar' ? 'اسحب مجس القياس أو القضيب المعدني بحرية' : 'Drag the sensor probe or conducting rod freely')}</span>
            </div>
          </div>

          {/* Quick Metrics Bar below Canvas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">{tI18n('experiments.magnetic_field.fluxDensityLabel') || 'Flux Density (B)'}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {(activeB * 1000).toFixed(2)} <span className="text-xs text-slate-400">mT</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">{tI18n('experiments.magnetic_field.gaussLabel') || 'Field in Gauss'}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {(activeB * 10000).toFixed(1)} <span className="text-xs text-slate-400">G</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">
                {mode === 'magnet_compass'
                  ? lang === 'ar'
                    ? 'زاوية انحراف البوصلة θ'
                    : 'Compass Deflection θ'
                  : mode === 'force_wire'
                  ? tI18n('experiments.magnetic_field.rodAcceleration') || 'Acceleration'
                  : mode === 'solenoid'
                  ? tI18n('experiments.magnetic_field.numTurnsLabel') || 'Turns (N)'
                  : lang === 'ar'
                  ? 'المسافة r'
                  : 'Distance (r)'}
              </div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {mode === 'magnet_compass' ? (
                  `${(((-compassField.angleRad * 180) / Math.PI + 360) % 360).toFixed(1)}°`
                ) : mode === 'force_wire' ? (
                  `${rodAcceleration.toFixed(2)} m/s²`
                ) : mode === 'solenoid' ? (
                  `${numTurns} (${turnsDensity.toFixed(0)}/m)`
                ) : (
                  `${(probeDistance * 100).toFixed(1)} cm`
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">
                {mode === 'force_wire'
                  ? tI18n('experiments.magnetic_field.magneticForceLabel') || 'Lorentz Force'
                  : mode === 'magnet_compass'
                  ? lang === 'ar'
                    ? 'شدة المغناطيس'
                    : 'Magnet Strength'
                  : tI18n('experiments.magnetic_field.currentLabel') || 'Current (I)'}
              </div>
              <div className="text-base font-bold font-mono text-rose-400">
                {mode === 'force_wire'
                  ? `${magneticForce.toFixed(3)} N`
                  : mode === 'magnet_compass'
                  ? `${magnetStrength.toFixed(1)} T`
                  : `${currentI.toFixed(2)} A`}
              </div>
            </div>
          </div>
        </div>

        {/* Controls & Parameters Sidebar (Cols: 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Controls Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>{tI18n('experiments.magnetic_field.systemModeTitle') || 'Simulation Controls'}</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                Mode: {mode}
              </span>
            </div>

            {/* Mode 1 Controls: Magnet & Compass */}
            {mode === 'magnet_compass' && (
              <div className="space-y-4">
                {/* Polarity Flip */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">{lang === 'ar' ? 'قطبية المغناطيس:' : 'Magnet Polarity:'}</span>
                  <button
                    onClick={() => setMagnetPolarity((prev) => (prev === 'NS' ? 'SN' : 'NS'))}
                    className="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{magnetPolarity === 'NS' ? 'N ── S' : 'S ── N'}</span>
                  </button>
                </div>

                {/* Magnet Strength */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{lang === 'ar' ? 'قوة المغناطيس (B₀):' : 'Magnet Strength (B₀):'}</span>
                    <span className="font-mono text-amber-400 font-bold">{magnetStrength.toFixed(1)} T</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={magnetStrength}
                    onChange={(e) => setMagnetStrength(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Earth's Magnetic Field */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>{lang === 'ar' ? 'مجال الأرض (B_earth):' : 'Earth Magnetic Field:'}</span>
                    </span>
                    <button
                      onClick={() => setIncludeEarthField(!includeEarthField)}
                      className={`min-h-[44px] min-w-[44px] px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        includeEarthField
                          ? 'bg-sky-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {includeEarthField ? (lang === 'ar' ? 'مفعل' : 'Active') : (lang === 'ar' ? 'معطل' : 'Off')}
                    </button>
                  </div>

                  {includeEarthField && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{lang === 'ar' ? 'شدة مجال الأرض:' : 'Earth Field B:'}</span>
                        <span className="font-mono text-sky-400 font-bold">{earthFieldStrength.toFixed(2)} mT</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.15"
                        step="0.01"
                        value={earthFieldStrength}
                        onChange={(e) => setEarthFieldStrength(parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  )}
                </div>

                {/* View Toggles: Compass Grid & Field Lines */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">{lang === 'ar' ? 'شبكة بوصلات مصغرة:' : 'Compass Grid:'}</span>
                    <button
                      onClick={() => setShowCompassGrid(!showCompassGrid)}
                      className={`min-h-[44px] min-w-[44px] px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        showCompassGrid
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {showCompassGrid ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">{lang === 'ar' ? 'خطوط الفيض المغناطيسي:' : 'Field Lines:'}</span>
                    <button
                      onClick={() => setShowFieldLines(!showFieldLines)}
                      className={`min-h-[44px] min-w-[44px] px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        showFieldLines
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {showFieldLines ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2 Controls: Solenoid */}
            {mode === 'solenoid' && (
              <div className="space-y-3.5">
                {/* Current Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{tI18n('experiments.magnetic_field.currentLabel') || 'Current (I):'}</span>
                    <span className="font-mono text-amber-400 font-bold">{currentI.toFixed(1)} A</span>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={currentI}
                    onChange={(e) => setCurrentI(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Turns Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{tI18n('experiments.magnetic_field.numTurnsLabel') || 'Turns (N):'}</span>
                    <span className="font-mono text-indigo-400 font-bold">{numTurns}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={numTurns}
                    onChange={(e) => setNumTurns(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Core Material */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs text-slate-300">{tI18n('experiments.magnetic_field.coreMaterialLabel') || 'Core Material:'}</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['air', 'ferrite', 'iron'] as const).map((mat) => (
                      <button
                        key={mat}
                        onClick={() => setCoreMaterial(mat)}
                        className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          coreMaterial === mat
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {mat === 'air'
                          ? tI18n('experiments.magnetic_field.air') || 'Air'
                          : mat === 'ferrite'
                          ? tI18n('experiments.magnetic_field.ferrite') || 'Ferrite'
                          : tI18n('experiments.magnetic_field.softIron') || 'Iron'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3 Controls: Straight Wire */}
            {mode === 'straight_wire' && (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{tI18n('experiments.magnetic_field.currentLabel') || 'Current (I):'}</span>
                    <span className="font-mono text-amber-400 font-bold">{currentI.toFixed(1)} A</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={currentI}
                    onChange={(e) => setCurrentI(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{lang === 'ar' ? 'المسافة عن السلك (r):' : 'Probe Distance (r):'}</span>
                    <span className="font-mono text-emerald-400 font-bold">{(probeDistance * 100).toFixed(1)} cm</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.20"
                    step="0.01"
                    value={probeDistance}
                    onChange={(e) => setProbeDistance(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Mode 4 Controls: Lorentz Force Rail */}
            {mode === 'force_wire' && (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{tI18n('experiments.magnetic_field.currentLabel') || 'Current (I):'}</span>
                    <span className="font-mono text-amber-400 font-bold">{currentI.toFixed(1)} A</span>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={currentI}
                    onChange={(e) => setCurrentI(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{tI18n('experiments.magnetic_field.externalBLabel') || 'External Field (B):'}</span>
                    <span className="font-mono text-sky-400 font-bold">{externalB.toFixed(2)} T</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.1"
                    value={externalB}
                    onChange={(e) => setExternalB(parseFloat(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{tI18n('experiments.magnetic_field.wireAngleLabel') || 'Field Angle (θ):'}</span>
                    <span className="font-mono text-purple-400 font-bold">{fieldAngleDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="5"
                    value={fieldAngleDeg}
                    onChange={(e) => setFieldAngleDeg(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scientific Equations Reference Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ar' ? 'القوانين الفيزيائية المطبقة' : 'Physics Laws Applied'}</span>
            </h4>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-indigo-300 space-y-1.5">
              {mode === 'magnet_compass' ? (
                <>
                  <div className="font-bold text-amber-300">tan(θ) = B_ext / B_earth</div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar'
                      ? 'تنحرف إبرة البوصلة باتجاه محصلة متجه المجالين المغناطيسيين: الخارجي والأرضي.'
                      : 'Compass needle aligns with the vector sum of external magnetic field and Earth geomagnetic field.'}
                  </div>
                </>
              ) : mode === 'solenoid' ? (
                <>
                  <div className="font-bold text-amber-300">B = μ₀ · μᵣ · (N / L) · I</div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar'
                      ? 'مجال الملف اللولبي المنتظم داخلياً، يتضاعف مئات المرات بوجود قلب الحديد المطاوع.'
                      : 'Uniform internal solenoid flux density amplified by ferromagnetic relative permeability.'}
                  </div>
                </>
              ) : mode === 'straight_wire' ? (
                <>
                  <div className="font-bold text-amber-300">B = (μ₀ · I) / (2π · r)</div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar'
                      ? 'قانون أمبير وبيو-سافار: خطوط المجال المغناطيسي دوائر متحدة المركز حول السلك.'
                      : 'Ampere law: concentric circular magnetic field lines around straight conductor.'}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-amber-300">F = I · L · B · sin(θ)</div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar'
                      ? 'قوة لورنتز الكهرومغناطيسية المؤثرة على موصل يحمل تياراً داخل مجال مغناطيسي.'
                      : 'Lorentz electromagnetic force on current-carrying conductor in external B field.'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
