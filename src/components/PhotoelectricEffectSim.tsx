import {
  Sparkles,
  RotateCcw,
  BookmarkCheck,
  Play,
  Pause,
  Sliders,
  Sun,
  Activity,
  Zap,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement?: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface TargetMetal {
  id: string;
  nameAr: string;
  nameEn: string;
  workFunctionEV: number; // Phi in eV
  color: string;
}

const TARGET_METALS: TargetMetal[] = [
  { id: 'cesium', nameAr: 'السيزيوم (Cs)', nameEn: 'Cesium (Cs)', workFunctionEV: 2.14, color: '#eab308' },
  { id: 'potassium', nameAr: 'البوتاسيوم (K)', nameEn: 'Potassium (K)', workFunctionEV: 2.30, color: '#a855f7' },
  { id: 'sodium', nameAr: 'الصوديوم (Na)', nameEn: 'Sodium (Na)', workFunctionEV: 2.36, color: '#f97316' },
  { id: 'calcium', nameAr: 'الكالسيوم (Ca)', nameEn: 'Calcium (Ca)', workFunctionEV: 2.87, color: '#38bdf8' },
  { id: 'zinc', nameAr: 'الزنك (Zn)', nameEn: 'Zinc (Zn)', workFunctionEV: 4.30, color: '#94a3b8' },
  { id: 'platinum', nameAr: 'البلاتين (Pt)', nameEn: 'Platinum (Pt)', workFunctionEV: 5.65, color: '#cbd5e1' },
];

export default function PhotoelectricEffectSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();

  // Primary controls
  const [wavelengthNm, setWavelengthNm] = useState<number>(380); // 150 nm (UV) to 800 nm (IR)
  const [intensity, setIntensity] = useState<number>(75); // 0% to 100%
  const [metalIndex, setMetalIndex] = useState<number>(0);
  const [biasVoltage, setBiasVoltage] = useState<number>(0.0); // -4.0 V to +4.0 V
  const [activeTab, setActiveTab] = useState<'chamber' | 'iv_curve' | 'kf_curve'>('chamber');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logged, setLogged] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const electronsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const photonsRef = useRef<{ x: number; y: number; targetX: number; targetY: number }[]>([]);
  const spawnTimerRef = useRef<number>(0);
  const photonSpawnTimerRef = useRef<number>(0);

  const metal = TARGET_METALS[metalIndex];
  const hPlanckEV = 4.135667696e-15; // eV·s
  const cSpeed = 299792458; // m/s
  const hcEV_nm = 1239.84193; // eV·nm

  // Photon Energy E = hc / lambda (in eV)
  const photonEnergyEV = hcEV_nm / wavelengthNm;
  // Threshold Frequency & Wavelength: lambda0 = hc / Phi
  const thresholdWavelengthNm = hcEV_nm / metal.workFunctionEV;
  const thresholdFreqTHz = (cSpeed / (thresholdWavelengthNm * 1e-9)) / 1e12;
  const photonFreqTHz = (cSpeed / (wavelengthNm * 1e-9)) / 1e12;

  // Max Kinetic Energy: K_max = max(0, E_photon - Phi)
  const canEmit = photonEnergyEV >= metal.workFunctionEV;
  const maxKineticEnergyEV = canEmit ? photonEnergyEV - metal.workFunctionEV : 0;
  // Stopping potential V_stop = K_max / e (Volts)
  const stoppingPotentialV = maxKineticEnergyEV;

  // Effective energy with bias voltage: net = K_max + e * V_bias
  const netEnergyEV = maxKineticEnergyEV + biasVoltage;
  const electronsReachAnode = canEmit && netEnergyEV > 0;
  // Current in microAmperes
  const photocurrentMicroA = electronsReachAnode
    ? (intensity / 100) * 18.5 * Math.min(1.8, Math.sqrt(Math.max(0.1, netEnergyEV / (maxKineticEnergyEV || 0.1))))
    : 0;

  // Electron velocity v = sqrt(2 * E_k / m_e)
  const electronVelocityKmS = maxKineticEnergyEV > 0 ? 593 * Math.sqrt(maxKineticEnergyEV) : 0;

  // Photon color mapping
  const getPhotonColor = (nm: number) => {
    if (nm < 380) return '#c084fc'; // UV (Purple)
    if (nm < 440) return '#818cf8'; // Violet
    if (nm < 490) return '#38bdf8'; // Blue
    if (nm < 560) return '#4ade80'; // Green
    if (nm < 590) return '#facc15'; // Yellow
    if (nm < 630) return '#fb923c'; // Orange
    return '#f87171'; // Red / IR
  };
  const photonColor = getPhotonColor(wavelengthNm);

  // Reset Simulation
  const handleReset = () => {
    setWavelengthNm(380);
    setIntensity(75);
    setMetalIndex(0);
    setBiasVoltage(0.0);
    electronsRef.current = [];
    photonsRef.current = [];
  };

  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'photoelectric_effect',
        parameters: {
          metal: metal.nameEn,
          workFunction_eV: `${metal.workFunctionEV.toFixed(2)} eV`,
          wavelength_nm: `${wavelengthNm} nm`,
          frequency_THz: `${photonFreqTHz.toFixed(1)} THz`,
          photonEnergy_eV: `${photonEnergyEV.toFixed(2)} eV`,
          biasVoltage_V: `${biasVoltage.toFixed(2)} V`,
          stoppingPotential_V: `${stoppingPotentialV.toFixed(2)} V`,
          photocurrent_uA: `${photocurrentMicroA.toFixed(2)} μA`,
        },
        measuredValue: Number(maxKineticEnergyEV.toFixed(3)),
        theoreticalValue: Number(Math.max(0, photonEnergyEV - metal.workFunctionEV).toFixed(3)),
        unit: 'eV',
        variableName: tI18n('experiments.photoelectric_effect.maxKineticEnergy') || 'Max Kinetic Energy (K_max)',
        equation: 'K_max = h · f - Φ = e · V_stop',
        notes: `Photoelectric Effect: Metal=${metal.nameEn} (Φ=${metal.workFunctionEV}eV), λ=${wavelengthNm}nm => K_max=${maxKineticEnergyEV.toFixed(2)}eV, I=${photocurrentMicroA.toFixed(1)}μA`,
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Phototube Geometry in 840x480 space
      const chamberX = 140;
      const chamberY = 70;
      const chamberW = 560;
      const chamberH = 220;

      const cathodeX = chamberX + 50;
      const anodeX = chamberX + chamberW - 50;
      const plateTop = chamberY + 40;
      const plateBottom = chamberY + chamberH - 40;

      // Physics Simulation Update
      if (isRunning) {
        // 1. Spawn Photons from Light Lamp
        if (intensity > 0) {
          photonSpawnTimerRef.current += dt;
          const photonInterval = Math.max(0.02, 0.25 / (intensity / 30));
          if (photonSpawnTimerRef.current >= photonInterval) {
            photonSpawnTimerRef.current = 0;
            const targetY = plateTop + Math.random() * (plateBottom - plateTop);
            photonsRef.current.push({
              x: chamberX + chamberW * 0.35,
              y: 20,
              targetX: cathodeX,
              targetY: targetY,
            });
          }
        }

        // Update Photons Position
        photonsRef.current = photonsRef.current
          .map((p) => {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.hypot(dx, dy);
            const speed = 480; // px/sec
            if (dist < speed * dt) {
              // Photon hits cathode! If canEmit, spawn photoelectron
              if (canEmit && intensity > 0) {
                const baseVx = Math.max(35, Math.min(220, 95 * Math.sqrt(maxKineticEnergyEV)));
                const vy = (Math.random() - 0.5) * 45;
                electronsRef.current.push({
                  x: cathodeX + 6,
                  y: p.targetY,
                  vx: baseVx,
                  vy: vy,
                  life: 0,
                });
              }
              return null;
            }
            return {
              ...p,
              x: p.x + (dx / dist) * speed * dt,
              y: p.y + (dy / dist) * speed * dt,
            };
          })
          .filter(Boolean) as { x: number; y: number; targetX: number; targetY: number }[];

        // 2. Update Photoelectrons Kinematics (Electric Acceleration a = q·E / m)
        // Electric field E = V_bias / d (pointing from Anode to Cathode if V > 0)
        const plateDistPx = anodeX - cathodeX;
        const eFieldAccelPx = (biasVoltage / plateDistPx) * 950; // px/s^2

        electronsRef.current = electronsRef.current
          .map((e) => {
            const newVx = e.vx + eFieldAccelPx * dt;
            const newX = e.x + newVx * dt;
            const newY = e.y + e.vy * dt;

            // Check if turned back to cathode
            if (newX < cathodeX) return null;
            // Check if reached anode
            if (newX >= anodeX) return null;
            // Check tube top/bottom boundaries
            if (newY < plateTop - 15 || newY > plateBottom + 15) return null;

            return {
              ...e,
              x: newX,
              y: newY,
              vx: newVx,
              life: e.life + dt,
            };
          })
          .filter(Boolean) as { x: number; y: number; vx: number; vy: number; life: number }[];
      }

      // CLEAR CANVAS
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // ==========================================
      // VIEW 1: VACUUM PHOTOTUBE CHAMBER (Default)
      // ==========================================
      if (activeTab === 'chamber') {
        // 1. Outer Circuit Wires
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3.5;

        // Cathode Wire loop down to power supply
        ctx.beginPath();
        ctx.moveTo(cathodeX, plateBottom);
        ctx.lineTo(cathodeX, height - 70);
        ctx.lineTo(width * 0.35, height - 70);
        ctx.stroke();

        // Anode Wire loop down through Micro-Ammeter
        ctx.beginPath();
        ctx.moveTo(anodeX, plateBottom);
        ctx.lineTo(anodeX, height - 70);
        ctx.lineTo(width * 0.65, height - 70);
        ctx.stroke();

        // 2. DC Variable Voltage Source & Voltmeter / Ammeter
        const batteryX = width * 0.42;
        const ammeterX = width * 0.58;
        const meterY = height - 70;

        // Battery Box
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(batteryX - 45, meterY - 30, 90, 60);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(batteryX - 45, meterY - 30, 90, 60);

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText(`V = ${biasVoltage >= 0 ? '+' : ''}${biasVoltage.toFixed(2)} V`, batteryX, meterY - 6);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(biasVoltage < 0 ? 'Retarding' : 'Accelerating', batteryX, meterY + 14);

        // Ammeter Dial (Right)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ammeterX, meterY, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(`${photocurrentMicroA.toFixed(1)} μA`, ammeterX, meterY + 4);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Ammeter', ammeterX, meterY + 16);

        // Wire connecting battery to ammeter
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(batteryX + 45, meterY);
        ctx.lineTo(ammeterX - 26, meterY);
        ctx.stroke();

        // 3. Quartz Glass Phototube Chamber
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.beginPath();
        ctx.roundRect(chamberX, chamberY, chamberW, chamberH, 30);
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Quartz Window on top
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(chamberX + chamberW * 0.28, chamberY);
        ctx.lineTo(chamberX + chamberW * 0.44, chamberY);
        ctx.stroke();
        ctx.restore();

        // 4. Target Metal Cathode Plate (Left)
        ctx.save();
        ctx.fillStyle = metal.color;
        ctx.shadowColor = metal.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(cathodeX - 8, plateTop, 16, plateBottom - plateTop);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cathodeX - 8, plateTop, 16, plateBottom - plateTop);
        ctx.restore();

        // Cathode Label & Work function
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(lang === 'ar' ? 'المهبط (Cathode -)' : 'Cathode (-)', cathodeX, plateTop - 12);
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = metal.color;
        ctx.fillText(`Φ = ${metal.workFunctionEV.toFixed(2)} eV`, cathodeX, plateBottom + 18);

        // 5. Collector Anode Plate (Right)
        ctx.save();
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(anodeX - 6, plateTop, 12, plateBottom - plateTop);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(anodeX - 6, plateTop, 12, plateBottom - plateTop);
        ctx.restore();

        // Anode Label
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(lang === 'ar' ? 'المصعد (Anode +)' : 'Anode (+)', anodeX, plateTop - 12);

        // 6. Monochromatic Light Source Lamp (Top)
        const lampX = chamberX + chamberW * 0.35;
        const lampY = 16;

        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(lampX - 35, lampY - 12, 70, 24);
        ctx.strokeStyle = photonColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(lampX - 35, lampY - 12, 70, 24);

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = photonColor;
        ctx.textAlign = 'center';
        ctx.fillText(`${wavelengthNm} nm`, lampX, lampY + 4);

        // Light Beam Cone from Lamp into Chamber
        if (intensity > 0) {
          const beamGrad = ctx.createLinearGradient(lampX, lampY + 12, cathodeX, (plateTop + plateBottom) / 2);
          beamGrad.addColorStop(0, `${photonColor}cc`);
          beamGrad.addColorStop(1, `${photonColor}15`);

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(lampX - 16, lampY + 12);
          ctx.lineTo(cathodeX, plateTop + 10);
          ctx.lineTo(cathodeX, plateBottom - 10);
          ctx.lineTo(lampX + 16, lampY + 12);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // 7. Render Photons
        photonsRef.current.forEach((p) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = photonColor;
          ctx.shadowBlur = 10;
          ctx.fill();

          // Small wave packet tail
          ctx.strokeStyle = photonColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 8, p.y - 12);
          ctx.stroke();
          ctx.restore();
        });

        // 8. Render Photoelectrons
        electronsRef.current.forEach((e) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(e.x, e.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 8;
          ctx.fill();

          // Minus sign inside electron
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(e.x - 1.5, e.y);
          ctx.lineTo(e.x + 1.5, e.y);
          ctx.stroke();
          ctx.restore();
        });

        // 9. Status & Emission Banner inside chamber
        if (!canEmit && intensity > 0) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.fillRect(chamberX + chamberW / 2 - 170, chamberY + chamberH / 2 - 20, 340, 40);
          ctx.strokeStyle = '#fca5a5';
          ctx.strokeRect(chamberX + chamberW / 2 - 170, chamberY + chamberH / 2 - 20, 340, 40);

          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(
            lang === 'ar'
              ? `طاقة الفوتون (${photonEnergyEV.toFixed(2)}eV) أقل من دالة الشغل (${metal.workFunctionEV}eV)`
              : `Photon energy (${photonEnergyEV.toFixed(2)}eV) < Work function (${metal.workFunctionEV}eV)`,
            chamberX + chamberW / 2,
            chamberY + chamberH / 2 + 5
          );
        } else if (biasVoltage < -stoppingPotentialV && canEmit) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.fillRect(chamberX + chamberW / 2 - 160, chamberY + chamberH / 2 - 20, 320, 40);
          ctx.strokeStyle = '#fde68a';
          ctx.strokeRect(chamberX + chamberW / 2 - 160, chamberY + chamberH / 2 - 20, 320, 40);

          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(
            lang === 'ar' ? `جهد الإيقاف مفعل: V_bias < -${stoppingPotentialV.toFixed(2)} V` : `Stopping Potential Reached (V < -${stoppingPotentialV.toFixed(2)}V)`,
            chamberX + chamberW / 2,
            chamberY + chamberH / 2 + 5
          );
        }
      }

      // ==========================================
      // VIEW 2: I-V CURVE GRAPH
      // ==========================================
      else if (activeTab === 'iv_curve') {
        const gx = 100;
        const gy = 60;
        const gw = width - 200;
        const gh = height - 120;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(gx, gy, gw, gh);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.strokeRect(gx, gy, gw, gh);

        // Axes
        const originX = gx + gw * 0.45; // V = 0 axis
        const originY = gy + gh - 30; // I = 0 axis

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        // X-axis (Voltage)
        ctx.beginPath();
        ctx.moveTo(gx + 20, originY);
        ctx.lineTo(gx + gw - 20, originY);
        ctx.stroke();

        // Y-axis (Current)
        ctx.beginPath();
        ctx.moveTo(originX, gy + 20);
        ctx.lineTo(originX, gy + gh - 10);
        ctx.stroke();

        // Axis labels
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText('V (Volts)', gx + gw - 25, originY - 10);
        ctx.fillText('I (μA)', originX - 10, gy + 30);

        // Draw I-V Curve
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const vMin = -4.0;
        const vMax = 4.0;
        for (let v = vMin; v <= vMax; v += 0.1) {
          const px = originX + (v / 4.0) * (gw * 0.45);
          let currentAtV = 0;
          if (canEmit && v >= -stoppingPotentialV) {
            const netE = maxKineticEnergyEV + v;
            currentAtV = (intensity / 100) * 18.5 * Math.min(1.8, Math.sqrt(Math.max(0.01, netE / (maxKineticEnergyEV || 0.1))));
          }
          const py = originY - (currentAtV / 35) * (gh - 70);
          if (v === vMin) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Current Operating Point Marker
        const currOpX = originX + (biasVoltage / 4.0) * (gw * 0.45);
        const currOpY = originY - (photocurrentMicroA / 35) * (gh - 70);

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(currOpX, currOpY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Stopping potential V_stop mark on axis
        if (canEmit) {
          const vStopX = originX - (stoppingPotentialV / 4.0) * (gw * 0.45);
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(vStopX, originY, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#c084fc';
          ctx.textAlign = 'center';
          ctx.fillText(`-V₀ = -${stoppingPotentialV.toFixed(2)}V`, vStopX, originY + 18);
        }
      }

      // ==========================================
      // VIEW 3: K_max vs Frequency Curve
      // ==========================================
      else if (activeTab === 'kf_curve') {
        const gx = 100;
        const gy = 60;
        const gw = width - 200;
        const gh = height - 120;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(gx, gy, gw, gh);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.strokeRect(gx, gy, gw, gh);

        const originX = gx + 50;
        const originY = gy + gh - 40;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        // X-axis (Frequency f in THz)
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(gx + gw - 20, originY);
        ctx.stroke();

        // Y-axis (K_max in eV)
        ctx.beginPath();
        ctx.moveTo(originX, gy + 20);
        ctx.lineTo(originX, originY);
        ctx.stroke();

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText('f (THz)', gx + gw - 25, originY - 10);
        ctx.fillText('K_max (eV)', originX + 75, gy + 35);

        // Einstein Straight Line: K_max = h*f - Phi
        const fMaxTHz = 2000;
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const f0_THz = thresholdFreqTHz;
        const f0_Px = originX + (f0_THz / fMaxTHz) * (gw - 80);

        ctx.moveTo(originX, originY);
        ctx.lineTo(f0_Px, originY);

        const endPx = gx + gw - 30;
        const endF_THz = fMaxTHz;
        const endK_eV = hPlanckEV * (endF_THz * 1e12) - metal.workFunctionEV;
        const endPy = originY - (endK_eV / 6.0) * (gh - 70);

        ctx.lineTo(endPx, endPy);
        ctx.stroke();

        // Threshold frequency marker
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(f0_Px, originY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(`f₀ = ${f0_THz.toFixed(0)} THz`, f0_Px, originY + 18);

        // Current photon operating frequency marker
        if (photonFreqTHz < fMaxTHz) {
          const currFPx = originX + (photonFreqTHz / fMaxTHz) * (gw - 80);
          const currKPy = originY - (maxKineticEnergyEV / 6.0) * (gh - 70);

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(currFPx, currKPy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`(${photonFreqTHz.toFixed(0)} THz, ${maxKineticEnergyEV.toFixed(2)} eV)`, currFPx, currKPy - 12);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    wavelengthNm,
    intensity,
    metalIndex,
    biasVoltage,
    activeTab,
    canEmit,
    maxKineticEnergyEV,
    photonEnergyEV,
    stoppingPotentialV,
    photocurrentMicroA,
    photonColor,
    metal,
    lang,
    thresholdFreqTHz,
    photonFreqTHz,
    hPlanckEV,
  ]);

  return (
    <div id="photoelectric-effect-simulation" className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {tI18n('experiments.photoelectric_effect.title') || 'Photoelectric Effect Lab (Einstein Equation)'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">E_k = h · f - Φ = e · V_stop</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title={isRunning ? 'Pause' : 'Play'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title={tI18n('experiments.photoelectric_effect.reset') || 'Reset'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all shrink-0 ${
              logged
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{logged ? tI18n('experiments.photoelectric_effect.logged') || 'Logged ✓' : tI18n('experiments.photoelectric_effect.logMeasurement') || 'Log Data'}</span>
          </button>
        </div>
      </div>

      {/* Mode View Tabs (Dropdown on Mobile, Tabs on Desktop) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 pb-1">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as 'chamber' | 'iv_curve' | 'kf_curve')}
          className="md:hidden w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 shadow-md"
        >
          <option value="chamber">{lang === 'ar' ? 'أنبوب التأثير الكهروضوئي' : 'Phototube Chamber'}</option>
          <option value="iv_curve">{lang === 'ar' ? 'منحنى التيار - الجهد (I - V)' : 'I - V Curve (Current vs Voltage)'}</option>
          <option value="kf_curve">{lang === 'ar' ? 'خط أينشتاين (K_max - التردد)' : 'Kinetic Energy vs Frequency'}</option>
        </select>
        
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chamber')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'chamber'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{lang === 'ar' ? 'أنبوب التأثير الكهروضوئي' : 'Phototube Chamber'}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('iv_curve')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'iv_curve'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{lang === 'ar' ? 'منحنى التيار - الجهد (I - V)' : 'I - V Curve (Current vs Voltage)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('kf_curve')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'kf_curve'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{lang === 'ar' ? 'خط أينشتاين (K_max - التردد)' : 'Kinetic Energy vs Frequency'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Canvas Area (Cols: 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
            {/* Top Toolbar overlay inside canvas */}
            <div className="w-full flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80 px-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">
                  {activeTab === 'chamber'
                    ? lang === 'ar'
                      ? 'محاكاة انبعاث الإلكترونات الضوئية وجهد الإيقاف'
                      : 'Photoelectron Emission & Retarding Field'
                    : activeTab === 'iv_curve'
                    ? 'Current (I) vs Bias Voltage (V)'
                    : 'Max Kinetic Energy (K_max) vs Frequency (f)'}
                </span>
              </div>
              <span className="text-xs font-mono text-amber-300">
                E_photon = {photonEnergyEV.toFixed(2)} eV
              </span>
            </div>

            {/* High-Resolution HTML5 Canvas */}
            <div className="w-full aspect-[7/4] max-h-[520px] rounded-xl overflow-hidden bg-slate-950 relative border border-slate-800/70 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={840}
                height={480}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Canvas Hint Prompt */}
            <div className="w-full text-center py-1.5 text-[11px] text-slate-400 flex items-center justify-center gap-3">
              <span>💡 {lang === 'ar' ? 'غيّر الطول الموجي لترى عتبة الانبعاث، أو اضبط الجهد السالب لقياس جهد الإيقاف بدقة' : 'Adjust wavelength to see emission threshold, or apply negative bias to measure stopping potential!'}</span>
            </div>
          </div>

          {/* Real-time Telemetry Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{tI18n('experiments.photoelectric_effect.maxKineticEnergy') || 'Max Kinetic Energy'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-amber-400 whitespace-nowrap">
                {maxKineticEnergyEV.toFixed(2)} <span className="text-[10px] sm:text-xs text-slate-400">eV</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{tI18n('experiments.photoelectric_effect.stoppingPotential') || 'Stopping Voltage (V₀)'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-purple-400 whitespace-nowrap">
                {stoppingPotentialV.toFixed(2)} <span className="text-[10px] sm:text-xs text-slate-400">V</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{tI18n('experiments.photoelectric_effect.photocurrent') || 'Photocurrent (I)'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 whitespace-nowrap">
                {photocurrentMicroA.toFixed(1)} <span className="text-[10px] sm:text-xs text-slate-400">μA</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-[11px] leading-tight text-slate-400 mb-1">{lang === 'ar' ? 'سرعة الإلكترونات' : 'Electron Speed (v)'}</div>
              <div className="text-sm sm:text-base font-bold font-mono text-sky-400 whitespace-nowrap">
                {electronVelocityKmS.toFixed(0)} <span className="text-[10px] sm:text-xs text-slate-400">km/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls (Cols: 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>{tI18n('experiments.photoelectric_effect.controlsTitle') || 'Photoelectric Controls'}</span>
            </h4>

            {/* Target Metal Selector */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-300">{lang === 'ar' ? 'المعدن المستهدف (المهبط):' : 'Target Cathode Metal:'}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {TARGET_METALS.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => setMetalIndex(idx)}
                    className={`min-h-[42px] px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex flex-col items-start justify-center ${
                      metalIndex === idx
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-750'
                    }`}
                  >
                    <span className="truncate w-full text-start">{lang === 'ar' ? m.nameAr : m.nameEn}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">Φ = {m.workFunctionEV.toFixed(2)} eV</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wavelength Slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: photonColor }} />
                  <span>{tI18n('experiments.photoelectric_effect.wavelengthLabel') || 'Wavelength (λ):'}</span>
                </span>
                <span className="font-mono font-bold" style={{ color: photonColor }}>{wavelengthNm} nm</span>
              </div>
              <input
                type="range"
                min="150"
                max="800"
                step="5"
                value={wavelengthNm}
                onChange={(e) => setWavelengthNm(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: photonColor }}
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>150 nm (UV)</span>
                <span>400 nm (Vis)</span>
                <span>800 nm (IR)</span>
              </div>
            </div>

            {/* Intensity Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.photoelectric_effect.intensityLabel') || 'Light Intensity:'}</span>
                <span className="font-mono text-amber-400 font-bold">{intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Bias Voltage Slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{tI18n('experiments.photoelectric_effect.biasVoltageLabel') || 'Bias Voltage (V):'}</span>
                <span className="font-mono text-sky-400 font-bold">{biasVoltage >= 0 ? `+${biasVoltage.toFixed(2)}` : biasVoltage.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min="-4.0"
                max="4.0"
                step="0.1"
                value={biasVoltage}
                onChange={(e) => setBiasVoltage(parseFloat(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-4.0 V (Retarding)</span>
                <span>0 V</span>
                <span>+4.0 V (Accel)</span>
              </div>
            </div>
          </div>

          {/* Scientific Reference Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ar' ? 'معادلة أينشتاين للظاهرة الكهروضوئية' : 'Einstein Photoelectric Equation'}</span>
            </h4>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-amber-300 space-y-1.5">
              <div className="font-bold text-amber-400">E_k = h · f - Φ = e · V_stop</div>
              <div className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? 'الطاقة الحركية العظمى للإلكترونات تعتمد حصرياً على تردد الضوء ودالة الشغل للمعدن، بينما تحدد الشدة عدد الإلكترونات المتحررة.'
                  : 'Kinetic energy depends purely on photon frequency and work function; light intensity dictates the electron emission rate.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
