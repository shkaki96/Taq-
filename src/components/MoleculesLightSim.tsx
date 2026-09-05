import { 
  Waves, 
  RotateCcw, 
  BookmarkCheck, 
  Check, 
  Plus, 
  Minus, 
  Zap, 
  Sparkles, 
  Trash2, 
  Info,
  Pause,
  Play,
  Sun,
  Flame,
  Radio,
  Clock
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface MoleculesLightSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

type LightType = 'microwave' | 'infrared' | 'visible' | 'uv';
type MoleculeType = 'co2' | 'h2o' | 'ch4' | 'n2' | 'o2' | 'o3' | 'co' | 'no2';

interface Photon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wavelength: number;
  color: string;
  type: LightType;
  isReemitted?: boolean;
}

interface MoleculeMeta {
  type: MoleculeType;
  formula: string;
  nameKey: string;
  dipoleDebye: number;
  isPolar: boolean;
  geometry: string;
  bondEnergyEV: number;
  greenhouse: boolean;
  tagColor: string;
}

const MOLECULES_DATA: Record<MoleculeType, MoleculeMeta> = {
  co2: {
    type: 'co2',
    formula: 'CO₂',
    nameKey: 'co2',
    dipoleDebye: 0.0,
    isPolar: false,
    geometry: 'Linear (O=C=O)',
    bondEnergyEV: 8.3,
    greenhouse: true,
    tagColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  },
  h2o: {
    type: 'h2o',
    formula: 'H₂O',
    nameKey: 'h2o',
    dipoleDebye: 1.85,
    isPolar: true,
    geometry: 'Bent (104.5°)',
    bondEnergyEV: 5.1,
    greenhouse: true,
    tagColor: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
  },
  ch4: {
    type: 'ch4',
    formula: 'CH₄',
    nameKey: 'ch4',
    dipoleDebye: 0.0,
    isPolar: false,
    geometry: 'Tetrahedral (109.5°)',
    bondEnergyEV: 4.5,
    greenhouse: true,
    tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  },
  o3: {
    type: 'o3',
    formula: 'O₃',
    nameKey: 'o3',
    dipoleDebye: 0.53,
    isPolar: true,
    geometry: 'Bent (117°)',
    bondEnergyEV: 1.1, // Easy UV photolysis
    greenhouse: true,
    tagColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
  },
  n2: {
    type: 'n2',
    formula: 'N₂',
    nameKey: 'n2',
    dipoleDebye: 0.0,
    isPolar: false,
    geometry: 'Linear Diatomic (N≡N)',
    bondEnergyEV: 9.8,
    greenhouse: false,
    tagColor: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  },
  o2: {
    type: 'o2',
    formula: 'O₂',
    nameKey: 'o2',
    dipoleDebye: 0.0,
    isPolar: false,
    geometry: 'Linear Diatomic (O=O)',
    bondEnergyEV: 5.2,
    greenhouse: false,
    tagColor: 'text-teal-400 border-teal-500/40 bg-teal-500/10',
  },
  co: {
    type: 'co',
    formula: 'CO',
    nameKey: 'co',
    dipoleDebye: 0.11,
    isPolar: true,
    geometry: 'Linear Diatomic (C≡O)',
    bondEnergyEV: 11.1,
    greenhouse: true,
    tagColor: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  },
  no2: {
    type: 'no2',
    formula: 'NO₂',
    nameKey: 'no2',
    dipoleDebye: 0.32,
    isPolar: true,
    geometry: 'Bent (134°)',
    bondEnergyEV: 3.1, // Visible / Near-UV photolysis
    greenhouse: false,
    tagColor: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
  },
};

const LIGHT_DATA = {
  microwave: {
    name: 'Microwave',
    icon: Radio,
    color: '#38bdf8', // sky
    glowColor: 'rgba(56, 189, 248, 0.4)',
    wavelengthStr: '12.2 cm (2.45 GHz)',
    frequencyHz: 2.45e9,
    energyEV: 0.00001,
    energyJoules: 1.62e-24,
    waveNumberCm: 0.082,
    transition: 'Rotational (ΔJ)',
  },
  infrared: {
    name: 'Infrared',
    icon: Flame,
    color: '#ef4444', // red
    glowColor: 'rgba(239, 68, 68, 0.4)',
    wavelengthStr: '4.26 μm (70.4 THz)',
    frequencyHz: 7.04e13,
    energyEV: 0.291,
    energyJoules: 4.66e-20,
    waveNumberCm: 2349,
    transition: 'Vibrational (Δv)',
  },
  visible: {
    name: 'Visible Light',
    icon: Sun,
    color: '#22c55e', // green
    glowColor: 'rgba(34, 197, 94, 0.4)',
    wavelengthStr: '550 nm (545 THz)',
    frequencyHz: 5.45e14,
    energyEV: 2.25,
    energyJoules: 3.61e-19,
    waveNumberCm: 18182,
    transition: 'Electronic (valence)',
  },
  uv: {
    name: 'Ultraviolet',
    icon: Zap,
    color: '#c084fc', // purple
    glowColor: 'rgba(192, 132, 252, 0.4)',
    wavelengthStr: '254 nm (1.18 PHz)',
    frequencyHz: 1.18e15,
    energyEV: 4.88,
    energyJoules: 7.82e-19,
    waveNumberCm: 39370,
    transition: 'Photodissociation / Cleavage',
  },
};

