import { Sparkles, BookmarkCheck, Compass } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function AngledMirrorsSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Parameters
  const [angleDeg, setAngleDeg] = useState<number>(60); // degrees between mirrors (20 to 180)
  const [objectDistance, setObjectDistance] = useState<number>(140); // pixels from vertex
  const [objectAngleRatio, setObjectAngleRatio] = useState<number>(0.5); // 0 to 1 inside sector
  const [objectType, setObjectType] = useState<'candle' | 'arrow' | 'dot'>('candle');
  const [showRays, setShowRays] = useState<boolean>(true);
  const [showImageCircle, setShowImageCircle] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Geometric Optics Calculations
  // Number of images formula: N = Math.floor(360 / angleDeg) - ( (360 % angleDeg === 0) ? 1 : 0 )
  const ratio360 = 360 / angleDeg;
  const numImages = Math.floor(ratio360) - (Math.abs(ratio360 - Math.round(ratio360)) < 1e-4 ? 1 : 0);
  const isSymmetric = Math.abs(ratio360 - Math.round(ratio360)) < 1e-4;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku' || lang === 'bad') ? 'rtl' : 'ltr';

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

    const vertexX = width * 0.45;
    const vertexY = height * 0.55;
    const mirrorLength = 230;

    // Angle theta in radians
    const thetaRad = (angleDeg * Math.PI) / 180;
    // Base mirror M1 horizontal right (0 rad)
    const m1Angle = 0;
    // Mirror M2 at angle theta
    const m2Angle = -thetaRad; // up in canvas coords

    // Draw Image Locus Circle
    if (showImageCircle) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(vertexX, vertexY, objectDistance, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Protractor Sector between mirrors
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath();
    ctx.moveTo(vertexX, vertexY);
    ctx.arc(vertexX, vertexY, 70, m2Angle, m1Angle);
    ctx.closePath();
    ctx.fill();

    // Protractor Arc
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(vertexX, vertexY, 70, m2Angle, m1Angle);
    ctx.stroke();

    // Angle Text Label
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    const midAngle = (m1Angle + m2Angle) / 2;
    ctx.fillText(`θ = ${angleDeg}°`, vertexX + 80 * Math.cos(midAngle), vertexY + 80 * Math.sin(midAngle));

    // Draw Mirror 1 (Horizontal)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(vertexX, vertexY);
    ctx.lineTo(vertexX + mirrorLength * Math.cos(m1Angle), vertexY + mirrorLength * Math.sin(m1Angle));
    ctx.stroke();

    // Mirror 1 Hatching (Backside)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    for (let d = 15; d < mirrorLength; d += 15) {
      const hx = vertexX + d;
      const hy = vertexY;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 8, hy + 8);
      ctx.stroke();
    }

    // Draw Mirror 2 (Tilted by theta)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(vertexX, vertexY);
    ctx.lineTo(vertexX + mirrorLength * Math.cos(m2Angle), vertexY + mirrorLength * Math.sin(m2Angle));
    ctx.stroke();

    // Mirror 2 Hatching (Backside)
    for (let d = 15; d < mirrorLength; d += 15) {
      const hx = vertexX + d * Math.cos(m2Angle);
      const hy = vertexY + d * Math.sin(m2Angle);
      const perpAngle = m2Angle - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 8 * Math.cos(perpAngle), hy + 8 * Math.sin(perpAngle));
      ctx.stroke();
    }

    // Mirror Names
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(tI18n('experiments.angled_mirrors.mirror1Canvas'), vertexX + mirrorLength - 20, vertexY + 20);
    ctx.fillText(tI18n('experiments.angled_mirrors.mirror2Canvas'), vertexX + mirrorLength * Math.cos(m2Angle) - 10, vertexY + mirrorLength * Math.sin(m2Angle) - 10);

    // Object placement inside sector
    const objAngleRad = m1Angle - objectAngleRatio * thetaRad; // angle from 0 towards -theta
    const objX = vertexX + objectDistance * Math.cos(objAngleRad);
    const objY = vertexY + objectDistance * Math.sin(objAngleRad);

    // Calculate all virtual image angular coordinates using successive reflections
    // In polar coords (r, φ):
    // Image in M1 is at -φ
    // Image in M2 is at 2θ - φ, etc.
    const imageAngles: number[] = [];
    const maxSectors = Math.floor(360 / angleDeg);

    // Method: Angular reflections across M1 (0 rad) and M2 (-thetaRad)
    let curAngle1 = objAngleRad;
    let curAngle2 = objAngleRad;

    // Series from reflection in M1 first
    for (let i = 0; i < maxSectors; i++) {
      if (i % 2 === 0) {
        // Reflect across M1 (angle = 0): φ' = -φ
        curAngle1 = -curAngle1;
      } else {
        // Reflect across M2 (angle = -thetaRad): φ' = 2*(-thetaRad) - φ = -2θ - φ
        curAngle1 = 2 * m2Angle - curAngle1;
      }

      // Check if image lies behind mirrors (outside sector [m2Angle, m1Angle])
      const normalized = ((curAngle1 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const objNorm = ((objAngleRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

      if (Math.abs(normalized - objNorm) > 0.05 && !imageAngles.some(a => Math.abs(a - curAngle1) < 0.05)) {
        if (imageAngles.length < numImages) {
          imageAngles.push(curAngle1);
        }
      }
    }

    // Series from reflection in M2 first
    for (let i = 0; i < maxSectors; i++) {
      if (i % 2 === 0) {
        // Reflect across M2
        curAngle2 = 2 * m2Angle - curAngle2;
      } else {
        // Reflect across M1
        curAngle2 = -curAngle2;
      }

      const normalized = ((curAngle2 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const objNorm = ((objAngleRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

      if (Math.abs(normalized - objNorm) > 0.05 && !imageAngles.some(a => Math.abs(a - curAngle2) < 0.05)) {
        if (imageAngles.length < numImages) {
          imageAngles.push(curAngle2);
        }
      }
    }

    // Draw Reflection Ray Paths
    if (showRays) {
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 1.2;

      // Ray from object to M1
      const rayM1X = objX;
      const rayM1Y = vertexY;
      ctx.beginPath();
      ctx.moveTo(objX, objY);
      ctx.lineTo(rayM1X, rayM1Y);
      ctx.stroke();

      // Virtual extended ray behind M1
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rayM1X, rayM1Y);
      ctx.lineTo(vertexX + objectDistance * Math.cos(-objAngleRad), vertexY + objectDistance * Math.sin(-objAngleRad));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Virtual Images
    imageAngles.forEach((ang, idx) => {
      const imgX = vertexX + objectDistance * Math.cos(ang);
      const imgY = vertexY + objectDistance * Math.sin(ang);

      // Virtual Object Ghost Circle
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(imgX, imgY, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Image Label
      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`I${idx + 1}`, imgX - 6, imgY + 4);
    });

    // Draw Real Object (Candle / Arrow)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(objX, objY, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Flame on candle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(objX, objY - 8, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(tI18n('experiments.angled_mirrors.objectCanvas'), objX + 16, objY - 6);

  }, [angleDeg, objectDistance, objectAngleRatio, showRays, showImageCircle, numImages, lang]);

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'angled_mirrors',
      variableName: tI18n('experiments.angled_mirrors.varNumImages'),
      measuredValue: numImages,
      theoreticalValue: (360 / angleDeg) - 1,
      unit: tI18n('experiments.angled_mirrors.imagesUnit'),
      parameters: {
        'Angle θ': `${angleDeg}°`,
        'Object Distance r': `${objectDistance} px`,
        'Symmetric Divisibility': isSymmetric ? 'Yes (360/θ is integer)' : 'No',
        'Formula': 'N = (360 / θ) - 1',
      },
      equation: `N = ⌊360° / ${angleDeg}°⌋ - 1 = ${numImages} ${tI18n('experiments.angled_mirrors.imagesUnit')}`,
      notes: tI18n('experiments.angled_mirrors.notesLog'),
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles  className="w-5 h-5 text-purple-400"/>
            <span>{tI18n('experiments.angled_mirrors.title')}</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.angled_mirrors.subtitle')}
          </p>
        </div>

        <button
          onClick={handleLog}
          className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30' }`}
        >
          <BookmarkCheck  className="w-4 h-4"/>
          <span>{logged ? tI18n('experiments.angled_mirrors.logged') : tI18n('experiments.angled_mirrors.logMeasurement')}</span>
        </button>
      </div>

      {/* Main Grid: Controls + Ray Tracing Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Compass  className="w-4 h-4 text-purple-400"/>
              {tI18n('experiments.angled_mirrors.controlsTitle')}
            </span>
          </div>

          {/* Angle Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.angled_mirrors.angleLabel')}</span>
              <span className="font-mono text-purple-400 font-semibold">{angleDeg}°</span>
            </div>
            <input
              type="range"
              min="20"
              max="180"
              step="5"
              value={angleDeg}
              onChange={(e) => setAngleDeg(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Preset Angle Buttons */}
          <div>
            <span className="text-[10px] text-zinc-400 block mb-1.5">
              {tI18n('experiments.angled_mirrors.standardAnglesLabel')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { angle: 180, label: '180° (N=1)' },
                { angle: 120, label: '120° (N=2)' },
                { angle: 90, label: '90° (N=3)' },
                { angle: 60, label: '60° (N=5)' },
                { angle: 45, label: '45° (N=7)' },
                { angle: 30, label: '30° (N=11)' },
              ].map((p) => (
                <button
                  key={p.angle}
                  onClick={() => setAngleDeg(p.angle)}
                  className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
                    angleDeg === p.angle
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Object Angular Placement Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.angled_mirrors.objectSectorRatioLabel')}</span>
              <span className="font-mono text-sky-400 font-semibold">{(objectAngleRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={objectAngleRatio}
              onChange={(e) => setObjectAngleRatio(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Object Distance Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.angled_mirrors.objectDistanceLabel')}</span>
              <span className="font-mono text-emerald-400 font-semibold">{objectDistance} px</span>
            </div>
            <input
              type="range"
              min="80"
              max="180"
              step="5"
              value={objectDistance}
              onChange={(e) => setObjectDistance(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Visual Toggles */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>{tI18n('experiments.angled_mirrors.showRaysLabel')}</span>
              <input
                type="checkbox"
                checked={showRays}
                onChange={(e) => setShowRays(e.target.checked)}
                className="accent-purple-500 cursor-pointer w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>{tI18n('experiments.angled_mirrors.showImageCircleLabel')}</span>
              <input
                type="checkbox"
                checked={showImageCircle}
                onChange={(e) => setShowImageCircle(e.target.checked)}
                className="accent-purple-500 cursor-pointer w-4 h-4"
              />
            </div>
          </div>
        </div>

        {/* Canvas & Live Computed Result */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={380}
             className="w-full h-[380px] rounded-xl bg-zinc-950 block"/>
          </div>

          {/* Computed Results */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Number of Images */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-700/60 space-y-1">
              <span className="text-[10px] text-purple-300 uppercase font-semibold">
                {tI18n('experiments.angled_mirrors.numImagesCard')}
              </span>
              <div className="text-2xl font-bold font-mono text-purple-300">
                {numImages} <span className="text-sm text-zinc-400">{tI18n('experiments.angled_mirrors.imagesUnit')}</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">N = (360/θ) - 1</span>
            </div>

            {/* Total Objects Visible */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.angled_mirrors.totalVisibleCard')}
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {numImages + 1}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">1 Real + {numImages} Virtual</span>
            </div>

            {/* Angle Division */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.angled_mirrors.ratioCard')}
              </span>
              <div className="text-lg font-bold font-mono text-sky-400">
                {(360 / angleDeg).toFixed(2)}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">{isSymmetric ? 'Exact Integer' : 'Fractional Angle'}</span>
            </div>

            {/* Angular Spacing */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.angled_mirrors.reflectionLawCard')}
              </span>
              <div className="text-sm font-bold font-mono text-amber-400 mt-1">
                θ_inc = θ_ref
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Planar Symmetrical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}