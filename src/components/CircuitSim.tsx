import { Power, Zap, Activity, Check, PlusCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (record: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function CircuitSim({ lang, onLogMeasurement }: Props) {
  const { t } = useTranslation();
  const common = (t('common', { returnObjects: true }) as any);
  const ctrl = (t('controls', { returnObjects: true }) as any);

  // Parameters
  const [voltage, setVoltage] = useState(12); // Volts (1 to 24)
  const [r1, setR1] = useState(10); // Ohms (1 to 100)
  const [r2, setR2] = useState(20); // Ohms (1 to 100)
  const [circuitType, setCircuitType] = useState<'single' | 'series' | 'parallel'>('series');
  const [isSwitchClosed, setIsSwitchClosed] = useState(true);
  const [showElectrons, setShowElectrons] = useState(true);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  // Canvas Ref for Electron Flow Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const electronPhaseRef = useRef(0);

  // Electrical Physics Calculations
  let req = 0;
  if (!isSwitchClosed) {
    req = Infinity;
  } else if (circuitType === 'single') {
    req = r1;
  } else if (circuitType === 'series') {
    req = r1 + r2;
  } else if (circuitType === 'parallel') {
    req = (r1 * r2) / (r1 + r2);
  }

  const totalCurrent = isSwitchClosed && req > 0 ? voltage / req : 0;
  const totalPower = isSwitchClosed ? voltage * totalCurrent : 0;

  // Resistor voltage drops and individual currents
  let v_r1 = 0;
  let v_r2 = 0;
  let i_r1 = 0;
  let i_r2 = 0;

  if (isSwitchClosed) {
    if (circuitType === 'single') {
      v_r1 = voltage;
      i_r1 = totalCurrent;
    } else if (circuitType === 'series') {
      i_r1 = totalCurrent;
      i_r2 = totalCurrent;
      v_r1 = totalCurrent * r1;
      v_r2 = totalCurrent * r2;
    } else if (circuitType === 'parallel') {
      v_r1 = voltage;
      v_r2 = voltage;
      i_r1 = voltage / r1;
      i_r2 = voltage / r2;
    }
  }

  // Draw Circuit and Animated Electron Flow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isSwitchClosed && totalCurrent > 0) {
        electronPhaseRef.current += totalCurrent * dt * 2.5; // speed proportional to current
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const marginX = 70;
      const marginY = 60;
      const x1 = marginX;
      const y1 = marginY;
      const x2 = w - marginX;
      const y2 = h - marginY;

      // 1. Draw Wires (Rectangle schematic)
      ctx.strokeStyle = isSwitchClosed && totalCurrent > 0 ? '#38bdf8' : '#52525b';
      ctx.lineWidth = 3;
      ctx.beginPath();

      // Top wire with Switch
      ctx.moveTo(x1, y1);
      const switchX = (x1 + x2) / 2 - 40;
      ctx.lineTo(switchX, y1);

      // Switch Gap
      if (isSwitchClosed) {
        ctx.lineTo(switchX + 30, y1); // closed line
      } else {
        ctx.lineTo(switchX + 22, y1 - 20); // open lever
      }
      ctx.moveTo(switchX + 30, y1);
      ctx.lineTo(x2, y1);

      // Right wire down
      ctx.lineTo(x2, y2);

      // Bottom wire with Resistors
      ctx.lineTo(x1, y2);

      // Left wire with Battery
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Switch terminals
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(switchX, y1, 4, 0, Math.PI * 2);
      ctx.arc(switchX + 30, y1, 4, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Battery (DC Source on left vertical wire)
      const batY = (y1 + y2) / 2;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x1 - 18, batY - 26, 36, 52);

      // Battery Plates
      ctx.strokeStyle = '#ef4444'; // Positive (long plate)
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1 - 18, batY - 10);
      ctx.lineTo(x1 + 18, batY - 10);
      ctx.stroke();

      ctx.strokeStyle = '#3b82f6'; // Negative (short thick plate)
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x1 - 10, batY + 10);
      ctx.lineTo(x1 + 10, batY + 10);
      ctx.stroke();

      // Battery Voltage Text
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+`, x1 - 24, batY - 8);
      ctx.fillStyle = '#60a5fa';
      ctx.fillText(`-`, x1 - 24, batY + 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`${voltage}V`, x1 - 36, batY + 2);

      // 3. Draw Resistors on Bottom / Right wires
      if (circuitType === 'single') {
        const resX = (x1 + x2) / 2;
        drawResistorBox(ctx, resX, y2, r1, 'R₁', v_r1, i_r1);
      } else if (circuitType === 'series') {
        const r1X = x1 + (x2 - x1) * 0.35;
        const r2X = x1 + (x2 - x1) * 0.65;
        drawResistorBox(ctx, r1X, y2, r1, 'R₁', v_r1, i_r1);
        drawResistorBox(ctx, r2X, y2, r2, 'R₂', v_r2, i_r2);
      } else if (circuitType === 'parallel') {
        // Parallel branch
        const midY1 = y2 - 40;
        const midY2 = y2 + 40;

        ctx.strokeStyle = isSwitchClosed && totalCurrent > 0 ? '#38bdf8' : '#52525b';
        ctx.lineWidth = 2.5;

        // Branch split
        const branchX1 = x1 + (x2 - x1) * 0.3;
        const branchX2 = x1 + (x2 - x1) * 0.7;

        ctx.beginPath();
        ctx.moveTo(branchX1, y2);
        ctx.lineTo(branchX1, midY1);
        ctx.lineTo(branchX2, midY1);
        ctx.lineTo(branchX2, y2);

        ctx.moveTo(branchX1, y2);
        ctx.lineTo(branchX1, midY2);
        ctx.lineTo(branchX2, midY2);
        ctx.lineTo(branchX2, y2);
        ctx.stroke();

        drawResistorBox(ctx, (branchX1 + branchX2) / 2, midY1, r1, 'R₁', v_r1, i_r1);
        drawResistorBox(ctx, (branchX1 + branchX2) / 2, midY2, r2, 'R₂', v_r2, i_r2);
      }

      // 4. Draw Glowing Light Bulb on Right vertical wire
      const bulbY = (y1 + y2) / 2;
      const glowIntensity = Math.min(1, totalPower / 30); // proportional to power

      // Glow halo
      if (isSwitchClosed && glowIntensity > 0.05) {
        const glowGrad = ctx.createRadialGradient(x2, bulbY, 5, x2, bulbY, 40 * glowIntensity + 10);
        glowGrad.addColorStop(0, `rgba(250, 204, 21, ${0.8 * glowIntensity})`);
        glowGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x2, bulbY, 45 * glowIntensity + 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bulb glass
      ctx.fillStyle = isSwitchClosed && totalPower > 0.1 ? '#fef08a' : '#27272a';
      ctx.beginPath();
      ctx.arc(x2, bulbY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Filament
      ctx.strokeStyle = isSwitchClosed && totalPower > 0.1 ? '#ea580c' : '#71717a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x2 - 6, bulbY + 8);
      ctx.lineTo(x2 - 3, bulbY - 6);
      ctx.lineTo(x2 + 3, bulbY - 6);
      ctx.lineTo(x2 + 6, bulbY + 8);
      ctx.stroke();

      // 5. Draw Animated Electrons
      if (showElectrons && isSwitchClosed && totalCurrent > 0) {
        const perimeter = 2 * (x2 - x1 + (y2 - y1));
        const numElectrons = 24;
        ctx.fillStyle = '#facc15';

        for (let i = 0; i < numElectrons; i++) {
          const dist = ((i * (perimeter / numElectrons) + electronPhaseRef.current * 40) % perimeter + perimeter) % perimeter;
          const pos = getPointAlongPerimeter(dist, x1, y1, x2, y2);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [voltage, r1, r2, circuitType, isSwitchClosed, showElectrons, totalCurrent, totalPower, v_r1, v_r2, i_r1, i_r2]);

  // Helper to draw a resistor schematic box with colored bands
  const drawResistorBox = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    resistance: number,
    label: string,
    v: number,
    i: number
  ) => {
    const rw = 56;
    const rh = 24;

    ctx.fillStyle = '#27272a';
    ctx.fillRect(cx - rw / 2, cy - rh / 2, rw, rh);
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);

    // Color bands
    const colors = ['#854d0e', '#dc2626', '#ea580c', '#eab308', '#22c55e', '#3b82f6'];
    const band1 = colors[Math.floor(resistance / 10) % colors.length] || '#854d0e';
    const band2 = colors[resistance % colors.length] || '#dc2626';

    ctx.fillStyle = band1;
    ctx.fillRect(cx - 16, cy - rh / 2 + 2, 4, rh - 4);
    ctx.fillStyle = band2;
    ctx.fillRect(cx - 6, cy - rh / 2 + 2, 4, rh - 4);
    ctx.fillStyle = '#eab308'; // Gold tolerance
    ctx.fillRect(cx + 12, cy - rh / 2 + 2, 4, rh - 4);

    // Text label
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${label}: ${resistance}Ω`, cx, cy - rh / 2 - 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${v.toFixed(1)}V | ${i.toFixed(2)}A`, cx, cy + rh / 2 + 14);
  };

  // Helper for wire perimeter electron coordinates
  const getPointAlongPerimeter = (dist: number, x1: number, y1: number, x2: number, y2: number) => {
    const topW = x2 - x1;
    const rightH = y2 - y1;
    const bottomW = topW;
    const leftH = rightH;

    if (dist < topW) {
      return { x: x1 + dist, y: y1 };
    } else if (dist < topW + rightH) {
      return { x: x2, y: y1 + (dist - topW) };
    } else if (dist < topW + rightH + bottomW) {
      return { x: x2 - (dist - topW - rightH), y: y2 };
    } else {
      return { x: x1, y: y2 - (dist - topW - rightH - bottomW) };
    }
  };

  // Log measurement
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'circuits',
      variableName: t('experiments.circuits.varTotalCurrent'),
      measuredValue: Number(totalCurrent.toFixed(3)),
      theoreticalValue: Number(totalCurrent.toFixed(3)),
      unit: 'A',
      parameters: {
        'Supply Voltage': `${voltage} V`,
        'Circuit Topology': circuitType,
        'Resistor 1': `${r1} Ω`,
        'Resistor 2': circuitType !== 'single' ? `${r2} Ω` : 'N/A',
        'Equivalent Resistance': `${req.toFixed(2)} Ω`,
        Power: `${totalPower.toFixed(2)} W`,
      },
      notes: t('experiments.circuits.notesText'),
    });

    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 2500);
  };

  return (
    <div id="circuit-simulation" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{t('experiments.circuits.title')}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{t('experiments.circuits.shortDesc')}</p>
        </div>

        {/* Switch Status Toggle */}
        <button className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
            isSwitchClosed
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
          }`}
        >
          <Power  className="w-4 h-4"/>
          <span>{isSwitchClosed ? t('experiments.circuits.switchOn') : t('experiments.circuits.switchOff')}</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Schematic Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-inner flex flex-col items-center">
            <canvas
              ref={canvasRef}
              id="circuit-canvas"
              width={650}
              height={380}
             className="w-full h-[380px] select-none"/>

            {/* Bottom Toolbar */}
            <div className="w-full border-t border-zinc-800/80 p-3 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="min-h-[44px] flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={showElectrons}
                  onChange={(e) => setShowElectrons(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-yellow-500 focus:ring-0"
                />
                <Zap  className="w-3.5 h-3.5 text-yellow-400"/>
                <span>{t('experiments.circuits.electronFlow')}</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400">{t('experiments.circuits.circuitType')}:</span>
                <div className="flex rounded-lg bg-zinc-800 p-0.5 border border-zinc-700">
                  <button className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      circuitType === 'single' ? 'bg-zinc-900 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t('experiments.circuits.single')}
                  </button>
                  <button className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      circuitType === 'series' ? 'bg-zinc-900 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t('experiments.circuits.series')}
                  </button>
                  <button className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      circuitType === 'parallel' ? 'bg-zinc-900 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t('experiments.circuits.parallel')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Multimeter Digital Readout Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.circuits.current')} (I)</span>
              <span className="text-xl font-bold text-sky-400 font-mono mt-0.5 block">
                {totalCurrent.toFixed(3)} <span className="text-xs font-normal text-zinc-400">{common.amperes}</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">I = V / Req</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.circuits.totalResistance')}</span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                {isSwitchClosed ? req.toFixed(2) : '∞'} <span className="text-xs font-normal text-zinc-400">{common.ohms}</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Req</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.circuits.power')} (P)</span>
              <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">
                {totalPower.toFixed(2)} <span className="text-xs font-normal text-zinc-400">{common.watts}</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">P = V · I</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.circuits.voltage')}</span>
              <span className="text-xl font-bold text-purple-400 font-mono mt-0.5 block">
                {voltage} <span className="text-xs font-normal text-zinc-400">{common.volts}</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">DC Battery</span>
            </div>
          </div>
        </div>

        {/* Right: Component Values Adjustments (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t('experiments.circuits.componentSettingsTitle')}
            </h3>

            {/* Battery Voltage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.circuits.voltage')}</span>
                <span className="font-mono text-purple-400 font-medium">{voltage} V</span>
              </div>
              <input
                id="slider-circuit-voltage"
                type="range"
                min="1"
                max="24"
                step="1"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Resistor 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.circuits.resistance1')}</span>
                <span className="font-mono text-sky-400 font-medium">{r1} Ω</span>
              </div>
              <input
                id="slider-circuit-r1"
                type="range"
                min="1"
                max="100"
                step="1"
                value={r1}
                onChange={(e) => setR1(Number(e.target.value))}
                className="w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Resistor 2 if series/parallel */}
            {circuitType !== 'single' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t('experiments.circuits.resistance2')}</span>
                  <span className="font-mono text-emerald-400 font-medium">{r2} Ω</span>
                </div>
                <input
                  id="slider-circuit-r2"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={r2}
                  onChange={(e) => setR2(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Live Formula Preview Box */}
            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs font-mono text-zinc-300 space-y-1">
              <div className="text-zinc-400 text-[11px] font-sans flex items-center gap-1.5">
                <Activity  className="w-3.5 h-3.5 text-sky-400"/>
                {t('experiments.circuits.liveCalculationsTitle')}
              </div>
              <div>I = {voltage}V / {req.toFixed(2)}Ω = <span className="text-sky-400 font-bold">{totalCurrent.toFixed(3)} A</span></div>
              <div>P = {voltage}V × {totalCurrent.toFixed(3)}A = <span className="text-amber-400 font-bold">{totalPower.toFixed(2)} W</span></div>
            </div>
          </div>

          {/* Log Measurement Button */}
          <button className="min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all active:scale-[0.98]">
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