import { CloudSun, Pause, Play, BookmarkCheck, Sun } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface WavelengthPreset {
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  lambdaNm: number;
  hex: string;
}

const PRESETS: WavelengthPreset[] = [
  { nameAr: 'ضوء الشمس الأبيض (White Sunlight)', nameEn: 'White Sunlight (Polychromatic)', nameKu: 'ڕووناکی سپی خۆر', nameKmr: 'Ronahiya spî ya rojê', lambdaNm: 550, hex: '#ffffff' },
  { nameAr: 'بنفسجي (Violet - 400 nm)', nameEn: 'Violet (400 nm)', nameKu: 'مۆر (400 nm)', nameKmr: 'Sîsem (400 nm)', lambdaNm: 400, hex: '#8b5cf6' },
  { nameAr: 'أزرق سماوي (Blue - 450 nm)', nameEn: 'Sky Blue (450 nm)', nameKu: 'شینی ئاسمانی (450 nm)', nameKmr: 'Şînê ezmanî (450 nm)', lambdaNm: 450, hex: '#38bdf8' },
  { nameAr: 'أخضر (Green - 530 nm)', nameEn: 'Green (530 nm)', nameKu: 'سەوز (530 nm)', nameKmr: 'Kesk (530 nm)', lambdaNm: 530, hex: '#22c55e' },
  { nameAr: 'أصفر (Yellow - 580 nm)', nameEn: 'Yellow (580 nm)', nameKu: 'زەرد (580 nm)', nameKmr: 'Zerd (580 nm)', lambdaNm: 580, hex: '#eab308' },
  { nameAr: 'برتقالي (Orange - 620 nm)', nameEn: 'Orange (620 nm)', nameKu: 'پرتەقاڵی (620 nm)', nameKmr: 'Porteqalî (620 nm)', lambdaNm: 620, hex: '#f97316' },
  { nameAr: 'أحمر غروب (Red - 700 nm)', nameEn: 'Sunset Red (700 nm)', nameKu: 'سوور (700 nm)', nameKmr: 'Sor (700 nm)', lambdaNm: 700, hex: '#ef4444' },
];

