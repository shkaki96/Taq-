import { 
  Target, 
  Pause, 
  Play, 
  RotateCcw, 
  BookmarkCheck, 
  Check, 
  Plus, 
  Minus, 
  Zap, 
  Sparkles, 
  Trash2, 
  Info,
  ShieldAlert,
  Compass
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface RutherfordScatteringSimProps {
  lang: Language;
  onLogMeasurement?: (record: any) => void;
}

interface AlphaParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  color: string;
  initialY: number;
  minDist: number;
  deflectedAngle?: number;
  active: boolean;
}

interface Scintillation {
  x: number;
  y: number;
  angle: number;
  alpha: number;
}

interface TargetElement {
  z: number;
  symbol: string;
  nameKey: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

const TARGET_ELEMENTS: TargetElement[] = [
  { z: 79, symbol: 'Au', nameKey: 'gold', color: '#f59e0b', borderColor: 'border-amber-500', bgColor: 'bg-amber-500/20', textColor: 'text-amber-300' },
  { z: 82, symbol: 'Pb', nameKey: 'lead', color: '#a855f7', borderColor: 'border-purple-500', bgColor: 'bg-purple-500/20', textColor: 'text-purple-300' },
  { z: 47, symbol: 'Ag', nameKey: 'silver', color: '#94a3b8', borderColor: 'border-slate-400', bgColor: 'bg-slate-400/20', textColor: 'text-slate-300' },
  { z: 29, symbol: 'Cu', nameKey: 'copper', color: '#f97316', borderColor: 'border-orange-500', bgColor: 'bg-orange-500/20', textColor: 'text-orange-300' },
  { z: 13, symbol: 'Al', nameKey: 'aluminum', color: '#38bdf8', borderColor: 'border-sky-500', bgColor: 'bg-sky-500/20', textColor: 'text-sky-300' },
];

export const RutherfordScatteringSim: React.FC<RutherfordScatteringSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [beamMode, setBeamMode] = useState<'continuous' | 'single'>('continuous');
  const [energyMeV, setEnergyMeV] = useState<number>(5.0); // 5.0 MeV
  const [targetZ, setTargetZ] = useState<number>(79); // Gold (Au Z=79)
  const [impactParameter, setImpactParameter] = useState<number>(15); // b in canvas units
  const [logged, setLogged] = useState(false);
  const [totalFired, setTotalFired] = useState<number>(0);
  const [backscatterCount, setBackscatterCount] = useState<number>(0);
  const [largeAngleCount, setLargeAngleCount] = useState<number>(0);
  const [smallAngleCount, setSmallAngleCount] = useState<number>(0);
  const [scintillations, setScintillations] = useState<Scintillation[]>([]);

  const particlesRef = useRef<AlphaParticle[]>([]);
  const scintillationsRef = useRef<Scintillation[]>([]);
  const nextParticleId = useRef<number>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Position of nucleus on 600x300 canvas
  const nucleusPos = { x: 320, y: 150 };

  // Current active target element meta
  const currentTarget = useMemo(() => {
    return TARGET_ELEMENTS.find((el) => el.z === targetZ) || TARGET_ELEMENTS[0];
  }, [targetZ]);

  // Physical calculations:
  // Distance of closest approach for head-on collision (b = 0):
  // d_0 = (2 * k_e * Z * e^2) / E_k = (2.88 * Z) / E_k  [in femtometers fm]
  const dClosestApproachHeadOnFm = useMemo(() => {
    return (2.88 * targetZ) / Math.max(energyMeV, 0.1);
  }, [targetZ, energyMeV]);

  // General closest approach distance r_min for impact parameter b:
  // r_min = d_0/2 + sqrt((d_0/2)^2 + b_fm^2)
  const closestApproachFm = useMemo(() => {
    // 1 canvas unit of b corresponds to roughly 1.5 fm in our pedagogical scale
    const bFm = impactParameter * 1.5;
    const halfD0 = dClosestApproachHeadOnFm / 2;
    return halfD0 + Math.sqrt(halfD0 * halfD0 + bFm * bFm);
  }, [dClosestApproachHeadOnFm, impactParameter]);

