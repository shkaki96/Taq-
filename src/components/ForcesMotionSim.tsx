import { Activity, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';

import { useTranslation } from 'react-i18next';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

export default function ForcesMotionSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [mass, setMass] = useState<number>(50); // kg
  const [appliedForce, setAppliedForce] = useState<number>(150); // N (-300 to +300)
  const [frictionCoeff, setFrictionCoeff] = useState<number>(0.2); // mu_k
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0); // meters
  const [velocity, setVelocity] = useState<number>(0); // m/s
  const posRef = useRef<number>(0);
  const velRef = useRef<number>(0);

  const g = 9.8;
  const normalForce = mass * g;
  const maxStaticFriction = frictionCoeff * normalForce;

  // Calculate Net Force & Acceleration
  let frictionForce = 0;
  if (Math.abs(velocity) > 0.01) {
    frictionForce = -Math.sign(velocity) * frictionCoeff * normalForce;
  } else {
    if (Math.abs(appliedForce) <= maxStaticFriction) {
      frictionForce = -appliedForce;
    } else {
      frictionForce = -Math.sign(appliedForce) * frictionCoeff * normalForce;
    }
  }

  const netForce = appliedForce + frictionForce;
  const acceleration = Math.abs(netForce) < 0.1 && Math.abs(velocity) < 0.05 ? 0 : netForce / mass;

  // Animation frame loop
  useEffect(() => {
    if (!isPlaying) return;

    let animationId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const v = velRef.current;
      const p = posRef.current;

      // Calculate friction force based on current velocity
      let fFriction = 0;
      if (Math.abs(v) > 0.01) {
        fFriction = -Math.sign(v) * frictionCoeff * normalForce;
      } else {
        if (Math.abs(appliedForce) <= maxStaticFriction) {
          fFriction = -appliedForce;
        } else {
          fFriction = -Math.sign(appliedForce) * frictionCoeff * normalForce;
        }
      }

      const fNet = appliedForce + fFriction;
      const accel = Math.abs(fNet) < 0.1 && Math.abs(v) < 0.05 ? 0 : fNet / mass;

      let nextV = v + accel * dt;
      if (appliedForce === 0 && Math.abs(v) > 0 && Math.sign(v) !== Math.sign(nextV)) {
        nextV = 0; // come to complete stop due to friction
      }

      let nextX = p + nextV * dt;
      if (nextX > 40) nextX = -40;
      if (nextX < -40) nextX = 40;

      velRef.current = nextV;
      posRef.current = nextX;
      setVelocity(nextV);
      setPosition(nextX);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, mass, appliedForce, frictionCoeff, normalForce, maxStaticFriction]);

  const handleReset = () => {
    setIsPlaying(false);
    posRef.current = 0;
    velRef.current = 0;
    setPosition(0);
    setVelocity(0);
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'forces_motion_basics',
        parameters: {
          Mass_kg: mass,
          AppliedForce_N: appliedForce,
          FrictionCoeff_mu: frictionCoeff,
          FrictionForce_N: parseFloat(frictionForce.toFixed(1)),
        },
        measuredValue: parseFloat(acceleration.toFixed(2)),
        theoreticalValue: parseFloat((netForce / mass).toFixed(2)),
        unit: 'm/s²',
        variableName: 'Acceleration_a',
        equation: 'F_net = m · a',
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Activity  className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {tI18n('experiments.forces_motion.title')}
            </h3>
            <p className="text-xs text-slate-400 font-mono">F_net = m · a</p>
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
            <span>{isPlaying ? tI18n('experiments.forces_motion.pause') : tI18n('experiments.forces_motion.play')}</span>
          </button>
          <button
            onClick={handleReset}
            title="Reset"
           className="min-h-[44px] min-w-[44px] p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl">
            <RotateCcw  className="w-4 h-4"/>
          </button>
          <button
            onClick={handleLog}
           className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-all">
            <Activity  className="w-3.5 h-3.5"/>
            <span>{tI18n('experiments.forces_motion.log')}</span>
          </button>
        </div>
      </div>

      {/* Visual Track Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
          {/* Metrics Hud */}
          <div className="grid grid-cols-3 gap-2 z-10">
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">{tI18n('experiments.forces_motion.netForce')}</span>
              <span className="text-sm font-mono font-bold text-amber-300">{netForce.toFixed(1)} N</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">{tI18n('experiments.forces_motion.acceleration')}</span>
              <span className="text-sm font-mono font-bold text-emerald-300">{acceleration.toFixed(2)} m/s²</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">{tI18n('experiments.forces_motion.velocity')}</span>
              <span className="text-sm font-mono font-bold text-sky-300">{velocity.toFixed(2)} m/s</span>
            </div>
          </div>

          {/* Interactive Sliding Object Stage */}
          <div className="relative my-8 h-28 flex items-center justify-center border-b-4 border-slate-700">
            {/* Sliding Crate */}
            <div
              style={{
                transform: `translateX(${position * 6}px)`,
              }}
             className="absolute bottom-0 w-24 h-24 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 border-2 border-amber-500 rounded-xl shadow-2xl flex flex-col items-center justify-center transition-all duration-75">
              <span className="text-xs font-bold text-amber-200 font-mono">{mass} kg</span>
              <span className="text-[10px] text-amber-400">{tI18n('experiments.forces_motion.crate')}</span>

              {/* Applied Force Vector (Orange) */}
              {appliedForce !== 0 && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${
                    appliedForce > 0 ? 'left-full' : 'right-full flex-row-reverse'
                  }`}
                >
                  <div
                    style={{ width: `${Math.min(90, Math.abs(appliedForce) * 0.4)}px` }}
                   className="h-1.5 bg-orange-500 rounded shadow"/>
                  <span className="text-[10px] font-mono font-bold text-orange-400 shrink-0">
                    {Math.abs(appliedForce)} N
                  </span>
                </div>
              )}

              {/* Friction Force Vector (Red) */}
              {frictionForce !== 0 && (
                <div
                  className={`absolute bottom-1 flex items-center gap-1 ${
                    frictionForce > 0 ? 'left-full' : 'right-full flex-row-reverse'
                  }`}
                >
                  <div
                    style={{ width: `${Math.min(60, Math.abs(frictionForce) * 0.3)}px` }}
                   className="h-1 bg-red-500 rounded"/>
                  <span className="text-[9px] font-mono text-red-400 shrink-0">
                    fₖ={Math.abs(frictionForce).toFixed(0)} N
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            {tI18n('experiments.forces_motion.frictionExplanation')}
          </div>
        </div>

        {/* Sliders Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider">
              {tI18n('experiments.forces_motion.simulationInputs')}
            </h4>

            {/* Applied Force Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.forces_motion.appliedForce')}</span>
                <span className="font-mono text-orange-400 font-bold">{appliedForce} N</span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                step="10"
                value={appliedForce}
                onChange={(e) => setAppliedForce(parseInt(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-orange-500"
              />
            </div>

            {/* Mass Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.forces_motion.mass')}</span>
                <span className="font-mono text-amber-400 font-bold">{mass} kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={mass}
                onChange={(e) => setMass(parseInt(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-amber-500"
              />
            </div>

            {/* Friction Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.forces_motion.frictionCoeff')}</span>
                <span className="font-mono text-red-400 font-bold">{frictionCoeff.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={frictionCoeff}
                onChange={(e) => setFrictionCoeff(parseFloat(e.target.value))}
                className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full accent-red-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}