export default function LightScatteringSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Parameters
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [wavelengthNm, setWavelengthNm] = useState<number>(450); // nm (380 to 750)
  const [atmospherePath, setAtmospherePath] = useState<'noon' | 'sunset' | 'custom'>('noon');
  const [opticalPathLength, setOpticalPathLength] = useState<number>(1.0); // 1.0 = noon zenith, 10.0 = sunset horizon
  const [particleDensity, setParticleDensity] = useState<number>(1.0); // 0.2 to 3.0
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  const isWhiteLight = selectedPresetIdx === 0;

  // Rayleigh Scattering Physics:
  // Scattering Intensity I_scatter ∝ 1 / (λ^4)
  // Normalized relative to reference 700nm (Red = 1.0)
  const refLambda = 700;
  const relativeScatteringFactor = Math.pow(refLambda / wavelengthNm, 4);

  // Blue light (450nm) scatters (700/450)^4 ≈ 5.86x more than red light (700nm)
  // Violet light (400nm) scatters (700/400)^4 ≈ 9.38x more than red light (700nm)

  // Beer-Lambert Transmitted Intensity: T = exp(- τ) where τ ∝ density * path * (1/λ^4)
  const tau = 0.18 * particleDensity * opticalPathLength * Math.pow(550 / wavelengthNm, 4);
  const transmittedIntensityRatio = Math.exp(-tau);

  // Atmospheric Particles for Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<{ x: number; y: number; size: number; scatteredRays: { angle: number; age: number; color: string }[] }[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize gas molecules
  useEffect(() => {
    const pts: { x: number; y: number; size: number; scatteredRays: { angle: number; age: number; color: string }[] }[] = [];
    for (let i = 0; i < 45; i++) {
      pts.push({
        x: 180 + Math.random() * 340,
        y: 60 + Math.random() * 240,
        size: 2.5 + Math.random() * 2.0,
        scatteredRays: [],
      });
    }
    particlesRef.current = pts;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
        drawScattering(ctx, canvas.width, canvas.height);
      }
    }

    if (!isRunning) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // Periodically emit scattered photon flashes from gas molecules
      const particles = particlesRef.current;
      for (const p of particles) {
        // Probability of scattering depends on 1/λ^4
        const scatterProb = isWhiteLight ? 0.35 : Math.min(relativeScatteringFactor * 0.06, 0.6);

        if (Math.random() < scatterProb * dt * 30 && p.scatteredRays.length < 4) {
          // Pick color: if white light, favor blue/violet for scattering
          let rayColor = '#38bdf8';
          if (isWhiteLight) {
            const r = Math.random();
            rayColor = r < 0.65 ? '#38bdf8' : r < 0.85 ? '#818cf8' : '#22c55e';
          } else {
            rayColor = wavelengthToColor(wavelengthNm);
          }

          p.scatteredRays.push({
            angle: Math.random() * 2 * Math.PI,
            age: 0,
            color: rayColor,
          });
        }

        // Age scattered rays
        for (let i = p.scatteredRays.length - 1; i >= 0; i--) {
          p.scatteredRays[i].age += dt * 2.2;
          if (p.scatteredRays[i].age > 1.0) {
            p.scatteredRays.splice(i, 1);
          }
        }
      }

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          drawScattering(ctx, canvas.width, canvas.height);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, wavelengthNm, isWhiteLight, relativeScatteringFactor, opticalPathLength, particleDensity, lang, tI18n]);

  // Convert wavelength nm to RGB hex color
  const wavelengthToColor = (wl: number) => {
    if (wl < 420) return '#8b5cf6';
    if (wl < 490) return '#38bdf8';
    if (wl < 560) return '#22c55e';
    if (wl < 590) return '#eab308';
    if (wl < 635) return '#f97316';
    return '#ef4444';
  };

  const drawScattering = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Dynamic Sky Gradient in Background based on sun altitude (noon vs sunset)
    const skyGrad = ctx.createLinearGradient(0, 0, width, height);
    if (opticalPathLength > 4.0) {
      // Sunset Sky (Deep Orange/Red at horizon, twilight purple at top)
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.5, '#7c2d12');
      skyGrad.addColorStop(1, '#ea580c');
    } else {
      // Daytime Noon Sky (Deep azure blue)
      skyGrad.addColorStop(0, '#0c4a6e');
      skyGrad.addColorStop(0.6, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Atmosphere Column Box
    const atmoX = 140;
    const atmoY = 30;
    const atmoW = width - 260;
    const atmoH = height - 70;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(atmoX, atmoY, atmoW, atmoH);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(atmoX, atmoY, atmoW, atmoH);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${tI18n('experiments.light_scattering.atmoCanvasLabel')} (Air Mass = ${opticalPathLength.toFixed(1)}x)`, atmoX + 12, atmoY + 18);

    // Incoming Sunlight Beam from the Left
    const beamY = height * 0.45;
    const sunX = 50;

    // Sun disc
    ctx.fillStyle = opticalPathLength > 4.0 ? '#ef4444' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(sunX, beamY, 26, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(tI18n('experiments.light_scattering.sunCanvasLabel'), sunX - 12, beamY + 4);

    // Incoming Beam Rays
    const inputColor = isWhiteLight ? '#ffffff' : wavelengthToColor(wavelengthNm);
    ctx.strokeStyle = inputColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(sunX + 26, beamY);
    ctx.lineTo(atmoX, beamY);
    ctx.stroke();

    // Beam penetrating through atmosphere (gradually losing short wavelengths)
    const beamGrad = ctx.createLinearGradient(atmoX, beamY, atmoX + atmoW, beamY);
    if (isWhiteLight) {
      beamGrad.addColorStop(0, '#ffffff');
      beamGrad.addColorStop(0.5, opticalPathLength > 3 ? '#fed7aa' : '#fef08a');
      beamGrad.addColorStop(1, opticalPathLength > 3 ? '#ef4444' : '#f59e0b');
    } else {
      beamGrad.addColorStop(0, inputColor);
      beamGrad.addColorStop(1, inputColor);
    }
    ctx.strokeStyle = beamGrad;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(atmoX, beamY);
    ctx.lineTo(atmoX + atmoW, beamY);
    ctx.stroke();

    // Draw Gas Molecules (N2 & O2) and Scattered Light Rays
    for (const p of particlesRef.current) {
      // Molecule circle
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      ctx.fill();

      // Scattered ray pulses
      for (const ray of p.scatteredRays) {
        const rayLen = ray.age * 45;
        const opacity = Math.max(1 - ray.age, 0);

        ctx.strokeStyle = `${ray.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + rayLen * Math.cos(ray.angle), p.y + rayLen * Math.sin(ray.angle));
        ctx.stroke();
      }
    }

    // Ground Observer Eye (Looking up at scattered sky)
    const observerX = atmoX + atmoW * 0.5;
    const observerY = height - 20;

    // Ground line
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, height - 15, width, 15);

    // Observer icon
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(tI18n('experiments.light_scattering.observerCanvasLabel'), observerX - 110, observerY - 25);

    // Transmitted Light Detector at Right Horizon (Sunset Observer)
    const transTargetX = width - 45;
    ctx.strokeStyle = isWhiteLight ? (opticalPathLength > 3 ? '#ef4444' : '#f59e0b') : inputColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(atmoX + atmoW, beamY);
    ctx.lineTo(transTargetX, beamY);
    ctx.stroke();
  };

  const getPresetName = (p: typeof PRESETS[0]) => {
    const names: Record<string, string> = {
      ar: p.nameAr,
      ku: p.nameKu,
      kmr: p.nameKmr || p.nameEn,
      en: p.nameEn,
    };
    return names[lang] || p.nameAr;
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'light_scattering',
      variableName: `Rayleigh Scattering Factor (λ=${wavelengthNm} nm)`,
      measuredValue: Number(relativeScatteringFactor.toFixed(2)),
      theoreticalValue: Number(relativeScatteringFactor.toFixed(2)),
      unit: 'ratio (vs 700nm)',
      parameters: {
        'Light Spectrum': isWhiteLight ? 'White Sunlight' : `${wavelengthNm} nm`,
        'Atmosphere Path': atmospherePath === 'noon' ? 'Zenith Noon (1.0x)' : 'Horizon Sunset (8.0x)',
        'Relative Scattering Intensity': `${relativeScatteringFactor.toFixed(2)}x`,
        'Transmitted Intensity T': `${(transmittedIntensityRatio * 100).toFixed(1)}%`,
        'Formula': 'I_scatter ∝ 1 / λ⁴',
      },
      equation: `I_scatter ∝ 1/λ⁴ => (700nm / ${wavelengthNm}nm)⁴ = ${relativeScatteringFactor.toFixed(2)}x scattering intensity`,
      notes: `Rayleigh scattering explains why midday sky is blue (450nm scatters ~6x more than red) and sunset is red (transmitted long waves).`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-zinc-900 to-amber-950/40 border border-sky-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <CloudSun  className="w-5 h-5 text-sky-400"/>
            <span>
              {tI18n('experiments.light_scattering.title')}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            {tI18n('experiments.light_scattering.subtitle')}
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
            onClick={handleLog}
           className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? tI18n('experiments.light_scattering.logged') : tI18n('experiments.light_scattering.logMeasurement')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls + Atmosphere Chamber Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sun  className="w-4 h-4 text-sky-400"/>
              {tI18n('experiments.light_scattering.controlsTitle')}
            </span>
          </div>

          {/* Preset Light Wavelength Selector */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5 font-medium">
              {tI18n('experiments.light_scattering.incidentLightLabel')}
            </label>
            <select
              value={selectedPresetIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setSelectedPresetIdx(idx);
                setWavelengthNm(PRESETS[idx].lambdaNm);
              }}
              className="w-full bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 rounded-xl p-2.5 focus:outline-none focus:border-sky-500 font-mono"
            >
              {PRESETS.map((p, idx) => (
                <option key={p.nameEn} value={idx}>
                  {getPresetName(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Wavelength Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.light_scattering.wavelengthLabel')}</span>
              <span style={{ color: wavelengthToColor(wavelengthNm) }} className="font-mono font-semibold">
                {wavelengthNm} nm
              </span>
            </div>
            <input
              type="range"
              min="380"
              max="750"
              step="5"
              value={wavelengthNm}
              onChange={(e) => {
                setWavelengthNm(Number(e.target.value));
                setSelectedPresetIdx(1); // switch away from white sunlight preset if slider touched
              }}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Sun Position / Atmosphere Thickness */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5 font-medium">
              {tI18n('experiments.light_scattering.atmospherePathLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setAtmospherePath('noon');
                  setOpticalPathLength(1.0);
                }}
                className={`min-h-[44px] min-w-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  opticalPathLength <= 2.0
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                {tI18n('experiments.light_scattering.noonBtn')}
              </button>
              <button
                onClick={() => {
                  setAtmospherePath('sunset');
                  setOpticalPathLength(8.0);
                }}
                className={`min-h-[44px] min-w-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  opticalPathLength > 4.0
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                {tI18n('experiments.light_scattering.sunsetBtn')}
              </button>
            </div>
          </div>

          {/* Atmospheric Path Length Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{tI18n('experiments.light_scattering.airMassLabel')}</span>
              <span className="font-mono text-amber-400 font-semibold">{opticalPathLength.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12.0"
              step="0.5"
              value={opticalPathLength}
              onChange={(e) => setOpticalPathLength(Number(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Science Explanation Box */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
            <span className="font-semibold text-sky-400 block">
              {tI18n('experiments.light_scattering.scienceTitle')}
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {tI18n('experiments.light_scattering.scienceBody')}
            </p>
          </div>
        </div>

        {/* Canvas & Live Computed Metrics */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={380}
             className="w-full h-[380px] rounded-xl block shadow-inner"/>
          </div>

          {/* Computed Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Relative Scattering Ratio */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-950/40 via-zinc-900 to-indigo-950/40 border border-sky-700/60 space-y-1">
              <span className="text-[10px] text-sky-300 uppercase font-semibold">
                {tI18n('experiments.light_scattering.scatteringFactorCard')}
              </span>
              <div className="text-xl font-bold font-mono text-sky-300">
                {relativeScatteringFactor.toFixed(2)}x
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">vs Red (700nm = 1.0)</span>
            </div>

            {/* Transmitted Percentage */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.light_scattering.transmittedLightCard')}
              </span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {(transmittedIntensityRatio * 100).toFixed(1)} <span className="text-sm text-zinc-400">%</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">T = e^(-τ)</span>
            </div>

            {/* Scattered Color Dominance */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.light_scattering.scatteredColorCard')}
              </span>
              <div className="text-sm font-bold text-sky-400 mt-1">
                {isWhiteLight ? tI18n('experiments.light_scattering.skyBlueText') : `${wavelengthNm} nm`}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Rayleigh Omnidirectional</span>
            </div>

            {/* Transmitted Sunset Color */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {tI18n('experiments.light_scattering.horizonColorCard')}
              </span>
              <div className="text-sm font-bold text-rose-400 mt-1">
                {opticalPathLength > 3.0 ? tI18n('experiments.light_scattering.sunsetRedText') : tI18n('experiments.light_scattering.brightYellowText')}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Air Mass = {opticalPathLength.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}