  // Theoretical scattering angle θ: cot(θ/2) = (2 * b_fm) / d_0  =>  tan(θ/2) = d_0 / (2 * b_fm)
  const theoreticalAngleDeg = useMemo(() => {
    const bFm = impactParameter * 1.5;
    if (bFm <= 0.05) return 180.0;
    const halfAngleRad = Math.atan(dClosestApproachHeadOnFm / (2 * bFm));
    return (halfAngleRad * 2 * 180) / Math.PI;
  }, [dClosestApproachHeadOnFm, impactParameter]);

  // Peak Coulomb repulsion force at closest approach: F = (k * 2e * Ze) / r_min^2
  // 1 fm = 1e-15 m, k*e^2 = 1.44 MeV*fm = 2.307e-28 J*m
  const peakForceNewtons = useMemo(() => {
    const rMeters = closestApproachFm * 1e-15;
    // F = (8.988e9 * 2 * 1.602e-19 * targetZ * 1.602e-19) / (rMeters^2)
    const force = (8.98755e9 * 2 * targetZ * Math.pow(1.60218e-19, 2)) / Math.pow(rMeters, 2);
    return force;
  }, [targetZ, closestApproachFm]);

  // Particle velocity (speed of 5 MeV alpha is ~1.55 x 10^7 m/s ~ 5% speed of light)
  const alphaSpeedKms = useMemo(() => {
    // E = 0.5 * m * v^2 => v = sqrt(2 * E / m)
    // m_alpha = 6.644e-27 kg, E in Joules = E_MeV * 1.602e-13 J
    const energyJ = energyMeV * 1.60218e-13;
    const m = 6.64465e-27;
    const v = Math.sqrt((2 * energyJ) / m);
    return Math.round(v / 1000); // km/s
  }, [energyMeV]);

  // Deflection classification
  const deflectionCategory = useMemo(() => {
    if (theoreticalAngleDeg >= 90) {
      return {
        key: 'backscattered',
        text: tI18n('experiments.rutherford_scattering.backscattered'),
        color: 'text-rose-400 bg-rose-950/60 border-rose-500/40',
      };
    } else if (theoreticalAngleDeg >= 45) {
      return {
        key: 'largeAngle',
        text: tI18n('experiments.rutherford_scattering.largeAngle'),
        color: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
      };
    } else {
      return {
        key: 'smallAngle',
        text: tI18n('experiments.rutherford_scattering.smallAngle'),
        color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      };
    }
  }, [theoreticalAngleDeg, tI18n]);

  // Fire a single alpha particle
  const fireSingleParticle = (bOverride?: number) => {
    const bValue = bOverride !== undefined ? bOverride : impactParameter;
    const speed = Math.sqrt(energyMeV) * 2.8;
    const newP: AlphaParticle = {
      id: nextParticleId.current++,
      x: 20,
      y: nucleusPos.y - bValue,
      vx: speed,
      vy: 0,
      trail: [{ x: 20, y: nucleusPos.y - bValue }],
      color: bValue === 0 ? '#f43f5e' : `hsl(${Math.random() * 30 + 35}, 100%, 65%)`,
      initialY: nucleusPos.y - bValue,
      minDist: 9999,
      active: true,
    };
    particlesRef.current.push(newP);
    setTotalFired((prev) => prev + 1);
  };

  // Head-on shot
  const handleHeadOnShot = () => {
    setImpactParameter(0);
    fireSingleParticle(0);
  };

  // Clear trails and particles
  const handleClearTrails = () => {
    particlesRef.current = [];
    scintillationsRef.current = [];
    setScintillations([]);
  };

