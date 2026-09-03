import { Flame, Pause, Play, RotateCcw, BookmarkCheck, Sliders } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

type MaterialType = 'copper' | 'aluminum' | 'iron' | 'glass' | 'wood';

const MATERIALS: Record<MaterialType, { nameAr: string; nameEn: string; nameKu: string; nameKmr: string; k: number; color: string; density: number }> = {
  copper: { nameAr: 'نحاس أحمر', nameEn: 'Copper', nameKu: 'مس', nameKmr: 'Sifir', k: 390, color: '#f97316', density: 8960 },
  aluminum: { nameAr: 'ألمنيوم', nameEn: 'Aluminum', nameKu: 'ئەللەمنیۆم', nameKmr: 'Alyumînyum', k: 205, color: '#e2e8f0', density: 2700 },
  iron: { nameAr: 'حديد صلب', nameEn: 'Iron / Steel', nameKu: 'ئاسن', nameKmr: 'Mêsin / Hesin', k: 79, color: '#94a3b8', density: 7850 },
  glass: { nameAr: 'زجاج حراري', nameEn: 'Thermal Glass', nameKu: 'شووشەی گەرمی', nameKmr: 'Şûşeya germî', k: 0.8, color: '#38bdf8', density: 2500 },
  wood: { nameAr: 'خشب عازل', nameEn: 'Insulating Wood', nameKu: 'داری دابڕ', nameKmr: 'Darê îzolasyonê', k: 0.15, color: '#b45309', density: 600 },
};

