import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Plus, 
  Minus, 
  BookmarkCheck, 
  Eye, 
  Zap, 
  Trash2, 
  Grid, 
  Layers, 
  Compass, 
  Activity,
  Play,
  Share2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface ChargesFieldsSimProps {
  lang: Language;
  onLogMeasurement?: (record: any) => void;
}

interface Charge {
  id: number;
  x: number;
  y: number;
  q: number; // in nC (+1, -1, +2, -2, etc.)
}

interface EquipotentialContour {
  voltage: number;
  points: { x: number; y: number }[];
  color: string;
}

interface TestParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  q: number; // test charge sign
  trail: { x: number; y: number }[];
}

export const ChargesFieldsSim: React.FC<ChargesFieldsSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // Charges State
  const [charges, setCharges] = useState<Charge[]>([
    { id: 1, x: 220, y: 160, q: 1 },
    { id: 2, x: 380, y: 160, q: -1 },
  ]);

  // Sensor Position & Dragging State
  const [sensorPos, setSensorPos] = useState<{ x: number; y: number }>({ x: 300, y: 90 });
  const [draggingChargeId, setDraggingChargeId] = useState<number | null>(null);
  const [isDraggingSensor, setIsDraggingSensor] = useState<boolean>(false);

  // Visualization Options
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showEquipotentials, setShowEquipotentials] = useState<boolean>(true);
  const [equipotentialLines, setEquipotentialLines] = useState<EquipotentialContour[]>([]);

  // Test Particle Animation
  const [testParticle, setTestParticle] = useState<TestParticle | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Logging Feedback
  const [logged, setLogged] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Scaled Coulomb Physics Constants
  // In our simulation grid: 100 pixels = 1.0 meter
  // k_scaled = 9000 (V·px / nC)
  const K_SCALED = 9000;

  // Calculate Electric Field Vector E = (Ex, Ey) and Scalar Potential V at coordinate (px, py)
  const calcFieldAndPotential = useCallback((px: number, py: number, currentCharges: Charge[] = charges) => {
    let Ex = 0;
    let Ey = 0;
    let V = 0;

    currentCharges.forEach((c) => {
      const dx = px - c.x;
      const dy = py - c.y;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      
      // Cutoff softening for numerical stability near charge core (radius = 12px)
      const softened_r = Math.max(r, 14);
      const softened_r2 = softened_r * softened_r;

      // E = (k * q / r^2) * (r_hat)
      const E_mag = (K_SCALED * c.q) / softened_r2;
      Ex += E_mag * (dx / softened_r);
      Ey += E_mag * (dy / softened_r);

      // V = k * q / r
      V += (K_SCALED * c.q) / softened_r;
    });

    const E_total = Math.sqrt(Ex * Ex + Ey * Ey);
    const angleRad = Math.atan2(Ey, Ex);
    const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

    return { Ex, Ey, E_total, V, angleDeg };
  }, [charges]);

  // Current live sensor telemetry reading
  const sensorReading = calcFieldAndPotential(sensorPos.x, sensorPos.y);

  // Total Net Charge in System
  const netCharge = charges.reduce((acc, c) => acc + c.q, 0);

  // Reset Simulation to standard Dipole
  const resetSimulation = () => {
    setCharges([
      { id: 1, x: 220, y: 160, q: 1 },
      { id: 2, x: 380, y: 160, q: -1 },
    ]);
    setShowVectors(true);
    setShowGrid(true);
    setSensorPos({ x: 300, y: 90 });
    setEquipotentialLines([]);
    setTestParticle(null);
  };

  // Clear all charges
  const clearAllCharges = () => {
    setCharges([]);
    setEquipotentialLines([]);
    setTestParticle(null);
  };

  // Preset Configurations
  const applyPreset = (presetKey: 'dipole' | 'likeCharges' | 'quadrupole' | 'singlePos' | 'parallel') => {
    setEquipotentialLines([]);
    setTestParticle(null);

    switch (presetKey) {
      case 'dipole':
        setCharges([
          { id: 1, x: 220, y: 160, q: 1 },
          { id: 2, x: 380, y: 160, q: -1 },
        ]);
        setSensorPos({ x: 300, y: 90 });
        break;

      case 'likeCharges':
        setCharges([
          { id: 1, x: 220, y: 160, q: 1 },
          { id: 2, x: 380, y: 160, q: 1 },
        ]);
        setSensorPos({ x: 300, y: 160 });
        break;

      case 'quadrupole':
        setCharges([
          { id: 1, x: 230, y: 100, q: 1 },
          { id: 2, x: 370, y: 100, q: -1 },
          { id: 3, x: 230, y: 220, q: -1 },
          { id: 4, x: 370, y: 220, q: 1 },
        ]);
        setSensorPos({ x: 300, y: 160 });
        break;

      case 'singlePos':
        setCharges([
          { id: 1, x: 300, y: 160, q: 1 },
        ]);
        setSensorPos({ x: 380, y: 160 });
        break;

      case 'parallel':
        setCharges([
          { id: 1, x: 180, y: 90, q: 1 },
          { id: 2, x: 260, y: 90, q: 1 },
          { id: 3, x: 340, y: 90, q: 1 },
          { id: 4, x: 420, y: 90, q: 1 },
          { id: 5, x: 180, y: 230, q: -1 },
          { id: 6, x: 260, y: 230, q: -1 },
          { id: 7, x: 340, y: 230, q: -1 },
          { id: 8, x: 420, y: 230, q: -1 },
        ]);
        setSensorPos({ x: 300, y: 160 });
        break;
    }
  };

  // Add Charge Helper
  const addCharge = (q: number) => {
    if (charges.length >= 12) return;
    const newCharge: Charge = {
      id: Date.now() + Math.random(),
      x: 140 + Math.random() * 320,
      y: 90 + Math.random() * 140,
      q,
    };
    setCharges((prev) => [...prev, newCharge]);
  };

  // Delete Individual Charge
  const deleteCharge = (id: number) => {
    setCharges((prev) => prev.filter(c => c.id !== id));
  };

  // Trace Equipotential Contour Loop passing through current sensor coordinate
  const traceEquipotentialAtSensor = () => {
    if (charges.length === 0) return;
    const targetV = sensorReading.V;
    const points: { x: number; y: number }[] = [];

    // Ray tracing / Contour marching around the sensor point in angular steps
    const numRays = 72;
    for (let i = 0; i < numRays; i++) {
      const angle = (i * 2 * Math.PI) / numRays;
      let rMin = 2;
      let rMax = 320;
      let bestX = sensorPos.x;
      let bestY = sensorPos.y;

      // Binary search along ray from closest charge center or sensor center
      const centerCharge = charges[0];
      const originX = centerCharge ? centerCharge.x : sensorPos.x;
      const originY = centerCharge ? centerCharge.y : sensorPos.y;

      for (let step = 0; step < 16; step++) {
        const rMid = (rMin + rMax) / 2;
        const testX = originX + Math.cos(angle) * rMid;
        const testY = originY + Math.sin(angle) * rMid;

        if (testX < 10 || testX > 590 || testY < 10 || testY > 310) {
          rMax = rMid;
          continue;
        }

        const reading = calcFieldAndPotential(testX, testY);
        if (Math.abs(reading.V - targetV) < Math.abs(calcFieldAndPotential(bestX, bestY).V - targetV)) {
          bestX = testX;
          bestY = testY;
        }

        if (targetV >= 0) {
          if (reading.V > targetV) {
            rMin = rMid;
          } else {
            rMax = rMid;
          }
        } else {
          if (reading.V < targetV) {
            rMin = rMid;
          } else {
            rMax = rMid;
          }
        }
      }

      if (bestX >= 10 && bestX <= 590 && bestY >= 10 && bestY <= 310) {
        points.push({ x: bestX, y: bestY });
      }
    }

    if (points.length > 5) {
      const contourColor = targetV >= 0 ? '#34d399' : '#38bdf8';
      setEquipotentialLines(prev => [...prev.slice(-7), { voltage: targetV, points, color: contourColor }]);
    }
  };

  // Launch a test particle (+1 or -1) from sensor position to trace field line trajectory
  const launchTestParticle = (qSign: number = 1) => {
    if (charges.length === 0) return;
    setTestParticle({
      x: sensorPos.x,
      y: sensorPos.y,
      vx: 0,
      vy: 0,
      q: qSign,
      trail: [{ x: sensorPos.x, y: sensorPos.y }],
    });
  };

  // Test Particle Motion Simulation Loop
  useEffect(() => {
    if (!testParticle) return;

    let isRunning = true;
    let lastTime = performance.now();

    const stepSimulation = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      setTestParticle((prev) => {
        if (!prev) return null;

        // Calculate force F = q * E at particle position
        const { Ex, Ey } = calcFieldAndPotential(prev.x, prev.y);
        const mass = 0.5; // unit mass
        const ax = (prev.q * Ex * 0.15) / mass;
        const ay = (prev.q * Ey * 0.15) / mass;

        // Damping to stabilize trajectory display
        const damping = 0.98;
        const nvx = (prev.vx + ax * dt * 40) * damping;
        const nvy = (prev.vy + ay * dt * 40) * damping;

        const nx = prev.x + nvx * dt * 50;
        const ny = prev.y + nvy * dt * 50;

        // Check boundary or collision with any charge
        if (nx < 10 || nx > 590 || ny < 10 || ny > 310) {
          return null; // exited canvas
        }

        for (const c of charges) {
          const dist = Math.hypot(nx - c.x, ny - c.y);
          if (dist < 16) {
            return null; // captured by charge
          }
        }

        const newTrail = [...prev.trail.slice(-40), { x: nx, y: ny }];
        return {
          x: nx,
          y: ny,
          vx: nvx,
          vy: nvy,
          q: prev.q,
          trail: newTrail,
        };
      });

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(stepSimulation);
      }
    };

    animFrameRef.current = requestAnimationFrame(stepSimulation);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [testParticle !== null, calcFieldAndPotential, charges]);

  // Pointer Event Handlers for Flawless Dragging (Mouse, Stylus, & Mobile Touch)
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 300, y: 160 };
    const scaleX = 600 / rect.width;
    const scaleY = 320 / rect.height;
    const x = Math.max(15, Math.min(585, (e.clientX - rect.left) * scaleX));
    const y = Math.max(15, Math.min(305, (e.clientY - rect.top) * scaleY));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);
    e.currentTarget.setPointerCapture(e.pointerId);

    // 1. Check Sensor Hit (Radius: 20px)
    const distSensor = Math.hypot(x - sensorPos.x, y - sensorPos.y);
    if (distSensor < 22) {
      setIsDraggingSensor(true);
      return;
    }

    // 2. Check Charge Hits (Radius: 24px, checked in reverse order for top-most)
    for (let i = charges.length - 1; i >= 0; i--) {
      const c = charges[i];
      const dist = Math.hypot(x - c.x, y - c.y);
      if (dist < 22) {
        setDraggingChargeId(c.id);
        return;
      }
    }

    // 3. If clicking empty space, instantly move sensor to that point
    setSensorPos({ x, y });
    setIsDraggingSensor(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingSensor && draggingChargeId === null) return;
    const { x, y } = getCanvasCoordinates(e);

    if (isDraggingSensor) {
      setSensorPos({ x, y });
    } else if (draggingChargeId !== null) {
      setCharges((prev) =>
        prev.map((c) => (c.id === draggingChargeId ? { ...c, x, y } : c))
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDraggingChargeId(null);
    setIsDraggingSensor(false);
  };

  // Canvas Main Render Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 600, 320);

    // 1. Subtle Background Grid & Metric Rulers
    if (showGrid) {
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x <= 600; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 320);
        ctx.stroke();
      }
      for (let y = 0; y <= 320; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(600, y);
        ctx.stroke();
      }

      // Distance indicator label
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '9px monospace';
      ctx.fillText('Grid: 40 cm / div', 12, 310);
    }

    // 2. Render Traced Equipotential Contours
    if (showEquipotentials && equipotentialLines.length > 0) {
      equipotentialLines.forEach((contour) => {
        if (contour.points.length < 3) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(contour.points[0].x, contour.points[0].y);
        for (let i = 1; i < contour.points.length; i++) {
          ctx.lineTo(contour.points[i].x, contour.points[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = contour.color;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.stroke();

        // Voltage tag badge along contour
        const labelPoint = contour.points[0];
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(labelPoint.x - 16, labelPoint.y - 8, 32, 14);
        ctx.strokeStyle = contour.color;
        ctx.strokeRect(labelPoint.x - 16, labelPoint.y - 8, 32, 14);
        ctx.fillStyle = contour.color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${contour.voltage > 0 ? '+' : ''}${contour.voltage.toFixed(0)}V`, labelPoint.x, labelPoint.y);
        ctx.restore();
      });
    }

    // 3. Render Electric Field Vector Grid (Arrows pointing in direction of E)
    if (showVectors && charges.length > 0) {
      const step = 32;
      for (let x = step / 2; x < 600; x += step) {
        for (let y = step / 2; y < 320; y += step) {
          const { Ex, Ey, E_total } = calcFieldAndPotential(x, y);
          if (E_total > 0.02) {
            const angle = Math.atan2(Ey, Ex);
            const arrowLen = Math.min(Math.max(E_total * 0.7, 8), 16);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Vector arrow line with head
            ctx.beginPath();
            ctx.moveTo(-arrowLen / 2, 0);
            ctx.lineTo(arrowLen / 2, 0);
            ctx.lineTo(arrowLen / 2 - 3.5, -2.5);
            ctx.moveTo(arrowLen / 2, 0);
            ctx.lineTo(arrowLen / 2 - 3.5, 2.5);

            const alpha = Math.min(Math.max(E_total / 6.0, 0.18), 0.85);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    // 4. Render Test Particle Path & Particle Head
    if (testParticle) {
      // Trail
      if (testParticle.trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(testParticle.trail[0].x, testParticle.trail[0].y);
        for (let i = 1; i < testParticle.trail.length; i++) {
          ctx.lineTo(testParticle.trail[i].x, testParticle.trail[i].y);
        }
        ctx.strokeStyle = testParticle.q > 0 ? 'rgba(244, 63, 94, 0.6)' : 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.restore();
      }

      // Glowing Particle Head
      ctx.beginPath();
      ctx.arc(testParticle.x, testParticle.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = testParticle.q > 0 ? '#f43f5e' : '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Render Charges with Gradient Spheres, Shadows, and Numerical Signs
    charges.forEach((c) => {
      const isDragging = draggingChargeId === c.id;
      const radius = 16;

      // Glow halo
      const gradientGlow = ctx.createRadialGradient(c.x, c.y, radius * 0.6, c.x, c.y, radius * 1.8);
      gradientGlow.addColorStop(0, c.q > 0 ? 'rgba(239, 68, 68, 0.45)' : 'rgba(59, 130, 246, 0.45)');
      gradientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradientGlow;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Main Spherical Body
      const bodyGrad = ctx.createRadialGradient(c.x - 4, c.y - 4, 2, c.x, c.y, radius);
      if (c.q > 0) {
        bodyGrad.addColorStop(0, '#fca5a5');
        bodyGrad.addColorStop(0.5, '#ef4444');
        bodyGrad.addColorStop(1, '#991b1b');
      } else {
        bodyGrad.addColorStop(0, '#93c5fd');
        bodyGrad.addColorStop(0.5, '#3b82f6');
        bodyGrad.addColorStop(1, '#1e3a8a');
      }

      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.strokeStyle = isDragging ? '#fbbf24' : '#ffffff';
      ctx.lineWidth = isDragging ? 2.5 : 1.8;
      ctx.stroke();

      // Charge Value Label (+1, -1, +2 nC)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = c.q > 0 ? (c.q === 1 ? '+' : `+${c.q}`) : (c.q === -1 ? '−' : `${c.q}`);
      ctx.fillText(label, c.x, c.y);
    });

    // 6. Render Sensor Probe (Gold Precision Target with Live Vector Needle)
    const { Ex, Ey, E_total } = sensorReading;
    const isProbeActive = isDraggingSensor;

    // Sensor Target Crosshairs & Ring
    ctx.save();
    ctx.translate(sensorPos.x, sensorPos.y);

    // Glowing Aura
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fill();

    // Outer Target Ring
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = isProbeActive ? '#ffffff' : '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center Bullseye
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Real-Time Directional Needle from Sensor (pointing in direction of E)
    if (E_total > 0.05) {
      const angle = Math.atan2(Ey, Ex);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(24, 0);
      ctx.lineTo(19, -3.5);
      ctx.moveTo(24, 0);
      ctx.lineTo(19, 3.5);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.restore();

  }, [charges, showVectors, showGrid, showEquipotentials, equipotentialLines, sensorPos, sensorReading, isDraggingSensor, draggingChargeId, testParticle, calcFieldAndPotential]);

  // Log experiment measurement to Lab Notebook
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'charges_and_fields',
        chargesCount: charges.length,
        netCharge_nC: netCharge,
        sensorPos,
        sensorReading: {
          V: Number(sensorReading.V.toFixed(2)),
          E_total: Number(sensorReading.E_total.toFixed(2)),
          Ex: Number(sensorReading.Ex.toFixed(2)),
          Ey: Number(sensorReading.Ey.toFixed(2)),
          angleDeg: Number(sensorReading.angleDeg.toFixed(1)),
        },
        timestamp: new Date().toISOString(),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none" id="charges-fields-sim-root">
      
      {/* 1. Header Bar with Title & Top Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-sky-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{tI18n('experiments.charges_and_fields.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                ΣQ = {netCharge > 0 ? `+${netCharge}` : netCharge} nC
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.charges_and_fields.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            id="charges-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              logged ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{logged ? (tI18n('experiments.charges_and_fields.logged') || 'Logged ✓') : (tI18n('experiments.charges_and_fields.log') || 'Log')}</span>
          </button>
          <button 
            id="charges-reset-btn"
            onClick={resetSimulation}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold rounded-xl border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{tI18n('experiments.charges_and_fields.reset')}</span>
          </button>
        </div>
      </div>

      {/* 2. Prominent Controls Bar with Standard Presets & Direct Actions */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3.5">
        
        {/* Presets Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            {tI18n('experiments.charges_and_fields.controlsBar')}
          </span>
          <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium me-1 hidden sm:inline">
              {tI18n('experiments.charges_and_fields.presets')}:
            </span>
            <button
              onClick={() => applyPreset('dipole')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.charges_and_fields.presetDipole')}
            </button>
            <button
              onClick={() => applyPreset('likeCharges')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.charges_and_fields.presetLikeCharges')}
            </button>
            <button
              onClick={() => applyPreset('quadrupole')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.charges_and_fields.presetQuadrupole')}
            </button>
            <button
              onClick={() => applyPreset('singlePos')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.charges_and_fields.presetSinglePos')}
            </button>
            <button
              onClick={() => applyPreset('parallel')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
            >
              {tI18n('experiments.charges_and_fields.presetParallel')}
            </button>
          </div>
        </div>

        {/* Charge Dispenser & Dynamic Interaction Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
          
          {/* 1. Add Positive Charge (+1 nC) */}
          <button
            id="btn-add-pos-charge"
            onClick={() => addCharge(1)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-900/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">{tI18n('experiments.charges_and_fields.addPos')}</span>
          </button>

          {/* 2. Add Negative Charge (-1 nC) */}
          <button
            id="btn-add-neg-charge"
            onClick={() => addCharge(-1)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-md shadow-blue-900/30 transition-all active:scale-95"
          >
            <Minus className="w-4 h-4 shrink-0" />
            <span className="truncate">{tI18n('experiments.charges_and_fields.addNeg')}</span>
          </button>

          {/* 3. Trace Equipotential Line at Sensor */}
          <button
            id="btn-trace-equipotential"
            onClick={traceEquipotentialAtSensor}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all active:scale-95"
          >
            <Layers className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="truncate">{tI18n('experiments.charges_and_fields.traceEquipotential')}</span>
          </button>

          {/* 4. Launch Test Particle (+q) */}
          <button
            id="btn-launch-test-particle"
            onClick={() => launchTestParticle(1)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">{tI18n('experiments.charges_and_fields.launchTestParticle')}</span>
          </button>

          {/* 5. Clear All Charges */}
          <button
            id="btn-clear-all-charges"
            onClick={clearAllCharges}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{tI18n('experiments.charges_and_fields.clearAll')}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Stage: Interactive Canvas & Side Control Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Unobstructed Interactive 2D Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between items-center relative min-h-[420px] overflow-hidden">
          
          {/* Top Status Header */}
          <div className="w-full flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">
                {tI18n('experiments.charges_and_fields.dragTip')}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {tI18n('experiments.charges_and_fields.chargesCount')}: {charges.length}
            </span>
          </div>

          {/* Canvas Component with Touch-Action None for Seamless Dragging */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={320}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-auto max-h-[380px] rounded-xl bg-slate-950 cursor-crosshair border border-slate-900 shadow-inner touch-none select-none"
            />
          </div>

          {/* Dedicated Non-Overlapping Instrument Telemetry Row */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">{tI18n('experiments.charges_and_fields.sensorDetails')}:</span>
            </div>
            <div className="flex items-center flex-wrap gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.charges_and_fields.potential')}:</span>
                <span className={`text-xs sm:text-sm font-bold ${sensorReading.V >= 0 ? 'text-emerald-400' : 'text-sky-400'}`}>
                  {sensorReading.V >= 0 ? `+${sensorReading.V.toFixed(1)} V` : `${sensorReading.V.toFixed(1)} V`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.charges_and_fields.fieldIntensity')}:</span>
                <span className="text-xs sm:text-sm font-bold text-amber-400">
                  {sensorReading.E_total.toFixed(2)} V/m
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.charges_and_fields.angle')}:</span>
                <span className="text-xs sm:text-sm font-bold text-cyan-400">
                  {sensorReading.angleDeg.toFixed(0)}°
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Layer Toggles & Charge Managers */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Overlay Visualization Controls */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-indigo-400" />
              {tI18n('experiments.charges_and_fields.toggleVectors')}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs">
              {/* Toggle Vector Grid */}
              <button
                onClick={() => setShowVectors(prev => !prev)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border flex items-center justify-between transition-all active:scale-95 ${
                  showVectors
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400" />
                  {tI18n('experiments.charges_and_fields.toggleVectors')}
                </span>
                <span>{showVectors ? '✓' : '✗'}</span>
              </button>

              {/* Toggle Equipotential Lines */}
              <button
                onClick={() => setShowEquipotentials(prev => !prev)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border flex items-center justify-between transition-all active:scale-95 ${
                  showEquipotentials
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  {tI18n('experiments.charges_and_fields.traceEquipotential')}
                </span>
                <span>{showEquipotentials ? '✓' : '✗'}</span>
              </button>

              {/* Toggle Coordinate Grid */}
              <button
                onClick={() => setShowGrid(prev => !prev)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border flex items-center justify-between transition-all active:scale-95 ${
                  showGrid
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-400" />
                  {tI18n('experiments.charges_and_fields.showGrid')}
                </span>
                <span>{showGrid ? '✓' : '✗'}</span>
              </button>
            </div>

            {equipotentialLines.length > 0 && (
              <button
                onClick={() => setEquipotentialLines([])}
                className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold border border-slate-800 transition-all flex items-center justify-center gap-1.5 mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {tI18n('experiments.charges_and_fields.clearEquipotentials')}
              </button>
            )}
          </div>

          {/* Active Charges List & Removal */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Share2 className="w-4 h-4 text-amber-400" />
                {tI18n('experiments.charges_and_fields.manageCharges')}
              </span>
              <span className="text-xs font-mono text-slate-400">{charges.length} / 12</span>
            </div>

            {charges.length === 0 ? (
              <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl text-center text-xs text-slate-400">
                {tI18n('experiments.charges_and_fields.clickToPlaceSensor')}
              </div>
            ) : (
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                {charges.map((c, idx) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${c.q > 0 ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <span className="text-slate-300">
                        #{idx + 1} ({c.q > 0 ? `+${c.q}` : c.q} nC)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        ({Math.round(c.x)}, {Math.round(c.y)})
                      </span>
                      <button
                        onClick={() => deleteCharge(c.id)}
                        className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
