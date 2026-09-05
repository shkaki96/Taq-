import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Activity, 
  BookmarkCheck, 
  Flame, 
  Power, 
  Layers, 
  Gauge, 
  Sliders, 
  Info,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface WireResistanceSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

interface MaterialInfo {
  id: string;
  nameKey: string;
  rho: number; // in Ω·cm
  color: string;
  metalGrad: [string, string, string];
}

const MATERIALS: MaterialInfo[] = [
  { id: 'silver', nameKey: 'silver', rho: 0.016, color: '#e2e8f0', metalGrad: ['#f8fafc', '#cbd5e1', '#94a3b8'] },
  { id: 'copper', nameKey: 'copper', rho: 0.017, color: '#f97316', metalGrad: ['#fdba74', '#ea580c', '#9a3412'] },
  { id: 'gold', nameKey: 'gold', rho: 0.024, color: '#eab308', metalGrad: ['#fef08a', '#eab308', '#a16207'] },
  { id: 'aluminum', nameKey: 'aluminum', rho: 0.028, color: '#94a3b8', metalGrad: ['#e2e8f0', '#94a3b8', '#64748b'] },
  { id: 'tungsten', nameKey: 'tungsten', rho: 0.056, color: '#a8a29e', metalGrad: ['#d6d3d1', '#78716c', '#44403c'] },
  { id: 'iron', nameKey: 'iron', rho: 0.100, color: '#64748b', metalGrad: ['#94a3b8', '#475569', '#334155'] },
  { id: 'nichrome', nameKey: 'nichrome', rho: 1.100, color: '#ec4899', metalGrad: ['#f472b6', '#db2777', '#831843'] },
  { id: 'carbon', nameKey: 'carbon', rho: 3.500, color: '#475569', metalGrad: ['#64748b', '#334155', '#0f172a'] },
];

