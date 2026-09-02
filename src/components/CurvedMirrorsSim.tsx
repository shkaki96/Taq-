import { Eye, BookmarkCheck, Sliders } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function CurvedMirrorsSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const localT = {
    ar: {
      title: 'المرايا الكروية المقعرة والمحدبة',
      subtitle: 'دراسة تكون الصور في المرايا الكروية بقانون 1/f = 1/do + 1/di، التكبير m = -di/do، ومسارات الأشعة النموذجية الثلاثة.',
      logged: 'تم التسجيل في الدفتر ✓',
      logMeasurement: 'تسجيل في دفتر المختبر',
      controlsTitle: 'معايير المرآة والجسم',
      mirrorTypeLabel: 'نوع المرآة الكروية:',
      concaveBtn: 'مقعرة (+f)',
      convexBtn: 'محدبة (-f)',
      radiusLabel: 'نصف قطر التكور (R):',
      objectDistLabel: 'بعد الجسم عن المرآة (do):',
      objectHeightLabel: 'طول الجسم (ho):',
      showPrincipalRaysLabel: 'إظهار الأشعة البصرية الثلاثة:',
      imageSpecsCard: 'طوبوغرافيا ومواصفات الصورة الناتجة:',
      realTag: 'حقيقية (Real)',
      virtualTag: 'خيالية (Virtual)',
      invertedTag: 'مقلوبة (Inverted)',
      uprightTag: 'معتدلة (Upright)',
      enlargedTag: 'مكبرة (Enlarged)',
      reducedTag: 'مصغرة (Reduced)',
      sameSizeTag: 'مساوية للأصل',
      focalLengthCard: 'البعد البؤري (f)',
      imageDistCard: 'بعد الصورة (di)',
      magnificationCard: 'معامل التكبير (m)',
      imageHeightCard: 'طول الصورة (hi)',
      objectCanvas: 'الجسم', // غير موثّق بمصدر
      imageCanvas: 'الصورة', // غير موثّق بمصدر
      realWord: 'حقيقية',
      virtualWord: 'خيالية',
      concaveWord: 'مقعرة',
      convexWord: 'محدبة',
      realInvertedWord: 'حقيقية ومقلوبة',
      virtualUprightWord: 'خيالية ومعتدلة',
      varImageDist: 'بعد الصورة di', // غير موثّق بمصدر
      notesLog: 'محاكاة بصريات المرايا الكروية مع رسم مسارات الأشعة.', // غير موثّق بمصدر
    },
    en: {
      title: 'Curved Spherical Mirrors (Ray Tracing)',
      subtitle: 'Spherical mirror optics, mirror equation 1/f = 1/do + 1/di, magnification m = -di/do, and 3 principal ray diagrams.',
      logged: 'Logged ✓',
      logMeasurement: 'Log Measurement',
      controlsTitle: 'Mirror & Object Controls',
      mirrorTypeLabel: 'Mirror Type:',
      concaveBtn: 'Concave (+f)',
      convexBtn: 'Convex (-f)',
      radiusLabel: 'Radius of Curvature (R):',
      objectDistLabel: 'Object Distance (do):',
      objectHeightLabel: 'Object Height (ho):',
      showPrincipalRaysLabel: 'Show 3 Principal Rays:',
      imageSpecsCard: 'Image Characteristics:',
      realTag: 'Real',
      virtualTag: 'Virtual',
      invertedTag: 'Inverted',
      uprightTag: 'Upright',
      enlargedTag: 'Enlarged',
      reducedTag: 'Reduced',
      sameSizeTag: 'Same Size',
      focalLengthCard: 'Focal Length (f)',
      imageDistCard: 'Image Distance (di)',
      magnificationCard: 'Magnification (m)',
      imageHeightCard: 'Image Height (hi)',
      objectCanvas: 'Object', // غير موثّق بمصدر
      imageCanvas: 'Image', // غير موثّق بمصدر
      realWord: 'Real',
      virtualWord: 'Virtual',
      concaveWord: 'Concave',
      convexWord: 'Convex',
      realInvertedWord: 'Real & Inverted',
      virtualUprightWord: 'Virtual & Upright',
      varImageDist: 'Image Distance di', // غير موثّق بمصدر
      notesLog: 'Spherical curved mirror optics simulation with principal reflection rays.', // غير موثّق بمصدر
    },
    ku: {
      title: 'ئاوێنە گۆییە قۆقز و چاڵەکان و دروستبوونی وێنە',
      subtitle: 'لێکۆڵینەوە لە دروستبوونی وێنە لە ئاوێنە چاڵ و قۆقزەکان بە یاسای ١/f = ١/do + ١/di و گەورەکردن m = -di/do.',
      logged: 'تۆمارکرا ✓',
      logMeasurement: 'تۆمارکردن لە دەفتەر',
      controlsTitle: 'تایبەتمەندییەکانی ئاوێنە و تشتەکە',
      mirrorTypeLabel: 'جۆری ئاوێنەی گۆیی:',
      concaveBtn: 'چاڵ (+f)',
      convexBtn: 'قۆقز (-f)',
      radiusLabel: 'نیوەتیرەی چەمانەوە (R):',
      objectDistLabel: 'دووری تشتەکە لە ئاوێنە (do):',
      objectHeightLabel: 'بەرزایی تشتەکە (ho):',
      showPrincipalRaysLabel: 'پیشاندانی سێ تیشکە سەرەکییەکە:',
      imageSpecsCard: 'تایبەتمەندییەکانی وێنەی دروستبوو:',
      realTag: 'ڕاستەقینە (Real)',
      virtualTag: 'خەیاڵی (Virtual)',
      invertedTag: 'پێچەوانە (Inverted)',
      uprightTag: 'ڕاست (Upright)',
      enlargedTag: 'گەورەکراو (Enlarged)',
      reducedTag: 'بچووککراوە (Reduced)',
      sameSizeTag: 'هاوئەندازەی تشتەکە',
      focalLengthCard: 'دووریی بؤڕە (f)',
      imageDistCard: 'دووریی وێنەکە (di)',
      magnificationCard: 'هاوڵکەی گەورەکردن (m)',
      imageHeightCard: 'بەرزایی وێنەکە (hi)',
      objectCanvas: 'تشتەکە', // غير موثّق بمصدر
      imageCanvas: 'وێنەکە', // غير موثّق بمصدر
      realWord: 'ڕاستەقینە',
      virtualWord: 'خەیاڵی',
      concaveWord: 'چاڵ',
      convexWord: 'قۆقز',
      realInvertedWord: 'ڕاستەقینە و پێچەوانە',
      virtualUprightWord: 'خەیاڵی و ڕاست',
      varImageDist: 'دووری وێنەکە di', // غير موثّق بمصدر
      notesLog: 'تاقیکردنەوەی ئاوێنە گۆییەکان و وێنەی دروستبوو.', // غير موثّق بمصدر
    },
    kmr: {
      title: 'Neynikên Goyer ên Çal û Gir',
      subtitle: 'Lêkolîna çêbûna dîmen di neynikên goyer de bi hevkêşeya 1/f = 1/do + 1/di û mezinahî m = -di/do.',
      logged: 'Tomaarkirî ✓',
      logMeasurement: 'Pîvanê Tomar Bikin',
      controlsTitle: 'Taybetmendiyên Neynik û Gewdeyê',
      mirrorTypeLabel: 'Cureyê Neynika Goyer:',
      concaveBtn: 'Çal (+f)',
      convexBtn: 'Gir (-f)',
      radiusLabel: 'Nîvçapa xwarbûnê (R):',
      objectDistLabel: 'Dûrahiya gewdeyê ji neynikê (do):',
      objectHeightLabel: 'Bilindahiya gewdeyê (ho):',
      showPrincipalRaysLabel: 'Herdû 3 tîrêjên serdest nîşan bide:',
      imageSpecsCard: 'Taybetmendiyên Dîmenê:',
      realTag: 'Rastî (Real)',
      virtualTag: 'Xeyalî (Virtual)',
      invertedTag: 'Serjêr (Inverted)',
      uprightTag: 'Serrast (Upright)',
      enlargedTag: 'Mezinkirî (Enlarged)',
      reducedTag: 'Bicûkkirî (Reduced)',
      sameSizeTag: 'Hem اندازه',
      focalLengthCard: 'Dûrahiya Tîrê (f)',
      imageDistCard: 'Dûrahiya Dîmenê (di)',
      magnificationCard: 'Hevkêşeya Mezinahiyê (m)',
      imageHeightCard: 'Bilindahiya Dîmenê (hi)',
      objectCanvas: 'Gewde', // غير موثّق بمصدر
      imageCanvas: 'Dîmen', // غير موثّق بمصدر
      realWord: 'Rastî',
      virtualWord: 'Xeyalî',
      concaveWord: 'Çal',
      convexWord: 'Gir',
      realInvertedWord: 'Rastî û Serjêr',
      virtualUprightWord: 'Xeyalî û Serrast',
      varImageDist: 'Dûrahiya Dîmenê di', // غير موثّق بمصدر
      notesLog: 'Taqîkirina neynikên goyer bi rêya tîrêjên vajîbûnê.', // غير موثّق بمصدر
    },
  }[lang];

  // Parameters
  const [mirrorType, setMirrorType] = useState<'concave' | 'convex'>('concave');
  const [radiusCm, setRadiusCm] = useState<number>(40); // cm (Radius of curvature R)
  const [objectDistanceCm, setObjectDistanceCm] = useState<number>(50); // cm (do)
  const [objectHeightCm, setObjectHeightCm] = useState<number>(15); // cm (ho)
  const [showPrincipalRays, setShowPrincipalRays] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Geometric Optics Calculations
  // For Concave: f > 0, R > 0. For Convex: f < 0, R < 0
  const isConcave = mirrorType === 'concave';
  const focalLengthCm = isConcave ? radiusCm / 2 : -radiusCm / 2;

  // Mirror Equation: 1/f = 1/do + 1/di => di = (f * do) / (do - f)
  const denom = objectDistanceCm - focalLengthCm;
  const isAtFocus = Math.abs(denom) < 0.1;
  const imageDistanceCm = isAtFocus ? (denom >= 0 ? 9999 : -9999) : (focalLengthCm * objectDistanceCm) / denom;

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
    // Vertex V is at (vertexX, centerY)
    const vertexX = width * 0.58;
    const centerY = height * 0.52;
    const scale = 3.8; // pixels per cm

    // Draw Principal Axis
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, centerY);
    ctx.lineTo(width - 20, centerY);
    ctx.stroke();

    // Key Optical Points:
    // Focus F
    const fPixelX = vertexX - focalLengthCm * scale;
    // Center of Curvature C
    const cPixelX = vertexX - (isConcave ? radiusCm : -radiusCm) * scale;

    // Draw Curved Mirror Surface (Arc)
    const mirrorH = 240;
    const mirrorRPx = radiusCm * scale;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();

    if (isConcave) {
      // Arc curves to the left from C
      ctx.arc(vertexX - mirrorRPx, centerY, mirrorRPx, -Math.asin(mirrorH / (2 * mirrorRPx)), Math.asin(mirrorH / (2 * mirrorRPx)));
    } else {
      // Arc curves to the right
      ctx.arc(vertexX + mirrorRPx, centerY, mirrorRPx, Math.PI - Math.asin(mirrorH / (2 * mirrorRPx)), Math.PI + Math.asin(mirrorH / (2 * mirrorRPx)));
    }
    ctx.stroke();

    // Mirror Backside Hatching
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    for (let y = -mirrorH / 2; y <= mirrorH / 2; y += 16) {
      const my = centerY + y;
      const mx = vertexX + (isConcave ? 2 : -2);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + (isConcave ? 8 : -8), my - 6);
      ctx.stroke();
    }

    // Draw Optical Points markers (V, F, C)
    // Vertex V
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(vertexX, centerY, 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = 'bold 11px monospace';
    ctx.fillText('V', vertexX - 4, centerY + 18);

    // Focus F
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(fPixelX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText(`F (${Math.abs(focalLengthCm).toFixed(0)}cm)`, fPixelX - 18, centerY + 18);

    // Center C
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cPixelX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText(`C (${radiusCm}cm)`, cPixelX - 15, centerY + 18);

    // Draw Object Arrow (Candle)
    const objPixelX = vertexX - objectDistanceCm * scale;
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
    ctx.fillText(`${localT.objectCanvas} (do=${objectDistanceCm}cm)`, objPixelX - 35, objPixelY - 10);

    // Draw Image Arrow
    if (!isAtFocus && Math.abs(imageDistanceCm) < 300) {
      const imgPixelX = vertexX - imageDistanceCm * scale;
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
      ctx.fillText(
        `${localT.imageCanvas} (${isReal ? localT.realWord : localT.virtualWord}, di=${imageDistanceCm.toFixed(1)}cm)`,
        imgPixelX - 45,
        imgPixelY + (isInverted ? 20 : -10)
      );

      // --- PRINCIPAL RAY TRACING ---
      if (showPrincipalRays) {
        // Ray 1 (Red): Parallel to axis -> reflects through Focus F
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.2;
        // Incident parallel ray
        ctx.beginPath();
        ctx.moveTo(objPixelX, objPixelY);
        ctx.lineTo(vertexX, objPixelY);
        ctx.stroke();

        // Reflected Ray
        if (isConcave) {
          // Passes through F
          const slope = (centerY - objPixelY) / (fPixelX - vertexX);
          ctx.beginPath();
          ctx.moveTo(vertexX, objPixelY);
          ctx.lineTo(vertexX - 350, objPixelY - 350 * slope);
          ctx.stroke();

          // Virtual trace behind mirror if virtual
          if (!isReal) {
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(vertexX, objPixelY);
            ctx.lineTo(imgPixelX, imgPixelY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else {
          // Convex reflects diverging away from virtual Focus F
          const slope = (centerY - objPixelY) / (fPixelX - vertexX);
          ctx.beginPath();
          ctx.moveTo(vertexX, objPixelY);
          ctx.lineTo(vertexX - 250, objPixelY - 250 * slope);
          ctx.stroke();

          // Virtual dashed line to F
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(vertexX, objPixelY);
          ctx.lineTo(fPixelX, centerY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Ray 2 (Yellow): Toward/Through Vertex V -> reflects symmetrically (θ_i = θ_r)
        ctx.strokeStyle = '#eab308';
        // Incident to V
        ctx.beginPath();
        ctx.moveTo(objPixelX, objPixelY);
        ctx.lineTo(vertexX, centerY);
        ctx.stroke();
        // Reflected symmetrically
        const vSlope = (centerY - objPixelY) / (vertexX - objPixelX);
        ctx.beginPath();
        ctx.moveTo(vertexX, centerY);
        ctx.lineTo(vertexX - 250, centerY + 250 * vSlope);
        ctx.stroke();

        // Virtual trace behind mirror
        if (!isReal) {
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(vertexX, centerY);
          ctx.lineTo(imgPixelX, imgPixelY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

  }, [mirrorType, radiusCm, objectDistanceCm, objectHeightCm, showPrincipalRays, focalLengthCm, imageDistanceCm, imageHeightCm, isAtFocus, isReal, isInverted, localT]);

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'curved_mirrors',
      variableName: `${localT.varImageDist} (${mirrorType === 'concave' ? localT.concaveWord : localT.convexWord})`,
      measuredValue: Number(imageDistanceCm.toFixed(2)),
      theoreticalValue: Number(imageDistanceCm.toFixed(2)),
      unit: 'cm',
      parameters: {
        'Mirror Type': mirrorType === 'concave' ? localT.concaveWord : localT.convexWord,
        'Curvature Radius R': `${radiusCm} cm`,
        'Focal Length f': `${focalLengthCm.toFixed(1)} cm`,
        'Object Distance do': `${objectDistanceCm} cm`,
        'Object Height ho': `${objectHeightCm} cm`,
        'Magnification m': `${magnification.toFixed(3)}`,
        'Image Nature': isReal ? localT.realInvertedWord : localT.virtualUprightWord,
      },
      equation: `1/f = 1/do + 1/di => di = (f · do) / (do - f) = (${focalLengthCm} · ${objectDistanceCm}) / (${objectDistanceCm} - ${focalLengthCm}) = ${imageDistanceCm.toFixed(2)} cm, m = -di/do = ${magnification.toFixed(2)}`,
      notes: localT.notesLog,
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
            <span>{localT.title}</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {localT.subtitle}
          </p>
        </div>

        <button className="min-h-[44px] min-w-[44px]"
          onClick={handleLog}
         className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30' }`}>
          <BookmarkCheck  className="w-4 h-4"/>
          <span>{logged ? localT.logged : localT.logMeasurement}</span>
        </button>
      </div>

      {/* Main Grid: Controls + Interactive Optical Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-sky-400"/>
              {localT.controlsTitle}
            </span>
          </div>

          {/* Mirror Type Radio Tabs */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5 font-medium">
              {localT.mirrorTypeLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button className="min-h-[44px] min-w-[44px]"
                onClick={() => setMirrorType('concave')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  mirrorType === 'concave'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                {localT.concaveBtn}
              </button>
              <button className="min-h-[44px] min-w-[44px]"
                onClick={() => setMirrorType('convex')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  mirrorType === 'convex'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                {localT.convexBtn}
              </button>
            </div>
          </div>

          {/* Radius of Curvature Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{localT.radiusLabel}</span>
              <span className="font-mono text-purple-400 font-semibold">{radiusCm} cm (f = {(focalLengthCm).toFixed(1)} cm)</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="2"
              value={radiusCm}
              onChange={(e) => setRadiusCm(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Object Distance (do) Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{localT.objectDistLabel}</span>
              <span className="font-mono text-emerald-400 font-semibold">{objectDistanceCm} cm</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={objectDistanceCm}
              onChange={(e) => setObjectDistanceCm(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Object Height (ho) Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{localT.objectHeightLabel}</span>
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
            <span className="text-zinc-300">{localT.showPrincipalRaysLabel}</span>
            <input
              type="checkbox"
              checked={showPrincipalRays}
              onChange={(e) => setShowPrincipalRays(e.target.checked)}
              className="accent-sky-500 cursor-pointer w-4 h-4"
            />
          </div>

          {/* Image Nature State Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              {localT.imageSpecsCard}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span
               className={`px-2 py-0.5 rounded text-xs font-semibold ${ isReal ? 'bg-rose-500/20 text-rose-300' : 'bg-purple-500/20 text-purple-300' }`}>
                {isReal ? localT.realTag : localT.virtualTag}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300">
                {isInverted ? localT.invertedTag : localT.uprightTag}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300">
                {isEnlarged
                  ? localT.enlargedTag
                  : isReduced
                  ? localT.reducedTag
                  : localT.sameSizeTag}
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
            {/* Focal Length */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {localT.focalLengthCard}
              </span>
              <div className="text-xl font-bold font-mono text-purple-400">
                {focalLengthCm.toFixed(1)} <span className="text-sm text-zinc-400">cm</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">f = R / 2</span>
            </div>

            {/* Image Distance di */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {localT.imageDistCard}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {isAtFocus ? '∞' : imageDistanceCm.toFixed(2)} <span className="text-sm text-zinc-400">cm</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">1/f = 1/do + 1/di</span>
            </div>

            {/* Magnification m */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {localT.magnificationCard}
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {isAtFocus ? '∞' : magnification.toFixed(3)}x
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">m = -di / do</span>
            </div>

            {/* Image Height hi */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {localT.imageHeightCard}
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