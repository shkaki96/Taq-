import { Zap, BookmarkCheck, Sliders } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function StaticBalloonsSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Inputs: Charges in microCoulombs (μC)
  const [charge1MicroC, setCharge1MicroC] = useState<number>(-4.0); // μC
  const [charge2MicroC, setCharge2MicroC] = useState<number>(-4.0); // μC
  const [distanceCm, setDistanceCm] = useState<number>(25); // cm
  const [balloonMassG, setBalloonMassG] = useState<number>(3.0); // grams
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Coulomb constant k = 8.98755e9 N·m²/C²
  const kCoulomb = 8.98755e9;

  // Convert to SI units
  const q1 = charge1MicroC * 1e-6; // C
  const q2 = charge2MicroC * 1e-6; // C
  const rM = Math.max(distanceCm / 100, 0.05); // m
  const massKg = balloonMassG * 1e-3; // kg
  const g = 9.80665; // m/s²
  const gravityForceN = massKg * g;

  // Coulomb force F = k * |q1 * q2| / r²
  const coulombForceN = (kCoulomb * Math.abs(q1 * q2)) / (rM * rM);
  const isRepulsive = charge1MicroC * charge2MicroC > 0;
  const isAttractive = charge1MicroC * charge2MicroC < 0;
  const isNeutral = charge1MicroC === 0 || charge2MicroC === 0;

  // String deflection angle: tan(θ) = F_electric / (m * g)
  const deflectionAngleRad = Math.atan(coulombForceN / gravityForceN);
  const deflectionAngleDeg = (deflectionAngleRad * 180) / Math.PI;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          drawCoulombBalloons(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [charge1MicroC, charge2MicroC, distanceCm, balloonMassG, coulombForceN, isRepulsive, isAttractive, isRunning]);

  const drawCoulombBalloons = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Background & Grid
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.8;
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

    // Ceiling Mount
    const ceilingY = 35;
    ctx.fillStyle = '#27272a';
    ctx.fillRect(width * 0.15, ceilingY - 10, width * 0.7, 10);
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.15, ceilingY - 10, width * 0.7, 10);

    const centerX = width * 0.5;
    const stringLength = 190;
    const baseSeparation = (distanceCm / 60) * 160;

    // Suspension anchors on ceiling
    const anchor1X = centerX - baseSeparation / 2;
    const anchor2X = centerX + baseSeparation / 2;

    // String angular deflection
    const sign = isRepulsive ? 1 : isAttractive ? -1 : 0;
    const maxDeflectPx = Math.min(Math.sin(deflectionAngleRad) * stringLength * sign, baseSeparation * 0.45);

    const balloon1X = anchor1X - maxDeflectPx;
    const balloon1Y = ceilingY + Math.cos(deflectionAngleRad) * stringLength;

    const balloon2X = anchor2X + maxDeflectPx;
    const balloon2Y = ceilingY + Math.cos(deflectionAngleRad) * stringLength;

    // Draw Suspension Strings
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(anchor1X, ceilingY);
    ctx.lineTo(balloon1X, balloon1Y - 32);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(anchor2X, ceilingY);
    ctx.lineTo(balloon2X, balloon2Y - 32);
    ctx.stroke();

    // Draw Electric Field Lines between balloons
    if (!isNeutral) {
      const fieldCount = 5;
      ctx.strokeStyle = isAttractive ? 'rgba(56, 189, 248, 0.4)' : 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);

      for (let i = 0; i < fieldCount; i++) {
        const offset = (i - (fieldCount - 1) / 2) * 18;
        ctx.beginPath();
        if (isAttractive) {
          // Curved attractive field lines connecting both
          ctx.moveTo(balloon1X, balloon1Y + offset);
          ctx.quadraticCurveTo(centerX, balloon1Y + offset * 1.8, balloon2X, balloon2Y + offset);
        } else {
          // Repelling field curves bending away
          ctx.moveTo(balloon1X, balloon1Y + offset);
          ctx.quadraticCurveTo(anchor1X - 30, balloon1Y + offset * 1.5, balloon1X - 40, balloon1Y + offset * 2);
          ctx.moveTo(balloon2X, balloon2Y + offset);
          ctx.quadraticCurveTo(anchor2X + 30, balloon2Y + offset * 1.5, balloon2X + 40, balloon2Y + offset * 2);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw Balloon 1 (Blue / Negative or Red / Positive)
    const b1Color = charge1MicroC < 0 ? '#38bdf8' : charge1MicroC > 0 ? '#f43f5e' : '#71717a';
    ctx.fillStyle = b1Color;
    ctx.beginPath();
    ctx.ellipse(balloon1X, balloon1Y, 28, 34, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Balloon 1 Knot
    ctx.fillStyle = b1Color;
    ctx.beginPath();
    ctx.moveTo(balloon1X - 4, balloon1Y - 34);
    ctx.lineTo(balloon1X + 4, balloon1Y - 34);
    ctx.lineTo(balloon1X, balloon1Y - 30);
    ctx.fill();

    // Balloon 1 Charge Signs
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(charge1MicroC < 0 ? '−' : charge1MicroC > 0 ? '+' : '0', balloon1X - 5, balloon1Y + 5);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`q₁ = ${charge1MicroC > 0 ? '+' : ''}${charge1MicroC} μC`, balloon1X - 32, balloon1Y + 52);

    // Draw Balloon 2 (Yellow / Red / Blue)
    const b2Color = charge2MicroC < 0 ? '#38bdf8' : charge2MicroC > 0 ? '#f43f5e' : '#71717a';
    ctx.fillStyle = b2Color;
    ctx.beginPath();
    ctx.ellipse(balloon2X, balloon2Y, 28, 34, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Balloon 2 Knot
    ctx.fillStyle = b2Color;
    ctx.beginPath();
    ctx.moveTo(balloon2X - 4, balloon2Y - 34);
    ctx.lineTo(balloon2X + 4, balloon2Y - 34);
    ctx.lineTo(balloon2X, balloon2Y - 30);
    ctx.fill();

    // Balloon 2 Charge Signs
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(charge2MicroC < 0 ? '−' : charge2MicroC > 0 ? '+' : '0', balloon2X - 5, balloon2Y + 5);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`q₂ = ${charge2MicroC > 0 ? '+' : ''}${charge2MicroC} μC`, balloon2X - 32, balloon2Y + 52);

    // Force Vectors on Balloons
    if (!isNeutral) {
      const forceVecLen = Math.min(coulombForceN * 40, 60);
      const f1Dir = isRepulsive ? -1 : 1;
      const f2Dir = isRepulsive ? 1 : -1;

      // Force Vector 1
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(balloon1X, balloon1Y);
      ctx.lineTo(balloon1X + f1Dir * forceVecLen, balloon1Y);
      ctx.stroke();

      // Arrowhead 1
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(balloon1X + f1Dir * (forceVecLen + 6), balloon1Y);
      ctx.lineTo(balloon1X + f1Dir * forceVecLen, balloon1Y - 4);
      ctx.lineTo(balloon1X + f1Dir * forceVecLen, balloon1Y + 4);
      ctx.closePath();
      ctx.fill();

      // Force Vector 2
      ctx.beginPath();
      ctx.moveTo(balloon2X, balloon2Y);
      ctx.lineTo(balloon2X + f2Dir * forceVecLen, balloon2Y);
      ctx.stroke();

      // Arrowhead 2
      ctx.beginPath();
      ctx.moveTo(balloon2X + f2Dir * (forceVecLen + 6), balloon2Y);
      ctx.lineTo(balloon2X + f2Dir * forceVecLen, balloon2Y - 4);
      ctx.lineTo(balloon2X + f2Dir * forceVecLen, balloon2Y + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`F = ${coulombForceN.toFixed(3)} N`, centerX - 35, ceilingY + 30);
    }

    // Distance Dimension Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(balloon1X, balloon1Y + 68);
    ctx.lineTo(balloon2X, balloon2Y + 68);
    ctx.stroke();

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '10px monospace';
    ctx.fillText(`r = ${distanceCm} cm`, centerX - 25, balloon1Y + 82);
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'static_balloons',
      variableName: tI18n('experiments.static_balloons.variableName'),
      measuredValue: Number(coulombForceN.toFixed(4)),
      theoreticalValue: Number(((kCoulomb * Math.abs(q1 * q2)) / (rM * rM)).toFixed(4)),
      unit: 'N',
      parameters: {
        'Balloon 1 Charge q1': `${charge1MicroC} μC`,
        'Balloon 2 Charge q2': `${charge2MicroC} μC`,
        'Separation Distance r': `${distanceCm} cm (${rM} m)`,
        'Balloon Mass m': `${balloonMassG} g`,
        'Interaction Type': isRepulsive ? tI18n('experiments.static_balloons.repulsion') : isAttractive ? tI18n('experiments.static_balloons.attraction') : tI18n('experiments.static_balloons.neutral'),
        'String Deflection Angle θ': `${deflectionAngleDeg.toFixed(2)}°`,
      },
      equation: `F = k · |q1 · q2| / r² = (8.99e9 · |${charge1MicroC}μC · ${charge2MicroC}μC|) / (${rM} m)² = ${coulombForceN.toFixed(4)} N`,
      notes: tI18n('experiments.static_balloons.notes'),
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-950/40 via-zinc-900 to-indigo-950/40 border border-yellow-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Zap  className="w-5 h-5 text-yellow-400"/>
            <span>
              {tI18n('experiments.static_balloons.title')}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.static_balloons.desc')}
          </p>
        </div>

        <button
          onClick={handleLog}
          className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-600/30' }`}
        >
          <BookmarkCheck  className="w-4 h-4"/>
          <span>{logged ? tI18n('experiments.static_balloons.loggedSuccess') : tI18n('experiments.static_balloons.logData')}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-yellow-400"/>
              {tI18n('experiments.static_balloons.paramsTitle')}
            </span>
          </div>

          {/* Balloon 1 Charge Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.static_balloons.charge1')}</span>
              <span className={`font-mono font-semibold ${charge1MicroC < 0 ? 'text-sky-400' : charge1MicroC > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {charge1MicroC > 0 ? '+' : ''}{charge1MicroC.toFixed(1)} μC
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={charge1MicroC}
              onChange={(e) => setCharge1MicroC(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Balloon 2 Charge Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.static_balloons.charge2')}</span>
              <span className={`font-mono font-semibold ${charge2MicroC < 0 ? 'text-sky-400' : charge2MicroC > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {charge2MicroC > 0 ? '+' : ''}{charge2MicroC.toFixed(1)} μC
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={charge2MicroC}
              onChange={(e) => setCharge2MicroC(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Distance Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.static_balloons.distance')}</span>
              <span className="font-mono text-zinc-200 font-semibold">{distanceCm} cm</span>
            </div>
            <input
              type="range"
              min="8"
              max="50"
              step="1"
              value={distanceCm}
              onChange={(e) => setDistanceCm(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          {/* Balloon Mass */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.static_balloons.mass')}</span>
              <span className="font-mono text-zinc-300 font-semibold">{balloonMassG.toFixed(1)} g</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={balloonMassG}
              onChange={(e) => setBalloonMassG(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-500"
            />
          </div>

          {/* Quick Charge Presets */}
          <div>
            <span className="text-[10px] text-zinc-400 block mb-1.5">
              {tI18n('experiments.static_balloons.presets')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setCharge1MicroC(-5);
                  setCharge2MicroC(-5);
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold"
              >
                {tI18n('experiments.static_balloons.presetRepel')}
              </button>
              <button
                onClick={() => {
                  setCharge1MicroC(-5);
                  setCharge2MicroC(5);
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold"
              >
                {tI18n('experiments.static_balloons.presetAttract')}
              </button>
            </div>
          </div>
        </div>

        {/* Canvas & Live Computed Metrics */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={360}
             className="w-full h-[360px] rounded-xl bg-zinc-950 block shadow-inner"/>
          </div>

          {/* Computed Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Coulomb Force F */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.static_balloons.forceLabel')}
              </span>
              <div className="text-xl font-bold font-mono text-yellow-400">
                {coulombForceN.toFixed(4)} <span className="text-sm text-zinc-400">N</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">F = k·|q1·q2|/r²</span>
            </div>

            {/* Interaction State */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.static_balloons.interactionType')}
              </span>
              <div className={`text-sm font-bold font-mono ${isRepulsive ? 'text-rose-400' : isAttractive ? 'text-sky-400' : 'text-zinc-400'}`}>
                {isRepulsive ? tI18n('experiments.static_balloons.repulsion') : isAttractive ? tI18n('experiments.static_balloons.attraction') : tI18n('experiments.static_balloons.neutral')}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">q1·q2 {isRepulsive ? '> 0' : isAttractive ? '< 0' : '= 0'}</span>
            </div>

            {/* Deflection Angle */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.static_balloons.deflectionAngle')}
              </span>
              <div className="text-xl font-bold font-mono text-indigo-400">
                {deflectionAngleDeg.toFixed(1)}°
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">tan(θ) = F_e / mg</span>
            </div>

            {/* Gravity Force mg */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.static_balloons.weightForce')}
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {gravityForceN.toFixed(3)} <span className="text-sm text-zinc-400">N</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">m = {balloonMassG} g</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}