export const MoleculesLightSim: React.FC<MoleculesLightSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // Primary State
  const [lightType, setLightType] = useState<LightType>('infrared');
  const [molecule, setMolecule] = useState<MoleculeType>('co2');
  const [isEmitting, setIsEmitting] = useState<boolean>(true);
  const [beamMode, setBeamMode] = useState<'continuous' | 'single'>('continuous');
  const [emissionRate, setEmissionRate] = useState<number>(3); // 1 to 5 photons/sec
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // 1.0 or 0.4
  const [isDissociated, setIsDissociated] = useState<boolean>(false);
  const [dissociateProgress, setDissociateProgress] = useState<number>(0);
  const [activeExcitation, setActiveExcitation] = useState<'none' | 'rotation' | 'vibration' | 'reemission'>('none');
  const [logged, setLogged] = useState<boolean>(false);

  // Counters
  const [photonsAbsorbed, setPhotonsAbsorbed] = useState<number>(0);
  const [photonsTransmitted, setPhotonsTransmitted] = useState<number>(0);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const photonsRef = useRef<Photon[]>([]);
  const nextPhotonId = useRef<number>(1);
  const excitationTimerRef = useRef<number>(0);
  const rotationAngleRef = useRef<number>(0);
  const vibrationTickRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  // Physical Absorption Determination
  const absorptionRule = useMemo(() => {
    // 1. Microwave: requires permanent dipole moment (polar molecule)
    if (lightType === 'microwave') {
      const isAbsorbing = MOLECULES_DATA[molecule].isPolar;
      return {
        absorbs: isAbsorbing,
        mode: isAbsorbing ? 'rotation' : 'transmitted',
      };
    }

    // 2. Infrared: requires oscillating dipole moment during vibrational mode
    // CO2 (bending & asymmetric stretch), H2O, CH4, O3, CO, NO2 absorb IR
    // Homonuclear diatomics N2 and O2 do not absorb IR
    if (lightType === 'infrared') {
      const isAbsorbing = molecule !== 'n2' && molecule !== 'o2';
      return {
        absorbs: isAbsorbing,
        mode: isAbsorbing ? 'vibration' : 'transmitted',
      };
    }

    // 3. Visible light: simple gases are transparent except NO2 (brown gas, absorbs ~400-500nm)
    if (lightType === 'visible') {
      const isAbsorbing = molecule === 'no2';
      return {
        absorbs: isAbsorbing,
        mode: isAbsorbing ? 'vibration' : 'transmitted',
      };
    }

    // 4. Ultraviolet: photon energy (4.88 eV) exceeds bond energy
    // O3 bond energy is 1.1 eV -> readily photolyses!
    // NO2 bond energy is 3.1 eV -> photolyses!
    // CO2 in high UV photolyses
    if (lightType === 'uv') {
      const isAbsorbing = molecule === 'o3' || molecule === 'no2' || molecule === 'co2';
      return {
        absorbs: isAbsorbing,
        mode: isAbsorbing ? 'dissociation' : 'transmitted',
      };
    }

    return { absorbs: false, mode: 'transmitted' };
  }, [lightType, molecule]);

  const currentMolecule = MOLECULES_DATA[molecule];
  const currentLight = LIGHT_DATA[lightType];

  // Total photons processed
  const totalPhotons = photonsAbsorbed + photonsTransmitted;
  const absorptionPercentage = totalPhotons > 0 ? ((photonsAbsorbed / totalPhotons) * 100).toFixed(1) : '0.0';

  // Fire a single photon from the emitter
  const fireSinglePhoton = () => {
    const newP: Photon = {
      id: nextPhotonId.current++,
      x: 60,
      y: 150 + (Math.random() - 0.5) * 6,
      vx: 3.5 * speedMultiplier,
      vy: 0,
      wavelength: currentLight.waveNumberCm,
      color: currentLight.color,
      type: lightType,
    };
    photonsRef.current.push(newP);
  };

  // Recombine dissociated molecule
  const handleRecombine = () => {
    setIsDissociated(false);
    setDissociateProgress(0);
  };

  // Reset simulation
  const handleReset = () => {
    photonsRef.current = [];
    setPhotonsAbsorbed(0);
    setPhotonsTransmitted(0);
    setIsDissociated(false);
    setDissociateProgress(0);
    setActiveExcitation('none');
    setLightType('infrared');
    setMolecule('co2');
    setIsEmitting(true);
    setBeamMode('continuous');
    setEmissionRate(3);
    setSpeedMultiplier(1.0);
  };

  // Clear counters
  const handleClearCounters = () => {
    setPhotonsAbsorbed(0);
    setPhotonsTransmitted(0);
    photonsRef.current = [];
  };

  // Log measurement
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'molecules_and_light',
        targetMolecule: currentMolecule.formula,
        moleculeName: tI18n(`experiments.molecules_and_light.${currentMolecule.nameKey}`),
        dipoleMomentD: currentMolecule.dipoleDebye,
        isPolar: currentMolecule.isPolar,
        lightSource: currentLight.name,
        wavelength: currentLight.wavelengthStr,
        frequencyHz: currentLight.frequencyHz.toExponential(2),
        photonEnergyEV: currentLight.energyEV,
        photonEnergyJoules: currentLight.energyJoules.toExponential(2),
        transitionType: currentLight.transition,
        interactionEffect: absorptionRule.mode,
        absorbs: absorptionRule.absorbs,
        photonsAbsorbed,
        photonsTransmitted,
        absorptionRatePercent: absorptionPercentage,
        timestamp: new Date().toISOString(),
        equation: 'E = h · f = (h · c) / λ',
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // Main Canvas & Particle physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const molCenter = { x: 300, y: 150 };

    const loop = () => {
      // 1. Spawning Photons (Continuous Mode)
      if (isEmitting && beamMode === 'continuous') {
        spawnTimerRef.current++;
        // Emission rate: 1 (slow) -> every 50 frames; 5 (fast) -> every 14 frames
        const spawnThreshold = Math.round(54 - emissionRate * 8);
        if (spawnTimerRef.current >= spawnThreshold) {
          spawnTimerRef.current = 0;
          photonsRef.current.push({
            id: nextPhotonId.current++,
            x: 60,
            y: 150 + (Math.random() - 0.5) * 8,
            vx: 3.5 * speedMultiplier,
            vy: 0,
            wavelength: currentLight.waveNumberCm,
            color: currentLight.color,
            type: lightType,
          });
        }
      }

      // 2. Clear canvas
      ctx.clearRect(0, 0, 600, 300);

      // Background subtle grid/chamber lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(70, 40);
      ctx.lineTo(540, 40);
      ctx.moveTo(70, 260);
      ctx.lineTo(540, 260);
      ctx.stroke();

      // 3. Draw Flashlight / Laser Emitter on the left
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      // Flashlight body
      ctx.fillRect(8, 120, 45, 60);
      ctx.strokeRect(8, 120, 45, 60);
      // Lens cone
      ctx.beginPath();
      ctx.moveTo(53, 120);
      ctx.lineTo(68, 110);
      ctx.lineTo(68, 190);
      ctx.lineTo(53, 180);
      ctx.closePath();
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.stroke();

      // Lens glow
      ctx.beginPath();
      ctx.ellipse(68, 150, 4, 38, 0, 0, Math.PI * 2);
      ctx.fillStyle = isEmitting ? currentLight.color : '#64748b';
      ctx.fill();

      // Laser badge text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(currentLight.name.toUpperCase(), 30, 153);

      // 4. Draw Detector Screen on the right
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(540, 60, 18, 180);
      ctx.strokeRect(540, 60, 18, 180);

      // Detector sensor segments
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(543, 70 + i * 23, 12, 16);
      }
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px monospace';
      ctx.save();
      ctx.translate(565, 150);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('PHOTOMETER DETECTOR', 0, 0);
      ctx.restore();

      // 5. Update Excitation Timers & Molecule Animation States
      if (activeExcitation === 'rotation') {
        rotationAngleRef.current += 0.06 * speedMultiplier;
        excitationTimerRef.current -= 0.02 * speedMultiplier;
        if (excitationTimerRef.current <= 0) {
          setActiveExcitation('none');
        }
      } else if (activeExcitation === 'vibration') {
        vibrationTickRef.current += 0.3 * speedMultiplier;
        excitationTimerRef.current -= 0.015 * speedMultiplier;
        if (excitationTimerRef.current <= 0) {
          // Re-emit IR photon in a random direction (Greenhouse Effect mechanism!)
          setActiveExcitation('reemission');
          const randomAngle = Math.random() * Math.PI * 2;
          const reSpeed = 3.2 * speedMultiplier;
          photonsRef.current.push({
            id: nextPhotonId.current++,
            x: molCenter.x,
            y: molCenter.y,
            vx: Math.cos(randomAngle) * reSpeed,
            vy: Math.sin(randomAngle) * reSpeed,
            wavelength: currentLight.waveNumberCm,
            color: '#f87171',
            type: 'infrared',
            isReemitted: true,
          });
          setTimeout(() => setActiveExcitation('none'), 300);
        }
      }

      // Dissociation progress animation
      if (isDissociated) {
        setDissociateProgress((prev) => Math.min(prev + 0.02 * speedMultiplier, 1.0));
      }

      // 6. Update and Draw Traveling Photons
      const remainingPhotons: Photon[] = [];
      photonsRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Draw photon as wave-packet (sine pulse or glowing sphere)
        ctx.save();
        ctx.translate(p.x, p.y);
        const heading = Math.atan2(p.vy, p.vx);
        ctx.rotate(heading);

        // Glowing outer halo
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = currentLight.glowColor;
        ctx.fill();

        // Wave packet sinewave
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.2;
        ctx.moveTo(-12, 0);
        for (let wx = -12; wx <= 12; wx += 2) {
          const wy = Math.sin((wx / 12) * Math.PI * 3) * 4;
          ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        // Central photon core
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        // Collision detection with center molecule (radius ~ 36px)
        const distToMol = Math.hypot(p.x - molCenter.x, p.y - molCenter.y);

        if (!p.isReemitted && distToMol < 28 && p.vx > 0) {
          // Check if molecule absorbs this photon
          if (absorptionRule.absorbs && !isDissociated) {
            // Photon absorbed!
            setPhotonsAbsorbed((prev) => prev + 1);

            if (absorptionRule.mode === 'rotation') {
              setActiveExcitation('rotation');
              excitationTimerRef.current = 2.5; // Rotate for 2.5s
            } else if (absorptionRule.mode === 'vibration') {
              setActiveExcitation('vibration');
              excitationTimerRef.current = 1.8; // Vibrate then re-emit!
            } else if (absorptionRule.mode === 'dissociation') {
              setIsDissociated(true);
              setDissociateProgress(0);
              // In continuous mode, automatically recombine after 3.5 seconds
              if (beamMode === 'continuous') {
                setTimeout(() => {
                  setIsDissociated(false);
                  setDissociateProgress(0);
                }, 3500);
              }
            }
            return; // Destroy photon
          }
        }

        // Check if photon hits right detector
        if (p.x >= 540 && !p.isReemitted) {
          setPhotonsTransmitted((prev) => prev + 1);
          return; // Absorbed by detector
        }

        // Keep inside canvas bounds
        if (p.x > -20 && p.x < 620 && p.y > -20 && p.y < 320) {
          remainingPhotons.push(p);
        }
      });
      photonsRef.current = remainingPhotons;

      // 7. Render Molecule at Center
      ctx.save();
      ctx.translate(molCenter.x, molCenter.y);

      // Apply rotation if rotating
      if (activeExcitation === 'rotation') {
        ctx.rotate(rotationAngleRef.current);
      }

      // Draw Excitation Aura / Glow
      if (activeExcitation === 'vibration' || activeExcitation === 'reemission') {
        ctx.beginPath();
        ctx.arc(0, 0, 52, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Vibration displacement math
      const vibDelta = activeExcitation === 'vibration' ? Math.sin(vibrationTickRef.current) * 6 : 0;
      const dissSep = isDissociated ? dissociateProgress * 65 : 0;

      // Render Ball-and-Stick per molecule
      if (molecule === 'co2') {
        // Linear O=C=O with bending vibration
        const bendY = activeExcitation === 'vibration' ? Math.sin(vibrationTickRef.current) * 8 : 0;

        // Left Bond
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-40 - (isDissociated ? dissSep : 0), bendY);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Right Bond (broken if dissociated)
        if (!isDissociated || dissociateProgress < 0.8) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(40 + (isDissociated ? dissSep : 0), bendY);
          ctx.strokeStyle = isDissociated ? '#f43f5e' : '#94a3b8';
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Center Carbon atom (Black/Dark Slate)
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', 0, 1);

        // Left Oxygen atom (Red)
        ctx.beginPath();
        ctx.arc(-40 - (isDissociated ? dissSep : 0), bendY, 13, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('O', -40 - (isDissociated ? dissSep : 0), bendY + 1);

        // Right Oxygen atom (Red)
        ctx.beginPath();
        ctx.arc(40 + (isDissociated ? dissSep : 0), bendY, 13, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('O', 40 + (isDissociated ? dissSep : 0), bendY + 1);
      } else if (molecule === 'h2o') {
        // Bent H-O-H (~104.5°)
        const oxyY = -10;
        const leftHX = -26 - vibDelta;
        const rightHX = 26 + vibDelta;
        const hyY = 22 + vibDelta * 0.5;

        // Bonds
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, oxyY);
        ctx.lineTo(leftHX, hyY);
        ctx.moveTo(0, oxyY);
        ctx.lineTo(rightHX, hyY);
        ctx.stroke();

        // Oxygen (Red)
        ctx.beginPath();
        ctx.arc(0, oxyY, 17, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('O', 0, oxyY + 1);

        // Hydrogen 1 (White / Light Blue)
        ctx.beginPath();
        ctx.arc(leftHX, hyY, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('H', leftHX, hyY + 1);

        // Hydrogen 2
        ctx.beginPath();
        ctx.arc(rightHX, hyY, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.fillText('H', rightHX, hyY + 1);
      } else if (molecule === 'ch4') {
        // Methane tetrahedral projection
        const arm = 30 + vibDelta;
        const coords = [
          { x: 0, y: -arm },
          { x: -arm * 0.9, y: arm * 0.5 },
          { x: arm * 0.9, y: arm * 0.5 },
          { x: 0, y: arm * 0.8 },
        ];

        // Bonds
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3.5;
        coords.forEach((c) => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
        });

        // Center Carbon
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', 0, 1);

        // 4 Hydrogens
        coords.forEach((c) => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('H', c.x, c.y + 0.5);
        });
      } else if (molecule === 'o3') {
        // Ozone O3 (O=O-O bent ~117°)
        // UV photolysis: O3 -> O2 + O
        const oY = -12;
        const oLeftX = -28 - (isDissociated ? dissSep * 0.5 : 0);
        const oRightX = 28 + (isDissociated ? dissSep * 1.2 : 0);
        const oBotY = 18 + (isDissociated ? dissSep * 0.4 : 0);

        // Bonds
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, oY);
        ctx.lineTo(oLeftX, oBotY);
        if (!isDissociated || dissociateProgress < 0.6) {
          ctx.moveTo(0, oY);
          ctx.lineTo(oRightX, oBotY);
        }
        ctx.stroke();

        // Apex Oxygen
        ctx.beginPath();
        ctx.arc(0, oY, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('O', 0, oY + 1);

        // Left Oxygen
        ctx.beginPath();
        ctx.arc(oLeftX, oBotY, 13, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('O', oLeftX, oBotY + 1);

        // Right Oxygen (Dissociates away in UV)
        ctx.beginPath();
        ctx.arc(oRightX, oBotY, 13, 0, Math.PI * 2);
        ctx.fillStyle = isDissociated ? '#ec4899' : '#a855f7';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('O', oRightX, oBotY + 1);
      } else if (molecule === 'n2') {
        // Diatomic N≡N
        const nDist = 22 + vibDelta * 0.3;
        // Triple bond lines
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-nDist, -4);
        ctx.lineTo(nDist, -4);
        ctx.moveTo(-nDist, 0);
        ctx.lineTo(nDist, 0);
        ctx.moveTo(-nDist, 4);
        ctx.lineTo(nDist, 4);
        ctx.stroke();

        // Nitrogen atoms (Blue)
        ctx.beginPath();
        ctx.arc(-nDist, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', -nDist, 1);

        ctx.beginPath();
        ctx.arc(nDist, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('N', nDist, 1);
      } else if (molecule === 'o2') {
        // Diatomic O=O
        const oDist = 20 + vibDelta * 0.3;
        // Double bond lines
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-oDist, -3);
        ctx.lineTo(oDist, -3);
        ctx.moveTo(-oDist, 3);
        ctx.lineTo(oDist, 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-oDist, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('O', -oDist, 1);

        ctx.beginPath();
        ctx.arc(oDist, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('O', oDist, 1);
      } else if (molecule === 'co') {
        // Diatomic C≡O
        const coDist = 20 + vibDelta * 0.3;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-coDist, -3);
        ctx.lineTo(coDist, -3);
        ctx.moveTo(-coDist, 3);
        ctx.lineTo(coDist, 3);
        ctx.stroke();

        // Carbon
        ctx.beginPath();
        ctx.arc(-coDist, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', -coDist, 1);

        // Oxygen
        ctx.beginPath();
        ctx.arc(coDist, 0, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#ea580c';
        ctx.fill();
        ctx.strokeStyle = '#fdba74';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('O', coDist, 1);
      } else if (molecule === 'no2') {
        // Bent O-N-O
        const nY = -10;
        const noLeftX = -28;
        const noRightX = 28 + (isDissociated ? dissSep * 1.2 : 0);
        const noBotY = 18;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, nY);
        ctx.lineTo(noLeftX, noBotY);
        if (!isDissociated || dissociateProgress < 0.6) {
          ctx.moveTo(0, nY);
          ctx.lineTo(noRightX, noBotY);
        }
        ctx.stroke();

        // Nitrogen (Blue)
        ctx.beginPath();
        ctx.arc(0, nY, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', 0, nY + 1);

        // Left Oxygen
        ctx.beginPath();
        ctx.arc(noLeftX, noBotY, 13, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('O', noLeftX, noBotY + 1);

        // Right Oxygen
        ctx.beginPath();
        ctx.arc(noRightX, noBotY, 13, 0, Math.PI * 2);
        ctx.fillStyle = isDissociated ? '#ec4899' : '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('O', noRightX, noBotY + 1);
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    isEmitting,
    beamMode,
    emissionRate,
    speedMultiplier,
    lightType,
    molecule,
    absorptionRule,
    isDissociated,
    activeExcitation,
    currentLight,
  ]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl" id="molecules-sim-container">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {tI18n('experiments.molecules_and_light.title')}
            </h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 6</p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Play / Pause Toggle */}
          <button
            id="molecules-play-pause-btn"
            type="button"
            onClick={() => setIsEmitting(!isEmitting)}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
            title={isEmitting ? tI18n('experiments.molecules_and_light.pauseBeam') : tI18n('experiments.molecules_and_light.playBeam')}
          >
            {isEmitting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isEmitting ? tI18n('experiments.molecules_and_light.pauseBeam') : tI18n('experiments.molecules_and_light.playBeam')}</span>
          </button>

          {/* Fire Single Photon */}
          <button
            id="molecules-fire-single-btn"
            type="button"
            onClick={fireSinglePhoton}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95"
            title={tI18n('experiments.molecules_and_light.fireSingle')}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{tI18n('experiments.molecules_and_light.fireSingle')}</span>
          </button>

          {/* Speed Toggle (1x vs 0.4x Slow-mo) */}
          <button
            id="molecules-speed-toggle-btn"
            type="button"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1.0 ? 0.4 : 1.0))}
            className={`flex items-center gap-1 px-3 py-1.5 min-h-[44px] text-xs font-semibold rounded-xl border transition-all ${
              speedMultiplier < 1.0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Slow Motion"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{speedMultiplier < 1.0 ? tI18n('experiments.molecules_and_light.speedSlow') : tI18n('experiments.molecules_and_light.speedNormal')}</span>
          </button>

          {/* Recombine Molecule (if dissociated) */}
          {isDissociated && (
            <button
              id="molecules-recombine-btn"
              type="button"
              onClick={handleRecombine}
              className="flex items-center gap-1 px-3 py-1.5 min-h-[44px] bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl transition-all shadow-md animate-bounce"
              title={tI18n('experiments.molecules_and_light.recombine')}
            >
              <Sparkles className="w-4 h-4" />
              <span>{tI18n('experiments.molecules_and_light.recombine')}</span>
            </button>
          )}

          {/* Log Measurement */}
          <button
            id="molecules-log-btn"
            type="button"
            onClick={handleLog}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              logged
                ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
            }`}
          >
            {logged ? <Check className="w-4 h-4" /> : <BookmarkCheck className="w-4 h-4" />}
            <span>{logged ? tI18n('experiments.molecules_and_light.logged') : tI18n('experiments.molecules_and_light.log')}</span>
          </button>

          {/* Reset All */}
          <button
            id="molecules-reset-btn"
            type="button"
            onClick={handleReset}
            className="p-2 min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center transition-colors"
            title={tI18n('experiments.molecules_and_light.reset')}
            aria-label="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Light Source (Radiation Band) Selection Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Radio className="w-3.5 h-3.5" />
            {tI18n('experiments.molecules_and_light.lightSource')}
          </span>
          <span className="text-[11px] font-mono text-slate-300">
            {currentLight.wavelengthStr} • E = {currentLight.energyEV} eV ({currentLight.transition})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(LIGHT_DATA) as LightType[]).map((type) => {
            const data = LIGHT_DATA[type];
            const isSelected = lightType === type;
            const Icon = data.icon;
            return (
              <button
                key={type}
                id={`light-source-${type}-btn`}
                type="button"
                onClick={() => setLightType(type)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-md ring-2 ring-offset-2 ring-offset-slate-900 font-bold'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
                style={{
                  borderColor: isSelected ? data.color : undefined,
                  boxShadow: isSelected ? `0 0 12px ${data.glowColor}` : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: data.color }} />
                  <span>{tI18n(`experiments.molecules_and_light.${type}`)}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                  {data.energyEV >= 1 ? `${data.energyEV} eV` : `${data.energyEV} eV`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Molecule Preset Selection Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
            <Waves className="w-3.5 h-3.5" />
            {tI18n('experiments.molecules_and_light.targetMolecule')}
          </span>
          <span className="text-[11px] font-mono text-slate-300">
            {currentMolecule.formula} ({currentMolecule.geometry}) • {tI18n('experiments.molecules_and_light.dipoleLabel')}: {currentMolecule.dipoleDebye} D
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {(Object.keys(MOLECULES_DATA) as MoleculeType[]).map((molKey) => {
            const molMeta = MOLECULES_DATA[molKey];
            const isSelected = molecule === molKey;
            return (
              <button
                key={molKey}
                id={`molecule-${molKey}-btn`}
                type="button"
                onClick={() => {
                  setMolecule(molKey);
                  setIsDissociated(false);
                  setDissociateProgress(0);
                  setActiveExcitation('none');
                }}
                className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 border transition-all ${
                  isSelected
                    ? `${molMeta.tagColor} shadow-md ring-2 ring-offset-2 ring-offset-slate-900 font-bold`
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="font-mono text-sm font-black tracking-tight">{molMeta.formula}</span>
                <span className="text-[10px] truncate max-w-full">
                  {molKey === 'co2' ? 'CO₂' : molKey === 'h2o' ? 'H₂O' : molKey === 'ch4' ? 'CH₄' : molKey === 'o3' ? 'O₃' : molKey.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Stage & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Chamber & Photometer Counters */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          {/* Top Stage Status & Mode Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-2">
              {/* Continuous vs Single Beam Mode Selector */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
                <button
                  id="molecules-mode-continuous-btn"
                  type="button"
                  onClick={() => setBeamMode('continuous')}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${
                    beamMode === 'continuous'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tI18n('experiments.molecules_and_light.continuousBeam')}
                </button>
                <button
                  id="molecules-mode-single-btn"
                  type="button"
                  onClick={() => setBeamMode('single')}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-all ${
                    beamMode === 'single'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tI18n('experiments.molecules_and_light.fireSingle')}
                </button>
              </div>
            </div>

            {/* Microscopic Response Status Pill */}
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                absorptionRule.mode === 'rotation'
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                  : absorptionRule.mode === 'vibration'
                  ? 'bg-red-950/80 text-red-300 border-red-500/40'
                  : absorptionRule.mode === 'dissociation'
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <span>{absorptionRule.absorbs ? '● Resonant Absorption' : '○ Transparent Transmission'}</span>
            </span>
          </div>

          {/* Interactive Canvas Chamber */}
          <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center shadow-inner">
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="w-full h-auto max-h-[330px] rounded-xl bg-slate-950 select-none"
            />
          </div>

          {/* Photometer Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between sm:flex-col sm:items-start">
              <span className="text-[10px] text-slate-400 font-mono">Total Photons (N)</span>
              <span className="text-base font-bold font-mono text-white">{totalPhotons}</span>
            </div>
            <div className="p-2.5 bg-red-950/30 border border-red-500/30 rounded-xl flex items-center justify-between sm:flex-col sm:items-start">
              <span className="text-[10px] text-red-300 font-mono">{tI18n('experiments.molecules_and_light.photonsAbsorbed')}</span>
              <span className="text-base font-bold font-mono text-red-400">{photonsAbsorbed}</span>
            </div>
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between sm:flex-col sm:items-start">
              <span className="text-[10px] text-emerald-300 font-mono">{tI18n('experiments.molecules_and_light.photonsTransmitted')}</span>
              <span className="text-base font-bold font-mono text-emerald-400">{photonsTransmitted}</span>
            </div>
            <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between sm:flex-col sm:items-start">
              <span className="text-[10px] text-amber-300 font-mono">{tI18n('experiments.molecules_and_light.absorptionRate')}</span>
              <span className="text-base font-bold font-mono text-amber-400">{absorptionPercentage}%</span>
            </div>
          </div>

          {/* Dynamic Effect Explanation Banner */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between text-amber-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                {tI18n('experiments.molecules_and_light.effect')}:
              </span>
              <button
                id="molecules-clear-counters-btn"
                type="button"
                onClick={handleClearCounters}
                className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                title={tI18n('experiments.molecules_and_light.clearCounters')}
              >
                <Trash2 className="w-3 h-3" />
                <span>{tI18n('experiments.molecules_and_light.clearCounters')}</span>
              </button>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              {absorptionRule.mode === 'rotation'
                ? tI18n('experiments.molecules_and_light.rotationMsg')
                : absorptionRule.mode === 'vibration'
                ? tI18n('experiments.molecules_and_light.vibrationMsg')
                : absorptionRule.mode === 'dissociation'
                ? tI18n('experiments.molecules_and_light.dissociationMsg')
                : tI18n('experiments.molecules_and_light.transmittedMsg')}
            </p>
            {lightType === 'infrared' && absorptionRule.absorbs && (
              <p className="text-red-300/90 text-[11px] pt-0.5 font-mono">
                {tI18n('experiments.molecules_and_light.reemissionMsg')}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Emission Rate Controls & Physics Quantum Laws */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
            {/* Photon Intensity / Emission Rate Stepper */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-red-400 flex items-center gap-1.5 text-sm">
                  <Sun className="w-4 h-4 text-red-400" />
                  {tI18n('experiments.molecules_and_light.emissionRate')}
                </span>
                <span className="font-mono text-white text-base font-bold bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md">
                  {emissionRate} photons/s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="emission-decrement-btn"
                  type="button"
                  onClick={() => setEmissionRate((prev) => Math.max(1, prev - 1))}
                  disabled={emissionRate <= 1}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Decrease Emission Rate"
                  aria-label="Decrease Emission Rate"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="emission-range-slider"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={emissionRate}
                  onChange={(e) => setEmissionRate(Number(e.target.value))}
                  className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <button
                  id="emission-increment-btn"
                  type="button"
                  onClick={() => setEmissionRate((prev) => Math.min(5, prev + 1))}
                  disabled={emissionRate >= 5}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 border border-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Increase Emission Rate"
                  aria-label="Increase Emission Rate"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                <span>Low Intensity</span>
                <span>Max Beam Density</span>
              </div>
            </div>

            {/* Target Molecular Properties Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Formula & Structure:</span>
                <span className="text-white font-bold">{currentMolecule.formula} ({currentMolecule.geometry})</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{tI18n('experiments.molecules_and_light.dipoleLabel')}:</span>
                <span className="text-sky-300 font-bold">{currentMolecule.dipoleDebye} Debye ({currentMolecule.isPolar ? 'Polar' : 'Non-polar'})</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Bond Energy:</span>
                <span className="text-amber-300 font-bold">{currentMolecule.bondEnergyEV} eV</span>
              </div>
              <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1.5">
                <span>Greenhouse Gas Role:</span>
                <span className={`font-bold ${currentMolecule.greenhouse ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {currentMolecule.greenhouse ? 'Active IR Absorber' : 'IR Transparent'}
                </span>
              </div>
            </div>
          </div>

          {/* Quantum Physical Law Card */}
          <div className="p-4 bg-gradient-to-br from-red-950/40 to-slate-950/80 border border-red-500/40 rounded-2xl space-y-3 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-300 font-bold uppercase tracking-wider block">
                {tI18n('experiments.molecules_and_light.quantumTransition')}
              </span>
              <span className="text-[11px] font-mono text-red-300 bg-red-900/60 border border-red-700/50 px-2 py-0.5 rounded-full">
                ΔE = h · f
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-red-300 font-mono tracking-tight">
              {currentLight.energyEV >= 1 ? currentLight.energyEV.toFixed(2) : currentLight.energyEV.toFixed(5)}{' '}
              <span className="text-sm font-normal text-red-400">eV</span>
            </div>

            {/* Readout Breakdown */}
            <div className="space-y-1.5 text-xs font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between text-slate-300">
                <span>Frequency (f):</span>
                <span className="text-amber-300 font-bold">{currentLight.frequencyHz.toExponential(2)} Hz</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Energy (Joules):</span>
                <span className="text-sky-300 font-bold">{currentLight.energyJoules.toExponential(2)} J</span>
              </div>
              <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1">
                <span>Hierarchy:</span>
                <span className="text-purple-300 font-bold">E_rot &lt; E_vib &lt; E_elec</span>
              </div>
            </div>

            {/* Mathematical Law */}
            <p className="text-[11px] text-red-200/90 leading-relaxed font-mono bg-red-950/60 p-2.5 rounded-lg border border-red-900/60">
              E_photon = h · c / λ
              <br />
              h = 6.626 × 10⁻³⁴ J·s (4.136 × 10⁻¹⁵ eV·s)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