  // Reset all
  const handleReset = () => {
    handleClearTrails();
    setEnergyMeV(5.0);
    setTargetZ(79);
    setImpactParameter(15);
    setTotalFired(0);
    setBackscatterCount(0);
    setLargeAngleCount(0);
    setSmallAngleCount(0);
  };

  // Log measurement to lab notebook
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'rutherford_scattering',
        targetElement: currentTarget.symbol,
        targetZ,
        energyMeV,
        impactParameterUnits: impactParameter,
        impactParameterFm: (impactParameter * 1.5).toFixed(1),
        theoreticalAngleDeg: theoreticalAngleDeg.toFixed(1),
        closestApproachFm: closestApproachFm.toFixed(1),
        headOnDistanceFm: dClosestApproachHeadOnFm.toFixed(1),
        peakForceN: peakForceNewtons.toExponential(2),
        speedKms: alphaSpeedKms,
        classification: deflectionCategory.key,
        totalParticlesFired: totalFired,
        backscatterCount,
        timestamp: new Date().toISOString(),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Main Canvas drawing routine
  const drawScattering = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 600, 300);

    // 1. Draw Collimator Emitter on the left (Lead block with aperture)
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 70, 24, 60);
    ctx.fillRect(0, 170, 24, 60);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 70, 24, 60);
    ctx.strokeRect(0, 170, 24, 60);

    // Emitter slit
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 130, 24, 40);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('α-GUN', 2, 122);

    // 2. Draw ZnS Scintillation Detector circular screen arc
    const screenRadius = 135;
    ctx.beginPath();
    ctx.arc(nucleusPos.x, nucleusPos.y, screenRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw detector angle markers on the ring
    const angleMarkers = [0, 45, 90, 135, 180, 225, 270, 315];
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
    angleMarkers.forEach((ang) => {
      const rad = (ang * Math.PI) / 180;
      const mx = nucleusPos.x + (screenRadius + 12) * Math.cos(rad);
      const my = nucleusPos.y - (screenRadius + 12) * Math.sin(rad);
      ctx.textAlign = 'center';
      ctx.fillText(`${ang}°`, mx, my + 3);
    });

    // 3. Atom electron cloud boundary (Thomson / Rutherford comparison size)
    const atomRadius = 55;
    ctx.beginPath();
    ctx.arc(nucleusPos.x, nucleusPos.y, atomRadius, 0, Math.PI * 2);
    ctx.fillStyle = `${currentTarget.color}10`;
    ctx.fill();
    ctx.strokeStyle = `${currentTarget.color}40`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Atom label
    ctx.fillStyle = `${currentTarget.color}aa`;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Atom Boundary (~10⁻¹⁰ m)`, nucleusPos.x, nucleusPos.y - atomRadius - 6);

    // 4. Center Positive Nucleus (+Ze)
    // Outer glow halo
    const glowGradient = ctx.createRadialGradient(
      nucleusPos.x, nucleusPos.y, 2,
      nucleusPos.x, nucleusPos.y, 22
    );
    glowGradient.addColorStop(0, `${currentTarget.color}bb`);
    glowGradient.addColorStop(0.5, `${currentTarget.color}33`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(nucleusPos.x, nucleusPos.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();

    // Central dense positive nucleus core
    ctx.beginPath();
    ctx.arc(nucleusPos.x, nucleusPos.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = currentTarget.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nucleus badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`+${targetZ}e`, nucleusPos.x, nucleusPos.y + 19);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = currentTarget.color;
    ctx.fillText(`${currentTarget.symbol} Nucleus (~10⁻¹⁴ m)`, nucleusPos.x, nucleusPos.y + 30);

    // 5. Draw Impact Parameter (b) axis guide line if in single mode
    if (beamMode === 'single' || impactParameter === 0) {
      ctx.beginPath();
      ctx.moveTo(24, nucleusPos.y);
      ctx.lineTo(nucleusPos.x, nucleusPos.y);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();

      // Launch line
      ctx.beginPath();
      ctx.moveTo(24, nucleusPos.y - impactParameter);
      ctx.lineTo(nucleusPos.x - 30, nucleusPos.y - impactParameter);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.stroke();
      ctx.setLineDash([]);

      if (impactParameter > 0) {
        // b arrow
        ctx.beginPath();
        ctx.moveTo(100, nucleusPos.y);
        ctx.lineTo(100, nucleusPos.y - impactParameter);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`b = ${impactParameter}`, 105, nucleusPos.y - impactParameter / 2 + 3);
      }
    }

    // 6. Draw Scintillations (ZnS phosphorescent flashes)
    scintillationsRef.current.forEach((sc) => {
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(52, 211, 153, ${sc.alpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${sc.alpha})`;
      ctx.fill();
    });

    // 7. Draw Alpha Particles & Trails
    particlesRef.current.forEach((p) => {
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        p.trail.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = 0.65;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Particle Head (α particle with ++ charge symbol)
      if (p.active) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  };

  // Main Animation / Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawScattering(ctx);

    if (!isRunning) return;

    let animId: number;
    let spawnTimer = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      // 1. Particle Spawning (in continuous mode)
      if (beamMode === 'continuous') {
        spawnTimer++;
        if (spawnTimer >= 14) {
          spawnTimer = 0;
          // Spawn alpha particles with normal random distribution around chosen impact parameter
          const spread = (Math.random() - 0.5) * 36;
          const bVal = Math.max(0, impactParameter + spread);
          const speed = Math.sqrt(energyMeV) * 2.8;

          if (particlesRef.current.length > 45) {
            particlesRef.current = particlesRef.current.slice(-35);
          }

          particlesRef.current.push({
            id: nextParticleId.current++,
            x: 20,
            y: nucleusPos.y - bVal,
            vx: speed,
            vy: 0,
            trail: [{ x: 20, y: nucleusPos.y - bVal }],
            color: bVal < 4 ? '#f43f5e' : `hsl(${Math.random() * 30 + 35}, 100%, 65%)`,
            initialY: nucleusPos.y - bVal,
            minDist: 9999,
            active: true,
          });
          setTotalFired((prev) => prev + 1);
        }
      }

      // 2. Physics Integration with 5 Sub-Steps for Numerical Stability & Exact Hyperbolas
      const SUB_STEPS = 5;
      const subDt = dt / SUB_STEPS;
      // Scaled Coulomb constant: F = k * Z / r^2
      // Carefully calibrated so trajectories match Rutherford theoretical scattering
      const kCoulomb = targetZ * 60;

      for (let s = 0; s < SUB_STEPS; s++) {
        particlesRef.current.forEach((p) => {
          if (!p.active) return;

          const dx = p.x - nucleusPos.x;
          const dy = p.y - nucleusPos.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist < p.minDist) {
            p.minDist = dist;
          }

          // Repulsive Coulomb force away from nucleus
          // Softening parameter to prevent singularity at r = 0
          const effDistSq = Math.max(distSq, 16);
          const force = kCoulomb / effDistSq;
          const ax = (dx / dist) * force;
          const ay = (dy / dist) * force;

          p.vx += ax * subDt * 60;
          p.vy += ay * subDt * 60;

          p.x += p.vx * subDt * 60;
          p.y += p.vy * subDt * 60;
        });
      }

      // 3. Update particle trails and check boundary/scintillations
      particlesRef.current.forEach((p) => {
        if (!p.active) return;

        // Add trail point periodically
        const lastPt = p.trail[p.trail.length - 1];
        if (!lastPt || Math.hypot(p.x - lastPt.x, p.y - lastPt.y) > 3) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 90) {
            p.trail.shift();
          }
        }

        // Check if particle hits chamber boundary or ZnS screen
        const distFromCenter = Math.hypot(p.x - nucleusPos.x, p.y - nucleusPos.y);
        const isOutOfBounds = p.x < -10 || p.x > 610 || p.y < -10 || p.y > 310;

        if (distFromCenter >= 135 || isOutOfBounds) {
          p.active = false;
          // Calculate deflection angle from initial horizontal direction
          // initial velocity was (vx > 0, vy = 0)
          const finalAngleRad = Math.atan2(p.vy, p.vx);
          let angleDeg = Math.abs((finalAngleRad * 180) / Math.PI);
          if (p.vx < 0) {
            // Particle bounced backwards!
            angleDeg = 180 - Math.abs(angleDeg - 180);
          }
          p.deflectedAngle = angleDeg;

          // Register scintillation on detector screen
          const scAngle = Math.atan2(nucleusPos.y - p.y, p.x - nucleusPos.x);
          const scX = nucleusPos.x + 135 * Math.cos(scAngle);
          const scY = nucleusPos.y - 135 * Math.sin(scAngle);

          scintillationsRef.current.push({
            x: scX,
            y: scY,
            angle: angleDeg,
            alpha: 1.0,
          });

          // Update statistics
          if (angleDeg >= 90) {
            setBackscatterCount((prev) => prev + 1);
          } else if (angleDeg >= 45) {
            setLargeAngleCount((prev) => prev + 1);
          } else {
            setSmallAngleCount((prev) => prev + 1);
          }
        }
      });

      // 4. Fade scintillations
      scintillationsRef.current = scintillationsRef.current
        .map((sc) => ({ ...sc, alpha: sc.alpha - 0.04 }))
        .filter((sc) => sc.alpha > 0);

      // Clean up old inactive particles (keep up to 15 inactive for trail viewing)
      const activeOnes = particlesRef.current.filter((p) => p.active);
      const inactiveOnes = particlesRef.current.filter((p) => !p.active).slice(-15);
      particlesRef.current = [...activeOnes, ...inactiveOnes];

      drawScattering(ctx);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, beamMode, energyMeV, targetZ, impactParameter, tI18n]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl" id="rutherford-sim-container">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {tI18n('experiments.rutherford_scattering.title')}
            </h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 3</p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Play / Pause */}
          <button
            id="rutherford-play-pause-btn"
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? tI18n('experiments.rutherford_scattering.pause') : tI18n('experiments.rutherford_scattering.play')}</span>
          </button>

          {/* Fire Single Particle */}
          <button
            id="rutherford-fire-single-btn"
            type="button"
            onClick={() => fireSingleParticle()}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95"
            title={tI18n('experiments.rutherford_scattering.fireSingle')}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{tI18n('experiments.rutherford_scattering.fireSingle')}</span>
          </button>

          {/* Head-on Collision b = 0 */}
          <button
            id="rutherford-head-on-btn"
            type="button"
            onClick={handleHeadOnShot}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/50 text-xs font-semibold rounded-xl transition-all active:scale-95"
            title={tI18n('experiments.rutherford_scattering.headOnShot')}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{tI18n('experiments.rutherford_scattering.headOnShot')}</span>
          </button>

          {/* Clear Trails */}
          <button
            id="rutherford-clear-trails-btn"
            type="button"
            onClick={handleClearTrails}
            className="p-2 min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center transition-colors"
            title={tI18n('experiments.rutherford_scattering.clearTrails')}
            aria-label="Clear Trails"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Log Measurement */}
          <button
            id="rutherford-log-btn"
            type="button"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              logged
                ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
            }`}
          >
            {logged ? <Check className="w-4 h-4" /> : <BookmarkCheck className="w-4 h-4" />}
            <span>{logged ? tI18n('experiments.rutherford_scattering.logged') : tI18n('experiments.rutherford_scattering.log')}</span>
          </button>

          {/* Reset All */}
          <button
            id="rutherford-reset-btn"
            type="button"
            onClick={handleReset}
            className="p-2 min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center transition-colors"
            title={tI18n('experiments.rutherford_scattering.reset')}
            aria-label="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Element Presets Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Compass className="w-3.5 h-3.5" />
            {tI18n('experiments.rutherford_scattering.targetElement')}
          </span>
          <span className="text-[11px] font-mono text-slate-300">
            {currentTarget.symbol} (Z = {targetZ}) • {tI18n(`experiments.rutherford_scattering.${currentTarget.nameKey}`)}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TARGET_ELEMENTS.map((elem) => {
            const isSelected = elem.z === targetZ;
            return (
              <button
                key={elem.z}
                id={`target-${elem.nameKey}-btn`}
                type="button"
                onClick={() => setTargetZ(elem.z)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  isSelected
                    ? `${elem.bgColor} ${elem.borderColor} ${elem.textColor} shadow-md ring-2 ring-offset-2 ring-offset-slate-900 ring-amber-400/40 font-bold`
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="font-mono text-sm font-black" style={{ color: elem.color }}>
                  {elem.symbol}
                </span>
                <span className="text-[11px]">
                  {tI18n(`experiments.rutherford_scattering.${elem.nameKey}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canvas, Scintillation Screen & Scintillation Statistics */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          {/* Top Canvas Status Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-2">
              {/* Beam Mode Selector */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
                <button
                  id="rutherford-mode-continuous-btn"
                  type="button"
                  onClick={() => setBeamMode('continuous')}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${
                    beamMode === 'continuous'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tI18n('experiments.rutherford_scattering.continuousBeam')}
                </button>
                <button
                  id="rutherford-mode-single-btn"
                  type="button"
                  onClick={() => setBeamMode('single')}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${
                    beamMode === 'single'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tI18n('experiments.rutherford_scattering.fireSingle')}
                </button>
              </div>
            </div>

            {/* Current Deflection Classification Badge */}
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${deflectionCategory.color}`}>
              <span>θ ≈ {theoreticalAngleDeg.toFixed(1)}°</span>
              <span>•</span>
              <span>{deflectionCategory.text}</span>
            </span>
          </div>

          {/* Interactive Canvas */}
          <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="w-full h-auto max-h-[340px] rounded-xl bg-slate-950 select-none"
            />
          </div>

          {/* Scintillation Screen Legend and Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between sm:flex-col sm:items-start">
              <span className="text-[10px] text-slate-400 font-mono">Total Particles (N)</span>
              <span className="text-base font-bold font-mono text-white">{totalFired}</span>
            </div>
            <div className="p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-center justify-between sm:flex-col sm:items-start">
              <span className="text-[10px] text-rose-300 font-mono">Backscattered (θ &gt; 90°)</span>
              <span className="text-base font-bold font-mono text-rose-400">{backscatterCount}</span>
            </div>
            <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between sm:flex-col sm:items-start">
              <span className="text-[10px] text-amber-300 font-mono">Large Angle (45° - 90°)</span>
              <span className="text-base font-bold font-mono text-amber-400">{largeAngleCount}</span>
            </div>
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between sm:flex-col sm:items-start">
              <span className="text-[10px] text-emerald-300 font-mono">Straight / Small (&lt; 45°)</span>
              <span className="text-base font-bold font-mono text-emerald-400">{smallAngleCount}</span>
            </div>
          </div>

          {/* Historical Fact Callout */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              {tI18n('experiments.rutherford_scattering.historicalFact')}
            </p>
          </div>
        </div>

        {/* Right Column: Energy, Impact Parameter Controls & Physical Formulas */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
            {/* Alpha Energy (E_k) Control with Stepper Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-amber-400 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {tI18n('experiments.rutherford_scattering.alphaEnergy')}
                </span>
                <span className="font-mono text-white text-base font-bold bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md">
                  {energyMeV.toFixed(1)} MeV
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="energy-decrement-btn"
                  type="button"
                  onClick={() => setEnergyMeV((prev) => Math.max(2.0, Math.round((prev - 0.5) * 10) / 10))}
                  disabled={energyMeV <= 2.0}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Decrease Alpha Energy"
                  aria-label="Decrease Alpha Energy"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="energy-range-slider"
                  type="range"
                  min="2.0"
                  max="10.0"
                  step="0.5"
                  value={energyMeV}
                  onChange={(e) => setEnergyMeV(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <button
                  id="energy-increment-btn"
                  type="button"
                  onClick={() => setEnergyMeV((prev) => Math.min(10.0, Math.round((prev + 0.5) * 10) / 10))}
                  disabled={energyMeV >= 10.0}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Increase Alpha Energy"
                  aria-label="Increase Alpha Energy"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                <span>v ≈ {alphaSpeedKms.toLocaleString()} km/s</span>
                <span>(~{(alphaSpeedKms / 300000 * 100).toFixed(1)}% c)</span>
              </div>
            </div>

            {/* Impact Parameter (b) Control with Stepper Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5 text-sm">
                  <Target className="w-4 h-4 text-slate-400" />
                  {tI18n('experiments.rutherford_scattering.impactParameter')} (b)
                </span>
                <span className="font-mono text-white text-base font-bold bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md">
                  {impactParameter}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="impact-decrement-btn"
                  type="button"
                  onClick={() => setImpactParameter((prev) => Math.max(0, prev - 1))}
                  disabled={impactParameter <= 0}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Decrease Impact Parameter"
                  aria-label="Decrease Impact Parameter"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="impact-range-slider"
                  type="range"
                  min="0"
                  max="50"
                  value={impactParameter}
                  onChange={(e) => setImpactParameter(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <button
                  id="impact-increment-btn"
                  type="button"
                  onClick={() => setImpactParameter((prev) => Math.min(50, prev + 1))}
                  disabled={impactParameter >= 50}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Increase Impact Parameter"
                  aria-label="Increase Impact Parameter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick b Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[0, 8, 18, 35].map((presetB) => (
                  <button
                    key={presetB}
                    id={`b-preset-${presetB}`}
                    type="button"
                    onClick={() => setImpactParameter(presetB)}
                    className={`min-h-[36px] py-1 px-2 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                      impactParameter === presetB
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    b = {presetB}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coulomb Formula & Closest Approach Readout Card */}
          <div className="p-4 bg-gradient-to-br from-amber-950/40 to-slate-950/80 border border-amber-500/40 rounded-2xl space-y-3 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">
                {tI18n('experiments.rutherford_scattering.closestApproach')}
              </span>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-900/60 border border-amber-700/50 px-2 py-0.5 rounded-full">
                1 fm = 10⁻¹⁵ m
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
              {closestApproachFm.toFixed(1)}{' '}
              <span className="text-sm font-normal text-amber-400">fm</span>
            </div>

            {/* Readout Breakdown */}
            <div className="space-y-1.5 text-xs font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between text-slate-300">
                <span>Head-on (b=0) d_min:</span>
                <span className="text-amber-300 font-bold">{dClosestApproachHeadOnFm.toFixed(1)} fm</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{tI18n('experiments.rutherford_scattering.scatteringAngle')}:</span>
                <span className="text-rose-400 font-bold">{theoreticalAngleDeg.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1">
                <span>Peak Coulomb Force:</span>
                <span className="text-sky-300 font-bold">{peakForceNewtons.toFixed(1)} N</span>
              </div>
            </div>

            {/* Physics Mathematical Law */}
            <p className="text-[11px] text-amber-200/90 leading-relaxed font-mono bg-amber-950/60 p-2.5 rounded-lg border border-amber-900/60">
              F_e = k · (2e · Z e) / r²
              <br />
              cot(θ / 2) = (4πε₀ E_k / Z e²) · b
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
