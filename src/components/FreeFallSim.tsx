import { Shield, Wind, RotateCcw, Play, Check, PlusCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';
import { PLANETS } from '../data/physicsData';

interface Props {
  lang: Language;
  onLogMeasurement: (record: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function FreeFallSim({ lang, onLogMeasurement }: Props) {
  const { t } = useTranslation();
  const common = (t('common', { returnObjects: true }) as any);
  const ctrl = (t('controls', { returnObjects: true }) as any);

  const getPlanetName = (p: typeof PLANETS[0]) => {
    return t(`planets.${p.id}.name`);
  };

  // Parameters
  const [dropHeight, setDropHeight] = useState(45); // meters (10 to 100)
  const [gravity, setGravity] = useState(9.81); // m/s^2
  const [isVacuum, setIsVacuum] = useState(true);
  const [isDropping, setIsDropping] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  // Stats
  const [results, setResults] = useState({
    timeA: 0,
    timeB: 0,
    speedA: 0,
    speedB: 0,
  });

  const animRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Physics Ref
  const stateRef = useRef({
    yA: 0, // distance fallen (m)
    yB: 0,
    vA: 0, // velocity (m/s)
    vB: 0,
    t: 0,
    landedA: false,
    landedB: false,
    tA: 0,
    tB: 0,
  });

  // Theoretical Fall Time in Vacuum: t = sqrt(2h / g)
  const theoreticalVacuumTime = Math.sqrt((2 * dropHeight) / Math.max(gravity, 0.001));
  const theoreticalImpactSpeed = Math.sqrt(2 * gravity * dropHeight);

  const handleStartDrop = () => {
    stateRef.current = {
      yA: 0,
      yB: 0,
      vA: 0,
      vB: 0,
      t: 0,
      landedA: false,
      landedB: false,
      tA: 0,
      tB: 0,
    };
    setIsDropping(true);
    setHasLanded(false);
    setResults({ timeA: 0, timeB: 0, speedA: 0, speedB: 0 });
  };

  const handleReset = () => {
    setIsDropping(false);
    setHasLanded(false);
    stateRef.current = {
      yA: 0,
      yB: 0,
      vA: 0,
      vB: 0,
      t: 0,
      landedA: false,
      landedB: false,
      tA: 0,
      tB: 0,
    };
    setResults({ timeA: 0, timeB: 0, speedA: 0, speedB: 0 });
  };

  // Main Canvas & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.04);
      lastTimestamp = now;

      const s = stateRef.current;

      if (isDropping) {
        s.t += dt;

        // Object A (Heavy Iron Ball 5kg - low drag)
        if (!s.landedA) {
          const dragA = isVacuum ? 0 : 0.001 * s.vA * s.vA;
          const aA = gravity - dragA / 5.0;
          s.vA += aA * dt;
          s.yA += s.vA * dt;

          if (s.yA >= dropHeight) {
            s.yA = dropHeight;
            s.landedA = true;
            s.tA = s.t;
          }
        }

        // Object B (Feather 0.01kg - high drag in air, zero in vacuum)
        if (!s.landedB) {
          const dragB = isVacuum ? 0 : 0.08 * s.vB * s.vB;
          const aB = Math.max(0, gravity - dragB / 0.01);
          s.vB += aB * dt;
          s.yB += s.vB * dt;

          if (s.yB >= dropHeight) {
            s.yB = dropHeight;
            s.landedB = true;
            s.tB = s.t;
          }
        }

        if (s.landedA && s.landedB) {
          setIsDropping(false);
          setHasLanded(true);
          setResults({
            timeA: s.tA,
            timeB: s.tB,
            speedA: s.vA,
            speedB: s.vB,
          });
        }
      }

      // Draw Canvas
      const w = canvas.width;
      const h = canvas.height;
      const towerTopY = 40;
      const groundY = h - 40;
      const dropScale = (groundY - towerTopY) / dropHeight;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Vacuum Chamber Frame / Background
      if (isVacuum) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
        ctx.fillRect(40, 20, w - 80, h - 40);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(40, 20, w - 80, h - 40);
      }

      // 2. Tower & Height Scale
      const towerX = 90;
      ctx.fillStyle = '#27272a';
      ctx.fillRect(towerX - 25, towerTopY, 30, groundY - towerTopY);

      // Height ticks
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 1;
      for (let mark = 0; mark <= dropHeight; mark += 10) {
        const my = groundY - mark * dropScale;
        ctx.beginPath();
        ctx.moveTo(towerX - 30, my);
        ctx.lineTo(towerX + 5, my);
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${mark}m`, towerX - 35, my + 3);
      }

      // Ground Base
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // 3. Object A (Iron Ball) Lane
      const laneAX = w * 0.42;
      const ballY = towerTopY + s.yA * dropScale;

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(laneAX, ballY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('5kg', laneAX, ballY + 3);

      // 4. Object B (Feather) Lane
      const laneBX = w * 0.72;
      const featherY = towerTopY + s.yB * dropScale;

      // Feather Shape / Icon
      ctx.save();
      ctx.translate(laneBX, featherY);
      if (!isVacuum && isDropping) {
        ctx.rotate(Math.sin(s.t * 8) * 0.25); // Flutter effect in air
      }

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 18, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffe4e6';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [dropHeight, gravity, isVacuum, isDropping]);

  // Log measurement
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'freefall',
      variableName: t('experiments.freefall.varFreeFallTime'),
      measuredValue: Number(results.timeA.toFixed(3)) || Number(theoreticalVacuumTime.toFixed(3)),
      theoreticalValue: Number(theoreticalVacuumTime.toFixed(3)),
      unit: 's',
      parameters: {
        'Drop Height': `${dropHeight} m`,
        Gravity: `${gravity} m/s²`,
        Environment: isVacuum ? 'Vacuum (Zero Drag)' : 'Air (Drag Active)',
        'Object A (Iron Ball)': `${results.timeA.toFixed(2)}s | ${results.speedA.toFixed(1)} m/s`,
        'Object B (Feather)': `${results.timeB.toFixed(2)}s | ${results.speedB.toFixed(1)} m/s`,
      },
      notes: isVacuum ? t('experiments.freefall.vacuumNote') : t('experiments.freefall.airNote'),
    });

    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 2500);
  };

  return (
    <div id="freefall-simulation" className="space-y-6">
      {/* Header & Planets */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{t('experiments.freefall.title')}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{t('experiments.freefall.shortDesc')}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">{ctrl.planetPreset}:</span>
          <div className="flex flex-wrap gap-1.5">
            {PLANETS.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => setGravity(p.g)}
                className={`min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1.5 ${
                  Math.abs(gravity - p.g) < 0.05
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-medium'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
                }`}
              >
                <span>{p.icon}</span>
                <span>{getPlanetName(p)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Drop Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-inner flex flex-col items-center">
            <canvas
              ref={canvasRef}
              id="freefall-canvas"
              width={650}
              height={380}
             className="w-full h-[380px] select-none"/>

            {/* Bottom Toolbar */}
            <div className="w-full border-t border-zinc-800/80 p-3 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Vacuum vs Air Toggle */}
              <div className="flex rounded-lg bg-zinc-800 p-0.5 border border-zinc-700">
                <button
                  onClick={() => setIsVacuum(true)}
                  className={`min-h-[44px] min-w-[44px] px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isVacuum ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Shield  className="w-3.5 h-3.5"/>
                  <span>{t('experiments.freefall.vacuum')}</span>
                </button>
                <button
                  onClick={() => setIsVacuum(false)}
                  className={`min-h-[44px] min-w-[44px] px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    !isVacuum ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Wind  className="w-3.5 h-3.5"/>
                  <span>{t('experiments.freefall.air')}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="freefall-reset-btn"
                  onClick={handleReset}
                 className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg border bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-1">
                  <RotateCcw  className="w-3.5 h-3.5"/>
                  <span>{ctrl.reset}</span>
                </button>
                <button
                  id="freefall-drop-btn"
                  onClick={handleStartDrop}
                  disabled={isDropping}
                 className="min-h-[44px] min-w-[44px] px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all">
                  <Play  className="w-3.5 h-3.5"/>
                  <span>{t('experiments.freefall.drop')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Historical Galileo Quote */}
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-xs italic text-zinc-400 text-center">
            {t('experiments.freefall.galileoQuote')}
          </div>
        </div>

        {/* Right: Height Controls & Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t('experiments.freefall.settingsTitle')}
            </h3>

            {/* Height Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.freefall.dropHeight')}</span>
                <span className="font-mono text-sky-400 font-medium">{dropHeight} m</span>
              </div>
              <input
                id="slider-freefall-height"
                type="range"
                min="10"
                max="100"
                step="5"
                value={dropHeight}
                onChange={(e) => setDropHeight(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Theoretical Reference Box */}
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2 text-xs">
              <span className="text-zinc-400 block font-medium">
                {t('experiments.freefall.theoreticalVacuumTitle')}
              </span>
              <div className="flex justify-between text-sky-300 font-mono">
                <span>t_theory = √(2h/g):</span>
                <span>{theoreticalVacuumTime.toFixed(3)} s</span>
              </div>
              <div className="flex justify-between text-emerald-300 font-mono">
                <span>v_impact = √(2gh):</span>
                <span>{theoreticalImpactSpeed.toFixed(2)} m/s</span>
              </div>
            </div>

            {/* Recorded Fall Results */}
            {hasLanded && (
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <span className="text-zinc-300 font-medium block">
                  {t('experiments.freefall.recordedResultsTitle')}
                </span>
                <div className="flex justify-between text-zinc-400">
                  <span>{t('experiments.freefall.timeA')}:</span>
                  <span className="font-mono text-sky-400 font-bold">{results.timeA.toFixed(3)} s</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{t('experiments.freefall.timeB')}:</span>
                  <span className="font-mono text-rose-400 font-bold">{results.timeB.toFixed(3)} s</span>
                </div>
              </div>
            )}
          </div>

          {/* Log Button */}
          <button
            id="log-freefall-btn"
            onClick={handleLog}
           className="min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all active:scale-[0.98]">
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