export const WireResistanceSim: React.FC<WireResistanceSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // Core Physical Variables
  const [resistivity, setResistivity] = useState<number>(0.50); // ρ in Ω·cm
  const [length_cm, setLength_cm] = useState<number>(10.0); // L in cm
  const [area_cm2, setArea_cm2] = useState<number>(4.0); // A in cm²
  const [voltage, setVoltage] = useState<number>(6.0); // V in Volts
  const [isCircuitClosed, setIsCircuitClosed] = useState<boolean>(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('custom');

  // Logging Feedback
  const [logged, setLogged] = useState<boolean>(false);

  // Derived Electrical Quantities
  // R = ρ · L / A (in Ohms Ω)
  const resistance = useMemo(() => {
    return (resistivity * length_cm) / Math.max(area_cm2, 0.01);
  }, [resistivity, length_cm, area_cm2]);

  // Current I = V / R (in Amperes A)
  const current = useMemo(() => {
    if (!isCircuitClosed || resistance <= 0.0001) return 0;
    return voltage / resistance;
  }, [voltage, resistance, isCircuitClosed]);

  // Power Dissipated P = I² · R = V · I (in Watts W)
  const power = useMemo(() => {
    if (!isCircuitClosed) return 0;
    return current * voltage;
  }, [current, voltage, isCircuitClosed]);

  // Wire Diameter d = 2 · √(A / π) (in cm)
  const diameter_cm = useMemo(() => {
    return 2 * Math.sqrt(area_cm2 / Math.PI);
  }, [area_cm2]);

  // Canvas Reference & Animation Particles
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const electronsRef = useRef<{ x: number; y: number; vx: number; phase: number }[]>([]);
  const sparksRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);

  // Find active material gradient
  const activeMetal = useMemo(() => {
    const found = MATERIALS.find(m => Math.abs(m.rho - resistivity) < 0.005);
    return found || {
      id: 'custom',
      nameKey: 'resistivity',
      rho: resistivity,
      color: '#f59e0b',
      metalGrad: ['#fef3c7', '#f59e0b', '#78350f'] as [string, string, string],
    };
  }, [resistivity]);

  // Handle Preset Applications
  const handleSelectMaterial = (mat: MaterialInfo) => {
    setResistivity(mat.rho);
    setSelectedMaterial(mat.id);
  };

  const handleApplicationPreset = (presetType: 'powerCable' | 'heater' | 'filament' | 'thinWire') => {
    switch (presetType) {
      case 'powerCable':
        setResistivity(0.028); // Aluminum
        setLength_cm(18.0);
        setArea_cm2(9.0);
        setVoltage(12.0);
        setIsCircuitClosed(true);
        setSelectedMaterial('aluminum');
        break;
      case 'heater':
        setResistivity(1.100); // Nichrome
        setLength_cm(15.0);
        setArea_cm2(2.0);
        setVoltage(10.0);
        setIsCircuitClosed(true);
        setSelectedMaterial('nichrome');
        break;
      case 'filament':
        setResistivity(0.056); // Tungsten
        setLength_cm(6.0);
        setArea_cm2(0.8);
        setVoltage(8.0);
        setIsCircuitClosed(true);
        setSelectedMaterial('tungsten');
        break;
      case 'thinWire':
        setResistivity(0.500);
        setLength_cm(12.0);
        setArea_cm2(1.0);
        setVoltage(5.0);
        setIsCircuitClosed(true);
        setSelectedMaterial('custom');
        break;
    }
  };

  const handleReset = () => {
    setResistivity(0.50);
    setLength_cm(10.0);
    setArea_cm2(4.0);
    setVoltage(6.0);
    setIsCircuitClosed(true);
    setSelectedMaterial('custom');
  };

  // Canvas Animation for 3D Cylinder, Scattering Lattice, and Electron Drift
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Initialize electrons if needed
    if (electronsRef.current.length === 0) {
      const initialElectrons = [];
      for (let i = 0; i < 40; i++) {
        initialElectrons.push({
          x: Math.random(),
          y: Math.random() * 0.8 + 0.1,
          vx: 0,
          phase: Math.random() * Math.PI * 2,
        });
      }
      electronsRef.current = initialElectrons;
    }

    const render = () => {
      ctx.clearRect(0, 0, 600, 320);

      // 1. Draw Circuit Leads and Battery at sides
      const wireLeftX = 110;
      const wireRightX = 110 + (length_cm / 22) * 360;
      const wireCenterY = 160;
      const wireHeight = Math.min(Math.max((area_cm2 / 10) * 110, 24), 130);
      const wireTopY = wireCenterY - wireHeight / 2;
      const wireBottomY = wireCenterY + wireHeight / 2;

      // Circuit lines
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isCircuitClosed ? '#38bdf8' : '#64748b';
      ctx.beginPath();
      // Left terminal wire
      ctx.moveTo(30, 260);
      ctx.lineTo(30, wireCenterY);
      ctx.lineTo(wireLeftX, wireCenterY);

      // Right terminal wire
      ctx.moveTo(wireRightX, wireCenterY);
      ctx.lineTo(560, wireCenterY);
      ctx.lineTo(560, 260);

      // Bottom circuit line through battery & switch
      ctx.moveTo(560, 260);
      ctx.lineTo(370, 260);

      // Switch
      if (isCircuitClosed) {
        ctx.lineTo(330, 260);
      } else {
        ctx.lineTo(350, 240); // Open switch angle
      }
      ctx.moveTo(330, 260);
      ctx.lineTo(260, 260);

      // Battery connection
      ctx.moveTo(220, 260);
      ctx.lineTo(30, 260);
      ctx.stroke();
      ctx.restore();

      // Draw Battery (240, 260)
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(220, 246, 40, 28);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(220, 246, 40, 28);

      // Battery label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${voltage.toFixed(1)}V`, 240, 264);

      // Battery polarity signs
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('+', 210, 264);
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('-', 270, 264);

      // Switch label
      ctx.fillStyle = isCircuitClosed ? '#4ade80' : '#f43f5e';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(isCircuitClosed ? 'SWITCH CLOSED' : 'SWITCH OPEN', 350, 280);
      ctx.restore();

      // 2. Wire Thermal Glow Effect (if power is high)
      if (isCircuitClosed && power > 3) {
        ctx.save();
        const glowRadius = Math.min(power * 2.5, 40);
        const glowAlpha = Math.min((power - 3) / 25, 0.6);
        const glowGrad = ctx.createRadialGradient(
          (wireLeftX + wireRightX) / 2, wireCenterY, wireHeight * 0.4,
          (wireLeftX + wireRightX) / 2, wireCenterY, wireHeight + glowRadius
        );
        glowGrad.addColorStop(0, `rgba(239, 68, 68, ${glowAlpha})`);
        glowGrad.addColorStop(0.5, `rgba(249, 115, 22, ${glowAlpha * 0.5})`);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(wireLeftX - 20, wireTopY - 30, (wireRightX - wireLeftX) + 40, wireHeight + 60);
        ctx.restore();
      }

      // 3. 3D Cylindrical Wire Body
      ctx.save();
      const cylinderGrad = ctx.createLinearGradient(0, wireTopY, 0, wireBottomY);
      
      // Color transition from metal to hot orange/red if power is intense
      if (isCircuitClosed && power > 8) {
        const heatBlend = Math.min((power - 8) / 30, 0.85);
        cylinderGrad.addColorStop(0, '#fef08a');
        cylinderGrad.addColorStop(0.3, heatBlend > 0.5 ? '#ef4444' : activeMetal.metalGrad[1]);
        cylinderGrad.addColorStop(0.7, heatBlend > 0.5 ? '#b91c1c' : activeMetal.metalGrad[2]);
        cylinderGrad.addColorStop(1, '#450a0a');
      } else {
        cylinderGrad.addColorStop(0, activeMetal.metalGrad[0]);
        cylinderGrad.addColorStop(0.3, activeMetal.metalGrad[1]);
        cylinderGrad.addColorStop(0.8, activeMetal.metalGrad[2]);
        cylinderGrad.addColorStop(1, '#0f172a');
      }

      // Main cylinder rectangle
      ctx.fillStyle = cylinderGrad;
      ctx.fillRect(wireLeftX, wireTopY, wireRightX - wireLeftX, wireHeight);

      // Right End-Cap Ellipse (Front Face)
      const capRadiusX = Math.max(wireHeight * 0.18, 6);
      ctx.beginPath();
      ctx.ellipse(wireRightX, wireCenterY, capRadiusX, wireHeight / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = activeMetal.metalGrad[1];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Left End-Cap Arc (Back Face)
      ctx.beginPath();
      ctx.ellipse(wireLeftX, wireCenterY, capRadiusX, wireHeight / 2, 0, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // Outer wire border
      ctx.strokeStyle = isCircuitClosed && power > 12 ? '#fca5a5' : '#cbd5e1';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(wireLeftX, wireTopY);
      ctx.lineTo(wireRightX, wireTopY);
      ctx.moveTo(wireLeftX, wireBottomY);
      ctx.lineTo(wireRightX, wireBottomY);
      ctx.stroke();
      ctx.restore();

      // 4. Impurities / Atomic Scattering Lattice Centers
      ctx.save();
      const numImpurities = Math.min(Math.max(Math.round(resistivity * 35), 4), 100);
      const wireWidth = wireRightX - wireLeftX;

      for (let i = 0; i < numImpurities; i++) {
        // Deterministic pseudo-random distribution based on index
        const pseudoX = ((i * 37 + 13) % 100) / 100;
        const pseudoY = ((i * 59 + 7) % 80 + 10) / 100;

        const ix = wireLeftX + 12 + pseudoX * (wireWidth - 24);
        const iy = wireTopY + pseudoY * wireHeight;

        ctx.beginPath();
        ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // 5. Free Conduction Electrons Drift Animation & Scattering
      if (isCircuitClosed) {
        ctx.save();
        const driftSpeed = Math.min(Math.max(current * 0.0035, 0.0008), 0.035);

        electronsRef.current.forEach((e) => {
          // Move electron from left to right (towards positive terminal)
          e.x += driftSpeed;
          if (e.x > 1.0) {
            e.x = 0;
            e.y = Math.random() * 0.8 + 0.1;
          }

          const ex = wireLeftX + 8 + e.x * (wireWidth - 16);
          const ey = wireTopY + e.y * wireHeight + Math.sin(Date.now() * 0.008 + e.phase) * 2;

          // Electron body
          ctx.beginPath();
          ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Minus '-' sign on electron
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('-', ex, ey - 0.5);
        });
        ctx.restore();
      }

      // 6. Calipers & Dimensions Visuals (Length L on top, Cross Section A on right)
      ctx.save();
      // Length Dimension Line on top
      const dimTopY = wireTopY - 18;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wireLeftX, dimTopY);
      ctx.lineTo(wireRightX, dimTopY);
      // Ticks
      ctx.moveTo(wireLeftX, dimTopY - 4);
      ctx.lineTo(wireLeftX, dimTopY + 4);
      ctx.moveTo(wireRightX, dimTopY - 4);
      ctx.lineTo(wireRightX, dimTopY + 4);
      ctx.stroke();

      // Length Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`L = ${length_cm.toFixed(1)} cm`, (wireLeftX + wireRightX) / 2, dimTopY - 6);

      // Cross Section Area Tag on Right
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`A = ${area_cm2.toFixed(1)} cm²`, wireRightX + 16, wireCenterY - 6);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`d = ${diameter_cm.toFixed(2)} cm`, wireRightX + 16, wireCenterY + 10);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [length_cm, area_cm2, resistivity, voltage, isCircuitClosed, power, current, diameter_cm, activeMetal]);

  // Log Experiment Measurement
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'resistance_in_wire',
        variableName: 'Electrical_Resistance_and_Ohm_Law',
        measuredValue: parseFloat(resistance.toFixed(4)),
        theoreticalValue: parseFloat(((resistivity * length_cm) / area_cm2).toFixed(4)),
        unit: 'Ω',
        parameters: {
          Resistivity_rho: `${resistivity.toFixed(3)} Ω·cm (${selectedMaterial})`,
          Length_L: `${length_cm.toFixed(1)} cm`,
          Cross_Section_A: `${area_cm2.toFixed(1)} cm²`,
          Wire_Diameter_d: `${diameter_cm.toFixed(2)} cm`,
          Applied_Voltage_V: `${voltage.toFixed(1)} V`,
          Circuit_Current_I: `${current.toFixed(3)} A`,
          Power_Dissipated_P: `${power.toFixed(2)} W`,
          Circuit_State: isCircuitClosed ? 'Closed (Active)' : 'Open (Zero Current)',
        },
        equation: `R = (ρ · L) / A = (${resistivity.toFixed(3)} · ${length_cm.toFixed(1)}) / ${area_cm2.toFixed(1)} = ${resistance.toFixed(4)} Ω`,
        timestamp: new Date().toISOString(),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Calculate dynamic typography scale factor for PhET proportional formula visualization
  const rhoScale = Math.max(0.75, Math.min(1.6, 0.8 + (resistivity / 3.5) * 0.8));
  const lScale = Math.max(0.75, Math.min(1.6, 0.7 + (length_cm / 20) * 0.9));
  const aScale = Math.max(0.75, Math.min(1.6, 0.7 + (area_cm2 / 10) * 0.9));
  const rScale = Math.max(0.8, Math.min(2.0, 0.8 + (resistance / 8) * 1.2));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none" id="wire-resistance-root">
      
      {/* 1. Header Bar with Title and Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-sky-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{tI18n('experiments.resistance_in_wire.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-amber-300">
                R = ρ·L / A
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.resistance_in_wire.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Circuit Switch Toggle */}
          <button
            id="wire-circuit-switch-btn"
            onClick={() => setIsCircuitClosed(!isCircuitClosed)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              isCircuitClosed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isCircuitClosed ? 'CIRCUIT ON' : 'CIRCUIT OFF'}</span>
          </button>

          {/* Log Measurement Button */}
          <button
            id="wire-resistance-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              logged
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{logged ? (tI18n('experiments.resistance_in_wire.logged') || 'Logged ✓') : (tI18n('experiments.resistance_in_wire.log') || 'Log')}</span>
          </button>

          {/* Reset Button */}
          <button
            id="wire-resistance-reset-btn"
            onClick={handleReset}
            title={tI18n('experiments.resistance_in_wire.reset')}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Bar: Material Conductor Presets & Application Scenarios */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        {/* Material Selection Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            {tI18n('experiments.resistance_in_wire.materialPresets')}
          </span>
          <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
            {MATERIALS.map((mat) => {
              const isActive = Math.abs(resistivity - mat.rho) < 0.005;
              return (
                <button
                  key={mat.id}
                  onClick={() => handleSelectMaterial(mat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mat.color }} />
                  <span>{tI18n(`experiments.resistance_in_wire.${mat.nameKey}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Application Presets Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium me-1">
            {tI18n('experiments.resistance_in_wire.presets')}:
          </span>
          <button
            onClick={() => handleApplicationPreset('powerCable')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
          >
            ⚡ {tI18n('experiments.resistance_in_wire.presetPowerCable')}
          </button>
          <button
            onClick={() => handleApplicationPreset('heater')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
          >
            🔥 {tI18n('experiments.resistance_in_wire.presetHeater')}
          </button>
          <button
            onClick={() => handleApplicationPreset('filament')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
          >
            💡 {tI18n('experiments.resistance_in_wire.presetFilament')}
          </button>
          <button
            onClick={() => handleApplicationPreset('thinWire')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
          >
            📏 {tI18n('experiments.resistance_in_wire.presetThinWire')}
          </button>
        </div>
      </div>

      {/* 3. Main Stage: 3D Wire Canvas & Control Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: 3D Wire Physics Display & Telemetry */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative min-h-[420px] overflow-hidden shadow-inner">
          
          {/* Top Formula Dynamic Proportional Card (PhET Inspired) */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-around z-10 font-mono shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm font-semibold">{tI18n('experiments.resistance_in_wire.dynamicFormula')}:</span>
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <span className="text-amber-400 transition-all duration-200" style={{ transform: `scale(${rScale})`, display: 'inline-block' }}>
                  R
                </span>
                <span className="text-slate-500">=</span>
                <span className="text-purple-400 transition-all duration-200" style={{ transform: `scale(${rhoScale})`, display: 'inline-block' }}>
                  ρ
                </span>
                <span className="text-slate-500">·</span>
                <div className="flex flex-col items-center leading-none">
                  <span className="text-sky-400 transition-all duration-200 border-b border-slate-600 pb-0.5" style={{ transform: `scale(${lScale})`, display: 'inline-block' }}>
                    L
                  </span>
                  <span className="text-emerald-400 transition-all duration-200 pt-0.5" style={{ transform: `scale(${aScale})`, display: 'inline-block' }}>
                    A
                  </span>
                </div>
              </div>
            </div>

            {/* Total Resistance Digital Badge */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                {tI18n('experiments.resistance_in_wire.resistanceTotal')}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {resistance.toFixed(4)} <span className="text-sm font-bold text-amber-300">Ω</span>
              </span>
            </div>
          </div>

          {/* Interactive 3D Canvas */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={320}
              className="w-full h-auto max-h-[340px] rounded-xl bg-slate-950 border border-slate-900 shadow-inner"
            />
          </div>

          {/* Bottom Instruments Telemetry Bar (Multimeter Readout) */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300">Multimeter Readouts:</span>
            </div>
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.resistance_in_wire.voltage')}:</span>
                <span className="text-xs sm:text-sm font-bold text-amber-400">{voltage.toFixed(1)} V</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.resistance_in_wire.current')}:</span>
                <span className="text-xs sm:text-sm font-bold text-sky-400">{current.toFixed(3)} A</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <span className="text-[11px] text-slate-400">{tI18n('experiments.resistance_in_wire.power')}:</span>
                <span className="text-xs sm:text-sm font-bold text-rose-400">{power.toFixed(2)} W</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <Flame className={`w-3.5 h-3.5 ${power > 8 ? 'text-rose-500 animate-pulse' : power > 2 ? 'text-amber-500' : 'text-slate-500'}`} />
                <span className="text-xs font-bold text-slate-200">
                  {power > 8 ? tI18n('experiments.resistance_in_wire.hot') : power > 2 ? tI18n('experiments.resistance_in_wire.warm') : tI18n('experiments.resistance_in_wire.cool')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Sliders & Circuit Controls */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-amber-400" />
              {tI18n('experiments.resistance_in_wire.title')}
            </span>

            {/* 1. Resistivity Slider (ρ) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-purple-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  {tI18n('experiments.resistance_in_wire.resistivity')} (ρ)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {resistivity.toFixed(3)} Ω·cm
                </span>
              </div>
              <input
                type="range"
                min="0.010"
                max="3.500"
                step="0.005"
                value={resistivity}
                onChange={(e) => setResistivity(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.016 (Silver)</span>
                <span>0.10 (Iron)</span>
                <span>3.50 (Carbon)</span>
              </div>
            </div>

            {/* 2. Wire Length Slider (L) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                  {tI18n('experiments.resistance_in_wire.length')} (L)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {length_cm.toFixed(1)} cm
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="22.0"
                step="0.5"
                value={length_cm}
                onChange={(e) => setLength_cm(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1.0 cm (Short)</span>
                <span>10.0 cm</span>
                <span>22.0 cm (Long)</span>
              </div>
            </div>

            {/* 3. Cross-Sectional Area Slider (A) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  {tI18n('experiments.resistance_in_wire.area')} (A)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {area_cm2.toFixed(1)} cm²
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.2"
                value={area_cm2}
                onChange={(e) => setArea_cm2(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5 cm² (Thin)</span>
                <span>4.0 cm²</span>
                <span>10.0 cm² (Thick)</span>
              </div>
            </div>

            {/* 4. Battery Voltage Slider (V) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  {tI18n('experiments.resistance_in_wire.voltage')} (V)
                </span>
                <span className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {voltage.toFixed(1)} V
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="18.0"
                step="0.5"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="touch-none w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0 V (Off)</span>
                <span>6.0 V</span>
                <span>18.0 V (High)</span>
              </div>
            </div>

          </div>

          {/* Educational Note */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {tI18n('experiments.resistance_in_wire.electronsTip')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
