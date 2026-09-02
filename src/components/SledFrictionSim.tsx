import { Scale, Pause, Play, RotateCcw, BookmarkCheck, Sliders } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

type SurfaceType = 'ice' | 'wood' | 'grass' | 'sand';

const SURFACES: Record<SurfaceType, { nameAr: string; nameEn: string; muS: number; muK: number; color: string }> = {
  ice: { nameAr: 'جليد أملس (Ice)', nameEn: 'Smooth Ice', muS: 0.06, muK: 0.03, color: '#38bdf8' },
  wood: { nameAr: 'خشب مصقول (Wood)', nameEn: 'Polished Wood', muS: 0.35, muK: 0.25, color: '#d97706' },
  grass: { nameAr: 'عشب طبيعي (Grass)', nameEn: 'Natural Grass', muS: 0.50, muK: 0.38, color: '#22c55e' },
  sand: { nameAr: 'رمل / أسفلت (Sand)', nameEn: 'Rough Sand', muS: 0.75, muK: 0.58, color: '#eab308' },
};

export default function SledFrictionSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const t = {
    ar: {
      title: 'سباق التزلج وقوانين الاحتكاك الساكن والحركي',
      desc: 'مقارنة قوى الاحتكاك الساكن الأقصى fs = μs·N وقوة الاحتكاك الحركي fk = μk·N وحساب التسارع وسرعة الانزلاق عبر أسطح الجليد والخشب والعشب والرمل.',
      resetPosition: 'إعادة ضبط الموقع', // غير موثّق بمصدر
      logged: 'تم التسجيل في الدفتر ✓', // غير موثّق بمصدر
      log: 'تسجيل في دفتر المختبر', // غير موثّق بمصدر
      controlsTitle: 'معايير الاحتكاك والدفع', // غير موثّق بمصدر
      surfaceType: 'نوع سطح المسار:',
      massLabel: 'كتلة الصندوق (m):',
      pushForceLabel: 'قوة الدفع المطبقة (F_push):',
      staticLimit: 'حد الاحتكاك الساكن (fs,max)',
      kineticFriction: 'الاحتكاك الحركي (fk)',
      acceleration: 'التسارع الناتج (a)',
      normalForce: 'القوة العمودية (N)',
      surfaces: {
        ice: 'جليد أملس (Ice)',
        wood: 'خشب مصقول (Wood)',
        grass: 'عشب طبيعي (Grass)',
        sand: 'رمل / أسفلت (Sand)',
      },
    },
    en: {
      title: 'Sled Friction Race (Static & Kinetic)',
      desc: 'Comparing static friction threshold fs = μs·N with kinetic sliding friction fk = μk·N across varied terrains.',
      resetPosition: 'Reset Position', // غير موثّق بمصدر
      logged: 'Logged ✓', // غير موثّق بمصدر
      log: 'Log Measurement', // غير موثّق بمصدر
      controlsTitle: 'Friction & Push Controls', // غير موثّق بمصدر
      surfaceType: 'Track Surface Type:',
      massLabel: 'Sled Mass (m):',
      pushForceLabel: 'Push Force (F_push):',
      staticLimit: 'Static Limit (fs,max)',
      kineticFriction: 'Kinetic Friction (fk)',
      acceleration: 'Acceleration (a)',
      normalForce: 'Normal Force (N)',
      surfaces: {
        ice: 'Smooth Ice',
        wood: 'Polished Wood',
        grass: 'Natural Grass',
        sand: 'Rough Sand',
      },
    },
    ku: {
      title: 'پێشبڕکێی خلیسکێنە و یاساکانی لێکخشاندن',
      desc: 'بەراوردکردنی هێزی لێکخشاندنی نەجووڵاو و جووڵاو لەسەر ڕووی جیاواز وەک سەهۆڵ، دار و گیا.',
      resetPosition: 'گەڕاندنەوەی شوێن', // غير موثّق بمصدر
      logged: 'تۆمارکرا لە دەفتەر ✓', // غير موثّق بمصدر
      log: 'تۆمارکردنی پێوانە', // غير موثّق بمصدر
      controlsTitle: 'کۆنترۆڵەکانی لێکخشاندن و پاڵنان', // غير موثّق بمصدر
      surfaceType: 'جۆری ڕووی ڕێڕەو:',
      massLabel: 'بارستەی سندوقەکە (m):',
      pushForceLabel: 'هێزی پاڵنانی سەپێنراو (F_push):',
      staticLimit: 'سنووری لێکخشاندنی سكونی (fs,max)',
      kineticFriction: 'لێکخشاندنی جووڵەیی (fk)',
      acceleration: 'تاودانی ئاکام (a)',
      normalForce: 'هێزی ئەستوون (N)',
      surfaces: {
        ice: 'سەهۆڵی لوس',
        wood: 'داری لوس',
        grass: 'گیا',
        sand: 'لم / ئاسفالت',
      },
    },
    kmr: {
      title: 'Pêşbirka Xilîskînê û Qanûnên Lêkdanê',
      desc: 'Berdewambûna hêza lêkdana sekinî fs = μs·N û hêza lêkdana tevgerî fk = μk·N li ser erdên cûda.',
      resetPosition: 'Zivirandina شوێنê', // غير موثّق بمصدر
      logged: 'Hat tomarkirin ✓', // غير موثّق بمصدر
      log: 'Tomarkirina pîvanê', // غير موثّق بمصدر
      controlsTitle: 'Kontrolên lêkdan û paldanê', // غير موثّق بمصدر
      surfaceType: 'Cûreyê rûyê rêyê:',
      massLabel: 'Baristeya sindoqê (m):',
      pushForceLabel: 'Hêza paldanê ya sepandî (F_push):',
      staticLimit: 'Sînorê lêkdana sekinî (fs,max)',
      kineticFriction: 'Lêkdana tevgerî (fk)',
      acceleration: 'Lezkirin (a)',
      normalForce: 'Hêza stûnî (N)',
      surfaces: {
        ice: 'Cemed',
        wood: 'Dar',
        grass: 'Giya',
        sand: 'Xem',
      },
    },
  }[lang] || {
    title: 'سباق التزلج وقوانين الاحتكاك الساكن والحركي',
    desc: 'مقارنة قوى الاحتكاك الساكن الأقصى fs = μs·N وقوة الاحتكاك الحركي fk = μk·N وحساب التسارع وسرعة الانزلاق عبر أسطح الجليد والخشب والعشب والرمل.',
    resetPosition: 'إعادة ضبط الموقع',
    logged: 'تم التسجيل في الدفتر ✓',
    log: 'تسجيل في دفتر المختبر',
    controlsTitle: 'معايير الاحتكاك والدفع',
    surfaceType: 'نوع سطح المسار:',
    massLabel: 'كتلة الصندوق (m):',
    pushForceLabel: 'قوة الدفع المطبقة (F_push):',
    staticLimit: 'حد الاحتكاك الساكن (fs,max)',
    kineticFriction: 'الاحتكاك الحركي (fk)',
    acceleration: 'التسارع الناتج (a)',
    normalForce: 'القوة العمودية (N)',
    surfaces: {
      ice: 'جليد أملس (Ice)',
      wood: 'خشب مصقول (Wood)',
      grass: 'عشب طبيعي (Grass)',
      sand: 'رمل / أسفلت (Sand)',
    },
  };

  const [surface, setSurface] = useState<SurfaceType>('wood');
  const [sledMassKg, setSledMassKg] = useState<number>(20); // kg
  const [pushForceN, setPushForceN] = useState<number>(100); // N
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Dynamic physics states
  const sledPosRef = useRef<number>(50); // px
  const sledVelRef = useRef<number>(0); // m/s

  const g = 9.80665;
  const normalForceN = sledMassKg * g;
  const { muS, muK } = SURFACES[surface];
  const maxStaticFrictionN = muS * normalForceN;
  const kineticFrictionN = muK * normalForceN;

  // Static vs Kinetic condition
  const willMove = pushForceN > maxStaticFrictionN || sledVelRef.current > 0.001;
  const currentFrictionN = willMove ? kineticFrictionN : Math.min(pushForceN, maxStaticFrictionN);
  const netForceN = willMove ? pushForceN - kineticFrictionN : 0;
  const acceleration = willMove ? netForceN / sledMassKg : 0;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRunning) {
        if (willMove) {
          sledVelRef.current += acceleration * dt;
          if (sledVelRef.current < 0) sledVelRef.current = 0;
          sledPosRef.current += sledVelRef.current * dt * 45; // scale to pixels

          // Wrap around track
          if (sledPosRef.current > 580) {
            sledPosRef.current = 40;
          }
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawFrictionRace(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [surface, sledMassKg, pushForceN, isRunning, willMove, acceleration, maxStaticFrictionN, kineticFrictionN]);

  const drawFrictionRace = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

    const groundY = height * 0.70;

    // Track Surface Line & Ground Material
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, groundY, width, height - groundY);

    ctx.strokeStyle = SURFACES[surface].color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Sled Position
    const sx = sledPosRef.current;
    const sledW = 90;
    const sledH = 45;
    const sy = groundY - sledH;

    // Sled Runner Runners
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(sx - 10, groundY);
    ctx.lineTo(sx + sledW + 15, groundY);
    ctx.lineTo(sx + sledW + 24, groundY - 14);
    ctx.stroke();

    // Sled Body Box
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(sx, sy + 6, sledW, sledH - 6);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy + 6, sledW, sledH - 6);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${sledMassKg} kg`, sx + sledW / 2 - 18, sy + 28);

    // Free Body Force Vectors (FBD)
    const centerX = sx + sledW / 2;
    const centerY = sy + sledH / 2;

    // 1. Normal Force N (Upward)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - 45);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`N = ${normalForceN.toFixed(0)}N`, centerX - 25, centerY - 50);

    // 2. Gravity Force W = mg (Downward)
    ctx.strokeStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY + 45);
    ctx.stroke();
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`W = ${normalForceN.toFixed(0)}N`, centerX - 25, centerY + 60);

    // 3. Push Force F_push (Rightward)
    if (pushForceN > 0) {
      const pushLen = Math.min(pushForceN * 0.45, 90);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + pushLen, centerY);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(centerX + pushLen + 6, centerY);
      ctx.lineTo(centerX + pushLen, centerY - 4);
      ctx.lineTo(centerX + pushLen, centerY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 10px monospace';
      ctx.fillText(`F_push = ${pushForceN}N`, centerX + pushLen + 10, centerY + 4);
    }

    // 4. Friction Force f (Leftward)
    if (currentFrictionN > 0) {
      const fLen = Math.min(currentFrictionN * 0.45, 80);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX - fLen, centerY);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(centerX - fLen - 6, centerY);
      ctx.lineTo(centerX - fLen, centerY - 4);
      ctx.lineTo(centerX - fLen, centerY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 10px monospace';
      ctx.fillText(`f = ${currentFrictionN.toFixed(0)}N`, centerX - fLen - 70, centerY + 4);
    }
  };

  const handleReset = () => {
    sledPosRef.current = 50;
    sledVelRef.current = 0;
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'sled_friction',
      variableName: 'Friction Force & Acceleration (Sled Friction Race)',
      measuredValue: Number(currentFrictionN.toFixed(2)),
      theoreticalValue: Number(willMove ? kineticFrictionN.toFixed(2) : Math.min(pushForceN, maxStaticFrictionN).toFixed(2)),
      unit: 'N',
      parameters: {
        'Surface Material': SURFACES[surface].nameEn,
        'Static Friction Coeff μs': muS,
        'Kinetic Friction Coeff μk': muK,
        'Sled Mass m': `${sledMassKg} kg`,
        'Push Force F_push': `${pushForceN} N`,
        'Normal Force N': `${normalForceN.toFixed(1)} N`,
        'Max Static Friction fs,max': `${maxStaticFrictionN.toFixed(1)} N`,
        'Kinetic Friction fk': `${kineticFrictionN.toFixed(1)} N`,
        'Acceleration a': `${acceleration.toFixed(2)} m/s²`,
        'Motion Status': willMove ? 'Moving / Accelerating' : 'Static / Stationary',
      },
      equation: `fs,max = μs·N = ${muS}·${normalForceN.toFixed(0)} = ${maxStaticFrictionN.toFixed(1)} N, fk = μk·N = ${kineticFrictionN.toFixed(1)} N, Fnet = ma`,
      notes: `Friction race simulation comparing static friction barrier and kinetic sliding friction across multiple terrain surfaces.`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-amber-950/40 border border-indigo-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{t.desc}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            title={t.resetPosition}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLog}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
              logged
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{logged ? t.logged : t.log}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              {t.controlsTitle}
            </span>
          </div>

          {/* Surface Type Selector */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">
              {t.surfaceType}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(SURFACES) as SurfaceType[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setSurface(st)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-start ${
                    surface === st
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div>{t.surfaces[st]}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">μs={SURFACES[st].muS}, μk={SURFACES[st].muK}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sled Mass Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{t.massLabel}</span>
              <span className="font-mono text-indigo-400 font-semibold">{sledMassKg} kg</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={sledMassKg}
              onChange={(e) => setSledMassKg(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Push Force Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{t.pushForceLabel}</span>
              <span className="font-mono text-emerald-400 font-semibold">{pushForceN} N</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={pushForceN}
              onChange={(e) => setPushForceN(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
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
              className="w-full h-[360px] rounded-xl bg-zinc-950 block shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Max Static Friction */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.staticLimit}
              </span>
              <div className="text-xl font-bold font-mono text-rose-400">
                {maxStaticFrictionN.toFixed(1)} <span className="text-xs text-zinc-400">N</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">fs,max = μs · N</span>
            </div>

            {/* Kinetic Friction fk */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.kineticFriction}
              </span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {kineticFrictionN.toFixed(1)} <span className="text-xs text-zinc-400">N</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">fk = μk · N</span>
            </div>

            {/* Acceleration a */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.acceleration}
              </span>
              <div className={`text-xl font-bold font-mono ${willMove ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {acceleration.toFixed(2)} <span className="text-xs text-zinc-400">m/s²</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">a = (F - fk)/m</span>
            </div>

            {/* Normal Force N */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.normalForce}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {normalForceN.toFixed(1)} <span className="text-xs text-zinc-400">N</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">N = m · g</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}