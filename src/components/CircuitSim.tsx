import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Power, 
  Zap, 
  Activity, 
  BookmarkCheck, 
  RotateCcw, 
  Sliders, 
  BarChart3, 
  Gauge, 
  Flame, 
  Sparkles, 
  Info,
  Radio,
  Lightbulb,
  Check,
  PlusCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (record: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

type CircuitTopology = 'single' | 'series2' | 'series3' | 'parallel2' | 'parallel3' | 'mixed' | 'lampCircuit';
type ProbeTarget = 'all' | 'r1' | 'r2' | 'r3';
type FlowType = 'electrons' | 'conventional';

export default function CircuitSim({ lang, onLogMeasurement }: Props) {
  const { t } = useTranslation();

  // Core Circuit State Parameters
  const [voltage, setVoltage] = useState<number>(12.0); // Volts (0.5 to 48.0)
  const [r1, setR1] = useState<number>(10); // Ohms (1 to 200)
  const [r2, setR2] = useState<number>(20); // Ohms (1 to 200)
  const [r3, setR3] = useState<number>(30); // Ohms (1 to 200)
  const [lampNominalResistance] = useState<number>(25); // Ohms for light bulb
  const [topology, setTopology] = useState<CircuitTopology>('series2');
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(true);
  const [flowType, setFlowType] = useState<FlowType>('electrons');
  const [showCurrentFlow, setShowCurrentFlow] = useState<boolean>(true);
  const [selectedProbe, setSelectedProbe] = useState<ProbeTarget>('all');
  const [showIVGraph, setShowIVGraph] = useState<boolean>(true);
  const [isHoveringSwitch, setIsHoveringSwitch] = useState<boolean>(false);
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);

  // Canvas Refs & Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ivCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const electronPhaseRef = useRef<number>(0);

  // Electrical Physics Calculations
  const calculations = useMemo(() => {
    if (!isSwitchClosed) {
      return {
        req: Infinity,
        totalCurrent: 0,
        totalPower: 0,
        v_r1: 0,
        v_r2: 0,
        v_r3: 0,
        i_r1: 0,
        i_r2: 0,
        i_r3: 0,
        p_r1: 0,
        p_r2: 0,
        p_r3: 0,
        v_lamp: 0,
        i_lamp: 0,
        p_lamp: 0,
      };
    }

    let req = 0;
    let v_r1 = 0, v_r2 = 0, v_r3 = 0;
    let i_r1 = 0, i_r2 = 0, i_r3 = 0;
    let p_r1 = 0, p_r2 = 0, p_r3 = 0;
    let v_lamp = 0, i_lamp = 0, p_lamp = 0;

    switch (topology) {
      case 'single':
        req = r1;
        break;
      case 'series2':
        req = r1 + r2;
        break;
      case 'series3':
        req = r1 + r2 + r3;
        break;
      case 'parallel2':
        req = (r1 * r2) / (r1 + r2);
        break;
      case 'parallel3':
        req = 1 / (1 / r1 + 1 / r2 + 1 / r3);
        break;
      case 'mixed': {
        const r23 = (r2 * r3) / (r2 + r3);
        req = r1 + r23;
        break;
      }
      case 'lampCircuit':
        req = r1 + lampNominalResistance;
        break;
      default:
        req = r1;
    }

    const totalCurrent = req > 0 ? voltage / req : 0;
    const totalPower = voltage * totalCurrent;

    // Component-level distributions
    switch (topology) {
      case 'single':
        v_r1 = voltage;
        i_r1 = totalCurrent;
        p_r1 = v_r1 * i_r1;
        break;

      case 'series2':
        i_r1 = totalCurrent;
        i_r2 = totalCurrent;
        v_r1 = totalCurrent * r1;
        v_r2 = totalCurrent * r2;
        p_r1 = v_r1 * i_r1;
        p_r2 = v_r2 * i_r2;
        break;

      case 'series3':
        i_r1 = totalCurrent;
        i_r2 = totalCurrent;
        i_r3 = totalCurrent;
        v_r1 = totalCurrent * r1;
        v_r2 = totalCurrent * r2;
        v_r3 = totalCurrent * r3;
        p_r1 = v_r1 * i_r1;
        p_r2 = v_r2 * i_r2;
        p_r3 = v_r3 * i_r3;
        break;

      case 'parallel2':
        v_r1 = voltage;
        v_r2 = voltage;
        i_r1 = voltage / r1;
        i_r2 = voltage / r2;
        p_r1 = v_r1 * i_r1;
        p_r2 = v_r2 * i_r2;
        break;

      case 'parallel3':
        v_r1 = voltage;
        v_r2 = voltage;
        v_r3 = voltage;
        i_r1 = voltage / r1;
        i_r2 = voltage / r2;
        i_r3 = voltage / r3;
        p_r1 = v_r1 * i_r1;
        p_r2 = v_r2 * i_r2;
        p_r3 = v_r3 * i_r3;
        break;

      case 'mixed': {
        const r23 = (r2 * r3) / (r2 + r3);
        i_r1 = totalCurrent;
        v_r1 = totalCurrent * r1;
        p_r1 = v_r1 * i_r1;

        const v23 = totalCurrent * r23;
        v_r2 = v23;
        v_r3 = v23;
        i_r2 = v23 / r2;
        i_r3 = v23 / r3;
        p_r2 = v_r2 * i_r2;
        p_r3 = v_r3 * i_r3;
        break;
      }

      case 'lampCircuit':
        i_r1 = totalCurrent;
        v_r1 = totalCurrent * r1;
        p_r1 = v_r1 * i_r1;

        i_lamp = totalCurrent;
        v_lamp = totalCurrent * lampNominalResistance;
        p_lamp = v_lamp * i_lamp;
        break;
    }

    return {
      req,
      totalCurrent,
      totalPower,
      v_r1,
      v_r2,
      v_r3,
      i_r1,
      i_r2,
      i_r3,
      p_r1,
      p_r2,
      p_r3,
      v_lamp,
      i_lamp,
      p_lamp,
    };
  }, [isSwitchClosed, topology, voltage, r1, r2, r3, lampNominalResistance]);

  // Multimeter Displayed Values depending on Probe Target
  const probeReadouts = useMemo(() => {
    const {
      req, totalCurrent, totalPower,
      v_r1, v_r2, v_r3, i_r1, i_r2, i_r3, p_r1, p_r2, p_r3,
    } = calculations;

    if (!isSwitchClosed) {
      return {
        voltage: 0,
        current: 0,
        resistance: '∞',
        power: 0,
        label: t('experiments.circuits.probeAll'),
      };
    }

    switch (selectedProbe) {
      case 'r1':
        return {
          voltage: v_r1,
          current: i_r1,
          resistance: `${r1.toFixed(1)} Ω`,
          power: p_r1,
          label: 'Resistor 1 (R₁)',
        };
      case 'r2':
        return {
          voltage: v_r2,
          current: i_r2,
          resistance: `${r2.toFixed(1)} Ω`,
          power: p_r2,
          label: 'Resistor 2 (R₂)',
        };
      case 'r3':
        return {
          voltage: v_r3,
          current: i_r3,
          resistance: `${r3.toFixed(1)} Ω`,
          power: p_r3,
          label: 'Resistor 3 (R₃)',
        };
      case 'all':
      default:
        return {
          voltage: voltage,
          current: totalCurrent,
          resistance: `${req.toFixed(2)} Ω`,
          power: totalPower,
          label: t('experiments.circuits.probeAll'),
        };
    }
  }, [calculations, isSwitchClosed, selectedProbe, voltage, r1, r2, r3, t]);

  // Quick Preset Handlers
  const handlePresetVoltage = (v: number) => setVoltage(v);

  const handleResetCircuit = () => {
    setVoltage(12.0);
    setR1(10);
    setR2(20);
    setR3(30);
    setTopology('series2');
    setIsSwitchClosed(true);
    setSelectedProbe('all');
  };

  // Helper for Resistor 4-Band Color Codes
  const getResistorBands = (val: number) => {
    const digitColors = [
      '#0f172a', // 0 Black
      '#854d0e', // 1 Brown
      '#dc2626', // 2 Red
      '#ea580c', // 3 Orange
      '#eab308', // 4 Yellow
      '#22c55e', // 5 Green
      '#2563eb', // 6 Blue
      '#7c3aed', // 7 Violet
      '#64748b', // 8 Gray
      '#f8fafc', // 9 White
    ];
    const rounded = Math.max(1, Math.round(val));
    const str = rounded.toString();
    const d1 = parseInt(str[0], 10) || 1;
    const d2 = str.length > 1 ? parseInt(str[1], 10) : 0;
    const mult = Math.max(0, str.length - 2);

    return {
      band1: digitColors[d1] || '#854d0e',
      band2: digitColors[d2] || '#0f172a',
      multBand: digitColors[mult % digitColors.length] || '#0f172a',
      tolBand: '#fbbf24', // Gold 5%
    };
  };

  // Main Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    const isConducting = isSwitchClosed && calculations.totalCurrent > 0;

    const render = (now?: number) => {
      if (now !== undefined) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (isConducting && showCurrentFlow) {
          const flowDirMultiplier = flowType === 'electrons' ? 1 : -1;
          electronPhaseRef.current += calculations.totalCurrent * dt * 3.2 * flowDirMultiplier;
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep Tech Canvas Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(1, '#0b1329');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Grid Pattern
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      for (let x = 20; x < w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 20; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const marginX = 80;
      const marginY = 60;
      const x1 = marginX;
      const y1 = marginY;
      const x2 = w - marginX;
      const y2 = h - marginY;

      // 1. Draw Conducting Wires
      ctx.strokeStyle = isConducting ? '#38bdf8' : '#475569';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Glow on live wire
      if (isConducting) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = Math.min(12, calculations.totalCurrent * 4 + 2);
      } else {
        ctx.shadowBlur = 0;
      }

      // Top Wire & Switch Gap
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const switchX = (x1 + x2) / 2 - 35;
      ctx.lineTo(switchX, y1);

      if (isSwitchClosed) {
        ctx.lineTo(switchX + 35, y1);
      } else {
        ctx.lineTo(switchX + 26, y1 - 22);
      }
      ctx.moveTo(switchX + 35, y1);
      ctx.lineTo(x2, y1);

      // Right Wire
      ctx.lineTo(x2, y2);

      // Bottom Wire & Left Wire
      ctx.lineTo(x1, y2);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // 2. Switch Contacts & Lever
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(switchX, y1, 5, 0, Math.PI * 2);
      ctx.arc(switchX + 35, y1, 5, 0, Math.PI * 2);
      ctx.fill();

      // Switch Lever (draw distinct arm)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(switchX, y1);
      if (isSwitchClosed) {
        ctx.lineTo(switchX + 35, y1);
      } else {
        ctx.lineTo(switchX + 26, y1 - 22);
      }
      ctx.stroke();

      // Switch Label
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = isSwitchClosed ? '#34d399' : '#f87171';
      ctx.fillText(
        isSwitchClosed ? t('experiments.circuits.canvasClosedState') : t('experiments.circuits.canvasOpenState'),
        switchX + 17,
        y1 - 24
      );
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(t('experiments.circuits.canvasSwitchHint'), switchX + 17, y1 - 10);

      // Hover feedback circle
      if (isHoveringSwitch) {
        ctx.strokeStyle = isSwitchClosed ? 'rgba(52, 211, 153, 0.6)' : 'rgba(248, 113, 113, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(switchX + 17, y1 - 6, 28, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Draw Battery Source (Left vertical leg)
      const batY = (y1 + y2) / 2;
      ctx.fillStyle = '#020617';
      ctx.fillRect(x1 - 22, batY - 32, 44, 64);

      // Positive Long Plate (Red)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(x1 - 20, batY - 12);
      ctx.lineTo(x1 + 20, batY - 12);
      ctx.stroke();

      // Negative Short Thick Plate (Blue)
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x1 - 12, batY + 12);
      ctx.lineTo(x1 + 12, batY + 12);
      ctx.stroke();

      // Polarity Marks & Voltage Tag
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f87171';
      ctx.fillText('+', x1 - 28, batY - 9);
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('−', x1 - 28, batY + 14);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${voltage.toFixed(1)}V`, x1 - 42, batY + 3);

      // 4. Draw Resistors and Loads on Bottom / Branches
      const drawResistor = (cx: number, cy: number, resistanceVal: number, label: string, vVal: number, iVal: number, pVal: number, isProbed: boolean) => {
        const rw = 64;
        const rh = 26;

        ctx.save();
        // Highlight border if probed
        if (isProbed) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(cx - rw / 2 - 4, cy - rh / 2 - 4, rw + 8, rh + 8);
        }

        // Resistor body (Ceramic / Carbon beige)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - rw / 2, cy - rh / 2, rw, rh);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);

        // Color Bands
        const { band1, band2, multBand, tolBand } = getResistorBands(resistanceVal);
        ctx.fillStyle = band1;
        ctx.fillRect(cx - 20, cy - rh / 2 + 2, 5, rh - 4);
        ctx.fillStyle = band2;
        ctx.fillRect(cx - 9, cy - rh / 2 + 2, 5, rh - 4);
        ctx.fillStyle = multBand;
        ctx.fillRect(cx + 3, cy - rh / 2 + 2, 5, rh - 4);
        ctx.fillStyle = tolBand;
        ctx.fillRect(cx + 17, cy - rh / 2 + 2, 4, rh - 4);

        // Text Info Tags
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(`${label}: ${resistanceVal}Ω`, cx, cy - rh / 2 - 8);

        // Live Voltage / Current badge
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = isConducting ? '#38bdf8' : '#64748b';
        ctx.fillText(`${vVal.toFixed(1)}V | ${iVal.toFixed(2)}A`, cx, cy + rh / 2 + 14);

        // Dissipated Power tag
        ctx.font = '9px monospace';
        ctx.fillStyle = isConducting ? '#f59e0b' : '#64748b';
        ctx.fillText(`${pVal.toFixed(2)}W`, cx, cy + rh / 2 + 25);

        ctx.restore();
      };

      // Draw Topologies
      if (topology === 'single') {
        const cx = (x1 + x2) / 2;
        drawResistor(cx, y2, r1, 'R₁', calculations.v_r1, calculations.i_r1, calculations.p_r1, selectedProbe === 'r1');
      } else if (topology === 'series2') {
        const cx1 = x1 + (x2 - x1) * 0.35;
        const cx2 = x1 + (x2 - x1) * 0.65;
        drawResistor(cx1, y2, r1, 'R₁', calculations.v_r1, calculations.i_r1, calculations.p_r1, selectedProbe === 'r1');
        drawResistor(cx2, y2, r2, 'R₂', calculations.v_r2, calculations.i_r2, calculations.p_r2, selectedProbe === 'r2');
      } else if (topology === 'series3') {
        const cx1 = x1 + (x2 - x1) * 0.25;
        const cx2 = x1 + (x2 - x1) * 0.50;
        const cx3 = x1 + (x2 - x1) * 0.75;
        drawResistor(cx1, y2, r1, 'R₁', calculations.v_r1, calculations.i_r1, calculations.p_r1, selectedProbe === 'r1');
        drawResistor(cx2, y2, r2, 'R₂', calculations.v_r2, calculations.i_r2, calculations.p_r2, selectedProbe === 'r2');
        drawResistor(cx3, y2, r3, 'R₃', calculations.v_r3, calculations.i_r3, calculations.p_r3, selectedProbe === 'r3');
      } else if (topology === 'parallel2') {
        const bx1 = x1 + (x2 - x1) * 0.3;
        const bx2 = x1 + (x2 - x1) * 0.7;
        const midY1 = y2 - 45;
        const midY2 = y2 + 45;

        ctx.strokeStyle = isConducting ? '#38bdf8' : '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx1, y2);
        ctx.lineTo(bx1, midY1);
        ctx.lineTo(bx2, midY1);
        ctx.lineTo(bx2, y2);

        ctx.moveTo(bx1, y2);
        ctx.lineTo(bx1, midY2);
        ctx.lineTo(bx2, midY2);
        ctx.lineTo(bx2, y2);
        ctx.stroke();

        const branchCx = (bx1 + bx2) / 2;
        drawResistor(branchCx, midY1, r1, 'R₁', calculations.v_r1, calculations.i_r1, calculations.p_r1, selectedProbe === 'r1');
        drawResistor(branchCx, midY2, r2, 'R₂', calculations.v_r2, calculations.i_r2, calculations.p_r2, selectedProbe === 'r2');
      } else if (topology === 'parallel3') {
        const bx1 = x1 + (x2 - x1) * 0.28;
        const bx2 = x1 + (x2 - x1) * 0.72;
        const midY1 = y2 - 60;
        const midY2 = y2;
        const midY3 = y2 + 60;

        ctx.strokeStyle = isConducting ? '#38bdf8' : '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx1, y2);
        ctx.lineTo(bx1, midY1);
        ctx.lineTo(bx2, midY1);
        ctx.lineTo(bx2, y2);

        ctx.moveTo(bx1, y2);
        ctx.lineTo(bx1, midY3);
        ctx.lineTo(bx2, midY3);
        ctx.lineTo(bx2, y2);
        ctx.stroke();

        const branchCx = (bx1 + bx2) / 2;
        drawResistor(branchCx, midY1, r1, 'R₁', calculations.v_r1, calculations.i_r1, calculations.p_r1, selectedProbe === 'r1');
        drawResistor(branchCx, midY2, r2, 'R₂', calculations.v_r2, calculations.i_r2, calculations.p_r2, selectedProbe === 'r2');
        drawResistor(branchCx, midY3, r3, 'R₃', calculations.v_r3, calculations.i_r3, calculations.p_r3, selectedProbe === 'r3');
      } else if (topology === 'mixed') {
        // R1 in series with (R2 || R3)
        const r1Cx = x1 + (x2 - x1) * 0.25;
        drawResistor(r1Cx, y2, r1, 'R₁', calculations.v_r1, calculations.i_r1, calculations.p_r1, selectedProbe === 'r1');

        const bx1 = x1 + (x2 - x1) * 0.50;
        const bx2 = x1 + (x2 - x1) * 0.85;
        const midY1 = y2 - 45;
        const midY2 = y2 + 45;

        ctx.strokeStyle = isConducting ? '#38bdf8' : '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx1, y2);
        ctx.lineTo(bx1, midY1);
        ctx.lineTo(bx2, midY1);
        ctx.lineTo(bx2, y2);

        ctx.moveTo(bx1, y2);
        ctx.lineTo(bx1, midY2);
        ctx.lineTo(bx2, midY2);
        ctx.lineTo(bx2, y2);
        ctx.stroke();

        const branchCx = (bx1 + bx2) / 2;
        drawResistor(branchCx, midY1, r2, 'R₂', calculations.v_r2, calculations.i_r2, calculations.p_r2, selectedProbe === 'r2');
        drawResistor(branchCx, midY2, r3, 'R₃', calculations.v_r3, calculations.i_r3, calculations.p_r3, selectedProbe === 'r3');
      } else if (topology === 'lampCircuit') {
        const r1Cx = x1 + (x2 - x1) * 0.35;
        drawResistor(r1Cx, y2, r1, 'Rheostat (R₁)', calculations.v_r1, calculations.i_r1, calculations.p_r1, selectedProbe === 'r1');

        // Draw Lamp Load on bottom right
        const lampCx = x1 + (x2 - x1) * 0.70;
        const lampCy = y2;
        const lampPwr = calculations.p_lamp;
        const glowRatio = Math.min(1, lampPwr / 20);

        if (isConducting && glowRatio > 0.05) {
          const radialGrad = ctx.createRadialGradient(lampCx, lampCy, 6, lampCx, lampCy, 45 * glowRatio + 12);
          radialGrad.addColorStop(0, `rgba(251, 191, 36, ${0.9 * glowRatio})`);
          radialGrad.addColorStop(0.5, `rgba(245, 158, 11, ${0.4 * glowRatio})`);
          radialGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = radialGrad;
          ctx.beginPath();
          ctx.arc(lampCx, lampCy, 50 * glowRatio + 15, 0, Math.PI * 2);
          ctx.fill();
        }

        // Bulb Glass
        ctx.fillStyle = isConducting && lampPwr > 0.1 ? '#fef08a' : '#1e293b';
        ctx.beginPath();
        ctx.arc(lampCx, lampCy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Bulb Filament
        ctx.strokeStyle = isConducting && lampPwr > 0.1 ? '#ea580c' : '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lampCx - 6, lampCy + 8);
        ctx.lineTo(lampCx - 3, lampCy - 5);
        ctx.lineTo(lampCx + 3, lampCy - 5);
        ctx.lineTo(lampCx + 6, lampCy + 8);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(`Lamp (${lampNominalResistance}Ω)`, lampCx, lampCy - 22);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = isConducting ? '#38bdf8' : '#64748b';
        ctx.fillText(`${calculations.v_lamp.toFixed(1)}V | ${calculations.i_lamp.toFixed(2)}A`, lampCx, lampCy + 30);
        ctx.font = '9px monospace';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`${calculations.p_lamp.toFixed(2)}W`, lampCx, lampCy + 42);
      }

      // 5. Light Bulb Indicator on Right Vertical Wire
      if (topology !== 'lampCircuit') {
        const bulbY = (y1 + y2) / 2;
        const pwr = calculations.totalPower;
        const glowRatio = Math.min(1, pwr / 30);

        if (isConducting && glowRatio > 0.05) {
          const radialGrad = ctx.createRadialGradient(x2, bulbY, 5, x2, bulbY, 40 * glowRatio + 10);
          radialGrad.addColorStop(0, `rgba(250, 204, 21, ${0.85 * glowRatio})`);
          radialGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
          ctx.fillStyle = radialGrad;
          ctx.beginPath();
          ctx.arc(x2, bulbY, 45 * glowRatio + 10, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = isConducting && pwr > 0.1 ? '#fef08a' : '#1e293b';
        ctx.beginPath();
        ctx.arc(x2, bulbY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = isConducting && pwr > 0.1 ? '#ea580c' : '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x2 - 5, bulbY + 7);
        ctx.lineTo(x2 - 2, bulbY - 5);
        ctx.lineTo(x2 + 2, bulbY - 5);
        ctx.lineTo(x2 + 5, bulbY + 7);
        ctx.stroke();
      }

      // 6. Animated Electron Flow or Conventional Current Particles
      if (showCurrentFlow && isConducting) {
        const perimeter = 2 * (x2 - x1 + (y2 - y1));
        const numParticles = 26;

        ctx.fillStyle = flowType === 'electrons' ? '#facc15' : '#38bdf8';
        for (let i = 0; i < numParticles; i++) {
          const dist =
            ((i * (perimeter / numParticles) + electronPhaseRef.current * 35) % perimeter + perimeter) % perimeter;

          // Wire perimeter coordinate calculation
          const topW = x2 - x1;
          const rightH = y2 - y1;
          const bottomW = topW;

          let px = x1;
          let py = y1;

          if (dist < topW) {
            px = x1 + dist;
            py = y1;
          } else if (dist < topW + rightH) {
            px = x2;
            py = y1 + (dist - topW);
          } else if (dist < topW + rightH + bottomW) {
            px = x2 - (dist - topW - rightH);
            py = y2;
          } else {
            px = x1;
            py = y2 - (dist - topW - rightH - bottomW);
          }

          ctx.beginPath();
          ctx.arc(px, py, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Open Circuit Badge
      if (!isSwitchClosed) {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.8;
        const bw = 300;
        const bh = 54;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 12);
        } else {
          ctx.rect(cx - bw / 2, cy - bh / 2, bw, bh);
        }
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText(t('experiments.circuits.canvasOpenState'), cx, cy - 6);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText('I = 0.000 A  |  Req = ∞ Ω  |  P = 0.00 W', cx, cy + 14);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    isSwitchClosed,
    calculations,
    voltage,
    r1,
    r2,
    r3,
    topology,
    lampNominalResistance,
    selectedProbe,
    flowType,
    showCurrentFlow,
    isHoveringSwitch,
    t,
  ]);

  // I-V Characteristic Curve (Ohm's Law Graph) Canvas
  useEffect(() => {
    if (!showIVGraph) return;
    const canvas = ivCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep Tech Graph Box
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    const padL = 45;
    const padR = 20;
    const padT = 20;
    const padB = 35;
    const graphW = w - padL - padR;
    const graphH = h - padT - padB;

    const maxV = 50; // max 50V
    const maxI = 5.0; // max 5.0A

    // Draw Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let vStep = 10; vStep <= maxV; vStep += 10) {
      const gx = padL + (vStep / maxV) * graphW;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + graphH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${vStep}V`, gx, padT + graphH + 14);
    }

    for (let iStep = 1.0; iStep <= maxI; iStep += 1.0) {
      const gy = padT + graphH - (iStep / maxI) * graphH;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + graphW, gy);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${iStep}A`, padL - 6, gy + 3);
    }

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + graphH);
    ctx.lineTo(padL + graphW, padT + graphH);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Voltage V (Volts)', padL + graphW / 2, padT + graphH + 28);

    ctx.save();
    ctx.translate(14, padT + graphH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Current I (Amps)', 0, 0);
    ctx.restore();

    // Plot Linear Ohm's Law Line (I = V / Req)
    const effectiveReq = calculations.req > 0 && calculations.req !== Infinity ? calculations.req : 0;
    if (effectiveReq > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(padL, padT + graphH);

      const endV = maxV;
      const endI = endV / effectiveReq;
      const endX = padL + (endV / maxV) * graphW;
      const endY = padT + graphH - Math.min(graphH, (endI / maxI) * graphH);

      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Current Operating Point Dot
      if (isSwitchClosed) {
        const opX = padL + (voltage / maxV) * graphW;
        const opY = padT + graphH - (calculations.totalCurrent / maxI) * graphH;

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(opX, padT + graphH);
        ctx.lineTo(opX, opY);
        ctx.lineTo(padL, opY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(opX, opY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`(${voltage}V, ${calculations.totalCurrent.toFixed(2)}A)`, opX + 8, opY - 6);
      }
    }
  }, [showIVGraph, calculations, voltage, isSwitchClosed]);

  // Canvas Click & Hover Handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const marginX = 80;
    const marginY = 60;
    const switchX = (marginX + (canvas.width - marginX)) / 2 - 35;
    const switchY = marginY;

    if (clickX >= switchX - 30 && clickX <= switchX + 65 && clickY >= switchY - 40 && clickY <= switchY + 30) {
      setIsSwitchClosed((prev) => !prev);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const marginX = 80;
    const marginY = 60;
    const switchX = (marginX + (canvas.width - marginX)) / 2 - 35;
    const switchY = marginY;

    const hovering = mx >= switchX - 30 && mx <= switchX + 65 && my >= switchY - 40 && my <= switchY + 30;
    setIsHoveringSwitch(hovering);
  };

  // Log Experiment Data
  const handleLog = () => {
    onLogMeasurement({
      experiment: 'circuits',
      variableName: t('experiments.circuits.varTotalCurrent'),
      measuredValue: parseFloat(calculations.totalCurrent.toFixed(3)),
      theoreticalValue: parseFloat((isSwitchClosed && calculations.req > 0 ? voltage / calculations.req : 0).toFixed(3)),
      unit: 'A',
      parameters: {
        Supply_Voltage: `${voltage.toFixed(1)} V`,
        Circuit_Topology: topology.toUpperCase(),
        Circuit_State: isSwitchClosed ? 'Closed (Conducting)' : 'Open (Disconnected)',
        Equivalent_Resistance: isSwitchClosed ? `${calculations.req.toFixed(2)} Ω` : '∞ (Open Circuit)',
        Total_Current: `${calculations.totalCurrent.toFixed(3)} A`,
        Total_Dissipated_Power: `${calculations.totalPower.toFixed(2)} W`,
        Resistor_1_R1: `${r1} Ω (VR1=${calculations.v_r1.toFixed(2)}V, IR1=${calculations.i_r1.toFixed(2)}A)`,
        Resistor_2_R2: topology !== 'single' ? `${r2} Ω (VR2=${calculations.v_r2.toFixed(2)}V, IR2=${calculations.i_r2.toFixed(2)}A)` : 'N/A',
        Resistor_3_R3: (topology === 'series3' || topology === 'parallel3' || topology === 'mixed') ? `${r3} Ω (VR3=${calculations.v_r3.toFixed(2)}V, IR3=${calculations.i_r3.toFixed(2)}A)` : 'N/A',
        Probed_Target: selectedProbe.toUpperCase(),
      },
      notes: isSwitchClosed
        ? t('experiments.circuits.notesText')
        : (lang === 'ar'
            ? 'تم فحص وتسجيل حالة الدائرة المفتوحة (انقطاع تام للتيار والمقاومة المكافئة لا نهائية).'
            : lang === 'ku'
            ? 'پشکنین و تۆمارکردنی دۆخی خولگەی کراوە (پچڕانی تەزوو و بەرگری هاوتا بێ کۆتایە).'
            : lang === 'kmr'
            ? 'Kontrolkirin û qeydkirina rewşa çerxeya vekirî (herikîn sifir e û berxwedan bêdawî ye).'
            : 'Verified and logged open circuit state (zero current and infinite resistance).'),
    });

    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 2500);
  };

  return (
    <div id="circuit-simulation-root" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none">
      
      {/* 1. Header Bar: Title, Subtitle, and Quick Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-sky-500/20 to-indigo-500/10 border border-sky-500/30 rounded-xl text-sky-400 shadow-inner shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{t('experiments.circuits.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-sky-300 whitespace-nowrap">
                V = I · R | P = V · I
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{t('experiments.circuits.subtitle')}</p>
          </div>
        </div>

        {/* Header Action Buttons - Protected against overflow */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Main Circuit Switch Toggle */}
          <button
            id="btn-circuit-switch-toggle"
            onClick={() => setIsSwitchClosed(!isSwitchClosed)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 border ${
              isSwitchClosed
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 shadow-lg shadow-emerald-950/40'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30 shadow-lg shadow-rose-950/40'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSwitchClosed ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <Power className="w-4 h-4 shrink-0" />
            <span>{isSwitchClosed ? t('experiments.circuits.switchOn') : t('experiments.circuits.switchOff')}</span>
          </button>

          {/* Log Measurement Button */}
          <button
            id="btn-circuit-log-data"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              loggedSuccess
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span>{loggedSuccess ? (t('common.saved') || 'Saved ✓') : (t('common.log') || 'Log Data')}</span>
          </button>

          {/* Reset Circuit Button */}
          <button
            id="btn-circuit-reset"
            onClick={handleResetCircuit}
            title={t('common.reset') || 'Reset'}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center shrink-0"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
          </button>

        </div>
      </div>

      {/* 2. Topologies & Presets Selector Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap me-1">
              {t('experiments.circuits.circuitType')}:
            </span>

            <button
              id="btn-topology-single"
              onClick={() => setTopology('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                topology === 'single'
                  ? 'bg-sky-500/20 border-sky-500/70 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              1️⃣ {t('experiments.circuits.single')}
            </button>

            <button
              id="btn-topology-series2"
              onClick={() => setTopology('series2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                topology === 'series2'
                  ? 'bg-sky-500/20 border-sky-500/70 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🔗 {t('experiments.circuits.series2')}
            </button>

            <button
              id="btn-topology-series3"
              onClick={() => setTopology('series3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                topology === 'series3'
                  ? 'bg-sky-500/20 border-sky-500/70 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              ⛓️ {t('experiments.circuits.series3')}
            </button>

            <button
              id="btn-topology-parallel2"
              onClick={() => setTopology('parallel2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                topology === 'parallel2'
                  ? 'bg-sky-500/20 border-sky-500/70 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              ♊ {t('experiments.circuits.parallel2')}
            </button>

            <button
              id="btn-topology-parallel3"
              onClick={() => setTopology('parallel3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                topology === 'parallel3'
                  ? 'bg-sky-500/20 border-sky-500/70 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🔀 {t('experiments.circuits.parallel3')}
            </button>

            <button
              id="btn-topology-mixed"
              onClick={() => setTopology('mixed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                topology === 'mixed'
                  ? 'bg-sky-500/20 border-sky-500/70 text-sky-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🧩 {t('experiments.circuits.mixed')}
            </button>

            <button
              id="btn-topology-lamp"
              onClick={() => setTopology('lampCircuit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                topology === 'lampCircuit'
                  ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              💡 {t('experiments.circuits.lampCircuit')}
            </button>
          </div>

          {/* Voltage Source Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap me-1">
              {t('experiments.circuits.voltagePresets')}:
            </span>
            <button
              onClick={() => handlePresetVoltage(1.5)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-purple-300 whitespace-nowrap shrink-0"
            >
              1.5V
            </button>
            <button
              onClick={() => handlePresetVoltage(9.0)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-purple-300 whitespace-nowrap shrink-0"
            >
              9V
            </button>
            <button
              onClick={() => handlePresetVoltage(12.0)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-purple-300 whitespace-nowrap shrink-0"
            >
              12V
            </button>
            <button
              onClick={() => handlePresetVoltage(24.0)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-purple-300 whitespace-nowrap shrink-0"
            >
              24V
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Stage: Interactive Schematic Stage & Digital Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Schematic Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-inner min-h-[410px]">
            
            {/* Top Toolbar: Multimeter Probe Selector */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 z-10 shadow-sm">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Gauge className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                  {t('experiments.circuits.multimeter')}:
                </span>
                
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setSelectedProbe('all')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                      selectedProbe === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('experiments.circuits.probeAll')}
                  </button>
                  <button
                    onClick={() => setSelectedProbe('r1')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                      selectedProbe === 'r1' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    R₁
                  </button>
                  {topology !== 'single' && (
                    <button
                      onClick={() => setSelectedProbe('r2')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                        selectedProbe === 'r2' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      R₂
                    </button>
                  )}
                  {(topology === 'series3' || topology === 'parallel3' || topology === 'mixed') && (
                    <button
                      onClick={() => setSelectedProbe('r3')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                        selectedProbe === 'r3' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      R₃
                    </button>
                  )}
                </div>
              </div>

              {/* Electron / Conventional Current Toggle */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setFlowType(flowType === 'electrons' ? 'conventional' : 'electrons')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 whitespace-nowrap"
                  title="Toggle Electron Flow vs Conventional Current"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{flowType === 'electrons' ? 'e⁻ Flow' : 'I (+ to -)'}</span>
                </button>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showCurrentFlow}
                    onChange={(e) => setShowCurrentFlow(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="whitespace-nowrap">{t('experiments.circuits.electronFlow')}</span>
                </label>
              </div>
            </div>

            {/* Interactive Schematic Canvas */}
            <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
              <canvas
                ref={canvasRef}
                width={650}
                height={350}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setIsHoveringSwitch(false)}
                className={`w-full h-auto max-h-[350px] rounded-xl bg-slate-950 border border-slate-900 shadow-inner ${
                  isHoveringSwitch ? 'cursor-pointer' : 'cursor-default'
                }`}
              />
            </div>

          </div>

          {/* Multimeter Digital Readout Cards (Live Probed Values) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Ammeter Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('experiments.circuits.ammeter')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">I</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-sky-400 font-mono mt-1 block">
                {probeReadouts.current.toFixed(3)} <span className="text-xs font-normal text-slate-400">A</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">I = V / R</span>
            </div>

            {/* Voltmeter Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('experiments.circuits.voltmeter')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">V</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-purple-400 font-mono mt-1 block">
                {probeReadouts.voltage.toFixed(2)} <span className="text-xs font-normal text-slate-400">V</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">V = I · R</span>
            </div>

            {/* Ohmmeter Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('experiments.circuits.ohmmeter')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">R</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1 block">
                {probeReadouts.resistance}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">R_eq</span>
            </div>

            {/* Wattmeter Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('experiments.circuits.wattmeter')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">P</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-1 block">
                {probeReadouts.power.toFixed(2)} <span className="text-xs font-normal text-slate-400">W</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">P = V · I</span>
            </div>

          </div>

        </div>

        {/* Right Side: Component Controls & Ohm's Law Studio (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Component Controls Panel */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
                {t('experiments.circuits.componentSettingsTitle')}
              </h3>
              <span className="text-[11px] font-mono text-slate-500">DC Linear</span>
            </div>

            {/* Battery Voltage Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">{t('experiments.circuits.voltage')}</span>
                <span className="text-purple-400 font-bold">{voltage.toFixed(1)} V</span>
              </div>
              <input
                id="slider-circuit-voltage"
                type="range"
                min="0.5"
                max="48.0"
                step="0.5"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Resistor 1 (R1) Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">{t('experiments.circuits.resistance1')}</span>
                <span className="text-sky-400 font-bold">{r1} Ω</span>
              </div>
              <input
                id="slider-circuit-r1"
                type="range"
                min="1"
                max="200"
                step="1"
                value={r1}
                onChange={(e) => setR1(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Resistor 2 (R2) Slider (if multi-resistor topology) */}
            {topology !== 'single' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-sans">{t('experiments.circuits.resistance2')}</span>
                  <span className="text-emerald-400 font-bold">{r2} Ω</span>
                </div>
                <input
                  id="slider-circuit-r2"
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  value={r2}
                  onChange={(e) => setR2(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Resistor 3 (R3) Slider (if 3-resistor series/parallel or mixed) */}
            {(topology === 'series3' || topology === 'parallel3' || topology === 'mixed') && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-sans">{t('experiments.circuits.resistance3')}</span>
                  <span className="text-amber-400 font-bold">{r3} Ω</span>
                </div>
                <input
                  id="slider-circuit-r3"
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  value={r3}
                  onChange={(e) => setR3(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Step-by-Step Live Ohm's Law Equations */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 space-y-2 shadow-inner">
              <div className="text-slate-400 text-[11px] font-sans flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  {t('experiments.circuits.liveCalculationsTitle')}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  isSwitchClosed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {isSwitchClosed ? 'CONDUCTING' : 'DISCONNECTED'}
                </span>
              </div>

              {isSwitchClosed ? (
                <div className="space-y-1.5 pt-1">
                  <div>
                    <span className="text-slate-400">R_eq = </span>
                    <span className="text-emerald-400 font-bold">{calculations.req.toFixed(2)} Ω</span>
                  </div>
                  <div>
                    <span className="text-slate-400">I = {voltage.toFixed(1)}V / {calculations.req.toFixed(2)}Ω = </span>
                    <span className="text-sky-400 font-bold">{calculations.totalCurrent.toFixed(3)} A</span>
                  </div>
                  <div>
                    <span className="text-slate-400">P = {voltage.toFixed(1)}V × {calculations.totalCurrent.toFixed(3)}A = </span>
                    <span className="text-amber-400 font-bold">{calculations.totalPower.toFixed(2)} W</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-rose-400 text-[11px] font-sans pt-1">
                  <p>{t('experiments.circuits.circuitOpenFormulaNote')}</p>
                </div>
              )}
            </div>

          </div>

          {/* Interactive Ohm's Law I-V Curve Graph */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                {t('experiments.circuits.ivGraphTitle')}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Slope = 1/Req = {(isSwitchClosed && calculations.req > 0 ? (1 / calculations.req).toFixed(4) : 0)} S
              </span>
            </div>

            <canvas
              ref={ivCanvasRef}
              width={340}
              height={140}
              className="w-full h-[140px] rounded-xl bg-slate-950 border border-slate-900"
            />
          </div>

          {/* Educational Note */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t('experiments.circuits.tip')}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
