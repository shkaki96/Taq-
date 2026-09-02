import { Compass, BookmarkCheck, Sliders, CheckCircle2, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function PeriscopeSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const t = {
    ar: {
      title: 'المنظار البصري وقانون الانعكاس',
      subtitle: 'محاكاة المنظار الغواصي وتطبيق قانون الانعكاس (زاوية السقوط = زاوية الانعكاس θi = θr) عبر مرآتين متوازيتين بزاوية 45° لتجاوز الحواجز العالية.',
      logMeasurement: 'تسجيل في دفتر المختبر', // غير موثّق بمصدر
      logged: 'تم التسجيل في الدفتر ✓', // غير موثّق بمصدر
      controlsTitle: 'معايير زوايا المرايا', // غير موثّق بمصدر
      bottomMirrorAngleLabel: 'زاوية المرآة السفلية (θ₂):',
      topMirrorAngleLabel: 'زاوية المرآة العلوية (θ₁):',
      periscopeHeightLabel: 'ارتفاع عمود المنظار (H):', // غير موثّق بمصدر
      presetsLabel: 'أوضاع سريعة:', // غير موثّق بمصدر
      preset45Align: 'محاذاة 45° مثالية', // غير موثّق بمصدر
      presetTilt: 'انحراف واختلال', // غير موثّق بمصدر
      topMirrorCard: 'زاوية المرآة العلوية',
      bottomMirrorCard: 'زاوية المرآة السفلية',
      exitDeviationCard: 'انحراف الشعاع الخارج',
      visibilityStateCard: 'حالة الرؤية للراصد', // غير موثّق بمصدر
      clearView: 'مطابقة ومباشرة', // غير موثّق بمصدر
      blockedView: 'غير مرئية', // غير موثّق بمصدر
      obstacleWallLabel: 'جدار عازل', // غير موثّق بمصدر
      targetObjectLabel: 'الهدف',
      observerLabel: 'عين الراصد',
    },
    en: {
      title: 'Periscope & Law of Reflection',
      subtitle: 'Submarine periscope simulation demonstrating double planar mirror reflection (θi = θr = 45°) to observe over high barriers.',
      logMeasurement: 'Log Measurement', // غير موثّق بمصدر
      logged: 'Logged ✓', // غير موثّق بمصدر
      controlsTitle: 'Mirror Angle Controls', // غير موثّق بمصدر
      bottomMirrorAngleLabel: 'Bottom Mirror Angle (θ₂):',
      topMirrorAngleLabel: 'Top Mirror Angle (θ₁):',
      periscopeHeightLabel: 'Periscope Column Height:', // غير موثّق بمصدر
      presetsLabel: 'Quick Presets:', // غير موثّق بمصدر
      preset45Align: 'Perfect 45° Align', // غير موثّق بمصدر
      presetTilt: 'Misaligned Tilt', // غير موثّق بمصدر
      topMirrorCard: 'Top Mirror (θ₁)',
      bottomMirrorCard: 'Bottom Mirror (θ₂)',
      exitDeviationCard: 'Exit Deviation',
      visibilityStateCard: 'Visibility State', // غير موثّق بمصدر
      clearView: 'Clear View', // غير موثّق بمصدر
      blockedView: 'Blocked', // غير موثّق بمصدر
      obstacleWallLabel: 'Obstacle Wall', // غير موثّق بمصدر
      targetObjectLabel: 'Target',
      observerLabel: 'Observer',
    },
    ku: {
      title: 'پێریسکۆپ و یاسای دانەوەی ڕووناکی',
      subtitle: 'هاوشێوەکەری پێریسکۆپ و بەکارهێنانی یاسای دانەوە بۆ بینینی پشت بەربەستە بەرزەکان بە ئاوێنەی ٤٥ پلە.',
      logMeasurement: 'تۆمارکردنی پێوانە', // غير موثّق بمصدر
      logged: 'تۆمارکرا ✓', // غير موثّق بمصدر
      controlsTitle: 'تایبەتمەندییەکانی گۆشەی ئاوێنەکان', // غير موثّق بمصدر
      bottomMirrorAngleLabel: 'گۆشەی ئاوێنەی خوارەوە (θ₂):',
      topMirrorAngleLabel: 'گۆشەی ئاوێنەی سەرەوە (θ₁):',
      periscopeHeightLabel: 'بەرزیی ستوونی پێریسکۆپ (H):', // غير موثّق بمصدر
      presetsLabel: 'بارە خێراکان:', // غير موثّق بمصدر
      preset45Align: 'ڕێکخستنی نموونەییی ٤٥°', // غير موثّق بمصدر
      presetTilt: 'لاادان و ناڕێکی', // غير موثّق بمصدر
      topMirrorCard: 'گۆشەی ئاوێنەی سەرەوە',
      bottomMirrorCard: 'گۆشەی ئاوێنەی خوارەوە',
      exitDeviationCard: 'لاادانی تیشکی دەرچوو',
      visibilityStateCard: 'باری بینینی بینەر', // غير موثّق بمصدر
      clearView: 'ڕوون و ڕاستەوخۆ', // غير موثّق بمصدر
      blockedView: 'نادیار / ڕێگراو', // غير موثّق بمصدر
      obstacleWallLabel: 'دیواری بەربەست', // غير موثّق بمصدر
      targetObjectLabel: 'ئامانج',
      observerLabel: 'چاوی بینەر',
    },
    kmr: {
      title: 'Pêrîskop û Qanûna Refleksiyonê',
      subtitle: 'Modelkirina pêrîskopê û bikaranîna qanûna refleksiyonê ji bo dîtina pişt astengiyên bilind bi neynika 45°.',
      logMeasurement: 'Tomarkirina pîvanê', // غير موثّق بمصدر
      logged: 'Hate tomarkirin ✓', // غير موثّق بمصدر
      controlsTitle: 'Parametreyên goşeya neynikan', // غير موثّق بمصدر
      bottomMirrorAngleLabel: 'Goşeya neynika jêrîn (θ₂):',
      topMirrorAngleLabel: 'Goşeya neynika jorîn (θ₁):',
      periscopeHeightLabel: 'Bilindahiya stûna pêrîskopê (H):', // غير موثّق بمصدر
      presetsLabel: 'Pêşantên lezgîn:', // غير موثّق بمصدر
      preset45Align: 'Rêzkirina bêkêmasî ya 45°', // غير موثّق بمصدر
      presetTilt: 'Laddan û xwarbûn', // غير موثّق بمصدر
      topMirrorCard: 'Goşeya neynika jorîn',
      bottomMirrorCard: 'Goşeya neynika jêrîn',
      exitDeviationCard: 'Devîyasyona tîşka derketî',
      visibilityStateCard: 'Rewşa dîtina çavnêr', // غير موثّق بمصدر
      clearView: 'Rûn û rasterast', // غير موثّق بمصدر
      blockedView: 'Nayê dîtin', // غير موثّق بمصدر
      obstacleWallLabel: 'Dîwarê asteng', // غير موثّق بمصدر
      targetObjectLabel: 'Amanç',
      observerLabel: 'Çavê çavnêr',
    },
  }[lang];

  // Inputs
  const [bottomMirrorAngleDeg, setBottomMirrorAngleDeg] = useState<number>(45); // degrees
  const [topMirrorAngleDeg, setTopMirrorAngleDeg] = useState<number>(45); // degrees
  const [periscopeHeightPx, setPeriscopeHeightPx] = useState<number>(200); // px
  const [objectHeightPx, setObjectHeightPx] = useState<number>(40); // px
  const [logged, setLogged] = useState<boolean>(false);

  // Physics Calculations
  // Law of reflection: θ_r = θ_i
  // For standard periscope, both mirrors at 45° redirect horizontal light 90° downward then 90° horizontally to eye
  // Exit ray deviation angle from horizontal:
  const topDeflection = 2 * (topMirrorAngleDeg - 45); // deviation from vertical
  const bottomDeflection = 2 * (bottomMirrorAngleDeg - 45);
  const totalExitAngleDeg = bottomDeflection - topDeflection;
  const isEyeAligned = Math.abs(bottomMirrorAngleDeg - 45) < 1.5 && Math.abs(topMirrorAngleDeg - 45) < 1.5;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawPeriscope(ctx, canvas.width, canvas.height);
      }
    }
  }, [bottomMirrorAngleDeg, topMirrorAngleDeg, periscopeHeightPx, objectHeightPx, isEyeAligned, totalExitAngleDeg]);

  const drawPeriscope = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

    // High wall / Obstacle in the middle
    const wallX = width * 0.38;
    const wallW = 40;
    const wallH = 260;
    const wallY = height - wallH - 20;

    ctx.fillStyle = '#27272a';
    ctx.fillRect(wallX, wallY, wallW, wallH);
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallX, wallY, wallW, wallH);

    // Brick pattern on obstacle wall
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    for (let by = wallY + 15; by < wallY + wallH; by += 20) {
      ctx.beginPath();
      ctx.moveTo(wallX, by);
      ctx.lineTo(wallX + wallW, by);
      ctx.stroke();
    }

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '9px monospace';
    ctx.fillText(t.obstacleWallLabel, wallX - 25, wallY - 8);

    // Periscope Tube Coordinates
    const tubeW = 44;
    const tubeCenterX = width * 0.52;
    const topMirrorY = 70;
    const botMirrorY = topMirrorY + periscopeHeightPx;

    // Outer Periscope Body
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    // Tube path (Z-like periscope tube)
    ctx.beginPath();
    // Top horizontal arm
    ctx.moveTo(tubeCenterX - 80, topMirrorY - tubeW / 2);
    ctx.lineTo(tubeCenterX + tubeW / 2, topMirrorY - tubeW / 2);
    ctx.lineTo(tubeCenterX + tubeW / 2, botMirrorY + tubeW / 2);
    // Bottom horizontal arm
    ctx.lineTo(tubeCenterX + 120, botMirrorY + tubeW / 2);
    ctx.lineTo(tubeCenterX + 120, botMirrorY - tubeW / 2);
    ctx.lineTo(tubeCenterX - tubeW / 2, botMirrorY - tubeW / 2);
    ctx.lineTo(tubeCenterX - tubeW / 2, topMirrorY + tubeW / 2);
    ctx.lineTo(tubeCenterX - 80, topMirrorY + tubeW / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 1. Top Mirror
    ctx.save();
    ctx.translate(tubeCenterX, topMirrorY);
    ctx.rotate(((topMirrorAngleDeg - 90) * Math.PI) / 180);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-tubeW * 0.7, 0);
    ctx.lineTo(tubeW * 0.7, 0);
    ctx.stroke();
    ctx.restore();

    // 2. Bottom Mirror
    ctx.save();
    ctx.translate(tubeCenterX, botMirrorY);
    ctx.rotate(((90 - bottomMirrorAngleDeg) * Math.PI) / 180);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-tubeW * 0.7, 0);
    ctx.lineTo(tubeW * 0.7, 0);
    ctx.stroke();
    ctx.restore();

    // Object (Target Ship / Tree / Star) on far left
    const objX = 60;
    const objY = topMirrorY;

    // Draw Ship / Object
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(objX - 25, objY + 15);
    ctx.lineTo(objX + 25, objY + 15);
    ctx.lineTo(objX + 15, objY + 28);
    ctx.lineTo(objX - 15, objY + 28);
    ctx.closePath();
    ctx.fill();

    // Flagpole
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objX, objY + 15);
    ctx.lineTo(objX, objY - objectHeightPx / 2);
    ctx.stroke();

    // Flag
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(objX, objY - objectHeightPx / 2);
    ctx.lineTo(objX + 16, objY - objectHeightPx / 2 + 8);
    ctx.lineTo(objX, objY - objectHeightPx / 2 + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(t.targetObjectLabel, objX - 25, objY + 45);

    // Observer's Eye on the Right
    const eyeX = tubeCenterX + 165;
    const eyeY = botMirrorY;

    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 14, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Iris & Pupil
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(eyeX - 4, eyeY, 7, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eyeX - 5, eyeY, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(t.observerLabel, eyeX - 35, eyeY + 30);

    // Light Ray Paths (Gold Laser Beam)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 6;

    // Segment 1: Object to Top Mirror
    ctx.beginPath();
    ctx.moveTo(objX + 15, topMirrorY);
    ctx.lineTo(tubeCenterX, topMirrorY);
    ctx.stroke();

    // Segment 2: Downwards inside periscope column
    // Top reflection angle
    const radTop = ((topMirrorAngleDeg - 45) * 2 * Math.PI) / 180;
    const botHitX = tubeCenterX + Math.sin(radTop) * periscopeHeightPx;
    ctx.beginPath();
    ctx.moveTo(tubeCenterX, topMirrorY);
    ctx.lineTo(botHitX, botMirrorY);
    ctx.stroke();

    // Segment 3: Bottom mirror out to eye
    const radExit = ((totalExitAngleDeg) * Math.PI) / 180;
    const exitRayEndX = eyeX + 30;
    const exitRayEndY = botMirrorY + Math.tan(radExit) * (exitRayEndX - botHitX);

    ctx.beginPath();
    ctx.moveTo(botHitX, botMirrorY);
    ctx.lineTo(exitRayEndX, exitRayEndY);
    ctx.stroke();

    ctx.shadowBlur = 0; // reset shadow
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'periscope',
      variableName: 'Periscope Ray Alignment (Law of Reflection)',
      measuredValue: Number(totalExitAngleDeg.toFixed(2)),
      theoreticalValue: 0.0,
      unit: 'Degrees (°)',
      parameters: {
        'Top Mirror Angle θ1': `${topMirrorAngleDeg}°`,
        'Bottom Mirror Angle θ2': `${bottomMirrorAngleDeg}°`,
        'Periscope Column Height': `${periscopeHeightPx} px`,
        'Ray Exit Deviation': `${totalExitAngleDeg.toFixed(1)}°`,
        'Eye Alignment': isEyeAligned ? 'Perfect Alignment (45°)' : 'Misaligned',
      },
      equation: `θ_i = θ_r, θ_deviation = 2·(θ₂ - θ₁), Perfect Alignment at θ₁ = θ₂ = 45°`,
      notes: `Optical periscope double reflection simulation demonstrating the Law of Reflection for surveillance over high obstacles.`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-zinc-900 to-sky-950/40 border border-teal-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Compass  className="w-5 h-5 text-teal-400"/>
            <span>
              {t.title}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={handleLog}
         className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30' }`}>
          <BookmarkCheck  className="w-4 h-4"/>
          <span>{logged ? t.logged : t.logMeasurement}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-teal-400"/>
              {t.controlsTitle}
            </span>
          </div>

          {/* Bottom Mirror Angle Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{t.bottomMirrorAngleLabel}</span>
              <span className="font-mono text-teal-400 font-semibold">{bottomMirrorAngleDeg}°</span>
            </div>
            <input
              type="range"
              min="30"
              max="60"
              step="1"
              value={bottomMirrorAngleDeg}
              onChange={(e) => setBottomMirrorAngleDeg(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>

          {/* Top Mirror Angle Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{t.topMirrorAngleLabel}</span>
              <span className="font-mono text-sky-400 font-semibold">{topMirrorAngleDeg}°</span>
            </div>
            <input
              type="range"
              min="30"
              max="60"
              step="1"
              value={topMirrorAngleDeg}
              onChange={(e) => setTopMirrorAngleDeg(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Periscope Height */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{t.periscopeHeightLabel}</span>
              <span className="font-mono text-zinc-300 font-semibold">{periscopeHeightPx} px</span>
            </div>
            <input
              type="range"
              min="120"
              max="240"
              step="10"
              value={periscopeHeightPx}
              onChange={(e) => setPeriscopeHeightPx(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[10px] text-zinc-400 block mb-1.5">
              {t.presetsLabel}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setBottomMirrorAngleDeg(45);
                  setTopMirrorAngleDeg(45);
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold"
              >
                {t.preset45Align}
              </button>
              <button
                onClick={() => {
                  setBottomMirrorAngleDeg(38);
                  setTopMirrorAngleDeg(52);
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold"
              >
                {t.presetTilt}
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
            {/* Top Reflection Angle */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.topMirrorCard}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {topMirrorAngleDeg}°
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">θ_i1 = θ_r1</span>
            </div>

            {/* Bottom Reflection Angle */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.bottomMirrorCard}
              </span>
              <div className="text-xl font-bold font-mono text-teal-400">
                {bottomMirrorAngleDeg}°
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">θ_i2 = θ_r2</span>
            </div>

            {/* Exit Ray Deviation */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.exitDeviationCard}
              </span>
              <div className={`text-xl font-bold font-mono ${isEyeAligned ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalExitAngleDeg.toFixed(1)}°
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">2·(θ₂ - θ₁)</span>
            </div>

            {/* View Alignment Status */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.visibilityStateCard}
              </span>
              <div className={`text-xs font-bold flex items-center gap-1 ${isEyeAligned ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isEyeAligned ? <CheckCircle2  className="w-4 h-4"/> : <AlertTriangle  className="w-4 h-4"/>}
                <span>{isEyeAligned ? t.clearView : t.blockedView}</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Parallel Mirrors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}