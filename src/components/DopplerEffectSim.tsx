import { Radio, Pause, Play, RotateCcw, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Language } from '../types';

import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

export default function DopplerEffectSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const t = {
    ar: {
      title: 'محاكاة تأثير دوبلر (Doppler Effect)',
      pause: 'إيقاف', // غير موثّق بمصدر
      play: 'تشغيل', // غير موثّق بمصدر
      resetPosition: 'إعادة ضبط الموقع', // غير موثّق بمصدر
      log: 'تسجيل القياس', // غير موثّق بمصدر
      approaching: '← المصدر يقترب من الراصد (تردد أعلى)',
      receding: 'المصدر يبتعد عن الراصد (تردد أقل) →',
      observer: 'الراصد',
      source: 'المصدر',
      emittedFreq: 'التردد المنبعث (f)',
      observedFreq: "التردد المرصود (f')",
      freqShift: 'إزاحة التردد (Δf)',
      pitchRatio: "نسبة النغمة (f'/f)",
      simulationControls: 'عناصر التحكم بالمتغيرات', // غير موثّق بمصدر
      sourceSpeed: 'سرعة المصدر (vₛ):',
      emittedFreqInput: 'التردد المنبعث (f):',
      speedOfSound: 'سرعة الصوت في الوسط (v):',
      observerSpeed: 'سرعة الراصد (vₒ):',
      wavelengthFront: 'الطول الموجي في الأمام (λ_front)',
      wavelengthBack: 'الطول الموجي في الخلف (λ_back)',
      restWavelength: 'الطول الموجي الساكن (λ₀)',
      machNumber: 'معامل ماخ (Mach Number)',
      subsonic: 'دون صوتي',
      supersonic: 'فوق صوتي',
    },
    en: {
      title: 'Doppler Effect Simulation',
      pause: 'Pause', // غير موثّق بمصدر
      play: 'Play', // غير موثّق بمصدر
      resetPosition: 'Reset Position', // غير موثّق بمصدر
      log: 'Log Measurement', // غير موثّق بمصدر
      approaching: '← Source Approaching (Higher Pitch)',
      receding: 'Source Receding (Lower Pitch) →',
      observer: 'Observer',
      source: 'Source',
      emittedFreq: 'Emitted Freq (f)',
      observedFreq: "Observed Freq (f')",
      freqShift: 'Freq Shift (Δf)',
      pitchRatio: "Pitch Ratio (f'/f)",
      simulationControls: 'Simulation Controls', // غير موثّق بمصدر
      sourceSpeed: 'Source Speed (vₛ):',
      emittedFreqInput: 'Emitted Freq (f):',
      speedOfSound: 'Speed of Sound (v):',
      observerSpeed: 'Observer Speed (vₒ):',
      wavelengthFront: 'Wavelength in Front',
      wavelengthBack: 'Wavelength in Back',
      restWavelength: 'Rest Wavelength',
      machNumber: 'Mach Number',
      subsonic: 'Subsonic',
      supersonic: 'Supersonic',
    },
    ku: {
      title: 'کاریگەری دۆپلەر (Doppler Effect)',
      pause: 'ڕاگرتن', // غير موثّق بمصدر
      play: 'دەستپێکردن', // غير موثّق بمصدر
      resetPosition: 'گەڕاندنەوەی شوێن', // غير موثّق بمصدر
      log: 'تۆمارکردنی پێوانە', // غير موثّق بمصدر
      approaching: '← سەرچاوە لە بینەر ننزیک دەبێتەوە (فرێکوێنسی بەرزتر)',
      receding: 'سەرچاوە لە بینەر دوور دەکەوێتەوە (فرێکوێنسی نزمتر) →',
      observer: 'بینەر',
      source: 'سەرچاوە',
      emittedFreq: 'فرێکوێنسیی دەرچوو (f)',
      observedFreq: "فرێکوێنسیی بینراو (f')",
      freqShift: 'لایەنگریی فرێکوێنسی (Δf)',
      pitchRatio: "ڕێژەی دەنگ (f'/f)",
      simulationControls: 'کۆنترۆڵەکانی هاوشێوەکردن', // غير موثّق بمصدر
      sourceSpeed: 'خێرایی سەرچاوە (vₛ):',
      emittedFreqInput: 'فرێکوێنسیی دەرچوو (f):',
      speedOfSound: 'خێرایی دەنگ لە ژینگەدا (v):',
      observerSpeed: 'خێرایی بینەر (vₒ):',
      wavelengthFront: 'درێژی شەپۆل لە پێشەوە (λ_front)',
      wavelengthBack: 'درێژی شەپۆل لە دواوە (λ_back)',
      restWavelength: 'درێژی شەپۆلی سكون (λ₀)',
      machNumber: 'ژمارەی ماخ (Mach Number)',
      subsonic: 'ژێر دەنگی',
      supersonic: 'سەروو دەنگی',
    },
    kmr: {
      title: 'Bandora Dopplerê',
      pause: 'Rawestandin', // غير موثّق بمصدر
      play: 'Lêxistin', // غير موثّق بمصدر
      resetPosition: 'Zivirandina شوێنê', // غير موثّق بمصدر
      log: 'Tomarkirina pîvanê', // غير موثّق بمصدر
      approaching: '← Çavkanî nêzîkî çavdêr dibe (tonê bilindtir)',
      receding: 'Çavkanî ji çavdêr dûr dibe (tonê nizmti) →',
      observer: 'Çavdêr',
      source: 'Çavkanî',
      emittedFreq: 'Pirhêziya derketî (f)',
      observedFreq: "Pirhêziya çavdêrîکراو (f')",
      freqShift: 'Veguhastina pirhêziyê (Δf)',
      pitchRatio: "Rêjeya awazê (f'/f)",
      simulationControls: 'Kontrolên sîmulasyonê', // غير موثّق بمصدر
      sourceSpeed: 'Leza çavkaniyê (vₛ):',
      emittedFreqInput: 'Pirhêziya derketî (f):',
      speedOfSound: 'Leza دەنگê di navberê de (v):',
      observerSpeed: 'Leza çavdêr (vₒ):',
      wavelengthFront: 'Dirêjahiya pêlê li pêş (λ_front)',
      wavelengthBack: 'Dirêjahiya pêlê li paş (λ_back)',
      restWavelength: 'Dirêjahiya pêlê ya sekinî (λ₀)',
      machNumber: 'Hejmara Machê (Mach Number)',
      subsonic: 'Subsonîk',
      supersonic: 'Supersonîk',
    },
  }[lang] || {
    title: 'محاكاة تأثير دوبلر (Doppler Effect)',
    pause: 'إيقاف',
    play: 'تشغيل',
    resetPosition: 'إعادة ضبط الموقع',
    log: 'تسجيل القياس',
    approaching: '← المصدر يقترب من الراصد (تردد أعلى)',
    receding: 'المصدر يبتعد عن الراصد (تردد أقل) →',
    observer: 'الراصد',
    source: 'المصدر',
    emittedFreq: 'التردد المنبعث (f)',
    observedFreq: "التردد المرصود (f')",
    freqShift: 'إزاحة التردد (Δf)',
    pitchRatio: "نسبة النغمة (f'/f)",
    simulationControls: 'عناصر التحكم بالمتغيرات',
    sourceSpeed: 'سرعة المصدر (vₛ):',
    emittedFreqInput: 'التردد المنبعث (f):',
    speedOfSound: 'سرعة الصوت في الوسط (v):',
    observerSpeed: 'سرعة الراصد (vₒ):',
    wavelengthFront: 'الطول الموجي في الأمام (λ_front)',
    wavelengthBack: 'الطول الموجي في الخلف (λ_back)',
    restWavelength: 'الطول الموجي الساكن (λ₀)',
    machNumber: 'معامل ماخ (Mach Number)',
    subsonic: 'دون صوتي',
    supersonic: 'فوق صوتي',
  };

  const [sourceSpeed, setSourceSpeed] = useState<number>(60); // m/s (positive = moving towards observer)
  const [observerSpeed, setObserverSpeed] = useState<number>(0); // m/s (positive = moving towards source)
  const [emittedFreq, setEmittedFreq] = useState<number>(440); // Hz (A4)
  const [soundSpeed, setSoundSpeed] = useState<number>(343); // m/s (standard air at 20°C)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sourceX, setSourceX] = useState<number>(20); // % position
  const [observerX] = useState<number>(80); // % position
  const [wavefronts, setWavefronts] = useState<{ id: number; x: number; y: number; r: number; opacity: number }[]>([]);

  // Doppler Formula: f' = f * (v + vo) / (v - vs)
  // When approaching: observer gets higher freq, when receding: lower freq
  const isApproaching = sourceX <= observerX;
  const effectiveVs = isApproaching ? sourceSpeed : -sourceSpeed;
  const effectiveVo = isApproaching ? observerSpeed : -observerSpeed;

  const denominator = Math.max(1, soundSpeed - effectiveVs);
  const numerator = soundSpeed + effectiveVo;
  const observedFreq = emittedFreq * (numerator / denominator);
  const freqShift = observedFreq - emittedFreq;
  const machNumber = Math.abs(sourceSpeed) / soundSpeed;
  const wavelengthRest = soundSpeed / emittedFreq;
  const wavelengthFront = Math.max(0.01, (soundSpeed - sourceSpeed) / emittedFreq);
  const wavelengthBack = (soundSpeed + sourceSpeed) / emittedFreq;

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    let waveCounter = 0;
    let emitTimer = 0;

    const loop = (t: number) => {
      const dt = Math.min((t - lastTime) / 1000, 0.1);
      lastTime = t;

      if (isPlaying) {
        // Move source
        setSourceX((prev) => {
          const moveDelta = (sourceSpeed / 343) * 30 * dt;
          let nextX = prev + moveDelta;
          if (nextX > 95) nextX = 5;
          return nextX;
        });

        // Emit wavefronts at intervals proportional to frequency
        emitTimer += dt;
        const emitInterval = Math.max(0.08, 120 / emittedFreq);

        if (emitTimer >= emitInterval) {
          emitTimer = 0;
          waveCounter++;
          setWavefronts((prev) => [
            ...prev.slice(-30),
            {
              id: waveCounter,
              x: sourceX,
              y: 50,
              r: 2,
              opacity: 1,
            },
          ]);
        }

        // Expand existing wavefronts at speed of sound
        setWavefronts((prev) =>
          prev
            .map((w) => ({
              ...w,
              r: w.r + (soundSpeed / 343) * 50 * dt,
              opacity: Math.max(0, 1 - w.r / 75),
            }))
            .filter((w) => w.opacity > 0.02)
        );
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, sourceSpeed, soundSpeed, emittedFreq, sourceX]);

  const handleReset = () => {
    setSourceX(15);
    setWavefronts([]);
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'doppler_effect',
        parameters: {
          Source_Speed_vs_m_s: sourceSpeed,
          Observer_Speed_vo_m_s: observerSpeed,
          Emitted_Frequency_f_Hz: emittedFreq,
          Speed_of_Sound_v_m_s: soundSpeed,
          Is_Approaching: isApproaching,
        },
        measuredValue: parseFloat(observedFreq.toFixed(2)),
        theoreticalValue: parseFloat((emittedFreq * (numerator / denominator)).toFixed(2)),
        unit: 'Hz',
        variableName: 'Observed_Frequency_f_prime',
        equation: "f' = f · (v ± vₒ) / (v ∓ vₛ)",
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Radio  className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {t.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              f' = f · ((v ± vₒ) / (v ∓ vₛ))
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="min-h-[44px] min-w-[44px]"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
            <span>{isPlaying ? t.pause : t.play}</span>
          </button>
          <button className="min-h-[44px] min-w-[44px]"
            onClick={handleReset}
            title={t.resetPosition}
           className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all">
            <RotateCcw  className="w-3.5 h-3.5"/>
          </button>
          <button className="min-h-[44px] min-w-[44px]"
            onClick={handleLog}
           className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all">
            <Activity  className="w-3.5 h-3.5"/>
            <span>{t.log}</span>
          </button>
        </div>
      </div>

      {/* Interactive Canvas Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[320px] relative overflow-hidden">
          {/* Status Overlay */}
          <div className="flex items-center justify-between z-10 text-xs">
            <span
             className={`px-2.5 py-1 rounded-lg font-bold border ${ isApproaching ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40' }`}>
              {isApproaching ? t.approaching : t.receding}
            </span>
            <span className="font-mono text-slate-400">
              Mach {machNumber.toFixed(2)} {machNumber >= 1 ? '⚠️ Sonic Boom' : ''}
            </span>
          </div>

          {/* Graphical Wavefronts Stage */}
          <div className="relative w-full h-56 my-auto flex items-center">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Road / Axis line */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.75" strokeDasharray="2,2" />

              {/* Circular Wavefronts */}
              {wavefronts.map((w) => (
                <ellipse
                  key={w.id}
                  cx={w.x}
                  cy={w.y}
                  rx={w.r * 0.8}
                  ry={w.r * 0.55}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  opacity={w.opacity * 0.8}
                />
              ))}

              {/* Observer Icon / Position */}
              <g transform={`translate(${observerX}, 50)`}>
                <circle cx="0" cy="0" r="4.5" fill="#10b981" />
                <circle cx="0" cy="0" r="7" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
                <text x="0" y="-8" fill="#a7f3d0" fontSize="3.5" textAnchor="middle" fontWeight="bold">
                  {t.observer}
                </text>
              </g>

              {/* Moving Sound Source */}
              <g transform={`translate(${sourceX}, 50)`}>
                <circle cx="0" cy="0" r="4.5" fill="#ef4444" />
                <polygon points="4,0 -2,-3 -2,3" fill="#ffffff" />
                <text x="0" y="9" fill="#fca5a5" fontSize="3.5" textAnchor="middle" fontWeight="bold">
                  {t.source}
                </text>
              </g>
            </svg>
          </div>

          {/* Quick Real-Time Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">{t.emittedFreq}</span>
              <span className="text-slate-200 font-bold">{emittedFreq} Hz</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{t.observedFreq}</span>
              <span className={`font-bold ${isApproaching ? 'text-emerald-400' : 'text-rose-400'}`}>
                {observedFreq.toFixed(1)} Hz
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{t.freqShift}</span>
              <span className="text-indigo-300 font-bold">
                {freqShift >= 0 ? `+${freqShift.toFixed(1)}` : freqShift.toFixed(1)} Hz
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{t.pitchRatio}</span>
              <span className="text-amber-300 font-bold">{(observedFreq / emittedFreq).toFixed(3)}x</span>
            </div>
          </div>
        </div>

        {/* Input Parameters Controls */}
        <div className="lg:col-span-4 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              {t.simulationControls}
            </h4>

            {/* Source Velocity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{t.sourceSpeed}</span>
                <span className="font-mono text-rose-400 font-bold">{sourceSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="10"
                value={sourceSpeed}
                onChange={(e) => setSourceSpeed(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 m/s</span>
                <span>150 m/s</span>
                <span>300 m/s</span>
              </div>
            </div>

            {/* Emitted Frequency */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{t.emittedFreqInput}</span>
                <span className="font-mono text-sky-400 font-bold">{emittedFreq} Hz</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="20"
                value={emittedFreq}
                onChange={(e) => setEmittedFreq(parseInt(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            {/* Speed of Sound */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{t.speedOfSound}</span>
                <span className="font-mono text-amber-400 font-bold">{soundSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="300"
                max="400"
                step="5"
                value={soundSpeed}
                onChange={(e) => setSoundSpeed(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Observer Speed */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{t.observerSpeed}</span>
                <span className="font-mono text-emerald-400 font-bold">{observerSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={observerSpeed}
                onChange={(e) => setObserverSpeed(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* External HUD Cards Row (All calculated data placed strictly outside Canvas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {t.wavelengthFront}
          </div>
          <div className="text-lg font-mono font-bold text-sky-400">
            {wavelengthFront.toFixed(3)} m
          </div>
          <div className="text-[10px] text-slate-500 font-mono">λ = (v - vₛ) / f (انضغاط أمامي)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {t.wavelengthBack}
          </div>
          <div className="text-lg font-mono font-bold text-indigo-400">
            {wavelengthBack.toFixed(3)} m
          </div>
          <div className="text-[10px] text-slate-500 font-mono">λ = (v + vₛ) / f (تخلخل خلفي)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {t.restWavelength}
          </div>
          <div className="text-lg font-mono font-bold text-amber-400">
            {wavelengthRest.toFixed(3)} m
          </div>
          <div className="text-[10px] text-slate-500 font-mono">λ₀ = v / f (المصدر ساكن)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {t.machNumber}
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {machNumber.toFixed(3)} M
          </div>
          <div className="text-[10px] text-slate-500 font-mono">M = vₛ / v ({machNumber < 1 ? t.subsonic : t.supersonic})</div>
        </div>
      </div>
    </div>
  );
}