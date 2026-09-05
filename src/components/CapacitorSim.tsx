import React, { useState, useEffect, useRef } from 'react';
import { 
  Battery, 
  RotateCcw, 
  BookmarkCheck, 
  Lightbulb, 
  Zap, 
  Sliders, 
  Gauge, 
  Layers, 
  Eye, 
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface CapacitorSimProps {
  lang: Language;
  onLogMeasurement?: (record: any) => void;
}

type CircuitMode = 'battery' | 'disconnected' | 'bulb';

interface DielectricMaterial {
  id: string;
  nameKey: string;
  kappa: number;
  color: string;
  borderColor: string;
  patternColor: string;
}

const DIELECTRIC_MATERIALS: DielectricMaterial[] = [
  { id: 'air', nameKey: 'experiments.capacitor_lab.air', kappa: 1.0, color: 'bg-sky-950/20', borderColor: 'border-sky-500/30', patternColor: '#38bdf8' },
  { id: 'teflon', nameKey: 'experiments.capacitor_lab.teflon', kappa: 2.1, color: 'bg-emerald-950/40', borderColor: 'border-emerald-500/40', patternColor: '#34d399' },
  { id: 'paper', nameKey: 'experiments.capacitor_lab.paper', kappa: 3.5, color: 'bg-amber-950/40', borderColor: 'border-amber-500/40', patternColor: '#fbbf24' },
  { id: 'glass', nameKey: 'experiments.capacitor_lab.glass', kappa: 5.0, color: 'bg-cyan-950/40', borderColor: 'border-cyan-500/40', patternColor: '#22d3ee' },
  { id: 'mica', nameKey: 'experiments.capacitor_lab.mica', kappa: 6.0, color: 'bg-purple-950/40', borderColor: 'border-purple-500/40', patternColor: '#c084fc' },
  { id: 'ceramic', nameKey: 'experiments.capacitor_lab.ceramic', kappa: 15.0, color: 'bg-rose-950/40', borderColor: 'border-rose-500/40', patternColor: '#fb7185' },
];

export const CapacitorSim: React.FC<CapacitorSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // Physical State Variables
  const [batteryVoltage, setBatteryVoltage] = useState<number>(1.5); // -3.0 to +3.0 V
  const [plateArea_mm2, setPlateArea_mm2] = useState<number>(200); // 100 to 400 mm2
  const [separation_mm, setSeparation_mm] = useState<number>(5.0); // 2.0 to 10.0 mm
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('air');
  const [dielectricOffset, setDielectricOffset] = useState<number>(100); // 0% to 100% inserted

  // Circuit Mode and Discharge Animation
  const [circuitMode, setCircuitMode] = useState<CircuitMode>('battery');
  const [frozenCharge_pC, setFrozenCharge_pC] = useState<number>(0);
  const [bulbBrightness, setBulbBrightness] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDischarging, setIsDischarging] = useState<boolean>(false);

  // Visualization Toggles
  const [showFieldLines, setShowFieldLines] = useState<boolean>(true);
  const [showCharges, setShowCharges] = useState<boolean>(true);
  const [showDipoles, setShowDipoles] = useState<boolean>(true);
  const [showVoltmeter, setShowVoltmeter] = useState<boolean>(true);

  // Logging Feedback
  const [logged, setLogged] = useState(false);

  const selectedMaterial = DIELECTRIC_MATERIALS.find(m => m.id === selectedMaterialId) || DIELECTRIC_MATERIALS[0];
  const kappa = selectedMaterial.kappa;

  // Physical Constants & Geometry Calculations
  const eps0 = 8.8541878e-12; // F/m
  const A_m2 = plateArea_mm2 * 1e-6; // m²
  const d_m = separation_mm * 1e-3; // m
  const insertionFraction = dielectricOffset / 100;

  // Composite Capacitance with Partial Dielectric Slab Insertion (Parallel equivalent)
  // C = (eps0 * A * (1 - f) / d) + (eps0 * kappa * A * f / d)
  const baseCapacitance_F = (eps0 * A_m2 * (1 - insertionFraction + kappa * insertionFraction)) / d_m;
  const capacitance_pF = baseCapacitance_F * 1e12;

  // Plate Voltage and Stored Charge depending on Circuit Mode
  let plateVoltage = 0;
  let charge_pC = 0;

  if (circuitMode === 'battery') {
    plateVoltage = batteryVoltage;
    charge_pC = capacitance_pF * plateVoltage;
  } else if (circuitMode === 'disconnected') {
    charge_pC = frozenCharge_pC;
    plateVoltage = capacitance_pF > 0 ? charge_pC / capacitance_pF : 0;
  } else if (circuitMode === 'bulb') {
    charge_pC = frozenCharge_pC;
    plateVoltage = capacitance_pF > 0 ? charge_pC / capacitance_pF : 0;
  }

  // Stored Energy U = 0.5 * C * V^2 = 0.5 * Q^2 / C (in Picojoules pJ)
  const energy_pJ = 0.5 * capacitance_pF * Math.pow(plateVoltage, 2);

  // Electric Field Strength E = |V| / d (in V/m)
  const electricField_V_m = Math.abs(plateVoltage) / d_m;

  // Bound Polarization Charge on Dielectric Q_b = Q * (1 - 1/kappa) * insertionFraction
  const boundCharge_pC = kappa > 1 ? Math.abs(charge_pC) * (1 - 1 / kappa) * insertionFraction : 0;

  // Dielectric Breakdown Check: Air breaks down around 3 kV/mm (3e6 V/m)
  const isBreakdown = electricField_V_m > 3.0e6;

  // Handle Mode Switching
  const handleSwitchMode = (newMode: CircuitMode) => {
    if (newMode === 'disconnected' && circuitMode === 'battery') {
      setFrozenCharge_pC(capacitance_pF * batteryVoltage);
      setBulbBrightness(0);
      setIsDischarging(false);
    } else if (newMode === 'bulb') {
      const currentCharge = circuitMode === 'battery' ? (capacitance_pF * batteryVoltage) : frozenCharge_pC;
      setFrozenCharge_pC(currentCharge);
      setIsDischarging(true);
      setIsPaused(false);
    } else if (newMode === 'battery') {
      setBulbBrightness(0);
      setIsDischarging(false);
      setIsPaused(false);
    }
    setCircuitMode(newMode);
  };

  // Instant Discharge Action (Short circuit capacitor to 0V)
  const handleInstantDischarge = () => {
    setFrozenCharge_pC(0);
    setBulbBrightness(0);
    setIsDischarging(false);
    if (circuitMode === 'battery') {
      setBatteryVoltage(0);
    }
  };

  // Discharge Animation in Bulb Mode
  const dischargeRef = useRef<number | null>(null);

  useEffect(() => {
    if (circuitMode === 'bulb' && isDischarging && !isPaused) {
      let lastTime = performance.now();

      const animateDischarge = (time: number) => {
        const dt = (time - lastTime) / 1000; // seconds
        lastTime = time;

        const tau = 1.2; 
        const decayFactor = Math.exp(-dt / tau);

        setFrozenCharge_pC(prev => {
          const next = prev * decayFactor;
          if (Math.abs(next) < 0.005) {
            setIsDischarging(false);
            setBulbBrightness(0);
            return 0;
          }
          const intensity = Math.min(Math.pow(next / 4.0, 2), 1.0);
          setBulbBrightness(intensity);
          return next;
        });

        if (Math.abs(frozenCharge_pC) > 0.005 && isDischarging && !isPaused) {
          dischargeRef.current = requestAnimationFrame(animateDischarge);
        }
      };

      dischargeRef.current = requestAnimationFrame(animateDischarge);

      return () => {
        if (dischargeRef.current) cancelAnimationFrame(dischargeRef.current);
      };
    }
  }, [circuitMode, isDischarging, isPaused, frozenCharge_pC]);

  // Preset Handlers
  const applyPreset = (preset: 'standard' | 'maxStorage' | 'disconnectDemo' | 'cameraFlash') => {
    if (preset === 'standard') {
      setBatteryVoltage(1.5);
      setPlateArea_mm2(200);
      setSeparation_mm(5.0);
      setSelectedMaterialId('air');
      setDielectricOffset(100);
      setCircuitMode('battery');
      setBulbBrightness(0);
      setIsDischarging(false);
    } else if (preset === 'maxStorage') {
      setBatteryVoltage(3.0);
      setPlateArea_mm2(400);
      setSeparation_mm(2.0);
      setSelectedMaterialId('ceramic');
      setDielectricOffset(100);
      setCircuitMode('battery');
      setBulbBrightness(0);
      setIsDischarging(false);
    } else if (preset === 'disconnectDemo') {
      setBatteryVoltage(1.5);
      setPlateArea_mm2(300);
      setSeparation_mm(3.0);
      setSelectedMaterialId('glass');
      setDielectricOffset(100);
      const cap = ((eps0 * 300e-6 * 5.0) / 3.0e-3) * 1e12;
      setFrozenCharge_pC(cap * 1.5);
      setCircuitMode('disconnected');
      setBulbBrightness(0);
      setIsDischarging(false);
    } else if (preset === 'cameraFlash') {
      setBatteryVoltage(3.0);
      setPlateArea_mm2(400);
      setSeparation_mm(2.0);
      setSelectedMaterialId('ceramic');
      setDielectricOffset(100);
      const cap = ((eps0 * 400e-6 * 15.0) / 2.0e-3) * 1e12;
      setFrozenCharge_pC(cap * 3.0);
      setCircuitMode('bulb');
      setIsDischarging(true);
      setIsPaused(false);
    }
  };

  const resetSimulation = () => {
    setBatteryVoltage(1.5);
    setPlateArea_mm2(200);
    setSeparation_mm(5.0);
    setSelectedMaterialId('air');
    setDielectricOffset(100);
    setCircuitMode('battery');
    setFrozenCharge_pC(0);
    setBulbBrightness(0);
    setIsDischarging(false);
    setIsPaused(false);
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'capacitor_lab',
        batteryVoltage,
        plateVoltage,
        plateArea_mm2,
        separation_mm,
        dielectricMaterial: selectedMaterialId,
        dielectricK: kappa,
        dielectricOffset,
        capacitance_pF,
        charge_pC,
        energy_pJ,
        electricField_V_m,
        circuitMode,
        timestamp: new Date().toISOString()
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Charge Display Counts
  const absCharge = Math.abs(charge_pC);
  const chargeCount = Math.min(Math.round(absCharge * 2.5), 18);
  const isTopPositive = plateVoltage >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl select-none" id="capacitor-sim-root">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-sky-500/10 border border-blue-500/30 rounded-xl text-blue-400 shadow-inner">
            <Battery className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{tI18n('experiments.capacitor_lab.title')}</span>
              {isBreakdown && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {tI18n('experiments.capacitor_lab.breakdownWarning')}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.capacitor_lab.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            id="capacitor-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              logged ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{logged ? (tI18n('experiments.capacitor_lab.logged') || 'Logged ✓') : (tI18n('experiments.capacitor_lab.log') || 'Log')}</span>
          </button>
          <button 
            id="capacitor-reset-btn"
            onClick={resetSimulation}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold rounded-xl border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{tI18n('experiments.capacitor_lab.reset')}</span>
          </button>
        </div>
      </div>

      {/* Prominent Execution & Simulation Control Toolbar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3.5">
        {/* Top: Controls Title & Quick Presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            {tI18n('experiments.capacitor_lab.controlsBar')}
          </span>
          <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium me-1 hidden sm:inline">
              {tI18n('experiments.capacitor_lab.presets')}:
            </span>
            <button
              onClick={() => applyPreset('standard')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all active:scale-95"
            >
              {tI18n('experiments.capacitor_lab.presetStandard')}
            </button>
            <button
              onClick={() => applyPreset('maxStorage')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all active:scale-95"
            >
              {tI18n('experiments.capacitor_lab.presetMaxStorage')}
            </button>
            <button
              onClick={() => applyPreset('disconnectDemo')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all active:scale-95"
            >
              {tI18n('experiments.capacitor_lab.presetDisconnectExp')}
            </button>
            <button
              onClick={() => applyPreset('cameraFlash')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/40 transition-all active:scale-95 flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              {tI18n('experiments.capacitor_lab.presetCameraFlash')}
            </button>
          </div>
        </div>

        {/* Bottom: Circuit Mode Segmented Switch & Action Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          {/* 3-Way Circuit Mode Segmented Switch */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {/* 1. Connect & Charge Battery Button */}
            <button
              id="btn-charge-battery"
              onClick={() => handleSwitchMode('battery')}
              className={`min-h-[42px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                circuitMode === 'battery'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
            >
              <Battery className="w-4 h-4 shrink-0" />
              <span className="truncate">{tI18n('experiments.capacitor_lab.chargeBattery')}</span>
            </button>

            {/* 2. Isolate / Open Circuit Button */}
            <button
              id="btn-isolate-capacitor"
              onClick={() => handleSwitchMode('disconnected')}
              className={`min-h-[42px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                circuitMode === 'disconnected'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 shadow-md shadow-sky-500/30'
                  : 'text-slate-300 hover:text-sky-300 hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span className="truncate">{tI18n('experiments.capacitor_lab.isolateCapacitor')}</span>
            </button>

            {/* 3. Discharge via Lamp Button */}
            <button
              id="btn-discharge-bulb"
              onClick={() => handleSwitchMode('bulb')}
              className={`min-h-[42px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                circuitMode === 'bulb'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md shadow-yellow-500/30'
                  : 'text-slate-300 hover:text-yellow-300 hover:bg-slate-800/60'
              }`}
            >
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span className="truncate">{tI18n('experiments.capacitor_lab.dischargeBulb')}</span>
            </button>
          </div>

          {/* Action Buttons: Play/Pause & Instant 0V */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
            {/* Play / Pause Discharge Animation */}
            <button
              id="btn-play-pause-discharge"
              onClick={() => {
                if (circuitMode !== 'bulb') {
                  handleSwitchMode('bulb');
                } else {
                  setIsPaused(prev => !prev);
                }
              }}
              className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isDischarging && !isPaused
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
              }`}
            >
              {isDischarging && !isPaused ? (
                <>
                  <Pause className="w-4 h-4 shrink-0" />
                  <span>{tI18n('experiments.capacitor_lab.pause')}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 shrink-0" />
                  <span>{tI18n('experiments.capacitor_lab.play')}</span>
                </>
              )}
            </button>

            {/* Instant Short Circuit Discharge (0V) */}
            <button
              id="btn-instant-discharge"
              onClick={handleInstantDischarge}
              className="min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{tI18n('experiments.capacitor_lab.instantDischarge')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Circuit Canvas & Controls Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Unobstructed Interactive Circuit Stage */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative min-h-[460px] overflow-hidden">
          
          {/* Top Info Bar on Canvas */}
          <div className="w-full flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">
                {circuitMode === 'battery' && tI18n('experiments.capacitor_lab.modeBattery')}
                {circuitMode === 'disconnected' && tI18n('experiments.capacitor_lab.modeDisconnected')}
                {circuitMode === 'bulb' && (isDischarging ? tI18n('experiments.capacitor_lab.discharging') : tI18n('experiments.capacitor_lab.modeBulb'))}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-400">
              Q = {absCharge.toFixed(2)} pC
            </div>
          </div>

          {/* Interactive Circuit Schematic and Capacitor Plates Graphic */}
          <div className="w-full flex-1 flex flex-col justify-center items-center py-6 relative my-2">
            
            {/* Background Vector Circuit Wires & Components */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 520 280">
                {/* Battery Loop (Left Branch) */}
                <path 
                  d="M 130 65 L 50 65 L 50 215 L 130 215" 
                  fill="none" 
                  stroke={circuitMode === 'battery' ? '#f59e0b' : '#334155'} 
                  strokeWidth="3" 
                  strokeDasharray={circuitMode === 'battery' ? '6 4' : 'none'}
                />

                {/* Lightbulb Loop (Right Branch) */}
                <path 
                  d="M 390 65 L 470 65 L 470 215 L 390 215" 
                  fill="none" 
                  stroke={circuitMode === 'bulb' ? '#fbbf24' : '#334155'} 
                  strokeWidth="3" 
                  strokeDasharray={circuitMode === 'bulb' && isDischarging ? '6 4' : 'none'}
                />

                {/* Left Battery Graphic Component */}
                <g transform="translate(30, 115)">
                  <rect x="0" y="0" width="40" height="50" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  <line x1="8" y1="20" x2="32" y2="20" stroke="#f59e0b" strokeWidth="3" />
                  <line x1="14" y1="30" x2="26" y2="30" stroke="#38bdf8" strokeWidth="3" />
                  <text x="20" y="-6" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">
                    {batteryVoltage >= 0 ? `+${batteryVoltage.toFixed(1)}V` : `${batteryVoltage.toFixed(1)}V`}
                  </text>
                  <text x="20" y="62" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {tI18n('experiments.capacitor_lab.switchBattery')}
                  </text>
                </g>

                {/* Right Lightbulb Graphic Component */}
                <g transform="translate(450, 115)">
                  {bulbBrightness > 0.05 && (
                    <circle cx="20" cy="25" r={32 * bulbBrightness} fill="#f59e0b" opacity={0.35 * bulbBrightness} />
                  )}
                  <circle cx="20" cy="25" r="18" fill={bulbBrightness > 0.1 ? `rgba(251, 191, 36, ${0.4 + 0.6 * bulbBrightness})` : '#0f172a'} stroke={bulbBrightness > 0.1 ? '#fbbf24' : '#475569'} strokeWidth="2.5" />
                  <path d="M 13 25 Q 20 15 27 25" fill="none" stroke={bulbBrightness > 0.1 ? '#ffffff' : '#64748b'} strokeWidth="2" />
                  <text x="20" y="62" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {tI18n('experiments.capacitor_lab.switchBulb')}
                  </text>
                </g>

                {/* Optional Voltmeter Probes Cables (when showVoltmeter is active) */}
                {showVoltmeter && (
                  <g>
                    {/* Red Positive Probe */}
                    <path d="M 260 65 L 260 40 L 320 40" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx="260" cy="65" r="4" fill="#ef4444" />
                    {/* Black Negative Probe */}
                    <path d="M 260 215 L 260 240 L 320 240" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx="260" cy="215" r="4" fill="#3b82f6" />
                  </g>
                )}
              </svg>
            </div>

            {/* Top Plate Graphic Component */}
            <div className="w-full flex flex-col items-center z-10">
              <div
                style={{ width: `${Math.min(Math.max((plateArea_mm2 / 400) * 75 + 10, 35), 85)}%` }}
                className={`h-8 rounded-lg border shadow-lg flex items-center justify-around px-3 text-white font-mono text-xs transition-all duration-200 ${
                  isTopPositive 
                    ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 border-red-300 shadow-red-500/20' 
                    : 'bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 border-blue-300 shadow-blue-500/20'
                }`}
              >
                {showCharges && chargeCount > 0 && Array.from({ length: chargeCount }).map((_, i) => (
                  <span key={i} className="font-extrabold text-[11px] drop-shadow">
                    {isTopPositive ? '+' : '−'}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-bold ${isTopPositive ? 'text-rose-400' : 'text-sky-400'}`}>
                  {tI18n('experiments.capacitor_lab.topPlateLabel')} ({isTopPositive ? `+${absCharge.toFixed(2)} pC` : `-${absCharge.toFixed(2)} pC`})
                </span>
              </div>
            </div>

            {/* Gap Area with Dielectric Slab & Electric Field Vectors */}
            <div
              style={{ height: `${Math.max(separation_mm * 14, 44)}px` }}
              className="w-3/4 my-1 flex justify-center items-center transition-all duration-200 relative overflow-hidden"
            >
              {/* Dielectric Slab (Sliding partially or fully) */}
              {selectedMaterialId !== 'air' && (
                <div
                  style={{
                    width: `${(plateArea_mm2 / 400) * (dielectricOffset / 100) * 75 + 5}%`,
                    left: `${50 - ((plateArea_mm2 / 400) * 75 + 10) / 2}%`,
                    height: '100%'
                  }}
                  className={`absolute top-0 rounded border-2 ${selectedMaterial.color} ${selectedMaterial.borderColor} backdrop-blur-sm z-0 transition-all flex flex-col justify-around items-center px-1 overflow-hidden`}
                >
                  <span className="text-[9px] font-bold text-slate-200 bg-slate-950/80 px-1.5 py-0.5 rounded shadow">
                    κ = {kappa.toFixed(1)} ({tI18n(selectedMaterial.nameKey).split(' ')[0]})
                  </span>
                  
                  {/* Molecular Polarization Bound Dipoles (+ -) */}
                  {showDipoles && Math.abs(charge_pC) > 0.1 && (
                    <div className="w-full flex justify-around opacity-80">
                      {Array.from({ length: Math.min(Math.round(boundCharge_pC * 1.5 + 2), 6) }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center bg-slate-900/60 border border-slate-700/60 px-1 py-0.5 rounded text-[8px] font-mono text-amber-300">
                          <span>{isTopPositive ? '−' : '+'}</span>
                          <span>{isTopPositive ? '+' : '−'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Electric Field Vector Lines */}
              {showFieldLines && Math.abs(plateVoltage) > 0.05 && (
                <div className="w-full h-full flex justify-around items-center opacity-85 z-10 pointer-events-none px-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col items-center font-bold text-xs transition-all ${
                        isTopPositive ? 'text-sky-400' : 'text-amber-400'
                      }`}
                    >
                      <span>{isTopPositive ? '↓' : '↑'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Plate Graphic Component */}
            <div className="w-full flex flex-col items-center z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-bold ${!isTopPositive ? 'text-rose-400' : 'text-sky-400'}`}>
                  {tI18n('experiments.capacitor_lab.bottomPlateLabel')} ({!isTopPositive ? `+${absCharge.toFixed(2)} pC` : `-${absCharge.toFixed(2)} pC`})
                </span>
              </div>
              <div
                style={{ width: `${Math.min(Math.max((plateArea_mm2 / 400) * 75 + 10, 35), 85)}%` }}
                className={`h-8 rounded-lg border shadow-lg flex items-center justify-around px-3 text-white font-mono text-xs transition-all duration-200 ${
                  !isTopPositive 
                    ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 border-red-300 shadow-red-500/20' 
                    : 'bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 border-blue-300 shadow-blue-500/20'
                }`}
              >
                {showCharges && chargeCount > 0 && Array.from({ length: chargeCount }).map((_, i) => (
                  <span key={i} className="font-extrabold text-[11px] drop-shadow">
                    {!isTopPositive ? '+' : '−'}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Dedicated Non-Overlapping Instrument Dashboard Row */}
          {showVoltmeter && (
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-10 mt-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300">{tI18n('experiments.capacitor_lab.voltmeterTitle')}:</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                  <span className="text-[11px] text-slate-400">{tI18n('experiments.capacitor_lab.plateVoltage')}:</span>
                  <span className="text-sm font-bold text-amber-400">
                    {plateVoltage >= 0 ? `+${plateVoltage.toFixed(2)} V` : `${plateVoltage.toFixed(2)} V`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                  <span className="text-[11px] text-slate-400">{tI18n('experiments.capacitor_lab.electricField')}:</span>
                  <span className="text-xs font-bold text-sky-400">
                    {electricField_V_m >= 1000 ? `${(electricField_V_m / 1000).toFixed(2)} kV/m` : `${electricField_V_m.toFixed(0)} V/m`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Physical Meters Grid */}
          <div className="w-full grid grid-cols-3 gap-2.5 border-t border-slate-800/80 pt-3 text-center z-10 mt-2">
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">{tI18n('experiments.capacitor_lab.capacitance')}</span>
              <span className="text-sm sm:text-base font-bold text-sky-400 font-mono">{capacitance_pF.toFixed(2)} pF</span>
            </div>
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">{tI18n('experiments.capacitor_lab.storedCharge')}</span>
              <span className="text-sm sm:text-base font-bold text-amber-400 font-mono">{absCharge.toFixed(2)} pC</span>
            </div>
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">{tI18n('experiments.capacitor_lab.storedEnergy')}</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">{energy_pJ.toFixed(2)} pJ</span>
            </div>
          </div>
        </div>

        {/* Right Side: Parametric Adjusters & Material Selectors */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Controls Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            
            {/* Battery Voltage Slider with Quick Step Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Battery className="w-4 h-4" />
                  {tI18n('experiments.capacitor_lab.batteryVoltage')}
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {batteryVoltage >= 0 ? `+${batteryVoltage.toFixed(2)} V` : `${batteryVoltage.toFixed(2)} V`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBatteryVoltage(prev => Math.max(Number((prev - 0.1).toFixed(2)), -3.0))}
                  className="min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold active:scale-95 transition-all"
                >
                  −
                </button>
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.1"
                  value={batteryVoltage}
                  onChange={(e) => setBatteryVoltage(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <button
                  onClick={() => setBatteryVoltage(prev => Math.min(Number((prev + 0.1).toFixed(2)), 3.0))}
                  className="min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
              <div className="flex justify-between gap-1 text-[11px]">
                <button onClick={() => setBatteryVoltage(-1.5)} className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800">-1.5V</button>
                <button onClick={() => setBatteryVoltage(0.0)} className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800">0.0V</button>
                <button onClick={() => setBatteryVoltage(1.5)} className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800">+1.5V</button>
                <button onClick={() => setBatteryVoltage(3.0)} className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800">+3.0V</button>
              </div>
            </div>

            {/* Plate Area Slider */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-400" />
                  {tI18n('experiments.capacitor_lab.plateArea')} (A)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {plateArea_mm2} mm²
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlateArea_mm2(prev => Math.max(prev - 10, 100))}
                  className="min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold active:scale-95 transition-all"
                >
                  −
                </button>
                <input
                  type="range"
                  min="100"
                  max="400"
                  step="10"
                  value={plateArea_mm2}
                  onChange={(e) => setPlateArea_mm2(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <button
                  onClick={() => setPlateArea_mm2(prev => Math.min(prev + 10, 400))}
                  className="min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Plate Separation Slider */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  {tI18n('experiments.capacitor_lab.separation')} (d)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {separation_mm.toFixed(1)} mm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSeparation_mm(prev => Math.max(Number((prev - 0.5).toFixed(1)), 2.0))}
                  className="min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold active:scale-95 transition-all"
                >
                  −
                </button>
                <input
                  type="range"
                  min="2.0"
                  max="10.0"
                  step="0.5"
                  value={separation_mm}
                  onChange={(e) => setSeparation_mm(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <button
                  onClick={() => setSeparation_mm(prev => Math.min(Number((prev + 0.5).toFixed(1)), 10.0))}
                  className="min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Dielectric Material Selector */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <label className="text-slate-300 block">{tI18n('experiments.capacitor_lab.dielectric')}</label>
                <span className="text-sky-400 font-mono text-xs">κ = {kappa.toFixed(1)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {DIELECTRIC_MATERIALS.map(mat => (
                  <button
                    key={mat.id}
                    onClick={() => setSelectedMaterialId(mat.id)}
                    className={`min-h-[44px] p-2 rounded-xl border text-center transition-all active:scale-95 flex flex-col justify-center items-center gap-0.5 ${
                      selectedMaterialId === mat.id
                        ? `${mat.color} ${mat.borderColor} text-white font-bold ring-1 ring-sky-500/50`
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[11px] leading-tight truncate w-full">{tI18n(mat.nameKey)}</span>
                    <span className="text-[10px] opacity-75 font-mono">κ = {mat.kappa}</span>
                  </button>
                ))}
              </div>

              {/* Dielectric Insertion Offset Slider (if not air) */}
              {selectedMaterialId !== 'air' && (
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{tI18n('experiments.capacitor_lab.dielectricOffset')}</span>
                    <span className="font-mono text-slate-200">{dielectricOffset}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={dielectricOffset}
                    onChange={(e) => setDielectricOffset(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Visual Overlay Toggles */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              {tI18n('experiments.capacitor_lab.showFieldLines')} / {tI18n('experiments.capacitor_lab.showCharges')}:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setShowFieldLines(prev => !prev)}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg border flex items-center justify-between transition-all ${
                  showFieldLines ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>{tI18n('experiments.capacitor_lab.showFieldLines')}</span>
                <span>{showFieldLines ? '✓' : '✗'}</span>
              </button>
              <button
                onClick={() => setShowCharges(prev => !prev)}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg border flex items-center justify-between transition-all ${
                  showCharges ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>{tI18n('experiments.capacitor_lab.showCharges')}</span>
                <span>{showCharges ? '✓' : '✗'}</span>
              </button>
              <button
                onClick={() => setShowDipoles(prev => !prev)}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg border flex items-center justify-between transition-all ${
                  showDipoles ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>{tI18n('experiments.capacitor_lab.showDipoles')}</span>
                <span>{showDipoles ? '✓' : '✗'}</span>
              </button>
              <button
                onClick={() => setShowVoltmeter(prev => !prev)}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg border flex items-center justify-between transition-all ${
                  showVoltmeter ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>{tI18n('experiments.capacitor_lab.showVoltmeter')}</span>
                <span>{showVoltmeter ? '✓' : '✗'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
