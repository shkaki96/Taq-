import { Magnet, RotateCcw, Zap, BookmarkCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

type MagneticMode = 'solenoid' | 'straight_wire' | 'force_wire';

export default function MagneticFieldSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [mode, setMode] = useState<MagneticMode>('solenoid');

  // Solenoid Parameters
  const [currentI, setCurrentI] = useState<number>(3.0); // Amperes (-8 to +8 A)
  const [numTurns, setNumTurns] = useState<number>(400); // Turns (N)
  const [solenoidLength, setSolenoidLength] = useState<number>(0.25); // m (L)
  const [coreMaterial, setCoreMaterial] = useState<'air' | 'iron' | 'ferrite'>('air');

  // Straight Wire Parameters
  const [probeDistance, setProbeDistance] = useState<number>(0.05); // m (r: 0.01 to 0.20 m)

  // Force on Wire Parameters
  const [externalB, setExternalB] = useState<number>(0.5); // Tesla
  const [wireLength, setWireLength] = useState<number>(0.15); // m (L)
  const [fieldAngleDeg, setFieldAngleDeg] = useState<number>(90); // degrees

  // Draggable Sensor Probe Coordinates (pixels)
  const [probePos, setProbePos] = useState<{ x: number; y: number }>({ x: 350, y: 190 });
  const [logged, setLogged] = useState<boolean>(false);

  // Constants
  const mu0 = 4 * Math.PI * 1e-7; // T*m/A
  const relativePermeability = coreMaterial === 'air' ? 1.0 : coreMaterial === 'ferrite' ? 50.0 : 200.0;

  // Calculations:
  // 1. Solenoid: B = mu_0 * mu_r * (N / L) * I
  const turnsDensity = numTurns / solenoidLength; // n = N / L
  const solenoidB = mu0 * relativePermeability * turnsDensity * currentI; // Tesla

  // 2. Straight Wire: B = (mu_0 * I) / (2 * pi * r)
  const straightWireB = probeDistance > 0 ? (mu0 * Math.abs(currentI)) / (2 * Math.PI * probeDistance) : 0;

  // 3. Magnetic Force: F = I * L * B * sin(theta)
  const sinAngle = Math.sin((fieldAngleDeg * Math.PI) / 180);
  const magneticForce = currentI * wireLength * externalB * sinAngle; // Newtons

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingProbeRef = useRef<boolean>(false);

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const centerX = width * 0.44;
    const centerY = height * 0.5;

    if (mode === 'solenoid') {
      // Draw Solenoid Coil & Internal Magnetic Field
      const solLenPix = Math.min(380, solenoidLength * 1100);
      const solHPix = 90;
      const startX = centerX - solLenPix / 2;
      const endX = centerX + solLenPix / 2;

      // Magnetic Core inside
      if (coreMaterial !== 'air') {
        ctx.fillStyle = coreMaterial === 'iron' ? '#334155' : '#1e293b';
        ctx.fillRect(startX - 15, centerY - solHPix / 2 + 10, solLenPix + 30, solHPix - 20);
        ctx.strokeStyle = '#64748b';
        ctx.strokeRect(startX - 15, centerY - solHPix / 2 + 10, solLenPix + 30, solHPix - 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(coreMaterial === 'iron' ? tI18n('experiments.magnetic_field.softIronCoreCanvas') : tI18n('experiments.magnetic_field.ferriteCoreCanvas'), centerX, centerY + 4);
      }

      // Magnetic Field Lines through Solenoid
      if (currentI !== 0) {
        const numLines = 7;
        const dir = currentI > 0 ? 1 : -1;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.5;

        for (let i = 0; i < numLines; i++) {
          const yOff = (i - (numLines - 1) / 2) * 12;
          ctx.beginPath();
          ctx.moveTo(startX - 70, centerY + yOff);
          ctx.lineTo(endX + 70, centerY + yOff);
          ctx.stroke();

          // Field Arrow
          const arrowX = dir > 0 ? centerX + 30 : centerX - 30;
          ctx.beginPath();
          ctx.moveTo(arrowX, centerY + yOff);
          ctx.lineTo(arrowX - dir * 8, centerY + yOff - 4);
          ctx.lineTo(arrowX - dir * 8, centerY + yOff + 4);
          ctx.closePath();
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
        }

        // Looping exterior lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 65, solLenPix * 0.65, 45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 65, solLenPix * 0.65, 45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Solenoid Coils (Helical Copper Turns)
      const turnsToDraw = 16;
      const turnSpacing = solLenPix / turnsToDraw;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;

      for (let i = 0; i <= turnsToDraw; i++) {
        const tx = startX + i * turnSpacing;
        ctx.beginPath();
        ctx.ellipse(tx, centerY, 7, solHPix / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Poles Indicators (North & South)
      if (currentI !== 0) {
        const northAtRight = currentI > 0;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';

        ctx.fillStyle = northAtRight ? '#ef4444' : '#0284c7';
        ctx.fillText(northAtRight ? 'S' : 'N', startX - 35, centerY + 6);

        ctx.fillStyle = northAtRight ? '#0284c7' : '#ef4444';
        ctx.fillText(northAtRight ? 'N' : 'S', endX + 35, centerY + 6);
      }
    } else if (mode === 'straight_wire') {
      // Long Straight Wire in Center
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(centerX - 8, 30, 16, height - 60);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - 8, 30, 16, height - 60);

      // Current Arrow along wire
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      const arrowDir = currentI >= 0 ? -1 : 1; // upward if positive
      ctx.fillText(`I = ${currentI} A`, centerX, centerY);

      // Concentric Circular Magnetic Field Lines (Ampere's Law)
      const radii = [45, 80, 120, 165];
      radii.forEach((r) => {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();

        // Arrow tangent on circle showing Right Hand Rule
        const angle = -Math.PI / 4;
        const ax = centerX + r * Math.cos(angle);
        const ay = centerY + r * Math.sin(angle);
        const tanAngle = angle + (currentI >= 0 ? -Math.PI / 2 : Math.PI / 2);

        ctx.beginPath();
        ctx.arc(ax, ay, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + 10 * Math.cos(tanAngle), ay + 10 * Math.sin(tanAngle));
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });
    } else {
      // Laplace / Lorentz Force on Current-Carrying Wire in External B Field
      const railStartX = centerX - 140;
      const railEndX = centerX + 140;
      const railY1 = centerY - 50;
      const railY2 = centerY + 50;

      // Two conducting rails
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(railStartX, railY1);
      ctx.lineTo(railEndX, railY1);
      ctx.moveTo(railStartX, railY2);
      ctx.lineTo(railEndX, railY2);
      ctx.stroke();

      // Magnetic field dots (out of page) or crosses (into page)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.font = '14px monospace';
      for (let x = railStartX + 20; x < railEndX; x += 40) {
        for (let y = railY1 + 25; y < railY2; y += 25) {
          ctx.fillText('⊗', x, y);
        }
      }

      // Movable conducting rod on rails
      const rodX = centerX + (magneticForce * 40);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(rodX - 6, railY1 - 10, 12, (railY2 - railY1) + 20);

      // Force Vector Arrow on Rod
      if (Math.abs(magneticForce) > 0.001) {
        const fLen = Math.min(90, magneticForce * 80);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(rodX, centerY);
        ctx.lineTo(rodX + fLen, centerY);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`F = ${magneticForce.toFixed(3)} N`, rodX + fLen + 15, centerY + 4);
      }
    }

    // Draggable Magnetic Field Probe Tool (Gaussmeter sensor)
    const px = probePos.x;
    const py = probePos.y;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 14, py - 14, 28, 28);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 14, py - 14, 28, 28);

    // Crosshair on sensor
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Probe readout badge
    const displayB = mode === 'solenoid' ? solenoidB : mode === 'straight_wire' ? straightWireB : externalB;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`B = ${(displayB * 1000).toFixed(2)} mT`, px + 18, py - 4);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`${(displayB * 10000).toFixed(1)} Gauss`, px + 18, py + 10);
  }, [mode, currentI, numTurns, solenoidLength, coreMaterial, probeDistance, externalB, wireLength, fieldAngleDeg, probePos, solenoidB, straightWireB, magneticForce]);

  // Dragging probe
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (Math.hypot(x - probePos.x, y - probePos.y) < 30) {
      isDraggingProbeRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingProbeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setProbePos({ x, y });

    // In straight wire mode, update distance r based on probe distance to center wire
    if (mode === 'straight_wire') {
      const centerX = canvas.width * 0.44;
      const distMeters = Math.max(0.01, Math.abs(x - centerX) / 800);
      setProbeDistance(Math.min(0.25, distMeters));
    }
  };

  const handleMouseUp = () => {
    isDraggingProbeRef.current = false;
  };

  const handleLog = () => {
    const bVal = mode === 'solenoid' ? solenoidB : mode === 'straight_wire' ? straightWireB : externalB;
    onLogMeasurement({
      experiment: 'magnetic_field',
      parameters: {
        mode: mode,
        current: `${currentI.toFixed(2)} A`,
        turnsDensity: mode === 'solenoid' ? `${turnsDensity.toFixed(0)} turns/m` : 'N/A',
        coreMaterial: mode === 'solenoid' ? coreMaterial : 'N/A',
        magneticForce: mode === 'force_wire' ? `${magneticForce.toFixed(3)} N` : 'N/A',
      },
      variableName: mode === 'force_wire' ? tI18n('experiments.magnetic_field.variableForce') : tI18n('experiments.magnetic_field.variableFlux'),
      measuredValue: Number(mode === 'force_wire' ? magneticForce.toFixed(4) : (bVal * 1000).toFixed(3)),
      theoreticalValue: Number(mode === 'force_wire' ? magneticForce.toFixed(4) : (bVal * 1000).toFixed(3)),
      unit: mode === 'force_wire' ? 'N' : 'mT',
      equation: mode === 'solenoid' ? 'B = μ₀ · μᵣ · n · I' : mode === 'straight_wire' ? 'B = (μ₀ · I) / (2πr)' : 'F = I · L · B · sinθ',
      notes: `Mode: ${mode}, I=${currentI}A, B=${(bVal * 1000).toFixed(2)} mT (${(bVal * 10000).toFixed(1)} Gauss)`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="magnetic-field-simulation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Simulation Canvas */}
      <div className="lg:col-span-2 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Magnet  className="w-5 h-5"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {tI18n('experiments.magnetic_field.title')}
                </h3>
                <p className="text-sm text-zinc-400 font-mono">
                  {mode === 'solenoid' ? 'B = μ₀ μᵣ n I' : mode === 'straight_wire' ? 'B = (μ₀ I) / (2π r)' : 'F = I L B sin θ'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentI(3.0);
                  setProbePos({ x: 350, y: 190 });
                }}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                title={tI18n('experiments.magnetic_field.reset')}
              >
                <RotateCcw  className="w-4 h-4"/>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center items-center bg-zinc-950/70 rounded-xl border border-zinc-800/60 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={700}
              height={380}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
             className="cursor-crosshair max-w-full h-auto"/>
          </div>

          {/* Real-time Field Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.magnetic_field.currentLabel')}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {currentI.toFixed(2)} <span className="text-sm text-zinc-400">A</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.magnetic_field.fluxDensityLabel')}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {((mode === 'solenoid' ? solenoidB : straightWireB) * 1000).toFixed(2)} <span className="text-sm text-zinc-400">mT</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.magnetic_field.gaussLabel')}</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {((mode === 'solenoid' ? solenoidB : straightWireB) * 10000).toFixed(1)} <span className="text-sm text-zinc-400">G</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.magnetic_field.magneticForceLabel')}</div>
              <div className="text-base font-bold font-mono text-rose-400">
                {magneticForce.toFixed(3)} <span className="text-sm text-zinc-400">N</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theory Card */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 text-xs text-zinc-300 space-y-2">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Zap  className="w-4 h-4"/>
            <span>{tI18n('experiments.magnetic_field.lawsTitle')}</span>
          </div>
          <p>
            {tI18n('experiments.magnetic_field.lawsDesc')}
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
          <h4 className="text-sm font-bold text-zinc-200 pb-2 border-b border-zinc-800">
            {tI18n('experiments.magnetic_field.systemModeTitle')}
          </h4>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              onClick={() => setMode('solenoid')}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-semibold border ${
                mode === 'solenoid' ? 'bg-zinc-800 text-amber-400 border-amber-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {tI18n('experiments.magnetic_field.solenoid')}
            </button>
            <button
              onClick={() => setMode('straight_wire')}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-semibold border ${
                mode === 'straight_wire' ? 'bg-zinc-800 text-amber-400 border-amber-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {tI18n('experiments.magnetic_field.straightWire')}
            </button>
            <button
              onClick={() => setMode('force_wire')}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-semibold border ${
                mode === 'force_wire' ? 'bg-zinc-800 text-amber-400 border-amber-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {tI18n('experiments.magnetic_field.lorentzForce')}
            </button>
          </div>

          {/* Current Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.magnetic_field.currentLabel')}</span>
              <span className="font-mono text-amber-400 font-bold">{currentI.toFixed(1)} A</span>
            </div>
            <input
              type="range"
              min="-8.0"
              max="8.0"
              step="0.5"
              value={currentI}
              onChange={(e) => setCurrentI(parseFloat(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {mode === 'solenoid' && (
            <>
              {/* Turns Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{tI18n('experiments.magnetic_field.numTurnsLabel')}</span>
                  <span className="font-mono text-sky-400 font-bold">{numTurns}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="50"
                  value={numTurns}
                  onChange={(e) => setNumTurns(parseInt(e.target.value))}
                  className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* Core Material Selection */}
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-400">{tI18n('experiments.magnetic_field.coreMaterialLabel')}</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    onClick={() => setCoreMaterial('air')}
                    className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-center font-mono ${coreMaterial === 'air' ? 'bg-sky-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'}`}
                  >
                    <div>{tI18n('experiments.magnetic_field.air')}</div>
                    <div className="text-[10px]">μᵣ = 1</div>
                  </button>
                  <button
                    onClick={() => setCoreMaterial('ferrite')}
                    className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-center font-mono ${coreMaterial === 'ferrite' ? 'bg-sky-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'}`}
                  >
                    <div>{tI18n('experiments.magnetic_field.ferrite')}</div>
                    <div className="text-[10px]">μᵣ = 50</div>
                  </button>
                  <button
                    onClick={() => setCoreMaterial('iron')}
                    className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-center font-mono ${coreMaterial === 'iron' ? 'bg-sky-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'}`}
                  >
                    <div>{tI18n('experiments.magnetic_field.softIron')}</div>
                    <div className="text-[10px]">μᵣ = 200</div>
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'force_wire' && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{tI18n('experiments.magnetic_field.externalBLabel')}</span>
                  <span className="font-mono text-sky-400 font-bold">{externalB.toFixed(2)} T</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={externalB}
                  onChange={(e) => setExternalB(parseFloat(e.target.value))}
                  className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{tI18n('experiments.magnetic_field.wireAngleLabel')}</span>
                  <span className="font-mono text-emerald-400 font-bold">{fieldAngleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={fieldAngleDeg}
                  onChange={(e) => setFieldAngleDeg(parseFloat(e.target.value))}
                  className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Log Measurement Button */}
          <button
            onClick={handleLog}
           className={`min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${ logged ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>
              {logged ? tI18n('experiments.magnetic_field.loggedSuccess') : tI18n('experiments.magnetic_field.logBtn')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}