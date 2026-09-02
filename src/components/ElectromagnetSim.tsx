import { Magnet, Activity, Zap, Compass } from 'lucide-react';
import React, { useState } from 'react';
import { Language } from '../types';

import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

export default function ElectromagnetSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [current, setCurrent] = useState<number>(3.0); // Amperes (0 to 10 A)
  const [turns, setTurns] = useState<number>(100); // Turns (20 to 300)
  const [hasIronCore, setHasIronCore] = useState<boolean>(true);
  const [distance, setDistance] = useState<number>(5.0); // cm from coil

  const t = {
    ar: {
      title: 'المغناطيسات والكهرومغناطيسات (الملف اللولبي)',
      logMeasurement: 'تسجيل القياس في الدفتر', // غير موثّق بمصدر
      dcSupply: 'مصدر التيار',
      ironCore: 'قلب حديدي',
      airCore: 'فراغ / هواء',
      paperclips: 'مشابك الورق المنجذبة:', // غير موثّق بمصدر
      outputsTitle: 'المخرجات المحسوبة', // غير موثّق بمصدر
      coilField: 'مجال الملف (B_core):',
      fieldAtCompass: 'المجال عند البوصلة:', // غير موثّق بمصدر
      relPermeability: 'معامل النفاذية (μᵣ):',
      inputsTitle: 'المتغيرات القابلة للتحكم', // غير موثّق بمصدر
      currentLabel: 'التيار الكهربائي (I):',
      turnsLabel: 'عدد اللفات (N):',
      insertIronCore: 'إدخال قلب حديدي داخل الملف:',
      activeState: 'مفعل (نعم)', // غير موثّق بمصدر
      disabledState: 'معطل (هواء)', // غير موثّق بمصدر
    },
    en: {
      title: 'Magnets and Electromagnets (Solenoid)',
      logMeasurement: 'Log Measurement', // غير موثّق بمصدر
      dcSupply: 'DC Supply',
      ironCore: 'Iron Core',
      airCore: 'Air Core',
      paperclips: 'Attracted Paperclips:', // غير موثّق بمصدر
      outputsTitle: 'Calculated Outputs', // غير موثّق بمصدر
      coilField: 'Coil Field (B):',
      fieldAtCompass: 'Field at Compass:', // غير موثّق بمصدر
      relPermeability: 'Rel. Permeability:',
      inputsTitle: 'Simulation Inputs', // غير موثّق بمصدر
      currentLabel: 'Current (I):',
      turnsLabel: 'Coil Turns (N):',
      insertIronCore: 'Insert Iron Core:',
      activeState: 'Active', // غير موثّق بمصدر
      disabledState: 'Air Core', // غير موثّق بمصدر
    },
    ku: {
      title: 'موگناتیس و کارۆموگناتیس (کۆیلی لولەیی)',
      logMeasurement: 'تۆمارکردنی پێوانە', // غير موثّق بمصدر
      dcSupply: 'سەرچاوەی تەزوو',
      ironCore: 'ناوکی ئاسن',
      airCore: 'ناوکی هەوا',
      paperclips: 'گوپكی کاغەزی ڕاکێشراو:', // غير موثّق بمصدر
      outputsTitle: 'دەرئەنجامە ئەژمارکراوەکان', // غير موثّق بمصدر
      coilField: 'بواری کۆیل (B):',
      fieldAtCompass: 'بوار لە شوێنی ڕووگەنما:', // غير موثّق بمصدر
      relPermeability: 'نفاذيةی ڕێژەیی (μᵣ):',
      inputsTitle: 'گۆڕاوە کۆنتڕۆڵکراوەکان', // غير موثّق بمصدر
      currentLabel: 'تەزووی کارەبایی (I):',
      turnsLabel: 'ژمارەی خولەکان (N):',
      insertIronCore: 'دانانی ناوکی ئاسن لەناو کۆیلدا:',
      activeState: 'چالاک (بەڵێ)', // غير موثّق بمصدر
      disabledState: 'ناچالاک (هەوا)', // غير موثّق بمصدر
    },
    kmr: {
      title: 'Magnet û Elektromagnet (Bobîn)',
      logMeasurement: 'Tomarkirina pîvanê', // غير موثّق بمصدر
      dcSupply: 'Çavkaniya herikînê',
      ironCore: 'Dendika hesênî',
      airCore: 'Dendika hewayî',
      paperclips: 'Klîpên kaxezê yên kişandî:', // غير موثّق بمصدر
      outputsTitle: 'Derketiyên hejmartî', // غير موثّق بمصدر
      coilField: 'Zeviya bobînê (B):',
      fieldAtCompass: 'Zeviya li ciyê qutibnamê:', // غير موثّق بمصدر
      relPermeability: 'Derbasbûniya suxteyî (μᵣ):',
      inputsTitle: 'Parametreyên simulasyonê', // غير موثّق بمصدر
      currentLabel: 'Herikîna elektrîkî (I):',
      turnsLabel: 'Hejmara dorpêçan (N):',
      insertIronCore: 'Xistina dendika hesênî di nav bobînê de:',
      activeState: 'Çalak (Erê)', // غير موثّق بمصدر
      disabledState: 'Neçalak (Hewa)', // غير موثّق بمصدر
    },
  }[lang];

  // Constants
  const mu0 = 4 * Math.PI * 1e-7; // T*m/A
  const relativePermeability = hasIronCore ? 200 : 1; // Iron boosts field dramatically

  // Solenoid field inside / at pole: B = mu_r * mu_0 * n * I
  // where n is turns per unit length (assume coil length L = 0.1 m)
  const lengthM = 0.1;
  const n = turns / lengthM;
  const B_core = (relativePermeability * mu0 * n * current * 1000).toFixed(2); // mT (milliTesla)

  // Field at distance r: B(r) ~ B_core / (1 + (r/R)^3)
  const B_at_distance = (parseFloat(B_core) / Math.pow(1 + distance / 2, 2.5)).toFixed(3);

  // Compass needle deflection angle: theta = arctan(B_ext / B_earth)
  // Assume B_earth ~ 0.05 mT
  const B_earth = 0.05;
  const compassAngle = Math.min(88, Math.atan(parseFloat(B_at_distance) / B_earth) * (180 / Math.PI));

  // Number of paper clips picked up ~ proportional to B_core * sqrt(current)
  const paperClips = current > 0 ? Math.min(40, Math.round(parseFloat(B_core) * 0.08)) : 0;

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'electromagnet',
        parameters: {
          Current_I_A: current,
          Turns_N: turns,
          IronCore: hasIronCore ? 'Yes' : 'No',
          Distance_r_cm: distance,
        },
        measuredValue: parseFloat(B_core),
        theoreticalValue: parseFloat((relativePermeability * mu0 * (turns / lengthM) * current * 1000).toFixed(2)),
        unit: 'mT',
        variableName: 'B_field_solenoid',
        equation: 'B = μ_r · μ₀ · (N/L) · I',
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Magnet  className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {t.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono">B = μ₀ · μᵣ · n · I</p>
          </div>
        </div>
        <button className="min-h-[44px] min-w-[44px]"
          onClick={handleLog}
         className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all">
          <Activity  className="w-3.5 h-3.5"/>
          <span>{t.logMeasurement}</span>
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visual Canvas Area */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
          {/* Magnetic Field Lines representation */}
          <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
            {Array.from({ length: Math.min(12, Math.max(2, Math.round(current * 1.5))) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: `${160 + i * 36}px`,
                  height: `${60 + i * 22}px`,
                  opacity: Math.max(0.15, 0.9 - i * 0.08),
                  borderColor: current > 0 ? '#c084fc' : '#475569',
                }}
                className="absolute border border-purple-400 rounded-full animate-pulse"
              />
            ))}
          </div>

          {/* Solenoid & Core representation */}
          <div className="relative z-10 flex items-center justify-center gap-6 my-4">
            {/* Battery / DC Source */}
            <div className="flex flex-col items-center bg-slate-900 border border-amber-500/40 p-3 rounded-xl shadow-lg">
              <Zap className={`w-6 h-6 ${current > 0 ? 'text-yellow-400 animate-bounce' : 'text-slate-600'}`} />
              <span className="text-[11px] font-mono text-amber-300 font-bold">{current.toFixed(1)} A</span>
              <span className="text-[10px] text-slate-400">{t.dcSupply}</span>
            </div>

            {/* Coil with Iron Core */}
            <div className="relative flex items-center justify-center">
              {/* Iron Rod Core */}
              <div
               className={`w-44 h-10 rounded-lg transition-all flex items-center justify-between px-3 ${ hasIronCore ? 'bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 border-2 border-slate-300 shadow-lg' : 'bg-slate-900/60 border border-dashed border-slate-700' }`}>
                <span className={`text-[10px] font-bold ${current > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  N
                </span>
                <span className="text-[9px] text-slate-950/80 font-mono font-bold">
                  {hasIronCore ? t.ironCore : t.airCore}
                </span>
                <span className={`text-[10px] font-bold ${current > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                  S
                </span>
              </div>

              {/* Wire Coils overlay */}
              <div className="absolute inset-0 flex items-center justify-around pointer-events-none px-2">
                {Array.from({ length: Math.min(18, Math.max(6, Math.round(turns / 15))) }).map((_, i) => (
                  <div
                    key={i}
                   className="w-1.5 h-14 bg-gradient-to-b from-amber-600 via-amber-300 to-amber-700 rounded-full shadow"/>
                ))}
              </div>
            </div>

            {/* Compass Needle */}
            <div className="flex flex-col items-center bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-lg">
              <div className="relative w-12 h-12 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center">
                <div
                  style={{ transform: `rotate(${compassAngle}deg)` }}
                 className="w-8 h-1 transition-transform duration-300 rounded-full flex items-center justify-between">
                  <div  className="w-4 h-1.5 bg-red-500 rounded-l"/>
                  <div  className="w-4 h-1.5 bg-blue-500 rounded-r"/>
                </div>
                <Compass  className="w-10 h-10 text-slate-700 absolute pointer-events-none"/>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 mt-1">θ = {compassAngle.toFixed(1)}°</span>
            </div>
          </div>

          {/* Paper Clips Pickup Visual */}
          <div className="flex items-center gap-2 mt-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-300">
              {t.paperclips}
            </span>
            <span className="text-xs font-bold text-amber-400 font-mono">{paperClips} 📎</span>
          </div>
        </div>

        {/* Controls & Metrics Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Outputs Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              {t.outputsTitle}
            </h4>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">{t.coilField}</span>
                <span className="text-purple-300 font-bold">{B_core} mT</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">{t.fieldAtCompass}</span>
                <span className="text-cyan-300 font-bold">{B_at_distance} mT</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">{t.relPermeability}</span>
                <span className="text-amber-300 font-bold">{relativePermeability}</span>
              </div>
            </div>
          </div>

          {/* Inputs Sliders */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              {t.inputsTitle}
            </h4>

            {/* Current Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{t.currentLabel}</span>
                <span className="font-mono text-amber-400 font-bold">{current.toFixed(1)} A</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={current}
                onChange={(e) => setCurrent(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Turns Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{t.turnsLabel}</span>
                <span className="font-mono text-indigo-400 font-bold">{turns}</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={turns}
                onChange={(e) => setTurns(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Iron Core Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">
                {t.insertIronCore}
              </span>
              <button className="min-h-[44px] min-w-[44px]"
                onClick={() => setHasIronCore(!hasIronCore)}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                  hasIronCore
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {hasIronCore ? t.activeState : t.disabledState}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}