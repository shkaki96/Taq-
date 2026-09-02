import { Eye, Sparkles, AlertTriangle, Check, PlusCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';
import { OPTICAL_MEDIUMS } from '../data/physicsData';

interface Props {
  lang: Language;
  onLogMeasurement: (record: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function OpticsSim({ lang, onLogMeasurement }: Props) {
  const { t } = useTranslation();
  const common = (t('common', { returnObjects: true }) as any);
  const ctrl = (t('controls', { returnObjects: true }) as any);

  const getMediumName = (m: (typeof OPTICAL_MEDIUMS)[0]) => {
    return t(`opticalMediums.${m.id}.name`);
  };

  // Parameters
  const [medium1Id, setMedium1Id] = useState('air');
  const [medium2Id, setMedium2Id] = useState('glass');
  const [incidentAngleDeg, setIncidentAngleDeg] = useState(40);
  const [laserColor, setLaserColor] = useState('#22c55e'); // Green laser default
  const [isPrismMode, setIsPrismMode] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const med1 = OPTICAL_MEDIUMS.find((m) => m.id === medium1Id) || OPTICAL_MEDIUMS[0];
  const med2 = OPTICAL_MEDIUMS.find((m) => m.id === medium2Id) || OPTICAL_MEDIUMS[3];

  const n1 = med1.n;
  const n2 = med2.n;

  // Snell's Law calculations: n1 * sin(θ1) = n2 * sin(θ2) => sin(θ2) = (n1/n2) * sin(θ1)
  const theta1Rad = (incidentAngleDeg * Math.PI) / 180;
  const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad);

  // Critical Angle (only when n1 > n2)
  const hasCriticalAngle = n1 > n2;
  const criticalAngleDeg = hasCriticalAngle ? (Math.asin(n2 / n1) * 180) / Math.PI : null;

  // Check for Total Internal Reflection (TIR)
  const isTIR = sinTheta2 > 1.0;
  const theta2Rad = isTIR ? null : Math.asin(sinTheta2);
  const theta2Deg = theta2Rad !== null ? (theta2Rad * 180) / Math.PI : null;

  // Render Optics Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const midX = w / 2;
    const midY = h / 2;

    ctx.clearRect(0, 0, w, h);

    if (!isPrismMode) {
      // 1. Draw Medium 1 Background (Top Half)
      ctx.fillStyle = med1.color;
      ctx.fillRect(0, 0, w, midY);

      // Medium 2 Background (Bottom Half)
      ctx.fillStyle = med2.color;
      ctx.fillRect(0, midY, w, midY);

      // Interface Boundary Line
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Normal Line (العمود المقام)
      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(midX, 20);
      ctx.lineTo(midX, h - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Normal Label
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(t('experiments.optics.normalLine'), midX + 8, 35);

      // 2. Incident Ray (Top-Left towards midX, midY)
      const rayLen = 190;
      const srcX = midX - rayLen * Math.sin(theta1Rad);
      const srcY = midY - rayLen * Math.cos(theta1Rad);

      ctx.strokeStyle = laserColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = laserColor;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(midX, midY);
      ctx.stroke();

      // Laser Source Pointer device
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.arc(srcX, srcY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Incident Angle Arc (θ1)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(midX, midY, 50, -Math.PI / 2 - theta1Rad, -Math.PI / 2);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`θ₁ = ${incidentAngleDeg}°`, midX - 45, midY - 60);

      // 3. Reflected Ray (Top-Right)
      const reflX = midX + rayLen * Math.sin(theta1Rad);
      const reflY = midY - rayLen * Math.cos(theta1Rad);

      ctx.strokeStyle = isTIR ? laserColor : 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = isTIR ? 3 : 1.5;
      if (isTIR) {
        ctx.shadowColor = laserColor;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(reflX, reflY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Refracted Ray (Bottom-Right) if no TIR
      if (!isTIR && theta2Rad !== null && theta2Deg !== null) {
        const refrX = midX + rayLen * Math.sin(theta2Rad);
        const refrY = midY + rayLen * Math.cos(theta2Rad);

        ctx.strokeStyle = laserColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = laserColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(refrX, refrY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Refracted Angle Arc (θ2)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(midX, midY, 50, Math.PI / 2 - theta2Rad, Math.PI / 2);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`θ₂ = ${theta2Deg.toFixed(1)}°`, midX + 15, midY + 65);
      }
    } else {
      // Prism Dispersion Mode
      // Draw Triangular Prism
      const pTop = { x: midX, y: midY - 100 };
      const pLeft = { x: midX - 110, y: midY + 90 };
      const pRight = { x: midX + 110, y: midY + 90 };

      ctx.fillStyle = 'rgba(147, 197, 253, 0.25)';
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.stroke();

      // White Incident Ray
      const inX = midX - 220;
      const inY = midY + 20;
      const hitX = midX - 55;
      const hitY = midY + 5;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(inX, inY);
      ctx.lineTo(hitX, hitY);
      ctx.stroke();

      // Dispersed Spectrum inside and outside prism
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
      colors.forEach((col, idx) => {
        const spread = (idx - 3) * 6;
        const exitX = midX + 45 + spread * 0.4;
        const exitY = midY - 10 + spread * 1.5;

        // Inside prism
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hitX, hitY);
        ctx.lineTo(exitX, exitY);
        ctx.stroke();

        // Emerging ray
        const finalX = midX + 220;
        const finalY = exitY + (idx - 3) * 14 + 40;
        ctx.beginPath();
        ctx.moveTo(exitX, exitY);
        ctx.lineTo(finalX, finalY);
        ctx.stroke();
      });
    }
  }, [med1, med2, theta1Rad, theta2Rad, theta2Deg, incidentAngleDeg, isTIR, laserColor, isPrismMode, lang]);

  // Log measurement
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'optics',
      variableName: t('experiments.optics.varRefractionAngle'),
      measuredValue: theta2Deg !== null ? Number(theta2Deg.toFixed(2)) : 90,
      theoreticalValue: theta2Deg !== null ? Number(theta2Deg.toFixed(2)) : 90,
      unit: '°',
      parameters: {
        'Medium 1': `${getMediumName(med1)} (n=${n1})`,
        'Medium 2': `${getMediumName(med2)} (n=${n2})`,
        'Incident Angle (θ₁)': `${incidentAngleDeg}°`,
        'Critical Angle (θ_c)': criticalAngleDeg ? `${criticalAngleDeg.toFixed(1)}°` : 'None',
        TIR: isTIR ? 'Yes (Total Internal Reflection)' : 'No (Refraction Occurred)',
      },
      notes: isTIR ? t('experiments.optics.notesTIR') : t('experiments.optics.notesSnell'),
    });

    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 2500);
  };

  return (
    <div id="optics-simulation" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{t('experiments.optics.title')}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{t('experiments.optics.shortDesc')}</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrismMode(false)}
            className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              !isPrismMode ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Eye  className="w-3.5 h-3.5"/>
            <span>{t('experiments.optics.snellsInterface')}</span>
          </button>
          <button
            onClick={() => setIsPrismMode(true)}
            className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isPrismMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Sparkles  className="w-3.5 h-3.5"/>
            <span>{t('experiments.optics.prismMode')}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-inner flex flex-col items-center">
            {/* Total Internal Reflection Alert */}
            {isTIR && !isPrismMode && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-2 shadow-lg animate-bounce">
                <AlertTriangle  className="w-4 h-4 text-amber-400"/>
                {t('experiments.optics.totalInternalReflection')}
              </div>
            )}

            <canvas
              ref={canvasRef}
              id="optics-canvas"
              width={650}
              height={380}
             className="w-full h-[380px] select-none"/>

            {/* Medium Labels on Canvas View */}
            {!isPrismMode && (
              <div className="w-full border-t border-zinc-800/80 p-3 bg-zinc-900/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">{t('experiments.optics.medium1')}:</span>
                  <span className="font-semibold text-sky-300">{getMediumName(med1)} (n={n1})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">{t('experiments.optics.medium2')}:</span>
                  <span className="font-semibold text-amber-300">{getMediumName(med2)} (n={n2})</span>
                </div>
              </div>
            )}
          </div>

          {/* Optical Readout Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.optics.incidentAngle')} (θ₁)</span>
              <span className="text-xl font-bold text-sky-400 font-mono mt-0.5 block">{incidentAngleDeg}°</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{t('experiments.optics.laserRay')}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.optics.refractedAngle')} (θ₂)</span>
              <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">
                {isTIR ? 'TIR' : `${theta2Deg?.toFixed(1)}°`}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{t('experiments.optics.snellsLawSub')}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.optics.criticalAngle')} (θ_c)</span>
              <span className="text-xl font-bold text-purple-400 font-mono mt-0.5 block">
                {criticalAngleDeg ? `${criticalAngleDeg.toFixed(1)}°` : 'N/A'}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{t('experiments.optics.criticalAngleCond')}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400 block">{t('experiments.optics.reflectedAngle')} (θ_r)</span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">{incidentAngleDeg}°</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{t('experiments.optics.reflectionLawSub')}</span>
            </div>
          </div>
        </div>

        {/* Right: Medium Pickers & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t('experiments.optics.opticalMediaSelection')}
            </h3>

            {/* Medium 1 Select */}
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">{t('experiments.optics.medium1')}</label>
              <select
                id="select-medium1"
                value={medium1Id}
                onChange={(e) => setMedium1Id(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                {OPTICAL_MEDIUMS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMediumName(m)} (n = {m.n})
                  </option>
                ))}
              </select>
            </div>

            {/* Medium 2 Select */}
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">{t('experiments.optics.medium2')}</label>
              <select
                id="select-medium2"
                value={medium2Id}
                onChange={(e) => setMedium2Id(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                {OPTICAL_MEDIUMS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMediumName(m)} (n = {m.n})
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Angle Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{t('experiments.optics.incidentAngle')}</span>
                <span className="font-mono text-sky-400 font-medium">{incidentAngleDeg}°</span>
              </div>
              <input
                id="slider-optics-angle"
                type="range"
                min="0"
                max="85"
                step="1"
                value={incidentAngleDeg}
                onChange={(e) => setIncidentAngleDeg(Number(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-sky-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Laser Color Palette */}
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">{t('experiments.optics.laserColor')}</label>
              <div className="flex items-center gap-2">
                {[
                  { col: '#22c55e', name: 'Green 532nm' },
                  { col: '#ef4444', name: 'Red 650nm' },
                  { col: '#3b82f6', name: 'Blue 450nm' },
                  { col: '#a855f7', name: 'Violet 405nm' },
                ].map((c) => (
                  <button
                    key={c.col}
                    onClick={() => setLaserColor(c.col)}
                    className={`min-h-[44px] min-w-[44px] w-7 h-7 rounded-full border transition-transform ${
                      laserColor === c.col ? 'scale-110 ring-2 ring-white border-transparent' : 'border-zinc-700 opacity-70'
                    }`}
                    style={{ backgroundColor: c.col }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Log Measurement Button */}
          <button
            id="log-optics-btn"
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