export default function HeatConductionSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [material, setMaterial] = useState<MaterialType>('copper');
  const [hotTempC, setHotTempC] = useState<number>(100); // °C
  const [coldTempC, setColdTempC] = useState<number>(20); // °C
  const [rodLengthCm, setRodLengthCm] = useState<number>(20); // cm
  const [rodAreaCm2, setRodAreaCm2] = useState<number>(4.0); // cm²
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // Dynamic heat profile nodes along rod
  const numNodes = 20;
  const tempProfileRef = useRef<number[]>(new Array(numNodes).fill(coldTempC));
  const simTimeRef = useRef<number>(0);

  const { k } = MATERIALS[material];
  const lengthM = rodLengthCm / 100;
  const areaM2 = (rodAreaCm2 * 1e-4);
  const deltaT = hotTempC - coldTempC;

  // Steady-state heat transfer rate: Q/t = k * A * ΔT / d (Watts)
  const heatRateWatts = (k * areaM2 * deltaT) / lengthM;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset nodes if hot/cold temp changes drastically
    tempProfileRef.current[0] = hotTempC;
  }, [hotTempC, coldTempC]);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRunning) {
        simTimeRef.current += dt;
        // 1D Transient Heat Diffusion: dT/dt = alpha * d²T/dx²
        const profile = tempProfileRef.current;
        profile[0] = hotTempC;

        // Effective diffusivity scale
        const alpha = Math.min(k * 0.00015, 0.08);
        const newProfile = [...profile];

        for (let i = 1; i < numNodes - 1; i++) {
          const d2T = profile[i - 1] - 2 * profile[i] + profile[i + 1];
          newProfile[i] += alpha * d2T * dt * 60;
        }
        // Right boundary heat loss / ambient
        newProfile[numNodes - 1] += alpha * (profile[numNodes - 2] - profile[numNodes - 1]) * dt * 60;
        tempProfileRef.current = newProfile;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          drawHeatRod(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [material, hotTempC, coldTempC, rodLengthCm, rodAreaCm2, isRunning, k]);

  const drawHeatRod = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

    const rodY = height * 0.45;
    const rodStartX = 120;
    const rodW = 380;
    const rodH = 40;

    // 1. Hot Heat Source on Left (Burner & Plate)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(rodStartX - 40, rodY - 10, 40, rodH + 20);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.strokeRect(rodStartX - 40, rodY - 10, 40, rodH + 20);

    // Flame underneath hot plate
    if (isRunning) {
      const flameH = 22 + Math.sin(performance.now() * 0.012) * 5;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.beginPath();
      ctx.moveTo(rodStartX - 35, rodY + rodH + 25);
      ctx.quadraticCurveTo(rodStartX - 20, rodY + rodH + 25 - flameH, rodStartX - 5, rodY + rodH + 25);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(rodStartX - 28, rodY + rodH + 25);
      ctx.quadraticCurveTo(rodStartX - 20, rodY + rodH + 25 - flameH * 0.7, rodStartX - 12, rodY + rodH + 25);
      ctx.fill();
    }

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${hotTempC} °C`, rodStartX - 38, rodY - 18);
    ctx.font = '9px monospace';
    ctx.fillText(tI18n('experiments.heat_conduction.heatSourceLabel'), rodStartX - 38, rodY + rodH + 42);

    // 2. Segmented Rod with Continuous Temperature Gradient
    const profile = tempProfileRef.current;
    const segW = rodW / (numNodes - 1);

    for (let i = 0; i < numNodes - 1; i++) {
      const t1 = profile[i];
      const t2 = profile[i + 1];
      const avgT = (t1 + t2) / 2;

      // Color from Cold (Cyan/Blue #0284c7) to Warm (#f59e0b) to Hot (#ef4444)
      const ratio = Math.min(Math.max((avgT - coldTempC) / (hotTempC - coldTempC || 1), 0), 1);
      const r = Math.floor(14 + ratio * 225);
      const g = Math.floor(132 - ratio * 64);
      const b = Math.floor(199 - ratio * 160);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(rodStartX + i * segW, rodY, segW + 1, rodH);
    }

    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 2;
    ctx.strokeRect(rodStartX, rodY, rodW, rodH);

    // 3. Cold Heat Sink / Ambient on Right
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(rodStartX + rodW, rodY - 10, 40, rodH + 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(rodStartX + rodW, rodY - 10, 40, rodH + 20);

    const farEndTemp = profile[numNodes - 1];
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${farEndTemp.toFixed(1)} °C`, rodStartX + rodW + 4, rodY - 18);
    ctx.font = '9px monospace';
    ctx.fillText(tI18n('experiments.heat_conduction.coldEndLabel'), rodStartX + rodW + 4, rodY + rodH + 42);

    // Heat Flow Arrows along the rod
    if (isRunning && heatRateWatts > 0) {
      const flowOffset = (performance.now() * 0.05) % 40;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;

      for (let fx = rodStartX + 20 + flowOffset; fx < rodStartX + rodW - 20; fx += 45) {
        ctx.beginPath();
        ctx.moveTo(fx - 10, rodY + rodH / 2);
        ctx.lineTo(fx + 10, rodY + rodH / 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(fx + 14, rodY + rodH / 2);
        ctx.lineTo(fx + 8, rodY + rodH / 2 - 4);
        ctx.lineTo(fx + 8, rodY + rodH / 2 + 4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Temperature vs Distance Graph at the bottom
    const graphY = height * 0.85;
    const graphH = 50;

    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rodStartX, graphY);
    ctx.lineTo(rodStartX + rodW, graphY);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < numNodes; i++) {
      const gx = rodStartX + i * segW;
      const tNorm = (profile[i] - coldTempC) / (hotTempC - coldTempC || 1);
      const gy = graphY - tNorm * graphH;
      if (i === 0) ctx.moveTo(gx, gy);
      else ctx.lineTo(gx, gy);
    }
    ctx.stroke();
  };

  const getMaterialName = (mat: MaterialType) => {
    const names: Record<string, string> = {
      ar: MATERIALS[mat].nameAr,
      ku: MATERIALS[mat].nameKu,
      kmr: MATERIALS[mat].nameKmr || MATERIALS[mat].nameEn,
      en: MATERIALS[mat].nameEn,
    };
    return names[lang] || MATERIALS[mat].nameAr;
  };

  const handleReset = () => {
    tempProfileRef.current = new Array(numNodes).fill(coldTempC);
    tempProfileRef.current[0] = hotTempC;
    simTimeRef.current = 0;
  };

  const handleLog = () => {
    const farEndTemp = tempProfileRef.current[numNodes - 1];
    onLogMeasurement({
      experiment: 'heat_conduction',
      variableName: 'Thermal Conduction Rate Q/t (Fourier Law)',
      measuredValue: Number(heatRateWatts.toFixed(2)),
      theoreticalValue: Number(((k * areaM2 * deltaT) / lengthM).toFixed(2)),
      unit: 'Watts (W)',
      parameters: {
        'Material': getMaterialName(material),
        'Conductivity k': `${k} W/(m·K)`,
        'Hot Source Temp T_hot': `${hotTempC} °C`,
        'Cold Ambient Temp T_cold': `${coldTempC} °C`,
        'Far End Current Temp': `${farEndTemp.toFixed(1)} °C`,
        'Rod Length d': `${rodLengthCm} cm`,
        'Cross Section Area A': `${rodAreaCm2} cm²`,
        'Temp Gradient ΔT/d': `${(deltaT / lengthM).toFixed(1)} °C/m`,
      },
      equation: `Q/t = k · A · (T_hot - T_cold) / d = (${k} · ${areaM2.toExponential(2)} · ${deltaT}) / ${lengthM} = ${heatRateWatts.toFixed(2)} W`,
      notes: `Thermal conduction in solid metal rods according to Fourier's Law of heat diffusion.`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-zinc-900 to-rose-950/40 border border-orange-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Flame  className="w-5 h-5 text-orange-400"/>
            <span>
              {tI18n('experiments.heat_conduction.title')}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.heat_conduction.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
          >
            {isRunning ? <Pause  className="w-4 h-4"/> : <Play  className="w-4 h-4 text-emerald-400"/>}
          </button>
          <button
            onClick={handleReset}
            title="Reset Simulation"
           className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700">
            <RotateCcw  className="w-4 h-4"/>
          </button>
          <button
            onClick={handleLog}
           className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.heat_conduction.logged') : tI18n('experiments.heat_conduction.logMeasurement')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sliders  className="w-4 h-4 text-orange-400"/>
              {tI18n('experiments.heat_conduction.controlsTitle')}
            </span>
          </div>

          {/* Material Selector */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5">
              {tI18n('experiments.heat_conduction.rodMaterialLabel')}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(MATERIALS) as MaterialType[]).map((mat) => (
                <button
                  key={mat}
                  onClick={() => setMaterial(mat)}
                  className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-start ${
                    material === mat
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div>{getMaterialName(mat)}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">k = {MATERIALS[mat].k} W/(m·K)</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hot Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.heat_conduction.hotTempLabel')}</span>
              <span className="font-mono text-rose-400 font-semibold">{hotTempC} °C</span>
            </div>
            <input
              type="range"
              min="40"
              max="300"
              step="5"
              value={hotTempC}
              onChange={(e) => setHotTempC(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Cold Ambient Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.heat_conduction.coldTempLabel')}</span>
              <span className="font-mono text-sky-400 font-semibold">{coldTempC} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={coldTempC}
              onChange={(e) => setColdTempC(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Rod Length Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.heat_conduction.rodLengthLabel')}</span>
              <span className="font-mono text-zinc-200 font-semibold">{rodLengthCm} cm</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={rodLengthCm}
              onChange={(e) => setRodLengthCm(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Cross-sectional Area Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.heat_conduction.crossSectionLabel')}</span>
              <span className="font-mono text-amber-400 font-semibold">{rodAreaCm2.toFixed(1)} cm²</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={rodAreaCm2}
              onChange={(e) => setRodAreaCm2(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
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
             className="w-full h-[360px] rounded-xl bg-zinc-950 block shadow-inner"/>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Heat Transfer Rate Q/t */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.heat_conduction.heatRateCard')}
              </span>
              <div className="text-xl font-bold font-mono text-orange-400">
                {heatRateWatts.toFixed(2)} <span className="text-sm text-zinc-400">W</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Q/t = k·A·ΔT/d</span>
            </div>

            {/* Thermal Conductivity k */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.heat_conduction.conductivityCard')}
              </span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {k} <span className="text-sm text-zinc-400">W/m·K</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">{MATERIALS[material].nameEn}</span>
            </div>

            {/* Far End Temperature */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.heat_conduction.farEndTempCard')}
              </span>
              <div className="text-xl font-bold font-mono text-sky-400">
                {tempProfileRef.current[numNodes - 1]?.toFixed(1)} <span className="text-sm text-zinc-400">°C</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Transient Conduction</span>
            </div>

            {/* Temperature Difference ΔT */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.heat_conduction.tempDiffCard')}
              </span>
              <div className="text-xl font-bold font-mono text-rose-400">
                {deltaT} <span className="text-sm text-zinc-400">°C</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">T_hot - T_cold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}