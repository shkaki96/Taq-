import {
  Sparkles,
  Eye,
  Zap,
  BookmarkCheck,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Sliders,
  Atom,
  Layers,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface SpectralLine {
  wavelength: number; // in nanometers (nm)
  color: string;
  intensity: number; // 0.1 to 1.0
  name?: string;
  transition?: string;
  n_initial?: number;
  n_final?: number;
  energyEV?: number;
}

interface ElementSpectrum {
  id: string;
  symbol: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr?: string;
  glowColor: string;
  plasmaRgb: [number, number, number];
  lines: SpectralLine[];
}

const ELEMENTS: ElementSpectrum[] = [
  {
    id: 'hydrogen',
    symbol: 'H',
    nameAr: 'الهيدروجين (سلسلة بالمر)',
    nameEn: 'Hydrogen (Balmer Series)',
    nameKu: 'هایدرۆجین (زنجیرەی باڵمەر)',
    nameKmr: 'Hîdrojen (Rêzika Balmer)',
    glowColor: '#ec4899',
    plasmaRgb: [236, 72, 153],
    lines: [
      {
        wavelength: 656.3,
        color: '#ef4444',
        intensity: 1.0,
        name: 'H-α',
        transition: 'n=3 → n=2',
        n_initial: 3,
        n_final: 2,
        energyEV: 1.889,
      },
      {
        wavelength: 486.1,
        color: '#06b6d4',
        intensity: 0.85,
        name: 'H-β',
        transition: 'n=4 → n=2',
        n_initial: 4,
        n_final: 2,
        energyEV: 2.551,
      },
      {
        wavelength: 434.0,
        color: '#3b82f6',
        intensity: 0.65,
        name: 'H-γ',
        transition: 'n=5 → n=2',
        n_initial: 5,
        n_final: 2,
        energyEV: 2.857,
      },
      {
        wavelength: 410.2,
        color: '#8b5cf6',
        intensity: 0.45,
        name: 'H-δ',
        transition: 'n=6 → n=2',
        n_initial: 6,
        n_final: 2,
        energyEV: 3.024,
      },
    ],
  },
  {
    id: 'helium',
    symbol: 'He',
    nameAr: 'الهيليوم (He)',
    nameEn: 'Helium (He)',
    nameKu: 'هیلیۆم (He)',
    nameKmr: 'Helyûm (He)',
    glowColor: '#fed7aa',
    plasmaRgb: [254, 215, 170],
    lines: [
      { wavelength: 706.5, color: '#dc2626', intensity: 0.7, name: 'He 706.5', energyEV: 1.755 },
      { wavelength: 667.8, color: '#ef4444', intensity: 0.9, name: 'He 667.8', energyEV: 1.856 },
      { wavelength: 587.6, color: '#eab308', intensity: 1.0, name: 'He 587.6', energyEV: 2.110 },
      { wavelength: 501.6, color: '#22c55e', intensity: 0.7, name: 'He 501.6', energyEV: 2.472 },
      { wavelength: 492.2, color: '#06b6d4', intensity: 0.6, name: 'He 492.2', energyEV: 2.519 },
      { wavelength: 471.3, color: '#3b82f6', intensity: 0.6, name: 'He 471.3', energyEV: 2.631 },
      { wavelength: 447.1, color: '#6366f1', intensity: 0.8, name: 'He 447.1', energyEV: 2.773 },
    ],
  },
  {
    id: 'sodium',
    symbol: 'Na',
    nameAr: 'الصوديوم (ثنائية الخط D)',
    nameEn: 'Sodium (D-Doublet)',
    nameKu: 'سۆدیۆم (دووانەی هێڵی D)',
    nameKmr: 'Sodyûm (Cot-hêşa D)',
    glowColor: '#fbbf24',
    plasmaRgb: [251, 191, 36],
    lines: [
      { wavelength: 589.6, color: '#f59e0b', intensity: 0.95, name: 'D₁ Line', energyEV: 2.103 },
      { wavelength: 589.0, color: '#fbbf24', intensity: 1.0, name: 'D₂ Line', energyEV: 2.105 },
    ],
  },
  {
    id: 'mercury',
    symbol: 'Hg',
    nameAr: 'الزئبق (Hg)',
    nameEn: 'Mercury (Hg)',
    nameKu: 'جیوە (Hg)',
    nameKmr: 'Zîbeq (Hg)',
    glowColor: '#bae6fd',
    plasmaRgb: [186, 230, 253],
    lines: [
      { wavelength: 579.1, color: '#eab308', intensity: 0.7, name: 'Yellow-2', energyEV: 2.141 },
      { wavelength: 577.0, color: '#facc15', intensity: 0.7, name: 'Yellow-1', energyEV: 2.149 },
      { wavelength: 546.1, color: '#22c55e', intensity: 1.0, name: 'Green Line', energyEV: 2.270 },
      { wavelength: 435.8, color: '#3b82f6', intensity: 0.9, name: 'Blue Line', energyEV: 2.845 },
      { wavelength: 404.7, color: '#8b5cf6', intensity: 0.6, name: 'Violet Line', energyEV: 3.064 },
    ],
  },
  {
    id: 'neon',
    symbol: 'Ne',
    nameAr: 'النيون (Ne)',
    nameEn: 'Neon (Ne)',
    nameKu: 'نیۆن (Ne)',
    nameKmr: 'Neon (Ne)',
    glowColor: '#f97316',
    plasmaRgb: [249, 115, 22],
    lines: [
      { wavelength: 703.2, color: '#b91c1c', intensity: 0.8, name: 'Ne 703.2', energyEV: 1.763 },
      { wavelength: 650.6, color: '#dc2626', intensity: 0.9, name: 'Ne 650.6', energyEV: 1.906 },
      { wavelength: 640.2, color: '#ef4444', intensity: 1.0, name: 'Ne 640.2', energyEV: 1.937 },
      { wavelength: 614.3, color: '#f97316', intensity: 0.8, name: 'Ne 614.3', energyEV: 2.018 },
      { wavelength: 588.2, color: '#f59e0b', intensity: 0.7, name: 'Ne 588.2', energyEV: 2.108 },
      { wavelength: 585.2, color: '#eab308', intensity: 0.7, name: 'Ne 585.2', energyEV: 2.119 },
    ],
  },
];

// Physical Constants
const H_PLANCK = 6.62607015e-34; // J·s
const C_LIGHT = 2.99792458e8; // m/s
const EV_TO_JOULE = 1.602176634e-19; // J/eV
const RYDBERG_EV = 13.605693; // eV for Hydrogen

// Hydrogen orbital energies: E_n = -13.606 / n^2
const HYDROGEN_ORBIT_ENERGIES: Record<number, number> = {
  1: -13.606,
  2: -3.4015,
  3: -1.5118,
  4: -0.8504,
  5: -0.5442,
  6: -0.3779,
};

export default function AtomicSpectraSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();

  // Core Simulation States
  const [isRunning, setIsRunning] = useState<boolean>(true); // Start / Pause state
  const [activeView, setActiveView] = useState<'bohr_model' | 'spectrometer'>('bohr_model');
  const [spectrumMode, setSpectrumMode] = useState<'emission' | 'absorption'>('emission');
  const [selectedElementId, setSelectedElementId] = useState<string>('hydrogen');

  // Quantum States
  const [selectedTransitionN, setSelectedTransitionN] = useState<number>(3); // n_initial: 3 (H-alpha)
  const [probeWavelength, setProbeWavelength] = useState<number>(656.3); // nm
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [logged, setLogged] = useState<boolean>(false);

  // References for Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingProbeRef = useRef<boolean>(false);
  const electronAngleRef = useRef<number>(0);
  const jumpProgressRef = useRef<number>(1.0); // 0 (start of jump) to 1.0 (completed)
  const photonPacketRef = useRef<{ active: boolean; r: number; angle: number; wl: number; color: string; energy: number } | null>(null);

  const selectedElement = ELEMENTS.find((e) => e.id === selectedElementId) ?? ELEMENTS[0];

  // Calculations for probed wavelength
  const probeWavelengthM = probeWavelength * 1e-9;
  const photonEnergyJ = (H_PLANCK * C_LIGHT) / probeWavelengthM;
  const photonEnergyEV = photonEnergyJ / EV_TO_JOULE;
  const photonFrequencyTHz = (C_LIGHT / probeWavelengthM) / 1e12; // THz

  // Convert wavelength (nm) to smooth visible RGB
  const wavelengthToColor = useCallback((wl: number): string => {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) {
      r = -(wl - 440) / (440 - 380);
      b = 1.0;
    } else if (wl >= 440 && wl < 490) {
      g = (wl - 440) / (490 - 440);
      b = 1.0;
    } else if (wl >= 490 && wl < 510) {
      g = 1.0;
      b = -(wl - 510) / (510 - 490);
    } else if (wl >= 510 && wl < 580) {
      r = (wl - 510) / (580 - 510);
      g = 1.0;
    } else if (wl >= 580 && wl < 645) {
      r = 1.0;
      g = -(wl - 645) / (645 - 580);
    } else if (wl >= 645 && wl <= 780) {
      r = 1.0;
    } else {
      return '#64748b';
    }

    // Intensity falloff at spectrum edges
    let factor = 1.0;
    if (wl > 700) factor = 0.3 + 0.7 * (780 - wl) / (780 - 700);
    else if (wl < 420) factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);

    return `rgb(${Math.round(r * factor * 255)}, ${Math.round(g * factor * 255)}, ${Math.round(b * factor * 255)})`;
  }, []);

  // Trigger an active Quantum Transition
  const handleTriggerQuantumJump = useCallback((nInit?: number) => {
    const ni = nInit ?? selectedTransitionN;
    setSelectedTransitionN(ni);

    const matchingLine = selectedElement.lines.find((l) => l.n_initial === ni) ?? selectedElement.lines[0];
    if (matchingLine) {
      setProbeWavelength(matchingLine.wavelength);
    }

    jumpProgressRef.current = 0.0;
    setIsJumping(true);

    // Prepare photon packet
    photonPacketRef.current = {
      active: true,
      r: 78, // starts at orbit n=2 radius
      angle: electronAngleRef.current,
      wl: matchingLine ? matchingLine.wavelength : 656.3,
      color: matchingLine ? matchingLine.color : '#ef4444',
      energy: matchingLine ? (matchingLine.energyEV ?? 1.889) : 1.889,
    };
  }, [selectedElement, selectedTransitionN]);

  // Complete Reset to Hydrogen H-alpha
  const handleReset = useCallback(() => {
    setSelectedElementId('hydrogen');
    setSelectedTransitionN(3);
    setProbeWavelength(656.3);
    setSpectrumMode('emission');
    jumpProgressRef.current = 1.0;
    setIsJumping(false);
    photonPacketRef.current = null;
    electronAngleRef.current = 0;
  }, []);

  // Main Canvas Rendering Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let autoJumpTimer = 0;

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // Update physical electron kinematics when running
      if (isRunning) {
        // Orbit speed decreases with higher orbital radius: omega ~ 1 / n^1.5
        const currentN = selectedTransitionN;
        const omega = 3.5 / Math.pow(currentN, 1.2);
        electronAngleRef.current += omega * dt;

        // Progress any ongoing jump transition
        if (jumpProgressRef.current < 1.0) {
          jumpProgressRef.current = Math.min(1.0, jumpProgressRef.current + dt * 1.8);
          if (jumpProgressRef.current >= 1.0) {
            setIsJumping(false);
          }
        }

        // Move emitted photon packet outward
        if (photonPacketRef.current && photonPacketRef.current.active) {
          photonPacketRef.current.r += 160 * dt;
          if (photonPacketRef.current.r > 270) {
            photonPacketRef.current.active = false;
          }
        }

        // Automatic periodic jump every 4.5 seconds if hydrogen
        autoJumpTimer += dt;
        if (autoJumpTimer > 4.5 && selectedElementId === 'hydrogen' && jumpProgressRef.current >= 1.0) {
          autoJumpTimer = 0;
          handleTriggerQuantumJump();
        }
      }

      // Draw onto canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
          const width = canvas.width;
          const height = canvas.height;

          ctx.clearRect(0, 0, width, height);

          // Subtle Background Grid
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
          ctx.lineWidth = 1;
          for (let x = 0; x < width; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (let y = 0; y < height; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // VIEW 1: BOHR ATOMIC MODEL
          if (activeView === 'bohr_model') {
            const centerX = width * 0.44;
            const centerY = height * 0.50;

            // Concentric Bohr Orbital Radii (scaled for clear visualization)
            // n=1: 42px, n=2: 78px, n=3: 118px, n=4: 156px, n=5: 194px, n=6: 232px
            const orbitRadii: Record<number, number> = {
              1: 42,
              2: 78,
              3: 118,
              4: 156,
              5: 194,
              6: 232,
            };

            // Draw Bohr Quantum Orbits (n = 1 to 6)
            for (let n = 1; n <= 6; n++) {
              const r = orbitRadii[n];
              const isFinalBalmer = n === 2;
              const isSelectedInitial = n === selectedTransitionN;

              ctx.beginPath();
              ctx.arc(centerX, centerY, r, 0, Math.PI * 2);

              if (isFinalBalmer) {
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
                ctx.lineWidth = 2.2;
                ctx.setLineDash([5, 3]);
              } else if (isSelectedInitial) {
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
                ctx.lineWidth = 2.0;
                ctx.setLineDash([4, 4]);
              } else {
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
                ctx.lineWidth = 1.0;
                ctx.setLineDash([3, 5]);
              }
              ctx.stroke();
              ctx.setLineDash([]);

              // Quantum Orbit Level Label & Energy
              const energyVal = HYDROGEN_ORBIT_ENERGIES[n];
              ctx.fillStyle = isFinalBalmer ? '#38bdf8' : isSelectedInitial ? '#fbbf24' : '#64748b';
              ctx.font = '10px monospace';
              ctx.textAlign = 'left';
              const labelAngle = -0.35 + (n * 0.08);
              const lx = centerX + (r + 4) * Math.cos(labelAngle);
              const ly = centerY + (r + 4) * Math.sin(labelAngle);
              ctx.fillText(`n=${n} (${energyVal.toFixed(2)}eV)`, lx, ly);
            }

            // Central Nucleus (+1 Proton for Hydrogen)
            const nucleusGrad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 16);
            nucleusGrad.addColorStop(0, '#fca5a5');
            nucleusGrad.addColorStop(0.6, '#ef4444');
            nucleusGrad.addColorStop(1, '#991b1b');

            ctx.beginPath();
            ctx.arc(centerX, centerY, 13, 0, Math.PI * 2);
            ctx.fillStyle = nucleusGrad;
            ctx.fill();
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Nucleus Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('+1e', centerX, centerY + 3.5);

            // Determine Current Electron Position & Transition Interpolation
            const rInit = orbitRadii[selectedTransitionN];
            const rFinal = orbitRadii[2]; // Balmer series terminates on n=2

            // If jumping, interpolate radius smoothly
            let currentRadius = rInit;
            if (jumpProgressRef.current < 1.0) {
              // Smooth step interpolation
              const t = jumpProgressRef.current;
              const smoothT = t * t * (3 - 2 * t);
              currentRadius = rInit + (rFinal - rInit) * smoothT;
            }

            const currentAngle = electronAngleRef.current;
            const ex = centerX + currentRadius * Math.cos(currentAngle);
            const ey = centerY + currentRadius * Math.sin(currentAngle);

            // Electron Motion Trail Glow
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentRadius, currentAngle - 0.45, currentAngle);
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
            ctx.lineWidth = 4;
            ctx.stroke();

            // The Orbiting Electron (e-)
            ctx.beginPath();
            ctx.arc(ex, ey, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#fde047';
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Electron Minus Sign (-)
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('−', ex, ey + 4);

            // Transition Vector Arrow (showing inward quantum drop)
            if (jumpProgressRef.current < 1.0) {
              ctx.strokeStyle = '#f43f5e';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(centerX + rInit * Math.cos(currentAngle - 0.3), centerY + rInit * Math.sin(currentAngle - 0.3));
              ctx.lineTo(centerX + rFinal * Math.cos(currentAngle - 0.3), centerY + rFinal * Math.sin(currentAngle - 0.3));
              ctx.stroke();
            }

            // Emitted Photon Wave Packet (Transverse sin wave traveling outward)
            if (photonPacketRef.current && photonPacketRef.current.active) {
              const pkt = photonPacketRef.current;
              const baseAngle = pkt.angle;
              const waveLengthPix = 16;
              const numCycles = 3.5;
              const packetSpan = numCycles * waveLengthPix;

              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.rotate(baseAngle);

              ctx.beginPath();
              for (let d = 0; d <= packetSpan; d += 2) {
                const waveX = pkt.r + d;
                // Envelope window function to taper edges of packet
                const env = Math.sin((d / packetSpan) * Math.PI);
                const waveY = Math.sin((d / waveLengthPix) * Math.PI * 2) * 8 * env;
                if (d === 0) ctx.moveTo(waveX, waveY);
                else ctx.lineTo(waveX, waveY);
              }
              ctx.strokeStyle = pkt.color;
              ctx.lineWidth = 3;
              ctx.stroke();

              // Photon Packet Lead Photon Marker
              ctx.beginPath();
              ctx.arc(pkt.r + packetSpan, 0, 4, 0, Math.PI * 2);
              ctx.fillStyle = pkt.color;
              ctx.fill();

              ctx.restore();

              // Photon Readout Tag next to wave packet
              const tagX = centerX + (pkt.r + 20) * Math.cos(baseAngle);
              const tagY = centerY + (pkt.r + 20) * Math.sin(baseAngle);
              ctx.fillStyle = pkt.color;
              ctx.font = 'bold 11px monospace';
              ctx.textAlign = 'left';
              ctx.fillText(`Photon hf (λ = ${pkt.wl.toFixed(1)} nm, ΔE = ${pkt.energy.toFixed(3)} eV)`, tagX + 10, tagY - 8);
            }

            // Legend / Orbit Indicator on bottom left of canvas
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(16, height - 72, 220, 56);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(16, height - 72, 220, 56);

            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText(tI18n('experiments.atomic_spectra.seriesBalmer'), 24, height - 52);
            ctx.fillStyle = '#fde047';
            ctx.fillText(`Active Level: n = ${selectedTransitionN} → n = 2`, 24, height - 36);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`ΔE = ${(Math.abs(HYDROGEN_ORBIT_ENERGIES[selectedTransitionN] - HYDROGEN_ORBIT_ENERGIES[2])).toFixed(3)} eV`, 24, height - 22);
          }

          // VIEW 2: SPECTROMETER OPTICAL INSTRUMENT
          else {
            // Optical Path Setup:
            // 1. Gas Discharge Tube (Left)
            // 2. Collimator Slit
            // 3. Diffraction Grating / Prism
            // 4. Dispersed Rays to Spectrogram Detector Screen
            const tubeX = 40;
            const tubeY = 40;
            const tubeW = 22;
            const tubeH = 110;

            // Flickering high-voltage plasma glow
            const [pr, pg, pb] = selectedElement.plasmaRgb;
            const flicker = isRunning ? 0.85 + Math.sin(currentTime * 0.015) * 0.15 : 0.6;

            const tubeGrad = ctx.createRadialGradient(
              tubeX + tubeW / 2,
              tubeY + tubeH / 2,
              2,
              tubeX + tubeW / 2,
              tubeY + tubeH / 2,
              55
            );
            tubeGrad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${flicker})`);
            tubeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = tubeGrad;
            ctx.fillRect(tubeX - 35, tubeY - 20, tubeW + 70, tubeH + 40);

            // Quartz Glass Tube & Metal Electrodes
            ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${flicker * 0.9})`;
            ctx.fillRect(tubeX, tubeY, tubeW, tubeH);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tubeX, tubeY, tubeW, tubeH);

            // Electrodes (+ High Voltage and Ground)
            ctx.fillStyle = '#64748b';
            ctx.fillRect(tubeX - 3, tubeY - 10, tubeW + 6, 10);
            ctx.fillRect(tubeX - 3, tubeY + tubeH, tubeW + 6, 10);

            // Spark line through tube when running
            if (isRunning) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(tubeX + tubeW / 2, tubeY + 4);
              for (let sy = tubeY + 15; sy < tubeY + tubeH; sy += 15) {
                const sx = tubeX + tubeW / 2 + (Math.sin(sy * 0.2 + currentTime * 0.02) * 4);
                ctx.lineTo(sx, sy);
              }
              ctx.stroke();
            }

            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(tI18n('experiments.atomic_spectra.gasDischarge'), tubeX + tubeW / 2, tubeY + tubeH + 24);

            // Collimator Slit
            const slitX = 135;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(slitX, tubeY + 10, 8, 80);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(slitX, tubeY + 10, 8, 80);

            // Slit opening
            ctx.clearRect(slitX - 1, tubeY + 45, 10, 10);

            // Incident Light Beam (Tube -> Slit -> Grating)
            const gratingX = 225;
            const gratingCenterY = tubeY + 50;

            const beamGrad = ctx.createLinearGradient(tubeX + tubeW, tubeY + 50, gratingX, gratingCenterY);
            beamGrad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${flicker * 0.8})`);
            beamGrad.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0.5)`);
            ctx.fillStyle = beamGrad;
            ctx.fillRect(tubeX + tubeW, tubeY + 46, slitX - (tubeX + tubeW), 8);
            ctx.fillRect(slitX + 8, tubeY + 48, gratingX - (slitX + 8), 4);

            // Triangular Dispersive Prism / Diffraction Grating
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(gratingX, gratingCenterY - 35);
            ctx.lineTo(gratingX + 35, gratingCenterY);
            ctx.lineTo(gratingX, gratingCenterY + 35);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(tI18n('experiments.atomic_spectra.grating'), gratingX + 15, gratingCenterY + 48);

            // Photographic Spectrum Bar Coordinates
            const specX = 70;
            const specY = 215;
            const specW = 560;
            const specH = 65;

            // Dispersed Rays Traveling From Grating to Spectrum Screen!
            selectedElement.lines.forEach((line) => {
              const targetX = specX + ((line.wavelength - 380) / (750 - 380)) * specW;

              ctx.strokeStyle = line.color;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(gratingX + 22, gratingCenterY);
              ctx.lineTo(targetX, specY);
              ctx.stroke();

              // Ray propagation dot animation
              if (isRunning) {
                const prog = (currentTime * 0.0015 + (line.wavelength * 0.004)) % 1.0;
                const dotX = (gratingX + 22) + (targetX - (gratingX + 22)) * prog;
                const dotY = gratingCenterY + (specY - gratingCenterY) * prog;
                ctx.beginPath();
                ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
              }
            });

            // Draw Spectrum Background (Emission vs Absorption)
            if (spectrumMode === 'emission') {
              // Dark opaque absorption background
              ctx.fillStyle = '#030712';
              ctx.fillRect(specX, specY, specW, specH);
            } else {
              // Continuous Rainbow Background for Absorption Spectrum
              const rainbowGrad = ctx.createLinearGradient(specX, specY, specX + specW, specY);
              for (let wl = 380; wl <= 750; wl += 25) {
                rainbowGrad.addColorStop((wl - 380) / (750 - 380), wavelengthToColor(wl));
              }
              ctx.fillStyle = rainbowGrad;
              ctx.fillRect(specX, specY, specW, specH);
            }

            // Screen Bezel Border
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(specX, specY, specW, specH);

            // Draw Spectral Lines inside the Spectrum Bar
            selectedElement.lines.forEach((line) => {
              const lineX = specX + ((line.wavelength - 380) / (750 - 380)) * specW;

              if (spectrumMode === 'emission') {
                // Bright glowing emission line
                ctx.strokeStyle = line.color;
                ctx.lineWidth = 3.2;
                ctx.beginPath();
                ctx.moveTo(lineX, specY);
                ctx.lineTo(lineX, specY + specH);
                ctx.stroke();

                // Glow halo
                ctx.strokeStyle = `${line.color}44`;
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(lineX, specY);
                ctx.lineTo(lineX, specY + specH);
                ctx.stroke();
              } else {
                // Dark absorption Fraunhofer line
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(lineX, specY);
                ctx.lineTo(lineX, specY + specH);
                ctx.stroke();
              }

              // Spectral Line Text Identification
              ctx.fillStyle = spectrumMode === 'emission' ? line.color : '#cbd5e1';
              ctx.font = 'bold 10px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`${line.wavelength.toFixed(1)}nm`, lineX, specY - 6);

              if (line.name) {
                ctx.font = '9px sans-serif';
                ctx.fillText(line.name, lineX, specY + specH + 15);
              }
            });

            // Calibrated Wavelength Scale Ruler
            const rulerY = specY + specH + 30;
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(specX, rulerY);
            ctx.lineTo(specX + specW, rulerY);
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            for (let wl = 400; wl <= 750; wl += 50) {
              const rx = specX + ((wl - 380) / (750 - 380)) * specW;
              ctx.beginPath();
              ctx.moveTo(rx, rulerY - 4);
              ctx.lineTo(rx, rulerY + 4);
              ctx.stroke();
              ctx.fillText(`${wl}`, rx, rulerY + 16);
            }
            ctx.fillText(tI18n('experiments.atomic_spectra.wavelengthRuler'), specX + specW / 2, rulerY + 32);

            // Movable Optical Detector Sensor / Crosshair
            const probeScreenX = specX + ((probeWavelength - 380) / (750 - 380)) * specW;
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(probeScreenX, specY - 14);
            ctx.lineTo(probeScreenX, specY + specH + 8);
            ctx.stroke();
            ctx.setLineDash([]);

            // Crosshair indicator icon at top of probe
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(probeScreenX, specY - 14, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(probeScreenX, specY - 14, 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Live Simulation Status Badge (Running / Paused) in top right
          ctx.textAlign = 'right';
          ctx.font = 'bold 11px sans-serif';
          if (isRunning) {
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(width - 125, 24, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(tI18n('experiments.atomic_spectra.running'), width - 20, 28);
          } else {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(width - 125, 24, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(tI18n('experiments.atomic_spectra.paused'), width - 20, 28);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    activeView,
    spectrumMode,
    selectedElement,
    selectedTransitionN,
    probeWavelength,
    selectedElementId,
    lang,
    tI18n,
    handleTriggerQuantumJump,
    wavelengthToColor,
  ]);

  // Handle clicking or dragging across Spectrogram on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeView === 'spectrometer') {
      const specX = 70;
      const specW = 560;
      const specY = 215;
      const specH = 65;

      if (x >= specX - 10 && x <= specX + specW + 10 && y >= specY - 20 && y <= specY + specH + 30) {
        isDraggingProbeRef.current = true;
        const wl = 380 + Math.max(0, Math.min(1, (x - specX) / specW)) * (750 - 380);
        setProbeWavelength(Number(wl.toFixed(1)));
      }
    } else if (activeView === 'bohr_model') {
      // In Bohr model, clicking on an orbit selects that transition
      const centerX = canvas.width * 0.44;
      const centerY = canvas.height * 0.50;
      const dist = Math.hypot(x - centerX, y - centerY);

      // Distances match orbitRadii: 1:42, 2:78, 3:118, 4:156, 5:194, 6:232
      if (dist >= 100 && dist < 137) handleTriggerQuantumJump(3);
      else if (dist >= 137 && dist < 175) handleTriggerQuantumJump(4);
      else if (dist >= 175 && dist < 213) handleTriggerQuantumJump(5);
      else if (dist >= 213 && dist < 250) handleTriggerQuantumJump(6);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingProbeRef.current || activeView !== 'spectrometer') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const specX = 70;
    const specW = 560;
    const clampedFraction = Math.max(0, Math.min(1, (x - specX) / specW));
    const wl = 380 + clampedFraction * (750 - 380);
    setProbeWavelength(Number(wl.toFixed(1)));
  };

  const handleCanvasMouseUp = () => {
    isDraggingProbeRef.current = false;
  };

  const getElementName = (elem: ElementSpectrum) => {
    const names: Record<string, string> = {
      ar: elem.nameAr,
      ku: elem.nameKu,
      kmr: elem.nameKmr || elem.nameEn,
      en: elem.nameEn,
    };
    return names[lang] || elem.nameAr;
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'atomic_spectra',
      parameters: {
        element: getElementName(selectedElement),
        view: activeView,
        transition: selectedElementId === 'hydrogen' ? `n=${selectedTransitionN} → n=2` : 'N/A',
        wavelength: `${probeWavelength.toFixed(1)} nm`,
        frequency: `${photonFrequencyTHz.toFixed(1)} THz`,
        energyEV: `${photonEnergyEV.toFixed(3)} eV`,
      },
      variableName: tI18n('experiments.atomic_spectra.photonEnergyLabel'),
      measuredValue: Number(photonEnergyEV.toFixed(3)),
      theoreticalValue: Number(photonEnergyEV.toFixed(3)),
      unit: 'eV',
      equation: 'ΔE = h · f = (h · c) / λ',
      notes: `Element: ${getElementName(selectedElement)}, λ=${probeWavelength.toFixed(1)}nm, f=${photonFrequencyTHz.toFixed(1)} THz, ΔE=${photonEnergyEV.toFixed(3)} eV (${(photonEnergyJ * 1e19).toFixed(2)}×10⁻¹⁹ J)`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="atomic-spectra-simulation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simulation Stage & Visual Display */}
      <div className="lg:col-span-2 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl overflow-hidden">
          {/* Header Bar with Experiment Title, View Toggle, Play/Pause, Reset */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {tI18n('experiments.atomic_spectra.title')}
                </h3>
                <p className="text-sm text-zinc-400 font-mono" dir="ltr">
                  ΔE = {photonEnergyEV.toFixed(3)} eV • f = {photonFrequencyTHz.toFixed(1)} THz • λ = {probeWavelength.toFixed(1)} nm
                </p>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2">
              {/* View Toggle (Bohr Model vs Spectrometer) */}
              <button
                id="btn-atomic-toggle-view"
                onClick={() => setActiveView((prev) => (prev === 'spectrometer' ? 'bohr_model' : 'spectrometer'))}
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center gap-1.5 border border-zinc-700 transition-colors"
                title={activeView === 'spectrometer' ? tI18n('experiments.atomic_spectra.bohrModel') : tI18n('experiments.atomic_spectra.spectrometer')}
              >
                {activeView === 'spectrometer' ? <Atom className="w-4 h-4 text-pink-400" /> : <Eye className="w-4 h-4 text-sky-400" />}
                <span>
                  {activeView === 'spectrometer'
                    ? tI18n('experiments.atomic_spectra.bohrModel')
                    : tI18n('experiments.atomic_spectra.spectrometer')}
                </span>
              </button>

              {/* Play / Pause Button ("زر تشغيل") */}
              <button
                id="btn-atomic-run"
                onClick={() => setIsRunning((prev) => !prev)}
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all shadow-sm ${
                  isRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                }`}
                title={isRunning ? tI18n('experiments.atomic_spectra.pause') : tI18n('experiments.atomic_spectra.play')}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
                <span>{isRunning ? tI18n('experiments.atomic_spectra.pause') : tI18n('experiments.atomic_spectra.play')}</span>
              </button>

              {/* Reset Button */}
              <button
                id="btn-atomic-reset"
                onClick={handleReset}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors border border-zinc-700/60"
                title={tI18n('experiments.atomic_spectra.reset')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive HTML5 Canvas */}
          <div className="relative flex justify-center items-center bg-zinc-950/80 rounded-xl border border-zinc-800/70 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={700}
              height={380}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="cursor-crosshair max-w-full h-auto"
            />
          </div>

          {/* Real-time Quantum Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            {/* Metric 1: Wavelength λ */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.atomic_spectra.wavelengthLabel')}</div>
              <div className="text-base font-bold font-mono text-pink-400">
                {probeWavelength.toFixed(1)} <span className="text-sm text-zinc-400">nm</span>
              </div>
            </div>

            {/* Metric 2: Photon Energy ΔE (eV) */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.atomic_spectra.photonEnergyLabel')}</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {photonEnergyEV.toFixed(3)} <span className="text-sm text-zinc-400">eV</span>
              </div>
            </div>

            {/* Metric 3: Optical Frequency f (THz) */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.atomic_spectra.frequencyLabel')}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {photonFrequencyTHz.toFixed(1)} <span className="text-sm text-zinc-400">THz</span>
              </div>
            </div>

            {/* Metric 4: Energy in Joules (J) */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.atomic_spectra.energyJoulesLabel')}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {(photonEnergyJ * 1e19).toFixed(2)} <span className="text-[10px] text-zinc-400">×10⁻¹⁹ J</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Mathematical Formula & Quantum Steps Breakdown */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-zinc-300 font-semibold border-b border-zinc-800 pb-1.5">
            <span className="flex items-center gap-1.5 text-pink-400">
              <Sparkles className="w-3.5 h-3.5" />
              {tI18n('experiments.atomic_spectra.calculationsTitle')}
            </span>
            <span className="font-mono text-emerald-400 text-[11px]" dir="ltr">
              ΔE = h · f = (h · c) / λ
            </span>
          </div>

          <div className="font-mono text-zinc-300 text-[11px] space-y-1" dir="ltr">
            {selectedElementId === 'hydrogen' ? (
              <>
                <div className="text-zinc-400">
                  E_{selectedTransitionN} = -13.606 / ({selectedTransitionN}²) = {HYDROGEN_ORBIT_ENERGIES[selectedTransitionN]?.toFixed(3)} eV, &nbsp;
                  E_2 = -13.606 / 4 = -3.402 eV
                </div>
                <div className="text-zinc-300">
                  ΔE = E_{selectedTransitionN} − E_2 = |{HYDROGEN_ORBIT_ENERGIES[selectedTransitionN]?.toFixed(3)} − (-3.402)| = <span className="font-bold text-pink-400">{photonEnergyEV.toFixed(3)} eV</span>
                </div>
              </>
            ) : (
              <div className="text-zinc-400">
                ΔE = (hc) / λ = (1239.84 eV·nm) / ({probeWavelength.toFixed(1)} nm) = <span className="font-bold text-pink-400">{photonEnergyEV.toFixed(3)} eV</span>
              </div>
            )}
            <div className="flex items-center justify-between font-bold text-sky-300 pt-0.5 border-t border-zinc-800/60">
              <span>f = ΔE / h = c / λ = {photonFrequencyTHz.toFixed(1)} THz</span>
              <span className="text-amber-300">
                E = {(photonEnergyJ * 1e19).toFixed(3)} × 10⁻¹⁹ Joules
              </span>
            </div>
          </div>
        </div>

        {/* Quantum Theory & Spectral Fingerprint Card */}
        <div className="p-4 rounded-2xl bg-pink-950/20 border border-pink-800/30 text-xs text-zinc-300 space-y-2">
          <div className="font-semibold text-pink-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span>{tI18n('experiments.atomic_spectra.theoryTitle')}</span>
          </div>
          <p className="leading-relaxed">{tI18n('experiments.atomic_spectra.theoryDesc')}</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-pink-400" />
              <span>{tI18n('experiments.atomic_spectra.chemElementTitle')}</span>
            </h4>
          </div>

          {/* Dedicated Play / Pause & Trigger Jump Buttons ("أزرار تشغيل") */}
          <div className="flex items-center gap-2">
            <button
              id="btn-atomic-control-play-pause"
              onClick={() => setIsRunning((prev) => !prev)}
              className={`min-h-[44px] flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all shadow-md ${
                isRunning
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/60'
                  : 'bg-pink-950/60 text-pink-300 border-pink-500/50 hover:bg-pink-900/60'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4 text-emerald-400" /> : <Play className="w-4 h-4 text-pink-400" />}
              <span>{isRunning ? tI18n('experiments.atomic_spectra.pause') : tI18n('experiments.atomic_spectra.play')}</span>
            </button>

            {activeView === 'bohr_model' && selectedElementId === 'hydrogen' && (
              <button
                id="btn-atomic-trigger-jump"
                onClick={() => handleTriggerQuantumJump()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-pink-900/40"
                title={tI18n('experiments.atomic_spectra.triggerJump')}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{tI18n('experiments.atomic_spectra.triggerJump')}</span>
              </button>
            )}
          </div>

          {/* Spectrometer Mode Selector (Emission vs Absorption) */}
          {activeView === 'spectrometer' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-zinc-400">{tI18n('experiments.atomic_spectra.spectrumType')}</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => setSpectrumMode('emission')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-semibold border transition-all ${
                    spectrumMode === 'emission'
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/60 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                  }`}
                >
                  {tI18n('experiments.atomic_spectra.emissionSpectrum')}
                </button>
                <button
                  onClick={() => setSpectrumMode('absorption')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-semibold border transition-all ${
                    spectrumMode === 'absorption'
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/60 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                  }`}
                >
                  {tI18n('experiments.atomic_spectra.absorptionSpectrum')}
                </button>
              </div>
            </div>
          )}

          {/* Element Selection List */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">{tI18n('experiments.atomic_spectra.selectElementLabel')}</label>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {ELEMENTS.map((elem) => (
                <button
                  key={elem.id}
                  onClick={() => {
                    setSelectedElementId(elem.id);
                    setProbeWavelength(elem.lines[0].wavelength);
                    if (elem.id === 'hydrogen') {
                      setSelectedTransitionN(3);
                    }
                  }}
                  className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-start font-medium flex items-center justify-between border transition-all ${
                    selectedElementId === elem.id
                      ? 'bg-pink-950/40 text-pink-300 border-pink-500/60 shadow-md'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: elem.glowColor }}
                      className="w-3 h-3 rounded-full inline-block shadow-sm"
                    />
                    <span className="font-semibold">{getElementName(elem)}</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {elem.lines.length} lines
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Hydrogen Specific Orbital Transitions (Balmer Series) */}
          {selectedElementId === 'hydrogen' && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs text-zinc-400 flex items-center justify-between">
                <span>{tI18n('experiments.atomic_spectra.hydrogenTransitionLabel')}</span>
                <span className="font-mono text-pink-400 font-bold">n={selectedTransitionN} → n=2</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[3, 4, 5, 6].map((n) => {
                  const line = selectedElement.lines.find((l) => l.n_initial === n);
                  const isSelected = selectedTransitionN === n;
                  return (
                    <button
                      key={n}
                      onClick={() => handleTriggerQuantumJump(n)}
                      className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-bold font-mono text-center flex flex-col items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-pink-600 text-white border-pink-400 shadow-md'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="text-xs">{n} → 2</div>
                      <div className="text-[9px] opacity-80">{line?.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spectral Lines for Current Element */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            <label className="text-xs text-zinc-400">{tI18n('experiments.atomic_spectra.emissionLinesLabel')}</label>
            <div className="grid grid-cols-2 gap-1.5 text-xs max-h-44 overflow-y-auto pr-1">
              {selectedElement.lines.map((line) => {
                const isSelected = Math.abs(probeWavelength - line.wavelength) < 0.2;
                return (
                  <button
                    key={line.wavelength}
                    onClick={() => {
                      setProbeWavelength(line.wavelength);
                      if (line.n_initial) setSelectedTransitionN(line.n_initial);
                    }}
                    className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-center font-mono border transition-all ${
                      isSelected
                        ? 'bg-zinc-800 text-pink-300 border-pink-500 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-center gap-1.5">
                      <span
                        style={{ backgroundColor: line.color }}
                        className="w-2.5 h-2.5 rounded-full inline-block"
                      />
                      <span>{line.wavelength.toFixed(1)} nm</span>
                    </div>
                    {line.name && <div className="text-[10px] text-zinc-400">{line.name}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Probe Wavelength Manual Slider */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.atomic_spectra.wavelengthLabel')}</span>
              <span className="font-mono text-pink-400 font-bold" dir="ltr">
                {probeWavelength.toFixed(1)} nm
              </span>
            </div>
            <input
              type="range"
              min="380"
              max="750"
              step="0.5"
              value={probeWavelength}
              onChange={(e) => setProbeWavelength(parseFloat(e.target.value))}
              className="touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

          {/* Log Measurement Button */}
          <button
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              logged
                ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-900/30'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>
              {logged
                ? tI18n('experiments.atomic_spectra.loggedSuccess')
                : tI18n('experiments.atomic_spectra.logBtn')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
