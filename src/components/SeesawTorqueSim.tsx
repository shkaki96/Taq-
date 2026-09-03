import { Scale, ArrowRightLeft, BookmarkCheck, Sliders, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function SeesawTorqueSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Inputs
  const [leftMassKg, setLeftMassKg] = useState<number>(30); // kg
  const [leftDistM, setLeftDistM] = useState<number>(2.0); // m
  const [rightMassKg, setRightMassKg] = useState<number>(20); // kg
  const [rightDistM, setRightDistM] = useState<number>(3.0); // m
  const [logged, setLogged] = useState<boolean>(false);

  const g = 9.80665; // m/s²

  // Physics Calculations
  // Torques τ = m * g * r (N·m)
  const leftTorqueNm = leftMassKg * g * leftDistM;
  const rightTorqueNm = rightMassKg * g * rightDistM;
  const netTorqueNm = rightTorqueNm - leftTorqueNm; // positive = clockwise tilt right

  const isBalanced = Math.abs(netTorqueNm) < 1.0;
  // Maximum tilt angle clamped to ±15 degrees
  const tiltAngleDeg = isBalanced
    ? 0
    : Math.max(Math.min((netTorqueNm / 200) * 12, 15), -15);
  const tiltAngleRad = (tiltAngleDeg * Math.PI) / 180;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
        drawSeesaw(ctx, canvas.width, canvas.height);
      }
    }
  }, [leftMassKg, leftDistM, rightMassKg, rightDistM, tiltAngleDeg, isBalanced]);

  const drawSeesaw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Dark Canvas Background
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

    const groundY = height * 0.78;
    const fulcrumX = width * 0.5;
    const fulcrumY = groundY - 60;

    // Ground Platform
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Fulcrum Triangle (Pivot Base)
    ctx.fillStyle = '#52525b';
    ctx.beginPath();
    ctx.moveTo(fulcrumX, fulcrumY);
    ctx.lineTo(fulcrumX - 35, groundY);
    ctx.lineTo(fulcrumX + 35, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Fulcrum Pin Circle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(fulcrumX, fulcrumY, 7, 0, 2 * Math.PI);
    ctx.fill();

    // Seesaw Plank
    const plankLengthPx = 440;
    const maxPlankArmM = 3.5; // corresponds to plankLengthPx / 2
    const pxPerMeter = (plankLengthPx / 2) / maxPlankArmM;

    ctx.save();
    ctx.translate(fulcrumX, fulcrumY);
    ctx.rotate(tiltAngleRad);

    // Plank Bar
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-plankLengthPx / 2, -7, plankLengthPx, 14);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.strokeRect(-plankLengthPx / 2, -7, plankLengthPx, 14);

    // Ruler Meter Markings on Plank
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1;
    for (let m = 0.5; m <= 3.5; m += 0.5) {
      // Left tick
      const lx = -m * pxPerMeter;
      ctx.beginPath();
      ctx.moveTo(lx, -7);
      ctx.lineTo(lx, -13);
      ctx.stroke();

      // Right tick
      const rx = m * pxPerMeter;
      ctx.beginPath();
      ctx.moveTo(rx, -7);
      ctx.lineTo(rx, -13);
      ctx.stroke();
    }

    // Left Weight / Child Box
    const leftPx = -leftDistM * pxPerMeter;
    const leftBoxSize = Math.max(Math.min(leftMassKg * 0.9, 52), 26);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(leftPx - leftBoxSize / 2, -7 - leftBoxSize, leftBoxSize, leftBoxSize);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.strokeRect(leftPx - leftBoxSize / 2, -7 - leftBoxSize, leftBoxSize, leftBoxSize);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${leftMassKg}kg`, leftPx - 14, -7 - leftBoxSize / 2 + 4);

    // Right Weight / Child Box
    const rightPx = rightDistM * pxPerMeter;
    const rightBoxSize = Math.max(Math.min(rightMassKg * 0.9, 52), 26);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(rightPx - rightBoxSize / 2, -7 - rightBoxSize, rightBoxSize, rightBoxSize);
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.strokeRect(rightPx - rightBoxSize / 2, -7 - rightBoxSize, rightBoxSize, rightBoxSize);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${rightMassKg}kg`, rightPx - 14, -7 - rightBoxSize / 2 + 4);

    ctx.restore();

    // Distance Dimension Labels
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`r₁ = ${leftDistM}m (τ₁ = ${leftTorqueNm.toFixed(0)} N·m)`, fulcrumX - 210, 50);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`r₂ = ${rightDistM}m (τ₂ = ${rightTorqueNm.toFixed(0)} N·m)`, fulcrumX + 40, 50);

  };

  const handleBalancePreset = () => {
    // Make tau1 = tau2 by adjusting rightDistM
    const requiredDist = (leftMassKg * leftDistM) / rightMassKg;
    setRightDistM(Number(Math.min(Math.max(requiredDist, 0.5), 3.5).toFixed(2)));
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'seesaw_torque',
      variableName: 'Rotational Equilibrium Torque τ (Seesaw Balance)',
      measuredValue: Number(Math.abs(netTorqueNm).toFixed(2)),
      theoreticalValue: 0.0,
      unit: 'N·m',
      parameters: {
        'Left Mass m1': `${leftMassKg} kg`,
        'Left Distance r1': `${leftDistM} m`,
        'Left Torque τ1': `${leftTorqueNm.toFixed(1)} N·m`,
        'Right Mass m2': `${rightMassKg} kg`,
        'Right Distance r2': `${rightDistM} m`,
        'Right Torque τ2': `${rightTorqueNm.toFixed(1)} N·m`,
        'Net Torque Δτ': `${netTorqueNm.toFixed(1)} N·m`,
        'Tilt Angle θ': `${tiltAngleDeg.toFixed(1)}°`,
        'Equilibrium Status': isBalanced ? 'Balanced Equilibrium' : netTorqueNm > 0 ? 'Tilted Right' : 'Tilted Left',
      },
      equation: `τ = m·g·r, Στ = τ_right - τ_left = (${rightMassKg}·g·${rightDistM}) - (${leftMassKg}·g·${leftDistM}) = ${netTorqueNm.toFixed(1)} N·m`,
      notes: `Rotational torque balance experiment demonstrating the principle of moments and mechanical equilibrium on a seesaw lever.`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-rose-950/40 border border-emerald-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Scale  className="w-5 h-5 text-emerald-400"/>
            <span>{tI18n('experiments.seesaw_torque.title')}</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">{tI18n('experiments.seesaw_torque.desc')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBalancePreset}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5">
            <ArrowRightLeft  className="w-3.5 h-3.5 text-emerald-400"/>
            <span>{tI18n('experiments.seesaw_torque.autoBalance')}</span>
          </button>
          <button
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' }`}
          >
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.seesaw_torque.logged') : tI18n('experiments.seesaw_torque.log')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-emerald-400"/>
              {tI18n('experiments.seesaw_torque.controlsTitle')}
            </span>
          </div>

          {/* Left Mass Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.seesaw_torque.leftMass')}</span>
              <span className="font-mono text-rose-400 font-semibold">{leftMassKg} kg</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="2"
              value={leftMassKg}
              onChange={(e) => setLeftMassKg(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Left Distance Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.seesaw_torque.leftDist')}</span>
              <span className="font-mono text-rose-300 font-semibold">{leftDistM.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.5"
              step="0.1"
              value={leftDistM}
              onChange={(e) => setLeftDistM(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
          </div>

          {/* Right Mass Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.seesaw_torque.rightMass')}</span>
              <span className="font-mono text-emerald-400 font-semibold">{rightMassKg} kg</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="2"
              value={rightMassKg}
              onChange={(e) => setRightMassKg(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Right Distance Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.seesaw_torque.rightDist')}</span>
              <span className="font-mono text-emerald-300 font-semibold">{rightDistM.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.5"
              step="0.1"
              value={rightDistM}
              onChange={(e) => setRightDistM(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>

        {/* Canvas & Computed Bento Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={360}
             className="w-full h-[360px] rounded-xl bg-zinc-950 block shadow-inner"/>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Left Torque */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.seesaw_torque.leftTorque')}
              </span>
              <div className="text-xl font-bold font-mono text-rose-400">
                {leftTorqueNm.toFixed(0)} <span className="text-sm text-zinc-400">N·m</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">τ₁ = m₁·g·r₁</span>
            </div>

            {/* Right Torque */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.seesaw_torque.rightTorque')}
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {rightTorqueNm.toFixed(0)} <span className="text-sm text-zinc-400">N·m</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">τ₂ = m₂·g·r₂</span>
            </div>

            {/* Equilibrium State */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.seesaw_torque.eqState')}
              </span>
              <div className={`text-xs font-bold flex items-center gap-1 ${isBalanced ? 'text-emerald-400' : 'text-amber-400'}`}>
                <CheckCircle2  className="w-4 h-4"/>
                <span>{isBalanced ? tI18n('experiments.seesaw_torque.balanced') : tI18n('experiments.seesaw_torque.unbalanced')}</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Δτ = {netTorqueNm.toFixed(1)} N·m</span>
            </div>

            {/* Tilt Angle */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.seesaw_torque.tiltAngle')}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {tiltAngleDeg.toFixed(1)}°
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Max ±15°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}