import { Sparkles, Pause, Play, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Language } from '../types';

import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

interface TargetMetal {
  id: string;
  nameAr: string;
  nameEn: string;
  workFunctionEV: number; // Phi in eV
  color: string;
}

const TARGET_METALS: TargetMetal[] = [
  { id: 'cesium', nameAr: 'السيزيوم (Cesium - Cs)', nameEn: 'Cesium (Cs)', workFunctionEV: 2.14, color: '#eab308' },
  { id: 'potassium', nameAr: 'البوتاسيوم (Potassium - K)', nameEn: 'Potassium (K)', workFunctionEV: 2.30, color: '#a855f7' },
  { id: 'sodium', nameAr: 'الصوديوم (Sodium - Na)', nameEn: 'Sodium (Na)', workFunctionEV: 2.36, color: '#f97316' },
  { id: 'zinc', nameAr: 'الزنك (Zinc - Zn)', nameEn: 'Zinc (Zn)', workFunctionEV: 4.30, color: '#94a3b8' },
  { id: 'copper', nameAr: 'النحاس (Copper - Cu)', nameEn: 'Copper (Cu)', workFunctionEV: 4.70, color: '#f59e0b' },
  { id: 'platinum', nameAr: 'البلاتين (Platinum - Pt)', nameEn: 'Platinum (Pt)', workFunctionEV: 5.65, color: '#cbd5e1' },
];

