import { Flame, BookmarkCheck, Snowflake, RotateCcw, Gauge } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function ThermodynamicsSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
    const controls = (tI18n('controls', { returnObjects: true }) as any);

  // Thermodynamic State variables
  const [temperature, setTemperature] = useState<number>(300); // Kelvin (T)
  const [volume, setVolume] = useState<number>(5.0); // Liters (V)
  const [particleCount, setParticleCount] = useState<number>(60); // N molecules
  const [activeProcess, setActiveProcess] = useState<'free' | 'isothermal' | 'isobaric' | 'isochoric'>('free');

  // Simulation run state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);
  const [heatingActive, setHeatingActive] = useState<boolean>(false);
  const [coolingActive, setCoolingActive] = useState<boolean>(false);

  // Ideal Gas Law: P = (N * k_B * T) / V  or in scaled units: P = (n * R * T) / V
  // Let's compute scaled Pressure in kPa:
  const moles = particleCount / 60; // 1.0 mol baseline for 60 particles
  const R = 8.314; // J/(mol*K)
  // P (kPa) = (n * R * T) / (V in Liters) * scaling factor
  const calculatedPressure = (moles * 8.314 * temperature) / (volume * 10); // kPa

  // P-V historical trajectory points
  const [pvHistory, setPvHistory] = useState<Array<{ p: number; v: number }>>([
    { p: calculatedPressure, v: volume },
  ]);

  // Particles ref for 60FPS canvas loop
  const particlesRef = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pvCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    const speedScale = Math.sqrt(temperature / 300) * 3;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random()) * speedScale;
      newParticles.push({
        x: 60 + Math.random() * 200,
        y: 40 + Math.random() * 160,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3.5,
      });
    }
    particlesRef.current = newParticles;
  }, [particleCount]);

  // Heating / Cooling effect interval
  useEffect(() => {
    if (!heatingActive && !coolingActive) return;
    const interval = setInterval(() => {
      if (heatingActive) {
        setTemperature((prev) => Math.min(800, prev + 8));
      }
      if (coolingActive) {
        setTemperature((prev) => Math.max(80, prev - 8));
      }
    }, 80);
    return () => clearInterval(interval);
  }, [heatingActive, coolingActive]);

  // Update P-V History
  useEffect(() => {
    setPvHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.p - calculatedPressure) < 0.1 && Math.abs(last.v - volume) < 0.1) {
        return prev;
      }
      const updated = [...prev, { p: calculatedPressure, v: volume }];
      return updated.slice(-60); // keep last 60 points
    });
  }, [calculatedPressure, volume]);

  // 60FPS Canvas Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRunning) {
        // Piston dimensions
        const chamberLeft = 50;
        const chamberTop = 40;
        const chamberHeight = 240;
        // Piston wall X position scaled with volume (from 2L to 10L)
        const chamberWidth = 100 + ((volume - 1) / 9) * 260; // 100px to 360px

        const speedFactor = Math.sqrt(temperature / 300);

        particlesRef.current.forEach((p) => {
          p.x += p.vx * speedFactor * 60 * dt;
          p.y += p.vy * speedFactor * 60 * dt;

          // Chamber Boundary collisions
          if (p.x - p.radius <= chamberLeft) {
            p.x = chamberLeft + p.radius;
            p.vx = Math.abs(p.vx);
          }
          if (p.x + p.radius >= chamberLeft + chamberWidth) {
            p.x = chamberLeft + chamberWidth - p.radius;
            p.vx = -Math.abs(p.vx);
          }
          if (p.y - p.radius <= chamberTop) {
            p.y = chamberTop + p.radius;
            p.vy = Math.abs(p.vy);
          }
          if (p.y + p.radius >= chamberTop + chamberHeight) {
            p.y = chamberTop + chamberHeight - p.radius;
            p.vy = -Math.abs(p.vy);
          }
        });
      }

      drawChamber();
      drawPvDiagram();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, temperature, volume, heatingActive, coolingActive]);

  // Draw Piston Chamber
  const drawChamber = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    const chamberLeft = 50;
    const chamberTop = 40;
    const chamberHeight = 240;
    const chamberWidth = 100 + ((volume - 1) / 9) * 260;

    // Outer Cylinder Walls
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(chamberLeft + 380, chamberTop);
    ctx.lineTo(chamberLeft, chamberTop);
    ctx.lineTo(chamberLeft, chamberTop + chamberHeight);
    ctx.lineTo(chamberLeft + 380, chamberTop + chamberHeight);
    ctx.stroke();

    // Chamber Gas Area Tint depending on Temperature
    const tempRatio = Math.min(1.0, Math.max(0.0, (temperature - 100) / 700));
    ctx.fillStyle = `rgba(${Math.round(56 + tempRatio * 180)}, ${Math.round(189 - tempRatio * 100)}, ${Math.round(248 - tempRatio * 180)}, 0.15)`;
    ctx.fillRect(chamberLeft + 2, chamberTop + 2, chamberWidth - 2, chamberHeight - 4);

    // Render Particles
    particlesRef.current.forEach((p) => {
      // Wind color based on speed / temperature
      const red = Math.min(255, Math.floor(100 + tempRatio * 155));
      const blue = Math.max(50, Math.floor(255 - tempRatio * 200));
      ctx.fillStyle = `rgb(${red}, 150, ${blue})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Movable Piston Head
    const pistonX = chamberLeft + chamberWidth;
    ctx.fillStyle = '#71717a';
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pistonX - 10, chamberTop + 2, 20, chamberHeight - 4, 4);
    ctx.fill();
    ctx.stroke();

    // Piston Rod extending right
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(pistonX + 10, chamberTop + chamberHeight / 2 - 10, 80, 20);

    // Heat Flame / Cold Ice below cylinder
    if (heatingActive) {
      ctx.fillStyle = '#f97316';
      ctx.font = '24px sans-serif';
      ctx.fillText('🔥🔥🔥🔥🔥', chamberLeft + 40, chamberTop + chamberHeight + 35);
    } else if (coolingActive) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '24px sans-serif';
      ctx.fillText('❄️❄️❄️❄️❄️', chamberLeft + 40, chamberTop + chamberHeight + 35);
    }

    // Pressure Gauge Graphic on the cylinder top
    const gaugeX = chamberLeft + 40;
    const gaugeY = chamberTop;

    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gaugeX, gaugeY);
    ctx.lineTo(gaugeX, gaugeY - 20);
    ctx.stroke();

    // Dial
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY - 35, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Needle
    const needleAngle = -Math.PI * 0.75 + Math.min(1.0, calculatedPressure / 50) * Math.PI * 1.5;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gaugeX, gaugeY - 35);
    ctx.lineTo(gaugeX + Math.cos(needleAngle) * 12, gaugeY - 35 + Math.sin(needleAngle) * 12);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${calculatedPressure.toFixed(1)}`, gaugeX, gaugeY - 32);
  };

  // Draw P-V Indicator Diagram
  const drawPvDiagram = () => {
    const canvas = pvCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    const pad = 30;
    // Axes
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('P (kPa)', pad + 40, pad - 8);
    ctx.textAlign = 'center';
    ctx.fillText('V (Liters)', w / 2, h - 8);

    // Grid ticks
    for (let pVal = 10; pVal <= 40; pVal += 10) {
      const y = h - pad - (pVal / 50) * (h - pad * 2);
      ctx.strokeStyle = '#27272a';
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    // Historical P-V trajectory curve
    if (pvHistory.length > 1) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      pvHistory.forEach((pt, idx) => {
        const x = pad + (pt.v / 10) * (w - pad * 2);
        const y = h - pad - (Math.min(50, pt.p) / 50) * (h - pad * 2);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Current State Dot
    const curX = pad + (volume / 10) * (w - pad * 2);
    const curY = h - pad - (Math.min(50, calculatedPressure) / 50) * (h - pad * 2);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  // Reset to standard STP conditions
  const resetSimulation = () => {
    setTemperature(300);
    setVolume(5.0);
    setHeatingActive(false);
    setCoolingActive(false);
    setPvHistory([{ p: 24.9, v: 5.0 }]);
  };

  // Log to Notebook
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'thermodynamics',
      variableName: tI18n('experiments.thermodynamics.varPressure'),
      measuredValue: Number(calculatedPressure.toFixed(2)),
      theoreticalValue: Number(((moles * R * temperature) / (volume * 10)).toFixed(2)),
      unit: 'kPa',
      parameters: {
        'Temperature T': `${temperature} K`,
        'Volume V': `${volume.toFixed(1)} L`,
        'Mole Count n': `${moles.toFixed(2)} mol`,
        'Wind Count N': `${particleCount}`,
        'Ideal Gas Constant R': '8.314 J/(mol·K)',
      },
      equation: 'P · V = n · R · T',
      notes: tI18n('experiments.thermodynamics.notesFormat', { temperature, volume: volume.toFixed(1), calculatedPressure: calculatedPressure.toFixed(2) }),
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="thermodynamics-sim-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation Stage */}
      <div className="lg:col-span-8 space-y-4">
        {/* Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-zinc-100">{tI18n('experiments.thermodynamics.title')}</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{tI18n('experiments.thermodynamics.shortDesc')}</p>
          </div>

          <button
            id="thermo-log-btn"
            onClick={handleLog}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>{logged ? controls.loggedSuccess : controls.logData}</span>
          </button>
        </div>

        {/* Canvases: Chamber (Left) & P-V Diagram (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl p-2 space-y-2">
            <div className="px-2 py-1 text-xs text-zinc-300 font-semibold flex items-center justify-between border-b border-zinc-850">
              <span>{tI18n('experiments.thermodynamics.pistonChamber')}</span>
              <span className="text-[10px] text-zinc-500 font-mono">V = {volume.toFixed(1)} L</span>
            </div>
            <canvas ref={canvasRef} width={450} height={320} className="w-full h-[320px] block rounded-xl" />
          </div>

          <div className="md:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl p-2 space-y-2">
            <div className="px-2 py-1 text-xs text-amber-400 font-semibold flex items-center justify-between border-b border-zinc-850">
              <span>{tI18n('experiments.thermodynamics.pvDiagram')}</span>
              <span className="text-[10px] text-zinc-500 font-mono">P = {calculatedPressure.toFixed(1)} kPa</span>
            </div>
            <canvas ref={pvCanvasRef} width={300} height={320} className="w-full h-[320px] block rounded-xl" />
          </div>
        </div>

        {/* Heat / Cool Interactive Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onMouseDown={() => setHeatingActive(true)}
              onMouseUp={() => setHeatingActive(false)}
              onMouseLeave={() => setHeatingActive(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                heatingActive ? 'bg-orange-500 text-white scale-105 shadow-lg shadow-orange-500/30' : 'bg-zinc-800 hover:bg-zinc-700 text-orange-400'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{tI18n('experiments.thermodynamics.heatPiston')}</span>
            </button>

            <button
              onMouseDown={() => setCoolingActive(true)}
              onMouseUp={() => setCoolingActive(false)}
              onMouseLeave={() => setCoolingActive(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                coolingActive ? 'bg-sky-500 text-white scale-105 shadow-lg shadow-sky-500/30' : 'bg-zinc-800 hover:bg-zinc-700 text-sky-400'
              }`}
            >
              <Snowflake className="w-4 h-4 text-sky-400" />
              <span>{tI18n('experiments.thermodynamics.coolPiston')}</span>
            </button>

            <button
              onClick={resetSimulation}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs transition-colors"
              title={controls.reset}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="font-mono text-xs text-zinc-300">
            {tI18n('experiments.thermodynamics.tempLabel')}: <span className="text-amber-400 font-bold">{temperature} K</span> ({temperature - 273}°C)
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">{tI18n('experiments.thermodynamics.pressure')}</span>
            <span className="text-sm font-bold text-amber-400">{calculatedPressure.toFixed(2)} kPa</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">{tI18n('experiments.thermodynamics.volume')}</span>
            <span className="text-sm font-bold text-sky-400">{volume.toFixed(1)} L</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">{tI18n('experiments.thermodynamics.temperature')}</span>
            <span className="text-sm font-bold text-rose-400">{temperature} K</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">{tI18n('experiments.thermodynamics.particles')}</span>
            <span className="text-sm font-bold text-indigo-400">{particleCount}</span>
          </div>
        </div>
      </div>

      {/* Control Configuration Panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>{tI18n('experiments.thermodynamics.gasParameters')}</span>
          </h3>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.thermodynamics.volume')} (V)</span>
              <span className="font-mono text-sky-400 font-bold">{volume.toFixed(1)} L</span>
            </div>
            <input
              type="range"
              min={1.5}
              max={10.0}
              step={0.1}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Temperature Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.thermodynamics.temperature')} (T)</span>
              <span className="font-mono text-amber-400 font-bold">{temperature} K</span>
            </div>
            <input
              type="range"
              min={100}
              max={700}
              step={10}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Molecule Count Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.thermodynamics.particles')} (N)</span>
              <span className="font-mono text-indigo-400 font-bold">{particleCount}</span>
            </div>
            <input
              type="range"
              min={20}
              max={120}
              step={5}
              value={particleCount}
              onChange={(e) => setParticleCount(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* State Equation Box */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs font-mono">
          <span className="text-zinc-400 block font-sans font-bold">{tI18n('experiments.thermodynamics.idealGasLaw')}</span>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 text-center text-sm font-bold">
            P · V = n · R · T
          </div>
          <div className="text-[11px] text-zinc-400 leading-relaxed">
            P = ({moles.toFixed(2)} × 8.314 × {temperature}) / {volume.toFixed(1)} ={' '}
            <span className="text-emerald-400 font-bold">{calculatedPressure.toFixed(2)} kPa</span>
          </div>
        </div>
      </div>
    </div>
  );
}