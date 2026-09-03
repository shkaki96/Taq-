import { CircleDot, Pause, Play, RotateCcw, Compass, BookmarkCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function ArcLengthSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Parameters
  const [radius, setRadius] = useState<number>(1.2); // meters (0.2 to 2.5)
  const [angleDeg, setAngleDeg] = useState<number>(120); // degrees (0 to 720)
  const [angularVelocity, setAngularVelocity] = useState<number>(0); // rad/s (0 to 10)
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [showUnrolled, setShowUnrolled] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Derived mathematical values
  const angleRad = (angleDeg * Math.PI) / 180;
  const theoreticalArcLength = radius * angleRad; // s = r * theta
  const circumference = 2 * Math.PI * radius;
  const sectorArea = 0.5 * radius * radius * angleRad;
  const linearSpeed = radius * Math.abs(angularVelocity);
  const centripetalAcc = angularVelocity * angularVelocity * radius;

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const angleDegRef = useRef<number>(angleDeg);
  angleDegRef.current = angleDeg;

  // Handle continuous rotation
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRotating && angularVelocity !== 0) {
        const deltaDeg = (angularVelocity * 180 / Math.PI) * dt;
        setAngleDeg((prev) => (prev + deltaDeg) % 720);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRotating, angularVelocity]);

  // Draw simulation on canvas
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Main Circle Center
    const centerX = width * 0.38;
    const centerY = height * 0.52;
    const scale = 75; // pixels per meter
    const rPix = radius * scale;

    // Draw full reference circle (faint)
    ctx.beginPath();
    ctx.arc(centerX, centerY, rPix, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw coordinate axes
    ctx.beginPath();
    ctx.moveTo(centerX - rPix - 30, centerY);
    ctx.lineTo(centerX + rPix + 30, centerY);
    ctx.moveTo(centerX, centerY - rPix - 30);
    ctx.lineTo(centerX, centerY + rPix + 30);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw filled sector for angle
    const currentRad = (angleDeg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, rPix, 0, -currentRad, true); // Canvas y is inverted
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
    ctx.fill();

    // Draw initial reference radius (at 0 rad / positive x axis)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + rPix, centerY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw current terminal arm radius (at angle theta)
    const endX = centerX + rPix * Math.cos(-currentRad);
    const endY = centerY + rPix * Math.sin(-currentRad);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw highlighted Arc (s = r * theta)
    ctx.beginPath();
    ctx.arc(centerX, centerY, rPix, 0, -currentRad, true);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Draw angle arc indicator near center
    const arcIndicatorR = Math.min(35, rPix * 0.4);
    ctx.beginPath();
    ctx.arc(centerX, centerY, arcIndicatorR, 0, -Math.min(currentRad, Math.PI * 2), true);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Angle label at center
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const midAngle = -currentRad / 2;
    ctx.fillText(`θ = ${(angleRad / Math.PI).toFixed(2)}π`, centerX + (arcIndicatorR + 18) * Math.cos(midAngle), centerY + (arcIndicatorR + 18) * Math.sin(midAngle));

    // Center pivot point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    // Draggable handle at arc tip
    ctx.beginPath();
    ctx.arc(endX, endY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Arc length label on arc midpoint
    const arcMidX = centerX + (rPix + 18) * Math.cos(midAngle);
    const arcMidY = centerY + (rPix + 18) * Math.sin(midAngle);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`s = ${theoreticalArcLength.toFixed(2)} m`, arcMidX, arcMidY);

    // Radius label along baseline
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(`r = ${radius.toFixed(2)} m`, centerX + rPix / 2, centerY + 18);

    // Velocity & Acceleration vectors if rotating or moving
    if (showVectors && (angularVelocity !== 0 || isRotating)) {
      // Tangential velocity vector (perpendicular to radius)
      const tangentAngle = -currentRad - Math.PI / 2;
      const vLen = Math.min(linearSpeed * 20, 60);
      const vEndX = endX + vLen * Math.cos(tangentAngle);
      const vEndY = endY + vLen * Math.sin(tangentAngle);

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(vEndX, vEndY);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Arrowhead for v
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(vEndX, vEndY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`v = ${linearSpeed.toFixed(2)} m/s`, vEndX + 10, vEndY);
    }

    // Unrolled Straight Track Comparison on Right side
    if (showUnrolled) {
      const trackStartX = width * 0.72;
      const trackStartY = height * 0.82;
      const unrolledHeight = theoreticalArcLength * scale;

      // Track axis line (straight vertical ruler)
      ctx.beginPath();
      ctx.moveTo(trackStartX, trackStartY);
      ctx.lineTo(trackStartX, Math.max(30, trackStartY - 3.5 * scale));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ruler ticks
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      for (let m = 0; m <= 3.5; m += 0.5) {
        const tickY = trackStartY - m * scale;
        ctx.beginPath();
        ctx.moveTo(trackStartX - 5, tickY);
        ctx.lineTo(trackStartX + 5, tickY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();
        ctx.fillText(`${m.toFixed(1)}m`, trackStartX - 8, tickY + 3);
      }

      // Highlighted unrolled arc bar
      const clampedBarHeight = Math.min(unrolledHeight, trackStartY - 20);
      ctx.beginPath();
      ctx.moveTo(trackStartX, trackStartY);
      ctx.lineTo(trackStartX, trackStartY - clampedBarHeight);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Top marker of unrolled arc
      ctx.beginPath();
      ctx.arc(trackStartX, trackStartY - clampedBarHeight, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`s = ${theoreticalArcLength.toFixed(2)} m`, trackStartX + 12, trackStartY - clampedBarHeight + 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(tI18n('experiments.arc_length.unrolledTrackLabel'), trackStartX - 40, trackStartY + 25);
    }
  }, [radius, angleDeg, angularVelocity, isRotating, showUnrolled, showVectors, lang]);

  // Dragging on canvas to adjust angle
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = canvas.width * 0.38;
    const centerY = canvas.height * 0.52;

    const dx = x - centerX;
    const dy = centerY - y; // inverted y
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If click is near circle perimeter
    if (Math.abs(dist - radius * 75) < 35 || dist < radius * 75 + 20) {
      isDraggingRef.current = true;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      setAngleDeg(Math.round(angle));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = canvas.width * 0.38;
    const centerY = canvas.height * 0.52;

    const dx = x - centerX;
    const dy = centerY - y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    setAngleDeg(Math.round(angle));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Preset Angle Handlers
  const setPresetAngle = (radVal: number) => {
    setAngleDeg(Math.round((radVal * 180) / Math.PI));
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'arc_length',
      parameters: {
        radius: `${radius.toFixed(2)} m`,
        angleDeg: `${angleDeg.toFixed(1)}°`,
        angleRad: `${angleRad.toFixed(3)} rad`,
        angularVelocity: `${angularVelocity.toFixed(2)} rad/s`,
      },
      variableName: 'Arc Length (s)',
      measuredValue: Number(theoreticalArcLength.toFixed(3)),
      theoreticalValue: Number((radius * angleRad).toFixed(3)),
      unit: 'm',
      equation: 's = r · θ',
      notes: `r=${radius}m, θ=${angleRad.toFixed(2)}rad, s=${theoreticalArcLength.toFixed(2)}m, v=${linearSpeed.toFixed(2)}m/s`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="arc-length-simulation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simulation Stage */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl overflow-hidden">
          {/* Header Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <CircleDot  className="w-5 h-5"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {tI18n('experiments.arc_length.subTitle')}
                </h3>
                <p className="text-sm text-zinc-400">
                  {tI18n('experiments.arc_length.dragPrompt')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isRotating
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                {isRotating ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5 text-emerald-400"/>}
                <span>{isRotating ? tI18n('experiments.arc_length.pause') : tI18n('experiments.arc_length.rotate')}</span>
              </button>

              <button className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                title="Reset"
              >
                <RotateCcw  className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* Interactive Canvas */}
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

          {/* Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.arc_length.angleRadLabel')}</div>
              <div className="text-lg font-bold font-mono text-sky-400">
                {angleRad.toFixed(3)} <span className="text-sm text-zinc-400">rad ({(angleRad / Math.PI).toFixed(2)}π)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.arc_length.arcLengthLabel')}</div>
              <div className="text-lg font-bold font-mono text-amber-400">
                {theoreticalArcLength.toFixed(3)} <span className="text-sm text-zinc-400">m</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.arc_length.linearVelLabel')}</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {linearSpeed.toFixed(2)} <span className="text-sm text-zinc-400">m/s</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.arc_length.sectorAreaLabel')}</div>
              <div className="text-lg font-bold font-mono text-purple-400">
                {sectorArea.toFixed(3)} <span className="text-sm text-zinc-400">m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mathematical Explanation Banner */}
        <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-800/30 text-xs text-zinc-300 space-y-2">
          <div className="font-semibold text-sky-300 flex items-center gap-1.5">
            <Compass  className="w-4 h-4"/>
            <span>{tI18n('experiments.arc_length.physicsDefTitle')}</span>
          </div>
          <p>{tI18n('experiments.arc_length.physicsDefText')}</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
          <h4 className="text-sm font-bold text-zinc-200 pb-2 border-b border-zinc-800">
            {tI18n('experiments.arc_length.controlsTitle')}
          </h4>

          {/* Radius Control */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.arc_length.radiusLabel')}</span>
              <span className="font-mono text-sky-400 font-bold">{radius.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.2"
              step="0.05"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Angle in Degrees Control */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.arc_length.angleDegLabel')}</span>
              <span className="font-mono text-amber-400 font-bold">{angleDeg.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={angleDeg}
              onChange={(e) => setAngleDeg(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Preset Radian Angle Buttons */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">{tI18n('experiments.arc_length.standardPresetsLabel')}</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button onClick={() => setPresetAngle(Math.PI / 6)} className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-mono">π/6 (30°)</button>
              <button onClick={() => setPresetAngle(Math.PI / 4)} className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-mono">π/4 (45°)</button>
              <button onClick={() => setPresetAngle(Math.PI / 3)} className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-mono">π/3 (60°)</button>
              <button onClick={() => setPresetAngle(Math.PI / 2)} className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-mono">π/2 (90°)</button>
              <button onClick={() => setPresetAngle(Math.PI)} className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-mono">π (180°)</button>
              <button onClick={() => setPresetAngle(2 * Math.PI)} className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-mono">2π (360°)</button>
            </div>
          </div>

          {/* Angular Velocity Control */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.arc_length.angularVelLabel')}</span>
              <span className="font-mono text-emerald-400 font-bold">{angularVelocity.toFixed(1)} rad/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.2"
              value={angularVelocity}
              onChange={(e) => setAngularVelocity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Visual Toggles */}
          <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs">
            <label className="min-h-[44px] flex items-center gap-2 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={showUnrolled}
                onChange={(e) => setShowUnrolled(e.target.checked)}
                className="rounded border-zinc-700 text-sky-500 focus:ring-0 bg-zinc-800"
              />
              <span>{tI18n('experiments.arc_length.showUnrolledLabel')}</span>
            </label>

            <label className="min-h-[44px] flex items-center gap-2 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={showVectors}
                onChange={(e) => setShowVectors(e.target.checked)}
                className="rounded border-zinc-700 text-emerald-500 focus:ring-0 bg-zinc-800"
              />
              <span>{tI18n('experiments.arc_length.showVectorsLabel')}</span>
            </label>
          </div>

          {/* Log Measurement Button */}
          <button className={`min-h-[44px] min-w-[44px] min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${ logged ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-indigo-900/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.arc_length.loggedMsg') : tI18n('experiments.arc_length.logBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}