export default function PhotoelectricEffectSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [wavelengthNm, setWavelengthNm] = useState<number>(380); // nm (UV to visible)
  const [intensity, setIntensity] = useState<number>(80); // %
  const [metalIndex, setMetalIndex] = useState<number>(0); // Cesium by default
  const [biasVoltage, setBiasVoltage] = useState<number>(0); // Volts (-4V to +4V)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [electrons, setElectrons] = useState<{ id: number; x: number; y: number; vx: number }[]>([]);

  const getMetalName = (m: TargetMetal) => {
    const names: Record<string, string> = {
      ar: m.nameAr,
      ku: m.nameAr,
      kmr: m.nameEn,
      en: m.nameEn,
    };
    return names[lang] || m.nameAr;
  };

  const metal = TARGET_METALS[metalIndex];
  const hPlanckEV = 4.135667696e-15; // eV * s
  const cSpeed = 299792458; // m/s
  const hcEV_nm = 1239.84193; // eV * nm

  // Photon Energy E = hc / lambda (in eV)
  const photonEnergyEV = hcEV_nm / wavelengthNm;
  // Threshold Frequency & Wavelength: lambda0 = hc / Phi
  const thresholdWavelengthNm = hcEV_nm / metal.workFunctionEV;
  const thresholdFreqTHz = (cSpeed / (thresholdWavelengthNm * 1e-9)) / 1e12;
  const photonFreqTHz = (cSpeed / (wavelengthNm * 1e-9)) / 1e12;

  // Max Kinetic Energy: K_max = max(0, E_photon - Phi)
  const canEmit = photonEnergyEV > metal.workFunctionEV;
  const maxKineticEnergyEV = canEmit ? photonEnergyEV - metal.workFunctionEV : 0;
  // Stopping potential V_stop = K_max / e (Volts)
  const stoppingPotentialV = maxKineticEnergyEV;

  // Effective kinetic energy reaching anode with bias voltage:
  // if bias voltage is negative (retarding), electrons need K_max >= -biasVoltage
  const netEnergyEV = maxKineticEnergyEV + biasVoltage;
  const electronsReachAnode = canEmit && netEnergyEV > 0;
  // Current I is proportional to intensity if electrons can reach
  const photocurrentMicroA = electronsReachAnode ? (intensity / 100) * 15 * (netEnergyEV / (maxKineticEnergyEV || 1)) : 0;

  // Electron velocity v = sqrt(2 * E_k / m_e)
  // 1 eV = 1.602e-19 J, m_e = 9.109e-31 kg => v = sqrt(2 * 1.602e-19 * E_k / 9.109e-31) = 5.93e5 * sqrt(E_k) m/s
  const electronVelocityKmS = maxKineticEnergyEV > 0 ? 593 * Math.sqrt(maxKineticEnergyEV) : 0;

  // Get photon color based on wavelength
  const getPhotonColor = (nm: number) => {
    if (nm < 380) return '#c084fc'; // UV (Purple)
    if (nm < 450) return '#818cf8'; // Violet/Indigo
    if (nm < 495) return '#38bdf8'; // Blue
    if (nm < 570) return '#4ade80'; // Green
    if (nm < 590) return '#facc15'; // Yellow
    if (nm < 620) return '#fb923c'; // Orange
    return '#f87171'; // Red
  };

  const photonColor = getPhotonColor(wavelengthNm);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    let eCounter = 0;
    let spawnTimer = 0;

    const loop = (t: number) => {
      const dt = Math.min((t - lastTime) / 1000, 0.1);
      lastTime = t;

      if (isPlaying) {
        if (canEmit && intensity > 0) {
          spawnTimer += dt;
          const spawnInterval = Math.max(0.04, 0.3 / (intensity / 50));
          if (spawnTimer >= spawnInterval) {
            spawnTimer = 0;
            eCounter++;
            const baseVx = Math.max(20, Math.min(120, 40 * Math.sqrt(maxKineticEnergyEV || 0.1)));
            setElectrons((prev) => [
              ...prev.slice(-25),
              {
                id: eCounter,
                x: 25, // Cathode location
                y: 35 + (Math.random() * 30),
                vx: baseVx + (biasVoltage * 15),
              },
            ]);
          }
        }

        // Update electrons position
        setElectrons((prev) =>
          prev
            .map((e) => ({
              ...e,
              x: e.x + e.vx * dt,
            }))
            .filter((e) => e.x >= 25 && e.x <= 75 && (biasVoltage >= -stoppingPotentialV || e.x < 50))
        );
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, canEmit, intensity, maxKineticEnergyEV, biasVoltage, stoppingPotentialV]);

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'photoelectric_effect',
        parameters: {
          Wavelength_lambda_nm: wavelengthNm,
          Photon_Energy_E_eV: parseFloat(photonEnergyEV.toFixed(3)),
          Target_Metal: metal.nameEn,
          Work_Function_Phi_eV: metal.workFunctionEV,
          Bias_Voltage_V: biasVoltage,
          Light_Intensity_Percent: intensity,
        },
        measuredValue: parseFloat(maxKineticEnergyEV.toFixed(3)),
        theoreticalValue: parseFloat(Math.max(0, photonEnergyEV - metal.workFunctionEV).toFixed(3)),
        unit: 'eV',
        variableName: 'Max_Kinetic_Energy_Kmax',
        equation: 'E_k = h·f - Φ = hc/λ - Φ',
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles  className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {tI18n('experiments.photoelectric_effect.title')}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              E_k = h·f - Φ &nbsp;|&nbsp; e·V_stop = K_max &nbsp;|&nbsp; λ₀ = hc / Φ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
            <span>{isPlaying ? tI18n('experiments.photoelectric_effect.pause') : tI18n('experiments.photoelectric_effect.play')}</span>
          </button>
          <button
            onClick={handleLog}
           className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all">
            <Activity  className="w-3.5 h-3.5"/>
            <span>{tI18n('experiments.photoelectric_effect.logMeasurement')}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
          {/* Emission Status Badge */}
          <div className="flex items-center justify-between z-10 text-xs flex-wrap gap-2">
            <span
             className={`px-3 py-1 rounded-lg font-bold border ${ canEmit ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40' }`}>
              {canEmit
                ? tI18n('experiments.photoelectric_effect.activeEmission')
                : tI18n('experiments.photoelectric_effect.noEmission')}
            </span>

            <span className="font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
              {tI18n('experiments.photoelectric_effect.photocurrentLabel')} <strong className="text-amber-400">{photocurrentMicroA.toFixed(1)} μA</strong>
            </span>
          </div>

          {/* Phototube Vector Canvas */}
          <div className="relative w-full h-60 my-auto flex items-center justify-center">
            <svg viewBox="0 0 100 75" className="w-full h-full max-w-lg">
              {/* Glass Vacuum Tube */}
              <ellipse cx="50" cy="40" rx="35" ry="24" fill="#0f172a" stroke="#475569" strokeWidth="0.8" opacity="0.8" />

              {/* Light Source Lamp */}
              <g transform="translate(10, 15)">
                <circle cx="0" cy="0" r="5" fill={photonColor} />
                {/* Light Beams hitting Target Plate */}
                <line x1="2" y1="2" x2="16" y2="20" stroke={photonColor} strokeWidth="1.5" strokeDasharray="2,1" opacity={intensity / 100} />
                <line x1="4" y1="0" x2="16" y2="25" stroke={photonColor} strokeWidth="1.5" strokeDasharray="2,1" opacity={intensity / 100} />
                <line x1="0" y1="4" x2="16" y2="30" stroke={photonColor} strokeWidth="1.5" strokeDasharray="2,1" opacity={intensity / 100} />
                <text x="-8" y="-3" fill="#cbd5e1" fontSize="2.5" fontWeight="bold">💡 {wavelengthNm}nm</text>
              </g>

              {/* Cathode Target Metal Plate (Left: x=25) */}
              <rect x="23" y="24" width="4" height="32" rx="1" fill={metal.color} stroke="#f8fafc" strokeWidth="0.4" />
              <text x="25" y="61" fill="#cbd5e1" fontSize="2.5" fontWeight="bold" textAnchor="middle">
                {tI18n('experiments.photoelectric_effect.cathodeLabel')}
              </text>

              {/* Anode Collector Plate (Right: x=75) */}
              <rect x="73" y="24" width="4" height="32" rx="1" fill="#64748b" stroke="#94a3b8" strokeWidth="0.4" />
              <text x="75" y="61" fill="#cbd5e1" fontSize="2.5" fontWeight="bold" textAnchor="middle">
                {tI18n('experiments.photoelectric_effect.anodeLabel')}
              </text>

              {/* Liberated Photoelectrons */}
              {electrons.map((e) => (
                <circle key={e.id} cx={e.x} cy={e.y} r="1.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.3" />
              ))}

              {/* Circuit wiring at bottom with battery / meter */}
              <path d="M 25 56 L 25 68 L 42 68" fill="none" stroke="#64748b" strokeWidth="0.6" />
              <path d="M 75 56 L 75 68 L 58 68" fill="none" stroke="#64748b" strokeWidth="0.6" />
              {/* Bias Battery / Voltage Symbol */}
              <rect x="42" y="65" width="16" height="6" rx="1.5" fill="#1e293b" stroke="#64748b" strokeWidth="0.5" />
              <text x="50" y="69.5" fill="#facc15" fontSize="2.5" fontWeight="bold" textAnchor="middle">
                {biasVoltage >= 0 ? `+${biasVoltage.toFixed(1)}V` : `${biasVoltage.toFixed(1)}V`}
              </text>
            </svg>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.photoelectric_effect.photonEnergyMeter')}</span>
              <span className="text-purple-400 font-bold">{photonEnergyEV.toFixed(2)} eV</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.photoelectric_effect.workFunctionMeter')}</span>
              <span className="text-amber-400 font-bold">{metal.workFunctionEV.toFixed(2)} eV</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.photoelectric_effect.maxKineticEnergyMeter')}</span>
              <span className="text-emerald-400 font-bold">{maxKineticEnergyEV.toFixed(2)} eV</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.photoelectric_effect.stoppingPotentialMeter')}</span>
              <span className="text-sky-400 font-bold">{stoppingPotentialV.toFixed(2)} V</span>
            </div>
          </div>
        </div>

        {/* Input Parameters Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              {tI18n('experiments.photoelectric_effect.controlsTitle')}
            </h4>

            {/* Target Metal Selector */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300">{tI18n('experiments.photoelectric_effect.targetMetalLabel')}</label>
              <select
                value={metalIndex}
                onChange={(e) => setMetalIndex(parseInt(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-purple-500"
              >
                {TARGET_METALS.map((m, idx) => (
                  <option key={m.id} value={idx}>
                    {getMetalName(m)} ({m.workFunctionEV} eV)
                  </option>
                ))}
              </select>
            </div>

            {/* Light Wavelength (nm) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.photoelectric_effect.wavelengthLabel')}</span>
                <span className="font-mono text-purple-400 font-bold">{wavelengthNm} nm</span>
              </div>
              <input
                type="range"
                min="180"
                max="750"
                step="5"
                value={wavelengthNm}
                onChange={(e) => setWavelengthNm(parseInt(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>180nm (UV)</span>
                <span>450nm (Blue)</span>
                <span>750nm (Red)</span>
              </div>
            </div>

            {/* Light Intensity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.photoelectric_effect.intensityLabel')}</span>
                <span className="font-mono text-amber-400 font-bold">{intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-amber-500"
              />
            </div>

            {/* Bias Voltage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.photoelectric_effect.biasVoltageLabel')}</span>
                <span className="font-mono text-sky-400 font-bold">{biasVoltage >= 0 ? `+${biasVoltage.toFixed(1)}` : biasVoltage.toFixed(1)} V</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={biasVoltage}
                onChange={(e) => setBiasVoltage(parseFloat(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* External HUD Cards Row (All calculated data placed strictly outside Canvas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.photoelectric_effect.thresholdWavelengthCard')}
          </div>
          <div className="text-lg font-mono font-bold text-amber-400">
            {thresholdWavelengthNm.toFixed(1)} nm
          </div>
          <div className="text-[10px] text-slate-500 font-mono">{tI18n('experiments.photoelectric_effect.thresholdWavelengthSubtext')}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.photoelectric_effect.thresholdFrequencyCard')}
          </div>
          <div className="text-lg font-mono font-bold text-sky-400">
            {thresholdFreqTHz.toFixed(1)} THz
          </div>
          <div className="text-[10px] text-slate-500 font-mono">{tI18n('experiments.photoelectric_effect.thresholdFrequencySubtext')}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.photoelectric_effect.maxVelocityCard')}
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {electronVelocityKmS.toFixed(0)} km/s
          </div>
          <div className="text-[10px] text-slate-500 font-mono">v = √(2 · K_max / m_e)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.photoelectric_effect.einsteinLawCard')}
          </div>
          <div className="text-sm font-mono font-bold text-purple-300">
            {photonEnergyEV.toFixed(2)} = {metal.workFunctionEV.toFixed(2)} + {maxKineticEnergyEV.toFixed(2)} eV
          </div>
          <div className="text-[10px] text-slate-500 font-mono">E_photon = Φ + K_max</div>
        </div>
      </div>
    </div>
  );
}