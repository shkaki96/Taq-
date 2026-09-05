import { Waves, BookmarkCheck, Gauge } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';
import { PLANETS } from '../data/physicsData';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface MaterialPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  density: number; // kg/m³
  color: string;
}

interface FluidPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  density: number; // kg/m³
  color: string;
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: 'wood', nameAr: 'خشب صنوبر (600 kg/m³)', nameEn: 'Wood Pine (600 kg/m³)', nameKu: 'داری سنۆبەر (600 kg/m³)', nameKmr: 'Darê sênoberê (600 kg/m³)', density: 600, color: '#ca8a04' },
  { id: 'ice', nameAr: 'جليد نقي (917 kg/m³)', nameEn: 'Pure Ice (917 kg/m³)', nameKu: 'سەهۆڵی پەتی (917 kg/m³)', nameKmr: 'Qeşa paqij (917 kg/m³)', density: 917, color: '#bae6fd' },
  { id: 'aluminum', nameAr: 'ألمنيوم (2700 kg/m³)', nameEn: 'Aluminum (2700 kg/m³)', nameKu: 'ئەلومینیۆم (2700 kg/m³)', nameKmr: 'Alyumînyum (2700 kg/m³)', density: 2700, color: '#94a3b8' },
  { id: 'iron', nameAr: 'حديد صلب (7870 kg/m³)', nameEn: 'Iron / Steel (7870 kg/m³)', nameKu: 'ئاسن (7870 kg/m³)', nameKmr: 'Hesên (7870 kg/m³)', density: 7870, color: '#64748b' },
  { id: 'gold', nameAr: 'ذهب خالص (19300 kg/m³)', nameEn: 'Pure Gold (19300 kg/m³)', nameKu: 'ئاڵتوونی پەتی (19300 kg/m³)', nameKmr: 'Zêrê paqij (19300 kg/m³)', density: 19300, color: '#eab308' },
  { id: 'styrofoam', nameAr: 'فلين رغوي (50 kg/m³)', nameEn: 'Styrofoam (50 kg/m³)', nameKu: 'فلین / فۆم (50 kg/m³)', nameKmr: 'Polîstîren (50 kg/m³)', density: 50, color: '#f8fafc' },
];

const FLUID_PRESETS: FluidPreset[] = [
  { id: 'water', nameAr: 'ماء عذب (1000 kg/m³)', nameEn: 'Fresh Water (1000 kg/m³)', nameKu: 'ئاوی سازگار (1000 kg/m³)', nameKmr: 'Ava şêrîn (1000 kg/m³)', density: 1000, color: 'rgba(56, 189, 248, 0.45)' },
  { id: 'seawater', nameAr: 'ماء بحر مالح (1025 kg/m³)', nameEn: 'Salt Seawater (1025 kg/m³)', nameKu: 'ئاوی سوێری دەریا (1025 kg/m³)', nameKmr: 'Ava deryayê (1025 kg/m³)', density: 1025, color: 'rgba(14, 165, 233, 0.55)' },
  { id: 'oil', nameAr: 'زيت نباتي (900 kg/m³)', nameEn: 'Vegetable Oil (900 kg/m³)', nameKu: 'ڕۆنی ڕووەکی (900 kg/m³)', nameKmr: 'Rûnê nebatî (900 kg/m³)', density: 900, color: 'rgba(234, 179, 8, 0.45)' },
  { id: 'honey', nameAr: 'عسل نقي (1420 kg/m³)', nameEn: 'Pure Honey (1420 kg/m³)', nameKu: 'هەنگوینی پەتی (1420 kg/m³)', nameKmr: 'Hengivê paqij (1420 kg/m³)', density: 1420, color: 'rgba(217, 119, 6, 0.65)' },
  { id: 'gasoline', nameAr: 'بنزين خفيف (750 kg/m³)', nameEn: 'Gasoline (750 kg/m³)', nameKu: 'بەنزین (750 kg/m³)', nameKmr: 'Benzîn (750 kg/m³)', density: 750, color: 'rgba(244, 63, 94, 0.35)' },
  { id: 'mercury', nameAr: 'زئبق سائل (13600 kg/m³)', nameEn: 'Liquid Mercury (13600 kg/m³)', nameKu: 'جیوەی شل (13600 kg/m³)', nameKmr: 'Zîbeq (13600 kg/m³)', density: 13600, color: 'rgba(148, 163, 184, 0.85)' },
];

