import { Zap, Pause, Play, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Language } from '../types';

import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

export default function ElectricalTransformerSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [primaryVoltage, setPrimaryVoltage] = useState<number>(220); // Volts (V_p)
  const [primaryTurns, setPrimaryTurns] = useState<number>(500); // N_p
  const [secondaryTurns, setSecondaryTurns] = useState<number>(250); // N_s
  const [loadResistance, setLoadResistance] = useState<number>(50); // Ohms (R_L)
  const [efficiency, setEfficiency] = useState<number>(95); // %
  const [frequency] = useState<number>(50); // Hz
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [acPhase, setAcPhase] = useState<number>(0);

  // Transformer Equations:
  // Vs = Vp * (Ns / Np)
  const turnsRatio = secondaryTurns / primaryTurns; // Ns / Np
  const secondaryVoltage = primaryVoltage * turnsRatio;
  // Is = Vs / R_L
  const secondaryCurrent = loadResistance > 0 ? secondaryVoltage / loadResistance : 0;
  // Secondary Power Ps = Vs * Is
  const secondaryPower = secondaryVoltage * secondaryCurrent;
  // Primary Power Pp = Ps / (efficiency / 100)
  const primaryPower = (efficiency > 0) ? secondaryPower / (efficiency / 100) : 0;
  // Primary Current Ip = Pp / Vp
  const primaryCurrent = primaryVoltage > 0 ? primaryPower / primaryVoltage : 0;
  // Peak magnetic flux: Phi_max = Vp / (4.44 * f * Np)
  const maxMagneticFlux = primaryVoltage / (4.44 * frequency * primaryTurns); // Webers

  const isStepUp = secondaryTurns > primaryTurns;
  const isStepDown = secondaryTurns < primaryTurns;
  const isOneToOne = secondaryTurns === primaryTurns;

  useEffect(() => {
    if (!isPlaying) return;

    let animationId: number;
    let lastTime = performance.now();

    const loop = (t: number) => {
      const dt = Math.min((t - lastTime) / 1000, 0.1);
      lastTime = t;
      setAcPhase((prev) => (prev + dt * frequency * 2 * Math.PI) % (2 * Math.PI));
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, frequency]);

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'electrical_transformer',
        parameters: {
          Primary_Voltage_Vp_V: primaryVoltage,
          Primary_Turns_Np: primaryTurns,
          Secondary_Turns_Ns: secondaryTurns,
          Load_Resistance_RL_Ohm: loadResistance,
          Efficiency_Percent: efficiency,
          Turns_Ratio_Ns_over_Np: parseFloat(turnsRatio.toFixed(3)),
        },
        measuredValue: parseFloat(secondaryVoltage.toFixed(2)),
        theoreticalValue: parseFloat((primaryVoltage * (secondaryTurns / primaryTurns)).toFixed(2)),
        unit: 'V',
        variableName: 'Secondary_Voltage_Vs',
        equation: 'Vs / Vp = Ns / Np',
      });
    }
  };

  const primaryCoilRings = Math.min(20, Math.max(5, Math.round(primaryTurns / 35)));
  const secondaryCoilRings = Math.min(20, Math.max(5, Math.round(secondaryTurns / 35)));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap  className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {tI18n('experiments.electrical_transformer.title')}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Vₛ / Vₚ = Nₛ / Nₚ &nbsp;|&nbsp; Pₚ · η = Pₛ &nbsp;|&nbsp; Vₚ·Iₚ = Vₛ·Iₛ
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
            <span>{isPlaying ? tI18n('experiments.electrical_transformer.pause') : tI18n('experiments.electrical_transformer.play')}</span>
          </button>
          <button
            onClick={handleLog}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all">
            <Activity  className="w-3.5 h-3.5"/>
            <span>{tI18n('experiments.electrical_transformer.logMeasurement')}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
          {/* Transformer Type Indicator Badge */}
          <div className="flex items-center justify-between z-10 text-xs">
            <span
              className={`px-3 py-1 rounded-lg font-bold border ${ isStepUp ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : isStepDown ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }`}>
              {isStepUp
                ? tI18n('experiments.electrical_transformer.stepUpBadge')
                : isStepDown
                ? tI18n('experiments.electrical_transformer.stepDownBadge')
                : tI18n('experiments.electrical_transformer.isolationBadge')}
            </span>

            <span className="font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
              Nₛ/Nₚ = {turnsRatio.toFixed(3)}
            </span>
          </div>

          {/* Graphical Core & Coils Vector Canvas */}
          <div className="relative w-full h-64 my-auto flex items-center justify-center">
            <svg viewBox="0 0 100 80" className="w-full h-full max-w-lg">
              <defs>
                <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>

              {/* Laminated Iron Core Rectangular Loop */}
              {/* Outer Core */}
              <rect x="25" y="10" width="50" height="60" rx="3" fill="url(#coreGrad)" stroke="#64748b" strokeWidth="0.8" />
              {/* Inner Hole */}
              <rect x="37" y="22" width="26" height="36" rx="2" fill="#020617" stroke="#475569" strokeWidth="0.8" />

              {/* Animated Magnetic Flux Lines in Core */}
              <rect
                x="31"
                y="16"
                width="38"
                height="48"
                rx="2"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.75"
                strokeDasharray="3,2"
                strokeDashoffset={-(acPhase * 4)}
                opacity={0.7}
              />

              {/* Primary Coil (Left Arm: x=25 to 37) */}
              <g>
                <text x="18" y="8" fill="#f87171" fontSize="3" fontWeight="bold" textAnchor="middle">
                  {tI18n('experiments.electrical_transformer.primaryLabel')}
                </text>
                {Array.from({ length: primaryCoilRings }).map((_, i) => {
                  const y = 22 + (i / (primaryCoilRings - 1 || 1)) * 36;
                  return (
                    <ellipse
                      key={`p-${i}`}
                      cx="28"
                      cy={y}
                      rx="4"
                      ry="1.2"
                      fill="#ef4444"
                      stroke="#fca5a5"
                      strokeWidth="0.4"
                    />
                  );
                })}
              </g>

              {/* Secondary Coil (Right Arm: x=63 to 75) */}
              <g>
                <text x="82" y="8" fill="#38bdf8" fontSize="3" fontWeight="bold" textAnchor="middle">
                  {tI18n('experiments.electrical_transformer.secondaryLabel')}
                </text>
                {Array.from({ length: secondaryCoilRings }).map((_, i) => {
                  const y = 22 + (i / (secondaryCoilRings - 1 || 1)) * 36;
                  return (
                    <ellipse
                      key={`s-${i}`}
                      cx="72"
                      cy={y}
                      rx="4"
                      ry="1.2"
                      fill="#0284c7"
                      stroke="#7dd3fc"
                      strokeWidth="0.4"
                    />
                  );
                })}
              </g>

              {/* Input AC Supply Leads */}
              <line x1="8" y1="26" x2="25" y2="26" stroke="#f87171" strokeWidth="0.8" />
              <line x1="8" y1="54" x2="25" y2="54" stroke="#f87171" strokeWidth="0.8" />
              <circle cx="8" cy="40" r="5" fill="#1e1b4b" stroke="#f87171" strokeWidth="0.8" />
              <text x="8" y="41.5" fill="#f87171" fontSize="3" fontWeight="bold" textAnchor="middle">~ AC</text>

              {/* Output Load Leads & Connected Bulb */}
              <line x1="75" y1="26" x2="90" y2="26" stroke="#38bdf8" strokeWidth="0.8" />
              <line x1="75" y1="54" x2="90" y2="54" stroke="#38bdf8" strokeWidth="0.8" />
              <circle
                cx="90"
                cy="40"
                r="6"
                fill={secondaryVoltage > 10 ? '#fef08a' : '#334155'}
                stroke="#eab308"
                strokeWidth="0.8"
                opacity={Math.min(1, Math.max(0.2, secondaryPower / 200))}
              />
              <text x="90" y="41" fill="#78350f" fontSize="2.5" fontWeight="bold" textAnchor="middle">💡 R_L</text>
            </svg>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.electrical_transformer.primaryVoltageMeter')}</span>
              <span className="text-rose-400 font-bold">{primaryVoltage} V</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.electrical_transformer.secondaryVoltageMeter')}</span>
              <span className="text-sky-400 font-bold">{secondaryVoltage.toFixed(1)} V</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.electrical_transformer.secondaryCurrentMeter')}</span>
              <span className="text-emerald-400 font-bold">{secondaryCurrent.toFixed(2)} A</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{tI18n('experiments.electrical_transformer.secondaryPowerMeter')}</span>
              <span className="text-amber-400 font-bold">{secondaryPower.toFixed(1)} W</span>
            </div>
          </div>
        </div>

        {/* Input Parameters Controls */}
        <div className="lg:col-span-4 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {tI18n('experiments.electrical_transformer.paramsTitle')}
            </h4>

            {/* Primary Voltage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.electrical_transformer.primaryVoltageLabel')}</span>
                <span className="font-mono text-rose-400 font-bold">{primaryVoltage} V</span>
              </div>
              <input
                type="range"
                min="10"
                max="400"
                step="10"
                value={primaryVoltage}
                onChange={(e) => setPrimaryVoltage(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            {/* Primary Turns Np */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.electrical_transformer.primaryTurnsLabel')}</span>
                <span className="font-mono text-rose-400 font-bold">{primaryTurns} {tI18n('experiments.electrical_transformer.turnsUnit')}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={primaryTurns}
                onChange={(e) => setPrimaryTurns(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            {/* Secondary Turns Ns */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.electrical_transformer.secondaryTurnsLabel')}</span>
                <span className="font-mono text-sky-400 font-bold">{secondaryTurns} {tI18n('experiments.electrical_transformer.turnsUnit')}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="25"
                value={secondaryTurns}
                onChange={(e) => setSecondaryTurns(parseInt(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            {/* Load Resistance RL */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.electrical_transformer.loadResistanceLabel')}</span>
                <span className="font-mono text-amber-400 font-bold">{loadResistance} Ω</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={loadResistance}
                onChange={(e) => setLoadResistance(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Transformer Efficiency */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.electrical_transformer.efficiencyLabel')}</span>
                <span className="font-mono text-emerald-400 font-bold">{efficiency}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                step="1"
                value={efficiency}
                onChange={(e) => setEfficiency(parseInt(e.target.value))}
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
            {tI18n('experiments.electrical_transformer.primaryCurrentCard')}
          </div>
          <div className="text-lg font-mono font-bold text-rose-400">
            {primaryCurrent.toFixed(2)} A
          </div>
          <div className="text-[10px] text-slate-500 font-mono">{tI18n('experiments.electrical_transformer.energyConservationSubtext')}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.electrical_transformer.primaryPowerCard')}
          </div>
          <div className="text-lg font-mono font-bold text-amber-400">
            {primaryPower.toFixed(1)} W
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Pₚ = Pₛ / η ({efficiency}% {tI18n('experiments.electrical_transformer.efficiencySubtext')})</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.electrical_transformer.turnsRatioCard')}
          </div>
          <div className="text-lg font-mono font-bold text-sky-400">
            {turnsRatio.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">a = Nₛ / Nₚ = Vₛ / Vₚ</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {tI18n('experiments.electrical_transformer.peakFluxCard')}
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {(maxMagneticFlux * 1000).toFixed(2)} mWb
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Φ = Vₚ / (4.44 · f · Nₚ)</div>
        </div>
      </div>
    </div>
  );
}