import { Eye, BookmarkCheck, Sliders } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function ThinLensesSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Parameters
  const [lensType, setLensType] = useState<'convex' | 'concave'>('convex');
  const [focalLengthCm, setFocalLengthCm] = useState<number>(20); // cm (positive magnitude)
  const [objectDistanceCm, setObjectDistanceCm] = useState<number>(35); // cm (do)
  const [objectHeightCm, setObjectHeightCm] = useState<number>(15); // cm (ho)
  const [showPrincipalRays, setShowPrincipalRays] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Geometric Optics Calculations
  const isConvex = lensType === 'convex';
  const signedFocalLengthCm = isConvex ? focalLengthCm : -focalLengthCm;

  // Lens Power in Diopters: P = 1 / f(m) = 100 / f(cm)
  const lensPowerDiopters = signedFocalLengthCm !== 0 ? 100 / signedFocalLengthCm : 0;

  // Thin Lens Equation: 1/f = 1/do + 1/di => di = (f * do) / (do - f)
  const denom = objectDistanceCm - signedFocalLengthCm;
  const isAtFocus = isConvex && Math.abs(denom) < 0.1;
  const imageDistanceCm = isAtFocus ? 9999 : (signedFocalLengthCm * objectDistanceCm) / denom;

  // Magnification m = - di / do
  const magnification = isAtFocus ? 999 : -imageDistanceCm / objectDistanceCm;
  const imageHeightCm = isAtFocus ? 999 : objectHeightCm * magnification;

  // Image Characteristics
  const isReal = imageDistanceCm > 0 && !isAtFocus;
  const isInverted = magnification < 0 && !isAtFocus;
  const isEnlarged = Math.abs(magnification) > 1.05 && !isAtFocus;
  const isReduced = Math.abs(magnification) < 0.95 && !isAtFocus;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dark Background Grid
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

    // Optical Bench Coordinate System
    // Lens Optical Center O is at (lensX, centerY)
    const lensX = width * 0.50;
    const centerY = height * 0.52;
    const scale = 3.6; // pixels per cm

    // Draw Principal Optical Axis
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, centerY);
    ctx.lineTo(width - 20, centerY);
    ctx.stroke();

    // Focal points:
    // Left F1, 2F1 (negative side)
    const f1PixelX = lensX - focalLengthCm * scale;
    const f1TwoPixelX = lensX - 2 * focalLengthCm * scale;
    // Right F2, 2F2 (positive side)
    const f2PixelX = lensX + focalLengthCm * scale;
    const f2TwoPixelX = lensX + 2 * focalLengthCm * scale;

    // Draw Glass Lens Element
    const lensH = 260;
    const lensW = isConvex ? 20 : 12;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    if (isConvex) {
      // Double Convex Lens shape
      ctx.ellipse(lensX, centerY, lensW, lensH / 2, 0, 0, 2 * Math.PI);
    } else {
      // Double Concave Lens shape
      ctx.moveTo(lensX - lensW, centerY - lensH / 2);
      ctx.bezierCurveTo(lensX - 2, centerY - lensH / 4, lensX - 2, centerY + lensH / 4, lensX - lensW, centerY + lensH / 2);
      ctx.lineTo(lensX + lensW, centerY + lensH / 2);
      ctx.bezierCurveTo(lensX + 2, centerY + lensH / 4, lensX + 2, centerY - lensH / 4, lensX + lensW, centerY - lensH / 2);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    // Central line through lens plane
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(lensX, centerY - lensH / 2);
    ctx.lineTo(lensX, centerY + lensH / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Optical Points markers (O, F1, F2, 2F1, 2F2)
    // Center O
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(lensX, centerY, 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = 'bold 11px monospace';
    ctx.fillText('O', lensX - 4, centerY + 18);

    // F1 & F2
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(f1PixelX, centerY, 3.5, 0, 2 * Math.PI);
    ctx.arc(f2PixelX, centerY, 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText(`F₁ (${focalLengthCm}cm)`, f1PixelX - 20, centerY + 18);
    ctx.fillText(`F₂ (${focalLengthCm}cm)`, f2PixelX - 10, centerY + 18);

    // 2F1 & 2F2
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(f1TwoPixelX, centerY, 3, 0, 2 * Math.PI);
    ctx.arc(f2TwoPixelX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText(`2F₁`, f1TwoPixelX - 10, centerY + 18);
    ctx.fillText(`2F₂`, f2TwoPixelX - 10, centerY + 18);

    // Draw Object Arrow (Candle)
    const objPixelX = lensX - objectDistanceCm * scale;
    const objPixelY = centerY - objectHeightCm * scale;

    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.lineWidth = 3;
    // Arrow stem
    ctx.beginPath();
    ctx.moveTo(objPixelX, centerY);
    ctx.lineTo(objPixelX, objPixelY);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(objPixelX - 6, objPixelY + 10);
    ctx.lineTo(objPixelX, objPixelY);
    ctx.lineTo(objPixelX + 6, objPixelY + 10);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${tI18n('experiments.thin_lenses.objectCanvasLabel')} (do=${objectDistanceCm}cm)`, objPixelX - 35, objPixelY - 10);

    // Draw Image Arrow
    if (!isAtFocus && Math.abs(imageDistanceCm) < 300) {
      const imgPixelX = lensX + imageDistanceCm * scale;
      const imgPixelY = centerY - imageHeightCm * scale;

      ctx.strokeStyle = isReal ? '#ef4444' : '#c084fc';
      ctx.fillStyle = isReal ? '#ef4444' : '#c084fc';
      ctx.lineWidth = 2.5;

      if (!isReal) ctx.setLineDash([3, 3]);
      // Stem
      ctx.beginPath();
      ctx.moveTo(imgPixelX, centerY);
      ctx.lineTo(imgPixelX, imgPixelY);
      ctx.stroke();
      // Head
      const headDir = isInverted ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(imgPixelX - 5, imgPixelY + 8 * headDir);
      ctx.lineTo(imgPixelX, imgPixelY);
      ctx.lineTo(imgPixelX + 5, imgPixelY + 8 * headDir);
      ctx.fill();
      ctx.setLineDash([]);

      ctx.font = 'bold 11px sans-serif';
      const imgNatureStr = isReal ? tI18n('experiments.thin_lenses.real') : tI18n('experiments.thin_lenses.virtual');
      ctx.fillText(
        `${tI18n('experiments.thin_lenses.imageCanvasLabel')} (${imgNatureStr}, di=${imageDistanceCm.toFixed(1)}cm)`,
        imgPixelX - 45,
        imgPixelY + (isInverted ? 20 : -10)
      );

      // --- PRINCIPAL RAY TRACING ---
      if (showPrincipalRays) {
        // Ray 1 (Red): Parallel ray -> refracts through Focus
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.2;
        // Parallel incident ray to lens plane
        ctx.beginPath();
        ctx.moveTo(objPixelX, objPixelY);
        ctx.lineTo(lensX, objPixelY);
        ctx.stroke();

        if (isConvex) {
          // Refracts through F2 (right side)
          const slope = (centerY - objPixelY) / (f2PixelX - lensX);
          ctx.beginPath();
          ctx.moveTo(lensX, objPixelY);
          ctx.lineTo(lensX + 350, objPixelY + 350 * slope);
          ctx.stroke();

          // Virtual backward ray if virtual image
          if (!isReal) {
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(lensX, objPixelY);
            ctx.lineTo(imgPixelX, imgPixelY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else {
          // Concave: Diverges as if coming from F1 (left side)
          const slope = (objPixelY - centerY) / (lensX - f1PixelX);
          ctx.beginPath();
          ctx.moveTo(lensX, objPixelY);
          ctx.lineTo(lensX + 250, objPixelY + 250 * slope);
          ctx.stroke();

          // Virtual backward line to F1
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(lensX, objPixelY);
          ctx.lineTo(f1PixelX, centerY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Ray 2 (Yellow): Central ray through optical center O (undeviated straight line)
        ctx.strokeStyle = '#eab308';
        const oSlope = (centerY - objPixelY) / (lensX - objPixelX);
        ctx.beginPath();
        ctx.moveTo(objPixelX, objPixelY);
        ctx.lineTo(lensX + 300, centerY + 300 * oSlope);
        ctx.stroke();

        if (!isReal) {
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(lensX, centerY);
          ctx.lineTo(imgPixelX, imgPixelY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    } else if (isAtFocus) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(tI18n('experiments.thin_lenses.atFocusMessage'), 40, 50);
    }

  }, [lensType, focalLengthCm, objectDistanceCm, objectHeightCm, showPrincipalRays, signedFocalLengthCm, imageDistanceCm, imageHeightCm, isAtFocus, isReal, isInverted, tI18n]);

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'thin_lenses',
      variableName: `Lens Image Distance di (${lensType === 'convex' ? 'Convex' : 'Concave'})`,
      measuredValue: Number(imageDistanceCm.toFixed(2)),
      theoreticalValue: Number(imageDistanceCm.toFixed(2)),
      unit: 'cm',
      parameters: {
        'Lens Type': lensType === 'convex' ? tI18n('experiments.thin_lenses.lensTypeConvexLog') : tI18n('experiments.thin_lenses.lensTypeConcaveLog'),
        'Focal Length f': `${signedFocalLengthCm} cm`,
        'Optical Power P': `${lensPowerDiopters.toFixed(2)} Diopters (D)`,
        'Object Distance do': `${objectDistanceCm} cm`,
        'Object Height ho': `${objectHeightCm} cm`,
        'Magnification m': `${magnification.toFixed(3)}`,
        'Image Nature': isReal ? tI18n('experiments.thin_lenses.imageNatureRealInverted') : tI18n('experiments.thin_lenses.imageNatureVirtualUpright'),
      },
      equation: `1/f = 1/do + 1/di => di = (f · do) / (do - f) = (${signedFocalLengthCm} · ${objectDistanceCm}) / (${objectDistanceCm} - ${signedFocalLengthCm}) = ${imageDistanceCm.toFixed(2)} cm, Power P = 100/f = ${lensPowerDiopters.toFixed(2)} D`,
      notes: `Thin lens refraction ray tracing. Magnification m = -di/do = ${magnification.toFixed(2)}.`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-sky-950/40 border border-emerald-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Eye  className="w-5 h-5 text-emerald-400"/>
            <span>
              {tI18n('experiments.thin_lenses.title')}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.thin_lenses.subtitle')}
          </p>
        </div>

        <button
          onClick={handleLog}
          className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30' }`}
        >
          <BookmarkCheck  className="w-4 h-4"/>
          <span>{logged ? tI18n('experiments.thin_lenses.logged') : tI18n('experiments.thin_lenses.logMeasurement')}</span>
        </button>
      </div>

      {/* Main Grid: Controls + Interactive Optical Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-emerald-400"/>
              {tI18n('experiments.thin_lenses.controlsTitle')}
            </span>
          </div>

          {/* Lens Type Radio Tabs */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5 font-medium">
              {tI18n('experiments.thin_lenses.lensTypeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLensType('convex')}
                className={`min-h-[44px] min-w-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  lensType === 'convex'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                {tI18n('experiments.thin_lenses.convexLens')}
              </button>
              <button
                onClick={() => setLensType('concave')}
                className={`min-h-[44px] min-w-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  lensType === 'concave'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                {tI18n('experiments.thin_lenses.concaveLens')}
              </button>
            </div>
          </div>

          {/* Focal Length Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.thin_lenses.focalLengthLabel')}</span>
              <span className="font-mono text-purple-400 font-semibold">{focalLengthCm} cm ({lensPowerDiopters.toFixed(2)} D)</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={focalLengthCm}
              onChange={(e) => setFocalLengthCm(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Object Distance (do) Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.thin_lenses.objectDistanceLabel')}</span>
              <span className="font-mono text-emerald-400 font-semibold">{objectDistanceCm} cm</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              step="1"
              value={objectDistanceCm}
              onChange={(e) => setObjectDistanceCm(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Object Height (ho) Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.thin_lenses.objectHeightLabel')}</span>
              <span className="font-mono text-amber-400 font-semibold">{objectHeightCm} cm</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={objectHeightCm}
              onChange={(e) => setObjectHeightCm(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Principal Rays Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-300">{tI18n('experiments.thin_lenses.showRaysLabel')}</span>
            <input
              type="checkbox"
              checked={showPrincipalRays}
              onChange={(e) => setShowPrincipalRays(e.target.checked)}
              className="accent-emerald-500 cursor-pointer w-4 h-4"
            />
          </div>

          {/* Image Nature State Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              {tI18n('experiments.thin_lenses.imageCharacteristicsLabel')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span
               className={`px-2 py-0.5 rounded text-xs font-semibold ${ isReal ? 'bg-rose-500/20 text-rose-300' : 'bg-purple-500/20 text-purple-300' }`}>
                {isReal ? tI18n('experiments.thin_lenses.real') : tI18n('experiments.thin_lenses.virtual')}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300">
                {isInverted ? tI18n('experiments.thin_lenses.inverted') : tI18n('experiments.thin_lenses.upright')}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300">
                {isEnlarged
                  ? tI18n('experiments.thin_lenses.enlarged')
                  : isReduced
                  ? tI18n('experiments.thin_lenses.reduced')
                  : tI18n('experiments.thin_lenses.sameSize')}
              </span>
            </div>
          </div>
        </div>

        {/* Canvas & Live Computed Metrics */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={380}
             className="w-full h-[380px] rounded-xl bg-zinc-950 block"/>
          </div>

          {/* Computed Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Optical Power */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.thin_lenses.opticalPowerCard')}
              </span>
              <div className="text-xl font-bold font-mono text-purple-400">
                {lensPowerDiopters.toFixed(2)} <span className="text-sm text-zinc-400">D (Diopter)</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">P = 100 / f(cm)</span>
            </div>

            {/* Image Distance di */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.thin_lenses.imagePositionCard')}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {isAtFocus ? '∞' : imageDistanceCm.toFixed(2)} <span className="text-sm text-zinc-400">cm</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">1/f = 1/do + 1/di</span>
            </div>

            {/* Magnification m */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.thin_lenses.magnificationCard')}
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {isAtFocus ? '∞' : magnification.toFixed(3)}x
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">m = -di / do</span>
            </div>

            {/* Image Height hi */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.thin_lenses.imageHeightCard')}
              </span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {isAtFocus ? '∞' : Math.abs(imageHeightCm).toFixed(2)} <span className="text-sm text-zinc-400">cm</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">hi = m · ho</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}