export default function BuoyancySim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();

  // Selected parameters
  const [selectedMaterial, setSelectedMaterial] = useState<string>('wood');
  const [selectedFluid, setSelectedFluid] = useState<string>('water');
  const [blockVolume, setBlockVolume] = useState<number>(0.005); // m³ (5 Liters)
  const [submersionDepth, setSubmersionDepth] = useState<number>(0.5); // manual immersion slider 0.0 to 1.0
  const [autoFloatMode, setAutoFloatMode] = useState<boolean>(true); // physics equilibrium
  const [selectedPlanet, setSelectedPlanet] = useState<string>('earth');
  const [logged, setLogged] = useState<boolean>(false);

  const matObj = MATERIAL_PRESETS.find((m) => m.id === selectedMaterial) || MATERIAL_PRESETS[0];
  const fluidObj = FLUID_PRESETS.find((f) => f.id === selectedFluid) || FLUID_PRESETS[0];
  const g = PLANETS.find((p) => p.id === selectedPlanet)?.g ?? 9.81;

  // Physics Calculations
  const objectDensity = matObj.density;
  const fluidDensity = fluidObj.density;
  const objectMass = objectDensity * blockVolume; // kg
  const actualWeight = objectMass * g; // Newtons (W = m * g)

  // Floating Equilibrium calculation:
  // If rho_obj < rho_fluid: floats with fraction Submerged = rho_obj / rho_fluid
  // If rho_obj >= rho_fluid: sinks (fraction Submerged = 1.0)
  const naturalSubmergedFraction = Math.min(1.0, objectDensity / fluidDensity);
  const effectiveSubmergedFraction = autoFloatMode ? naturalSubmergedFraction : submersionDepth;

  const submergedVolume = blockVolume * effectiveSubmergedFraction; // m³
  const buoyantForce = fluidDensity * submergedVolume * g; // N (F_b = rho * V_sub * g)
  const apparentWeight = Math.max(0, actualWeight - buoyantForce); // Apparent scale weight

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine floating status
  let statusText = tI18n('experiments.buoyancy.statusFloating');
  if (objectDensity > fluidDensity) {
    statusText = tI18n('experiments.buoyancy.statusSinking');
  } else if (Math.abs(objectDensity - fluidDensity) < 1e-2) {
    statusText = tI18n('experiments.buoyancy.statusNeutral');
  }

  // Draw simulation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Beaker Tank dimensions
    const tankX = 70;
    const tankY = 100;
    const tankWidth = 320;
    const tankHeight = 240;

    // Draw main Tank Glass container
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tankX, tankY);
    ctx.lineTo(tankX, tankY + tankHeight);
    ctx.lineTo(tankX + tankWidth, tankY + tankHeight);
    ctx.lineTo(tankX + tankWidth, tankY);
    ctx.stroke();

    // Spout for overflow into catch beaker
    ctx.beginPath();
    ctx.moveTo(tankX + tankWidth, tankY + 40);
    ctx.lineTo(tankX + tankWidth + 30, tankY + 65);
    ctx.stroke();

    // Water level in Tank
    const waterTopY = tankY + 40;
    const waterHeight = tankHeight - 40;

    ctx.fillStyle = fluidObj.color;
    ctx.fillRect(tankX + 2, waterTopY, tankWidth - 4, waterHeight - 2);

    // Water ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tankX + 2, waterTopY);
    for (let x = tankX + 2; x < tankX + tankWidth - 2; x += 10) {
      ctx.lineTo(x, waterTopY + Math.sin(x * 0.05) * 2);
    }
    ctx.stroke();

    // Graduated scale markings on tank
    ctx.strokeStyle = '#a1a1aa';
    ctx.fillStyle = '#71717a';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    for (let y = tankY + 50; y < tankY + tankHeight; y += 30) {
      ctx.beginPath();
      ctx.moveTo(tankX + 4, y);
      ctx.lineTo(tankX + 16, y);
      ctx.stroke();
      const liters = Math.round((tankY + tankHeight - y) * 0.1);
      ctx.fillText(`${liters}L`, tankX - 4, y + 3);
    }

    // Secondary Catch Beaker (Displaced Fluid)
    const catchX = tankX + tankWidth + 35;
    const catchY = tankY + 130;
    const catchW = 100;
    const catchH = 110;

    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(catchX, catchY);
    ctx.lineTo(catchX, catchY + catchH);
    ctx.lineTo(catchX + catchW, catchY + catchH);
    ctx.lineTo(catchX + catchW, catchY);
    ctx.stroke();

    // Displaced fluid inside catch beaker
    const displacedLiquidHeight = (submergedVolume / 0.01) * 70;
    if (displacedLiquidHeight > 2) {
      ctx.fillStyle = fluidObj.color;
      ctx.fillRect(catchX + 2, catchY + catchH - displacedLiquidHeight, catchW - 4, displacedLiquidHeight);
    }
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tI18n('experiments.buoyancy.overflowBeaker'), catchX + catchW / 2, catchY + catchH + 16);
    ctx.fillText(`${(submergedVolume * 1000).toFixed(1)} L`, catchX + catchW / 2, catchY + catchH - displacedLiquidHeight / 2 + 4);

    // Draw Submerged Block
    const blockSize = Math.max(60, Math.min(100, 50 + blockVolume * 8000));
    const blockX = tankX + tankWidth / 2 - blockSize / 2;

    // Calculate Y position based on fraction submerged
    let blockY = waterTopY - blockSize * (1 - effectiveSubmergedFraction);
    if (effectiveSubmergedFraction >= 1.0 && objectDensity > fluidDensity) {
      // Resting on the bottom of the tank
      blockY = tankY + tankHeight - blockSize;
    }

    // Spring Balance Scale above tank
    const scaleY = 30;
    const scaleX = tankX + tankWidth / 2;

    // Draw Spring balance housing
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(scaleX - 25, scaleY, 50, 45, 6);
    ctx.fill();
    ctx.stroke();

    // Scale display
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${apparentWeight.toFixed(1)}N`, scaleX, scaleY + 26);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText(tI18n('experiments.buoyancy.scaleLabel'), scaleX, scaleY + 38);

    // Hanging wire to block
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY + 45);
    ctx.lineTo(scaleX, blockY);
    ctx.stroke();

    // Render Material Block
    ctx.fillStyle = matObj.color;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(blockX, blockY, blockSize, blockSize, 6);
    ctx.fill();
    ctx.stroke();

    // Block Label
    ctx.fillStyle = objectDensity > 2000 || matObj.id === 'iron' ? '#ffffff' : '#09090b';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${objectMass.toFixed(2)} kg`, blockX + blockSize / 2, blockY + blockSize / 2 - 4);
    ctx.font = '9px monospace';
    ctx.fillText(`${(blockVolume * 1000).toFixed(1)} L`, blockX + blockSize / 2, blockY + blockSize / 2 + 10);

    // Force Vectors Diagram (on the right)
    const vecOriginX = width - 110;
    const vecOriginY = 190;

    // Buoyant Force (Upwards Green)
    const fbArrowLen = Math.min(100, buoyantForce * 1.5);
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vecOriginX, vecOriginY);
    ctx.lineTo(vecOriginX, vecOriginY - fbArrowLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vecOriginX - 6, vecOriginY - fbArrowLen + 8);
    ctx.lineTo(vecOriginX, vecOriginY - fbArrowLen);
    ctx.lineTo(vecOriginX + 6, vecOriginY - fbArrowLen + 8);
    ctx.fill();

    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`F_b = ${buoyantForce.toFixed(1)} N`, vecOriginX, vecOriginY - fbArrowLen - 8);

    // Gravity / Actual Weight (Downwards Red)
    const fgArrowLen = Math.min(100, actualWeight * 1.5);
    ctx.strokeStyle = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vecOriginX, vecOriginY);
    ctx.lineTo(vecOriginX, vecOriginY + fgArrowLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vecOriginX - 6, vecOriginY + fgArrowLen - 8);
    ctx.lineTo(vecOriginX, vecOriginY + fgArrowLen);
    ctx.lineTo(vecOriginX + 6, vecOriginY + fgArrowLen - 8);
    ctx.fill();

    ctx.fillText(`W = ${actualWeight.toFixed(1)} N`, vecOriginX, vecOriginY + fgArrowLen + 16);

    // Origin dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(vecOriginX, vecOriginY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [selectedMaterial, selectedFluid, blockVolume, submersionDepth, autoFloatMode, selectedPlanet, lang]);

  const getMaterialName = (m: typeof MATERIAL_PRESETS[0]) => {
    const names: Record<string, string> = {
      ar: m.nameAr,
      ku: m.nameKu,
      kmr: m.nameKmr || m.nameEn,
      en: m.nameEn,
    };
    return names[lang] || m.nameAr;
  };

  const getFluidName = (f: typeof FLUID_PRESETS[0]) => {
    const names: Record<string, string> = {
      ar: f.nameAr,
      ku: f.nameKu,
      kmr: f.nameKmr || f.nameEn,
      en: f.nameEn,
    };
    return names[lang] || f.nameAr;
  };

  // Log measurement
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'buoyancy',
      variableName: tI18n('experiments.buoyancy.buoyantForceVar'),
      measuredValue: Number(buoyantForce.toFixed(2)),
      theoreticalValue: Number((fluidDensity * submergedVolume * g).toFixed(2)),
      unit: 'N',
      parameters: {
        'Object Material': getMaterialName(matObj),
        'Fluid Medium': getFluidName(fluidObj),
        'Object Density': `${objectDensity} kg/m³`,
        'Fluid Density': `${fluidDensity} kg/m³`,
        'Submerged Fraction': `${(effectiveSubmergedFraction * 100).toFixed(0)}%`,
        'Apparent Weight': `${apparentWeight.toFixed(2)} N`,
      },
      equation: 'F_b = ρ_fluid · V_sub · g',
      notes: (() => {
        const notesMap: Record<string, string> = {
          ar: `تجربة أرخميدس لمادة ${matObj.nameAr} في ${fluidObj.nameAr}. قوة الطفو = ${buoyantForce.toFixed(2)}N، والوزن الظاهري = ${apparentWeight.toFixed(2)}N.`,
          ku: `تاقیکردنەوەی ئەرخەمیدس بۆ ماددەی ${matObj.nameKu} لە ${fluidObj.nameKu}. هێزی پاڵنەر = ${buoyantForce.toFixed(2)}N، کێشی دیار = ${apparentWeight.toFixed(2)}N.`,
          kmr: `Taqîkirina Arşîmedes ji bo madeya ${matObj.nameKmr} di ${fluidObj.nameKmr} de. Hêza rakirinê = ${buoyantForce.toFixed(2)}N, Giraniya xuyanî = ${apparentWeight.toFixed(2)}N.`,
          en: `Archimedes trial with ${matObj.nameEn} in ${fluidObj.nameEn}.`,
        };
        return notesMap[lang] || notesMap.ar;
      })(),
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="buoyancy-sim-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation Stage */}
      <div className="lg:col-span-8 space-y-4">
        {/* Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Waves  className="w-4 h-4"/>
              </span>
              <h2 className="text-base font-bold text-zinc-100">{tI18n('experiments.buoyancy.title')}</h2>
            </div>
            <p className="text-sm text-zinc-400 mt-0.5">{tI18n('experiments.buoyancy.shortDesc')}</p>
          </div>

          <button
            onClick={handleLog}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
          >
            <BookmarkCheck  className="w-3.5 h-3.5"/>
            <span>{logged ? tI18n('controls.loggedSuccess') : tI18n('controls.logData')}</span>
          </button>
        </div>

        {/* State & Buoyancy Status Strip */}
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span  className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-zinc-200 font-semibold">{statusText}</span>
          </div>
          <div className="text-sky-400 font-mono text-xs">
            {tI18n('experiments.buoyancy.submergedPercent')}: <span className="font-bold text-zinc-100">{(effectiveSubmergedFraction * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Unobstructed Interactive Canvas */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl p-1.5">
          <canvas ref={canvasRef} width={760} height={380}  className="w-full h-[380px] block rounded-xl"/>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono">
            <span className="text-[10px] text-zinc-400 block">{tI18n('experiments.buoyancy.actualWeight')}</span>
            <span className="text-sm font-bold text-rose-400">{actualWeight.toFixed(2)} N</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono">
            <span className="text-[10px] text-zinc-400 block">{tI18n('experiments.buoyancy.buoyantForce')}</span>
            <span className="text-sm font-bold text-emerald-400">{buoyantForce.toFixed(2)} N</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono">
            <span className="text-[10px] text-zinc-400 block">{tI18n('experiments.buoyancy.apparentWeight')}</span>
            <span className="text-sm font-bold text-sky-400">{apparentWeight.toFixed(2)} N</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono">
            <span className="text-[10px] text-zinc-400 block">{tI18n('experiments.buoyancy.submergedVolume')}</span>
            <span className="text-sm font-bold text-indigo-400">{(submergedVolume * 1000).toFixed(1)} L</span>
          </div>
        </div>
      </div>

      {/* Control Configuration Panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge  className="w-3.5 h-3.5 text-sky-400"/>
            <span>{tI18n('experiments.buoyancy.materialFluidConfig')}</span>
          </h3>

          {/* Object Material Select */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400 block">{tI18n('experiments.buoyancy.objectMaterial')}</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {MATERIAL_PRESETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {getMaterialName(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Fluid Select */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400 block">{tI18n('experiments.buoyancy.fluidType')}</label>
            <select
              value={selectedFluid}
              onChange={(e) => setSelectedFluid(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {FLUID_PRESETS.map((f) => (
                <option key={f.id} value={f.id}>
                  {getFluidName(f)}
                </option>
              ))}
            </select>
          </div>

          {/* Object Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.buoyancy.objectVolume')}</span>
              <span className="font-mono text-sky-400 font-bold">{(blockVolume * 1000).toFixed(1)} L</span>
            </div>
            <input
              type="range"
              min={0.001}
              max={0.01}
              step={0.0005}
              value={blockVolume}
              onChange={(e) => setBlockVolume(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Auto Float Toggle vs Manual Immersion */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="min-h-[44px] flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
              <span>{tI18n('experiments.buoyancy.naturalEquilibrium')}</span>
              <input
                type="checkbox"
                checked={autoFloatMode}
                onChange={(e) => setAutoFloatMode(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
              />
            </label>

            {!autoFloatMode && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{tI18n('experiments.buoyancy.manualImmersion')}</span>
                  <span className="font-mono text-indigo-400 font-bold">{(submersionDepth * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={submersionDepth}
                  onChange={(e) => setSubmersionDepth(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Theoretical Formula Box */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs font-mono">
          <span className="text-zinc-400 block font-sans font-bold">{tI18n('experiments.buoyancy.archimedesLaw')}</span>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sky-300 text-center text-sm font-bold">
            F_b = ρ_fluid · V_sub · g
          </div>
          <div className="text-[11px] text-zinc-400">
            = {fluidDensity} × {submergedVolume.toFixed(4)} × {g} = <span className="text-emerald-400 font-bold">{buoyantForce.toFixed(2)} N</span>
          </div>
        </div>
      </div>
    </div>
  );
}