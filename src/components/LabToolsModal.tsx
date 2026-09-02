import { Calculator, Timer, Binary, Globe, Pause, Play, RotateCcw, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { CONSTANTS } from '../data/physicsData';

interface Props {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

export default function LabToolsModal({ lang, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [activeTool, setActiveTool] = useState<'stopwatch' | 'converter' | 'constants'>('stopwatch');

  // Stopwatch state
  const [swTime, setSwTime] = useState(0);
  const [isSwRunning, setIsSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const swIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isSwRunning) {
      const startTime = Date.now() - swTime;
      swIntervalRef.current = setInterval(() => {
        setSwTime(Date.now() - startTime);
      }, 10);
    } else {
      clearInterval(swIntervalRef.current);
    }
    return () => clearInterval(swIntervalRef.current);
  }, [isSwRunning, swTime]);

  const handleLap = () => {
    if (isSwRunning) {
      setLaps([swTime, ...laps]);
    }
  };

  const handleResetSw = () => {
    setIsSwRunning(false);
    setSwTime(0);
    setLaps([]);
  };

  const formatSwTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  // Unit Converter state
  const [converterType, setConverterType] = useState<'speed' | 'energy' | 'angle'>('speed');
  const [inputVal, setInputVal] = useState<number>(10);

  // Speed: m/s -> km/h, mph
  const kmh = inputVal * 3.6;
  const mph = inputVal * 2.23694;

  // Energy: J -> cal, eV
  const calories = inputVal / 4.184;
  const eV = inputVal / 1.60218e-19;

  // Angle: deg -> rad
  const radians = (inputVal * Math.PI) / 180;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              {lang === 'ar' 
                ? 'أدوات ومراجع المختبر' 
                : lang === 'kmr'
                ? 'Amûr û Çavkaniyên Laboratûwarê'
                : lang === 'ku' 
                ? 'ئامراز و سەرچاوەکانی تاقیگە' 
                : 'Laboratory Physics Tools'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 text-xs">
          <button
            onClick={() => setActiveTool('stopwatch')}
            className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTool === 'stopwatch'
                ? 'text-sky-400 border-b-2 border-sky-500 bg-zinc-900/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'ساعة إيقاف' : lang === 'kmr' ? 'Seeta Rawestandinê' : lang === 'ku' ? 'کاتژمێری دەستی' : 'Stopwatch'}</span>
          </button>
          <button
            onClick={() => setActiveTool('converter')}
            className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTool === 'converter'
                ? 'text-sky-400 border-b-2 border-sky-500 bg-zinc-900/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'محول الوحدات' : lang === 'kmr' ? 'Guhêrbarê Yekeyan' : lang === 'ku' ? 'گۆڕەری یەکەکان' : 'Unit Converter'}</span>
          </button>
          <button
            onClick={() => setActiveTool('constants')}
            className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTool === 'constants'
                ? 'text-sky-400 border-b-2 border-sky-500 bg-zinc-900/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الثوابت الفيزيائية' : lang === 'kmr' ? 'Neguhêrbarên Fîzîkî' : lang === 'ku' ? 'نەگۆڕە فیزیاییەکان' : 'Constants'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTool === 'stopwatch' && (
            <div className="space-y-6 text-center">
              {/* Digital display */}
              <div className="py-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 font-mono text-4xl sm:text-5xl font-bold tracking-widest text-sky-400">
                {formatSwTime(swTime)}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsSwRunning(!isSwRunning)}
                  className={`px-6 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all ${
                    isSwRunning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  {isSwRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>
                    {isSwRunning 
                      ? (lang === 'ar' ? 'إيقاف مؤقت' : lang === 'kmr' ? 'Rawestandin' : lang === 'ku' ? 'وەستانی کاتی' : 'Pause') 
                      : (lang === 'ar' ? 'بدء' : lang === 'kmr' ? 'Destpêkirin' : lang === 'ku' ? 'دەستپێکردن' : 'Start')}
                  </span>
                </button>

                <button
                  onClick={handleLap}
                  disabled={!isSwRunning}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 text-xs font-medium transition-colors"
                >
                  {lang === 'ar' ? 'دورة (Lap)' : lang === 'ku' ? 'خول (Lap)' : 'Lap'}
                </button>

                <button
                  onClick={handleResetSw}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تصفير' : lang === 'ku' ? 'ڕێکخستنەوە' : 'Reset'}</span>
                </button>
              </div>

              {/* Lap times table */}
              {laps.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 max-h-36 overflow-y-auto text-xs font-mono space-y-1">
                  {laps.map((lap, i) => (
                    <div key={i} className="flex justify-between py-1 px-2 border-b border-zinc-800/60 text-zinc-400">
                      <span>Lap {laps.length - i}</span>
                      <span className="text-zinc-200">{formatSwTime(lap)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTool === 'converter' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['speed', 'energy', 'angle'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setConverterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${
                      converterType === type
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {type === 'speed' 
                      ? (lang === 'ar' ? 'السرعة' : lang === 'ku' ? 'خێرایی' : 'Speed') 
                      : type === 'energy' 
                      ? (lang === 'ar' ? 'الطاقة' : lang === 'ku' ? 'وزە' : 'Energy') 
                      : (lang === 'ar' ? 'الزاوية' : lang === 'ku' ? 'گۆشە' : 'Angle')}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400">
                  {converterType === 'speed' 
                    ? (lang === 'ar' ? 'قيمة السرعة (m/s)' : lang === 'ku' ? 'بڕی خێرایی (m/s)' : 'Input Speed (m/s)') 
                    : converterType === 'energy' 
                    ? (lang === 'ar' ? 'قيمة الطاقة (J)' : lang === 'ku' ? 'بڕی وزە (J)' : 'Input Energy (J)') 
                    : (lang === 'ar' ? 'الزاوية بالدرجات' : lang === 'ku' ? 'گۆشە بە پلە' : 'Input Angle (Degrees)')}
                </label>
                <input
                  type="number"
                  value={inputVal}
                  onChange={(e) => setInputVal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Output conversions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {converterType === 'speed' && (
                  <>
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">km/h (كيلومتر/ساعة)</span>
                      <span className="text-base font-bold text-sky-400 font-mono">{kmh.toFixed(2)} km/h</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">Miles per Hour (ميل/ساعة)</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{mph.toFixed(2)} mph</span>
                    </div>
                  </>
                )}

                {converterType === 'energy' && (
                  <>
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">Calories (سعرة حرارية)</span>
                      <span className="text-base font-bold text-sky-400 font-mono">{calories.toFixed(4)} cal</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">Electron-volts (إلكترون فولت)</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{eV.toExponential(3)} eV</span>
                    </div>
                  </>
                )}

                {converterType === 'angle' && (
                  <div className="col-span-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-500 block">Radians (راديان / ڕادیان)</span>
                    <span className="text-base font-bold text-sky-400 font-mono">
                      {radians.toFixed(4)} rad ({(radians / Math.PI).toFixed(3)} π)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTool === 'constants' && (
            <div className="space-y-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/60 text-xs">
                {CONSTANTS.map((c) => {
                  const constKey = c.symbol === 'ε₀' ? 'ε0' : c.symbol === 'k_B' ? 'kB' : c.symbol;
                  return (
                    <div key={c.symbol} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sky-400 font-bold mr-2">{c.symbol}</span>
                        <span className="text-zinc-300">
                          {t(`constants.${constKey}.name`)}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-400">
                        {c.value} {c.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}