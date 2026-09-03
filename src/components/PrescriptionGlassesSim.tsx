import { Eye, BookmarkCheck, Sliders, CheckCircle2, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function PrescriptionGlassesSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Eye defect condition
  const [defectType, setDefectType] = useState<'myopia' | 'hyperopia' | 'normal'>('myopia');
  // Corrective lens focal length (cm)
  const [glassesFocalLengthCm, setGlassesFocalLengthCm] = useState<number>(-25); // -25cm = -4.0 Diopters (Myopia)
  // Object distance from eye (cm)
  const [objectDistanceCm, setObjectDistanceCm] = useState<number>(100); // 100cm (distant object)
  // Enable / disable wearing the glasses
  const [glassesEnabled, setGlassesEnabled] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Optical Calculations
  // Lens Optical Power in Diopters P = 100 / f(cm)
  const lensPowerDiopters = glassesFocalLengthCm !== 0 ? 100 / glassesFocalLengthCm : 0;

  // Thin lens equation for eyeglasses lens: 1/f = 1/do + 1/di => 1/di = 1/f - 1/do
  const invDiGlasses = 1 / glassesFocalLengthCm - 1 / objectDistanceCm;
  const imageDistanceGlassesCm = Math.abs(invDiGlasses) > 0.0001 ? 1 / invDiGlasses : 9999;

  // Eye focal power and retina distance (approx eye diameter = 2.4 cm = 24 mm)
  // Normal eye accommodates from f_eye = 2.4 cm (infinity) to 2.18 cm (near point 25cm)
  // In myopia, eye is too long or cornea too curved (focus in front of retina)
  // In hyperopia, eye is too short or cornea too flat (focus behind retina)
  const eyeRetinaPos = 2.4; // cm
  let uncorrectedFocalPoint = 2.4; // cm behind eye lens
  if (defectType === 'myopia') {
    uncorrectedFocalPoint = 1.9; // focuses before retina
  } else if (defectType === 'hyperopia') {
    uncorrectedFocalPoint = 2.9; // focuses behind retina
  }

  // With corrective lens:
  let finalFocusPoint = uncorrectedFocalPoint;
  if (glassesEnabled) {
    if (defectType === 'myopia' && glassesFocalLengthCm < 0) {
      // Diverging lens pushes focal point backward onto retina
      const correction = Math.min(Math.abs(lensPowerDiopters) * 0.125, 0.6);
      finalFocusPoint = uncorrectedFocalPoint + correction;
    } else if (defectType === 'hyperopia' && glassesFocalLengthCm > 0) {
      // Converging lens pulls focal point forward onto retina
      const correction = Math.min(lensPowerDiopters * 0.125, 0.6);
      finalFocusPoint = uncorrectedFocalPoint - correction;
    }
  }

  const isSharpRetinaFocus = Math.abs(finalFocusPoint - eyeRetinaPos) < 0.12;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
        drawEyeballOptics(ctx, canvas.width, canvas.height);
      }
    }
  }, [defectType, glassesFocalLengthCm, objectDistanceCm, glassesEnabled, finalFocusPoint, isSharpRetinaFocus]);

  const drawEyeballOptics = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Dark Background & Grid
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

    const opticalAxisY = height * 0.5;

    // Optical Principal Axis Line
    ctx.strokeStyle = 'rgba(161, 161, 170, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, opticalAxisY);
    ctx.lineTo(width - 20, opticalAxisY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Eyeball Coordinates
    const eyeCenterX = width * 0.72;
    const eyeRadius = 65;
    const eyeLensX = eyeCenterX - eyeRadius + 10;
    const retinaX = eyeCenterX + eyeRadius - 6;

    // Draw Eyeball Sclera Shell
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(eyeCenterX, opticalAxisY, eyeRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Retina Layer on Back of Eye
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(eyeCenterX, opticalAxisY, eyeRadius - 4, -Math.PI / 2.8, Math.PI / 2.8);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(tI18n('experiments.prescription_glasses.retinaLabel'), retinaX - 25, opticalAxisY - eyeRadius - 8);

    // Draw Crystalline Eye Lens
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(eyeLensX, opticalAxisY, 8, 38, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '9px monospace';
    ctx.fillText(tI18n('experiments.prescription_glasses.eyeLensLabel'), eyeLensX - 20, opticalAxisY - 45);

    // Eyeglasses Lens Position (in front of eye)
    const glassesX = eyeLensX - 85;

    if (glassesEnabled) {
      const isConcave = glassesFocalLengthCm < 0;
      ctx.fillStyle = isConcave ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)';
      ctx.strokeStyle = isConcave ? '#f43f5e' : '#10b981';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      if (isConcave) {
        // Concave diverging lens shape (thinner in middle)
        ctx.moveTo(glassesX - 6, opticalAxisY - 40);
        ctx.lineTo(glassesX + 6, opticalAxisY - 40);
        ctx.quadraticCurveTo(glassesX, opticalAxisY, glassesX + 6, opticalAxisY + 40);
        ctx.lineTo(glassesX - 6, opticalAxisY + 40);
        ctx.quadraticCurveTo(glassesX - 3, opticalAxisY, glassesX - 6, opticalAxisY - 40);
      } else {
        // Convex converging lens shape (thicker in middle)
        ctx.ellipse(glassesX, opticalAxisY, 6, 40, 0, 0, 2 * Math.PI);
      }
      ctx.fill();
      ctx.stroke();

      // Eyeglasses frame line
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(glassesX, opticalAxisY - 40);
      ctx.lineTo(glassesX + 40, opticalAxisY - 38);
      ctx.stroke();

      ctx.fillStyle = isConcave ? '#f43f5e' : '#10b981';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${lensPowerDiopters > 0 ? '+' : ''}${lensPowerDiopters.toFixed(2)} D`, glassesX - 20, opticalAxisY - 48);
    }

    // Object Source Candle / Arrow on the Left
    const objX = Math.max(50, glassesX - Math.min(objectDistanceCm * 2, 220));
    const objHeight = 45;

    // Arrow Object
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(objX, opticalAxisY);
    ctx.lineTo(objX, opticalAxisY - objHeight);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(objX, opticalAxisY - objHeight - 6);
    ctx.lineTo(objX - 6, opticalAxisY - objHeight + 4);
    ctx.lineTo(objX + 6, opticalAxisY - objHeight + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${tI18n('experiments.prescription_glasses.objectLabel')} (${objectDistanceCm}cm)`, objX - 25, opticalAxisY + 18);

    // Ray Tracing Path
    // Ray 1: From Object Tip to Glasses/Eye Top
    const ray1TopY = opticalAxisY - 24;
    const ray2BotY = opticalAxisY + 24;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f59e0b'; // Gold Light Rays

    // 1. Ray from object to glasses
    ctx.beginPath();
    ctx.moveTo(objX, opticalAxisY - objHeight);
    if (glassesEnabled) {
      ctx.lineTo(glassesX, ray1TopY);
      // Ray from glasses to eye lens (refracted by glasses)
      ctx.lineTo(eyeLensX, ray1TopY + (glassesFocalLengthCm < 0 ? 4 : -3));
    } else {
      ctx.lineTo(eyeLensX, ray1TopY);
    }

    // Converging focus inside eyeball
    const focalScreenX = eyeLensX + (finalFocusPoint / eyeRetinaPos) * (retinaX - eyeLensX);
    ctx.lineTo(focalScreenX, opticalAxisY);
    ctx.stroke();

    // Ray 2: Center/Bottom ray
    ctx.beginPath();
    ctx.moveTo(objX, opticalAxisY - objHeight);
    if (glassesEnabled) {
      ctx.lineTo(glassesX, ray2BotY);
      ctx.lineTo(eyeLensX, ray2BotY + (glassesFocalLengthCm < 0 ? -4 : 3));
    } else {
      ctx.lineTo(eyeLensX, ray2BotY);
    }
    ctx.lineTo(focalScreenX, opticalAxisY);
    ctx.stroke();

    // Focal Convergence Spot Indicator
    ctx.fillStyle = isSharpRetinaFocus ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(focalScreenX, opticalAxisY, 5, 0, 2 * Math.PI);
    ctx.fill();
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'prescription_glasses',
      variableName: 'Corrective Lens Power P (Prescription Eyeglasses)',
      measuredValue: Number(lensPowerDiopters.toFixed(2)),
      theoreticalValue: Number((100 / glassesFocalLengthCm).toFixed(2)),
      unit: 'Diopter (D)',
      parameters: {
        'Vision Defect': defectType === 'myopia' ? 'Myopia (قصر نظر)' : defectType === 'hyperopia' ? 'Hyperopia (طول نظر)' : 'Normal (سليم)',
        'Eyeglasses Focal Length f': `${glassesFocalLengthCm} cm`,
        'Object Distance do': `${objectDistanceCm} cm`,
        'Image Distance di': `${imageDistanceGlassesCm.toFixed(1)} cm`,
        'Eyeglasses Worn': glassesEnabled ? 'Yes' : 'No',
        'Retina Sharp Focus': isSharpRetinaFocus ? 'Sharp (Perfect Focus)' : 'Blurry (Defocused)',
      },
      equation: `P = 1 / f(m) = 100 / (${glassesFocalLengthCm} cm) = ${lensPowerDiopters.toFixed(2)} D, 1/f = 1/do + 1/di`,
      notes: `Optometry corrective eyeglasses simulation. Myopia corrected with concave lens (negative diopters), hyperopia with convex lens (positive diopters).`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-zinc-900 to-indigo-950/40 border border-sky-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Eye  className="w-5 h-5 text-sky-400"/>
            <span>
              {tI18n('experiments.prescription_glasses.title')}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.prescription_glasses.subtitle')}
          </p>
        </div>

        <button
          onClick={handleLog}
         className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30' }`}>
          <BookmarkCheck  className="w-4 h-4"/>
          <span>{logged ? tI18n('experiments.prescription_glasses.logged') : tI18n('experiments.prescription_glasses.logMeasurement')}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-sky-400"/>
              {tI18n('experiments.prescription_glasses.controlsTitle')}
            </span>
          </div>

          {/* Eye Condition Selector */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5">
              {tI18n('experiments.prescription_glasses.visionConditionLabel')}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  setDefectType('myopia');
                  setGlassesFocalLengthCm(-25); // -4.0 D
                  setObjectDistanceCm(120);
                }}
                className={`min-h-[44px] min-w-[44px] px-2 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  defectType === 'myopia'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {tI18n('experiments.prescription_glasses.myopia')}
              </button>
              <button
                onClick={() => {
                  setDefectType('hyperopia');
                  setGlassesFocalLengthCm(33.3); // +3.0 D
                  setObjectDistanceCm(25);
                }}
                className={`min-h-[44px] min-w-[44px] px-2 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  defectType === 'hyperopia'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {tI18n('experiments.prescription_glasses.hyperopia')}
              </button>
              <button
                onClick={() => {
                  setDefectType('normal');
                  setGlassesFocalLengthCm(100);
                  setObjectDistanceCm(80);
                }}
                className={`min-h-[44px] min-w-[44px] px-2 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  defectType === 'normal'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {tI18n('experiments.prescription_glasses.normal')}
              </button>
            </div>
          </div>

          {/* Glasses Focal Length Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.prescription_glasses.focalLengthLabel')}</span>
              <span className={`font-mono font-semibold ${glassesFocalLengthCm < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {glassesFocalLengthCm.toFixed(1)} cm
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={glassesFocalLengthCm}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val !== 0) setGlassesFocalLengthCm(val);
              }}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Object Distance Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.prescription_glasses.objectDistanceLabel')}</span>
              <span className="font-mono text-zinc-200 font-semibold">{objectDistanceCm} cm</span>
            </div>
            <input
              type="range"
              min="10"
              max="250"
              step="5"
              value={objectDistanceCm}
              onChange={(e) => setObjectDistanceCm(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Toggle Glasses Button */}
          <div className="pt-2">
            <button
              onClick={() => setGlassesEnabled(!glassesEnabled)}
              className={`min-h-[44px] min-w-[44px] w-full py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                glassesEnabled
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Eye  className="w-4 h-4"/>
              <span>
                {glassesEnabled ? tI18n('experiments.prescription_glasses.glassesOn') : tI18n('experiments.prescription_glasses.glassesOff')}
              </span>
            </button>
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
            {/* Optical Power (P) in Diopters */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.prescription_glasses.lensPowerCard')}
              </span>
              <div className={`text-xl font-bold font-mono ${lensPowerDiopters < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {lensPowerDiopters > 0 ? '+' : ''}{lensPowerDiopters.toFixed(2)} <span className="text-sm text-zinc-400">D</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">P = 100 / f(cm)</span>
            </div>

            {/* Image Distance di */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.prescription_glasses.imageDistanceCard')}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {Math.abs(imageDistanceGlassesCm) < 1000 ? imageDistanceGlassesCm.toFixed(1) : '∞'} <span className="text-sm text-zinc-400">cm</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">1/f = 1/do + 1/di</span>
            </div>

            {/* Vision Quality State */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.prescription_glasses.retinalFocusCard')}
              </span>
              <div className={`text-sm font-bold flex items-center gap-1 ${isSharpRetinaFocus ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isSharpRetinaFocus ? <CheckCircle2  className="w-4 h-4"/> : <AlertTriangle  className="w-4 h-4"/>}
                <span>{isSharpRetinaFocus ? tI18n('experiments.prescription_glasses.focusSharp') : tI18n('experiments.prescription_glasses.focusBlurry')}</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Focus @ {finalFocusPoint.toFixed(2)} cm</span>
            </div>

            {/* Corrective Lens Type */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.prescription_glasses.prescriptionTypeCard')}
              </span>
              <div className="text-xs font-bold font-mono text-zinc-200">
                {glassesFocalLengthCm < 0 ? tI18n('experiments.prescription_glasses.concaveLens') : tI18n('experiments.prescription_glasses.convexLens')}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">f = {glassesFocalLengthCm.toFixed(1)} cm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}