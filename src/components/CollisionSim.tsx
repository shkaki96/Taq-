import { Zap, BookmarkCheck, Pause, Play, RotateCcw, Gauge, Sparkles, Scale, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function CollisionSim({ lang, onLogMeasurement }: Props) {
  const { t } = useTranslation();
  const controls = (t('controls', { returnObjects: true }) as any);

  // Parameters
  const [mass1, setMass1] = useState<number>(1.0); // kg
  const [mass2, setMass2] = useState<number>(2.0); // kg
  const [vel1Init, setVel1Init] = useState<number>(2.0); // m/s
  const [vel2Init, setVel2Init] = useState<number>(-1.0); // m/s
  const [restitution, setRestitution] = useState<number>(1.0); // 1.0 = elastic, 0.0 = inelastic

  // Simulation run state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logged, setLogged] = useState<boolean>(false);
  const [hasCollided, setHasCollided] = useState<boolean>(false);

  // Dynamic simulation variables (for 60fps canvas loop)
  const pos1Ref = useRef<number>(180); // px
  const pos2Ref = useRef<number>(540); // px
  const v1Ref = useRef<number>(vel1Init);
  const v2Ref = useRef<number>(vel2Init);
  const animFrameRef = useRef<number | null>(null);

  // Live telemetry metrics
  const [liveV1, setLiveV1] = useState<number>(vel1Init);
  const [liveV2, setLiveV2] = useState<number>(vel2Init);

  // Theoretical 1D Collision formulas:
  // v1' = (m1 - e*m2)*v1 + (1+e)*m2*v2 / (m1 + m2)
  // v2' = (m2 - e*m1)*v2 + (1+e)*m1*v1 / (m1 + m2)
  const m1 = mass1;
  const m2 = mass2;
  const u1 = vel1Init;
  const u2 = vel2Init;
  const e = restitution;

  const theoreticalV1Final = ((m1 - e * m2) * u1 + (1 + e) * m2 * u2) / (m1 + m2);
  const theoreticalV2Final = ((m2 - e * m1) * u2 + (1 + e) * m1 * u1) / (m1 + m2);

  const initialMomentum = m1 * u1 + m2 * u2;
  const finalMomentum = m1 * theoreticalV1Final + m2 * theoreticalV2Final;

  const initialKE = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
  const finalKE = 0.5 * m1 * theoreticalV1Final * theoreticalV1Final + 0.5 * m2 * theoreticalV2Final * theoreticalV2Final;
  const keLost = Math.max(0, initialKE - finalKE);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset to initial positions
  const resetSimulation = () => {
    setIsRunning(false);
    setHasCollided(false);
    pos1Ref.current = 180;
    pos2Ref.current = 540;
    v1Ref.current = vel1Init;
    v2Ref.current = vel2Init;
    setLiveV1(vel1Init);
    setLiveV2(vel2Init);
  };

  useEffect(() => {
    resetSimulation();
  }, [mass1, mass2, vel1Init, vel2Init, restitution]);

  // Main 60FPS physics animation loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (isRunning) {
        let p1 = pos1Ref.current;
        let p2 = pos2Ref.current;
        let v1 = v1Ref.current;
        let v2 = v2Ref.current;

        // Visual scale: 100 pixels = 1 meter
        const pScale = 90;
        p1 += v1 * pScale * dt;
        p2 += v2 * pScale * dt;

        const cart1Width = Math.max(40, Math.min(80, 35 + mass1 * 15));
        const cart2Width = Math.max(40, Math.min(80, 35 + mass2 * 15));

        // Check Collision between cart 1 and cart 2
        if (p1 + cart1Width / 2 >= p2 - cart2Width / 2 && v1 > v2) {
          // Trigger Collision event
          const newV1 = ((mass1 - restitution * mass2) * v1 + (1 + restitution) * mass2 * v2) / (mass1 + mass2);
          const newV2 = ((mass2 - restitution * mass1) * v2 + (1 + restitution) * mass1 * v1) / (mass1 + mass2);

          v1 = newV1;
          v2 = newV2;
          setHasCollided(true);

          // Prevent overlap clipping
          const overlap = p1 + cart1Width / 2 - (p2 - cart2Width / 2);
          p1 -= overlap / 2;
          p2 += overlap / 2;
        }

        // Bumper walls
        if (p1 - cart1Width / 2 <= 60 && v1 < 0) {
          v1 = -v1;
          p1 = 60 + cart1Width / 2;
        }
        if (p2 + cart2Width / 2 >= 700 && v2 > 0) {
          v2 = -v2;
          p2 = 700 - cart2Width / 2;
        }

        pos1Ref.current = p1;
        pos2Ref.current = p2;
        v1Ref.current = v1;
        v2Ref.current = v2;
        setLiveV1(v1);
        setLiveV2(v2);
      }

      drawCanvas();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, mass1, mass2, restitution]);

  // Draw Air Track & Gliders on Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    const trackY = 220;
    const trackLeft = 50;
    const trackRight = 710;

    // Air Track Extrusion
    ctx.fillStyle = '#27272a';
    ctx.fillRect(trackLeft, trackY, trackRight - trackLeft, 14);

    // Track bumper ends
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(trackLeft - 10, trackY - 30, 10, 44);
    ctx.fillRect(trackRight, trackY - 30, 10, 44);

    // Air Holes along track
    ctx.fillStyle = '#71717a';
    for (let x = trackLeft + 15; x < trackRight - 10; x += 25) {
      ctx.beginPath();
      ctx.arc(x, trackY + 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ruler markings
    ctx.strokeStyle = '#52525b';
    ctx.fillStyle = '#71717a';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    for (let x = trackLeft + 20; x < trackRight; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, trackY + 14);
      ctx.lineTo(x, trackY + 22);
      ctx.stroke();
      const meterMark = ((x - trackLeft) / 90).toFixed(1);
      ctx.fillText(`${meterMark}m`, x, trackY + 32);
    }

    // Photogates
    const gate1X = 260;
    const gate2X = 480;

    const drawGate = (gx: number, label: string) => {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(gx - 4, trackY - 55, 8, 55);
      ctx.fillRect(gx - 12, trackY - 55, 24, 6);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(gx, trackY - 30, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(label, gx, trackY - 60);
    };

    drawGate(gate1X, 'GATE A');
    drawGate(gate2X, 'GATE B');

    // Cart 1 (Blue Glider)
    const cart1W = Math.max(40, Math.min(80, 35 + mass1 * 15));
    const cart1H = 34;
    const p1 = pos1Ref.current;

    const grad1 = ctx.createLinearGradient(p1 - cart1W / 2, trackY - cart1H, p1 + cart1W / 2, trackY);
    grad1.addColorStop(0, '#38bdf8');
    grad1.addColorStop(1, '#0284c7');

    ctx.fillStyle = grad1;
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(p1 - cart1W / 2, trackY - cart1H, cart1W, cart1H, [6, 6, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Bumper spring on Cart 1
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1 + cart1W / 2, trackY - cart1H / 2);
    ctx.lineTo(p1 + cart1W / 2 + 6, trackY - cart1H / 2);
    ctx.stroke();

    // Label on Cart 1
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`m₁=${mass1}kg`, p1, trackY - cart1H / 2 + 3);

    // Cart 1 Velocity Vector Arrow
    if (Math.abs(liveV1) > 0.05) {
      const vLen = liveV1 * 25;
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1, trackY - cart1H - 10);
      ctx.lineTo(p1 + vLen, trackY - cart1H - 10);
      ctx.stroke();
      const dir = vLen > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(p1 + vLen - dir * 5, trackY - cart1H - 14);
      ctx.lineTo(p1 + vLen, trackY - cart1H - 10);
      ctx.lineTo(p1 + vLen - dir * 5, trackY - cart1H - 6);
      ctx.fill();

      ctx.fillText(`v₁ = ${liveV1.toFixed(2)}m/s`, p1 + vLen / 2, trackY - cart1H - 16);
    }

    // Cart 2 (Rose Glider)
    const cart2W = Math.max(40, Math.min(80, 35 + mass2 * 15));
    const cart2H = 34;
    const p2 = pos2Ref.current;

    const grad2 = ctx.createLinearGradient(p2 - cart2W / 2, trackY - cart2H, p2 + cart2W / 2, trackY);
    grad2.addColorStop(0, '#fb7185');
    grad2.addColorStop(1, '#e11d48');

    ctx.fillStyle = grad2;
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(p2 - cart2W / 2, trackY - cart2H, cart2W, cart2H, [6, 6, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Bumper on Cart 2
    ctx.strokeStyle = '#ffe4e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p2 - cart2W / 2, trackY - cart2H / 2);
    ctx.lineTo(p2 - cart2W / 2 - 6, trackY - cart2H / 2);
    ctx.stroke();

    // Label on Cart 2
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`m₂=${mass2}kg`, p2, trackY - cart2H / 2 + 3);

    // Cart 2 Velocity Vector
    if (Math.abs(liveV2) > 0.05) {
      const vLen = liveV2 * 25;
      ctx.strokeStyle = '#fb7185';
      ctx.fillStyle = '#fb7185';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p2, trackY - cart2H - 10);
      ctx.lineTo(p2 + vLen, trackY - cart2H - 10);
      ctx.stroke();
      const dir = vLen > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(p2 + vLen - dir * 5, trackY - cart2H - 14);
      ctx.lineTo(p2 + vLen, trackY - cart2H - 10);
      ctx.lineTo(p2 + vLen - dir * 5, trackY - cart2H - 6);
      ctx.fill();

      ctx.fillText(`v₂ = ${liveV2.toFixed(2)}m/s`, p2 + vLen / 2, trackY - cart2H - 16);
    }
  };

  // Log to Notebook
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'collision',
      variableName: t('experiments.collision.varMomentum'),
      measuredValue: Number((m1 * liveV1 + m2 * liveV2).toFixed(3)),
      theoreticalValue: Number(initialMomentum.toFixed(3)),
      unit: 'kg·m/s',
      parameters: {
        'Mass 1': `${mass1} kg`,
        'Mass 2': `${mass2} kg`,
        'Initial v1': `${vel1Init} m/s`,
        'Initial v2': `${vel2Init} m/s`,
        Restitution: `${restitution} (${restitution === 1 ? 'Elastic' : restitution === 0 ? 'Inelastic' : 'Partially Elastic'})`,
        'Final v1': `${theoreticalV1Final.toFixed(2)} m/s`,
        'Final v2': `${theoreticalV2Final.toFixed(2)} m/s`,
      },
      equation: 'm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂',
      notes: t('experiments.collision.noteText', { eVal: restitution, initP: initialMomentum.toFixed(2), keL: keLost.toFixed(2) }),
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="collision-sim-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation Stage */}
      <div className="lg:col-span-8 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {/* Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Zap  className="w-4 h-4"/>
              </span>
              <h2 className="text-base font-bold text-zinc-100">{t('experiments.collision.title')}</h2>
            </div>
            <p className="text-sm text-zinc-400 mt-0.5">{t('experiments.collision.shortDesc')}</p>
          </div>

          <button className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20">
            <BookmarkCheck  className="w-3.5 h-3.5"/>
            <span>{logged ? controls.loggedSuccess : controls.logData}</span>
          </button>
        </div>

        {/* Interactive Canvas */}
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} width={760} height={360}  className="w-full h-[360px] block"/>

          {/* Collided Alert */}
          {hasCollided && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-pulse">
              💥 {t('experiments.collision.collisionOccurred')}
            </div>
          )}
        </div>

        {/* Live Playback Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center gap-2">
            <button className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              {isRunning ? <Pause  className="w-3.5 h-3.5"/> : <Play  className="w-3.5 h-3.5"/>}
              <span>{isRunning ? controls.pause : t('experiments.collision.launchCarts')}</span>
            </button>

            <button className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs transition-colors">
              <RotateCcw  className="w-4 h-4"/>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg border transition-all ${
                restitution === 1.0 ? 'bg-sky-500/20 border-sky-500 text-sky-200 font-bold' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              e = 1.0 ({t('experiments.collision.elasticShort')})
            </button>
            <button className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg border transition-all ${
                restitution === 0.0 ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-bold' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              e = 0.0 ({t('experiments.collision.inelasticShort')})
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono">
            <span className="text-[10px] text-zinc-400 block">{t('experiments.collision.totalMomentumBefore')}</span>
            <span className="text-sm font-bold text-sky-400">{initialMomentum.toFixed(2)} kg·m/s</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono">
            <span className="text-[10px] text-zinc-400 block">{t('experiments.collision.totalMomentumAfter')}</span>
            <span className="text-sm font-bold text-emerald-400">
              {(mass1 * liveV1 + mass2 * liveV2).toFixed(2)} kg·m/s
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono">
            <span className="text-[10px] text-zinc-400 block">{t('experiments.collision.keInitial')}</span>
            <span className="text-sm font-bold text-indigo-400">{initialKE.toFixed(2)} J</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono">
            <span className="text-[10px] text-zinc-400 block">{t('experiments.collision.keLost')}</span>
            <span className="text-sm font-bold text-rose-400">{keLost.toFixed(2)} J</span>
          </div>
        </div>
      </div>

      {/* Control Configuration Panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge  className="w-3.5 h-3.5 text-rose-400"/>
            <span>{t('experiments.collision.cartsConfig')}</span>
          </h3>

          {/* Cart 1 Config */}
          <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-900/40 space-y-2.5">
            <div className="text-xs font-bold text-sky-400 flex justify-between">
              <span>{t('experiments.collision.cart1')} (Blue)</span>
              <span>v1={vel1Init.toFixed(1)} m/s</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('experiments.collision.mass1')}</span>
                <span className="font-mono text-sky-300 font-bold">{mass1.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.5}
                value={mass1}
                onChange={(e) => setMass1(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-zinc-800 accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('experiments.collision.vel1')}</span>
                <span className="font-mono text-sky-300 font-bold">{vel1Init.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min={-3.0}
                max={4.0}
                step={0.5}
                value={vel1Init}
                onChange={(e) => setVel1Init(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-zinc-800 accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Cart 2 Config */}
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2.5">
            <div className="text-xs font-bold text-rose-400 flex justify-between">
              <span>{t('experiments.collision.cart2')} (Red)</span>
              <span>v2={vel2Init.toFixed(1)} m/s</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('experiments.collision.mass2')}</span>
                <span className="font-mono text-rose-300 font-bold">{mass2.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.5}
                value={mass2}
                onChange={(e) => setMass2(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-zinc-800 accent-rose-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('experiments.collision.vel2')}</span>
                <span className="font-mono text-rose-300 font-bold">{vel2Init.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min={-4.0}
                max={3.0}
                step={0.5}
                value={vel2Init}
                onChange={(e) => setVel2Init(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-zinc-800 accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Restitution Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t('experiments.collision.elasticity')}</span>
              <span className="font-mono text-indigo-400 font-bold">{restitution.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={restitution}
              onChange={(e) => setRestitution(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Theoretical Result Box */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs font-mono">
          <span className="text-zinc-400 block font-sans font-bold">{t('experiments.collision.calculatedFinalVel')}</span>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex justify-between text-sky-300">
              <span>v₁' (Final Cart 1):</span>
              <span className="font-bold">{theoreticalV1Final.toFixed(2)} m/s</span>
            </div>
            <div className="flex justify-between text-rose-300">
              <span>v₂' (Final Cart 2):</span>
              <span className="font-bold">{theoreticalV2Final.toFixed(2)} m/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}